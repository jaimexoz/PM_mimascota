const pool = require('../config/db');

/**
 * Modelo para gestionar las interacciones de usuarios con mascotas.
 * Tabla: usuario_interacciones
 */

// Insertar una nueva interacción
exports.insertInteraction = async (userId, petId, type) => {
    const validTypes = ['click', 'favorite', 'contact'];
    if (!validTypes.includes(type)) {
        throw new Error(`Tipo de interacción inválido: ${type}`);
    }

    const query = `
        INSERT INTO usuario_interacciones 
        (forane_idxxxx_usuari, forane_idxxxx_mascot, typexx_intera, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
    `;
    const values = [userId, petId, type];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error insertando interacción:', error);
        throw error;
    }
};

// Obtener interacciones positivas recientes de un usuario
// Limitamos a las últimas 50 para que el perfil evolucione pero no sea eterno
exports.getUserPositiveInteractions = async (userId, limit = 50) => {
    const query = `
        SELECT 
            ui.typexx_intera,
            m.vector_caracteristicas
        FROM usuario_interacciones ui
        JOIN mascotas m ON ui.forane_idxxxx_mascot = m.idxxxx_mascot
        WHERE ui.forane_idxxxx_usuari = $1
          AND ui.typexx_intera IN ('click', 'favorite', 'contact')
          AND m.vector_caracteristicas IS NOT NULL
        ORDER BY ui.created_at DESC
        LIMIT $2
    `;

    try {
        const result = await pool.query(query, [userId, limit]);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo interacciones positivas:', error);
        throw error;
    }
};
