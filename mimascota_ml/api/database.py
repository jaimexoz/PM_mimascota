"""
Módulo de conexión a PostgreSQL
Usa las mismas variables de entorno que el backend Node.js
"""

import psycopg2
import pandas as pd
import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno desde el .env del backend
backend_env = Path(__file__).parent.parent.parent / 'mimascota_backend' / '.env'
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
    print(f"Cargando .env desde: {backend_env}")
else:
    # Intentar cargar desde la raíz del proyecto ML
    load_dotenv()
    print("Cargando .env desde variables de entorno del sistema")


class PetDatabase:
    """Conexión a PostgreSQL para consultar mascotas en tiempo real"""
    
    def __init__(self):
        """Lee configuración desde variables de entorno (mismas que Node.js)"""
        self.config = {
            "host": os.getenv('DB_HOST', 'localhost'),
            "database": os.getenv('DB_DATABASE'),
            "user": os.getenv('DB_USER'),
            "password": os.getenv('DB_PASSWORD'),
            "port": int(os.getenv('DB_PORT', 5432))
        }
        
        # Validar configuración
        missing = [k for k, v in self.config.items() if v is None and k != 'password']
        if missing:
            raise ValueError(f"Faltan variables de entorno: {', '.join(missing)}")
    
    def get_available_pets(self):
        """
        Obtiene mascotas disponibles con sus personalidades
        
        Returns:
            DataFrame con columnas: pet_id, nombre, especie, tamano, 
                                   edad_meses, nivel_energia, personalidad
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            
            query = """
            SELECT 
                m.idxxxx_mascot as pet_id,
                m.nombre_mascot as nombre,
                m.especi_mascot as especie,
                m.tamano_mascot as tamano,
                m.edadme_mascot as edad_meses,
                m.nenerg_mascot as nivel_energia,
                COALESCE(STRING_AGG(c.nombre_caract, ','), '') as personalidad
            FROM mascotas m
            LEFT JOIN mascota_caracteristicas mc ON m.idxxxx_mascot = mc.forane_mascot_id
            LEFT JOIN caracteristicas c ON mc.forane_caract_id = c.idxxxx_caract
            WHERE m.status_mascot = 'Disponible'
            GROUP BY m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, 
                     m.tamano_mascot, m.edadme_mascot, m.nenerg_mascot
            ORDER BY m.idxxxx_mascot
            """
            
            pets_df = pd.read_sql_query(query, conn)
            
            # Validar y limpiar datos
            pets_df['personalidad'] = pets_df['personalidad'].fillna('')
            
            # Asegurar tipos correctos
            pets_df['pet_id'] = pets_df['pet_id'].astype(int)
            pets_df['edad_meses'] = pets_df['edad_meses'].astype(int)
            
            return pets_df
            
        except psycopg2.Error as e:
            raise Exception(f"Error consultando base de datos: {e}")
        finally:
            if conn:
                conn.close()

    def get_user_interactions(self, user_id):
        """
        Obtiene interacciones del usuario y las transforma en rating numérico
        """

        conn = None
        try:
            conn = psycopg2.connect(**self.config)

            query = """
                SELECT 
                    forane_idxxxx_mascot,
                    clicks_intera,
                    favori_intera,
                    adopti_intera
                FROM interacciones
                WHERE forane_idxxxx_usuari = %s
            """

            with conn.cursor() as cursor:
                cursor.execute(query, (user_id,))
                rows = cursor.fetchall()

            interactions = []

            for row in rows:
                pet_id = row[0]
                clicks = row[1] or 0
                favoritos = row[2] or 0
                adoptado = row[3] or 0

                # Convertir a rating ponderado
                rating = 0

                if clicks > 0:
                    rating += 1

                if favoritos > 0:
                    rating += 3

                if adoptado > 0:
                    rating += 5

                # Solo agregar si hay señal real
                if rating > 0:
                    interactions.append({
                        'pet_id': int(pet_id),
                        'rating': float(rating)
                    })

            return interactions

        except Exception as e:
            raise Exception(f"Error obteniendo interacciones del usuario: {e}")

        finally:
            if conn:
                conn.close()
    
    def test_connection(self):
        """
        Prueba la conexión a la BD
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            conn = psycopg2.connect(**self.config)
            cursor = conn.cursor()
            
            # Probar query simple
            cursor.execute("SELECT COUNT(*) FROM mascotas")
            total_count = cursor.fetchone()[0]
            
            # Contar disponibles
            cursor.execute("SELECT COUNT(*) FROM mascotas WHERE status_mascot = 'Disponible'")
            available_count = cursor.fetchone()[0]
            
            conn.close()
            
            message = f"Conectado exitosamente. {available_count} mascotas disponibles de {total_count} totales."
            return True, message
            
        except Exception as e:
            return False, str(e)
    
    def get_pet_by_id(self, pet_id):
        """
        Obtiene una mascota específica por ID
        
        Args:
            pet_id: ID de la mascota
        
        Returns:
            dict con datos de la mascota o None si no existe
        """
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            
            query = """
            SELECT 
                m.idxxxx_mascot as pet_id,
                m.nombre_mascot as nombre,
                m.especi_mascot as especie,
                m.tamano_mascot as tamano,
                m.edadme_mascot as edad_meses,
                m.nenerg_mascot as nivel_energia,
                COALESCE(STRING_AGG(c.nombre_caract, ','), '') as personalidad
            FROM mascotas m
            LEFT JOIN mascota_caracteristicas mc ON m.idxxxx_mascot = mc.forane_mascot_id
            LEFT JOIN caracteristicas c ON mc.forane_caract_id = c.idxxxx_caract
            WHERE m.idxxxx_mascot = %s
            GROUP BY m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, 
                     m.tamano_mascot, m.edadme_mascot, m.nenerg_mascot
            """
            
            pets_df = pd.read_sql_query(query, conn, params=(pet_id,))
            
            if len(pets_df) == 0:
                return None
            
            return pets_df.iloc[0].to_dict()
            
        except Exception as e:
            raise Exception(f"Error consultando mascota: {e}")
        finally:
            if conn:
                conn.close()


if __name__ == "__main__":
    """Prueba de conexión"""
    print("="*70)
    print("PRUEBA DE CONEXION A POSTGRESQL")
    print("="*70)
    
    try:
        db = PetDatabase()
        print(f"\nConfiguracion:")
        print(f"  Host: {db.config['host']}")
        print(f"  Database: {db.config['database']}")
        print(f"  User: {db.config['user']}")
        print(f"  Port: {db.config['port']}")
        
        success, message = db.test_connection()
        print(f"\n{message}")
        
        if success:
            print("\nConsultando mascotas disponibles...")
            pets = db.get_available_pets()
            print(f"OK - {len(pets)} mascotas disponibles")
            
            if len(pets) > 0:
                print("\nPrimera mascota:")
                print(pets.iloc[0])
        
    except Exception as e:
        print(f"\nERROR: {e}")
