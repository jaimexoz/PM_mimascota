const pool = require('../config/db');

/**
 * Modelo para gestionar las interacciones de usuarios con mascotas.
 * Tabla: interacciones
 * 
 * Estructura: Una fila por (usuario, mascota) con contadores separados
 */

/**
 * Registrar o actualizar interacción según tipo
 * @param {number} userId - ID del usuario
 * @param {number} petId - ID de la mascota
 * @param {string} type - Tipo: 'click', 'favorite', 'contact', 'adopt'
 */
exports.upsertInteraction = async (userId, petId, type) => {
    const validTypes = ['click', 'favorite', 'contact', 'adopt'];
    if (!validTypes.includes(type)) {
        throw new Error(`Tipo de interacción inválido: ${type}`);
    }

    try {
        // 1. Verificar si ya existe la interacción
        const checkQuery = `
            SELECT idxxxx_intera 
            FROM interacciones 
            WHERE forane_idxxxx_usuari = $1 AND forane_idxxxx_mascot = $2
        `;
        const checkResult = await pool.query(checkQuery, [userId, petId]);

        let query;
        let values;

        if (checkResult.rows.length > 0) {
            // 2. Si EXISTE: Actualizar (UPDATE)
            // No tocamos la secuencia de IDs, solo incrementamos el contador
            const interactionId = checkResult.rows[0].idxxxx_intera;

            switch (type) {
                case 'click':
                    query = `UPDATE interacciones SET clicks_intera = clicks_intera + 1, fechax_actual = NOW() WHERE idxxxx_intera = $1 RETURNING *`;
                    break;
                case 'favorite':
                    query = `UPDATE interacciones SET favori_intera = 1, fechax_actual = NOW() WHERE idxxxx_intera = $1 RETURNING *`;
                    break;
                case 'contact':
                    query = `UPDATE interacciones SET matchx_intera = 1, fechax_actual = NOW() WHERE idxxxx_intera = $1 RETURNING *`;
                    break;
                case 'adopt':
                    query = `UPDATE interacciones SET adopti_intera = 1, fechax_actual = NOW() WHERE idxxxx_intera = $1 RETURNING *`;
                    break;
            }
            values = [interactionId];

        } else {
            // 3. Si NO EXISTE: Insertar (INSERT)
            // Aquí sí se usará un nuevo ID de la secuencia
            values = [userId, petId];
            switch (type) {
                case 'click':
                    query = `
                        INSERT INTO interacciones (forane_idxxxx_usuari, forane_idxxxx_mascot, clicks_intera, fechax_creaci, fechax_actual)
                        VALUES ($1, $2, 1, NOW(), NOW()) RETURNING *`;
                    break;
                case 'favorite':
                    query = `
                        INSERT INTO interacciones (forane_idxxxx_usuari, forane_idxxxx_mascot, favori_intera, fechax_creaci, fechax_actual)
                        VALUES ($1, $2, 1, NOW(), NOW()) RETURNING *`;
                    break;
                case 'contact':
                    query = `
                        INSERT INTO interacciones (forane_idxxxx_usuari, forane_idxxxx_mascot, matchx_intera, fechax_creaci, fechax_actual)
                        VALUES ($1, $2, 1, NOW(), NOW()) RETURNING *`;
                    break;
                case 'adopt':
                    query = `
                        INSERT INTO interacciones (forane_idxxxx_usuari, forane_idxxxx_mascot, adopti_intera, fechax_creaci, fechax_actual)
                        VALUES ($1, $2, 1, NOW(), NOW()) RETURNING *`;
                    break;
            }
        }

        const result = await pool.query(query, values);
        return result.rows[0];

    } catch (error) {
        console.error('Error procesando interacción (manual upsert):', error);
        throw error;
    }
};

/**
 * Obtener todas las interacciones para entrenamiento ML
 * @returns {Array} Array de interacciones con rating calculado
 */
exports.getAllInteractions = async () => {
    const query = `
        SELECT 
            forane_idxxxx_usuari AS user_id,
            forane_idxxxx_mascot AS pet_id,
            clicks_intera,
            favori_intera,
            matchx_intera,
            adopti_intera,
            (clicks_intera + favori_intera*2 + matchx_intera*3 + adopti_intera*5) AS rating,
            fechax_actual
        FROM interacciones
        WHERE clicks_intera > 0 OR favori_intera > 0 OR matchx_intera > 0 OR adopti_intera > 0
        ORDER BY fechax_actual DESC
    `;

    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo interacciones:', error);
        throw error;
    }
};

/**
 * Obtener interacciones de un usuario específico
 * @param {number} userId - ID del usuario
 * @returns {Array} Interacciones del usuario con mascotas
 */
exports.getUserInteractions = async (userId) => {
    const query = `
        SELECT 
            i.*,
            m.nombre_mascot,
            m.especi_mascot,
            (i.clicks_intera + i.favori_intera*2 + i.matchx_intera*3 + i.adopti_intera*5) AS rating
        FROM interacciones i
        JOIN mascotas m ON i.forane_idxxxx_mascot = m.idxxxx_mascot
        WHERE i.forane_idxxxx_usuari = $1
          AND (i.clicks_intera > 0 OR i.favori_intera > 0 OR i.matchx_intera > 0 OR i.adopti_intera > 0)
        ORDER BY i.fechax_actual DESC
    `;

    try {
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo interacciones de usuario:', error);
        throw error;
    }
};

module.exports = exports;
