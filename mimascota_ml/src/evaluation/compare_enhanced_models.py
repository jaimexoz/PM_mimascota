"""
Evaluación Comparativa de los Modelos MEJORADOS
Genera gráficas comparativas: Content-Based Enhanced vs Collaborative vs Híbrido Enhanced
Sigue el mismo esquema que compare_models.py
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Agregar paths
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / 'api'))

from evaluation.metrics import (
    precision_at_k, recall_at_k, average_precision_at_k,
    ndcg_at_k, compute_roc_auc,
    catalog_coverage, recommendation_diversity,  # Nuevas métricas Content-Based
    compute_precision_recall_curve
)
from models.content_based_enhanced import EnhancedDynamicRecommender
from models.collaborative import CollaborativeRecommender
from models.hybrid_enhanced import EnhancedHybridRecommender

# Configurar estilo
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)


def load_data():
    """Carga datos sintéticos y los divide en train/test (80/20)"""
    DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'raw'
    
    pets_df = pd.read_csv(DATA_DIR / 'synthetic_pets.csv')
    users_df = pd.read_csv(DATA_DIR /'synthetic_users.csv')
    interactions_df = pd.read_csv(DATA_DIR / 'synthetic_interactions.csv')
    
    # Split 80/20 para train/test
    from sklearn.model_selection import train_test_split
    
    # Dividir interacciones por usuario para mantener consistencia
    train_users, test_users = train_test_split(
        users_df,
        test_size=0.2,
        random_state=42
    )
    
    train_user_ids = set(train_users['user_id'])
    test_user_ids = set(test_users['user_id'])
    
    # Separar interacciones según split de usuarios
    train_interactions = interactions_df[
        interactions_df['forane_idxxxx_usuari'].isin(train_user_ids)
    ]
    test_interactions = interactions_df[
        interactions_df['forane_idxxxx_usuari'].isin(test_user_ids)
    ]
    
    return {
        'pets': pets_df,
        'train_users': train_users,
        'test_users': test_users,
        'train_interactions': train_interactions,
        'test_interactions': test_interactions
    }


def get_relevant_pets(user_id, interactions_df, min_interactions=1):
    """Obtiene mascotas relevantes para un usuario"""
    user_interactions = interactions_df[interactions_df['forane_idxxxx_usuari'] == user_id]
    
    pet_counts = {}
    for _, row in user_interactions.iterrows():
        pet_id = row['forane_idxxxx_mascot']
        interactions = (row['clicks_intera'] + 
                       row['favori_intera'] * 2 + 
                       row['adopti_intera'] * 5)
        
        if interactions >= min_interactions:
            pet_counts[pet_id] = pet_counts.get(pet_id, 0) + interactions
    
    return list(pet_counts.keys())


def evaluate_single_model(model, model_name, pets_df, users_df, interactions_df, k_values=[5, 10, 15, 20]):
    """Evalúa un modelo individual"""
    print(f"\n[Evaluando {model_name}...]")
    
    # Métricas
    all_precisions = {k: [] for k in k_values}
    all_recalls = {k: [] for k in k_values}
    all_ndcgs = {k: [] for k in k_values}
    all_aps = {k: [] for k in k_values}
    
    users_evaluated = 0
    
    for idx, user_row in users_df.iterrows():
        if 'idxxxx_usuari' in user_row:
            user_id = user_row['idxxxx_usuari']
        else:
            user_id = user_row.get('user_id', idx + 1)
        
        user_profile = user_row.to_dict()
        relevant_pets = get_relevant_pets(user_id, interactions_df)
        
        if len(relevant_pets) == 0:
            continue
        
        # Generar recomendaciones según el tipo de modelo
        try:
            if model_name == "Collaborative":
                # Modelo collaborative necesita user_id y lista de candidatos
                candidate_pets = pets_df['pet_id'].tolist()
                recommendations = model.recommend(
                    user_id=user_id,
                    pet_candidates=candidate_pets,
                    n_recommendations=max(k_values)
                )
            elif "Hybrid" in model_name:
                # Modelo híbrido enhanced
                recommendations_array = model.recommend(
                    user_profile=user_profile,
                    user_id=user_id,
                    n_recommendations=max(k_values),
                    use_db=False,
                    pets_df=pets_df
                )
                # Hybrid retorna array con [pet_id, hybrid_score, content_score, collab_score]
                recommendations = [(int(row[0]), float(row[1])) for row in recommendations_array]
            else:  # Content-Based Enhanced
                recommendations = model.recommend(
                    user_profile=user_profile,
                    n_recommendations=max(k_values),
                    use_db=False,
                    pets_df=pets_df
                )
            
            recommended_ids = [int(pet_id) for pet_id, score in recommendations]
            recommended_scores = {int(pet_id): float(score) for pet_id, score in recommendations}
            
        except Exception as e:
            print(f"  Error con usuario {user_id}: {e}")
            continue
        
        # Calcular métricas
        for k in k_values:
            all_precisions[k].append(precision_at_k(recommended_ids, relevant_pets, k))
            all_recalls[k].append(recall_at_k(recommended_ids, relevant_pets, k))
            all_ndcgs[k].append(ndcg_at_k(recommended_ids, relevant_pets, k))
            all_aps[k].append(average_precision_at_k(recommended_ids, relevant_pets, k))
        
        users_evaluated += 1
    
    print(f"  OK - {users_evaluated} usuarios evaluados")
    
    # Resultados
    results = {
        'model_name': model_name,
        'k_values': k_values,
        'precision_at_k': [np.mean(all_precisions[k]) for k in k_values],
        'recall_at_k': [np.mean(all_recalls[k]) for k in k_values],
        'ndcg_at_k': [np.mean(all_ndcgs[k]) for k in k_values],
        'map_at_k': [np.mean(all_aps[k]) for k in k_values],
    }
    
    # Métricas específicas de Content-Based
    if "Content" in model_name:
        print(f"\n  Calculando métricas específicas Content-Based...")
        
        # Generar recomendaciones para TODOS los usuarios (para Coverage y Diversity)
        all_recommendations = []
        for _, user in users_df.iterrows():
            try:
                user_dict = user.to_dict()
                recs = model.recommend(user_dict, n_recommendations=10, use_db=False, pets_df=pets_df)
                rec_ids = [int(pid) for pid, _ in recs]
                all_recommendations.append(rec_ids)
            except:
                continue
        
        # Coverage: % del catálogo recomendado
        coverage = catalog_coverage(all_recommendations, len(pets_df))
        
        # Diversity: qué tan diferentes son las recomendaciones entre usuarios
        diversity = recommendation_diversity(all_recommendations)
        
        results['coverage'] = coverage
        results['diversity'] = diversity
        
        print(f"    Coverage: {coverage:.1f}%")
        print(f"    Diversity: {diversity:.3f}")
    
    return results


def plot_comparative_precision_recall(all_results, save_path):
    """Gráfica comparativa de Precision@K y Recall@K"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    markers = ['o', 's', 'D']
    
    # Precision@K
    for i, results in enumerate(all_results):
        ax1.plot(results['k_values'], results['precision_at_k'], 
                marker=markers[i], linewidth=2, markersize=8,
                color=colors[i], label=results['model_name'])
    
    ax1.set_xlabel('K (Número de Recomendaciones)', fontsize=12)
    ax1.set_ylabel('Precision@K', fontsize=12)
    ax1.set_title('Comparación: Precision@K', fontsize=14, fontweight='bold')
    ax1.legend(fontsize=11)
    ax1.grid(True, alpha=0.3)
    ax1.set_ylim([0, max(max(r['precision_at_k']) for r in all_results) * 1.1])
    
    # Recall@K
    for i, results in enumerate(all_results):
        ax2.plot(results['k_values'], results['recall_at_k'], 
                marker=markers[i], linewidth=2, markersize=8,
                color=colors[i], label=results['model_name'])
    
    ax2.set_xlabel('K (Número de Recomendaciones)', fontsize=12)
    ax2.set_ylabel('Recall@K', fontsize=12)
    ax2.set_title('Comparación: Recall@K', fontsize=14, fontweight='bold')
    ax2.legend(fontsize=11)
    ax2.grid(True, alpha=0.3)
    ax2.set_ylim([0, max(max(r['recall_at_k']) for r in all_results) * 1.1])
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Guardado: {save_path}")
    plt.close()


