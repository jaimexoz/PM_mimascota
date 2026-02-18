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

    // Validar campos requeridos
    if (!forane_usuari_id || !type || !message) {
        console.error('Datos inválidos para notificación:', { forane_usuari_id, type, message });
        throw new Error('Campos requeridos faltantes: forane_usuari_id, type, message son obligatorios.');
    }

    try {
        console.log('Intentando guardar notificación:', { 
            forane_usuari_id, 
            type, 
            message: message.substring(0, 50) + '...',
            forane_solici_id, 
            related_user_id 
        });

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

        if (!result.rows || result.rows.length === 0) {
            throw new Error('La inserción no devolvió ningún resultado.');
        }

        const newNotification = result.rows[0];
        console.log('Notificación guardada exitosamente:', newNotification.idxxxx_notifi);

        // 2. Emisión en tiempo real usando Socket.io
        if (io) {
            try {
                io.to(forane_usuari_id.toString()).emit('new_notification', { 
                    id: newNotification.idxxxx_notifi,
                    message: newNotification.message,
                    type: newNotification.type,
                    image_url: newNotification.image_url, // Antes era imageUrl
                    created_at: newNotification.created_at // Antes era createdAt
                });
                console.log("Emitido a room:", forane_usuari_id);
            } catch (socketError) {
                console.error('Error al emitir notificación por Socket.io (no crítico):', socketError);
                // No lanzamos el error aquí porque la notificación ya se guardó en DB
            }
        }
        
        return newNotification;
    } catch (error) {
        // Preservar el error original de la base de datos
        console.error('Error al guardar notificación:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            constraint: error.constraint,
            datos_intentados: { forane_usuari_id, type, message: message?.substring(0, 50) }
        });
        
        // Propagar el error original con más contexto
        const errorMessage = error.message || 'Error desconocido al guardar la notificación';
        const enhancedError = new Error(`Error al guardar notificación en DB: ${errorMessage}`);
        enhancedError.originalError = error;
        throw enhancedError;
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