"""
API Flask MEJORADA para servir recomendaciones ML
Usa EnhancedHybridRecommender con NLP y pesos balanceados
Consulta mascotas de PostgreSQL en tiempo real
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from pathlib import Path
import traceback

# Agregar paths
sys.path.append(str(Path(__file__).parent.parent / 'src'))
sys.path.append(str(Path(__file__).parent))

from models.hybrid_enhanced import EnhancedHybridRecommender
from database import PetDatabase
import pandas as pd

app = Flask(__name__)
CORS(app)  # Permitir requests desde Node.js

# Variables globales
hybrid_model = None
db = None

# Rutas
MODELS_DIR = Path(__file__).parent.parent / 'models'


def load_models():
    """Carga el modelo híbrido mejorado y conexión a BD"""
    global hybrid_model, db
    
    print("="*70)
    print("INICIANDO SERVIDOR ML API MEJORADA")
    print("="*70)
    
    try:
        # 1. Conectar a BD
        print("\n[1] Conectando a PostgreSQL...")
        db = PetDatabase()
        success, message = db.test_connection()
        
        if not success:
            print(f"   ERROR: {message}")
            return False
        
        print(f"   {message}")
        
        # 2. Cargar modelo híbrido mejorado
        print("\n[2] Cargando Hybrid Enhanced (NLP + pesos balanceados)...")
        hybrid_model = EnhancedHybridRecommender(
            content_weight=0.7,    # 70% content-based enhanced
            collaborative_weight=0.3  # 30% collaborative
        )
        
        content_path = MODELS_DIR / 'content_based_enhanced.pkl'
        collab_path = MODELS_DIR / 'collaborative_model.pkl'
        
        if not content_path.exists():
            print(f"   ERROR: {content_path} no encontrado")
            print("   Ejecuta primero: python src/models/train_enhanced.py")
            return False
        
        if not collab_path.exists():
            print(f"   ERROR: {collab_path} no encontrado")
            print("   Ejecuta primero: python src/models/train_collaborative.py")
            return False
        
        hybrid_model.load_models(content_path, collab_path)
        
        print("   OK - Content-Based Enhanced cargado (NLP + size=1.5x)")
        print("   OK - Collaborative cargado")
        print("   OK - Hybrid Enhanced inicializado (70/30)")
        
        print("\n" + "="*70)
        print("SERVIDOR LISTO - MODELO MEJORADO ACTIVO")
        print("="*70)
        print("\nCaracterísticas:")
        print("  ✓ NLP con TF-IDF (ngrams 1-2)")
        print("  ✓ Pesos balanceados: texto 2x, tamaño 1.5x")
        print("  ✓ Híbrido: 70% content + 30% collaborative")
        print("  ✓ Consulta PostgreSQL en tiempo real")
        print("  ✓ Scores detallados (hybrid, content, collab)")
        
        return True
    
    except Exception as e:
        print(f"\nERROR: {e}")
        traceback.print_exc()
        return False


@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    Returns: {"status": "healthy", "model": "hybrid_enhanced", "available_pets": N}
    """
    try:
        if db:
            success, message = db.test_connection()
            num_pets = int(message.split()[2]) if success else 0
        else:
            num_pets = 0
        
        return jsonify({
            "status": "healthy",
            "model": "hybrid_enhanced",
            "model_version": "2.0_nlp_balanced",
            "models_loaded": hybrid_model is not None,
            "db_connected": db is not None,
            "available_pets": num_pets,
            "features": {
                "nlp": True,
                "balanced_weights": True,
                "real_time_db": True,
                "hybrid_scores": True
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/ml/recommend', methods=['POST'])
def recommend():
    """
    Genera recomendaciones usando Hybrid Enhanced
    Consulta mascotas reales de PostgreSQL en tiempo real
    
    Request body:
    {
        "user_profile": {
            "horasEnCasa": "mas_8",
            "nivelActividad": "moderado",
            "perroOGato": "ambos",
            "tamanoMascota": "mediano",
            "nivelEnergia": "tranquilo",
            "personalidad": "tranquilo,carinoso",
            ...
        },
        "user_id": 123 (opcional),
        "n_recommendations": 10 (opcional)
    }
    
    Response:
    {
        "status": "success",
        "model": "hybrid_enhanced",
        "count": 5,
        "total_available": 54,
        "recommendations": [
            {
                "pet_id": 123,
                "hybrid_score": 0.85,
                "content_score": 0.78,
                "collab_score": 0.92,
                "match_percentage": 85,
                "pet_details": {...}
            }
        ]
    }
    """
    try:
        # Validar modelos cargados
        if hybrid_model is None or db is None:
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
        
        # Log request
        print(f"\n[REQUEST] Usuario {user_id or 'nuevo'} - {n_recommendations} recomendaciones")
        
        # Generar recomendaciones con Hybrid Enhanced
        # use_db=True consulta PostgreSQL en tiempo real
        recommendations_array = hybrid_model.recommend(
            user_profile=user_profile,
            user_id=user_id,
            n_recommendations=n_recommendations,
            use_db=True  # Consultar PostgreSQL
        )
        
        print(f"[REQUEST] OK - {len(recommendations_array)} recomendaciones generadas")
        
        print(f"\nRESPUESTA EXITOSA (200 OK)")
        print("Recomendaciones recibidas:")
        
        # Consultar mascotas para enriquecer
        pets_df = db.get_available_pets()
        
        # Enriquecer con detalles de mascotas
        results = []
        for row in recommendations_array:
            pet_id = int(row[0])
            hybrid_score = float(row[1])
            content_score = float(row[2])
            collab_score = float(row[3])
            
            # Verificar si es Cold Start (para loguear)
            is_cold_start_str = "❄️ COLD START" if collab_score == 0.5 and hybrid_score > 0.6 else " "
            if hybrid_score == 0.5: is_cold_start_str = "⚠️ FALLBACK"
            
            print(f" - Pet {pet_id}: Hybrid={hybrid_score:.3f} | Content={content_score:.3f} | Collab={collab_score:.3f}")
            
            pet = pets_df[pets_df['pet_id'] == pet_id]
            
            if len(pet) > 0:
                pet = pet.iloc[0]
                results.append({
                    "pet_id": pet_id,
                    "hybrid_score": hybrid_score,
                    "content_score": content_score,
                    "collab_score": collab_score,
                    "match_percentage": int(hybrid_score * 100),
                    "is_cold_start": True if "COLD START" in is_cold_start_str else False,
                    "pet_details": {
                        "nombre": pet['nombre'],
                        "especie": pet['especie'],
                        "tamano": pet['tamano'],
                        "edad_meses": int(pet['edad_meses']),
                        "nivel_energia": pet['nivel_energia'],
                        "personalidad": pet['personalidad'],
                        "informacion_adicional": pet.get('informacion_adicional', '')
                    }
                })
        
        print(f"[REQUEST] Retornando {len(results)} recomendaciones enriquecidas\n")
        
        return jsonify({
            "status": "success",
            "model": "hybrid_enhanced",
            "count": len(results),
            "total_available": len(pets_df),
            "recommendations": results
        })
    
    except Exception as e:
        print(f"[ERROR] {e}")
        traceback.print_exc()
        
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/ml/explain/<int:pet_id>', methods=['POST'])
def explain_recommendation(pet_id):
    """
    Explica por qué se recomendó una mascota específica
    
    Request body:
    {
        "user_profile": {...}
    }
    
    Response:
    {
        "status": "success",
        "pet_id": 123,
        "explanation": {
            "hybrid_score": 0.85,
            "content_score": 0.78,
            "collab_score": 0.92,
            "content_weight": 0.6,
            "collab_weight": 0.4,
            "breakdown": "..."
        }
    }
    """
    try:
        if hybrid_model is None:
            return jsonify({
                "status": "error",
                "message": "Model not loaded"
            }), 500
        
        data = request.get_json()
        user_profile = data.get('user_profile', {})
        
        # Generar explicación
        explanation = hybrid_model.explain_recommendation(
            pet_id=pet_id,
            user_profile=user_profile
        )
        
        return jsonify({
            "status": "success",
            "pet_id": pet_id,
            "explanation": explanation
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route('/api/ml/pets/available', methods=['GET'])
def get_available_pets():
    """
    Retorna todas las mascotas disponibles
    Útil para debugging
    """
    try:
        if db is None:
            return jsonify({"status": "error", "message": "Database not connected"}), 500
        
        pets_df = db.get_available_pets()
        
        pets_list = pets_df.to_dict(orient='records')
        
        return jsonify({
            "status": "success",
            "count": len(pets_list),
            "pets": pets_list
        })
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/ml/model/info', methods=['GET'])
def model_info():
    """
    Retorna información sobre el modelo cargado
    """
    try:
        if hybrid_model is None:
            return jsonify({
                "status": "error",
                "message": "Model not loaded"
            }), 500
        
        return jsonify({
            "status": "success",
            "model": {
                "name": "EnhancedHybridRecommender",
                "version": "2.0",
                "components": {
                    "content_based": {
                        "type": "EnhancedDynamicRecommender",
                        "features": {
                            "nlp": "TF-IDF (ngrams 1-2, min_df=1)",
                            "weights": {
                                "text": 2.0,
                                "size": 1.5,
                                "energy": 1.5,
                                "personality": 1.5,
                                "age": 1.0
                            }
                        },
                        "weight": hybrid_model.content_weight
                    },
                    "collaborative": {
                        "type": "CollaborativeRecommender",
                        "algorithm": "SVD",
                        "weight": hybrid_model.collaborative_weight
                    }
                },
                "data_source": "PostgreSQL (real-time)",
                "optimized_for": "small catalogs"
            }
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


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
    # Cargar modelos
    if not load_models():
        print("\nERROR - No se pudieron cargar los modelos. Abortando.")
        print("\nVerifica:")
        print("  1. python src/models/train_enhanced.py (para content_based_enhanced.pkl)")
        print("  2. python src/models/train_collaborative.py (para collaborative_model.pkl)")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("ENDPOINTS DISPONIBLES")
    print("="*70)
    print("   - GET  http://localhost:5001/api/ml/health")
    print("   - POST http://localhost:5001/api/ml/recommend")
    print("   - POST http://localhost:5001/api/ml/explain/<pet_id>")
    print("   - GET  http://localhost:5001/api/ml/pets/available")
    print("   - GET  http://localhost:5001/api/ml/model/info")
    print("\nNode.js backend debe hacer requests a: http://localhost:5001")
    print("\nPresiona Ctrl+C para detener el servidor")
    print("="*70 + "\n")
    
    # Iniciar servidor Flask
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False
    )
