"""
Modelo Collaborative Filtering: Matrix Factorization
Recomienda mascotas basándose en patrones de interacciones de usuarios similares
COMPATIBLE CON PYTHON 3.12 (sin scikit-surprise)
"""

import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from collections import defaultdict

sys.path.append(str(Path(__file__).parent.parent.parent))  # mimascota_ml root
sys.path.append(str(Path(__file__).parent.parent))         # src folder
sys.path.append(str(Path(__file__).parent.parent.parent / 'api')) # api folder

from database import PetDatabase



class CollaborativeRecommender:
    """
    Sistema de recomendación colaborativa usando Matrix Factorization (SVD simplificado)
    Aprende de las interacciones usuario-mascota para predecir ratings
    Compatible con Python 3.12+
    """
    
    def __init__(self, n_factors=10, n_epochs=20, lr=0.005, reg=0.1):
        """
        Args:
            n_factors: Número de factores latentes
            n_epochs: Número de épocas de entrenamiento
            lr: Learning rate
            reg: Regularización
        """
        self.n_factors = n_factors
        self.n_epochs = n_epochs
        self.lr = lr
        self.reg = reg
        
        self.user_factors = None
        self.item_factors = None
        self.user_bias = None
        self.item_bias = None
        self.global_mean = 0
   
        self.min_rating = None
        self.max_rating = None

        self.user_mapping = {}
        self.item_mapping = {}
        self.reverse_user_mapping = {}
        self.reverse_item_mapping = {}

        self.db = PetDatabase()
        
        self.is_fitted = False
    
    def _initialize_factors(self, n_users, n_items):
        """Inicializa las matrices de factores latentes"""
        np.random.seed(42)
        self.user_factors = np.random.normal(0, 0.1, (n_users, self.n_factors))
        self.item_factors = np.random.normal(0, 0.1, (n_items, self.n_factors))
        self.user_bias = np.zeros(n_users)
        self.item_bias = np.zeros(n_items)
    
    def _create_mappings(self, interactions_df):
        """Crea mapeos de IDs a índices"""
        unique_users = interactions_df['user_id'].unique()
        unique_items = interactions_df['pet_id'].unique()
        
        self.user_mapping = {uid: idx for idx, uid in enumerate(unique_users)}
        self.item_mapping = {iid: idx for idx, iid in enumerate(unique_items)}
        self.reverse_user_mapping = {idx: uid for uid, idx in self.user_mapping.items()}
        self.reverse_item_mapping = {idx: iid for iid, idx in self.item_mapping.items()}
    
    def _predict_single(self, user_idx, item_idx):
        """Predice rating para un par usuario-item"""
        prediction = (
            self.global_mean +
            self.user_bias[user_idx] +
            self.item_bias[item_idx] +
            np.dot(self.user_factors[user_idx], self.item_factors[item_idx])
        )
        return np.clip(prediction, self.min_rating, self.max_rating)
    
    def fit(self, interactions_df, test_size=0.2):
        """
        Entrena el modelo usando Gradient Descent
        
        Args:
            interactions_df: DataFrame con columnas [user_id, pet_id, rating]
            test_size: Proporción de datos para testing
        
        Returns:
            dict con métricas de evaluación
        """
        print(f"Entrenando modelo Collaborative Filtering (Matrix Factorization)...")
        print(f"   Interacciones totales: {len(interactions_df)}")
        
        # Crear mapeos
        self._create_mappings(interactions_df)
        self.interactions_df = interactions_df.copy()
    
        n_users = len(self.user_mapping)
        n_items = len(self.item_mapping)
        
        # Inicializar factores
        self._initialize_factors(n_users, n_items)
        
        # Calcular media global
        self.global_mean = interactions_df['rating'].mean()

        self.min_rating = interactions_df['rating'].min()
        self.max_rating = interactions_df['rating'].max()
        
        # Train-test split
        shuffled = interactions_df.sample(frac=1, random_state=42)
        split_idx = int(len(shuffled) * (1 - test_size))
        train_df = shuffled.iloc[:split_idx]
        test_df = shuffled.iloc[split_idx:]
        
        print(f"   Train: {len(train_df)} interacciones")
        print(f"   Test: {len(test_df)} interacciones")
        
        # Convertir a arrays
        train_users = train_df['user_id'].map(self.user_mapping).values
        train_items = train_df['pet_id'].map(self.item_mapping).values
        train_ratings = train_df['rating'].values
        
        # Entrenamiento
        print(f"\n   Entrenando por {self.n_epochs} épocas...")
        
        for epoch in range(self.n_epochs):
            # Shuffle training data
            indices = np.random.permutation(len(train_users))
            
            epoch_loss = 0
            for idx in indices:
                u = train_users[idx]
                i = train_items[idx]
                r = train_ratings[idx]
                
                # Predicción
                pred = self._predict_single(u, i)
                error = r - pred
                
                # Gradient descent updates
                self.user_bias[u] += self.lr * (error - self.reg * self.user_bias[u])
                self.item_bias[i] += self.lr * (error - self.reg * self.item_bias[i])
                
                user_factors_old = self.user_factors[u].copy()
                self.user_factors[u] += self.lr * (error * self.item_factors[i] - self.reg * self.user_factors[u])
                self.item_factors[i] += self.lr * (error * user_factors_old - self.reg * self.item_factors[i])
                
                epoch_loss += error ** 2
            
            # Progress cada 10 épocas
            if (epoch + 1) % 10 == 0:
                rmse = np.sqrt(epoch_loss / len(train_users))
                print(f"      Época {epoch + 1}/{self.n_epochs} - RMSE: {rmse:.4f}")
        
        # Evaluar en test set
        print(f"\n   Evaluando en test set...")
        test_users = test_df['user_id'].map(self.user_mapping).values
        test_items = test_df['pet_id'].map(self.item_mapping).values
        test_ratings = test_df['rating'].values
        
        predictions = []
        for u, i in zip(test_users, test_items):
            pred = self._predict_single(u, i)
            predictions.append(pred)
        
        predictions = np.array(predictions)
        errors = test_ratings - predictions
        
        rmse = np.sqrt(np.mean(errors ** 2))
        mae = np.mean(np.abs(errors))
        
        print(f"   RMSE: {rmse:.4f}")
        print(f"   MAE:  {mae:.4f}")
        
        self.is_fitted = True
        
        metrics = {
            'rmse': rmse,
            'mae': mae,
            'n_train': len(train_df),
            'n_test': len(test_df)
        }
        
        return metrics
    
    def predict_rating(self, user_id, pet_id, latent_vector=None):

        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting")

        try:
            # PRIORIDAD: si me pasan latent_vector, lo uso
            if latent_vector is not None and pet_id in self.item_mapping:
                i_idx = self.item_mapping[pet_id]
                item_vector = self.item_factors[i_idx]
                item_bias = self.item_bias[i_idx]

                dot_product = np.dot(latent_vector, item_vector)
                prediction = self.global_mean + item_bias + dot_product

                return np.clip(prediction, self.min_rating, self.max_rating)

            # Caso normal (usuario conocido sin vector nuevo)
            if user_id in self.user_mapping and pet_id in self.item_mapping:
                u_idx = self.user_mapping[user_id]
                i_idx = self.item_mapping[pet_id]
                return self._predict_single(u_idx, i_idx)

            return self.global_mean

        except Exception as e:
            print(f"Error predicting rating: {e}")
            return self.global_mean

    def get_user_interactions(self, user_id):
        """
        Obtiene interacciones reales del usuario desde la base de datos PostgreSQL
        """

        if not self.is_fitted:
            raise ValueError("Model must be fitted before retrieving interactions")

        try:
            # Método que debes tener implementado en PetDatabase
            interactions = self.db.get_user_interactions(user_id)

            if interactions is None or len(interactions) == 0:
                return []

            # Esperamos lista de dicts:
            # [{'pet_id': 10, 'rating': 4.5}, ...]

            result = [
                (row['pet_id'], row['rating'])
                for row in interactions
            ]

            return result

        except Exception as e:
            print(f"Error retrieving user interactions: {e}")
            return []

    def compute_user_vector_closed_form(self, user_interactions, reg=0.1):
        """
        Calcula el vector latente de un usuario nuevo usando solución cerrada
        (Least Squares con regularización tipo Ridge).

        Args:
            user_interactions: lista de tuplas [(pet_id, rating), ...]
            reg: lambda de regularización (default 0.1)

        Returns:
            numpy array (n_factors,) o None si no hay suficientes datos
        """

        if not self.is_fitted:
            raise ValueError("Model must be fitted before computing user vector")

        if user_interactions is None or len(user_interactions) == 0:
            return None

        Q_list = []
        r_list = []

        # Construir matriz Q y vector r'
        for pet_id, rating in user_interactions:

            if pet_id not in self.item_mapping:
                continue  # ignorar items desconocidos

            i_idx = self.item_mapping[pet_id]

            Q_i = self.item_factors[i_idx]   # vector del item
            b_i = self.item_bias[i_idx]      # bias del item

            # r' = r - μ - b_i
            r_prime = rating - self.global_mean - b_i

            Q_list.append(Q_i)
            r_list.append(r_prime)

        if len(Q_list) == 0:
            return None

        # Convertir a matrices numpy
        Q = np.vstack(Q_list)         # shape: (N, n_factors)
        r = np.array(r_list)          # shape: (N,)

        # Resolver sistema:
        # Pu = (Q^T Q + λI)^(-1) Q^T r

        A = Q.T @ Q + reg * np.eye(self.n_factors)
        b = Q.T @ r

        try:
            user_vector = np.linalg.solve(A, b)
        except np.linalg.LinAlgError:
            # fallback si matriz es singular
            user_vector = np.linalg.pinv(A) @ b

        return user_vector

    
    def recommend(self, user_id, pet_candidates, n_recommendations=10):
        """
        Genera recomendaciones para un usuario
        
        Args:
            user_id: ID del usuario
            pet_candidates: lista de IDs de mascotas candidatas
            n_recommendations: número de recomendaciones
        
        Returns:
            numpy array con (pet_id, predicted_rating)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before recommending")
        
        # Predecir rating para cada candidato
        predictions = []
        for pet_id in pet_candidates:
            pred_rating = self.predict_rating(user_id, pet_id)
            predictions.append((pet_id, pred_rating))
        
        # Ordenar por rating predicho (descendente)
        predictions.sort(key=lambda x: x[1], reverse=True)
        
        # Retornar top-N
        top_n = predictions[:n_recommendations]
        
        return np.array(top_n)
    
    def save(self, path):
        """Guarda el modelo entrenado"""
        if not self.is_fitted:
            raise ValueError("Cannot save unfitted model")
        
        data = {
            'user_factors': self.user_factors,
            'item_factors': self.item_factors,
            'user_bias': self.user_bias,
            'item_bias': self.item_bias,
            'global_mean': self.global_mean,
            'user_mapping': self.user_mapping,
            'item_mapping': self.item_mapping,
            'reverse_user_mapping': self.reverse_user_mapping,
            'reverse_item_mapping': self.reverse_item_mapping,
            'n_factors': self.n_factors,
            'min_rating': self.min_rating,
            'max_rating': self.max_rating
        }
        joblib.dump(data, path)
        print(f"Modelo guardado en: {path}")
    
    def load(self, path):
        """Carga un modelo previamente entrenado"""
        data = joblib.load(path)
        self.user_factors = data['user_factors']
        self.item_factors = data['item_factors']
        self.user_bias = data['user_bias']
        self.item_bias = data['item_bias']
        self.global_mean = data['global_mean']
        self.user_mapping = data['user_mapping']
        self.item_mapping = data['item_mapping']
        self.reverse_user_mapping = data['reverse_user_mapping']
        self.reverse_item_mapping = data['reverse_item_mapping']
        self.n_factors = data['n_factors']
        self.min_rating = data['min_rating']
        self.max_rating = data['max_rating']
        self.is_fitted = True
        print(f"Modelo cargado desde: {path}")
        return self


def main():
    """Entrena y evalúa el modelo Collaborative Filtering"""
    print("ENTRENAMIENTO DEL MODELO COLLABORATIVE FILTERING")
    print("=" * 70)
    
    # Rutas
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    MODELS_DIR.mkdir(exist_ok=True)
    
    # 1. Cargar datos
    print("\n[1] Cargando datos de interacciones...")
    interactions_df = pd.read_csv(DATA_DIR / 'synthetic_interactions.csv')
    pets_df = pd.read_csv(DATA_DIR / 'synthetic_pets.csv')
    
    # Mapear columnas al formato esperado por el modelo
    interactions_df = interactions_df.rename(columns={
        'forane_idxxxx_usuari': 'user_id',
        'forane_idxxxx_mascot': 'pet_id'
    })
    
    # Generar rating (1-5) a partir de interacciones
    # Formula: clicks (0-5) * 0.2 + favoritos (0/1) * 2.0 + adopcion (0/1) * 3.0
    interactions_df['rating'] = (
        interactions_df['clicks_intera'] * 0.4 +
        interactions_df['favori_intera'] * 2.0 +
        interactions_df['adopti_intera'] * 3.0
    )
    # Normalizar a escala 1-5
    interactions_df['rating'] = interactions_df['rating'].clip(1, 5)
    
    print(f"   OK - {len(interactions_df)} interacciones")
    print(f"   OK - {interactions_df['user_id'].nunique()} usuarios unicos")
    print(f"   OK - {interactions_df['pet_id'].nunique()} mascotas unicas")
    print(f"\n   Distribucion de ratings:")
    print(interactions_df['rating'].describe())
    
    # 2. Entrenar modelo
    print("\n[2] Entrenando modelo Collaborative Filtering...")
    model = CollaborativeRecommender(
        n_factors=10,
        n_epochs=30,
        lr=0.01,
        reg=0.1
    )
    
    metrics = model.fit(interactions_df, test_size=0.2)
    
    # 3. Prueba de recomendación
    print("\n[3] Probando recomendaciones...")
    test_user_id = interactions_df['user_id'].iloc[0]
    
    # Obtener mascotas que el usuario NO ha interactuado
    user_interactions = interactions_df[interactions_df['user_id'] == test_user_id]['pet_id'].tolist()
    all_pets = pets_df['pet_id'].values
    unseen_pets = [p for p in all_pets if p not in user_interactions]
    
    print(f"\n   Usuario de prueba (ID: {test_user_id}):")
    print(f"      - Ya interactuo con: {len(user_interactions)} mascotas")
    print(f"      - Candidatos nuevos: {len(unseen_pets)} mascotas")
    
    # Generar recomendaciones
    recommendations = model.recommend(test_user_id, unseen_pets[:50], n_recommendations=5)
    
    print(f"\n   Top 5 Recomendaciones (mascotas no vistas):")
    for i, (pet_id, rating) in enumerate(recommendations, 1):
        pet = pets_df[pets_df['pet_id'] == pet_id].iloc[0]
        print(f"      {i}. Pet ID {int(pet_id):3d} | "
              f"Rating predicho: {rating:.2f} | "
              f"{pet['especie']:5s} | "
              f"Tamano: {pet['tamano']:10s}")
    
    # 4. Guardar modelo
    print("\n[4] Guardando modelo...")
    model_path = MODELS_DIR / 'collaborative_model.pkl'
    model.save(model_path)
    
    print("\n" + "=" * 70)
    print("MODELO COLLABORATIVE FILTERING ENTRENADO Y GUARDADO")
    print("=" * 70)
    print(f"\nMetricas finales:")
    print(f"   - RMSE: {metrics['rmse']:.4f}")
    print(f"   - MAE:  {metrics['mae']:.4f}")
    print(f"\nModelo guardado en: {model_path}")
    
    return model, metrics


if __name__ == "__main__":
    model, metrics = main()
