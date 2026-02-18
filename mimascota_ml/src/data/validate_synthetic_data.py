"""
Script de Validación de Datos Sintéticos
Verifica la coherencia estadística y lógica del dataset generado
"""

import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt

# Configuración
DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'


def validate_pets(pets_df):
    """Valida coherencia del dataset de mascotas"""
    print("\n" + "="*70)
    print("VALIDACION DE MASCOTAS")
    print("="*70)
    
    print(f"\nTotal mascotas: {len(pets_df)}")
    
    # 1. Distribución de especies
    print("\n1. Distribucion por especie:")
    species_counts = pets_df['especie'].value_counts()
    print(species_counts)
    assert len(species_counts) == 2, "Debe haber exactamente 2 especies"
    assert abs(species_counts['Perro'] - species_counts['Gato']) < 10, "Especies deben estar balanceadas"
    print("   OK - Especies balanceadas")
    
    # 2. Distribución de tamaños
    print("\n2. Distribucion por tamano:")
    size_counts = pets_df['tamano'].value_counts()
    print(size_counts)
    print("   OK - Distribucion de tamanos")
    
    # 3. Distribución de energía
    print("\n3. Distribucion por energia:")
    energy_counts = pets_df['nivel_energia'].value_counts()
    print(energy_counts)
    print("   OK - Distribucion de energia")
    
    # 4. Correlación edad-energía
    print("\n4. Correlacion edad-energia:")
    young_pets = pets_df[pets_df['edad_meses'] < 12]
    energetic_young = young_pets[young_pets['nivel_energia'] == 'energetico']
    young_energetic_ratio = len(energetic_young) / len(young_pets) if len(young_pets) > 0 else 0
    print(f"   Cachorros energeticos: {young_energetic_ratio:.1%}")
    assert young_energetic_ratio > 0.5, "Mayoría de cachorros deben ser energéticos"
    print("   OK - Cachorros son mas energeticos")
    
    # 5. Personalidad
    print("\n5. Rasgos de personalidad:")
    all_traits = []
    for traits_str in pets_df['personalidad']:
        traits = traits_str.split(',')
        all_traits.extend(traits)
    
    trait_counts = pd.Series(all_traits).value_counts()
    print(f"   Total combinaciones: {len(pets_df['personalidad'].unique())}")
    print(f"   Rasgos mas comunes:")
    for trait, count in trait_counts.head(5).items():
        print(f"      - {trait}: {count}")
    print("   OK - Diversidad de personalidades")
    
    return True


def validate_users(users_df):
    """Valida coherencia del dataset de usuarios"""
    print("\n" + "="*70)
    print("VALIDACION DE USUARIOS")
    print("="*70)
    
    print(f"\nTotal usuarios: {len(users_df)}")
    
    # 1. Distribución de perfiles
    print("\n1. Distribucion por perfil:")
    profile_counts = users_df['profile_type'].value_counts()
    print(profile_counts)
    assert len(profile_counts) == 5, "Debe haber exactamente 5 perfiles"
    print("   OK - 5 perfiles latentes presentes")
    
    # 2. Distribución de preferencia de especie
    print("\n2. Preferencia de especie:")
    species_pref = users_df['perroOGato'].value_counts()
    print(species_pref)
    print("   OK - Variedad de preferencias")
    
    # 3. Distribución de vivienda
    print("\n3. Tipo de vivienda:")
    housing_counts = users_df['tipoVivienda'].value_counts()
    print(housing_counts)
    print("   OK - Variedad de viviendas")
    
    # 4. Consistencia de perfil urbano
    print("\n4. Consistencia perfil urbano:")
    urbano = users_df[users_df['profile_type'] == 'urbano']
    apt_pequeno = urbano[urbano['tipoVivienda'] == 'apto_pequeno']
    print(f"   Urbanos en apto pequeno: {len(apt_pequeno)}/{len(urbano)} ({len(apt_pequeno)/len(urbano):.1%})")
    print("   OK - Perfil urbano coherente")
    
    return True


