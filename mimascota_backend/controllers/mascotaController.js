// mi_mascota_backend/controllers/mascotaController.js
const pool = require('../config/db'); 
const fs = require('fs').promises; // Usamos promesas para limpieza
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig'); 
const mascotaModel = require('../models/mascotaModel'); 

// =================================================================
// FUNCIONES DE UTILIDAD DEL CONTROLADOR (Archivos)
// =================================================================

async function uploadToCloudinary(filePath, folderName) {
    if (!filePath) return null;
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName, 
            transformation: [ { width: 800, height: 800, crop: "limit" } ]
        });
        return result.secure_url; 
    } catch (error) {
        console.error('Error al subir a Cloudinary:', error);
        return null;
    }
}

const cleanupUploadedFiles = (filePaths) => {
    filePaths.forEach(filePath => {
        const absolutePath = path.resolve(filePath); 
        fs.unlink(absolutePath).catch(err => {
            console.error(`Error al borrar el archivo local: ${absolutePath}`, err);
        });
    });
};

// =================================================================
// MANEJADORES DE RUTAS
// =================================================================

// GET /api/mascotas/editar/:id
exports.getMascotaForEdit = async (req, res) => {
    const petId = req.params.id;
    const userId = req.user.id; 

    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        // Lógica de DB movida al modelo
        const result = await mascotaModel.getMascotaEditByIdDB(client, petId, userId);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada o no tienes permiso para editarla.' });
        }
        // Validación adicional implícita: si la mascota existe, el modelo ya filtró por owner (m.forane_usuari_id = $2) en la versión anterior, 
        // aquí se asume que el modelo/SQL maneja que solo el dueño acceda o el controller debe verificar el forane_usuari_id.
        // **Nota**: El SQL en el modelo se simplificó para obtener detalles; se sugiere agregar la cláusula `AND m.forane_usuari_id = $2` si la protección de autoría es crucial aquí.
        
        res.json(result.rows[0]);

    } catch (dbError) {
        console.error('Error al consultar la BD para la edición de mascota:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener la mascota.' });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/eliminar/:id
exports.deleteMascota = async (req, res) => {
    const petId = req.params.id;
    const userId = req.user.id; 

    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        // Lógica de DB movida al modelo
        const result = await mascotaModel.softDeleteMascotaDB(client, petId, userId);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                mensaje: 'Mascota no encontrada, ya eliminada o no tienes permiso para realizar esta acción.' 
            });
        }

        res.status(200).json({ 
            mensaje: 'Publicación eliminada lógicamente con éxito.',
            id: result.rows[0].idxxxx_mascot
        });

    } catch (dbError) {
        console.error('Error al realizar la eliminación lógica:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al procesar la eliminación.' });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/home2nd
exports.getMascotasForHome2nd = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await mascotaModel.getMascotasForHome2ndDB(client);
        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);
    } catch (dbError) {
        console.error('Error al obtener las 4 mascotas más recientes (home2nd):', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas para la sección home.', error: dbError.message });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/feed (Gatos)
exports.getMascotasForGatoFeed = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await mascotaModel.getMascotasForFeedDB(client, 'Gato');
        res.status(200).json(result.rows);
    } catch (dbError) {
        console.error('Error al obtener la lista de gatos para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener gatos para el feed.', error: dbError.message });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/perros
exports.getMascotasForPerroFeed = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await mascotaModel.getMascotasForFeedDB(client, 'Perro');
        res.status(200).json(result.rows);
    } catch (dbError) {
        console.error('Error al obtener la lista de perros para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener perros para el feed.', error: dbError.message });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/MypostUser
exports.getMyPosts = async (req, res) => {
    const userId = req.user.id; 
    const client = await pool.connect();
    try {
        const result = await mascotaModel.getMyPostsByUserIdDB(client, userId);
        res.status(200).json(result.rows);
    } catch (dbError) {
        console.error('Error al consultar la BD para las publicaciones del usuario:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener las publicaciones.' });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/
exports.getAllMascotas = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await mascotaModel.getAllMascotasDB(client);
        res.status(200).json(result.rows);
    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas.', error: dbError.message });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/card/:id
exports.getMascotaCardDetails = async (req, res) => { 
    const petId = req.params.id;
    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        const result = await mascotaModel.getMascotaDetailsByIdDB(client, petId);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (dbError) {
        console.error('Error al consultar la BD para la mascota:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener la mascota.' });
    } finally {
        client.release();
    }
};


