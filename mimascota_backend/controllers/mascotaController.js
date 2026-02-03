// mi_mascota_backend/controllers/mascotaController.js
const pool = require('../config/db');
const fs = require('fs').promises; // Usamos promesas para limpieza
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');
const mascotaModel = require('../models/mascotaModel');
const NotificationModel = require('../models/NotificationModel');
const mlService = require('../services/mlService');

// =================================================================
// FUNCIONES DE UTILIDAD DEL CONTROLADOR (Archivos)
// =================================================================

async function uploadToCloudinary(filePath, folderName) {
    if (!filePath) return null;
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName,
            transformation: [{ width: 2048, height: 2048, crop: "limit" }]
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

/**
 * [PUT] Actualiza el estado de aprobación (approv_mascot) de una mascota.
 * Requiere rol de Administrador o Empleado.
 */
exports.updateMascotaApprovalStatus = async (req, res) => {
    // La verificación de rol debe ir aquí también
    const mascotaId = req.params.mascotId;
    const { approv_mascot } = req.body;

    // 1. Validar el estado
    const validStatuses = ['Pendiente', 'Aprobada', 'Rechazada'];
    if (!validStatuses.includes(approv_mascot)) {
        return res.status(400).json({ message: "Estado de aprobación inválido." });
    }

    try {
        const updatedMascota = await mascotaModel.updateMascotaApproval(mascotaId, approv_mascot);

        if (!updatedMascota) {
            return res.status(404).json({ message: "Mascota no encontrada para actualizar." });
        }

        res.status(200).json({
            message: `Estado de aprobación actualizado a ${approv_mascot}`,
            mascota: updatedMascota
        });

    } catch (error) {
        console.error('Error al actualizar estado de aprobación:', error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el estado." });
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

    // 1. Subir Imágenes (Lógica intacta)
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

        // 2. Insertar Mascota (Lógica intacta)
        // NOTA: Asumo que 'caracteristicasNombres' es un array de strings ej: ['Juguetón', 'Amigable']
        const { mascotaId, caracteristicasNombres } = await mascotaModel.insertNewMascotaDB(
            client,
            { ...datosMascota, forane_usuari_id },
            cloudinaryImageUrls
        );

        // 3. Sincronizar Características (Lógica intacta)
        const caracteristicaIds = await mascotaModel.getCaracteristicaIds(client, caracteristicasNombres);
        await mascotaModel.insertMascotaCaracteristicasDB(client, mascotaId, caracteristicaIds);

        // -----------------------------------------------------------------------
        // 4. NUEVA LÓGICA: CÁLCULO DE MACHINE LEARNING
        // -----------------------------------------------------------------------
        try {
            // A. Preparamos el objeto con los nombres de columna que espera el mlService.
            // Mapeamos los datos del JSON (datosMascota) a lo que el servicio necesita.
            const datosParaVector = {
                especi_mascot: datosMascota.especie,   // Asegúrate que tu JSON trae .especie
                edadme_mascot: datosMascota.edad,      // Asegúrate que tu JSON trae .edad
                tamano_mascot: datosMascota.tamano,    // Asegúrate que tu JSON trae .tamano
                nenerg_mascot: datosMascota.energia,   // Asegúrate que tu JSON trae .energia
                lista_personalidad: caracteristicasNombres || [] // Usamos los nombres retornados en paso 2
            };

            // B. Calculamos el vector matemático
            const vectorCalculado = mlService.createPetVector(datosParaVector);

            // C. Guardamos el vector en la base de datos (dentro de la misma transacción)
            // Asegúrate que 'idxxxx_mascot' es el nombre real de tu ID en la tabla
            await client.query(
                'UPDATE mascotas SET vector_caracteristicas = $1 WHERE idxxxx_mascot = $2',
                [vectorCalculado, mascotaId]
            );

        } catch (mlError) {
            // Opcional: Si el ML falla, ¿quieres cancelar todo el registro? 
            // Aquí solo lo logueamos para no impedir el registro, pero puedes hacer throw mlError si prefieres estricto.
            console.error("Advertencia: No se pudo generar el vector ML para la mascota " + mascotaId, mlError);
        }
        // -----------------------------------------------------------------------

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

    // 1. Subir nuevas imágenes si existen (Lógica intacta)
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

    cleanupUploadedFiles(localImagePaths);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 2. Actualizar datos principales (Lógica intacta)
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

        // 3. Sincronizar características (Lógica intacta)
        await mascotaModel.syncMascotaCaracteristicasDB(client, petId, datosMascota.personalidad_array);
        // -----------------------------------------------------------------------
        // 4. NUEVA LÓGICA: RE-CALCULAR VECTOR DE MACHINE LEARNING
        // -----------------------------------------------------------------------
        try {
            // A. Traemos la mascota "fresca" de la base de datos
            // Esto garantiza que tenemos 'especi_mascot', 'edadme_mascot' correctos
            // y la 'lista_personalidad' actualizada.
            const mascotaFresca = await mascotaModel.obtenerMascotaCompletaPorId(client, petId);

            if (mascotaFresca) {
                // B. Debug: Ver qué estamos enviando al ML (mira esto en tu consola)
                console.log("Datos para Vector ML:", {
                    especie: mascotaFresca.especi_mascot,
                    edad: mascotaFresca.edadme_mascot,
                    tamano: mascotaFresca.tamano_mascot,
                    energia: mascotaFresca.nenerg_mascot,
                    personalidad: mascotaFresca.lista_personalidad
                });

                // C. Calculamos el vector usando el objeto directo de la DB
                // (mlService.createPetVector ya sabe leer las columnas _mascot)
                const vectorCalculado = mlService.createPetVector(mascotaFresca);

                // D. Guardamos el vector
                await client.query(
                    'UPDATE mascotas SET vector_caracteristicas = $1 WHERE idxxxx_mascot = $2',
                    [vectorCalculado, petId]
                );
            }

        } catch (mlError) {
            console.error(`Error generando vector ML:`, mlError);
        }
        // =====================================================================

        await client.query('COMMIT');
        res.status(200).json({ mensaje: 'Mascota actualizada con éxito.' });

    } catch (dbError) {
        await client.query('ROLLBACK');
        console.error('Error update:', dbError);
        res.status(500).json({ mensaje: 'Error al actualizar.' });
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