def plot_comparative_ndcg(all_results, save_path):
    """Gráfica comparativa de NDCG@K"""
    fig, ax = plt.subplots(figsize=(12, 7))
    
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    markers = ['o', 's', 'D']
    
    for i, results in enumerate(all_results):
        ax.plot(results['k_values'], results['ndcg_at_k'], 
                marker=markers[i], linewidth=2.5, markersize=9,
                color=colors[i], label=results['model_name'])
        ax.fill_between(results['k_values'], results['ndcg_at_k'], 
                        alpha=0.1, color=colors[i])
    
    ax.set_xlabel('K (Número de Recomendaciones)', fontsize=12)
    ax.set_ylabel('NDCG@K', fontsize=12)
    ax.set_title('Comparación: NDCG@K (Calidad de Ranking)', fontsize=14, fontweight='bold')
    ax.legend(fontsize=11, loc='lower right')
    ax.grid(True, alpha=0.3)
    ax.set_ylim([0, 1.05])
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Guardado: {save_path}")
    plt.close()


def plot_metrics_comparison_table(all_results, save_path):
    """Tabla comparativa de métricas principales"""
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.axis('tight')
    ax.axis('off')
    
    # Datos para la tabla
    metrics_data = []
    for results in all_results:
        row = [
            results['model_name'],
            f"{results['precision_at_k'][0]:.3f}",  # P@5
            f"{results['precision_at_k'][1]:.3f}",  # P@10
            f"{results['recall_at_k'][1]:.3f}",      # R@10
            f"{results['ndcg_at_k'][1]:.3f}",        # NDCG@10
        ]
        metrics_data.append(row)
    
    columns = ['Modelo', 'P@5', 'P@10', 'R@10', 'NDCG@10']
    
    # Crear tabla
    table = ax.table(cellText=metrics_data, colLabels=columns,
                    cellLoc='center', loc='center',
                    colColours=['#ecf0f1']*5,
                    cellColours=[['#ffffff']*5]*len(metrics_data))
    
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1, 2.5)
    
    # Colorear primera columna
    for i in range(len(metrics_data)):
        table[(i+1, 0)].set_facecolor('#ecf0f1')
        table[(i+1, 0)].set_text_props(weight='bold')
    
    # Título
    plt.title('Resumen Comparativo de Métricas - MODELOS MEJORADOS', fontsize=14, fontweight='bold', pad=20)
    
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Guardado: {save_path}")
    plt.close()


