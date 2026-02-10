"""
Modelo Collaborative Filtering: SVD Matrix Factorization
Recomienda mascotas basándose en patrones de interacciones de usuarios similares
"""

import numpy as np
import pandas as pd
from surprise import SVD, Dataset, Reader
from surprise.model_selection import train_test_split, cross_validate
from surprise import accuracy
import joblib
from pathlib import Path
from collections import defaultdict


class CollaborativeRecommender:
    """
    Sistema de recomendación colaborativa usando SVD
    Aprende de las interacciones usuario-mascota para predecir ratings
    """
    
    def __init__(self, n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02):
        """
        Args:
            n_factors: Número de factores latentes
            n_epochs: Número de épocas de entrenamiento
            lr_all: Learning rate
            reg_all: Regularización
        """
        self.model = SVD(
            n_factors=n_factors,
            n_epochs=n_epochs,
            lr_all=lr_all,
            reg_all=reg_all,
            random_state=42,
            verbose=True
        )
        self.trainset = None
        self.is_fitted = False
        self.user_ids = None
        self.pet_ids = None
    
    def prepare_data(self, interactions_df):
        """
        Prepara datos de interacciones para Surprise
        
        Args:
            interactions_df: DataFrame con columnas [user_id, pet_id, rating]
        
        Returns:
            Dataset de Surprise
        """
        # La librería Surprise requiere user_id, item_id, rating
        reader = Reader(rating_scale=(1, 5))
        
        # Crear dataset
        data = Dataset.load_from_df(
            interactions_df[['user_id', 'pet_id', 'rating']], 
            reader
        )
        
        return data
    
    def fit(self, interactions_df, test_size=0.2):
        """
        Entrena el modelo SVD con interacciones
        
        Args:
            interactions_df: DataFrame con columnas [user_id, pet_id, rating]
            test_size: Proporción de datos para testing
        
        Returns:
            dict con métricas de evaluación
        """
        print(f"🎓 Entrenando modelo Collaborative Filtering (SVD)...")
        print(f"   Interacciones totales: {len(interactions_df)}")
        
        # Preparar datos
        data = self.prepare_data(interactions_df)
        
        # Train-test split
        trainset, testset = train_test_split(data, test_size=test_size, random_state=42)
        
        print(f"   Train: {trainset.n_ratings} interacciones")
        print(f"   Test: {len(testset)} interacciones")
        
        # Entrenar modelo
        print(f"\n   Entrenando SVD...")
        self.model.fit(trainset)
        self.trainset = trainset
        
        # Evaluar en test set
        print(f"\n   Evaluando en test set...")
        predictions = self.model.test(testset)
        
        rmse = accuracy.rmse(predictions, verbose=False)
        mae = accuracy.mae(predictions, verbose=False)
        
        print(f"   ✅ RMSE: {rmse:.4f}")
        print(f"   ✅ MAE:  {mae:.4f}")
        
        # Guardar IDs únicos
        self.user_ids = set(interactions_df['user_id'])
        self.pet_ids = set(interactions_df['pet_id'])
        
        self.is_fitted = True
        
        metrics = {
            'rmse': rmse,
            'mae': mae,
            'n_train': trainset.n_ratings,
            'n_test': len(testset)
        }
        
        return metrics
    
    def predict_rating(self, user_id, pet_id):
        """
        Predice el rating que un usuario daría a una mascota
        
        Returns:
            float: Rating predicho (1-5)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting")
        
        prediction = self.model.predict(user_id, pet_id)
        return prediction.est
    
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
    
    def recommend_batch(self, user_ids, pet_candidates, n_recommendations=10):
        """
        Genera recomendaciones para múltiples usuarios
        
        Returns:
            dict: {user_id: [(pet_id, rating), ...]}
        """
        results = {}
        
        for user_id in user_ids:
            recommendations = self.recommend(user_id, pet_candidates, n_recommendations)
            results[user_id] = recommendations
        
        return results
    
    def get_top_n_for_all_users(self, n=10):
        """
        Genera top-N recomendaciones para todos los usuarios
        (útil para evaluación offline)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")
        
        # Obtener todos los items
        all_items = list(self.pet_ids)
        
        # Para cada usuario, obtener top-N
        top_n = defaultdict(list)
        
        for user_id in self.user_ids:
            # Predecir para todos los items
            user_predictions = []
            for item_id in all_items:
                pred = self.model.predict(user_id, item_id)
                user_predictions.append((item_id, pred.est))
            
            # Ordenar y tomar top-N
            user_predictions.sort(key=lambda x: x[1], reverse=True)
            top_n[user_id] = user_predictions[:n]
        
        return top_n
    
    def cross_validate(self, interactions_df, cv=5):
        """
        Realiza validación cruzada
        
        Returns:
            dict con métricas promedio
        """
        print(f"\n🔄 Realizando validación cruzada ({cv}-fold)...")
        
        data = self.prepare_data(interactions_df)
        
        results = cross_validate(
            self.model, 
            data, 
            measures=['RMSE', 'MAE'],
            cv=cv,
            verbose=True
        )
        
        avg_rmse = np.mean(results['test_rmse'])
        avg_mae = np.mean(results['test_mae'])
        
        print(f"\n   ✅ RMSE promedio: {avg_rmse:.4f}")
        print(f"   ✅ MAE promedio:  {avg_mae:.4f}")
        
        return {
            'avg_rmse': avg_rmse,
            'avg_mae': avg_mae,
            'std_rmse': np.std(results['test_rmse']),
            'std_mae': np.std(results['test_mae'])
        }
    
    def save(self, path):
        """Guarda el modelo entrenado"""
        if not self.is_fitted:
            raise ValueError("Cannot save unfitted model")
        
        joblib.dump({
            'model': self.model,
            'trainset': self.trainset,
            'user_ids': self.user_ids,
            'pet_ids': self.pet_ids
        }, path)
        print(f"✅ Modelo guardado en: {path}")
    
    def load(self, path):
        """Carga un modelo previamente entrenado"""
        data = joblib.load(path)
        self.model = data['model']
        self.trainset = data['trainset']
        self.user_ids = data['user_ids']
        self.pet_ids = data['pet_ids']
        self.is_fitted = True
        print(f"✅ Modelo cargado desde: {path}")
        return self


