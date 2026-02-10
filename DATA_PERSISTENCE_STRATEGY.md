# 🗄️ Estrategia de Persistencia de Datos del Cuestionario

## 📊 Situación Actual

### Sistema Antiguo (Node.js ML)
- **Columna:** `vector_preferencias` (tipo: `ARRAY` o `TEXT[]`)
- **Contenido:** Vector numérico calculado con `mlService.createUserVector()`
- **Uso:** Cosine similarity en Node.js

### Sistema Nuevo (Python ML)
- **Input:** Respuestas del cuestionario (JSON)
- **Cálculo:** Feature engineering en Python (on-the-fly)
- **Output:** Recomendaciones rankeadas

---

## 🎯 Opciones de Almacenamiento

### **Opción 1: REUTILIZAR `vector_preferencias` (RECOMENDADA) ✅**

#### Ventajas:
- ✅ No requiere migración de BD
- ✅ Reutiliza columna existente
- ✅ Compatible con estructura actual

#### Cambios:
```sql
-- La columna ya existe, solo cambiar su uso
-- De: ARRAY numérico
-- A: JSONB con respuestas del cuestionario
ALTER TABLE usuarios 
ALTER COLUMN vector_preferencias TYPE JSONB USING vector_preferencias::text::jsonb;
```

#### Estructura de Datos:
```json
{
  "horasEnCasa": "6_8",
  "nivelActividad": "activo",
  "experienciaMascotas": "moderada",
  "tipoVivienda": "casa_jardin",
  "tamanoMascota": "grande",
  "edadPreferida": "joven",
  "perroOGato": "solo_perros",
  "nivelEnergia": "energetico",
  "personalidad": "amigable,jugueton,cariñoso",
  "ninosEnCasa": "no",
  "otrasMascotas": "no",
  "tiempoCuidado": "mas_2",
  "entrenamiento": "si",
  "presupuesto": "alto",
  "timestamp": "2026-02-09T22:56:00Z"
}
```

---

### **Opción 2: CREAR NUEVA COLUMNA (Alternativa)**

#### Ventajas:
- ✅ Mantiene `vector_preferencias` intacto (referencia histórica)
- ✅ Nombres claros y separados

#### Cambios:
```sql
-- Crear nueva columna para respuestas JSON
ALTER TABLE usuarios 
ADD COLUMN questionnaire_responses JSONB;

-- Agregar índice para búsquedas
CREATE INDEX idx_usuarios_questionnaire ON usuarios USING GIN (questionnaire_responses);
```

---

## 🔧 Implementación Recomendada (Opción 1)

### 1. Migración de Base de Datos

```sql
-- Conectar a PostgreSQL
-- psql -U adminm -d mimascota_db

-- Paso 1: Verificar tipo actual
\d usuarios;

-- Paso 2: Si vector_preferencias es ARRAY, convertir a JSONB
ALTER TABLE usuarios 
ALTER COLUMN vector_preferencias TYPE JSONB 
USING CASE 
    WHEN vector_preferencias IS NULL THEN NULL
    ELSE '{}'::jsonb
END;

-- Paso 3: Agregar índice para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_vector_preferencias 
ON usuarios USING GIN (vector_preferencias);

-- Paso 4: Verificar cambio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name = 'vector_preferencias';
```

### 2. Actualizar Controller (Node.js)

```javascript
/**
 * Guardar respuestas del cuestionario
 */
exports.submitQuestionnaire = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // 1. Guardar respuestas del cuestionario como JSON
        const questionnaireData = {
            ...req.body,
            timestamp: new Date().toISOString()
        };
        
        await pool.query(
            `UPDATE usuarios 
             SET vector_preferencias = $1, 
                 updated_at = NOW() 
             WHERE idxxxx_usuari = $2`,
            [JSON.stringify(questionnaireData), userId]
        );
        
        console.log(`💾 Cuestionario guardado para usuario ${userId}`);
        
        // 2. Generar recomendaciones usando ML API
        const mlPayload = {
            user_profile: req.body,
            user_id: userId,
            n_recommendations: 10
        };
        
        const mlResponse = await axios.post(
            `${ML_API_URL}/api/ml/recommend`,
            mlPayload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );
        
        const recommendations = mlResponse.data.recommendations;
        const enriched = await enrichWithDatabaseData(recommendations);
        
        res.json({
            status: 'success',
            recommendations: enriched,
            saved: true
        });
        
    } catch (error) {
        console.error("❌ Error en submitQuestionnaire:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error procesando cuestionario'
        });
    }
};

/**
 * Obtener recomendaciones usando cuestionario guardado
 */
exports.getSavedRecommendations = async (req, res) => {
    const userId = req.user.id;
    
    try {
        // 1. Leer cuestionario guardado
        const result = await pool.query(
            `SELECT vector_preferencias 
             FROM usuarios 
             WHERE idxxxx_usuari = $1`,
            [userId]
        );
        
        const savedQuestionnaire = result.rows[0]?.vector_preferencias;
        
        if (!savedQuestionnaire) {
            return res.json({
                status: 'no_data',
                recommendations: [],
                message: 'No hay cuestionario guardado'
            });
        }
        
        console.log(`📖 Leyendo cuestionario de usuario ${userId}`);
        
        // 2. Generar recomendaciones con datos guardados
        const mlPayload = {
            user_profile: savedQuestionnaire,
            user_id: userId,
            n_recommendations: 10
        };
        
        const mlResponse = await axios.post(
            `${ML_API_URL}/api/ml/recommend`,
            mlPayload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );
        
        const recommendations = mlResponse.data.recommendations;
        const enriched = await enrichWithDatabaseData(recommendations);
        
        res.json({
            status: 'success',
            recommendations: enriched,
            from_saved: true
        });
        
    } catch (error) {
        console.error("❌ Error en getSavedRecommendations:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error obteniendo recomendaciones'
        });
    }
};
```

