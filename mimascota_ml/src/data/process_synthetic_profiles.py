"""
Script para procesar perfiles de usuarios sintéticos (Reverse Labeling)
Entrena un modelo SVD y genera preferencias inferidas basadas en interacciones.
Guarda los resultados en la tabla 'perfil_usuarios_sintetico'.
"""
import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path
from surprise import Dataset, Reader, SVD
from sqlalchemy import create_engine, text
from sqlalchemy import types
from dotenv import load_dotenv

# Configurar paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Intentar cargar .env desde backend
ENV_PATH = BASE_DIR.parent / 'mimascota_backend' / '.env'
load_dotenv(ENV_PATH)

print(f"Buscando .env en: {ENV_PATH}")
print(f"Variables cargadas: User={os.getenv('DB_USER')}, DB={os.getenv('DB_DATABASE')}")

# Configuración DB
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_DATABASE', 'mimascota_db') # Nota: .env usa DB_DATABASE

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_db_engine():
    return create_engine(DATABASE_URL)

def load_data():
    """Carga datos raw"""
    print("Cargando CSVs...")
    # Ajustar paths relatios a BASE_DIR
    pets_path = BASE_DIR / 'mimascota_ml' / 'data' / 'raw' / 'synthetic_pets.csv'
    interactions_path = BASE_DIR / 'mimascota_ml' / 'data' / 'raw' / 'synthetic_interactions.csv'
    
    # Si BASE_DIR ya incluye mimascota_ml, ajustar
    if 'mimascota_ml' in str(BASE_DIR) and str(BASE_DIR).endswith('mimascota_ml'):
        pets_path = BASE_DIR / 'data' / 'raw' / 'synthetic_pets.csv'
        interactions_path = BASE_DIR / 'data' / 'raw' / 'synthetic_interactions.csv'
    
    pets = pd.read_csv(pets_path, encoding='latin-1')
    interactions = pd.read_csv(interactions_path, encoding='latin-1')
    
    return pets, interactions

def process_data(pets, interactions):
    """Procesa y mergea datos"""
    print("Procesando datos...")
    
    # 1. Merge
    # Left Merge de interacciones con mascotas
    df = pd.merge(
        interactions, 
        pets, 
        left_on='forane_idxxxx_mascot', 
        right_on='pet_id', 
        how='left'
    )
    
    # 2. Mapeo de Energía
    energy_map = {
        'tranquilo': 1,
        'moderado': 2,
        'energetico': 3
    }
    # Manejar posibles valores nulos o desconocidos
    df['nivel_energia_num'] = df['nivel_energia'].map(energy_map).fillna(2) # Default moderado
    
    # 3. Cálculo de Rating
    # (clicks * 1) + (favori * 3) + (adopti * 5)
    df['rating'] = (
        df['clicks_intera'] * 1 + 
        df['favori_intera'] * 3 + 
        df['adopti_intera'] * 5
    )
    
    return df

def train_svd(df):
    """Entrena modelo SVD y retorna algoritmo entrenado"""
    print("Entrenando SVD...")
    
    # Definir rango de rating
    min_r = df['rating'].min()
    max_r = df['rating'].max()
    reader = Reader(rating_scale=(min_r, max_r))
    
    # Cargar en Surprise
    data = Dataset.load_from_df(
        df[['forane_idxxxx_usuari', 'forane_idxxxx_mascot', 'rating']], 
        reader
    )
    
    trainset = data.build_full_trainset()
    algo = SVD(n_factors=10, random_state=42) # Changed n_factors from 10 to 10
    algo.fit(trainset)
    
    return algo, trainset

def infer_preferences(df, algo, trainset):
    """Infiere preferencias de usuarios (Reverse Labeling)"""
    print("Infiriendo preferencias...")
    
    profiles = []
    
    # Agrupar por usuario
    grouped = df.groupby('forane_idxxxx_usuari')
    
    for user_id, group in grouped:
        # A. Inferencia de características (Reverse Labeling)
        # Filtrar interacciones relevantes (rating > 2 implica cierto interés, ej: 3 clicks o 1 fav)
        # También podríamos usar todas ponderadas, pero el filtro limpia ruido.
        relevant = group[group['rating'] >= 3]
        
        if len(relevant) == 0:
            relevant = group # Fallback a todo si no hay interactions fuertes
            
        # Moda de Especie
        try:
            pref_specie = relevant['especie'].mode().iloc[0]
        except:
            pref_specie = 'Desconocido'
            
        # Moda de Tamaño
        try:
            pref_tamano = relevant['tamano'].mode().iloc[0]
        except:
            pref_tamano = 'mediano'
            
        # Promedio de Energía
        pref_energia = int(round(relevant['nivel_energia_num'].mean()))
        
        # B. Factor Latente SVD
        # Convertir raw user id a inner id
        try:
            inner_uid = trainset.to_inner_uid(user_id)
            latent_vector = algo.pu[inner_uid].tolist() # Convertir numpy array a lista
        except ValueError:
            # Usuario no estaba en training set (raro aquí pq usamos full dataset)
            latent_vector = [0.0] * 20
            
        profiles.append({
            'idxxxx_usuari_sintet': int(user_id),
            'prefer_specie_sintet': pref_specie,
            'prefer_tamano_sintet': pref_tamano,
            'prefer_energi_sintet': pref_energia,
            'latent_factor_sintet': latent_vector
        })
        
    return pd.DataFrame(profiles)

def save_to_db(profiles_df):
    """Guarda en PostgreSQL"""
    print("Guardando en base de datos...")
    engine = get_db_engine()
    
    # SQL para crear la tabla si no existe
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS perfil_usuarios_sintetico (
        idxxxx_usuari_sintet INTEGER PRIMARY KEY,
        prefer_specie_sintet TEXT,
        prefer_tamano_sintet TEXT,
        prefer_energi_sintet INTEGER,
        latent_factor_sintet FLOAT8[]
    );
    CREATE INDEX IF NOT EXISTS idx_perfil_sintet_specie ON perfil_usuarios_sintetico(prefer_specie_sintet);
    CREATE INDEX IF NOT EXISTS idx_perfil_sintet_tamano ON perfil_usuarios_sintetico(prefer_tamano_sintet);
    """
    
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        conn.execute(text("TRUNCATE TABLE perfil_usuarios_sintetico"))
    
    profiles_df.to_sql(
        'perfil_usuarios_sintetico',
        engine,
        if_exists='append',
        index=False,
        dtype={
            'latent_factor_sintet': types.ARRAY(types.FLOAT)
        }
    )
    print(f"Guardados {len(profiles_df)} perfiles.")

def main():
    try:
        pets, interactions = load_data()
        df = process_data(pets, interactions)
        algo, trainset = train_svd(df)
        profiles_df = infer_preferences(df, algo, trainset)
        save_to_db(profiles_df)
        print("Proceso completado exitosamente.")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
