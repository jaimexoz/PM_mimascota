const pool = require('../config/db'); // Tu conexión a PostgreSQL

/**
 * Función para enviar el formulario de adopción a la base de datos.
 * RUTA: POST /api/adoptions
 * Requiere autenticación (protect middleware)
 */
// Asegúrate de que tu módulo de base de datos (`pool`) soporte transacciones.
// Si usas 'pg', puedes obtener un cliente para la transacción: `const client = await pool.connect();`

exports.submitAdoptionForm = async (req, res) => {
    // El userId (solicitante) viene del middleware de autenticación
    const userId = req.user.id; 

    // Los datos del formulario:
    const {
        cedula_forado, nombre_forado, fnacim_forado, correo_forado, telefo_forado, 
        tvivie_forado, propie_forado, patjar_forado, tampat_forado, nperca_forado, 
        masant_forado, otrmas_forado, nmasco_forado, motivo_forado, ubimas_forado, 
        horasl_forado, encarg_forado, veteri_forado, gastos_forado, 
        forane_mascot_id // Este ID se envía desde el frontend
    } = req.body;

    // Validación básica
    if (!userId || !forane_mascot_id || !nombre_forado || !correo_forado) {
        return res.status(400).json({ message: 'Datos incompletos para el formulario de adopción.' });
    }

    // Inicializa el cliente de la transacción
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Inicia la transacción

        // -----------------------------------------------------------
        // 1. OBTENER ID DEL PUBLICADOR (dueño de la mascota)
        // Necesitamos este dato para la tabla 'solicitudes_adopcion'
        // -----------------------------------------------------------
        const publicadorQuery = `
            SELECT forane_usuari_id FROM mascotas WHERE idxxxx_mascot = $1;
        `;
        const publicadorResult = await client.query(publicadorQuery, [forane_mascot_id]);

        if (publicadorResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Mascota no encontrada o ID de mascota inválido.' });
        }
        const forane_public_id = publicadorResult.rows[0].forane_usuari_id;


        // -----------------------------------------------------------
        // 2. INSERTAR DETALLES DEL FORMULARIO (Tabla A: detalles_formulario)
        // -----------------------------------------------------------
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
        const forane_forado_id = detailsResult.rows[0].idxxxx_forado; // Captura el ID generado


        // -----------------------------------------------------------
        // 3. INSERTAR LA SOLICITUD DE GESTIÓN (Tabla B: solicitudes_adopcion)
        // -----------------------------------------------------------
        const insertSolicitudQuery = `
            INSERT INTO solicitudes_adopcion (
                forane_solici_id, 
                forane_public_id, 
                forane_mascot_id, 
                forane_forado_id, 
                estado_solici
            ) VALUES (
                $1, $2, $3, $4, 'Pendiente'
            ) RETURNING idxxxx_solici, fechax_solici;
        `;
        const solicitudValues = [
            userId,             // forane_solici_id (El que aplica)
            forane_public_id,   // forane_public_id (El dueño de la mascota)
            forane_mascot_id,   // forane_mascot_id
            forane_forado_id    // forane_forado_id (El ID del formulario que acabamos de guardar)
        ];

        const solicitudResult = await client.query(insertSolicitudQuery, solicitudValues);

        await client.query('COMMIT'); // Confirma ambas inserciones

        res.status(201).json({ 
            message: 'Formulario de adopción enviado con éxito. Solicitud creada.', 
            solicitud: solicitudResult.rows[0] // Devuelve los datos de la solicitud de gestión
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Deshace todo si algo falla
        console.error('Error al enviar formulario de adopción:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el formulario.', error: error.message });
    } finally {
        client.release(); // Libera el cliente de la transacción
    }
};

/**
 * Función para obtener todos los formularios de adopción del usuario autenticado.
 * RUTA: GET /api/adoptions/user
 * Requiere autenticación (protect middleware)
 */
exports.getUserAdoptionForms = async (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado

    try {
        const query = `
            SELECT
            s.idxxxx_solici, 
            s.fechax_solici, 
            m.nombre_mascot, 
            s.estado_solici,
            s.forane_mascot_id,
            d.* -- Todos los campos del formulario detallado
        FROM 
            "solicitudes_adopcion" s
        -- 1. Unir a la tabla de mascotas para obtener el nombre
        JOIN 
            "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
        -- 2. Unir a la tabla de detalles del formulario para obtener las respuestas completas
        JOIN
            "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
        WHERE 
            s.forane_solici_id = $1                       
            -- Filtrar por el ID del usuario SOLICITANTE
        ORDER BY 
            s.fechax_solici DESC;
        `;
        const values = [userId];

        const result = await pool.query(query, values);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error al obtener formularios de adopción del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las solicitudes.', error: error.message });
    }
};
// Recuerda exportar esta función: exports.getUserAdoptionForms

// --- NUEVA FUNCIÓN AÑADIDA ---

/**
 * Función para obtener un formulario de adopción por su ID.
 * RUTA: GET /api/adoptions/:formId
 * Requiere autenticación (protect middleware) para verificar que el usuario sea el dueño.
 */
