"""
Modelo Content-Based: KNN + Similitud de Coseno
Recomienda mascotas basándose en similitud de características
"""

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity
import joblib
from pathlib import Path
import sys

# Agregar src al path
sys.path.append(str(Path(__file__).parent.parent))
from preprocessing import FeatureEngineer


class ContentBasedRecommender:
    """
    Sistema de recomendación basado en contenido usando KNN y similitud de coseno
    """
    
    def __init__(self, n_neighbors=10):
        self.n_neighbors = n_neighbors
        self.knn_model = NearestNeighbors(
            n_neighbors=n_neighbors,
            metric='cosine',
            algorithm='brute'
        )
        self.fe = FeatureEngineer()
        self.pet_features = None
        self.pet_ids = None
        self.is_fitted = False
    
    def fit(self, pets_df):
        """
        Entrena el modelo con el catálogo de mascotas
        
        Args:
            pets_df: DataFrame con información de mascotas
        """
        print(f"🎓 Entrenando modelo Content-Based con {len(pets_df)} mascotas...")
        
        # Transformar mascotas a features
        self.pet_features = self.fe.transform_pets(pets_df)
        self.pet_ids = pets_df['pet_id'].values
        
        # Normalizar features
        self.fe.fit(self.pet_features)
        pet_features_norm = self.fe.transform(self.pet_features)
        
        # Entrenar KNN
        self.knn_model.fit(pet_features_norm)
        
        self.is_fitted = True
        print(f"✅ Modelo entrenado con {len(pets_df)} mascotas")
        return self
    
    def recommend(self, user_profile, n_recommendations=10):
        """
        Genera recomendaciones para un usuario
        
        Args:
            user_profile: dict o DataFrame con perfil de usuario
            n_recommendations: número de recomendaciones a devolver
            
        Returns:
            numpy array con IDs de mascotas recomendadas y scores
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting")
        
        # Convertir user_profile a DataFrame si es dict
        if isinstance(user_profile, dict):
            user_df = pd.DataFrame([user_profile])
        else:
            user_df = user_profile
        
        # Transformar usuario a features
        user_features = self.fe.transform_users(user_df)
        user_features_norm = self.fe.transform(user_features)
        
        # Calcular similitud con todas las mascotas
        similarities = cosine_similarity(user_features_norm, 
                                        self.fe.transform(self.pet_features))
        
        # Obtener top-N
        top_indices = similarities[0].argsort()[::-1][:n_recommendations]
        top_scores = similarities[0][top_indices]
        top_pet_ids = self.pet_ids[top_indices]
        
        # Retornar como array de tuplas (pet_id, score)
        recommendations = np.column_stack([top_pet_ids, top_scores])
        
        return recommendations
    
    def recommend_batch(self, users_df, n_recommendations=10):
        """
        Genera recomendaciones para múltiples usuarios
        
        Returns:
            dict: {user_id: [(pet_id, score), ...]}
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting")
        
        results = {}
        
        for idx, user in users_df.iterrows():
            user_id = user['user_id']
            recommendations = self.recommend(user.to_dict(), n_recommendations)
            results[user_id] = recommendations
        
        return results
    
    def save(self, path):
        """Guarda el modelo entrenado"""
        if not self.is_fitted:
            raise ValueError("Cannot save unfitted model")
        
        joblib.dump({
            'knn_model': self.knn_model,
            'fe': self.fe,
            'pet_features': self.pet_features,
            'pet_ids': self.pet_ids,
            'n_neighbors': self.n_neighbors
        }, path)
        print(f"✅ Modelo guardado en: {path}")
    
    def load(self, path):
        """Carga un modelo previamente entrenado"""
        data = joblib.load(path)
        self.knn_model = data['knn_model']
        self.fe = data['fe']
        self.pet_features = data['pet_features']
        self.pet_ids = data['pet_ids']
        self.n_neighbors = data['n_neighbors']
        self.is_fitted = True
        print(f"✅ Modelo cargado desde: {path}")
        return self


def main():
    """Entrena y guarda el modelo Content-Based"""
    print("🎯 ENTRENAMIENTO DEL MODELO CONTENT-BASED")
    print("=" * 70)
    
    # Rutas
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    MODELS_DIR.mkdir(exist_ok=True)
    
    # 1. Cargar datos
    print("\n1️⃣ Cargando datos...")
    pets_df = pd.read_csv(DATA_DIR / 'pets.csv')
    users_df = pd.read_csv(DATA_DIR / 'users.csv')
    
    print(f"   ✅ {len(pets_df)} mascotas")
    print(f"   ✅ {len(users_df)} usuarios")
    
    # 2. Entrenar modelo
    print("\n2️⃣ Entrenando modelo Content-Based...")
    model = ContentBasedRecommender(n_neighbors=20)
    model.fit(pets_df)
    
    # 3. Prueba de recomendación
    print("\n3️⃣ Probando recomendaciones...")
    test_user = users_df.iloc[0]
    recommendations = model.recommend(test_user.to_dict(), n_recommendations=5)
    
    print(f"\n   👤 Usuario de prueba (ID: {test_user['user_id']}):")
    print(f"      - Especie preferida: {test_user['perroOGato']}")
    print(f"      - Tamaño preferido: {test_user['tamanoMascota']}")
    print(f"      - Nivel de energía: {test_user['nivelEnergia']}")
    
    print(f"\n   🐾 Top 5 Recomendaciones:")
    for i, (pet_id, score) in enumerate(recommendations, 1):
        pet = pets_df[pets_df['pet_id'] == pet_id].iloc[0]
        print(f"      {i}. Pet ID {int(pet_id):3d} | "
              f"Score: {score:.3f} | "
              f"{pet['especie']:5s} | "
              f"Tamaño: {pet['tamano']:10s} | "
              f"Energía: {pet['nivel_energia']}")
    
    # 4. Guardar modelo
    print("\n4️⃣ Guardando modelo...")
    model_path = MODELS_DIR / 'content_based_model.pkl'
    model.save(model_path)
    
    print("\n" + "=" * 70)
    print("✅ MODELO CONTENT-BASED ENTRENADO Y GUARDADO EXITOSAMENTE")
    print("=" * 70)
    print(f"\n📁 Modelo guardado en: {model_path}")
    print(f"📊 Listo para generar recomendaciones")
    
    return model


if __name__ == "__main__":
    model = main()
