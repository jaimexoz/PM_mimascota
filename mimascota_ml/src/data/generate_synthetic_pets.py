"""
Generador de Mascotas Sintéticas para Entrenamiento ML
Genera 200 mascotas (100 perros, 100 gatos) con características coherentes y balanceadas
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Seed para reproducibilidad
np.random.seed(42)

# Configuración
N_PETS = 200
N_DOGS = 100
N_CATS = 100

# Rasgos de personalidad disponibles
PERSONALITY_TRAITS = [
    'jugueton', 'tranquilo', 'timido', 'energetico',
    'ruidoso', 'amigable', 'carinoso', 'agresivo',
    'leal', 'protector', 'inteligente', 'temeroso', 'arisco'
]


def generate_pets(n_dogs=100, n_cats=100):
    """
    Genera mascotas sintéticas con características coherentes
    
    Args:
        n_dogs: número de perros a generar
        n_cats: número de gatos a generar
    
    Returns:
        DataFrame con mascotas sintéticas
    """
    pets = []
    pet_id = 1
    
    # Generar perros
    for i in range(n_dogs):
        pet = generate_single_pet(pet_id, 'Perro')
        pets.append(pet)
        pet_id += 1
    
    # Generar gatos
    for i in range(n_cats):
        pet = generate_single_pet(pet_id, 'Gato')
        pets.append(pet)
        pet_id += 1
    
    df = pd.DataFrame(pets)
    return df


def generate_single_pet(pet_id, especie):
    """
    Genera una mascota individual con características coherentes
    
    Lógica de coherencia:
    - Cachorros (< 12 meses) → más energéticos y juguetones
    - Tamaño grande → más probable que sea perro
    - Tranquilos → más probable que sean adultos/seniors
    """
    
    # Edad (distribución normal con media=36 meses, std=30)
    edad_meses = int(np.clip(np.random.normal(36, 30), 3, 180))
    
    # Tamaño (ajustado por especie)
    if especie == 'Perro':
        # Perros: más variedad de tamaños
        tamano = np.random.choice(
            ['pequeno', 'mediano', 'grande', 'muy_grande'],
            p=[0.25, 0.40, 0.25, 0.10]
        )
    else:
        # Gatos: generalmente pequeños/medianos
        tamano = np.random.choice(
            ['pequeno', 'mediano', 'grande'],
            p=[0.50, 0.40, 0.10]
        )
    
    # Nivel de energía (correlacionado con edad)
    if edad_meses < 12:  # Cachorro
        nivel_energia = np.random.choice(
            ['energetico', 'moderado', 'tranquilo'],
            p=[0.70, 0.25, 0.05]
        )
    elif edad_meses < 60:  # Joven/Adulto
        nivel_energia = np.random.choice(
            ['energetico', 'moderado', 'tranquilo'],
            p=[0.35, 0.45, 0.20]
        )
    else:  # Senior
        nivel_energia = np.random.choice(
            ['energetico', 'moderado', 'tranquilo'],
            p=[0.10, 0.30, 0.60]
        )
    
    # Personalidad (2-4 rasgos por mascota)
    n_traits = np.random.randint(2, 5)
    personality_pool = PERSONALITY_TRAITS.copy()
    
    # Ajustar probabilidades según edad y energía
    if edad_meses < 12:
        # Cachorros: más juguetones
        personality_pool = add_weighted_trait(personality_pool, 'jugueton', 3)
    
    if nivel_energia == 'energetico':
        personality_pool = add_weighted_trait(personality_pool, 'energetico', 2)
        personality_pool = add_weighted_trait(personality_pool, 'jugueton', 2)
    elif nivel_energia == 'tranquilo':
        personality_pool = add_weighted_trait(personality_pool, 'tranquilo', 3)
    
    if edad_meses > 60:
        # Seniors: más tranquilos y cariñosos
        personality_pool = add_weighted_trait(personality_pool, 'tranquilo', 2)
        personality_pool = add_weighted_trait(personality_pool, 'carinoso', 2)
    
    # Seleccionar rasgos
    selected_traits = []
    for _ in range(n_traits):
        trait = np.random.choice(personality_pool)
        if trait not in selected_traits:
            selected_traits.append(trait)
        # Remover para evitar duplicados
        personality_pool = [t for t in personality_pool if t != trait]
        if len(personality_pool) == 0:
            break
    
    personalidad = ','.join(selected_traits)
    
    # Nombre (simplificado)
    nombre = f"{especie}_{pet_id}"
    
    return {
        'pet_id': pet_id,
        'nombre': nombre,
        'especie': especie,
        'tamano': tamano,
        'edad_meses': edad_meses,
        'nivel_energia': nivel_energia,
        'personalidad': personalidad
    }


def add_weighted_trait(trait_list, trait, weight):
    """Añade un rasgo múltiples veces para aumentar su probabilidad"""
    return trait_list + [trait] * weight


def main():
    """Función principal"""
    print("🐾 Generando Mascotas Sintéticas...")
    print("=" * 60)
    
    # Generar mascotas
    print(f"\n1️⃣ Generando {N_DOGS} perros y {N_CATS} gatos...")
    pets_df = generate_pets(n_dogs=N_DOGS, n_cats=N_CATS)
    
    # Estadísticas
    print(f"\n📊 Estadísticas:")
    print(f"   Total mascotas: {len(pets_df)}")
    print(f"\n   Distribución por especie:")
    print(pets_df['especie'].value_counts())
    print(f"\n   Distribución por tamaño:")
    print(pets_df['tamano'].value_counts())
    print(f"\n   Distribución por energía:")
    print(pets_df['nivel_energia'].value_counts())
    print(f"\n   Edad promedio: {pets_df['edad_meses'].mean():.1f} meses")
    print(f"   Edad min: {pets_df['edad_meses'].min()} meses")
    print(f"   Edad max: {pets_df['edad_meses'].max()} meses")
    
    # Guardar
    output_dir = Path(__file__).parent.parent.parent / 'data' / 'raw'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / 'synthetic_pets.csv'
    
    pets_df.to_csv(output_path, index=False)
    print(f"\n✅ Archivo guardado: {output_path}")
    print("=" * 60)
    
    return pets_df


if __name__ == "__main__":
    pets_df = main()