exports.getAdoptionFormById = async (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado
    const { formId } = req.params; // ID del formulario desde la URL

    // **CLAVE:** Validación de que formId es un número válido.
    if (!formId || isNaN(formId) || parseInt(formId) <= 0) { 
        console.error('Intento de acceso con formId inválido:', formId);
        return res.status(400).json({ message: 'ID de formulario inválido o faltante.' });
    }

    if (!formId) {
        return res.status(400).json({ message: 'ID de formulario es requerido.' });
    }

    try {
        const query = `
            SELECT
                f.*,  -- Selecciona todos los campos del formulario
                s.* -- Selecciona todos los campos de la solicitud
            FROM 
                "formularioAdopcion" f
            JOIN 
                solicitudes_adopcion s ON f.idxxxx_forado = s.forane_forado_id  -- <-- ESTO ES CLAVE: Define la relación
            WHERE 
                f.idxxxx_forado = $1; 
        `;
        const values = [formId];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            // Error 404 si no existe O 403 si existe pero no es el dueño (por seguridad, usamos 404 en este caso)
            return res.status(404).json({ message: 'Formulario no encontrado o no autorizado.' });
        }

        // Devolvemos el formulario encontrado
        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error('Error al obtener formulario de adopción por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el formulario.', error: error.message });
    }
};

exports.getReceivedAdoptionForms = async (req, res) => {
    // El ID del usuario autenticado (dueño de las mascotas)
    const userId = req.user.id; 

    try {
        const query = `
            SELECT
                s.idxxxx_solici, 
                s.fechax_solici, 
                m.nombre_mascot,
                m.status_mascot, 
                s.estado_solici,
                s.forane_mascot_id,
                d.* -- Todos los campos del formulario detallado
            FROM 
                "solicitudes_adopcion" s
            JOIN 
                "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
            JOIN
                "formularioAdopcion" d ON s.forane_forado_id = d.idxxxx_forado
            WHERE 
                m.forane_usuari_id = $1
            ORDER BY 
                s.fechax_solici DESC;
        `;
        const values = [userId];

        const result = await pool.query(query, values);

        // Devolvemos la lista de solicitudes
        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error al obtener formularios de adopción recibidos:', error);
        res.status(500).json({ 
            message: 'Error interno del servidor al obtener las solicitudes recibidas.', 
            error: error.message 
        });
    }
};


/**
 * Función para actualizar el estado de una solicitud de adopción específica.
 * RUTA: PATCH /api/adoptions/:formId/status
 * Requiere autenticación (protect middleware) y ser el dueño de la mascota.
 */
exports.updateAdoptionStatus = async (req, res) => {
    const userId = req.user.id;
    const { formId } = req.params;
    const { status } = req.body;

    // Validación básica del estado
    if (!status || !['Aceptada', 'Rechazada', 'Pendiente'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido proporcionado.' });
    }

    try {
        // 1. Verificar que el usuario autenticado sea el dueño de la mascota para esta solicitud
        const verificationQuery = `
            SELECT m.forane_usuari_id
            FROM "solicitudes_adopcion" s
            JOIN "mascotas" m ON s.forane_mascot_id = m.idxxxx_mascot
            WHERE s.idxxxx_solici = $1;
        `;
        const verificationResult = await pool.query(verificationQuery, [formId]);

        if (verificationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada.' });
        }

        const duenoId = verificationResult.rows[0].forane_usuari_id;

        if (duenoId !== userId) {
            return res.status(403).json({ message: 'No está autorizado para modificar el estado de esta solicitud.' });
        }

        // 2. Actualizar el estado del formulario en la base de datos
        const updateQuery = `
            UPDATE "solicitudes_adopcion"
            SET estado_solici = $1
            WHERE idxxxx_solici = $2
            RETURNING *;
        `;
        const updateResult = await pool.query(updateQuery, [status, formId]);

        res.status(200).json({ 
            message: 'Estado de solicitud actualizado con éxito.', 
            updatedForm: updateResult.rows[0] 
        });

    } catch (error) {
        console.error('Error al actualizar estado de adopción:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado.', error: error.message });
    }
};

exports.updateMascotStatus = async (req, res) => {
    const { mascotId } = req.params;
    const { status } = req.body;
    // Asegúrate de validar que el status sea 'Disponible' o 'Adoptado'
    if (!['Disponible', 'Adoptado'].includes(status)) {
        return res.status(400).json({ message: "Estado de mascota inválido." });
    }

    // Opcional pero recomendado: Verificar que el usuario sea el dueño de la mascota
    // const userId = req.user.id; 

    try {
        const query = `
            UPDATE "mascotas" 
            SET status_mascot = $1
            WHERE idxxxx_mascot = $2
            RETURNING idxxxx_mascot, status_mascot;
        `;
        const result = await pool.query(query, [status, mascotId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Mascota no encontrada o no pertenece al usuario.' });
        }

        res.status(200).json({ 
            message: `Estado de mascota ${mascotId} actualizado a ${status}`,
            mascot: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar estado de mascota:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar estado de mascota.' });
    }
};
// **********************************************
// * NOTA: Debes exportar la nueva función al final del archivo.
// **********************************************