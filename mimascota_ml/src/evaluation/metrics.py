"""
Funciones de evaluación para sistemas de recomendación
"""

import numpy as np
from sklearn.metrics import ndcg_score, roc_auc_score, precision_recall_curve, roc_curve
from typing import List, Tuple


def precision_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
    """
    Precision@K: Proporción de items relevantes en las top-K recomendaciones
    
    Args:
        recommended: Lista de IDs recomendados (ordenados por score)
        relevant: Lista de IDs relevantes (ground truth)
        k: Número de recomendaciones a considerar
    
    Returns:
        float: Precision@K value (0-1)
    """
    if k == 0:
        return 0.0
    
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    
    hits = sum(1 for item in recommended_k if item in relevant_set)
    
    return hits / k


def recall_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
    """
    Recall@K: Proporción de items relevantes capturados en top-K
    
    Args:
        recommended: Lista de IDs recomendados (ordenados por score)
        relevant: Lista de IDs relevantes (ground truth)
        k: Número de recomendaciones a considerar
    
    Returns:
        float: Recall@K value (0-1)
    """
    if len(relevant) == 0:
        return 0.0
    
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    
    hits = sum(1 for item in recommended_k if item in relevant_set)
    
    return hits / len(relevant_set)


def average_precision_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
    """
    Average Precision@K: Promedio de precision en cada posición relevante
    
    Args:
        recommended: Lista de IDs recomendados
        relevant: Lista de IDs relevantes
        k: Número de recomendaciones a considerar
    
    Returns:
        float: AP@K value (0-1)
    """
    if len(relevant) == 0:
        return 0.0
    
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    
    score = 0.0
    num_hits = 0.0
    
    for i, item in enumerate(recommended_k):
        if item in relevant_set:
            num_hits += 1.0
            score += num_hits / (i + 1.0)
    
    if num_hits == 0:
        return 0.0
    
    return score / min(len(relevant_set), k)


def mean_average_precision(all_recommended: List[List[int]], 
                           all_relevant: List[List[int]], 
                           k: int = 10) -> float:
    """
    MAP@K: Promedio de AP@K sobre todos los usuarios
    
    Args:
        all_recommended: Lista de listas de recomendaciones por usuario
        all_relevant: Lista de listas de items relevantes por usuario
        k: Número de recomendaciones a considerar
    
    Returns:
        float: MAP@K value (0-1)
    """
    if len(all_recommended) == 0:
        return 0.0
    
    ap_scores = [
        average_precision_at_k(rec, rel, k) 
        for rec, rel in zip(all_recommended, all_relevant)
    ]
    
    return np.mean(ap_scores)


def ndcg_at_k(recommended: List[int], relevant: List[int], k: int = 10) -> float:
    """
    NDCG@K: Normalized Discounted Cumulative Gain
    Considera el orden de las recomendaciones (mejores arriba = mejor score)
    
    Args:
        recommended: Lista de IDs recomendados
        relevant: Lista de IDs relevantes
        k: Número de recomendaciones a considerar
    
    Returns:
        float: NDCG@K value (0-1)
    """
    if len(relevant) == 0:
        return 0.0
    
    recommended_k = recommended[:k]
    relevant_set = set(relevant)
    
    # Crear relevance scores (1 si está en relevant, 0 si no)
    relevance = [1 if item in relevant_set else 0 for item in recommended_k]
    
    # Ideal relevance (todos los relevantes primero)
    ideal_relevance = sorted(relevance, reverse=True)
    
    # Usar sklearn's ndcg_score
    # Necesita formato 2D
    try:
        score = ndcg_score([ideal_relevance], [relevance])
        return score
    except:
        # Si falla (ej: todos 0s), retornar 0
        return 0.0


