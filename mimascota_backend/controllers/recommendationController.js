const pool = require('../config/db');
const axios = require('axios');

// URL de la API de ML en Python
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

/**
 * Genera recomendaciones para un usuario usando la API de ML de Python
 * Este controlador actúa como proxy entre el frontend Vue y el servicio ML
 */
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user?.id || null; // ID del usuario autenticado (opcional)
        const userProfile = req.body; // Respuestas del cuestionario

        console.log(`📊 Solicitando recomendaciones para usuario ${userId || 'nuevo'}`);

        // Preparar payload para la API de Python
        const mlPayload = {
            user_profile: userProfile,
            user_id: userId,
            n_recommendations: 10
        };

        // Llamar a la API de ML
        const mlResponse = await axios.post(
            `${ML_API_URL}/api/ml/recommend`,
            mlPayload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 // 10 segundos timeout
            }
        );

        if (mlResponse.data.status !== 'success') {
            throw new Error('ML API returned non-success status');
        }

        const recommendations = mlResponse.data.recommendations;

        console.log(`✅ Recibidas ${recommendations.length} recomendaciones de ML API`);

        // Enriquecer con datos completos de la BD PostgreSQL
        const enrichedRecommendations = await enrichWithDatabaseData(recommendations);

        // Retornar en el formato que espera el frontend
        res.status(200).json({
            status: 'success',
            count: enrichedRecommendations.length,
            recommendations: enrichedRecommendations
        });

    } catch (error) {
        console.error("❌ Error en recomendación:", error);

        // Si la API de ML no está disponible, devolver error específico
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                status: 'error',
                message: 'Servicio de ML no disponible. Asegúrate de que la API de Python esté corriendo.',
                details: 'python api/app.py'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Error calculando recomendaciones',
            details: error.message
        });
    }
};

/**
 * Enriquece las recomendaciones con datos completos de PostgreSQL
 * La API de ML solo retorna IDs y scores, necesitamos todos los datos de la mascota
 */
async function enrichWithDatabaseData(recommendations) {
    try {
        // Extraer IDs de las mascotas recomendadas
        const petIds = recommendations.map(rec => rec.pet_id);

        if (petIds.length === 0) {
            return [];
        }

        console.log(`🔍 ML recomendó ${petIds.length} mascotas: [${petIds.slice(0, 5).join(', ')}${petIds.length > 5 ? '...' : ''}]`);

        // Query simplificado - solo datos de mascotas
        const query = `
            SELECT *
            FROM mascotas
            WHERE idxxxx_mascot = ANY($1)
        `;

        const result = await pool.query(query, [petIds]);
        const petsMap = new Map(result.rows.map(pet => [pet.idxxxx_mascot, pet]));

        console.log(`✅ Encontradas ${result.rows.length} mascotas en PostgreSQL`);

        // Combinar datos de ML con datos de PostgreSQL
        const enriched = recommendations.map(rec => {
            const petData = petsMap.get(rec.pet_id);

            if (!petData) {
                console.warn(`⚠️  Mascota ${rec.pet_id} no encontrada en BD`);
                return null;
            }

            return {
                ...petData,
                match_score: rec.hybrid_score,
                match_percentage: rec.match_percentage,
                ml_scores: {
                    hybrid: rec.hybrid_score,
                    content: rec.content_score,
                    collaborative: rec.collab_score
                }
            };
        }).filter(pet => pet !== null);

        const notFound = petIds.length - enriched.length;
        if (notFound > 0) {
            console.log(`⚠️  ${notFound} mascotas ML no existen en BD (modelos entrenados con datos sintéticos)`);
        }
        console.log(`📊 Retornando ${enriched.length} recomendaciones finales`);

        return enriched;

    } catch (error) {
        console.error("Error enriqueciendo datos:", error);
        throw error;
    }
}

/**
 * Health check para verificar que la API de ML está disponible
 */
exports.checkMLHealth = async (req, res) => {
    try {
        const response = await axios.get(`${ML_API_URL}/api/ml/health`, {
            timeout: 5000
        });

        res.json({
            status: 'success',
            ml_api_status: response.data
        });

    } catch (error) {
        res.status(503).json({
            status: 'error',
            message: 'ML API no disponible',
            details: error.message
        });
    }
};

/**
 * Guardar cuestionario del usuario (mantener funcionalidad existente)
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
            'UPDATE usuarios SET vector_preferencias = $1 WHERE idxxxx_usuari = $2',
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
 * Obtener recomendaciones guardadas para un usuario
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

        // Extraer solo campos del cuestionario (sin timestamp/version)
        const { timestamp, version, ...questionnaireResponses } = savedQuestionnaire;

        // 2. Generar recomendaciones con datos guardados  
        const mlPayload = {
            user_profile: questionnaireResponses,
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
        console.error("Error en getSavedRecommendations:", error);
        res.status(500).json({
            status: 'error',
            message: 'Error obteniendo recomendaciones'
        });
    }
};

// DEPRECATED: Mantener por compatibilidad pero loggear advertencia
exports.recalculateAllVectors = async (req, res) => {
    console.warn("⚠️  recalculateAllVectors está deprecado. Los vectores ahora se manejan en Python.");
    res.json({
        status: 'deprecated',
        message: 'Esta función ya no es necesaria. Los modelos ML se entrenan en Python.'
    });
};