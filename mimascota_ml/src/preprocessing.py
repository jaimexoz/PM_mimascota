"""
Módulo de preprocesamiento y feature engineering
Transforma datos crudos del cuestionario en vectores numéricos para ML
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path


class FeatureEngineer:
    """
    Transforma características crudas del cuestionario en vectores numéricos
    optimizados para modelos de ML
    
    Estrategia: 14 preguntas → 23 features
    - 8 features numéricas agrupadas
    - 2 features categóricas (especie: perro/gato)
    - 13 features categóricas (personalidad: one-hot encoding)
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False
        
        # Mapeos de valores categóricos a numéricos
        self.mappings = {
            'horasEnCasa': {
                'menos_4': 0.25,
                '4_6': 0.50,
                '6_8': 0.75,
                'mas_8': 1.0
            },
            'nivelActividad': {
                'sedentario': 0.25,
                'moderado': 0.50,
                'activo': 0.75,
                'muy_activo': 1.0
            },
            'experienciaMascotas': {
                'ninguna': 0.0,
                'poca': 0.33,
                'moderada': 0.67,
                'experta': 1.0
            },
            'tipoVivienda': {
                'apto_pequeno': 0.25,
                'apto_grande': 0.50,
                'casa_patio': 0.75,
                'casa_jardin': 1.0
            },
            'tamanoMascota': {
                'pequeno': 0.25,
                'mediano': 0.50,
                'grande': 0.75,
                'muy_grande': 1.0,
                'sin_preferencia': 0.50  # Neutral
            },
            'edadPreferida': {
                'cachorro': 0.0,
                'joven': 0.33,
                'adulto': 0.67,
                'senior': 1.0,
                'sin_preferencia': 0.50
            },
            'nivelEnergia': {
                'tranquilo': 0.0,
                'moderado': 0.50,
                'energetico': 1.0
            },
            'tiempoCuidado': {
                'menos_30': 0.25,
                '30_60': 0.50,
                '1_2': 0.75,
                'mas_2': 1.0
            },
            'entrenamiento': {
                'no': 0.0,
                'tal_vez': 0.50,
                'si': 1.0
            },
            'presupuesto': {
                'basico': 0.33,
                'moderado': 0.67,
                'alto': 1.0
            },
            'ninosEnCasa': {
                'no': 0.0,
                'mayores_12': 0.33,
                '5_12': 0.67,
                'menores_5': 1.0
            },
            'otrasMascotas': {
                'no': 0.0,
                'otras': 0.33,
                'gatos': 0.67,
                'perros': 1.0
            }
        }
        
        # Rasgos de personalidad (13 opciones)
        self.personality_traits = [
            'jugueton', 'tranquilo', 'timido', 'energetico',
            'ruidoso', 'amigable', 'carinoso', 'agresivo',
            'leal', 'protector', 'inteligente', 'temeroso', 'arisco'
        ]
    
    def _map_value(self, col, value):
        """Mapea un valor categórico a numérico"""
        if pd.isna(value):
            return 0.5  # Valor neutral para NaN
        return self.mappings.get(col, {}).get(value, 0.5)
    
    def _encode_personality(self, personality_str):
        """
        Convierte string de personalidad a vector one-hot
        Entrada: "amigable,jugueton,cariñoso"
        Salida: [1, 0, 1, 0, 0, 1, 0, 0]
        """
        # Convertir a string primero para evitar ambigüedad con pandas
        personality_str = str(personality_str) if personality_str is not None else ''
        
        if not personality_str or personality_str == 'nan' or personality_str.strip() == '':
            return [0] * len(self.personality_traits)
        
        selected_traits = set(personality_str.lower().split(','))
        selected_traits = {t.strip() for t in selected_traits}  # Limpiar espacios
        return [1 if trait in selected_traits else 0 
                for trait in self.personality_traits]
    
    def transform_users(self, users_df):
        """
        Transforma DataFrame de usuarios a matriz de features
        
        Returns:
            numpy array de shape (n_users, 23)
        """
        features_list = []
        
        for _, user in users_df.iterrows():
            # Feature 1: lifestyle_score (horas en casa + nivel actividad)
            horas = self._map_value('horasEnCasa', user.get('horasEnCasa'))
            actividad = self._map_value('nivelActividad', user.get('nivelActividad'))
            lifestyle_score = (horas + actividad) / 2
            
            # Feature 2: experience_level
            experience = self._map_value('experienciaMascotas', user.get('experienciaMascotas'))
            
            # Feature 3: space_available
            space = self._map_value('tipoVivienda', user.get('tipoVivienda'))
            
            # Feature 4: size_preference (limitado por vivienda)
            size_pref = self._map_value('tamanoMascota', user.get('tamanoMascota'))
            size_preference = min(size_pref, space)  # No puede querer más grande que su espacio
            
            # Feature 5: age_preference
            age_preference = self._map_value('edadPreferida', user.get('edadPreferida'))
            
            # Feature 6: energy_preference (ajustado por actividad)
            energy_raw = self._map_value('nivelEnergia', user.get('nivelEnergia'))
            energy_preference = (energy_raw + actividad) / 2
            
            # Feature 7: care_capacity (tiempo + entrenamiento + presupuesto)
            tiempo = self._map_value('tiempoCuidado', user.get('tiempoCuidado'))
            entrena = self._map_value('entrenamiento', user.get('entrenamiento'))
            presupto = self._map_value('presupuesto', user.get('presupuesto'))
            care_capacity = (tiempo + entrena + presupto) / 3
            
            # Feature 8: compatibility_needs (niños + otras mascotas)
            ninos = self._map_value('ninosEnCasa', user.get('ninosEnCasa'))
            mascotas = self._map_value('otrasMascotas', user.get('otrasMascotas'))
            compatibility_needs = (ninos + mascotas) / 2
            
            # Features 9-10: Especie preferida (one-hot)
            especie = user.get('perroOGato', 'ambos')
            wants_dog = 1.0 if especie in ['solo_perros', 'ambos'] else 0.0
            wants_cat = 1.0 if especie in ['solo_gatos', 'ambos'] else 0.0
            
            # Features 11-23: Personalidad (one-hot, 13 traits)
            personality_vector = self._encode_personality(user.get('personalidad', ''))
            
            # Combinar todas las features
            feature_vector = [
                lifestyle_score,      # 0
                experience,           # 1
                space,                # 2
                size_preference,      # 3
                age_preference,       # 4
                energy_preference,    # 5
                care_capacity,        # 6
                compatibility_needs,  # 7
                wants_dog,            # 8
                wants_cat             # 9
            ] + personality_vector    # 10-22 (13 traits)
            
            features_list.append(feature_vector)
        
        return np.array(features_list)
    
    def transform_pets(self, pets_df):
        """
        Transforma DataFrame de mascotas a matriz de features
        
        Returns:
            numpy array de shape (n_pets, 23)
        """
        features_list = []
        
        for _, pet in pets_df.iterrows():
            # Feature 0: lifestyle_score (para mascotas, basado en energía y edad)
            edad_meses = pet.get('edad_meses', 36)
            edad_norm = min(edad_meses / 180, 1.0)  # Normalizar a [0,1]
            energia_raw = self._map_value('nivelEnergia', pet.get('nivel_energia'))
            lifestyle_score = (1 - edad_norm + energia_raw) / 2  # Jóvenes y energéticos = alto
            
            # Feature 1: experience_level requerido (inverso de edad - cachorros requieren más)
            if edad_meses < 12:
                experience_required = 0.8  # Cachorros requieren experiencia
            elif edad_meses < 36:
                experience_required = 0.5  # Jóvenes moderado
            else:
                experience_required = 0.2  # Adultos/seniors fáciles
            
            # Feature 2: space_available requerido (basado en tamaño)
            tamano = pet.get('tamano', 'mediano')
            space_required = self._map_value('tamanoMascota', tamano)
            
            # Feature 3: size (tamaño real)
            size = space_required
            
            # Feature 4: age (edad normalizada)
            age = edad_norm
            
            # Feature 5: energy_level
            energy = energia_raw
            
            # Feature 6: care_capacity requerido (alto si cachorro o necesita mucho)
            if edad_meses < 12 or energia_raw > 0.7:
                care_required = 0.8
            else:
                care_required = 0.4
            
            # Feature 7: compatibility_needs (si es sociable)
            personality_str = str(pet.get('personalidad', ''))
            is_social = 1.0 if any(t in personality_str.lower() 
                                  for t in ['amigable', 'sociable', 'cariñoso']) else 0.5
            
            # Features 8-9: Especie (one-hot)
            especie = str(pet.get('especie', 'Perro'))
            is_dog = 1.0 if 'perro' in especie.lower() else 0.0
            is_cat = 1.0 if 'gato' in especie.lower() else 0.0
            
            # Features 10-22: Personalidad (13 traits)
            personality_vector = self._encode_personality(pet.get('personalidad', ''))
            
            feature_vector = [
                lifestyle_score,
                experience_required,
                space_required,
                size,
                age,
                energy,
                care_required,
                is_social,
                is_dog,
                is_cat
            ] + personality_vector
            
            features_list.append(feature_vector)
        
        return np.array(features_list)
    
    def fit(self, X):
        """Ajusta el scaler con los datos de entrenamiento"""
        self.scaler.fit(X)
        self.is_fitted = True
        return self
    
    def transform(self, X):
        """Normaliza las features usando el scaler entrenado"""
        if not self.is_fitted:
            raise ValueError("FeatureEngineer must be fitted before transform")
        return self.scaler.transform(X)
    
    def fit_transform(self, X):
        """Ajusta y transforma en un solo paso"""
        return self.fit(X).transform(X)
    
    def save(self, path):
        """Guarda el FeatureEngineer entrenado"""
        joblib.dump({
            'scaler': self.scaler,
            'is_fitted': self.is_fitted,
            'personality_traits': self.personality_traits
        }, path)
        print(f"✅ FeatureEngineer guardado en: {path}")
    
    def load(self, path):
        """Carga un FeatureEngineer previamente entrenado"""
        data = joblib.load(path)
        self.scaler = data['scaler']
        self.is_fitted = data['is_fitted']
        self.personality_traits = data['personality_traits']
        print(f"✅ FeatureEngineer cargado desde: {path}")
        return self


