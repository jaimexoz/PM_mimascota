"""
Script para entrenar el modelo mejorado con NLP
Usa datos sintéticos para entrenar procesadores,
luego funciona con mascotas reales de PostgreSQL
"""

import pandas as pd
from pathlib import Path
import sys

# Agregar paths
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / 'api'))

from models.content_based_enhanced import EnhancedDynamicRecommender


def main():
    print("\n=== ENTRENAMIENTO: CONTENT-BASED ENHANCED ===\n")
    
    # 1. Cargar datos sintéticos para entrenar procesadores
    print("Cargando datos de entrenamiento...")
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    
    try:
        pets_df = pd.read_csv(DATA_DIR / 'synthetic_pets.csv')
        print(f"✓ {len(pets_df)} mascotas cargadas")
    except FileNotFoundError:
        print("   ERROR - No se encontró synthetic_pets.csv")
        print("   Creando datos de ejemplo...")
        
        # Crear datos mínimos de ejemplo
        pets_df = pd.DataFrame({
            'pet_id': range(1, 21),
            'nombre': [f'Mascota{i}' for i in range(1, 21)],
            'especie': ['Perro', 'Gato'] * 10,
            'tamano': ['pequeno', 'mediano', 'grande'] * 6 + ['pequeno', 'mediano'],
            'edad_meses': [6, 12, 24, 36, 48, 60, 72, 8, 18, 30] * 2,
            'nivel_energia': ['tranquilo', 'moderado', 'energetico'] * 6 + ['tranquilo', 'moderado'],
            'personalidad': ['amigable,jugueton', 'tranquilo,carinoso'] * 10,
            'informacion_adicional': [
                'Mascota muy activa y juguetona',
                'Gato tranquilo ideal para apartamento',
                'Perro grande que necesita espacio',
                'Pequeña mascota perfecta para familias',
                'Energético y le encanta correr'
            ] * 4
        })
        print(f"   OK - Creados {len(pets_df)} registros de ejemplo")
    
    # 2. Crear y entrenar modelo
    print("\nEntrenando modelo...")
    model = EnhancedDynamicRecommender(
        size_weight=1.5,
        age_weight=1.0,
        text_weight=2.0,
        energy_weight=1.5,
        personality_weight=1.5
    )
    
    model.fit(pets_df)
    print("✓ Modelo entrenado")
    
    # 3. Guardar modelo
    print("\nGuardando modelo...")
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    model_path = MODELS_DIR / 'content_based_enhanced.pkl'
    model.save(model_path)
    print(f"✓ Modelo guardado\n")


if __name__ == "__main__":
    main()
