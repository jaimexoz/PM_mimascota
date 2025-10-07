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