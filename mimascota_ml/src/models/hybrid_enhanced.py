"""
Modelo Híbrido MEJORADO: Combina Content-Based Enhanced + Collaborative
Usa el nuevo modelo con NLP y feature weighting
Estrategia: 60% Content-Based Enhanced + 40% Collaborative
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'api'))

from models.content_based_enhanced import EnhancedDynamicRecommender
# from models.collaborative import CollaborativeRecommender # Se importa abajo para evitar circular en algunos casos, o mantener aca
from models.collaborative import CollaborativeRecommender
from services.ml_service import get_similar_synthetic_profile
from database import PetDatabase


class EnhancedHybridRecommender:
    """
    Sistema híbrido mejorado que combina:
    - Content-Based Enhanced (60%): Con NLP y feature weighting
    - Collaborative (40%): Basado en patrones de interacciones
    
    Características:
    - Consulta mascotas reales de PostgreSQL
    - NLP para descripciones
    - Feature weighting personalizado
    - Scores híbridos ponderados
    """
    
    def __init__(self, content_weight=0.7, collaborative_weight=0.3):
        """
        Args:
            content_weight: Peso del modelo content-based (default: 0.7)
            collaborative_weight: Peso del modelo collaborative (default: 0.3)
        """
        if abs((content_weight + collaborative_weight) - 1.0) > 0.001:
            raise ValueError("Weights must sum to 1.0")
        
        self.content_weight = content_weight
        self.collaborative_weight = collaborative_weight
        
        self.content_model = None
        self.collaborative_model = None
        self.db = PetDatabase()
        self.is_loaded = False
    
    def load_models(self, content_model_path, collaborative_model_path):
        """
        Carga ambos modelos pre-entrenados
        
        Args:
            content_model_path: Ruta al modelo content-based enhanced
            collaborative_model_path: Ruta al modelo collaborative
        """
        print("="*70)
        print("CARGANDO MODELOS DEL SISTEMA HÍBRIDO MEJORADO")
        print("="*70)
        
        # Cargar Content-Based Enhanced
        print("\n[1] Cargando Content-Based Enhanced (con NLP)...")
        self.content_model = EnhancedDynamicRecommender()
        self.content_model.load(content_model_path)
        print(f"   ✅ Content-Based Enhanced cargado")
        
        # Cargar Collaborative
        print("\n[2] Cargando Collaborative Filtering...")
        self.collaborative_model = CollaborativeRecommender()
        self.collaborative_model.load(collaborative_model_path)
        print(f"   ✅ Collaborative cargado")
        
        print("\n" + "="*70)
        print("CONFIGURACIÓN DEL HÍBRIDO")
        print("="*70)
        print(f"  Content-Based: {self.content_weight*100:.0f}%")
        print(f"  Collaborative: {self.collaborative_weight*100:.0f}%")
        print("="*70 + "\n")
        
        self.is_loaded = True
        return self
    
    def _normalize_scores(self, scores):
        """
        Normaliza scores a rango [0, 1]
        
        Args:
            scores: Array de scores
        
        Returns:
            Array normalizado [0, 1]
        """
        if len(scores) == 0:
            return scores
        
        scores = np.array(scores)
        min_score = scores.min()
        max_score = scores.max()
        
        if max_score - min_score == 0:
            return np.ones_like(scores) * 0.5
        
        return (scores - min_score) / (max_score - min_score)
    
    def recommend(self, user_profile, user_id, n_recommendations=10, use_db=True, pets_df=None):
        """
        Genera recomendaciones híbridas
        
        Args:
            user_profile: dict con preferencias del usuario
            user_id: ID del usuario (para collaborative)
            n_recommendations: número de recomendaciones
            use_db: Si True, consulta PostgreSQL; si False, usa pets_df
            pets_df: DataFrame opcional con mascotas
        
        Returns:
            numpy array con [pet_id, hybrid_score, content_score, collab_score]
        """
        if not self.is_loaded:
            raise ValueError("Modelos no cargados. Llama a load_models() primero")
        
        # Obtener mascotas disponibles
        if use_db:
            pets_df = self.db.get_available_pets()
            print(f"Consultando {len(pets_df)} mascotas de PostgreSQL...")
        else:
            if pets_df is None:
                raise ValueError("Debes proporcionar pets_df si use_db=False")
        
        if len(pets_df) == 0:
            print("⚠️ No hay mascotas disponibles")
            return np.array([])
        
        pet_candidates = pets_df['pet_id'].tolist()
        
        # 1. Obtener scores de Content-Based Enhanced
        print(f"[1/3] Generando scores Content-Based (peso {self.content_weight})...")
        try:
            content_recs = self.content_model.recommend(
                user_profile=user_profile,
                n_recommendations=len(pet_candidates),
                use_db=False,
                pets_df=pets_df
            )
            
            # Crear dict para lookup rápido
            content_scores = {
                int(pet_id): score 
                for pet_id, score in content_recs
            }
        except Exception as e:
            print(f"   ⚠️ Error en content-based: {e}")
            content_scores = {pet_id: 0.5 for pet_id in pet_candidates}
        
        # 2. Obtener scores de Collaborative
        print(f"[2/3] Generando scores Collaborative (peso {self.collaborative_weight})...")
        try:
            # Estrategia Cold Start:
            # Si el usuario es nuevo (no esta en mapping), buscar perfil sintetico similar
            latent_vector = None
            is_cold_start = False
            
            if self.collaborative_model.is_fitted and user_id not in self.collaborative_model.user_mapping:
                print(f"   ❄️ [ANÁLISIS DE PERFIL] Usuario nuevo detectado (ID: {user_id})")
                is_cold_start = True
                
                # Extraer preferencias del user_profile
                prefs = {
                    'especie': user_profile.get('preference_specie', 'Perro'),
                    'tamano': user_profile.get('preference_size', 'mediano'),
                    'energia': user_profile.get('preference_energy', 2)
                }
                print(f"   🔍 Buscando perfiles sintéticos similares en DB...")
                print(f"      Criterios: {prefs}")
                
                latent_vector = get_similar_synthetic_profile(prefs)
                
                if latent_vector is not None:
                     print(f"   ✨ [ÉXITO] Perfil sintético encontrado. Vector de dimensión {len(latent_vector)}")
                     print(f"      > Usando este 'cerebro prestado' para calcular afinidad colaborativa...")
                else:
                     print(f"   ⚠️ [INFO] No se encontraron perfiles similares. Usando fallback neutral.")

            collab_scores = {}
            for pid in pet_candidates:
                # Si tenemos vector latente, lo usamos. Si no, el modelo usa su logica interna (neutral)
                score = self.collaborative_model.predict_rating(user_id, pid, latent_vector=latent_vector)
                collab_scores[int(pid)] = score
                
        except Exception as e:
            print(f"   ⚠️ Error en collaborative: {e}")
            collab_scores = {pet_id: 2.5 for pet_id in pet_candidates}
        
        # 3. Combinar scores
        print(f"[3/3] Combinando scores híbridos...")
        print(f"  ✓ Usando pesos: Content={self.content_weight:.1f}, Collab={self.collaborative_weight:.1f}")
        print(f"\n  [DEBUG] Ejemplo de scores (primeras 3 mascotas):")
        for pid in list(pet_candidates)[:3]:
            cs = content_scores.get(pid, 0.5)
            cls = collab_scores.get(pid, 2.5)
            print(f"    Pet {pid}: Content={cs:.3f}, Collab={cls:.2f} (RAW)")
            
        print(f"\n  [DEBUG] Verificando valores en collab_scores dict:")
        print(f"    Primeros 3 valores: {list(collab_scores.items())[:3]}")
        
        # Normalizar scores de collaborative (ratings 1-5 → 0-1)
        # CORRECCIÓN: Ya no capamos > 4.5 a 0.5, porque ahora los scores altos pueden ser reales del Cold Start Sintético
        min_r = self.collaborative_model.min_rating
        max_r = self.collaborative_model.max_rating

        collab_scores_normalized = {
            pid: (score - min_r) / (max_r - min_r)
            for pid, score in collab_scores.items()
        }
        
        hybrid_scores = []
        
        for pet_id in pet_candidates:
            # Obtener scores (con defaults)
            content_score = content_scores.get(pet_id, 0.5)
            collab_score = collab_scores_normalized.get(pet_id, 0.5)
            
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
        
        # Convertir a array NumPy
        result = np.array([
            [
                item['pet_id'],
                item['hybrid_score'],
                item['content_score'],
                item['collab_score']
            ]
            for item in top_n
        ])
        
        print(f"   ✅ {len(result)} recomendaciones generadas")
        return result
    
    def explain_recommendation(self, pet_id, hybrid_result):
        """
        Explica una recomendación híbrida
        
        Args:
            pet_id: ID de la mascota
            hybrid_result: Array resultado de recommend()
        """
        # Buscar la mascota en el resultado
        pet_row = hybrid_result[hybrid_result[:, 0] == pet_id]
        
        if len(pet_row) == 0:
            print(f"Mascota {pet_id} no encontrada en resultados")
            return
        
        pet_row = pet_row[0]
        hybrid_score = pet_row[1]
        content_score = pet_row[2]
        collab_score = pet_row[3]
        
        print(f"\n{'='*70}")
        print(f"EXPLICACIÓN: Mascota ID {int(pet_id)}")
        print(f"{'='*70}")
        print(f"Score Híbrido Final: {hybrid_score:.3f} ({int(hybrid_score*100)}%)\n")
        
        print("Desglose:")
        print("-" * 70)
        content_contribution = content_score * self.content_weight
        collab_contribution = collab_score * self.collaborative_weight
        
        print(f"  Content-Based (NLP + Features):  {content_score:.3f} × {self.content_weight} = {content_contribution:.3f}")
        print(f"  Collaborative (Similaridad):     {collab_score:.3f} × {self.collaborative_weight} = {collab_contribution:.3f}")
        print("-" * 70)
        print(f"  TOTAL:                           {hybrid_score:.3f}")
        print("=" * 70 + "\n")
        print(self.collaborative_model.predict_rating(user_id, pet_id, latent_vector=latent_vector))
    
    def save(self, path):
        """Guarda configuración del híbrido (los modelos individuales ya están guardados)"""
        data = {
            'content_weight': self.content_weight,
            'collaborative_weight': self.collaborative_weight,
            'model_type': 'enhanced_hybrid'
        }
        
        joblib.dump(data, path)
        print(f"Configuración híbrida guardada en: {path}")
    
    def load(self, path):
        """Carga configuración del híbrido"""
        data = joblib.load(path)
        
        self.content_weight = data['content_weight']
        self.collaborative_weight = data['collaborative_weight']
        
        print(f"Configuración híbrida cargada desde: {path}")
        
        return self


if __name__ == "__main__":
    print("="*70)
    print("SISTEMA HÍBRIDO MEJORADO")
    print("="*70)
    print("\nEste sistema combina:")
    print("  • Content-Based Enhanced (NLP + Feature Weighting)")
    print("  • Collaborative Filtering (Patrones de usuarios)")
    print("  • Consulta mascotas reales de PostgreSQL")
    print("\nPara usar:")
    print("  1. Cargar modelos: hybrid.load_models(content_path, collab_path)")
    print("  2. Recomendar: hybrid.recommend(user_profile, user_id)")
    print("="*70)
    

