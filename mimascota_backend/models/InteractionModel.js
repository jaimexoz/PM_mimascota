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

    let query;
    const values = [userId, petId];

    switch (type) {
        case 'click':
            query = `
                INSERT INTO interacciones 
                (forane_idxxxx_usuari, forane_idxxxx_mascot, clicks_intera, fechax_creaci, fechax_actual)
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT (forane_idxxxx_usuari, forane_idxxxx_mascot)
                DO UPDATE SET 
                    clicks_intera = interacciones.clicks_intera + 1,
                    fechax_actual = NOW()
                RETURNING *
            `;
            break;

        case 'favorite':
            query = `
                INSERT INTO interacciones 
                (forane_idxxxx_usuari, forane_idxxxx_mascot, favori_intera, fechax_creaci, fechax_actual)
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT (forane_idxxxx_usuari, forane_idxxxx_mascot)
                DO UPDATE SET 
                    favori_intera = 1,
                    fechax_actual = NOW()
                RETURNING *
            `;
            break;

        case 'contact':
            query = `
                INSERT INTO interacciones 
                (forane_idxxxx_usuari, forane_idxxxx_mascot, matchx_intera, fechax_creaci, fechax_actual)
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT (forane_idxxxx_usuari, forane_idxxxx_mascot)
                DO UPDATE SET 
                    matchx_intera = 1,
                    fechax_actual = NOW()
                RETURNING *
            `;
            break;

        case 'adopt':
            query = `
                INSERT INTO interacciones 
                (forane_idxxxx_usuari, forane_idxxxx_mascot, adopti_intera, fechax_creaci, fechax_actual)
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT (forane_idxxxx_usuari, forane_idxxxx_mascot)
                DO UPDATE SET 
                    adopti_intera = 1,
                    fechax_actual = NOW()
                RETURNING *
            `;
            break;
    }

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error upsert interacción:', error);
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