def plot_content_based_metrics(results, save_path):
    """Gráfica de métricas específicas Content-Based: Coverage y Diversity"""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    metrics_names = ['Coverage (%)', 'Diversity (0-1)']
    metrics_values = [
        results['coverage'],
        results['diversity'] * 100  # Escalar a 0-100 para visualización
    ]
    
    colors = ['#3498db', '#2ecc71']
    bars = ax.bar(metrics_names, metrics_values, color=colors, alpha=0.7, 
                   edgecolor='black', linewidth=2, width=0.5)
    
    # Etiquetas encima de barras
    for i, (bar, value) in enumerate(zip(bars, metrics_values)):
        height = bar.get_height()
        
        # i=0 es Coverage, i=1 es Diversity
        if i == 1:  # Diversity
            label_text = f'{results["diversity"]:.3f}'
        else:  # Coverage
            label_text = f'{value:.1f}%'
        
        ax.text(bar.get_x() + bar.get_width()/2., height + 2,
                label_text,
                ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    ax.set_ylabel('Valor', fontsize=12)
    ax.set_title('Content-Based: Métricas Específicas', fontsize=14, fontweight='bold')
    ax.set_ylim([0, 105])
    ax.grid(True, alpha=0.3, axis='y')
    
    # Agregar líneas de referencia
    ax.axhline(y=80, color='green', linestyle='--', alpha=0.5, label='Excelente (80%+)')
    ax.axhline(y=50, color='orange', linestyle='--', alpha=0.5, label='Moderado (50%)')
    ax.legend(fontsize=10, loc='upper right')
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Guardado: {save_path}")
    plt.close()


def main():
    """Función principal"""
    print("\n=== EVALUACIÓN DE MODELOS ===\n")
    
    # Cargar datos con train/test split
    print("Cargando datos...")
    data = load_data()
    print(f"✓ Train: {len(data['train_users'])} usuarios ({len(data['train_interactions'])} interacciones)")
    print(f"✓ Test: {len(data['test_users'])} usuarios ({len(data['test_interactions'])} interacciones)")
    print(f"✓ Mascotas: {len(data['pets'])}")
    
    # Cargar modelos
    print("\nCargando modelos...")
    MODELS_DIR = Path(__file__).parent.parent.parent / 'models'
    
    content_model = EnhancedDynamicRecommender()
    content_model.load(MODELS_DIR / 'content_based_enhanced.pkl')
    
    collab_model = CollaborativeRecommender()
    collab_model.load(MODELS_DIR / 'collaborative_model.pkl')
    
    hybrid_model = EnhancedHybridRecommender(content_weight=0.7, collaborative_weight=0.3)
    hybrid_model.load_models(
        MODELS_DIR / 'content_based_enhanced.pkl',
        MODELS_DIR / 'collaborative_model.pkl'
    )
    print("✓ Modelos cargados")
    
    # Evaluar cada modelo en el conjunto TEST
    print("\nEval uando en conjunto TEST...")
    results_content = evaluate_single_model(
        content_model, "Content-Based Enhanced", 
        data['pets'], data['test_users'], data['test_interactions']
    )
    results_collab = evaluate_single_model(
        collab_model, "Collaborative", 
        data['pets'], data['test_users'], data['test_interactions']
    )
    results_hybrid = evaluate_single_model(
        hybrid_model, "Hybrid Enhanced", 
        data['pets'], data['test_users'], data['test_interactions']
    )
    
    all_results = [results_content, results_collab, results_hybrid]
    
    # Generar gráficas
    print("\nGenerando gráficas...")
    REPORTS_DIR = Path(__file__).parent.parent.parent / 'reports' / 'comparison_enhanced'
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    plot_comparative_precision_recall(all_results, REPORTS_DIR / 'comparison_precision_recall.png')
    plot_comparative_ndcg(all_results, REPORTS_DIR / 'comparison_ndcg.png')
    plot_metrics_comparison_table(all_results, REPORTS_DIR / 'comparison_metrics_table.png')
    
    # Gráfica específica Content-Based
    if 'coverage' in results_content:
        plot_content_based_metrics(results_content, REPORTS_DIR / 'content_based_specific_metrics.png')
    
    # Resumen
    print("\n=== RESULTADOS (Test Set) ===\n")
    for results in all_results:
        print(f"{results['model_name']}:")
        print(f"  Precision@10: {results['precision_at_k'][1]:.3f}")
        print(f"  Recall@10: {results['recall_at_k'][1]:.3f}")
        print(f"  NDCG@10: {results['ndcg_at_k'][1]:.3f}")
        
        # Mostrar métricas Content-Based si existen
        if 'coverage' in results:
            print(f"  Coverage: {results['coverage']:.1f}%")
            print(f"  Diversity: {results['diversity']:.3f}")
        
        print()
    
    print(f"✓ Gráficas guardadas en: {REPORTS_DIR}\n")


if __name__ == "__main__":
    main()
