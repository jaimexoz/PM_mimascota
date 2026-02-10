# Guía de Integración Node.js + Python ML API

## 📋 Resumen de Cambios

### Backend Node.js (`mimascota_backend/`)

#### ✅ Archivos Modificados

1. **`controllers/recommendationController.js`** - ⚠️ REFACTORIZADO COMPLETAMENTE
   - Eliminada toda lógica ML (vectores, cosine similarity)
   - Ahora actúa como **proxy** hacia la API de Python
   - Usa `axios` para hacer requests HTTP a `http://localhost:5001`
   - Enriquece respuestas con datos completos de PostgreSQL
   
2. **`routes/recommendationsRoutes.js`**
   - Agregada ruta: `GET /api/recommendations/ml-health`
   - Mantiene rutas existentes sin cambios

3. **`package.json`**
   - Agregada dependencia: `axios ^1.6.7`

#### ⚠️ Archivos a Revisar

- **`services/mlService.js`** - DEPRECADO (ya se eliminó anteriormente)
- **`scripts/verify_ml_logic.js`** - DEPRECADO (ya se eliminó anteriormente)

### Python ML Service (`mimascota_ml/`)

#### ✅ Nuevos Archivos

- `api/app.py` - Servidor Flask en puerto 5001
- `api/test_api.py` - Tests automatizados de la API
- `src/preprocessing.py` - Feature engineering
- `src/models/content_based.py` - Modelo KNN + Cosine Similarity
- `src/models/collaborative.py` - Modelo SVD
- `src/models/hybrid.py` - Modelo híbrido (60% content + 40% collab)

## 🚀 Instalación y Configuración

### 1. Backend Node.js

```bash
cd mimascota_backend

# Instalar nueva dependencia (axios)
npm install

# Verificar que axios se instaló
npm list axios
```

### 2. Servicio ML Python

```bash
cd mimascota_ml

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Verificar dependencias (ya instaladas)
pip list | grep -E "flask|scikit"
```

## 🔧 Ejecutar el Sistema

### Orden de Inicio

**1. Iniciar API de ML (Python) - Puerto 5001**
```bash
cd mimascota_ml
.\venv\Scripts\Activate.ps1
python api\app.py
```

**2. Iniciar Backend Node.js - Puerto 4000**
```bash
cd mimascota_backend
npm run dev
```

**3. Iniciar Frontend Vue.js - Puerto 5173**
```bash
cd mimascota_frontend
npm run dev
```

## 📡 Flujo de Datos

```
┌─────────────┐        ┌──────────────┐       ┌─────────────┐
│   Vue.js    │  HTTP  │   Node.js    │ HTTP  │  Python ML  │
│  Frontend   ├───────>│   Backend    ├──────>│   API       │
│  :5173      │ POST   │   :4000      │ POST  │   :5001     │
└─────────────┘        └──────────────┘       └─────────────┘
                              │
                              │ SQL
                              ▼
                       ┌──────────────┐
                       │  PostgreSQL  │
                       │     DB       │
                       └──────────────┘
```

## 🔍 Endpoints

### Node.js Backend (Puerto 4000)

- `POST /api/recommendations` - Generar recomendaciones
  - Request: `{ horasEnCasa, nivelActividad, ... }`
  - Delega a Python ML API
  - Enriquece respuesta con datos de PostgreSQL

- `GET /api/recommendations/ml-health` - Health check de ML API
  - Verifica que Python ML esté disponible

- `POST /api/recommendations/submitQuestionnaire` - Guardar cuestionario
  - Guarda en PostgreSQL
  - Genera recomendaciones vía ML API

- `GET /api/recommendations/getSavedRecommendations` - Recomendaciones guardadas
  - Lee cuestionario de PostgreSQL
  - Genera recomendaciones vía ML API

### Python ML API (Puerto 5001)

- `GET /api/ml/health` - Health check
  - Verifica que modelos estén cargados

- `POST /api/ml/recommend` - Generar recomendaciones
  - Request:
    ```json
    {
      "user_id": 1,  // opcional
      "user_profile": {
        "horasEnCasa": "mas_8",
        "nivelActividad": "activo",
        ...
      },
      "n_recommendations": 10
    }
    ```
  - Response:
    ```json
    {
      "status": "success",
      "recommendations": [
        {
          "pet_id": 113,
          "hybrid_score": 0.623,
          "content_score": 0.599,
          "collab_score": 0.660,
          "match_percentage": 62,
          "pet_details": {...}
        }
      ]
    }
    ```

## 🧪 Testing

### 1. Test de ML API (Python)

```bash
cd mimascota_ml
.\venv\Scripts\Activate.ps1

# Asegúrate de que api/app.py esté corriendo
python api\test_api.py
```

### 2. Test de Integración (Node.js ↔ Python)

```bash
# Usar herramientas como Postman o curl
curl -X GET http://localhost:4000/api/recommendations/ml-health
```

## ⚠️ Troubleshooting

### Error: "ECONNREFUSED - connect to localhost:5001"

**Causa:** Python ML API no está corriendo

**Solución:**
```bash
cd mimascota_ml
.\venv\Scripts\Activate.ps1
python api\app.py
```

### Error: "ModuleNotFoundError: No module named 'axios'"

**Causa:** Axios no está instalado en Node.js (esto es Python)

**Esto no debería pasar**, axios es para Node.js. Si ves esto, hay un error de configuración.

### Error: "ML API returned non-success status"

**Causa:** La API de ML retornó un error

**Solución:** Revisar logs del servidor Python (`api/app.py`)

## 📊 Variables de Entorno

### Node.js Backend (`.env`)

Agregar:
```env
ML_API_URL=http://localhost:5001
```

Si no se especifica, usa `http://localhost:5001` por defecto.

## 🔄 Migración Desde Sistema Antiguo

### ¿Qué cambió?

**Antes:**
- Node.js calculaba vectores y cosine similarity
- Lógica ML en `services/mlService.js`
- Sin historial de interacciones

**Ahora:**
- Python hace todos los cálculos ML
- Node.js solo maneja HTTP y PostgreSQL
- Modelo híbrido usa interacciones de usuarios

### ¿El frontend necesita cambios?

**NO** - El frontend sigue enviando el mismo payload a:
```
POST /api/recommendations
```

La respuesta tiene el mismo formato, así que es **100% compatible**.

### ¿Qué pasa con los datos existentes?

- **Usuarios:** Sin cambios
- **Mascotas:** Sin cambios
- **Interacciones:** Se usan para Collaborative Filtering
- **Vectores pre-calculados:** Ya no se usan, se eliminan eventualmente

## ✅ Checklist de Deployment

- [ ] Python ML API corriendo en puerto 5001
- [ ] Node.js backend instaló `axios` (`npm install`)
- [ ] Node.js backend corriendo en puerto 4000
- [ ] Frontend Vue.js corriendo en puerto 5173
- [ ] PostgreSQL disponible
- [ ] Test: `GET /api/recommendations/ml-health` retorna `status: "healthy"`
- [ ] Test: Frontend puede generar recomendaciones

## 📝 Notas Finales

- **Modelos ML:** Se entrenan offline con `train_models.ps1`
- **Actualización de modelos:** Re-entrenar cuando haya nuevos datos
- **Escalabilidad:** Python ML API puede desplegarse en servidor separado
- **Monitoreo:** Logs en ambos servidores (Node.js y Python)
