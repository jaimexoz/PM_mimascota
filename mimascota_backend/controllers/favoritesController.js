const favoritesModel = require('../models/favoritesModel'); 

// /**
//  * Endpoint para obtener el estado real de favorito de una mascota.
//  * RUTA: GET /api/favorites/status/:mascotId
//  */
exports.checkFavoriteStatus = async (req, res) => {
    // Nota: Asumimos que req.user.id está disponible gracias a un middleware de autenticación.
    const userId = req.user.id; 
    const mascotId = req.params.mascotId;

    // 1. Validación
    if (!userId || !mascotId) {
        return res.status(400).json({ message: 'ID de usuario o mascota faltante.' });
    }

    try {
        // 2. Llamada al Modelo
        const result = await favoritesModel.findFavoriteStatusDB(userId, mascotId);
        
        // 3. Lógica de Negocio (Determinar el estado)
        // Si no existe registro, es FALSE. Si existe, usa el valor de status_favori.
        const isFavorite = result.rows.length > 0 ? result.rows[0].status_favori : false;

        // 4. Respuesta
        return res.json({ 
            isFavorite: isFavorite 
        });

    } catch (error) {
        console.error('Error al verificar estado de favorito:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// /**
//  * Endpoint para obtener todas las mascotas favoritas de un usuario.
//  * RUTA: GET /api/favorites/
//  */
exports.checkFavorites = async (req, res) => {
    const userId = req.user.id; 

    // 1. Validación
    if (!userId) {
        return res.status(400).json({ message: 'ID de usuario faltante.' });
    }

    try {
        // 2. Llamada al Modelo
        const result = await favoritesModel.getFavoritesByUserIdDB(userId); 

        // 3. Respuesta
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas favoritas:', dbError);
        res.status(500).json({ message: 'Error interno del servidor al obtener mascotas favoritas.', error: dbError.message });
    }
};

// /**
//  * Endpoint para alternar el estado de favorito (TRUE/FALSE).
//  * RUTA: POST /api/favorites/:mascotId
//  */
exports.toggleFavorite = async (req, res) => {
    const userId = req.user.id;
    const mascotId = req.params.mascotId;

    // 1. Validación
    if (!userId || !mascotId) {
        return res.status(400).json({ message: 'ID de usuario o mascota faltante.' });
    }

    try {
        // 2. Verificar si la relación existe (Modelo)
        const checkResult = await favoritesModel.checkExistingFavoriteDB(userId, mascotId);

        if (checkResult.rows.length === 0) {
            // 3. Si NO existe: INSERTAR (Modelo)
            const insertResult = await favoritesModel.insertNewFavoriteDB(userId, mascotId);
            
            // 4. Respuesta de Inserción
            return res.status(201).json({ 
                message: 'Mascota añadida a favoritos (registro creado).', 
                newStatus: insertResult.rows[0].status_favori 
            });

        } else {
            // 5. Si SÍ existe: ACTUALIZAR el estado al opuesto
            const currentStatus = checkResult.rows[0].status_favori;
            const newStatus = !currentStatus; // Lógica de alternancia (Controlador)

            // 6. Actualizar en DB (Modelo)
            const updateResult = await favoritesModel.updateFavoriteStatusDB(userId, mascotId, newStatus);

            // 7. Respuesta de Actualización
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