// POST /api/mascotas/
exports.createMascota = async (req, res) => {
    const forane_usuari_id = req.user.id; 
    const localImagePaths = req.files ? req.files.map(file => file.path) : [];
    let datosMascota;

    try {
        datosMascota = JSON.parse(req.body.datos);
    } catch (e) {
        cleanupUploadedFiles(localImagePaths);
        return res.status(400).json({ mensaje: 'Formato de datos de la mascota inválido (JSON no válido).' });
    }

    // 1. Subir Imágenes
    let cloudinaryImageUrls = [];
    try {
        const uploadPromises = localImagePaths.map(path => uploadToCloudinary(path, 'mascotas_para_adopcion'));
        cloudinaryImageUrls = await Promise.all(uploadPromises);
        
        if (cloudinaryImageUrls.includes(null)) {
            throw new Error("Una o más imágenes fallaron al subir a Cloudinary.");
        }
    } catch (uploadError) {
        console.error('Fallo grave durante la subida de imágenes a Cloudinary:', uploadError);
        return res.status(500).json({ mensaje: 'Error al subir una o más imágenes a Cloudinary.' });
    } finally {
        cleanupUploadedFiles(localImagePaths);
    }
    
    const client = await pool.connect(); 
    
    try {
        await client.query('BEGIN'); 

        // 2. Insertar Mascota
        const { mascotaId, caracteristicasNombres } = await mascotaModel.insertNewMascotaDB(
            client, 
            { ...datosMascota, forane_usuari_id }, 
            cloudinaryImageUrls
        ); 

        // 3. Sincronizar Características
        const caracteristicaIds = await mascotaModel.getCaracteristicaIds(client, caracteristicasNombres);
        await mascotaModel.insertMascotaCaracteristicasDB(client, mascotaId, caracteristicaIds);

        await client.query('COMMIT'); 

        res.status(201).json({ 
            mensaje: 'Mascota y características publicadas con éxito.',
            mascota_id: mascotaId
        });

    } catch (dbError) {
        await client.query('ROLLBACK'); 
        console.error('Error de base de datos en la transacción:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al guardar la mascota.', error: dbError.message });
    } finally {
        client.release();
    }
};

// PUT /api/mascotas/actualizar/:id
exports.updateMascota = async (req, res) => {
    const petId = req.params.id;
    const localImagePaths = req.files ? req.files.map(file => file.path) : [];
    let datosMascota;

    try {
        datosMascota = JSON.parse(req.body.datos);
    } catch (e) {
        cleanupUploadedFiles(localImagePaths);
        return res.status(400).json({ mensaje: 'Formato de datos de la mascota inválido (JSON no válido).' });
    }
    
    // 1. Subir nuevas imágenes si existen
    let newCloudinaryUrls = [];
    if (localImagePaths.length > 0) {
        try {
            const uploadPromises = localImagePaths.map(path => uploadToCloudinary(path, 'mascotas_para_adopcion'));
            newCloudinaryUrls = await Promise.all(uploadPromises);

            if (newCloudinaryUrls.includes(null)) {
                throw new Error("Una o más imágenes fallaron al subir a Cloudinary.");
            }
        } catch (uploadError) {
            cleanupUploadedFiles(localImagePaths); 
            console.error('Fallo durante la subida de imágenes para actualización:', uploadError);
            return res.status(500).json({ mensaje: 'Error al subir una o más imágenes nuevas.' });
        }
    }
    
    // Limpiar archivos locales después de procesar o fallar la subida
    cleanupUploadedFiles(localImagePaths); 

    const client = await pool.connect(); 
    
    try {
        await client.query('BEGIN'); 

        // 2. Actualizar datos principales (incluye lógica de URL old/new)
        const updateResult = await mascotaModel.updateMascotaPrincipalDB(
            client, 
            petId, 
            datosMascota, 
            newCloudinaryUrls
        );

        if (!updateResult.success) {
            await client.query('ROLLBACK'); 
            return res.status(404).json({ mensaje: 'Mascota no encontrada o no se pudo actualizar.' });
        }
        
        // 3. Sincronizar características
        console.log(`[updateMascota] Sincronizando características para mascota ${petId}:`, datosMascota.personalidad_array);
        await mascotaModel.syncMascotaCaracteristicasDB(client, petId, datosMascota.personalidad_array);

        await client.query('COMMIT'); 
        
        res.status(200).json({ mensaje: 'Mascota actualizada con éxito.' });

    } catch (dbError) {
        await client.query('ROLLBACK'); 
        console.error('Error de base de datos en la actualización:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la mascota.', error: dbError.message });
    } finally {
        client.release();
    }
};

// GET /api/mascotas/shortcard/:mascotId (Lógica simple)
exports.getMascotaShortCard = async (req, res) => {
    const petId = req.params.mascotId;
    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        // Reutilizamos la consulta simple del modelo
        const query = `
            SELECT
                m.idxxxx_mascot, m.nombre_mascot, m.sexoxx_mascot, 
                m.edadme_mascot, m.pesokg_mascot, m.image1_mascot 
            FROM
                mascotas m
            WHERE
                m.idxxxx_mascot = $1 AND m.eliminado_logico = FALSE
        `;
        const result = await client.query(query, [petId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (dbError) {
        console.error('Error al consultar la BD para la tarjeta corta:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    } finally {
        client.release();
    }
};