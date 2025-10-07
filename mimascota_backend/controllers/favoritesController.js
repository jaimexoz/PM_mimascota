const pool = require('../config/db');

/**
 * Endpoint para obtener el estado real de favorito de una mascota.
 * RUTA: GET /api/favorites/status/:mascotId
 */
exports.checkFavoriteStatus = async (req, res) => {
    const userId = req.user.id; 
    const mascotId = req.params.mascotId;

    if (!userId || !mascotId) {
        return res.status(400).json({ message: 'ID de usuario o mascota faltante.' });
    }

    try {
        const query = `
            SELECT status_favori
            FROM favoritos
            WHERE forane_usuari_id = $1 AND forane_mascot_id = $2;
        `;
        const result = await pool.query(query, [userId, mascotId]);
        
        // Si no existe registro, es FALSE. Si existe, usa el valor de status_favori.
        const isFavorite = result.rows.length > 0 ? result.rows[0].status_favori : false;

        return res.json({ 
            isFavorite: isFavorite 
        });

    } catch (error) {
        console.error('Error al verificar estado de favorito:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


exports.checkFavorites = async (req, res) => {
    const userId = req.user.id; 

    if (!userId) {
        return res.status(400).json({ message: 'ID de usuario o mascota faltante.' });
    }

    try {
        const query = `
            SELECT
                m.* -- Selecciona todas las columnas de la tabla 'mascotas'
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
        const result = await pool.query(query, [userId]); 

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas para el feed.', error: dbError.message });
    }
};

/**
 * Endpoint para alternar el estado de favorito (TRUE/FALSE).
 * RUTA: POST /api/favorites/:mascotId
 * ⚠️ Este endpoint asume que la petición SIEMPRE es para cambiar al estado contrario.
 * El frontend siempre enviará POST aquí.
 */
exports.toggleFavorite = async (req, res) => {
    const userId = req.user.id;
    const mascotId = req.params.mascotId;

    try {
        // 1. Verificar si la relación (usuario-mascota) ya existe
        const checkQuery = `
            SELECT idxxxx_favori, status_favori FROM favoritos
            WHERE forane_usuari_id = $1 AND forane_mascot_id = $2;
        `;
        const checkResult = await pool.query(checkQuery, [userId, mascotId]);

        if (checkResult.rows.length === 0) {
            // 2. Si NO existe: INSERTAR con estado TRUE
            const insertQuery = `
                INSERT INTO favoritos (forane_usuari_id, forane_mascot_id, status_favori)
                VALUES ($1, $2, TRUE)
                RETURNING status_favori;
            `;
            const insertResult = await pool.query(insertQuery, [userId, mascotId]);
            return res.status(201).json({ 
                message: 'Mascota añadida a favoritos (registro creado).', 
                newStatus: insertResult.rows[0].status_favori 
            });

        } else {
            // 3. Si SÍ existe: ACTUALIZAR el estado al opuesto
            const currentStatus = checkResult.rows[0].status_favori;
            const newStatus = !currentStatus; // Alternar el estado

            const updateQuery = `
                UPDATE favoritos
                SET status_favori = $3
                WHERE forane_usuari_id = $1 AND forane_mascot_id = $2
                RETURNING status_favori;
            `;
            const updateResult = await pool.query(updateQuery, [userId, mascotId, newStatus]);

            const action = newStatus ? 'activado' : 'desactivado';
            return res.status(200).json({ 
                message: `Estado de favorito ${action}.`, 
                newStatus: updateResult.rows[0].status_favori 
            });
        }

    } catch (error) {
        console.error('Error al alternar favorito (toggle):', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Se elimina exports.addFavorite y exports.removeFavorite

// Ahora exportamos el toggle:
// exports.addFavorite = async (req, res) => { /* ELIMINADO */ }
// exports.removeFavorite = async (req, res) => { /* ELIMINADO */ }
// Ya no se necesitan las funciones separadas
// El resto de los exports se mantiene si los tienes

// Reemplaza esto al final de tu archivo:
// module.exports = { checkFavoriteStatus, addFavorite, removeFavorite };

