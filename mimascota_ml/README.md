# Sistema ML de Recomendación de Mascotas

Sistema híbrido de Machine Learning para matching de adopción de mascotas, combinando Content-Based Filtering y Collaborative Filtering.

## 📋 Requisitos

### Python
- Python 3.10 o superior
- pip (gestor de paquetes)

### Instalación de Python

**Windows:**
1. Descargar desde: https://www.python.org/downloads/
2. Durante instalación, **marcar** "Add Python to PATH"
3. Verificar instalación:
```bash
python --version
```

## 🚀 Instalación

### 1. Crear entorno virtual (recomendado)
```bash
python -m venv venv
```

### 2. Activar entorno virtual

**Windows (PowerShell):**
```bash
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```bash
.\venv\Scripts\activate.bat
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

## 📁 Estructura del Proyecto

```
mimascota_ml/
├── data/
│   ├── raw/              # Datos sintéticos generados
│   └── processed/        # Datos transformados para ML
├── models/               # Modelos entrenados (.pkl)
├── notebooks/            # Jupyter notebooks para exploración
├── src/
│   ├── data/            # Scripts de generación de datos
│   ├── models/          # Código de modelos ML
│   ├── preprocessing.py # Feature engineering
│   ├── evaluation.py    # Métricas
│   └── visualizations.py # Gráficas
├── api/                  # Flask API para inferencia
├── reports/
│   └── metrics/         # Gráficas PNG
├── requirements.txt
└── README.md
```

## 🎯 Flujo de Trabajo

### Fase 1: Generación de Datos
```bash
python src/data/generate_data.py
```

### Fase 2: Exploración
```bash
jupyter notebook notebooks/01_data_exploration.ipynb
```

### Fase 3: Entrenamiento de Modelos
```bash
# Content-Based
jupyter notebook notebooks/02_content_based.ipynb

# Collaborative Filtering
jupyter notebook notebooks/03_collaborative.ipynb

# Hybrid Model
jupyter notebook notebooks/04_hybrid_model.ipynb
```

### Fase 4: API de Inferencia
```bash
cd api
python app.py
```

La API estará disponible en `http://localhost:5001`

## 📊 Modelos Implementados

1. **Content-Based Filtering** (60% peso)
   - KNN + Cosine Similarity
   - Basado en características de usuario y mascota

2. **Collaborative Filtering** (40% peso)
   - SVD Matrix Factorization
   - Basado en interacciones usuario-mascota

3. **Hybrid Model**
   - Ensemble ponderado de ambos modelos
   - Mejor rendimiento general

## 📈 Métricas Esperadas

| Modelo | Precision@5 | Recall@5 | NDCG@5 |
|--------|-------------|----------|--------|
| Content-Based | 0.60-0.70 | 0.55-0.65 | 0.70-0.75 |
| Collaborative | 0.65-0.75 | 0.60-0.70 | 0.75-0.80 |
| **Hybrid** | **0.75-0.85** | **0.70-0.80** | **0.78-0.88** |

## 🔗 Integración con Backend

El sistema se integra con el backend Node.js existente:
- Backend Node.js (puerto 3000) actúa como proxy
- API Python ML (puerto 5001) procesa recomendaciones
- PostgreSQL almacena interacciones para reentrenamiento

## 📝 Notas

- Los datos iniciales son sintéticos con correlaciones lógicas
- Reentrenar con datos reales cuando haya suficientes interacciones
- Todas las métricas reportadas son sobre datos sintéticos
