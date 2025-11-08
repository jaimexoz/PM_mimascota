const pool = require('../config/db');

/**
 * Inserta la notificación en DB y la emite por Socket.io al usuario correspondiente.
 * Este módulo contiene la lógica del modelo (DB) y el canal de comunicación (Socket.io).
 * @param {object} io - La instancia de Socket.io.
 * @param {object} notificationData - Datos para la notificación.
 * @returns {object} La notificación recién creada.
 */
async function createAndEmitNotification(io, notificationData) {
    const { 
        forane_usuari_id, 
        type, 
        message, 
        forane_solici_id = null, 
        related_user_id = null, 
        image_url = null 
    } = notificationData;

    try {
        // 1. Inserción en la tabla notifications
        const insertQuery = `
            INSERT INTO notifications (
                forane_usuari_id, type, message, forane_solici_id, related_user_id, image_url, is_read, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
            RETURNING idxxxx_notifi, message, type, image_url, created_at;
        `;
        const result = await pool.query(insertQuery, [
            forane_usuari_id, type, message, forane_solici_id, related_user_id, image_url
        ]);

        const newNotification = result.rows[0];

        // 2. Emisión en tiempo real usando Socket.io
        if (io) {
            io.to(forane_usuari_id.toString()).emit('new_notification', { 
                id: newNotification.idxxxx_notifi,
                message: newNotification.message,
                type: newNotification.type,
                imageUrl: newNotification.image_url,
                createdAt: newNotification.created_at
            });
        }
        
        return newNotification;
    } catch (error) {
        console.error('Error al guardar y emitir notificación:', error);
        // Devolvemos el error al controlador, o lo ignoramos si la falla no es crítica
        // En este caso, lo propagamos.
        throw new Error('Error en el modelo al guardar la notificación.');
    }
}

/**
 * Obtiene todas las notificaciones de un usuario.
 */
async function getNotificationsByUserId(userId) {
    const query = `
        SELECT 
            idxxxx_notifi AS id, type, message, forane_solici_id, related_user_id, 
            image_url, is_read, created_at
        FROM notifications
        WHERE forane_usuari_id = $1
        ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Marca todas las notificaciones no leídas como leídas para un usuario.
 */
async function markAllAsRead(userId) {
    const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE forane_usuari_id = $1 AND is_read = FALSE
        RETURNING idxxxx_notifi;
    `;
    const result = await pool.query(query, [userId]);
    return result.rowCount;
}

module.exports = {
    createAndEmitNotification,
    getNotificationsByUserId,
    markAllAsRead
};