const pool = require('../config/db'); // Tu conexión a PostgreSQL

// ⭐️ EXPORTA UNA FUNCIÓN QUE RECIBE 'io' ⭐️
module.exports = (io) => {
    
    // ==========================================================
    // FUNCIONES AUXILIARES INTERNAS (Usan 'io' y 'pool' del scope)
    // ==========================================================

    /**
     * Función para insertar la notificación en DB y emitir por Socket.io.
     * @param {object} notificationData - Datos para la notificación.
     */
    async function createAndEmitNotification(notificationData) {
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
                forane_usuari_id, 
                type, 
                message, 
                forane_solici_id, 
                related_user_id, 
                image_url
            ]);

            const newNotification = result.rows[0];

            // 2. Emisión en tiempo real usando Socket.io
            if (io) {
                // Emitir al 'room' (sala) del usuario destinatario
                // Convertir ID a string para el room si PostgreSQL lo maneja como número
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
            console.error('Error al crear y emitir notificación:', error);
            // La falla en la notificación no detiene la operación principal de la API
        }
    }
    
    // ==========================================================
    // ⭐️ EXPORTACIÓN DE HANDLERS DE EXPRESS ⭐️
    // ==========================================================
    return {

        /**
         * Función para enviar el formulario de adopción a la base de datos.
         * NOTIFICA al dueño de la mascota sobre la NUEVA SOLICITUD.
         */
        submitAdoptionForm: async (req, res) => {
            const userId = req.user.id; 
            const {
                cedula_forado, nombre_forado, fnacim_forado, correo_forado, telefo_forado, 
                tvivie_forado, propie_forado, patjar_forado, tampat_forado, nperca_forado, 
                masant_forado, otrmas_forado, nmasco_forado, motivo_forado, ubimas_forado, 
                horasl_forado, encarg_forado, veteri_forado, gastos_forado, 
                forane_mascot_id 
            } = req.body;

            if (!userId || !forane_mascot_id || !nombre_forado || !correo_forado) {
                return res.status(400).json({ message: 'Datos incompletos para el formulario de adopción.' });
            }

            const client = await pool.connect();

            try {
                await client.query('BEGIN'); 

                // 1. OBTENER ID DEL PUBLICADOR y datos de la mascota (para la notificación)
                const publicadorQuery = `
                    SELECT forane_usuari_id, nombre_mascot, image1_mascot 
                    FROM mascotas 
                    WHERE idxxxx_mascot = $1;
                `;
                const publicadorResult = await client.query(publicadorQuery, [forane_mascot_id]);

                if (publicadorResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ message: 'Mascota no encontrada o ID de mascota inválido.' });
                }
                const { forane_usuari_id: forane_public_id, nombre_mascot, image1_mascot } = publicadorResult.rows[0];

                // 2. INSERTAR DETALLES DEL FORMULARIO (Tabla A: formularioAdopcion)
                const insertDetailsQuery = `
                    INSERT INTO "formularioAdopcion" (
                        cedula_forado, nombre_forado, fnacim_forado, correo_forado, telefo_forado, 
                        tvivie_forado, propie_forado, patjar_forado, tampat_forado, nperca_forado, 
                        masant_forado, otrmas_forado, nmasco_forado, motivo_forado, ubimas_forado, 
                        horasl_forado, encarg_forado, veteri_forado, gastos_forado
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
                    ) RETURNING idxxxx_forado;
                `;
                const detailsValues = [
                    cedula_forado, nombre_forado, fnacim_forado, correo_forado, telefo_forado, 
                    tvivie_forado, propie_forado, patjar_forado, tampat_forado, nperca_forado, 
                    masant_forado, otrmas_forado, nmasco_forado, motivo_forado, ubimas_forado, 
                    horasl_forado, encarg_forado, veteri_forado, gastos_forado
                ];
                const detailsResult = await client.query(insertDetailsQuery, detailsValues);
                const forane_forado_id = detailsResult.rows[0].idxxxx_forado; 

                // 3. INSERTAR LA SOLICITUD DE GESTIÓN (Tabla B: solicitudes_adopcion)
                const insertSolicitudQuery = `
                    INSERT INTO solicitudes_adopcion (
                        forane_solici_id, forane_public_id, forane_mascot_id, forane_forado_id, estado_solici
                    ) VALUES (
                        $1, $2, $3, $4, 'Pendiente'
                    ) RETURNING idxxxx_solici, fechax_solici;
                `;
                const solicitudValues = [userId, forane_public_id, forane_mascot_id, forane_forado_id];
                const solicitudResult = await client.query(insertSolicitudQuery, solicitudValues);
                const idxxxx_solici = solicitudResult.rows[0].idxxxx_solici;

                await client.query('COMMIT'); 
                
                // ⭐️ LÓGICA DE NOTIFICACIÓN: Notificar al DUEÑO de la mascota
                await createAndEmitNotification({
                    forane_usuari_id: forane_public_id,
                    type: 'nueva_solicitud',
                    message: `Tienes una nueva solicitud de adopción para ${nombre_mascot} de parte de ${nombre_forado}.`,
                    forane_solici_id: idxxxx_solici,
                    related_user_id: userId, // El solicitante
                    image_url: image1_mascot 
                });

                res.status(201).json({ 
                    message: 'Formulario de adopción enviado con éxito. Solicitud creada.', 
                    solicitud: solicitudResult.rows[0] 
                });

            } catch (error) {
                await client.query('ROLLBACK'); 
                console.error('Error al enviar formulario de adopción:', error);
                res.status(500).json({ message: 'Error interno del servidor al procesar el formulario.', error: error.message });
            } finally {
                client.release(); 
            }
        },

        /**
         * Función para actualizar el estado de una solicitud de adopción específica.
         * NOTIFICA al SOLICITANTE si su estado es ACEPTADA o RECHAZADA.
         */
        updateAdoptionStatus: async (req, res) => {
            const userId = req.user.id;
            const { formId } = req.params; // formId es el idxxxx_solici
            const { status } = req.body;

            if (!status || !['Aceptada', 'Rechazada', 'Pendiente'].includes(status)) {
                return res.status(400).json({ message: 'Estado inválido proporcionado.' });
            }

            try {
                // 1. Verificar dueño y obtener datos clave
                const verificationQuery = `
                    SELECT m.forane_usuari_id, s.forane_solici_id, s.forane_mascot_id
                    FROM "solicitudes_adopcion" s
                    JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
                    WHERE s.idxxxx_solici = $1;
                `;
                const verificationResult = await pool.query(verificationQuery, [formId]);

                if (verificationResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Solicitud no encontrada.' });
                }

                const { forane_usuari_id: duenoId, forane_solici_id: solicitanteId, forane_mascot_id: mascotaId } = verificationResult.rows[0];

                if (duenoId !== userId) {
                    return res.status(403).json({ message: 'No está autorizado para modificar el estado de esta solicitud.' });
                }

                // 2. Actualizar el estado en la base de datos
                const updateQuery = `
                    UPDATE "solicitudes_adopcion"
                    SET estado_solici = $1
                    WHERE idxxxx_solici = $2
                    RETURNING *;
                `;
                const updateResult = await pool.query(updateQuery, [status, formId]);

                // --- Lógica de Notificaciones ---
                const updatedForm = updateResult.rows[0];
                
                if (updatedForm && (status === 'Aceptada' || status === 'Rechazada')) {
                    
                    // Obtener nombre e imagen de la mascota para la notificación
                    const detailsQuery = `
                        SELECT nombre_mascot, image1_mascot
                        FROM "mascotas" 
                        WHERE idxxxx_mascot = $1;
                    `;
                    const detailsResult = await pool.query(detailsQuery, [mascotaId]);
                    const details = detailsResult.rows[0];

                    let notificationType = null;
                    let notificationMessage = null;

                    if (status === 'Aceptada') {
                        notificationType = 'solicitud_aceptada';
                        notificationMessage = `Tu solicitud para ${details.nombre_mascot} ha sido Aceptada. El creador se pondrá en contacto contigo.`;
                    } else if (status === 'Rechazada') {
                        notificationType = 'solicitud_rechazada';
                        notificationMessage = `Tu solicitud para ${details.nombre_mascot} ha sido Rechazada. Puedes intentar con otras mascotas.`;
                    }
                    
                    if (notificationType && notificationMessage) {
                        await createAndEmitNotification({
                            forane_usuari_id: solicitanteId,
                            type: notificationType,
                            message: notificationMessage,
                            forane_solici_id: formId,
                            related_user_id: userId,
                            image_url: details.image1_mascot 
                        });
                    }
                }
                // --- FIN: Lógica de Notificaciones ---

                res.status(200).json({ 
                    message: 'Estado de solicitud actualizado con éxito.', 
                    updatedForm: updatedForm
                });

            } catch (error) {
                console.error('Error al actualizar estado de adopción:', error);
                res.status(500).json({ message: 'Error interno del servidor al actualizar el estado.', error: error.message });
            }
        },

        /**
         * Función para actualizar el estado de la mascota a 'Adoptado'.
         * NOTIFICA a TODOS los demás solicitantes que la mascota YA FUE ADOPTADA.
         */
        updateMascotStatus: async (req, res) => {
            const { mascotId } = req.params;
            const { status } = req.body;
            
            if (!['Disponible', 'Adoptado'].includes(status)) {
                return res.status(400).json({ message: "Estado de mascota inválido." });
            }

            try {
                // 1. Actualización y obtención de nombre e imagen
                const query = `
                    UPDATE "mascotas" 
                    SET status_mascot = $1
                    WHERE idxxxx_mascot = $2
                    RETURNING idxxxx_mascot, status_mascot, nombre_mascot, image1_mascot; 
                `; 
                const result = await pool.query(query, [status, mascotId]);

                if (result.rowCount === 0) {
                    return res.status(404).json({ message: 'Mascota no encontrada o no pertenece al usuario.' });
                }
                
                const updatedMascot = result.rows[0];

                // --- Lógica de Notificaciones (Mascota Adoptada) ---
                if (status === 'Adoptado') {
                    // 2. Obtener lista de usuarios solicitantes (excluyendo al ganador, si ya fue marcado)
                    const applicantsQuery = `
                        SELECT s.forane_solici_id
                        FROM "solicitudes_adopcion" s
                        WHERE s.forane_mascot_id = $1
                          AND (s.adosuc_solici IS NULL OR s.adosuc_solici = FALSE);
                    `;
                    const applicantsResult = await pool.query(applicantsQuery, [mascotId]);
                    const applicantsToNotify = applicantsResult.rows;

                    const notificationMessage = `${updatedMascot.nombre_mascot} ha encontrado un nuevo hogar. Puedes explorar a otras mascotas similares.`;

                    // Notificar a CADA solicitante
                    for (const applicant of applicantsToNotify) {
                        await createAndEmitNotification({
                            forane_usuari_id: applicant.forane_solici_id,
                            type: 'mascota_adoptada',
                            message: notificationMessage,
                            image_url: updatedMascot.image1_mascot 
                        });
                    }
                }
                // --- FIN: Lógica de Notificaciones ---

                res.status(200).json({ 
                    message: `Estado de mascota ${mascotId} actualizado a ${status}`,
                    mascot: updatedMascot
                });
            } catch (error) {
                console.error('Error al actualizar estado de mascota:', error);
                res.status(500).json({ message: 'Error interno del servidor al actualizar estado de mascota.' });
            }
        },
        
        /**
         * Función para marcar una solicitud como adopción exitosa (adosuc_solici=TRUE).
         * NOTIFICA al SOLICITANTE GANADOR y al DUEÑO.
         */
        updateAdoptionStatusMas: async (req, res) => {
            const { idSolicitud } = req.params;
            let { isAdopted } = req.body; 
            const userId = req.user.id; 

            if (isAdopted === undefined || isAdopted === null) {
                return res.status(400).json({ message: 'Se requiere el campo "isAdopted".' });
            }
            const finalStatus = (isAdopted === true || isAdopted === 'true'); 

            try {
                // 1. Verificación de dueño y obtención de datos clave
                const verificationQuery = `
                    SELECT 
                        s.forane_solici_id, s.forane_mascot_id, 
                        m.forane_usuari_id AS dueno_id, m.nombre_mascot, m.image1_mascot
                    FROM "solicitudes_adopcion" s
                    JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
                    WHERE s.idxxxx_solici = $1;
                `;
                const verificationResult = await pool.query(verificationQuery, [idSolicitud]);

                if (verificationResult.rows.length === 0) {
                    return res.status(404).json({ message: 'Solicitud no encontrada.' });
                }
                const { dueno_id, forane_solici_id, forane_mascot_id, nombre_mascot, image1_mascot } = verificationResult.rows[0];

                if (dueno_id !== userId) {
                    return res.status(403).json({ message: 'Acceso denegado: Solo el dueño de la mascota puede confirmar la adopción.' });
                }
                
                // 2. ACTUALIZACIÓN (Marcando el solicitante como ganador)
                const query = `
                    UPDATE "solicitudes_adopcion"
                    SET adosuc_solici = $1
                    WHERE idxxxx_solici = $2
                    RETURNING adosuc_solici;
                `;
                const result = await pool.query(query, [finalStatus, idSolicitud]); 

                // --- Lógica de Notificación Final de Éxito ---
                if (finalStatus) {
                    // Notificar al SOLICITANTE GANADOR
                    await createAndEmitNotification({
                        forane_usuari_id: forane_solici_id,
                        type: 'adopcion_exitosa',
                        message: `¡Felicidades! Has adoptado a **${nombre_mascot}**. Gracias por darle un nuevo hogar.`,
                        forane_solici_id: idSolicitud,
                        related_user_id: userId,
                        image_url: image1_mascot
                    });
                    
                    // Notificar al DUEÑO (para su registro)
                    await createAndEmitNotification({
                        forane_usuari_id: dueno_id,
                        type: 'mascota_entregada',
                        message: `¡Éxito! Has entregado a **${nombre_mascot}** en adopción.`,
                        forane_solici_id: idSolicitud,
                        related_user_id: forane_solici_id,
                        image_url: image1_mascot
                    });
                }
                // --- FIN: Lógica de Notificación Final de Éxito ---

                res.status(200).json({ 
                    message: `Estado de adopción actualizado a ${finalStatus ? 'Adoptado' : 'No Adoptado'}.`, 
                    newStatus: result.rows[0].adosuc_solici
                });
                
            } catch (error) {
                console.error('Error al actualizar adosuc_solici:', error);
                res.status(500).json({ message: 'Error interno del servidor.' });
            }
        },

        // --- HANDLERS SIN NOTIFICACIÓN (mantienen su código original) ---
        getUserAdoptionForms: async (req, res) => {
            const userId = req.user.id; 
            try {
                const query = `
                    SELECT 
                        s.idxxxx_solici, s.fechax_solici, m.nombre_mascot, s.estado_solici, 
                        s.forane_mascot_id, d.*
                    FROM 
                        "solicitudes_adopcion" s
                    JOIN 
                        "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
                    JOIN 
                        "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
                    WHERE 
                        s.forane_solici_id = $1
                    ORDER BY 
                        s.fechax_solici DESC;
                `;
                const result = await pool.query(query, [userId]);
                res.status(200).json(result.rows);
            } catch (error) {
                console.error('Error al obtener formularios de adopción del usuario:', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes.', error: error.message });
            }
        },
        
        getUserAdoptionSuccess: async (req, res) => {
            const userId = req.user.id; 
            try {
                const query = `
                    SELECT s.idxxxx_solici, s.fechax_solici, m.nombre_mascot, s.estado_solici, s.adosuc_solici, 'Adoptado' AS estado_adopcion, s.forane_mascot_id, d.*
                    FROM "solicitudes_adopcion" s
                    JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
                    JOIN "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
                    WHERE s.forane_solici_id = $1 AND s.adosuc_solici=TRUE
                    ORDER BY s.fechax_solici DESC;
                `;
                const result = await pool.query(query, [userId]);
                res.status(200).json(result.rows);
            } catch (error) {
                console.error('Error al obtener formularios de adopción del usuario:', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes.', error: error.message });
            }
        },

        getAdoptionFormById: async (req, res) => {
            const { formId } = req.params;
            if (!formId || isNaN(formId) || parseInt(formId) <= 0) { 
                return res.status(400).json({ message: 'ID de formulario inválido o faltante.' });
            }
            try {
                const query = `
                    SELECT f.*, s.*  
                    FROM "formularioAdopcion" f
                    JOIN solicitudes_adopcion s ON f.idxxxx_forado = s.forane_forado_id  
                    WHERE f.idxxxx_forado = $1; 
                `;
                const result = await pool.query(query, [formId]);
                if (result.rows.length === 0) {
                    return res.status(404).json({ message: 'Formulario no encontrado o no autorizado.' });
                }
                res.status(200).json(result.rows[0]);
            } catch (error) {
                console.error('Error al obtener formulario de adopción por ID:', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener el formulario.', error: error.message });
            }
        },

        getReceivedAdoptionForms: async (req, res) => {
            const userId = req.user.id; 
            try {
                const query = `
                    SELECT s.idxxxx_solici, s.fechax_solici, m.nombre_mascot, m.status_mascot, s.estado_solici, s.forane_mascot_id, s.adosuc_solici, d.* FROM "solicitudes_adopcion" s
                    JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
                    JOIN "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
                    WHERE m.forane_usuari_id = $1
                    ORDER BY s.fechax_solici DESC;
                `;
                const result = await pool.query(query, [userId]);
                res.status(200).json(result.rows);
            } catch (error) {
                console.error('Error al obtener formularios de adopción recibidos:', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes recibidas.', error: error.message });
            }
        },

        getNotifications: async (req, res) => {
            // Obtenemos el ID del usuario autenticado a través del middleware (JWT)
            // Nota: Asumo que tu middleware 'verifyToken' adjunta el ID del usuario a 'req.user.id'
            const userId = req.user.id; 
    
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado o ID de usuario no proporcionado.' });
            }
    
            try {
                // Utilizamos la estructura de tu tabla 'notifications' (idxxxx_notifi, is_read, etc.)
                const query = `
                    SELECT 
                        idxxxx_notifi AS id, 
                        type, 
                        message, 
                        forane_solici_id, 
                        related_user_id, 
                        image_url,
                        is_read,
                        created_at
                    FROM 
                        notifications
                    WHERE 
                        forane_usuari_id = $1
                    ORDER BY 
                        created_at DESC
                    LIMIT 5; -- Limitar a las 10 más recientes para el dropdown
                `;
                const result = await pool.query(query, [userId]);
                
                // Retorna las notificaciones para que Vue las muestre.
                res.status(200).json(result.rows);
            } catch (error) {
                console.error('Error al obtener notificaciones:', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las notificaciones.', error: error.message });
            }
        },

        /**
     * Marca todas las notificaciones no leídas como leídas para un usuario.
     * Endpoint: PATCH /api/notifications/read
     */
        markAllAsRead: async (req, res) => {
            const userId = req.user.id; 

            if (!userId) {
                return res.status(401).json({ message: 'No autenticado.' });
            }

            try {
                // Solo actualiza si is_read es FALSE
                const query = `
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE forane_usuari_id = $1 AND is_read = FALSE
                    RETURNING idxxxx_notifi;
                `;
                const result = await pool.query(query, [userId]);

                if (result.rowCount > 0) {
                    // Si la actualización es exitosa, Vue actualizará su estado local.
                    res.status(200).json({ message: `Marcadas ${result.rowCount} notificaciones como leídas.` });
                } else {
                    res.status(200).json({ message: 'No hay notificaciones pendientes para marcar.' });
                }
            } catch (error) {
                console.error('Error al marcar notificaciones como leídas:', error);
                res.status(500).json({ message: 'Error interno del servidor al marcar notificaciones como leídas.' });
            }
        },
    };
};