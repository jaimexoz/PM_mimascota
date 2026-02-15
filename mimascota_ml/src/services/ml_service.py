import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import numpy as np
from pathlib import Path

# Configurar paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / 'mimascota_backend' / '.env' # Asumimos estructura standard
load_dotenv(ENV_PATH)

def get_db_engine():
    """Crea motor de conexión a PostgreSQL"""
    try:
        DB_USER = os.getenv('DB_USER', 'postgres')
        DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
        DB_HOST = os.getenv('DB_HOST', 'localhost')
        DB_PORT = os.getenv('DB_PORT', '5432')
        DB_NAME = os.getenv('DB_DATABASE', 'mimascota_db')

        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        return create_engine(DATABASE_URL)
    except Exception as e:
        print(f"Error configurando DB engine: {e}")
        return None

def get_similar_synthetic_profile(preferences):
    """
    Busca perfiles sintéticos similares y retorna el vector latente promedio.
    
    Args:
        preferences (dict): {
            'especie': 'Perro'/'Gato',
            'tamano': 'grande'/'mediano'/'pequeno',
            'energia': int (1-3)
        }
        
    Returns:
        np.array: Vector latente promedio (20 dim) o None si falla
    """
    engine = get_db_engine()
    if not engine:
        return None
        
    try:
        # Construir query dinámica
        # Buscamos coincidencia exacta en especie/tamaño y cercana en energía
        sql = text("""
            SELECT latent_factor_sintet
            FROM perfil_usuarios_sintetico
            WHERE prefer_specie_sintet = :species
              AND prefer_tamano_sintet = :size
              AND ABS(prefer_energi_sintet - :energy) <= 1
            LIMIT 50
        """)
        
        with engine.connect() as conn:
            result = conn.execute(sql, {
                'species': preferences.get('especie', 'Perro'),
                'size': preferences.get('tamano', 'mediano'),
                'energy': preferences.get('energia', 2)
            })
            
            vectors = [row[0] for row in result]
            
        if not vectors:
            print(f"[ML Service] No se encontraron perfiles sintéticos similares para {preferences}")
            return None
            
        # Calcular promedio de vectores
        avg_vector = np.mean(vectors, axis=0)
        print(f"[ML Service] Encontrados {len(vectors)} perfiles similares. Usando vector promedio.")
        return avg_vector
        
    except Exception as e:
        print(f"[ML Service] Error buscando perfiles similares: {e}")
        return None
