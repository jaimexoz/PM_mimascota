"""
Generador Principal de Datos Sintéticos
Orquesta la generación de mascotas, usuarios e interacciones
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys

# Agregar src al path para imports
sys.path.append(str(Path(__file__).parent.parent))

from data.generate_synthetic_pets import generate_pets
from data.generate_synthetic_users import generate_users

# Seed para reproducibilidad
np.random.seed(42)

# Configuración
N_INTERACTIONS = 2700  # ~50% sparsity (2700/5400) - realista


def calculate_compatibility(user, pet):
    """
    Calcula un score de compatibilidad entre usuario y mascota (0-1)
    
    Basado en reglas lógicas según el perfil del usuario
    """
    score = 0.0
    
    # Factor 1: Especie (0-0.3)
    user_species_pref = user['perroOGato']
    pet_species = pet['especie']
    
    if user_species_pref == 'ambos':
        score += 0.2
    elif (user_species_pref == ' solo_perros' and pet_species == 'Perro') or \
         (user_species_pref == 'solo_gatos' and pet_species == 'Gato'):
        score += 0.3
    elif (user_species_pref == 'solo_perros' and pet_species == 'Gato') or \
         (user_species_pref == 'solo_gatos' and pet_species == 'Perro'):
        score += 0.0  # Incompatible
    
    # Factor 2: Tamaño (0-0.25)
    user_size_pref = user['tamanoMascota']
    pet_size = pet['tamano']
    user_space = user['tipoVivienda']
    
    # Compatibilidad de tamaño con espacio
    if user_space in ['apto_pequeno'] and pet_size in ['pequeno']:
        score += 0.25
    elif user_space in ['apto_pequeno'] and pet_size in ['mediano']:
        score += 0.15
    elif user_space in ['apto_pequeno'] and pet_size in ['grande', 'muy_grande']:
        score += 0.0
    elif user_space in ['apto_grande'] and pet_size in ['pequeno', 'mediano']:
        score += 0.20
    elif user_space in ['casa_patio', 'casa_jardin'] and pet_size in ['grande', 'muy_grande']:
        score += 0.25
    elif user_space in ['casa_patio', 'casa_jardin']:
        score += 0.20
    
    # Factor 3: Energía (0-0.25)
    user_energy = user['nivelEnergia']
    pet_energy = pet['nivel_energia']
    user_activity = user['nivelActividad']
    
    energy_match = {
        ('tranquilo', 'tranquilo'): 0.25,
        ('tranquilo', 'moderado'): 0.15,
        ('tranquilo', 'energetico'): 0.05,
        ('moderado', 'tranquilo'): 0.15,
        ('moderado', 'moderado'): 0.25,
        ('moderado', 'energetico'): 0.15,
        ('energetico', 'tranquilo'): 0.05,
        ('energetico', 'moderado'): 0.15,
        ('energetico', 'energetico'): 0.25,
    }
    
    score += energy_match.get((user_energy, pet_energy), 0.10)
    
    # Factor 4: Edad (0-0.20)
    user_age_pref = user['edadPreferida']
    pet_age_months = pet['edad_meses']
    
    if user_age_pref == 'cachorro' and pet_age_months < 12:
        score += 0.20
    elif user_age_pref == 'joven' and 12 <= pet_age_months < 36:
        score += 0.20
    elif user_age_pref == 'adulto' and 36 <= pet_age_months < 84:
        score += 0.20
    elif user_age_pref == 'senior' and pet_age_months >= 84:
        score += 0.20
    elif user_age_pref == 'sin_preferencia':
        score += 0.15
    else:
        score += 0.05
    
    # Asegurar que está en rango [0, 1]
    score = np.clip(score, 0.0, 1.0)
    
    return score


def generate_interaction(user, pet, compatibility):
    """
    Genera una interacción basada en la compatibilidad
    
    Alta compatibilidad (>0.7) → más clics, favoritos, adopciones
    Media compatibilidad (0.4-0.7) → algunos clics
    Baja compatibilidad (<0.4) → pocas o ninguna interacción
    """
    
    # Agregar ruido a la compatibilidad
    noisy_compatibility = compatibility + np.random.normal(0, 0.1)
    noisy_compatibility = np.clip(noisy_compatibility, 0.0, 1.0)
    
    if compatibility > 0.7:
        # Alta compatibilidad
        clicks = np.random.randint(2, 6)
        favori = 1 if np.random.random() < 0.7 else 0
        adopti = 1 if (favori == 1 and np.random.random() < 0.3) else 0
    elif compatibility > 0.4:
        # Media compatibilidad
        clicks = np.random.randint(0, 3)
        favori = 1 if np.random.random() < 0.2 else 0
        adopti = 0
    else:
        # Baja compatibilidad
        clicks = 0
        favori = 0
        adopti = 0
    
    return {
        'clicks_intera': clicks,
        'favori_intera': favori,
        'matchx_intera': round(noisy_compatibility, 3),
        'adopti_intera': adopti
    }


def generate_interactions(users_df, pets_df, n_interactions=1000):
    """
    Genera interacciones entre usuarios y mascotas
    
    Estrategia:
    - Para cada usuario, calcular compatibilidad con todas las mascotas
    - Generar interacciones priorizando alta compatibilidad
    - Agregar algunas interacciones aleatorias (exploración)
    """
    interactions = []
    interaction_id = 1
    
    # Calcular cuántas interacciones por usuario
    interactions_per_user = n_interactions // len(users_df)
    
    for _, user in users_df.iterrows():
        # Calcular compatibilidad con todas las mascotas
        compatibilities = []
        for _, pet in pets_df.iterrows():
            comp = calculate_compatibility(user, pet)
            compatibilities.append((pet['pet_id'], comp))
        
        # Ordenar por compatibilidad
        compatibilities.sort(key=lambda x: x[1], reverse=True)
        
        # Seleccionar mascotas para interactuar
        # 70% alta compatibilidad, 20% media, 10% exploración aleatoria
        n_high = int(interactions_per_user * 0.7)
        n_medium = int(interactions_per_user * 0.2)
        n_random = interactions_per_user - n_high - n_medium
        
        selected_pets = []
        
        # Alta compatibilidad (top pets)
        for pet_id, comp in compatibilities[:n_high]:
            selected_pets.append((pet_id, comp))
        
        # Media compatibilidad
        mid_start = len(compatibilities) // 3
        mid_end = 2 * len(compatibilities) // 3
        for pet_id, comp in compatibilities[mid_start:mid_start+n_medium]:
            selected_pets.append((pet_id, comp))
        
        # Exploración aleatoria
        random_choices = np.random.choice(len(pets_df), size=n_random, replace=False)
        for idx in random_choices:
            pet_id = pets_df.iloc[idx]['pet_id']
            comp = compatibilities[idx][1]
            selected_pets.append((pet_id, comp))
        
        # Generar interacciones
        for pet_id, compatibility in selected_pets:
            pet = pets_df[pets_df['pet_id'] == pet_id].iloc[0]
            interaction_data = generate_interaction(user, pet, compatibility)
            
            # Solo agregar si hay alguna interacción
            if interaction_data['clicks_intera'] > 0 or interaction_data['favori_intera'] > 0:
                interaction = {
                    'idxxxx_intera': interaction_id,
                    'forane_idxxxx_usuari': user['user_id'],
                    'forane_idxxxx_mascot': pet_id,
                    **interaction_data
                }
                interactions.append(interaction)
                interaction_id += 1
    
    df = pd.DataFrame(interactions)
    
    # Truncar al número deseado
    if len(df) > n_interactions:
        df = df.sample(n=n_interactions, random_state=42).reset_index(drop=True)
        df['idxxxx_intera'] = range(1, n_interactions + 1)
    
    return df


def main():
    """Función principal"""
    print("\n=== GENERACIÓN DE DATOS SINTÉTICOS ===\n")
    
    # 1. Generar mascotas
    print("Generando mascotas...")
    pets_df = generate_pets(n_dogs=100, n_cats=100)
    print(f"✓ {len(pets_df)} mascotas generadas")
    
    # 2. Generar usuarios
    print("\nGenerando usuarios...")
    users_df = generate_users(n_users=50)
    print(f"✓ {len(users_df)} usuarios generados")
    
    # 3. Generar interacciones
    print(f"\nGenerando interacciones...")
    interactions_df = generate_interactions(users_df, pets_df, n_interactions=N_INTERACTIONS)
    print(f"✓ {len(interactions_df)} interacciones generadas")
    
    # 4. Estadísticas
    print(f"\nEstadísticas:")
    print(f"  Clics: {interactions_df['clicks_intera'].sum()}")
    print(f"  Favoritos: {interactions_df['favori_intera'].sum()}")
    print(f"  Adopciones: {interactions_df['adopti_intera'].sum()}")
    print(f"  Match promedio: {interactions_df['matchx_intera'].mean():.2f}")
    print(f"  Sparsity: {(1 - len(interactions_df)/5400)*100:.1f}%")
    
    # 5. Guardar archivos
    output_dir = Path(__file__).parent.parent.parent / 'data' / 'raw'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    pets_path = output_dir / 'synthetic_pets.csv'
    users_path = output_dir / 'synthetic_users.csv'
    interactions_path = output_dir / 'synthetic_interactions.csv'
    
    pets_df.to_csv(pets_path, index=False)
    users_df.to_csv(users_path, index=False)
    interactions_df.to_csv(interactions_path, index=False)
    
    print(f"\n✓ Datos guardados exitosamente\n")
    
    return pets_df, users_df, interactions_df


if __name__ == "__main__":
    pets_df, users_df, interactions_df = main()