---

## 📝 Ventajas de esta Estrategia

### 1. **Persistencia de Preferencias**
- Usuario completa cuestionario una vez
- Respuestas guardadas en `vector_preferencias` (JSON)
- Puede obtener recomendaciones sin volver a llenar

### 2. **Flexibilidad**
- Si cambiamos el modelo ML, no afecta datos guardados
- Podemos regenerar recomendaciones con nuevos modelos
- Histórico de preferencias del usuario

### 3. **Performance**
- No recalculamos feature engineering innecesariamente
- Cache implícito de preferencias del usuario
- Índice GIN en JSONB para búsquedas rápidas

### 4. **Analytics**
- Podemos analizar patrones de preferencias
- Ver qué combinaciones son más comunes
- Mejorar feature engineering basado en datos reales

---

## 🔄 Flujo Completo

```
1. Usuario completa cuestionario (Frontend)
   ↓
2. POST /api/recommendations/submitQuestionnaire
   ↓ 
3. Node.js guarda JSON en vector_preferencias
   ↓
4. Node.js llama Python ML API
   ↓
5. Python genera recomendaciones
   ↓
6. Node.js enriquece con PostgreSQL
   ↓
7. Frontend muestra resultados

---

[Usuario vuelve días después]

8. GET /api/recommendations/getSavedRecommendations
   ↓
9. Node.js lee vector_preferencias (JSON guardado)
   ↓
10. Node.js llama Python ML API con datos guardados
   ↓
11. Python genera recomendaciones actualizadas
   ↓
12. Frontend muestra nuevas recomendaciones
```

---

## ⚠️ Consideraciones Importantes

### 1. **Migración de Datos Existentes**
Si ya hay datos en `vector_preferencias`:
```sql
-- Backup de datos antiguos (opcional)
ALTER TABLE usuarios ADD COLUMN vector_preferencias_old TEXT[];
UPDATE usuarios SET vector_preferencias_old = vector_preferencias;

-- Luego hacer la conversión a JSONB
ALTER TABLE usuarios ALTER COLUMN vector_preferencias TYPE JSONB USING '{}'::jsonb;
```

### 2. **Actualización de Cuestionario**
Si usuario modifica respuestas:
```javascript
// Sobreescribir completamente
UPDATE usuarios SET vector_preferencias = $1 WHERE idxxxx_usuari = $2
```

### 3. **Versionado**
Agregar versión al JSON para tracking:
```json
{
  "version": "1.0",
  "timestamp": "2026-02-09T22:56:00Z",
  "responses": {
    "horasEnCasa": "6_8",
    ...
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Backup de tabla `usuarios`
- [ ] Migrar columna `vector_preferencias` de ARRAY a JSONB
- [ ] Crear índice GIN en `vector_preferencias`
- [ ] Actualizar `submitQuestionnaire` para guardar JSON
- [ ] Actualizar `getSavedRecommendations` para leer JSON
- [ ] Probar flujo completo (guardar → leer → recomendar)
- [ ] Validar que frontend funciona correctamente
- [ ] Documentar cambios

---

## 🎓 Resumen

**RECOMENDACIÓN:** Usar `vector_preferencias` para guardar **respuestas del cuestionario en formato JSON** (no vectores calculados).

**RAZÓN:** Python ML calcula vectores on-the-fly. Solo necesitamos guardar las respuestas originales para:
- Regenerar recomendaciones sin volver a preguntar
- Permitir actualización de modelos sin perder datos
- Analytics y mejora continua del sistema

**PRÓXIMO PASO:** Ejecutar migración SQL para convertir columna a JSONB.
