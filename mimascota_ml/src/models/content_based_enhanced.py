"""
Modelo Content-Based Dinámico MEJORADO
- Consulta mascotas de PostgreSQL en tiempo real
- NLP con TF-IDF para descripciones (ngrams 1-2)
- Feature weighting balanceado para catálogos pequeños
- KNN + Similitud de Coseno
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler, OrdinalEncoder
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import hstack, csr_matrix
import numpy as np
import pandas as pd
import joblib
import sys
from pathlib import Path

# Agregar src al path
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / 'api'))

from database import PetDatabase


class EnhancedDynamicRecommender:
    """
    Sistema de recomendación dinámico mejorado que:
    1. Consulta mascotas reales de PostgreSQL
    2. Usa NLP (TF-IDF) para procesar descripciones
    3. Aplica feature weighting personalizado
    4. NO almacena mascotas, solo los procesadores entrenados
    """
    
    def __init__(self, 
                 size_weight=1.5,      # AJUSTADO: 1.5 para catálogo pequeño
                 age_weight=1.0, 
                 text_weight=2.0,
                 energy_weight=1.5,
                 personality_weight=1.5):
        """
        Args:
            size_weight: Peso para tamaño (default: 1.5 - balanceado para catálogo pequeño)
            age_weight: Peso para edad (default: 1.0)
            text_weight: Peso para descripción (default: 2.0)
            energy_weight: Peso para nivel de energía (default: 1.5)
            personality_weight: Peso para personalidad (default: 1.5)
        """
        self.size_weight = size_weight
        self.age_weight = age_weight
        self.text_weight = text_weight
        self.energy_weight = energy_weight
        self.personality_weight = personality_weight
        
        # Procesadores (se entrenan y se guardan)
        self.tfidf = None
        self.scaler_age = None
        self.encoder_size = None
        self.encoder_energy = None
        
        # Database connection
        self.db = PetDatabase()
        
        self.is_fitted = False
    
    def fit(self, sample_pets_df):
        """
        Entrena los procesadores con datos de ejemplo
        NO guarda las mascotas, solo aprende a transformar
        
        Args:
            sample_pets_df: DataFrame con mascotas de ejemplo
                Debe tener: informacion_adicional, tamano, edad_meses, 
                           nivel_energia, personalidad
        """
        print("="*70)
        print("ENTRENANDO MODELO MEJORADO CON NLP Y FEATURE WEIGHTING")
        print("="*70)
        
        # 1. TF-IDF para descripciones
        print("\n[1] Entrenando TF-IDF para descripciones...")
        
        # Usar informacion_adicional si existe, sino usar nombre + especie
        if 'informacion_adicional' in sample_pets_df.columns:
            descriptions = sample_pets_df['informacion_adicional'].fillna('').astype(str)
        else:
            # Fallback: combinar campos disponibles
            descriptions = (
                sample_pets_df['nombre'].fillna('').astype(str) + ' ' +
                sample_pets_df['especie'].fillna('').astype(str) + ' ' +
                sample_pets_df.get('personalidad', pd.Series([''] * len(sample_pets_df))).fillna('').astype(str)
            )
        
        self.tfidf = TfidfVectorizer(
            max_features=50,           # 50 features más importantes
            stop_words=[
                'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 
                'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 
                'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 
                'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 
                'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 
                'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 
                'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'poco', 'ella', 'estar', 'estas', 
                'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 
                'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 
                'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 
                'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'es', 'son', 'fue', 'era', 
                'eran', 'ser', 'soy', 'eres', 'somos', 'sois', 'fui', 'fuiste', 'fue', 'fuimos', 
                'fuisteis', 'fueron', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 
                'estés', 'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos', 
                'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais', 'estarían', 
                'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 
                'estuvimos', 'estuvisteis', 'estuvieron', 'hubiera', 'hubieras', 'hubiéramos', 
                'hubierais', 'hubieran', 'hubiese', 'hubieses', 'hubiésemos', 'hubieseis', 'hubiesen', 
                'habiendo', 'habido', 'habida', 'habidos', 'habidas', 'tengo', 'tienes', 'tiene', 
                'tenemos', 'tenéis', 'tienen', 'tenga', 'tengas', 'tengamos', 'tengáis', 'tengan', 
                'tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán', 'tendría', 'tendrías', 
                'tendríamos', 'tendríais', 'tendrían', 'tenía', 'tenías', 'teníamos', 'teníais', 'tenían', 
                'tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'
            ],
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.8
        )
        self.tfidf.fit(descriptions)
        print(f"   OK - TF-IDF entrenado con max_features=50")
        
        # 2. Mapeo para tamaño (más simple y robusto)
        print(f"\n[2] Configurando mapeo para tamaño (peso {self.size_weight}x)...")
        self.size_map = {'pequeno': 0, 'mediano': 1, 'grande': 2}
        print(f"   OK - Mapeo: {self.size_map}")
        
        # 3. MinMaxScaler para edad
        print(f"\n[3] Entrenando scaler para edad (peso {self.age_weight}x)...")
        self.scaler_age = MinMaxScaler()
        self.scaler_age.fit(sample_pets_df[['edad_meses']])
        print(f"   OK - Scaler entrenado (rango: {sample_pets_df['edad_meses'].min()} - {sample_pets_df['edad_meses'].max()} meses)")
        
        # 4. Mapeo para energía
        print(f"\n[4] Configurando mapeo para energía (peso {self.energy_weight}x)...")
        self.energy_map = {'tranquilo': 0, 'moderado': 1, 'energetico': 2}
        print(f"   OK - Mapeo: {self.energy_map}")
        
        # Resumen
        print("\n" + "="*70)
        print("PONDERACIÓN DE CARACTERÍSTICAS")
        print("="*70)
        print(f"  Descripción:   {self.text_weight}x ")
        print(f"  Tamaño:        {self.size_weight}x")
        print(f"  Energía:       {self.energy_weight}x")
        print(f"  Personalidad:  {self.personality_weight}x")
        print(f"  Edad:          {self.age_weight}x")
        print("="*70 + "\n")
        
        self.is_fitted = True
    
    def _process_pets(self, pets_df):
        """
        Procesa mascotas a matriz de características con ponderación
        
        Args:
            pets_df: DataFrame con mascotas
        
        Returns:
            Matriz sparse de características ponderadas
        """
        if not self.is_fitted:
            raise ValueError("Modelo no entrenado. Llama a fit() primero")
        
        # 1. Texto (TF-IDF)
        if 'informacion_adicional' in pets_df.columns:
            descriptions = pets_df['informacion_adicional'].fillna('').astype(str)
        else:
            descriptions = (
                pets_df['nombre'].fillna('').astype(str) + ' ' +
                pets_df['especie'].fillna('').astype(str) + ' ' +
                pets_df.get('personalidad', pd.Series([''] * len(pets_df))).fillna('').astype(str)
            )
        
        text_features = self.tfidf.transform(descriptions) * self.text_weight
        
        # 2. Tamaño (mapping)
        size_normalized = pets_df['tamano'].str.lower().fillna('mediano')
        size_encoded = size_normalized.map(self.size_map).fillna(1).values.reshape(-1, 1)
        size_weighted = size_encoded * self.size_weight
        size_sparse = csr_matrix(size_weighted)
        
        # 3. Edad (escalada)
        age_scaled = self.scaler_age.transform(pets_df[['edad_meses']])
        age_weighted = age_scaled * self.age_weight
        age_sparse = csr_matrix(age_weighted)
        
        # 4. Energía (mapping)
        energy_normalized = pets_df['nivel_energia'].str.lower().fillna('moderado')
        energy_encoded = energy_normalized.map(self.energy_map).fillna(1).values.reshape(-1, 1)
        energy_weighted = energy_encoded * self.energy_weight
        energy_sparse = csr_matrix(energy_weighted)
        
        # 5. Personalidad (TF-IDF simple)
        personalities = pets_df['personalidad'].fillna('').astype(str)
        personality_tfidf = TfidfVectorizer(max_features=10, token_pattern=r'\b\w+\b')
        
        try:
            personality_features = personality_tfidf.fit_transform(personalities) * self.personality_weight
        except:
            # Si falla (muy pocas personalidades), usar vector vacío
            personality_features = csr_matrix((len(pets_df), 1))
        
        # Combinar todas las características
        feature_matrix = hstack([
            text_features,        # Texto con NLP
            size_sparse,          # Tamaño (3x)
            age_sparse,           # Edad
            energy_sparse,        # Energía
            personality_features  # Personalidad
        ])
        
        return feature_matrix
    
    def _process_user(self, user_profile):
        """
        Procesa perfil de usuario a vector de características
        
        Args:
            user_profile: dict con preferencias del usuario
        
        Returns:
            Array numpy con características ponderadas
        """
        # DEBUG: Mostrar perfil recibido
        print(f"\n  [DEBUG] Procesando perfil de usuario:")
        print(f"    - Tamaño: {user_profile.get('tamanoMascota', 'NO DEFINIDO')}")
        print(f"    - Edad: {user_profile.get('edadPreferida', 'NO DEFINIDO')}")
        print(f"    - Energía: {user_profile.get('nivelEnergia', 'NO DEFINIDO')}")
        print(f"    - Personalidad: {user_profile.get('personalidad', 'NO DEFINIDO')}")
        print(f"    - Especie: {user_profile.get('perroOGato', 'NO DEFINIDO')}")
        
        # Crear texto del usuario desde preferencias
        user_text_parts = []
        
        if 'perroOGato' in user_profile:
            user_text_parts.append(str(user_profile['perroOGato']))
        
        if 'personalidad' in user_profile:
            # FIX: personalidad puede venir como lista o string
            personalidad = user_profile['personalidad']
            if isinstance(personalidad, list):
                personalidad = ','.join(personalidad)  # Convertir lista a string
            user_text_parts.append(str(personalidad))
        
        user_text = ' '.join(user_text_parts) if user_text_parts else 'mascota'
        print(f"    - Texto para TF-IDF: '{user_text}'")
        
        # 1. Texto
        text_features = self.tfidf.transform([user_text]) * self.text_weight
        
        # 2. Tamaño
        user_size = user_profile.get('tamanoMascota', 'mediano').lower()
        size_value = self.size_map.get(user_size, 1)  # Default a mediano
        size_weighted = np.array([[size_value]]) * self.size_weight
        
        # 3. Edad (convertir preferencia a meses aproximados)
        edad_map = {
            'cachorro': 6,
            'joven': 18,
            'adulto': 48,
            'senior': 96
        }
        user_age_meses = edad_map.get(user_profile.get('edadPreferida', 'adulto'), 48)
        age_scaled = self.scaler_age.transform([[user_age_meses]])
        age_weighted = age_scaled * self.age_weight
        
        # 4. Energía
        user_energy = user_profile.get('nivelEnergia', 'moderado').lower()
        energy_value = self.energy_map.get(user_energy, 1)  # Default a moderado
        energy_weighted = np.array([[energy_value]]) * self.energy_weight
        
        # 5. Personalidad
        user_personality = user_profile.get('personalidad', '')
        # FIX: Convertir lista a string si es necesario
        if isinstance(user_personality, list):
            user_personality = ','.join(user_personality)
        
        personality_tfidf = TfidfVectorizer(max_features=10, token_pattern=r'\b\w+\b')
        
        try:
            # Necesitamos entrenar con al menos 2 documentos
            personality_features = personality_tfidf.fit_transform([user_personality, 'amigable']) * self.personality_weight
            personality_features = personality_features[0]  # Tomar solo el usuario
        except:
            personality_features = csr_matrix((1, 1))
        
        # Combinar (debe tener misma estructura que _process_pets)
        # Asegurar dimensiones compatibles
        text_array = text_features.toarray()[0]
        personality_array = personality_features.toarray()[0] if hasattr(personality_features, 'toarray') else np.zeros(10)
        
        user_vector = np.concatenate([
            text_array,
            size_weighted.flatten(),
            age_weighted.flatten(),
            energy_weighted.flatten(),
            personality_array
        ])
        
        print(f"    - Vector generado: dimensión {len(user_vector)}")
        print(f"    - Algunos valores: tamaño={size_weighted[0][0]:.2f}, edad={age_weighted[0][0]:.2f}, energía={energy_weighted[0][0]:.2f}")
        
        return user_vector
    
    def recommend(self, user_profile, n_recommendations=10, use_db=True, pets_df=None):
        """
        Genera recomendaciones dinámicas
        
        Args:
            user_profile: dict con preferencias del usuario
            n_recommendations: número de recomendaciones
            use_db: Si True, consulta PostgreSQL; si False, usa pets_df
            pets_df: DataFrame opcional con mascotas (si use_db=False)
        
        Returns:
            list of tuples: [(pet_id, similarity_score), ...]
        """
        if not self.is_fitted:
            raise ValueError("Modelo no entrenado. Llama a fit() primero")
        
        # Obtener mascotas
        if use_db:
            pets_df = self.db.get_available_pets()
            print(f"Consultando {len(pets_df)} mascotas disponibles de PostgreSQL...")
        else:
            if pets_df is None:
                raise ValueError("Debes proporcionar pets_df si use_db=False")
        
        if len(pets_df) == 0:
            print("⚠️ No hay mascotas disponibles")
            return []
        
        # Procesar mascotas y usuario
        pet_features = self._process_pets(pets_df)
        user_features = self._process_user(user_profile)
        
        # Asegurar dimensiones compatibles
        if pet_features.shape[1] != len(user_features):
            # Ajustar usuario si es necesario
            diff = pet_features.shape[1] - len(user_features)
            if diff > 0:
                user_features = np.concatenate([user_features, np.zeros(diff)])
            else:
                user_features = user_features[:pet_features.shape[1]]
        
        # Calcular similitud
        similarities = cosine_similarity([user_features], pet_features)[0]
        
        # Top-N
        n = min(n_recommendations, len(pets_df))
        top_indices = np.argsort(similarities)[::-1][:n]
        
        # Retornar resultados
        recommendations = [
            (int(pets_df.iloc[idx]['pet_id']), float(similarities[idx]))
            for idx in top_indices
        ]
        
        return recommendations
    
    def save(self, path):
        """Guarda los procesadores entrenados (NO las mascotas)"""
        if not self.is_fitted:
            raise ValueError("Modelo no entrenado")
        
        data = {
            'tfidf': self.tfidf,
            'scaler_age': self.scaler_age,
            'size_map': self.size_map,
            'energy_map': self.energy_map,
            'size_weight': self.size_weight,
            'age_weight': self.age_weight,
            'text_weight': self.text_weight,
            'energy_weight': self.energy_weight,
            'personality_weight': self.personality_weight,
            'model_type': 'enhanced_dynamic'
        }
        
        joblib.dump(data, path)
        print(f"Modelo guardado en: {path}")
        print("NOTA: Solo se guardaron los procesadores, NO las mascotas")
    
    def load(self, path):
        """Carga los procesadores previamente entrenados"""
        data = joblib.load(path)
        
        self.tfidf = data['tfidf']
        self.scaler_age = data['scaler_age']
        self.size_map = data['size_map']
        self.energy_map = data['energy_map']
        self.size_weight = data['size_weight']
        self.age_weight = data['age_weight']
        self.text_weight = data['text_weight']
        self.energy_weight = data['energy_weight']
        self.personality_weight = data['personality_weight']
        
        self.is_fitted = True
        
        print(f"Modelo cargado desde: {path}")
        
        return self


if __name__ == "__main__":
    print("="*70)
    print("MODELO DINÁMICO MEJORADO CON NLP Y FEATURE WEIGHTING")
    print("="*70)
    print("\nEste modelo:")
    print("  ✓ Consulta mascotas reales de PostgreSQL")
    print("  ✓ Usa NLP (TF-IDF) para descripciones")
    print("  ✓ Aplica feature weighting (tamaño 3x)")
    print("  ✓ NO almacena mascotas")
    print("\nPara usar:")
    print("  1. Entrenar con datos sintéticos: model.fit(sample_df)")
    print("  2. Recomendar con mascotas reales: model.recommend(user_profile)")
    print("="*70)
