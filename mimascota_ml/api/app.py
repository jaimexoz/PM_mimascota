"""
API Flask para servir recomendaciones ML
Endpoints:
  - POST /api/ml/recommend - Generar recomendaciones
  - GET /api/ml/health - Health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from pathlib import Path
import traceback

# Agregar src al path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from models.hybrid import HybridRecommender
import pandas as pd

app = Flask(__name__)
CORS(app)  # Permitir requests desde Node.js

# Variables globales
hybrid_model = None
pets_df = None
users_df = None

# Rutas de modelos
MODELS_DIR = Path(__file__).parent.parent / 'models'
DATA_DIR = Path(__file__).parent.parent / 'data' / 'raw'


def load_models():
    """Carga los modelos ML al iniciar el servidor"""
    global hybrid_model, pets_df, users_df
    
    print("🚀 Cargando modelos ML...")
    
    try:
        # Cargar modelo híbrido
        hybrid_model = HybridRecommender(content_weight=0.6, collaborative_weight=0.4)
        
        content_path = MODELS_DIR / 'content_based_model.pkl'
        collab_path = MODELS_DIR / 'collaborative_model.pkl'
        
        hybrid_model.load_models(content_path, collab_path)
        
        # Cargar datos de mascotas (para enriquecer respuestas)
        pets_df = pd.read_csv(DATA_DIR / 'pets.csv')
        users_df = pd.read_csv(DATA_DIR / 'users.csv')
        
        print(f"✅ Modelos cargados exitosamente")
        print(f"✅ {len(pets_df)} mascotas en catálogo")
        
        return True
    
    except Exception as e:
        print(f"❌ Error cargando modelos: {e}")
        traceback.print_exc()
        return False


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Returns: {"status": "healthy", "models_loaded": true/false}
    """
    return jsonify({
        "status": "healthy",
        "models_loaded": hybrid_model is not None,
        "num_pets": len(pets_df) if pets_df is not None else 0
    })


@app.route('/api/ml/recommend', methods=['POST'])
def recommend():
    """
    Genera recomendaciones para un usuario
    
    Request body:
    {
        "user_id": int (opcional, para usar collaborative),
        "user_profile": {
            "horasEnCasa": "mas_8",
            "nivelActividad": "moderado",
            ...
        },
        "n_recommendations": int (default: 10),
        "candidate_pet_ids": [1, 2, 3, ...] (opcional)
    }
    
    Response:
    {
        "status": "success",
        "recommendations": [
            {
                "pet_id": 113,
                "hybrid_score": 0.623,
                "content_score": 0.599,
                "collab_score": 0.660,
                "pet_details": {...}
            },
            ...
        ]
    }
    """
    try:
        # Validar que los modelos estén cargados
        if hybrid_model is None:
            return jsonify({
                "status": "error",
                "message": "Models not loaded"
            }), 500
        
        # Parsear request
        data = request.get_json()
        
        if not data or 'user_profile' not in data:
            return jsonify({
                "status": "error",
                "message": "Missing user_profile in request body"
            }), 400
        
        user_profile = data['user_profile']
        user_id = data.get('user_id', None)
        n_recommendations = data.get('n_recommendations', 10)
        candidate_pet_ids = data.get('candidate_pet_ids', None)
        
        # Si no se especifican candidatos, usar todos
        if candidate_pet_ids is None:
            candidate_pet_ids = pets_df['pet_id'].tolist()
        
        # Generar recomendaciones
        if user_id is None:
            # Usuario nuevo - solo content-based
            recommendations = hybrid_model.recommend_for_new_user(
                user_profile=user_profile,
                pet_candidates=candidate_pet_ids,
                n_recommendations=n_recommendations
            )
        else:
            # Usuario existente - híbrido
            recommendations = hybrid_model.recommend(
                user_profile=user_profile,
                user_id=user_id,
                pet_candidates=candidate_pet_ids,
                n_recommendations=n_recommendations
            )
        
        # Enriquecer con detalles de mascotas
        results = []
        for pet_id, hybrid_score, content_score, collab_score in recommendations:
            pet_id = int(pet_id)
            
            # Buscar detalles de la mascota
            pet = pets_df[pets_df['pet_id'] == pet_id]
            
            if len(pet) > 0:
                pet = pet.iloc[0]
                
                results.append({
                    "pet_id": pet_id,
                    "hybrid_score": float(hybrid_score),
                    "content_score": float(content_score),
                    "collab_score": float(collab_score),
                    "match_percentage": int(hybrid_score * 100),
                    "pet_details": {
                        "especie": pet['especie'],
                        "tamano": pet['tamano'],
                        "edad_meses": int(pet['edad_meses']),
                        "nivel_energia": pet['nivel_energia'],
                        "personalidad": pet['personalidad']
                    }
                })
        
        return jsonify({
            "status": "success",
            "count": len(results),
            "recommendations": results
        })
    
    except Exception as e:
        print(f"❌ Error en /recommend: {e}")
        traceback.print_exc()
        
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/ml/retrain', methods=['POST'])
def retrain():
    """
    Endpoint para reentrenar modelos (futuro)
    Por ahora retorna not implemented
    """
    return jsonify({
        "status": "not_implemented",
        "message": "Retraining endpoint coming soon"
    }), 501


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500


if __name__ == '__main__':
    print("=" * 70)
    print("🚀 INICIANDO SERVIDOR ML API")
    print("=" * 70)
    
    # Cargar modelos
    if not load_models():
        print("❌ No se pudieron cargar los modelos. Abortando.")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("✅ Servidor listo para recibir requests")
    print("=" * 70)
    print("\n📍 Endpoints disponibles:")
    print("   - GET  http://localhost:5001/api/ml/health")
    print("   - POST http://localhost:5001/api/ml/recommend")
    print("\n🔗 Node.js backend debe hacer requests a: http://localhost:5001")
    print("\n⏸️  Presiona Ctrl+C para detener el servidor\n")
    
    # Iniciar servidor Flask
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False  # True solo en desarrollo
    )
