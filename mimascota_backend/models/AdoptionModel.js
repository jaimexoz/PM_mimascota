const pool = require('../config/db');
const { createLog } = require('./LogModel');

// ===============================================
// FUNCIONES TRANSACCIONALES Y DE LÓGICA DE NEGOCIO PRINCIPAL
// ===============================================

/**
 * Inserta el formulario de adopción y la solicitud en una transacción.
 * @param {number} userId - ID del usuario solicitante.
 * @param {object} formDetails - Datos del formulario.
 * @returns {object} Datos de la solicitud, el dueño, y la mascota para la notificación.
 */
async function createAdoptionSolicitud(userId, formDetails) {
    // Desestructuración de los campos necesarios
    const {
        cedula_forado, nombre_forado, fnacim_forado, correo_forado, telefo_forado,
        tvivie_forado, propie_forado, patjar_forado, tampat_forado, nperca_forado,
        masant_forado, otrmas_forado, nmasco_forado, motivo_forado, ubimas_forado,
        horasl_forado, encarg_forado, veteri_forado, gastos_forado,
        forane_mascot_id
    } = formDetails;

    // Se mantiene la lógica transaccional aquí (Modelo/Lógica de Negocio)
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. OBTENER ID DEL PUBLICADOR y datos de la mascota
        const publicadorQuery = `
            SELECT forane_usuari_id, nombre_mascot, image1_mascot 
            FROM mascotas 
            WHERE idxxxx_mascot = $1;
        `;
        const publicadorResult = await client.query(publicadorQuery, [forane_mascot_id]);

        if (publicadorResult.rows.length === 0) {
            throw new Error('Mascota no encontrada o ID de mascota inválido.');
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
        const solicitud = solicitudResult.rows[0];
        const idxxxx_solici = solicitud.idxxxx_solici;

        await client.query('COMMIT');

        return {
            solicitud,
            nombre_mascot,
            image1_mascot,
            forane_public_id,
            nombre_forado,
            idxxxx_solici
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createAdoptionSolicitud:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Actualiza el estado de una solicitud y obtiene datos para la notificación.
 */
async function updateSolicitudStatus(formId, userId, status) {
    // 1. Verificar dueño y obtener datos clave
    const verificationQuery = `
        SELECT m.forane_usuari_id, s.forane_solici_id, s.forane_mascot_id, s.estado_solici
        FROM "solicitudes_adopcion" s
        JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        WHERE s.idxxxx_solici = $1;
    `;
    const verificationResult = await pool.query(verificationQuery, [formId]);

    if (verificationResult.rows.length === 0) {
        throw new Error('Solicitud no encontrada.');
    }

    const { forane_usuari_id: duenoId, forane_solici_id: solicitanteId, forane_mascot_id: mascotaId, estado_solici: oldStatus } = verificationResult.rows[0];

    if (duenoId !== userId) {
        throw new Error('No está autorizado para modificar el estado de esta solicitud.');
    }

    // 2. Actualizar el estado en la base de datos
    const updateQuery = `
        UPDATE "solicitudes_adopcion"
        SET estado_solici = $1
        WHERE idxxxx_solici = $2
        RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [status, formId]);
    const updatedForm = updateResult.rows[0];

    let details = null;
    if (updatedForm && (status === 'Aceptada' || status === 'Rechazada')) {
        const detailsQuery = `
            SELECT nombre_mascot, image1_mascot
            FROM "mascotas" 
            WHERE idxxxx_mascot = $1;
        `;
        const detailsResult = await pool.query(detailsQuery, [mascotaId]);
        details = detailsResult.rows[0];
    }


    // LOGGING: Cambio de estado de solicitud
    await createLog({
        table: 'solicitudes_adopcion',
        column: 'estado_solici',
        oldValue: oldStatus,
        newValue: status,
        recordId: formId,
        userId: userId // El usuario que realizo la accion (dueno)
    });

    return { updatedForm, solicitanteId, userId, details, formId, status };
}

/**
 * Actualiza el estado de la mascota y obtiene los solicitantes a notificar.
 */
async function updateMascotStatus(mascotId, status) {
    // 1. Actualización y obtención de nombre e imagen
    const updateQuery = `
        UPDATE "mascotas" 
        SET status_mascot = $1
        WHERE idxxxx_mascot = $2
        RETURNING idxxxx_mascot, status_mascot, nombre_mascot, image1_mascot; 
    `;
    const updateResult = await pool.query(updateQuery, [status, mascotId]);

    if (updateResult.rowCount === 0) {
        throw new Error('Mascota no encontrada.');
    }

    const updatedMascot = updateResult.rows[0];
    let applicantsToNotify = [];

    // Lógica de Negocio: Si está 'Adoptado', obtener solicitantes que no ganaron
    if (status === 'Adoptado') {
        const applicantsQuery = `
            SELECT s.forane_solici_id
            FROM "solicitudes_adopcion" s
            WHERE s.forane_mascot_id = $1
            AND (s.adosuc_solici IS NULL OR s.adosuc_solici = FALSE);
        `;
        const applicantsResult = await pool.query(applicantsQuery, [mascotId]);
        applicantsToNotify = applicantsResult.rows;
    }

    return { updatedMascot, applicantsToNotify };
}

/**
 * Marca una solicitud como adopción exitosa (adosuc_solici=TRUE/FALSE).
 */
async function updateAdoptionStatusMas(idSolicitud, isAdopted, userId) {
    // 1. Verificación de dueño y obtención de datos clave
    const verificationQuery = `
        SELECT 
            s.forane_solici_id, s.forane_mascot_id, s.adosuc_solici,
            m.forane_usuari_id AS dueno_id, m.nombre_mascot, m.image1_mascot
        FROM "solicitudes_adopcion" s
        JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        WHERE s.idxxxx_solici = $1;
    `;
    const verificationResult = await pool.query(verificationQuery, [idSolicitud]);

    if (verificationResult.rows.length === 0) {
        throw new Error('Solicitud no encontrada.');
    }
    const { dueno_id, forane_solici_id, forane_mascot_id, nombre_mascot, image1_mascot, adosuc_solici: oldAdoptionStatus } = verificationResult.rows[0];

    if (dueno_id !== userId) {
        throw new Error('Acceso denegado: Solo el dueño de la mascota puede confirmar la adopción.');
    }

    // 2. ACTUALIZACIÓN (Marcando el solicitante como ganador)
    const finalStatus = (isAdopted === true || isAdopted === 'true');
    const updateQuery = `
        UPDATE "solicitudes_adopcion"
        SET adosuc_solici = $1
        WHERE idxxxx_solici = $2
        RETURNING adosuc_solici;
    `;
    const result = await pool.query(updateQuery, [finalStatus, idSolicitud]);

    // LOGGING: Confirmacion de Adopcion
    await createLog({
        table: 'solicitudes_adopcion',
        column: 'adosuc_solici',
        oldValue: oldAdoptionStatus,
        newValue: finalStatus,
        recordId: idSolicitud,
        userId: userId
    });

    return {
        newStatus: result.rows[0].adosuc_solici,
        data: {
            forane_solici_id,
            forane_mascot_id,
            nombre_mascot,
            image1_mascot,
            dueno_id,
            finalStatus
        }
    };
}


// ===============================================
// FUNCIONES DE SOLO LECTURA (Consultas Simples)
// ===============================================

/**
 * Obtiene los formularios de adopción enviados por un usuario.
 */
async function getUserAdoptionForms(userId) {
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
    return result.rows;
}


/**
 * Obtiene los formularios donde la adopción fue exitosa para un usuario.
 */
async function getUserAdoptionSuccess(userId) {
    const query = `
        SELECT s.idxxxx_solici, s.fechax_solici, m.nombre_mascot, s.estado_solici, s.adosuc_solici, 'Adoptado' AS estado_adopcion, s.forane_mascot_id, d.*
        FROM "solicitudes_adopcion" s
        JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        JOIN "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
        WHERE s.forane_solici_id = $1 AND s.adosuc_solici=TRUE
        ORDER BY s.fechax_solici DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Obtiene los detalles de un formulario de adopción por su ID de formulario (idxxxx_forado).
 */
async function getAdoptionFormById(formId) {
    // 1. Usa comillas invertidas (backticks `) para definir la query
    const query = `
        SELECT f.*, s.*
        FROM "formularioAdopcion" f
        JOIN "solicitudes_adopcion" s ON f.idxxxx_forado = s.forane_forado_id
        WHERE f.idxxxx_forado = $1;
    `;

    // 2. Asegúrate de pasar la conexión (client) y el ID
    const client = await pool.connect();
    try {
        const result = await client.query(query, [formId]);

        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0]; // Debe devolver solo 1 fila (el formulario)

    } catch (error) {
        console.error('Error al obtener el formulario de adopción por ID (Modelo):', error);
        throw error; // Propaga el error para que el controlador lo maneje
    } finally {
        client.release();
    }
}

/**
 * Obtiene los formularios de adopción recibidos por un usuario (dueño de la mascota).
 */
async function getReceivedAdoptionForms(userId) {
    const query = `
        SELECT s.idxxxx_solici, s.fechax_solici, m.nombre_mascot, m.status_mascot, s.estado_solici, s.forane_mascot_id, s.adosuc_solici, d.* FROM "solicitudes_adopcion" s
        JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        JOIN "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
        WHERE m.forane_usuari_id = $1
        ORDER BY s.fechax_solici DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Verifica si un usuario ya tiene una solicitud de adopción para una mascota específica.
 * @param {number} userId - ID del usuario.
 * @param {number} mascotId - ID de la mascota.
 * @returns {object|null} La solicitud si existe, o null si no.
 */
async function checkUserAdoptionForPet(userId, mascotId) {
    const query = `
        SELECT 
            s.idxxxx_solici, 
            s.fechax_solici, 
            s.estado_solici, 
            s.adosuc_solici,
            s.forane_mascot_id,
            m.nombre_mascot
        FROM "solicitudes_adopcion" s
        JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        WHERE s.forane_solici_id = $1 AND s.forane_mascot_id = $2
        LIMIT 1;
    `;
    const result = await pool.query(query, [userId, mascotId]);

    if (result.rows.length > 0) {
        return result.rows[0]; // Retorna la solicitud existente
    }
    return null; // No hay solicitud
}

// ===============================================
// EXPORTACIÓN FINAL
// ===============================================

module.exports = {
    createAdoptionSolicitud,
    updateSolicitudStatus,
    updateMascotStatus,
    updateAdoptionStatusMas, // Nueva
    getUserAdoptionForms,
    getUserAdoptionSuccess, // Nueva
    getAdoptionFormById, // Nueva
    getReceivedAdoptionForms, // Nueva
    checkUserAdoptionForPet // ← Añadida la nueva función
};