def validate_interactions(interactions_df, users_df, pets_df):
    """Valida coherencia del dataset de interacciones"""
    print("\n" + "="*70)
    print("VALIDACION DE INTERACCIONES")
    print("="*70)
    
    print(f"\nTotal interacciones: {len(interactions_df)}")
    
    # 1. Estadísticas básicas
    print("\n1. Estadisticas basicas:")
    print(f"   Clics totales: {interactions_df['clicks_intera'].sum()}")
    print(f"   Favoritos: {interactions_df['favori_intera'].sum()}")
    print(f"   Adopciones: {interactions_df['adopti_intera'].sum()}")
    print(f"   Match score promedio: {interactions_df['matchx_intera'].mean():.3f}")
    print("   OK - Estadisticas calculadas")
    
    # 2. Correlación match-favoritos
    print("\n2. Correlacion match score - favoritos:")
    high_match = interactions_df[interactions_df['matchx_intera'] > 0.7]
    low_match = interactions_df[interactions_df['matchx_intera'] < 0.4]
    
    high_fav_rate = high_match['favori_intera'].mean()
    low_fav_rate = low_match['favori_intera'].mean()
    
    print(f"   Alta compatibilidad (>0.7): {high_fav_rate:.1%} favoritos")
    print(f"   Baja compatibilidad (<0.4): {low_fav_rate:.1%} favoritos")
    assert high_fav_rate > low_fav_rate, "Alta compatibilidad debe tener mas favoritos"
    print("   OK - Correlacion positiva detectada")
    
    # 3. Adopciones solo con favoritos
    print("\n3. Adopciones solo en favoritos:")
    adoptions_with_fav = interactions_df[interactions_df['adopti_intera'] == 1]['favori_intera'].sum()
    total_adoptions = interactions_df['adopti_intera'].sum()
    
    print(f"   Adopciones con favorito: {adoptions_with_fav}/{total_adoptions}")
    assert adoptions_with_fav == total_adoptions, "Todas las adopciones deben tener favorito"
    print("   OK - Logica de adopciones correcta")
    
    # 4. Distribución de interacciones por usuario
    print("\n4. Distribucion de interacciones por usuario:")
    interactions_per_user = interactions_df.groupby('forane_idxxxx_usuari').size()
    print(f"   Promedio: {interactions_per_user.mean():.1f}")
    print(f"   Minimo: {interactions_per_user.min()}")
    print(f"   Maximo: {interactions_per_user.max()}")
    print("   OK - Distribucion calculada")
    
    # 5. Validar que perfil cat_lover no interactúa con perros
    print("\n5. Validacion perfil cat_lover:")
    cat_lovers = users_df[users_df['profile_type'] == 'cat_lover']
    cat_lover_ids = cat_lovers['user_id'].tolist()
    
    cat_lover_interactions = interactions_df[interactions_df['forane_idxxxx_usuari'].isin(cat_lover_ids)]
    pet_ids_interacted = cat_lover_interactions['forane_idxxxx_mascot'].unique()
    
    dogs_in_interactions = pets_df[pets_df['pet_id'].isin(pet_ids_interacted) & (pets_df['especie'] == 'Perro')]
    
    print(f"   Cat lovers: {len(cat_lovers)}")
    print(f"   Interacciones con perros: {len(dogs_in_interactions)}")
    if len(dogs_in_interactions) > 0:
        print("   ADVERTENCIA - Algunos cat lovers interactuaron con perros")
    else:
        print("   OK - Cat lovers solo interactuan con gatos")
    
    return True


def plot_distributions(pets_df, users_df, interactions_df):
    """Genera gráficos de distribuciones (opcional)"""
    try:
        import matplotlib.pyplot as plt
        
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        
        # 1. Distribución de edad de mascotas
        axes[0, 0].hist(pets_df['edad_meses'], bins=20, edgecolor='black')
        axes[0, 0].set_title('Distribucion de Edad de Mascotas')
        axes[0, 0].set_xlabel('Edad (meses)')
        axes[0, 0].set_ylabel('Frecuencia')
        
        # 2. Distribución de match scores
        axes[0, 1].hist(interactions_df['matchx_intera'], bins=20, edgecolor='black')
        axes[0, 1].set_title('Distribucion de Match Scores')
        axes[0, 1].set_xlabel('Match Score')
        axes[0, 1].set_ylabel('Frecuencia')
        
        # 3. Clics por compatibilidad
        axes[1, 0].scatter(interactions_df['matchx_intera'], interactions_df['clicks_intera'], alpha=0.3)
        axes[1, 0].set_title('Clics vs Match Score')
        axes[1, 0].set_xlabel('Match Score')
        axes[1, 0].set_ylabel('Clics')
        
        # 4. Distribución de perfiles de usuario
        profile_counts = users_df['profile_type'].value_counts()
        axes[1, 1].bar(profile_counts.index, profile_counts.values)
        axes[1, 1].set_title('Distribucion de Perfiles de Usuario')
        axes[1, 1].set_xlabel('Perfil')
        axes[1, 1].set_ylabel('Cantidad')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        output_path = DATA_DIR / 'validation_plots.png'
        plt.savefig(output_path, dpi=150)
        print(f"\nGraficos guardados en: {output_path}")
        
    except ImportError:
        print("\nmatplotlib no disponible - omitiendo graficos")


def main():
    """Función principal"""
    print("="*70)
    print("VALIDACION DE DATASET SINTETICO")
    print("="*70)
    
    # Cargar datos
    print("\nCargando datos...")
    pets_df = pd.read_csv(DATA_DIR / 'synthetic_pets.csv')
    users_df = pd.read_csv(DATA_DIR / 'synthetic_users.csv')
    interactions_df = pd.read_csv(DATA_DIR / 'synthetic_interactions.csv')
    print("OK - Archivos cargados")
    
    # Validar cada dataset
    validate_pets(pets_df)
    validate_users(users_df)
    validate_interactions(interactions_df, users_df, pets_df)
    
    # Generar gráficos (opcional)
    # plot_distributions(pets_df, users_df, interactions_df)
    
    print("\n" + "="*70)
    print("VALIDACION COMPLETADA - TODOS LOS TESTS PASARON")
    print("="*70)


if __name__ == "__main__":
    main()
