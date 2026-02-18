"""
Script para generar datos sintéticos con correlaciones lógicas
Genera 1000 usuarios, 300 mascotas y 8000 interacciones
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Configurar semilla para reproducibilidad
np.random.seed(42)
random.seed(42)

# ============================================
# CONFIGURACIÓN
# ============================================

NUM_USERS = 1000
NUM_PETS = 300
NUM_INTERACTIONS = 8000

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw')

# ============================================
# DICCIONARIOS DE VALORES (del cuestionario)
# ============================================

HORAS_EN_CASA = ['menos_4', '4_6', '6_8', 'mas_8']
NIVEL_ACTIVIDAD = ['sedentario', 'moderado', 'activo', 'muy_activo']
EXPERIENCIA = ['ninguna', 'poca', 'moderada', 'experta']
TIPO_VIVIENDA = ['apto_pequeno', 'apto_grande', 'casa_patio', 'casa_jardin']
TAMANO_MASCOTA = ['pequeno', 'mediano', 'grande', 'muy_grande', 'sin_preferencia']
EDAD_PREFERIDA = ['cachorro', 'joven', 'adulto', 'senior', 'sin_preferencia']
ESPECIE = ['solo_perros', 'solo_gatos', 'ambos']
NIVEL_ENERGIA = ['tranquilo', 'moderado', 'energetico']
PERSONALIDAD_OPTIONS = ['amigable', 'independiente', 'jugueton', 'tranquilo', 
                        'protector', 'cariñoso', 'inteligente', 'curioso']
NINOS_EN_CASA = ['no', 'menores_5', '5_12', 'mayores_12']
OTRAS_MASCOTAS = ['no', 'perros', 'gatos', 'otras']
TIEMPO_CUIDADO = ['menos_30', '30_60', '1_2', 'mas_2']
ENTRENAMIENTO = ['no', 'tal_vez', 'si']
PRESUPUESTO = ['basico', 'moderado', 'alto']

# Para mascotas
PET_SPECIES = ['Perro', 'Gato']
PET_SIZES = ['pequeno', 'mediano', 'grande', 'muy_grande']
PET_ENERGY_LEVELS = ['tranquilo', 'moderado', 'energetico']
PET_AGES_MONTHS = list(range(6, 180))  # 6 meses a 15 años

# ============================================
# FUNCIONES DE GENERACIÓN CON CORRELACIONES
# ============================================

def generate_user_profile(user_id):
    """
    Genera un perfil de usuario con correlaciones lógicas
    """
    profile = {'user_id': user_id}
    
    # 1. Horas en casa (distribución realista)
    profile['horasEnCasa'] = np.random.choice(
        HORAS_EN_CASA,
        p=[0.35, 0.25, 0.25, 0.15]  # Mayoría trabaja fuera o medio tiempo
    )
    
    # 2. Nivel de actividad
    profile['nivelActividad'] = np.random.choice(
        NIVEL_ACTIVIDAD,
        p=[0.20, 0.35, 0.30, 0.15]  # Distribución normal hacia moderado
    )
    
    # 3. Experiencia
    profile['experienciaMascotas'] = np.random.choice(
        EXPERIENCIA,
        p=[0.15, 0.25, 0.40, 0.20]  # Mayoría tiene experiencia moderada
    )
    
    # 4. Tipo de vivienda
    profile['tipoVivienda'] = np.random.choice(
        TIPO_VIVIENDA,
        p=[0.30, 0.25, 0.25, 0.20]
    )
    
    # 5. Tamaño mascota - CORRELACIÓN CON VIVIENDA
    if profile['tipoVivienda'] == 'apto_pequeno':
        # Apartamento pequeño -> prefieren pequeño/mediano
        profile['tamanoMascota'] = np.random.choice(
            ['pequeno', 'mediano', 'sin_preferencia'],
            p=[0.50, 0.35, 0.15]
        )
    elif profile['tipoVivienda'] == 'apto_grande':
        profile['tamanoMascota'] = np.random.choice(
            ['pequeno', 'mediano', 'grande', 'sin_preferencia'],
            p=[0.25, 0.35, 0.25, 0.15]
        )
    else:  # Casa
        profile['tamanoMascota'] = np.random.choice(
            TAMANO_MASCOTA,
            p=[0.15, 0.25, 0.30, 0.20, 0.10]
        )
    
    # 6. Edad preferida - CORRELACIÓN CON EXPERIENCIA
    if profile['experienciaMascotas'] == 'ninguna':
        # Sin experiencia -> prefieren adultos/seniors (más fáciles)
        profile['edadPreferida'] = np.random.choice(
            ['adulto', 'senior', 'sin_preferencia'],
            p=[0.45, 0.30, 0.25]
        )
    elif profile['experienciaMascotas'] == 'experta':
        # Expertos -> más dispuestos a cachorros
        profile['edadPreferida'] = np.random.choice(
            EDAD_PREFERIDA,
            p=[0.30, 0.25, 0.20, 0.15, 0.10]
        )
    else:
        profile['edadPreferida'] = np.random.choice(
            EDAD_PREFERIDA,
            p=[0.15, 0.25, 0.30, 0.20, 0.10]
        )
    
    # 7. Especie preferida
    profile['perroOGato'] = np.random.choice(
        ESPECIE,
        p=[0.45, 0.35, 0.20]  # Ligera preferencia por perros
    )
    
    # 8. Nivel de energía - CORRELACIÓN CON NIVEL DE ACTIVIDAD
    if profile['nivelActividad'] == 'sedentario':
        profile['nivelEnergia'] = np.random.choice(
            ['tranquilo', 'moderado'],
            p=[0.70, 0.30]
        )
    elif profile['nivelActividad'] == 'muy_activo':
        profile['nivelEnergia'] = np.random.choice(
            ['moderado', 'energetico'],
            p=[0.30, 0.70]
        )
    else:
        profile['nivelEnergia'] = np.random.choice(
            NIVEL_ENERGIA,
            p=[0.30, 0.45, 0.25]
        )
    
    # 9. Personalidad (hasta 3 rasgos)
    num_traits = np.random.choice([1, 2, 3], p=[0.20, 0.50, 0.30])
    profile['personalidad'] = ','.join(
        np.random.choice(PERSONALIDAD_OPTIONS, size=num_traits, replace=False)
    )
    
    # 10. Niños en casa
    profile['ninosEnCasa'] = np.random.choice(
        NINOS_EN_CASA,
        p=[0.55, 0.15, 0.20, 0.10]  # Mayoría sin niños
    )
    
    # 11. Otras mascotas
    profile['otrasMascotas'] = np.random.choice(
        OTRAS_MASCOTAS,
        p=[0.60, 0.20, 0.10, 0.10]
    )
    
    # 12. Tiempo de cuidado - CORRELACIÓN CON HORAS EN CASA
    if profile['horasEnCasa'] in ['menos_4', '4_6']:
        profile['tiempoCuidado'] = np.random.choice(
            ['menos_30', '30_60', '1_2'],
            p=[0.40, 0.40, 0.20]
        )
    else:
        profile['tiempoCuidado'] = np.random.choice(
            TIEMPO_CUIDADO,
            p=[0.15, 0.30, 0.35, 0.20]
        )
    
    # 13. Entrenamiento
    profile['entrenamiento'] = np.random.choice(
        ENTRENAMIENTO,
        p=[0.25, 0.45, 0.30]
    )
    
    # 14. Presupuesto - CORRELACIÓN CON TIEMPO DISPONIBLE
    if profile['tiempoCuidado'] in ['mas_2', '1_2']:
        profile['presupuesto'] = np.random.choice(
            PRESUPUESTO,
            p=[0.20, 0.45, 0.35]  # Más tiempo = más dispuesto a gastar
        )
    else:
        profile['presupuesto'] = np.random.choice(
            PRESUPUESTO,
            p=[0.45, 0.40, 0.15]
        )
    
    return profile


def generate_pet_profile(pet_id):
    """
    Genera un perfil de mascota realista
    """
    profile = {'pet_id': pet_id}
    
    # Especie
    profile['especie'] = np.random.choice(PET_SPECIES, p=[0.60, 0.40])
    
    # Edad en meses
    # Distribución: más adultos que cachorros (realista para adopción)
    if np.random.random() < 0.15:  # 15% cachorros
        profile['edad_meses'] = np.random.randint(2, 12)
    elif np.random.random() < 0.30:  # 30% jóvenes
        profile['edad_meses'] = np.random.randint(12, 36)
    elif np.random.random() < 0.70:  # 40% adultos
        profile['edad_meses'] = np.random.randint(36, 84)
    else:  # 15% seniors
        profile['edad_meses'] = np.random.randint(84, 180)
    
    # Tamaño - distribución diferente para perros y gatos
    if profile['especie'] == 'Gato':
        profile['tamano'] = np.random.choice(
            ['pequeno', 'mediano'],
            p=[0.70, 0.30]  # Mayoría de gatos son pequeños/medianos
        )
    else:  # Perro
        profile['tamano'] = np.random.choice(
            PET_SIZES,
            p=[0.25, 0.35, 0.25, 0.15]
        )
    
    # Energía - CORRELACIÓN CON EDAD
    if profile['edad_meses'] < 24:  # Cachorros/jóvenes
        profile['nivel_energia'] = np.random.choice(
            ['moderado', 'energetico'],
            p=[0.30, 0.70]
        )
    elif profile['edad_meses'] > 84:  # Seniors
        profile['nivel_energia'] = np.random.choice(
            ['tranquilo', 'moderado'],
            p=[0.70, 0.30]
        )
    else:  # Adultos
        profile['nivel_energia'] = np.random.choice(
            PET_ENERGY_LEVELS,
            p=[0.30, 0.50, 0.20]
        )
    
    # Personalidad (2-4 rasgos por mascota)
    num_traits = np.random.choice([2, 3, 4], p=[0.30, 0.50, 0.20])
    profile['personalidad'] = ','.join(
        np.random.choice(PERSONALIDAD_OPTIONS, size=num_traits, replace=False)
    )
    
    return profile


def calculate_compatibility_score(user, pet):
    """
    Calcula un score de compatibilidad entre usuario y mascota
    Usado para generar interacciones realistas
    """
    score = 0.5  # Base
    
    # Especie match
    if user['perroOGato'] == 'ambos':
        score += 0.1
    elif (user['perroOGato'] == 'solo_perros' and pet['especie'] == 'Perro') or \
         (user['perroOGato'] == 'solo_gatos' and pet['especie'] == 'Gato'):
        score += 0.2
    else:
        score -= 0.3  # Penalización fuerte si no match especie
    
    # Tamaño compatible con vivienda
    size_compatibility = {
        'apto_pequeno': ['pequeno', 'mediano'],
        'apto_grande': ['pequeno', 'mediano', 'grande'],
        'casa_patio': ['pequeno', 'mediano', 'grande'],
        'casa_jardin': ['pequeno', 'mediano', 'grande', 'muy_grande']
    }
    
    if pet['tamano'] in size_compatibility.get(user['tipoVivienda'], []):
        score += 0.15
    else:
        score -= 0.15
    
    # Energía match
    if user['nivelEnergia'] == pet['nivel_energia']:
        score += 0.15
    
    # Personalidad overlap
    user_traits = set(user['personalidad'].split(','))
    pet_traits = set(pet['personalidad'].split(','))
    overlap = len(user_traits & pet_traits)
    score += overlap * 0.05
    
    # Normalizar a [0, 1]
    return max(0.0, min(1.0, score))


def generate_interactions(users_df, pets_df, num_interactions):
    """
    Genera interacciones basadas en compatibilidad
    """
    interactions = []
    
    # Distribución de tipos de interacción
    interaction_types = {
        'view': 0.60,       # 60%
        'click': 0.25,      # 25%
        'favorite': 0.10,   # 10%
        'adoption': 0.05    # 5%
    }
    
    for _ in range(num_interactions):
        # Seleccionar usuario aleatorio
        user = users_df.sample(1).iloc[0]
        
        # Seleccionar mascota con probabilidad basada en compatibilidad
        # Calculamos scores para todas las mascotas
        scores = pets_df.apply(
            lambda pet: calculate_compatibility_score(user, pet),
            axis=1
        )
        
        # Normalizar scores para usar como probabilidades
        probs = scores / scores.sum() if scores.sum() > 0 else np.ones(len(scores)) / len(scores)
        
        # Seleccionar mascota
        pet_idx = np.random.choice(pets_df.index, p=probs)
        pet = pets_df.loc[pet_idx]
        
        # Determinar tipo de interacción basado en compatibility score
        compatibility = scores[pet_idx]
        
        if compatibility > 0.7:
            # Alta compatibilidad -> más probable interacción fuerte
            interaction_type = np.random.choice(
                list(interaction_types.keys()),
                p=[0.20, 0.30, 0.30, 0.20]  # Más favoritos y adopciones
            )
        elif compatibility > 0.5:
            interaction_type = np.random.choice(
                list(interaction_types.keys()),
                p=[0.40, 0.35, 0.20, 0.05]
            )
        else:
            # Baja compatibilidad -> mayormente views
            interaction_type = np.random.choice(
                list(interaction_types.keys()),
                p=[0.75, 0.20, 0.04, 0.01]
            )
        
        # Rating (usado para collaborative filtering)
        if interaction_type == 'view':
            rating = np.random.choice([2, 3], p=[0.60, 0.40])
        elif interaction_type == 'click':
            rating = np.random.choice([3, 4], p=[0.50, 0.50])
        elif interaction_type == 'favorite':
            rating = np.random.choice([4, 5], p=[0.40, 0.60])
        else:  # adoption
            rating = 5
        
        # Timestamp aleatorio en los últimos 6 meses
        days_ago = np.random.randint(0, 180)
        timestamp = datetime.now() - timedelta(days=days_ago)
        
        interactions.append({
            'user_id': user['user_id'],
            'pet_id': pet['pet_id'],
            'interaction_type': interaction_type,
            'rating': rating,
            'timestamp': timestamp,
            'compatibility_score': compatibility
        })
    
    return pd.DataFrame(interactions)


# ============================================
# MAIN
# ============================================

def main():
    print("🐾 Generando datos sintéticos para sistema ML de recomendación de mascotas")
    print("=" * 70)
    
    # Crear directorio de salida
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Generar usuarios
    print(f"\n1️⃣ Generando {NUM_USERS} perfiles de usuario...")
    users = [generate_user_profile(i) for i in range(1, NUM_USERS + 1)]
    users_df = pd.DataFrame(users)
    
    print(f"   ✅ {len(users_df)} usuarios generados")
    print(f"   📊 Distribución de especies preferidas:")
    print(users_df['perroOGato'].value_counts())
    
    # 2. Generar mascotas
    print(f"\n2️⃣ Generando {NUM_PETS} perfiles de mascota...")
    pets = [generate_pet_profile(i) for i in range(1, NUM_PETS + 1)]
    pets_df = pd.DataFrame(pets)
    
    print(f"   ✅ {len(pets_df)} mascotas generadas")
    print(f"   📊 Distribución de especies:")
    print(pets_df['especie'].value_counts())
    
    # 3. Generar interacciones
    print(f"\n3️⃣ Generando {NUM_INTERACTIONS} interacciones...")
    interactions_df = generate_interactions(users_df, pets_df, NUM_INTERACTIONS)
    
    print(f"   ✅ {len(interactions_df)} interacciones generadas")
    print(f"   📊 Distribución de tipos:")
    print(interactions_df['interaction_type'].value_counts())
    print(f"   📊 Compatibility score promedio: {interactions_df['compatibility_score'].mean():.3f}")
    
    # 4. Guardar archivos
    print(f"\n4️⃣ Guardando archivos en {OUTPUT_DIR}...")
    
    users_path = os.path.join(OUTPUT_DIR, 'users.csv')
    pets_path = os.path.join(OUTPUT_DIR, 'pets.csv')
    interactions_path = os.path.join(OUTPUT_DIR, 'interactions.csv')
    
    users_df.to_csv(users_path, index=False, encoding='utf-8')
    pets_df.to_csv(pets_path, index=False, encoding='utf-8')
    interactions_df.to_csv(interactions_path, index=False, encoding='utf-8')
    
    print(f"   ✅ {users_path}")
    print(f"   ✅ {pets_path}")
    print(f"   ✅ {interactions_path}")
    
    # 5. Estadísticas finales
    print("\n" + "=" * 70)
    print("✅ DATOS SINTÉTICOS GENERADOS EXITOSAMENTE")
    print("=" * 70)
    print(f"\n📈 Estadísticas:")
    print(f"   - {len(users_df)} usuarios")
    print(f"   - {len(pets_df)} mascotas")
    print(f"   - {len(interactions_df)} interacciones")
    print(f"   - Ratio interacciones/usuario: {len(interactions_df)/len(users_df):.1f}")
    print(f"   - Ratio interacciones/mascota: {len(interactions_df)/len(pets_df):.1f}")
    
    print("\n🎯 Próximo paso:")
    print("   Ejecutar: jupyter notebook notebooks/01_data_exploration.ipynb")
    print("   Para validar distribuciones y correlaciones\n")


if __name__ == "__main__":
    main()
