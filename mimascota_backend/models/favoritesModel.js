const pool = require('../config/db');

/**
 * Busca la relación de favorito entre un usuario y una mascota.
 * @param {number} userId - ID del usuario.
 * @param {number} mascotId - ID de la mascota.
 * @returns {Promise<object>} El registro de favorito si existe.
 */
const findFavoriteStatusDB = async (userId, mascotId) => {
    const query = `
        SELECT status_favori
        FROM favoritos
        WHERE forane_usuari_id = $1 AND forane_mascot_id = $2;
    `;
    return pool.query(query, [userId, mascotId]);
};

/**
 * Obtiene la lista de mascotas marcadas como favoritas por un usuario.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<object>} Lista de mascotas.
 */
const getFavoritesByUserIdDB = async (userId) => {
    const query = `
        SELECT
            m.*
        FROM
            favoritos AS f
        JOIN
            mascotas AS m ON f.forane_mascot_id = m.idxxxx_mascot
        WHERE
            f.forane_usuari_id = $1
            AND f.status_favori = TRUE 
            AND m.eliminado_logico = FALSE 
        ORDER BY
            m.nombre_mascot;
    `;
    return pool.query(query, [userId]);
};

/**
 * Busca un registro de favorito para determinar si ya existe y cuál es su estado actual.
 * @param {number} userId - ID del usuario.
 * @param {number} mascotId - ID de la mascota.
 * @returns {Promise<object>} El registro o un resultado vacío.
 */
const checkExistingFavoriteDB = async (userId, mascotId) => {
    const checkQuery = `
        SELECT idxxxx_favori, status_favori FROM favoritos
        WHERE forane_usuari_id = $1 AND forane_mascot_id = $2;
    `;
    return pool.query(checkQuery, [userId, mascotId]);
};

/**
 * Inserta una nueva relación de favorito con status TRUE.
 * @param {number} userId - ID del usuario.
 * @param {number} mascotId - ID de la mascota.
 * @returns {Promise<object>} El nuevo registro insertado.
 */
const insertNewFavoriteDB = async (userId, mascotId) => {
    const insertQuery = `
        INSERT INTO favoritos (forane_usuari_id, forane_mascot_id, status_favori)
        VALUES ($1, $2, TRUE)
        RETURNING status_favori;
    `;
    return pool.query(insertQuery, [userId, mascotId]);
};

/**
 * Actualiza el estado de favorito de una relación existente.
 * @param {number} userId - ID del usuario.
 * @param {number} mascotId - ID de la mascota.
 * @param {boolean} newStatus - El nuevo estado (TRUE/FALSE).
 * @returns {Promise<object>} El registro actualizado.
 */
const updateFavoriteStatusDB = async (userId, mascotId, newStatus) => {
    const updateQuery = `
        UPDATE favoritos
        SET status_favori = $3
        WHERE forane_usuari_id = $1 AND forane_mascot_id = $2
        RETURNING status_favori;
    `;
    return pool.query(updateQuery, [userId, mascotId, newStatus]);
};

module.exports = {
    findFavoriteStatusDB,
    getFavoritesByUserIdDB,
    checkExistingFavoriteDB,
    insertNewFavoriteDB,
    updateFavoriteStatusDB,
};