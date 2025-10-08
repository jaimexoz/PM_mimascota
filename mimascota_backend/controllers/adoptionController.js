const pool = require('../config/db'); // Tu conexión a PostgreSQL

/**
 * Función para enviar el formulario de adopción a la base de datos.
 * RUTA: POST /api/adoptions
 * Requiere autenticación (protect middleware)
 */
exports.submitAdoptionForm = async (req, res) => {
    // El userId viene del middleware de autenticación
    const userId = req.user.id; 

    // Destructurar los datos del formulario enviados desde el frontend
    const {
        cedula_forado,
        nombre_forado,
        fnacim_forado,
        correo_forado,
        telefo_forado,
        tvivie_forado,
        propie_forado,
        patjar_forado,
        tampat_forado,
        nperca_forado,
        masant_forado,
        otrmas_forado,
        nmasco_forado,
        motivo_forado,
        ubimas_forado,
        horasl_forado,
        encarg_forado,
        veteri_forado,
        gastos_forado,
        forane_mascot_id // Este ID se envía desde el frontend
    } = req.body;

    // Validación básica (puedes añadir más si es necesario)
    if (!userId || !forane_mascot_id || !cedula_forado || !nombre_forado || !correo_forado) {
        return res.status(400).json({ message: 'Datos incompletos para el formulario de adopción.' });
    }

    try {
        const query = `
            INSERT INTO "formularioAdopcion" (
                fechax_forado, cedula_forado, nombre_forado, fnacim_forado, correo_forado, 
                telefo_forado, tvivie_forado, propie_forado, patjar_forado, tampat_forado, 
                nperca_forado, masant_forado, otrmas_forado, nmasco_forado, motivo_forado, 
                ubimas_forado, horasl_forado, encarg_forado, veteri_forado, gastos_forado, 
                status_forado, forane_usuari_id, forane_mascot_id
            ) VALUES (
                NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 
                'Pendiente', $20, $21
            ) RETURNING *;
        `;
        const values = [
            cedula_forado,
            nombre_forado,
            fnacim_forado, // Asumimos que viene en formato 'YYYY-MM-DD'
            correo_forado,
            telefo_forado,
            tvivie_forado,
            propie_forado,
            patjar_forado,
            tampat_forado,
            nperca_forado,
            masant_forado,
            otrmas_forado,
            nmasco_forado,
            motivo_forado,
            ubimas_forado,
            horasl_forado,
            encarg_forado,
            veteri_forado,
            gastos_forado,
            userId,           // forane_usuari_id
            forane_mascot_id  // forane_mascot_id
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ 
            message: 'Formulario de adopción enviado con éxito.', 
            submission: result.rows[0] 
        });

    } catch (error) {
        console.error('Error al enviar formulario de adopción:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el formulario.', error: error.message });
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
                f.*, 
                m.nombre_mascot 
            FROM "formularioAdopcion" f
            JOIN "mascotas" m ON f.forane_mascot_id = m.idxxxx_mascot
            WHERE f.forane_usuari_id = $1
            ORDER BY f.fechax_forado DESC;
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
            SELECT * FROM "formularioAdopcion"
            WHERE idxxxx_forado = $1 AND forane_usuari_id = $2;
        `;
        const values = [formId, userId];

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
                f.*,
                m.nombre_mascot
            FROM 
                "formularioAdopcion" f
            JOIN 
                "mascotas" m ON f.forane_mascot_id = m.idxxxx_mascot
            WHERE 
                m.forane_usuari_id = $1
            ORDER BY 
                f.fechax_forado DESC;
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
            FROM "formularioAdopcion" f
            JOIN "mascotas" m ON f.forane_mascot_id = m.idxxxx_mascot
            WHERE f.idxxxx_forado = $1;
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
            UPDATE "formularioAdopcion"
            SET status_forado = $1
            WHERE idxxxx_forado = $2
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
// **********************************************
// * NOTA: Debes exportar la nueva función al final del archivo.
// **********************************************