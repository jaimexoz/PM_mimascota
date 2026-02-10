"""
Modelo Híbrido: Combina Content-Based y Collaborative Filtering
Estrategia: 60% Content-Based + 40% Collaborative
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from .content_based import ContentBasedRecommender
from .collaborative import CollaborativeRecommender


class HybridRecommender:
    """
    Sistema de recomendación híbrido que combina:
    - Content-Based (60%): Basado en similitud de características
    - Collaborative (40%): Basado en patrones de interacciones
    """
    
    def __init__(self, content_weight=0.6, collaborative_weight=0.4):
        """
        Args:
            content_weight: Peso del modelo content-based (default: 0.6)
            collaborative_weight: Peso del modelo collaborative (default: 0.4)
        """
        if abs((content_weight + collaborative_weight) - 1.0) > 0.001:
            raise ValueError("Weights must sum to 1.0")
        
        self.content_weight = content_weight
        self.collaborative_weight = collaborative_weight
        
        self.content_model = None
        self.collaborative_model = None
        self.is_loaded = False
    
    def load_models(self, content_model_path, collaborative_model_path):
        """
        Carga ambos modelos pre-entrenados
        """
        print("📦 Cargando modelos...")
        
        # Cargar Content-Based
        self.content_model = ContentBasedRecommender()
        self.content_model.load(content_model_path)
        print(f"   ✅ Content-Based cargado")
        
        # Cargar Collaborative
        self.collaborative_model = CollaborativeRecommender()
        self.collaborative_model.load(collaborative_model_path)
        print(f"   ✅ Collaborative cargado")
        
        self.is_loaded = True
        return self
    
    def _normalize_scores(self, scores):
        """
        Normaliza scores a rango [0, 1]
        """
        if len(scores) == 0:
            return scores
        
        scores = np.array(scores)
        min_score = scores.min()
        max_score = scores.max()
        
        if max_score - min_score == 0:
            return np.ones_like(scores) * 0.5
        
        return (scores - min_score) / (max_score - min_score)
    
    def recommend(self, user_profile, user_id, pet_candidates, n_recommendations=10):
        """
        Genera recomendaciones híbridas
        
        Args:
            user_profile: dict con perfil del usuario (para content-based)
            user_id: ID del usuario (para collaborative)
            pet_candidates: lista de IDs de mascotas candidatas
            n_recommendations: número de recomendaciones
        
        Returns:
            numpy array con (pet_id, hybrid_score, content_score, collab_score)
        """
        if not self.is_loaded:
            raise ValueError("Models must be loaded first")
        
        # 1. Obtener scores de Content-Based
        content_recs = self.content_model.recommend(
            user_profile, 
            n_recommendations=len(pet_candidates)
        )
        
        # Crear dict para lookup rápido
        content_scores = {
            int(pet_id): score 
            for pet_id, score in content_recs
        }
        
        # 2. Obtener scores de Collaborative
        collab_recs = self.collaborative_model.recommend(
            user_id,
            pet_candidates,
            n_recommendations=len(pet_candidates)
        )
        
        collab_scores = {
            int(pet_id): score 
            for pet_id, score in collab_recs
        }
        
        # 3. Combinar scores
        hybrid_scores = []
        
        for pet_id in pet_candidates:
            # Obtener score de cada modelo (default 0.5 si no existe)
            content_score = content_scores.get(pet_id, 0.5)
            collab_score = collab_scores.get(pet_id, 2.5) / 5.0  # Normalizar rating [1-5] a [0-1]
            
            # Calcular score híbrido
            hybrid_score = (
                self.content_weight * content_score +
                self.collaborative_weight * collab_score
            )
            
            hybrid_scores.append({
                'pet_id': pet_id,
                'hybrid_score': hybrid_score,
                'content_score': content_score,
                'collab_score': collab_score
            })
        
        # 4. Ordenar por score híbrido
        hybrid_scores.sort(key=lambda x: x['hybrid_score'], reverse=True)
        
        # 5. Tomar top-N
        top_n = hybrid_scores[:n_recommendations]
        
        # Convertir a array
        result = np.array([
            [
                item['pet_id'],
                item['hybrid_score'],
                item['content_score'],
                item['collab_score']
            ]
            for item in top_n
        ])
        
        return result
    
    def recommend_for_new_user(self, user_profile, pet_candidates, n_recommendations=10):
        """
        Recomendaciones para usuarios nuevos (sin historial)
        Usa solo Content-Based
        """
        if not self.is_loaded:
            raise ValueError("Models must be loaded first")
        
        print("ℹ️  Usuario nuevo - usando solo Content-Based")
        
        recs = self.content_model.recommend(user_profile, n_recommendations)
        
        # Formato consistente con recommend()
        result = np.array([
            [pet_id, score, score, 0.0]  # collab_score = 0 para nuevos usuarios
            for pet_id, score in recs
        ])
        
        return result
    
    def save(self, path):
        """Guarda configuración del modelo híbrido"""
        if not self.is_loaded:
            raise ValueError("Cannot save before loading models")
        
        joblib.dump({
            'content_weight': self.content_weight,
            'collaborative_weight': self.collaborative_weight
        }, path)
        print(f"✅ Configuración híbrida guardada en: {path}")
    
    def load(self, path, content_model_path, collaborative_model_path):
        """Carga configuración y modelos"""
        config = joblib.load(path)
        self.content_weight = config['content_weight']
        self.collaborative_weight = config['collaborative_weight']
        
        self.load_models(content_model_path, collaborative_model_path)
        
        print(f"✅ Modelo híbrido cargado: {self.content_weight:.0%} Content + {self.collaborative_weight:.0%} Collaborative")
        return self


def main():
    """Prueba el modelo híbrido"""
    print("🎯 PRUEBA DEL MODELO HÍBRIDO")
    print("=" * 70)
    
    # Rutas
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    
    # 1. Cargar modelos
    print("\n1️⃣ Cargando modelos pre-entrenados...")
    hybrid = HybridRecommender(content_weight=0.6, collaborative_weight=0.4)
    
    content_path = MODELS_DIR / 'content_based_model.pkl'
    collab_path = MODELS_DIR / 'collaborative_model.pkl'
    
    if not content_path.exists():
        print(f"❌ Error: {content_path} no encontrado")
        print("   Ejecuta primero: python src/models/content_based.py")
        return
    
    if not collab_path.exists():
        print(f"❌ Error: {collab_path} no encontrado")
        print("   Ejecuta primero: python src/models/collaborative.py")
        return
    
    hybrid.load_models(content_path, collab_path)
    
    # 2. Cargar datos de prueba
    print("\n2️⃣ Cargando datos de prueba...")
    users_df = pd.read_csv(DATA_DIR / 'users.csv')
    pets_df = pd.read_csv(DATA_DIR / 'pets.csv')
    interactions_df = pd.read_csv(DATA_DIR / 'interactions.csv')
    
    # 3. Probar recomendación híbrida
    print("\n3️⃣ Generando recomendaciones híbridas...")
    
    test_user = users_df.iloc[0]
    test_user_id = test_user['user_id']
    
    # Obtener mascotas candidatas (todas)
    all_pet_ids = pets_df['pet_id'].tolist()
    
    print(f"\n   👤 Usuario de prueba (ID: {test_user_id}):")
    print(f"      - Especie preferida: {test_user['perroOGato']}")
    print(f"      - Nivel de energía: {test_user['nivelEnergia']}")
    
    # Generar recomendaciones
    recommendations = hybrid.recommend(
        user_profile=test_user.to_dict(),
        user_id=test_user_id,
        pet_candidates=all_pet_ids,
        n_recommendations=5
    )
    
    print(f"\n   🐾 Top 5 Recomendaciones Híbridas:")
    print(f"      (60% Content-Based + 40% Collaborative)")
    print()
    
    for i, (pet_id, hybrid_score, content_score, collab_score) in enumerate(recommendations, 1):
        pet = pets_df[pets_df['pet_id'] == pet_id].iloc[0]
        print(f"      {i}. Pet ID {int(pet_id):3d} | "
              f"Hybrid: {hybrid_score:.3f} | "
              f"Content: {content_score:.3f} | "
              f"Collab: {collab_score:.3f}")
        print(f"         {pet['especie']:5s} | "
              f"Tamaño: {pet['tamano']:10s} | "
              f"Energía: {pet['nivel_energia']}")
    
    # 4. Guardar configuración
    print("\n4️⃣ Guardando configuración...")
    hybrid_config_path = MODELS_DIR / 'hybrid_config.pkl'
    hybrid.save(hybrid_config_path)
    
    print("\n" + "=" * 70)
    print("✅ MODELO HÍBRIDO FUNCIONANDO CORRECTAMENTE")
    print("=" * 70)
    print(f"\n📊 Configuración:")
    print(f"   - Content-Based: {hybrid.content_weight:.0%}")
    print(f"   - Collaborative: {hybrid.collaborative_weight:.0%}")
    print(f"\n📁 Archivos guardados:")
    print(f"   - {hybrid_config_path}")
    
    return hybrid


if __name__ == "__main__":
    hybrid = main()