def main():
    """Entrena y evalúa el modelo Collaborative Filtering"""
    print("🎯 ENTRENAMIENTO DEL MODELO COLLABORATIVE FILTERING (SVD)")
    print("=" * 70)
    
    # Rutas
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    MODELS_DIR.mkdir(exist_ok=True)
    
    # 1. Cargar datos
    print("\n1️⃣ Cargando datos de interacciones...")
    interactions_df = pd.read_csv(DATA_DIR / 'interactions.csv')
    pets_df = pd.read_csv(DATA_DIR / 'pets.csv')
    
    print(f"   ✅ {len(interactions_df)} interacciones")
    print(f"   ✅ {interactions_df['user_id'].nunique()} usuarios únicos")
    print(f"   ✅ {interactions_df['pet_id'].nunique()} mascotas únicas")
    print(f"\n   📊 Distribución de ratings:")
    print(interactions_df['rating'].value_counts().sort_index())
    
    # 2. Entrenar modelo
    print("\n2️⃣ Entrenando modelo SVD...")
    model = CollaborativeRecommender(
        n_factors=50,
        n_epochs=20,
        lr_all=0.005,
        reg_all=0.02
    )
    
    metrics = model.fit(interactions_df, test_size=0.2)
    
    # 3. Validación cruzada (opcional pero recomendado)
    cv_metrics = model.cross_validate(interactions_df, cv=3)
    
    # 4. Prueba de recomendación
    print("\n3️⃣ Probando recomendaciones...")
    test_user_id = interactions_df['user_id'].iloc[0]
    
    # Obtener mascotas que el usuario NO ha interactuado
    user_interactions = interactions_df[interactions_df['user_id'] == test_user_id]['pet_id'].values
    all_pets = pets_df['pet_id'].values
    unseen_pets = [p for p in all_pets if p not in user_interactions]
    
    print(f"\n   👤 Usuario de prueba (ID: {test_user_id}):")
    print(f"      - Ya interactuó con: {len(user_interactions)} mascotas")
    print(f"      - Candidatos nuevos: {len(unseen_pets)} mascotas")
    
    # Generar recomendaciones
    recommendations = model.recommend(test_user_id, unseen_pets[:50], n_recommendations=5)
    
    print(f"\n   🐾 Top 5 Recomendaciones (mascotas no vistas):")
    for i, (pet_id, rating) in enumerate(recommendations, 1):
        pet = pets_df[pets_df['pet_id'] == pet_id].iloc[0]
        print(f"      {i}. Pet ID {int(pet_id):3d} | "
              f"Rating predicho: {rating:.2f} | "
              f"{pet['especie']:5s} | "
              f"Tamaño: {pet['tamano']:10s}")
    
    # 5. Guardar modelo
    print("\n4️⃣ Guardando modelo...")
    model_path = MODELS_DIR / 'collaborative_model.pkl'
    model.save(model_path)
    
    print("\n" + "=" * 70)
    print("✅ MODELO COLLABORATIVE FILTERING ENTRENADO Y GUARDADO")
    print("=" * 70)
    print(f"\n📊 Métricas finales:")
    print(f"   - RMSE: {metrics['rmse']:.4f}")
    print(f"   - MAE:  {metrics['mae']:.4f}")
    print(f"   - CV RMSE: {cv_metrics['avg_rmse']:.4f} ± {cv_metrics['std_rmse']:.4f}")
    print(f"\n📁 Modelo guardado en: {model_path}")
    
    return model, metrics


if __name__ == "__main__":
    model, metrics = main()
