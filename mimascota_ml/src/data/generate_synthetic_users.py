"""
Generador de Usuarios Sintéticos para Entrenamiento ML
Genera 50 usuarios con perfiles latentes distintos basados en el cuestionario completo
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Seed para reproducibilidad
np.random.seed(42)

# Configuración
N_USERS = 50

# Perfiles latentes y sus distribuciones
LATENT_PROFILES = {
    'urbano': {
        'count': 15,  # 30%
        'horasEnCasa': ['4_6', 'menos_4'],
        'nivelActividad': ['sedentario', 'moderado'],
        'experienciaMascotas': ['ninguna', 'poca', 'moderada'],
        'tipoVivienda': ['apto_pequeno', 'apto_grande'],
        'tamanoMascota': ['pequeno', 'mediano'],
        'edadPreferida': ['adulto', 'joven', 'sin_preferencia'],
        'perroOGato': ['solo_gatos', 'ambos'],
        'nivelEnergia': ['tranquilo', 'moderado'],
        'personalidad': ['tranquilo', 'amigable', 'carinoso', 'inteligente'],
        'ninosEnCasa': ['no', 'mayores_12'],
        'otrasMascotas': ['no', 'otras'],
        'tiempoCuidado': ['menos_30', '30_60'],
        'entrenamiento': ['no', 'tal_vez'],
        'presupuesto': ['basico', 'moderado']
    },
    'familiar': {
        'count': 12,  # 25%
        'horasEnCasa': ['6_8', 'mas_8'],
        'nivelActividad': ['moderado', 'activo'],
        'experienciaMascotas': ['moderada', 'experta'],
        'tipoVivienda': ['casa_patio', 'casa_jardin'],
        'tamanoMascota': ['mediano', 'grande'],
        'edadPreferida': ['cachorro', 'joven'],
        'perroOGato': ['solo_perros', 'ambos'],
        'nivelEnergia': ['moderado', 'energetico'],
        'personalidad': ['amigable', 'jugueton', 'leal', 'protector'],
        'ninosEnCasa': ['5_12', 'menores_5'],
        'otrasMascotas': ['no', 'perros'],
        'tiempoCuidado': ['1_2', 'mas_2'],
        'entrenamiento': ['si', 'tal_vez'],
        'presupuesto': ['moderado', 'alto']
    },
    'activo': {
        'count': 10,  # 20%
        'horasEnCasa': ['menos_4', '4_6'],
        'nivelActividad': ['activo', 'muy_activo'],
        'experienciaMascotas': ['moderada', 'experta'],
        'tipoVivienda': ['casa_patio', 'casa_jardin'],
        'tamanoMascota': ['grande', 'muy_grande'],
        'edadPreferida': ['joven', 'adulto'],
        'perroOGato': ['solo_perros'],
        'nivelEnergia': ['energetico'],
        'personalidad': ['energetico', 'inteligente', 'protector', 'leal'],
        'ninosEnCasa': ['no', 'mayores_12'],
        'otrasMascotas': ['no'],
        'tiempoCuidado': ['mas_2', '1_2'],
        'entrenamiento': ['si'],
        'presupuesto': ['moderado', 'alto']
    },
    'senior': {
        'count': 8,  # 15%
        'horasEnCasa': ['mas_8', '6_8'],
        'nivelActividad': ['sedentario', 'moderado'],
        'experienciaMascotas': ['moderada', 'experta'],
        'tipoVivienda': ['apto_grande', 'casa_patio'],
        'tamanoMascota': ['pequeno', 'mediano', 'sin_preferencia'],
        'edadPreferida': ['adulto', 'senior'],
        'perroOGato': ['ambos'],
        'nivelEnergia': ['tranquilo', 'moderado'],
        'personalidad': ['tranquilo', 'carinoso', 'leal', 'amigable'],
        'ninosEnCasa': ['no'],
        'otrasMascotas': ['no', 'otras'],
        'tiempoCuidado': ['30_60', '1_2'],
        'entrenamiento': ['no', 'tal_vez'],
        'presupuesto': ['moderado', 'alto']
    },
    'cat_lover': {
        'count': 5,  # 10%
        'horasEnCasa': ['6_8', 'mas_8'],
        'nivelActividad': ['sedentario', 'moderado'],
        'experienciaMascotas': ['poca', 'moderada'],
        'tipoVivienda': ['apto_pequeno', 'apto_grande', 'casa_patio'],
        'tamanoMascota': ['pequeno', 'mediano', 'sin_preferencia'],
        'edadPreferida': ['sin_preferencia', 'joven', 'adulto'],
        'perroOGato': ['solo_gatos'],
        'nivelEnergia': ['tranquilo', 'moderado'],
        'personalidad': ['tranquilo', 'independiente', 'carinoso', 'jugueton'],
        'ninosEnCasa': ['no', 'mayores_12'],
        'otrasMascotas': ['no', 'gatos'],
        'tiempoCuidado': ['menos_30', '30_60'],
        'entrenamiento': ['no'],
        'presupuesto': ['basico', 'moderado']
    }
}


def generate_users(n_users=50):
    """
    Genera usuarios sintéticos con perfiles latentes
    
    Args:
        n_users: número total de usuarios a generar
    
    Returns:
        DataFrame con usuarios sintéticos
    """
    users = []
    user_id = 1
    
    # Generar usuarios por perfil
    for profile_name, profile_config in LATENT_PROFILES.items():
        count = profile_config['count']
        
        for i in range(count):
            user = generate_single_user(user_id, profile_name, profile_config)
            users.append(user)
            user_id += 1
    
    df = pd.DataFrame(users)
    
    # Shuffle para mezclar perfiles
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    df['user_id'] = range(1, len(df) + 1)
    
    return df


def generate_single_user(user_id, profile_type, profile_config):
    """
    Genera un usuario individual según su perfil latente
    
    Args:
        user_id: ID del usuario
        profile_type: tipo de perfil (urbano, familiar, activo, senior, cat_lover)
        profile_config: configuración del perfil
    
    Returns:
        dict con datos del usuario
    """
    
    user = {
        'user_id': user_id,
        'nombre': f"Usuario_{user_id}",
        'profile_type': profile_type  # Solo para análisis, no se usa en producción
    }
    
    # Generar respuestas del cuestionario según el perfil
    user['horasEnCasa'] = np.random.choice(profile_config['horasEnCasa'])
    user['nivelActividad'] = np.random.choice(profile_config['nivelActividad'])
    user['experienciaMascotas'] = np.random.choice(profile_config['experienciaMascotas'])
    user['tipoVivienda'] = np.random.choice(profile_config['tipoVivienda'])
    user['tamanoMascota'] = np.random.choice(profile_config['tamanoMascota'])
    user['edadPreferida'] = np.random.choice(profile_config['edadPreferida'])
    user['perroOGato'] = np.random.choice(profile_config['perroOGato'])
    user['nivelEnergia'] = np.random.choice(profile_config['nivelEnergia'])
    user['ninosEnCasa'] = np.random.choice(profile_config['ninosEnCasa'])
    user['otrasMascotas'] = np.random.choice(profile_config['otrasMascotas'])
    user['tiempoCuidado'] = np.random.choice(profile_config['tiempoCuidado'])
    user['entrenamiento'] = np.random.choice(profile_config['entrenamiento'])
    user['presupuesto'] = np.random.choice(profile_config['presupuesto'])
    
    # Personalidad: seleccionar 2-3 rasgos del perfil
    n_traits = np.random.randint(2, 4)
    selected_traits = np.random.choice(
        profile_config['personalidad'],
        size=min(n_traits, len(profile_config['personalidad'])),
        replace=False
    )
    user['personalidad'] = ','.join(selected_traits)
    
    return user


def main():
    """Función principal"""
    print("👤 Generando Usuarios Sintéticos...")
    print("=" * 60)
    
    # Generar usuarios
    print(f"\n1️⃣ Generando {N_USERS} usuarios con 5 perfiles latentes...")
    users_df = generate_users(n_users=N_USERS)
    
    # Estadísticas
    print(f"\n📊 Estadísticas:")
    print(f"   Total usuarios: {len(users_df)}")
    print(f"\n   Distribución por perfil:")
    print(users_df['profile_type'].value_counts())
    print(f"\n   Distribución de especie preferida:")
    print(users_df['perroOGato'].value_counts())
    print(f"\n   Distribución de tipo de vivienda:")
    print(users_df['tipoVivienda'].value_counts())
    print(f"\n   Distribución de tamaño preferido:")
    print(users_df['tamanoMascota'].value_counts())
    
    # Guardar
    output_dir = Path(__file__).parent.parent.parent / 'data' / 'raw'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / 'synthetic_users.csv'
    
    users_df.to_csv(output_path, index=False)
    print(f"\n✅ Archivo guardado: {output_path}")
    print("=" * 60)
    
    return users_df


if __name__ == "__main__":
    users_df = main()
