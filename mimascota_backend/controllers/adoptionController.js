const AdoptionModel = require('../models/AdoptionModel');
const NotificationModel = require('../models/NotificationModel'); // Para la lógica de Notificaciones

// El controlador sigue exportando una función que recibe 'io' para usar Socket.io
module.exports = (io) => {
    
    return {
        
        // ==========================================================
        // HANDLERS CON LÓGICA DE NEGOCIO Y NOTIFICACIÓN
        // ==========================================================
        
        /**
         * Función para enviar el formulario de adopción.
         * (Implementada previamente)
         */
        submitAdoptionForm: async (req, res) => {
            const userId = req.user.id; 
            const formDetails = req.body; 

            if (!userId || !formDetails.forane_mascot_id || !formDetails.nombre_forado || !formDetails.correo_forado) {
                return res.status(400).json({ message: 'Datos incompletos para el formulario de adopción.' });
            }

            try {
                // LLAMADA AL MODELO: Ejecuta la transacción DB y obtiene datos para la notificación.
                const { 
                    solicitud, nombre_mascot, image1_mascot, forane_public_id, nombre_forado, idxxxx_solici 
                } = await AdoptionModel.createAdoptionSolicitud(userId, formDetails);
                
                // LÓGICA DE COMUNICACIÓN: Notificar al DUEÑO de la mascota
                await NotificationModel.createAndEmitNotification(io, {
                    forane_usuari_id: forane_public_id,
                    type: 'nueva_solicitud',
                    message: `Tienes una nueva solicitud de adopción para <b style="font-weight: 800;">${nombre_mascot}</b> de parte de <b style="font-weight: 800;">${nombre_forado}</b>.`,
                    forane_solici_id: idxxxx_solici,
                    related_user_id: userId,
                    image_url: image1_mascot 
                });

                res.status(201).json({ 
                    message: 'Formulario de adopción enviado con éxito. Solicitud creada.', 
                    solicitud: solicitud 
                });

            } catch (error) {
                console.error('Error en submitAdoptionForm (Controlador):', error);
                const statusCode = error.message.includes('Mascota no encontrada') ? 404 : 500;
                res.status(statusCode).json({ message: error.message || 'Error interno del servidor al procesar el formulario.' });
            }
        },

        /**
         * Función para actualizar el estado de una solicitud de adopción específica.
         * (Implementada previamente)
         */
        updateAdoptionStatus: async (req, res) => {
            const userId = req.user.id;
            const { formId } = req.params; 
            const { status } = req.body;

            if (!status || !['Aceptada', 'Rechazada', 'Pendiente'].includes(status)) {
                return res.status(400).json({ message: 'Estado inválido proporcionado.' });
            }

            try {
                // LLAMADA AL MODELO: Ejecuta la verificación y la actualización de DB.
                const result = await AdoptionModel.updateSolicitudStatus(formId, userId, status);
                
                const { updatedForm, solicitanteId, details } = result;
                
                // LÓGICA DE COMUNICACIÓN: Notificación al SOLICITANTE
                if (updatedForm && (status === 'Aceptada' || status === 'Rechazada')) {
                    
                    const notificationType = status === 'Aceptada' ? 'solicitud_aceptada' : 'solicitud_rechazada';
                    const notificationMessage = status === 'Aceptada' 
                        ? `Tu solicitud para ${details.nombre_mascot} ha sido <b style="font-weight: 800;">Aceptada</b>. El creador se pondrá en contacto contigo.`
                        : `Tu solicitud para ${details.nombre_mascot} ha sido <b style="font-weight: 800;">Rechazada</b>. Puedes explorar otras mascotas.`;
                    
                    await NotificationModel.createAndEmitNotification(io, {
                        forane_usuari_id: solicitanteId,
                        type: notificationType,
                        message: notificationMessage,
                        forane_solici_id: formId,
                        related_user_id: userId, // El dueño que actualizó
                        image_url: details.image1_mascot 
                    });
                }
                
                res.status(200).json({ 
                    message: 'Estado de solicitud actualizado con éxito.', 
                    updatedForm: updatedForm
                });

            } catch (error) {
                console.error('Error en updateAdoptionStatus (Controlador):', error);
                const statusCode = error.message.includes('No autorizado') ? 403 : 
                                   error.message.includes('Solicitud no encontrada') ? 404 : 
                                   500;
                res.status(statusCode).json({ message: error.message || 'Error interno del servidor al actualizar el estado.' });
            }
        },

        /**
         * Función para actualizar el estado de la mascota a 'Adoptado'.
         * Notifica a TODOS los demás solicitantes que la mascota ya fue adoptada.
         */
        updateMascotStatus: async (req, res) => {
            const { mascotId } = req.params;
            const { status } = req.body;
            
            if (!['Disponible', 'Adoptado'].includes(status)) {
                return res.status(400).json({ message: "Estado de mascota inválido." });
            }

            try {
                // LLAMADA AL MODELO: Actualiza DB y obtiene solicitantes a notificar.
                const { updatedMascot, applicantsToNotify } = await AdoptionModel.updateMascotStatus(mascotId, status);
                
                // LÓGICA DE COMUNICACIÓN: Notificación a solicitantes NO ganadores
                if (status === 'Adoptado' && applicantsToNotify.length > 0) {
                    const notificationMessage = `<b style="font-weight: 800;">${updatedMascot.nombre_mascot}</b> ha encontrado un nuevo hogar. Puedes explorar a otras mascotas similares.`;

                    // Notificar a CADA solicitante no ganador
                    for (const applicant of applicantsToNotify) {
                        await NotificationModel.createAndEmitNotification(io, {
                            forane_usuari_id: applicant.forane_solici_id,
                            type: 'mascota_adoptada',
                            message: notificationMessage,
                            image_url: updatedMascot.image1_mascot 
                        });
                    }
                }

                res.status(200).json({ 
                    message: `Estado de mascota ${mascotId} actualizado a ${status}`,
                    mascot: updatedMascot
                });
            } catch (error) {
                console.error('Error en updateMascotStatus (Controlador):', error);
                const statusCode = error.message.includes('Mascota no encontrada') ? 404 : 500;
                res.status(statusCode).json({ message: error.message || 'Error interno del servidor al actualizar estado de mascota.' });
            }
        },

        /**
         * Función para marcar una solicitud como adopción exitosa (adosuc_solici=TRUE).
         * Notifica al SOLICITANTE GANADOR y al DUEÑO.
         */
        updateAdoptionStatusMas: async (req, res) => {
            const { idSolicitud } = req.params;
            let { isAdopted } = req.body; 
            const userId = req.user.id; 

            if (isAdopted === undefined || isAdopted === null) {
                return res.status(400).json({ message: 'Se requiere el campo "isAdopted".' });
            }

            try {
                // LLAMADA AL MODELO: Actualiza DB y verifica permisos.
                const { newStatus, data } = await AdoptionModel.updateAdoptionStatusMas(idSolicitud, isAdopted, userId);
                
                const finalStatus = data.finalStatus;
                
                // LÓGICA DE NOTIFICACIÓN FINAL DE ÉXITO
                if (finalStatus) {
                    // Notificar al SOLICITANTE GANADOR
                    await NotificationModel.createAndEmitNotification(io, {
                        forane_usuari_id: data.forane_solici_id,
                        type: 'adopcion_exitosa',
                        forane_solici_id: idSolicitud,
                        message: `¡Felicidades! Has adoptado a <b style="font-weight: 800;">${data.nombre_mascot}</b>. Gracias por darle un nuevo hogar.`,
                        related_user_id: userId, // El dueño que confirma
                        image_url: data.image1_mascot
                    });
                    
                    // Notificar al DUEÑO (para su registro)
                    await NotificationModel.createAndEmitNotification(io, {
                        forane_usuari_id: data.dueno_id,
                        type: 'mascota_entregada',
                        message: `¡Éxito! Has entregado a <b style="font-weight: 800;">${data.nombre_mascot}</b> en adopción.`,
                        forane_solici_id: idSolicitud,
                        related_user_id: data.forane_solici_id, // El solicitante
                        image_url: data.image1_mascot
                    });
                }
                
                res.status(200).json({ 
                    message: `Estado de adopción actualizado a ${finalStatus ? 'Adoptado' : 'No Adoptado'}.`, 
                    newStatus: newStatus
                });
                
            } catch (error) {
                console.error('Error en updateAdoptionStatusMas (Controlador):', error);
                const statusCode = error.message.includes('denegado') ? 403 : 
                                   error.message.includes('Solicitud no encontrada') ? 404 : 
                                   500;
                res.status(statusCode).json({ message: error.message || 'Error interno del servidor.' });
            }
        },

        // ==========================================================
        // HANDLERS DE SOLO LECTURA Y LÓGICA DE NOTIFICACIÓN SIMPLE
        // ==========================================================

        /**
         * Obtiene los formularios de adopción enviados por el usuario.
         */
        getUserAdoptionForms: async (req, res) => {
            try {
                const forms = await AdoptionModel.getUserAdoptionForms(req.user.id);
                res.status(200).json(forms);
            } catch (error) {
                console.error('Error al obtener formularios de adopción del usuario (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes.', error: error.message });
            }
        },

        
        /**
         * Obtiene los formularios de adopción del usuario marcados como exitosos.
         */
        getUserAdoptionSuccess: async (req, res) => {
            try {
                const forms = await AdoptionModel.getUserAdoptionSuccess(req.user.id);
                res.status(200).json(forms);
            } catch (error) {
                console.error('Error al obtener formularios de adopción exitosos (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes.', error: error.message });
            }
        },

        /**
         * Obtiene los detalles de un formulario de adopción por su ID de formulario (idxxxx_forado).
         */
        getAdoptionFormById: async (req, res) => {
            const { formId } = req.params;
            if (!formId) { 
                return res.status(400).json({ message: 'ID de formulario faltante.' });
            }
            try {
                const form = await AdoptionModel.getAdoptionFormById(formId);
                if (!form) {
                    return res.status(404).json({ message: 'Formulario no encontrado.' });
                }
                res.status(200).json(form);
            } catch (error) {
                console.error('Error al obtener formulario de adopción por ID (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener el formulario.', error: error.message });
            }
        },

        /**
         * Obtiene los formularios de adopción recibidos por el usuario (dueño de la mascota).
         */
        getReceivedAdoptionForms: async (req, res) => {
            try {
                const forms = await AdoptionModel.getReceivedAdoptionForms(req.user.id);
                res.status(200).json(forms);
            } catch (error) {
                console.error('Error al obtener formularios de adopción recibidos (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes recibidas.', error: error.message });
            }
        },
        
        // --- HANDLERS DE NOTIFICACIONES (Usan NotificationModel) ---

        /**
         * Obtiene todas las notificaciones del usuario.
         */
        getNotifications: async (req, res) => {
            const userId = req.user.id; 
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado.' });
            }
            try {
                const notifications = await NotificationModel.getNotificationsByUserId(userId);
                res.status(200).json(notifications);
            } catch (error) {
                console.error('Error al obtener notificaciones (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al obtener las notificaciones.', error: error.message });
            }
        },

        /**
         * Marca todas las notificaciones no leídas como leídas para un usuario.
         */
        markAllAsRead: async (req, res) => {
            const userId = req.user.id; 
            if (!userId) {
                return res.status(401).json({ message: 'No autenticado.' });
            }
            try {
                const rowCount = await NotificationModel.markAllAsRead(userId);

                if (rowCount > 0) {
                    res.status(200).json({ message: `Marcadas ${rowCount} notificaciones como leídas.` });
                } else {
                    res.status(200).json({ message: 'No hay notificaciones pendientes para marcar.' });
                }
            } catch (error) {
                console.error('Error al marcar notificaciones como leídas (Controlador):', error);
                res.status(500).json({ message: 'Error interno del servidor al marcar notificaciones como leídas.' });
            }
        },
    };
};