def mean_ndcg(all_recommended: List[List[int]], 
              all_relevant: List[List[int]], 
              k: int = 10) -> float:
    """
    Promedio de NDCG@K sobre todos los usuarios
    
    Args:
        all_recommended: Lista de listas de recomendaciones
        all_relevant: Lista de listas de items relevantes
        k: Número de recomendaciones
    
    Returns:
        float: Mean NDCG@K (0-1)
    """
    if len(all_recommended) == 0:
        return 0.0
    
    ndcg_scores = [
        ndcg_at_k(rec, rel, k) 
        for rec, rel in zip(all_recommended, all_relevant)
    ]
    
    return np.mean(ndcg_scores)


def compute_roc_auc(y_true: np.ndarray, y_scores: np.ndarray) -> Tuple[float, np.ndarray, np.ndarray]:
    """
    Calcula ROC-AUC para clasificación binaria
    
    Args:
        y_true: Array de labels verdaderos (0/1)
        y_scores: Array de scores predichos (0-1)
    
    Returns:
        tuple: (auc_score, fpr, tpr)
    """
    # Calcular ROC curve
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    
    # Calcular AUC
    auc = roc_auc_score(y_true, y_scores)
    
    return auc, fpr, tpr


def compute_precision_recall_curve(y_true: np.ndarray, 
                                   y_scores: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Calcula Precision-Recall curve
    
    Args:
        y_true: Array de labels verdaderos (0/1)
        y_scores: Array de scores predichos
    
    Returns:
        tuple: (precision, recall, thresholds)
    """
    precision, recall, thresholds = precision_recall_curve(y_true, y_scores)
    
    return precision, recall, thresholds


def catalog_coverage(all_recommendations: List[List[int]], total_items: int) -> float:
    """
    Calcula cobertura del catálogo (Content-Based métrica)
    
    Mide qué porcentaje del catálogo total puede ser recomendado.
    100% = puede recomendar todas las mascotas
    
    Args:
        all_recommendations: lista de listas [[pet_id, ...], ...]
        total_items: número total de mascotas en el catálogo
    
    Returns:
        float: porcentaje de cobertura (0-100)
    """
    unique_recommended = set()
    for recs in all_recommendations:
        unique_recommended.update(recs)
    
    coverage = (len(unique_recommended) / total_items) * 100
    return coverage


def recommendation_diversity(all_recommendations: List[List[int]]) -> float:
    """
    Calcula diversidad entre usuarios (Content-Based métrica)
    
    Mide qué tan diferentes son las recomendaciones entre usuarios.
    1.0 = cada usuario recibe recomendaciones completamente diferentes
    0.0 = todos reciben las mismas recomendaciones
    
    Formula: 1 - promedio(Jaccard Similarity entre pares de listas)
    
    Args:
        all_recommendations: lista de listas [[pet_id, ...], ...]
    
    Returns:
        float: diversidad (0-1)
    """
    from itertools import combinations
    
    if len(all_recommendations) < 2:
        return 0.0
    
    jaccard_sims = []
    for list_a, list_b in combinations(all_recommendations, 2):
        set_a = set(list_a)
        set_b = set(list_b)
        
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        
        if union > 0:
            jaccard = intersection / union
            jaccard_sims.append(jaccard)
    
    if len(jaccard_sims) == 0:
        return 0.0
    
    avg_jaccard = np.mean(jaccard_sims)
    diversity = 1 - avg_jaccard
    
    return diversity


if __name__ == "__main__":
    # Ejemplo de uso
    print("="*70)
    print("EJEMPLO DE USO DE METRICAS")
    print("="*70)
    
    # Datos de ejemplo
    recommended = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    relevant = [2, 5, 8, 12]
    
    print("\nRecomendaciones:", recommended[:5])
    print("Relevantes:", relevant)
    
    # Calcular métricas
    p_at_5 = precision_at_k(recommended, relevant, k=5)
    r_at_5 = recall_at_k(recommended, relevant, k=5)
    ap_at_5 = average_precision_at_k(recommended, relevant, k=5)
    ndcg_5 = ndcg_at_k(recommended, relevant, k=5)
    
    print(f"\nPrecision@5: {p_at_5:.3f}")
    print(f"Recall@5: {r_at_5:.3f}")
    print(f"AP@5: {ap_at_5:.3f}")
    print(f"NDCG@5: {ndcg_5:.3f}")
