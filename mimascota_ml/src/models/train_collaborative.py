"""
Script para entrenar el modelo Collaborative Filtering
Usa SVD (Singular Value Decomposition) sobre interacciones usuario-mascota
"""

import pandas as pd
from pathlib import Path
import sys

# Agregar paths
sys.path.append(str(Path(__file__).parent.parent))

from models.collaborative import CollaborativeRecommender


def main():
    print("\n=== ENTRENAMIENTO: COLLABORATIVE FILTERING ===\n")
    
    # 1. Cargar interacciones sintéticas
    print("Cargando interacciones...")
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    
    try:
        interactions_df = pd.read_csv(DATA_DIR / 'synthetic_interactions.csv')
        print(f"✓ {len(interactions_df)} interacciones cargadas")
        
        # Preprocesar: calcular rating desde interacciones
        print("\nPreprocesando datos...")
        interactions_df['rating'] = (
            interactions_df['clicks_intera'] * 1 +
            interactions_df['favori_intera'] * 2 +
            interactions_df['adopti_intera'] * 5
        )
        
        # Renombrar columnas al formato esperado
        interactions_df = interactions_df.rename(columns={
            'forane_idxxxx_usuari': 'user_id',
            'forane_idxxxx_mascot': 'pet_id'
        })
        
        # Seleccionar solo columnas necesarias
        interactions_df = interactions_df[['user_id', 'pet_id', 'rating']]
        print(f"✓ Datos preprocesados: rating calculado desde interacciones")
        print(interactions_df['rating'].describe())
        
    except FileNotFoundError:
        print("❌ ERROR: No se encontró synthetic_interactions.csv")
        print("   Ejecuta primero: python src/data/generate_synthetic_data.py")
        return
    
        
    # 2. Crear y entrenar modelo
    print("\nEntrenando modelo SVD...")
    model = CollaborativeRecommender(
        n_factors=20  # 20 factores latentes
    )
    
    # Train con 80% de los datos
    model.fit(interactions_df, test_size=0.2)
    print("✓ Modelo entrenado")
    
    # 3. Guardar modelo
    print("\nGuardando modelo...")
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    model_path = MODELS_DIR / 'collaborative_model.pkl'
    model.save(model_path)
    print(f"✓ Modelo guardado\n")


if __name__ == "__main__":
    main()