def main():
    """Script de prueba del preprocesamiento"""
    print("🔧 Probando FeatureEngineer...")
    
    # Cargar datos
    DATA_DIR = Path(__file__).parent.parent / 'data' / 'raw'
    users_df = pd.read_csv(DATA_DIR / 'users.csv')
    pets_df = pd.read_csv(DATA_DIR / 'pets.csv')
    
    # Crear feature engineer
    fe = FeatureEngineer()
    
    # Transformar usuarios
    print("\n1️⃣ Transformando usuarios...")
    user_features = fe.transform_users(users_df)
    print(f"   Shape: {user_features.shape}")
    print(f"   Primer usuario: {user_features[0]}")
    
    # Transformar mascotas
    print("\n2️⃣ Transformando mascotas...")
    pet_features = fe.transform_pets(pets_df)
    print(f"   Shape: {pet_features.shape}")
    print(f"   Primera mascota: {pet_features[0]}")
    
    # Normalizar
    print("\n3️⃣ Normalizando features...")
    all_features = np.vstack([user_features, pet_features])
    fe.fit(all_features)
    
    user_features_norm = fe.transform(user_features)
    pet_features_norm = fe.transform(pet_features)
    
    print(f"   Usuario normalizado: {user_features_norm[0]}")
    print(f"   Mascota normalizada: {pet_features_norm[0]}")
    
    # Guardar
    MODELS_DIR = Path(__file__).parent.parent / 'models'
    fe.save(MODELS_DIR / 'feature_engineer.pkl')
    
    print("\n✅ Preprocesamiento funcionando correctamente!")


if __name__ == "__main__":
    main()
