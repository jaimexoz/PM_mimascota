const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const fs = require('fs');
const path = require('path');
// Importación de Cloudinary. Asumo la ruta correcta.
const cloudinary = require('../config/cloudinaryConfig'); 

// ⭐️ Importamos las funciones de autenticación
const { protect } = require('../middleware/authMiddleware');

// Importamos el middleware específico para subir múltiples archivos
const { uploadArrayMascota } = require('../config/multerConfig'); 

// =================================================================
// FUNCIONES DE UTILIDAD PARA ARCHIVOS Y CLOUDINARY
// =================================================================

/**
 * Función auxiliar para subir un archivo local a Cloudinary.
 * @param {string} filePath - Ruta local del archivo temporal (dada por Multer).
 * @param {string} folderName - Carpeta en Cloudinary.
 * @returns {Promise<string|null>} URL segura de Cloudinary o null si falla.
 */
async function uploadToCloudinary(filePath, folderName) {
    if (!filePath) return null;
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folderName, // Carpeta en Cloudinary
            transformation: [
                { width: 800, height: 800, crop: "limit" } // Optimización de imagen
            ]
        });
        return result.secure_url; // URL pública del archivo
    } catch (error) {
        console.error('Error al subir a Cloudinary:', error);
        return null;
    }
}

/**
 * Función de utilidad para eliminar archivos subidos temporalmente.
 * Usa fs.unlink para la eliminación asíncrona (más seguro).
 * @param {string[]} filePaths - Array de rutas de archivos locales.
 */
const cleanupUploadedFiles = (filePaths) => {
    filePaths.forEach(filePath => {
        // Obtenemos el path absoluto para asegurar la eliminación
        const absolutePath = path.resolve(filePath); 
        fs.unlink(absolutePath, (err) => {
            if (err) console.error(`Error al borrar el archivo local: ${absolutePath}`, err);
        });
    });
};

// =================================================================
// RUTAS
// =================================================================

// ⭐️ NUEVA RUTA: GET /api/mascotas/:id 
// Objetivo: Obtener TODOS los datos de una mascota para la precarga del formulario de edición.
router.get('/editar/:id', protect, async (req, res) => {
    const petId = req.params.id;
    const userId = req.user.id; 

    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        const query = `
            SELECT
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.especi_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.razaxx_mascot, 
                m.pesokg_mascot, 
                m.tamano_mascot, 
                m.infoad_mascot, 
                m.image1_mascot, 
                m.image2_mascot, 
                m.image3_mascot, 
                m.forane_usuari_id, 
                m.status_mascot,  -- ⬅️ ¡Asegura la COMA aquí!
                COALESCE(         -- ⬅️ JSON fue eliminado
                    json_agg(c.nombre_caract) FILTER (WHERE c.nombre_caract IS NOT NULL),
                    '[]'   -- ⬅️ Cast explícito a JSONB (o json) recomendado
                ) AS personalidad_array
            FROM
                mascotas m
            LEFT JOIN
                mascota_caracteristicas mc ON m.idxxxx_mascot = mc.forane_mascot_id
                                                    AND mc.status_mascar= TRUE
            LEFT JOIN
                caracteristicas c ON mc.forane_caract_id = c.idxxxx_caract
            WHERE
                m.idxxxx_mascot = $1 
                AND m.eliminado_logico = FALSE
                AND m.forane_usuari_id = $2
            GROUP BY
                m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, 
                m.sexoxx_mascot, m.edadme_mascot, m.razaxx_mascot, 
                m.pesokg_mascot, m.tamano_mascot, m.infoad_mascot, 
                m.image1_mascot, m.image2_mascot, m.image3_mascot, 
                m.forane_usuari_id, m.status_mascot
        `;
        const result = await client.query(query, [petId, userId]);

        if (result.rows.length === 0) {
            // Error 404 (no existe) o 403 (no es el dueño)
            return res.status(404).json({ mensaje: 'Mascota no encontrada o no tienes permiso para editarla.' });
        }

        res.json(result.rows[0]);

    } catch (dbError) {
        console.error('Error al consultar la BD para la edición de mascota:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener la mascota.' });
    } finally {
        client.release();
    }
});

// ⭐️ FUNCIONES DE AYUDA NECESARIAS (Colócalas fuera del router.put)
/**
 * Obtiene los IDs de las características (personalidades) a partir de sus nombres.
 * @param {object} client - El cliente de la pool con la transacción activa.
 * @param {string[]} nombres - Array de nombres de características.
 * @returns {Promise<number[]>} Array de IDs de características.
 */
async function getCaracteristicaIds(client, nombres) {
    if (!nombres || nombres.length === 0) return [];

    const placeholders = nombres.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
        SELECT idxxxx_caract 
        FROM caracteristicas 
        WHERE nombre_caract IN (${placeholders})
    `;
    const result = await client.query(query, nombres);
    return result.rows.map(row => row.idxxxx_caract);
}


// ⭐️ NUEVA RUTA: PUT /api/mascotas/:id
// Objetivo: Actualizar los datos de la mascota.
router.put('/actualizar/:id', protect, uploadArrayMascota, async (req, res) => {
    const petId = req.params.id;
    const userId = req.user.id; 

    // Rutas locales temporales que Multer acaba de crear (si el usuario subió algo)
    const localImagePaths = req.files ? req.files.map(file => file.path) : [];

    let datosMascota;

    try {
        datosMascota = JSON.parse(req.body.datos);
    } catch (e) {
        cleanupUploadedFiles(localImagePaths); 
        return res.status(400).json({ mensaje: 'Formato de datos de la mascota inválido (JSON no válido).' });
    }
    
    // ⭐️ 1. Desestructurar también el campo status_mascot
    const {
        nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
        razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot,
        image1_mascot: existingUrl1, 
        image2_mascot: existingUrl2, 
        image3_mascot: existingUrl3,
        personalidad_array: newPersonalidades,
        status_mascot // ⭐️ Capturamos el nuevo valor del estado (true/false)
    } = datosMascota; 

    if (isNaN(petId) || !nombre_mascot || !especi_mascot || !sexoxx_mascot) {
        cleanupUploadedFiles(localImagePaths);
        return res.status(400).json({ mensaje: 'Faltan campos requeridos (nombre, especie, sexo).' });
    }


    // --- Lógica de Subida a Cloudinary ---
    let newCloudinaryUrls = [];

    if (localImagePaths.length > 0) {
        try {
            // Subir archivos nuevos y obtener URLs seguras
            const uploadPromises = localImagePaths.map(path => 
                uploadToCloudinary(path, 'mascotas_para_adopcion')
            );
            newCloudinaryUrls = await Promise.all(uploadPromises);

            if (newCloudinaryUrls.includes(null)) {
                // Si algo falla en Cloudinary, lanza error.
                throw new Error("Una o más imágenes fallaron al subir a Cloudinary.");
            }
        } catch (uploadError) {
            // Limpiar archivos locales ANTES de responder con error 500
            cleanupUploadedFiles(localImagePaths); 
            console.error('Fallo grave durante la subida de imágenes a Cloudinary:', uploadError);
            return res.status(500).json({ 
                mensaje: 'Error al subir una o más imágenes a Cloudinary.',
                error: uploadError.message
            });
        }
    }
    
    // ⚠️ CRÍTICO: Limpiar archivos locales temporales SIEMPRE al final de la lógica de archivos
    cleanupUploadedFiles(localImagePaths); 

    // --- Combinación de URLs ---
    let urlIndex = 0;

    const isValidCloudinaryUrl = (url) => {
        return url && typeof url === 'string' && url.startsWith('http') && !url.includes('blob:');
    }

    // Lógica para el slot 1:
    const finalImage1 = isValidCloudinaryUrl(existingUrl1) 
    ? existingUrl1 
    : (newCloudinaryUrls[urlIndex] !== undefined ? newCloudinaryUrls[urlIndex++] : null);

    // Lógica para el slot 2:
    const finalImage2 = isValidCloudinaryUrl(existingUrl2) 
    ? existingUrl2 
    : (newCloudinaryUrls[urlIndex] !== undefined ? newCloudinaryUrls[urlIndex++] : null);

    // Lógica para el slot 3:
    const finalImage3 = isValidCloudinaryUrl(existingUrl3) 
    ? existingUrl3 
    : (newCloudinaryUrls[urlIndex] !== undefined ? newCloudinaryUrls[urlIndex++] : null);

    
    const client = await pool.connect(); 
    
    try {
        // 1. INICIAR TRANSACCIÓN
        await client.query('BEGIN');
        
        // ⭐️ 2. Actualizar datos básicos de la Mascota, incluyendo status_mascot
        const updateQuery = `
             UPDATE mascotas 
             SET 
                 nombre_mascot = $1, especi_mascot = $2, sexoxx_mascot = $3, 
                 edadme_mascot = $4, razaxx_mascot = $5, pesokg_mascot = $6, 
                 tamano_mascot = $7, infoad_mascot = $8, 
                 image1_mascot = $9, image2_mascot = $10, image3_mascot = $11,
                 status_mascot = $12  -- ⭐️ Añadimos el nuevo campo
             WHERE idxxxx_mascot = $13 
             RETURNING idxxxx_mascot;
         `;

         const updateValues = [
             nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
             razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot, 
             finalImage1, finalImage2, finalImage3, 
             status_mascot, // ⭐️ Nuevo valor
             petId 
         ];
        
        const result = await client.query(updateQuery, updateValues);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK'); 
            return res.status(404).json({ mensaje: 'Mascota no encontrada o no se pudo actualizar.' });
        }
        
        // --- Sincronizar Características (Se mantiene la misma lógica) ---
        
        // Obtener los IDs de las nuevas características a partir de sus nombres
        const newCaractIds = await getCaracteristicaIds(client, newPersonalidades);
        
        // 3. ELIMINAR características viejas (No se toca el estado de la mascota, solo las características)
        if (newCaractIds.length > 0) {
            // ⭐️ Actualizar a status_caract = FALSE (Soft Delete) para las que NO están en la lista nueva
            const deactivateQuery = `
                UPDATE mascota_caracteristicas
                SET status_mascar = FALSE
                WHERE forane_mascot_id = $1
                AND forane_caract_id NOT IN (${newCaractIds.map((_, i) => `$${i + 2}`).join(', ')})
                AND status_mascar = TRUE; -- Opcional: solo actualizar si estaban activas
            `;
            await client.query(deactivateQuery, [petId, ...newCaractIds]);
        } else {
            // Si la lista de nuevas personalidades está vacía, desactivar TODAS las existentes
            const deactivateAllQuery = `
                UPDATE mascota_caracteristicas
                SET status_mascar = FALSE
                WHERE forane_mascot_id = $1
                AND status_mascar = TRUE;
            `;
            await client.query(deactivateAllQuery, [petId]);
        }

        // 4. INSERTAR nuevas características (Usando ON CONFLICT para evitar duplicados)
        if (newCaractIds.length > 0) {
            const insertValues = newCaractIds.map(caractId => 
                `(${petId}, ${caractId}, TRUE)`
            ).join(', ');

            const insertQuery = `
            INSERT INTO mascota_caracteristicas (forane_mascot_id, forane_caract_id, status_mascar)
            VALUES ${insertValues}
            ON CONFLICT (forane_mascot_id, forane_caract_id) 
            DO UPDATE SET status_mascar = TRUE;
            `;
            await client.query(insertQuery);
        }

        // 5. CONFIRMAR TRANSACCIÓN
        await client.query('COMMIT');
        
        res.status(200).json({ 
            mensaje: 'Mascota actualizada con éxito.',
            mascota_id: petId
        });

    } catch (dbError) {
        // 6. REVERTIR TRANSACCIÓN EN CASO DE ERROR
        await client.query('ROLLBACK'); 
        console.error('Error de base de datos al actualizar la mascota y características:', dbError);
        res.status(500).json({ 
            mensaje: 'Error interno del servidor al actualizar la mascota.', 
            error: dbError.message 
        });
    } finally {
        client.release();
    }

});


// --- RUTA GET PARA LISTAR GATOS PARA EL FEED PRINCIPAL (Optimizado) ---
router.get('/feed', async (req, res) => {
    try {
        // Seleccionamos SOLO los campos esenciales para mostrar en el feed de tarjetas.
        const query = `
            SELECT 
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.especi_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.razaxx_mascot, 
                m.tamano_mascot, 
                m.image1_mascot
            FROM 
                mascotas m
            WHERE 
                m.eliminado_logico = FALSE
            AND
                m.especi_mascot = 'Gato'
            ORDER BY 
                m.idxxxx_mascot DESC;
            `;

        const result = await pool.query(query);

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas para el feed.', error: dbError.message });
    }
});

// --- RUTA GET PARA LISTAR GATOS PARA EL FEED PRINCIPAL (Optimizado) ---
router.get('/perros', async (req, res) => {
    try {
        // Seleccionamos SOLO los campos esenciales para mostrar en el feed de tarjetas.
        const query = `
            SELECT 
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.especi_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.razaxx_mascot, 
                m.tamano_mascot, 
                m.image1_mascot
            FROM 
                mascotas m
            WHERE 
                m.eliminado_logico = FALSE
            AND
                m.especi_mascot = 'Perro'
            ORDER BY 
                m.idxxxx_mascot DESC;
            `;

        const result = await pool.query(query);

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas para el feed.', error: dbError.message });
    }
});
//-----GET PARA MOSTRAR LAS 4 MAS RECIENTES

router.get('/home2nd', async (req, res) => {
    try {
        // Seleccionamos SOLO los campos esenciales para mostrar en el feed de tarjetas.
        const query = `
            SELECT 
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.especi_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.razaxx_mascot, 
                m.tamano_mascot, 
                m.image1_mascot
            FROM 
                mascotas m
            WHERE 
                m.eliminado_logico = FALSE
            ORDER BY 
                m.idxxxx_mascot DESC
            LIMIT 4;
            `;

        const result = await pool.query(query);

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas para el feed:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas para el feed.', error: dbError.message });
    }
});

router.get('/card/:id', async (req, res) => { 
    // 1. Obtener el ID de la mascota desde los parámetros de la URL
    const petId = req.params.id;

    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        // 2. Consulta SQL para obtener todos los detalles de la mascota
        const query = `
            SELECT
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.especi_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.razaxx_mascot, 
                m.pesokg_mascot, 
                m.tamano_mascot, 
                m.infoad_mascot, 
                m.image1_mascot, 
                m.image2_mascot, 
                m.image3_mascot, 
                m.forane_usuari_id, 
                m.status_mascot,
                -- 👇 Columna que devuelve las características como un array JSON
                COALESCE(
                    json_agg(c.nombre_caract) FILTER (WHERE c.nombre_caract IS NOT NULL),
                    '[]'
                ) AS personalidad_array
            FROM
                mascotas m
            LEFT JOIN
                mascota_caracteristicas mc ON m.idxxxx_mascot = mc.forane_mascot_id
            LEFT JOIN
                caracteristicas c ON mc.forane_caract_id = c.idxxxx_caract -- Asumiendo 'idxxxx_caract' es la PK de 'caracteristicas'
            WHERE
                m.idxxxx_mascot = $1 
                AND m.eliminado_logico = FALSE
            GROUP BY
                m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, 
                m.sexoxx_mascot, m.edadme_mascot, m.razaxx_mascot, 
                m.pesokg_mascot, m.tamano_mascot, m.infoad_mascot, 
                m.image1_mascot, m.image2_mascot, m.image3_mascot, 
                m.forane_usuari_id, m.status_mascot
        `;
        const result = await client.query(query, [petId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }

        // 3. Devolver los detalles de la mascota
        res.json(result.rows[0]);

    } catch (dbError) {
        console.error('Error al consultar la BD para la mascota:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener la mascota.' });
    } finally {
        client.release();
    }
});

// --- RUTA GET PARA OBTENER DETALLE DE MASCOTA POR ID (PARA EL FORMULARIO DE ADOPCIÓN) ---
router.get('/shortcard/:mascotId', async (req, res) => {
    // Reutilizamos la lógica del endpoint /card/:id para estandarizar el endpoint REST
    const petId = req.params.mascotId;

    if (isNaN(petId)) {
        return res.status(400).json({ mensaje: 'ID de mascota inválido.' });
    }

    const client = await pool.connect();
    try {
        // La misma consulta SQL optimizada que usas en /card/:id
        const query = `
            SELECT
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.pesokg_mascot, 
                m.image1_mascot 
                -- Solo los campos necesarios para la sección de perfil del formulario
            FROM
                mascotas m
            WHERE
                m.idxxxx_mascot = $1 
                AND m.eliminado_logico = FALSE
        `;
        const result = await client.query(query, [petId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
        }

        // Devolver los detalles de la mascota
        res.json(result.rows[0]);

    } catch (dbError) {
        console.error('Error al consultar la BD para el formulario de adopción:', dbError); 
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener la mascota.' });
    } finally {
        client.release();
    }
});

// --- RUTA GET PARA OBTENER LAS PUBLICACIONES DEL USUARIO AUTENTICADO ---
router.get('/MypostUser', protect, async (req, res) => {
        // La línea siguiente es redundante, ya tienes const userId = req.user.id;
        const userId = req.user.id; 

    console.log(`Cargando publicaciones para userId: ${userId}`);
        
        const client = await pool.connect();
        try {
            // Consulta para obtener TODAS las mascotas publicadas por ese usuario
            const query = `
                SELECT
                m.idxxxx_mascot, 
                m.nombre_mascot, 
                m.sexoxx_mascot, 
                m.edadme_mascot, 
                m.pesokg_mascot, 
                m.image1_mascot 
                FROM
                mascotas m
                WHERE
                m.forane_usuari_id = $1
                AND m.eliminado_logico = FALSE
                ORDER BY m.idxxxx_mascot DESC;
            `;
            const result = await client.query(query, [userId]);

            // ⭐️ CORRECCIÓN: Devolver el array completo (result.rows) con 200 OK.
                // Si no hay publicaciones, devuelve un array vacío: [].
            res.status(200).json(result.rows); 
    
        } catch (dbError) {
            console.error('Error al consultar la BD para las publicaciones del usuario:', dbError); 
            res.status(500).json({ mensaje: 'Error interno del servidor al obtener las publicaciones.' });
        } finally {
            client.release();
        }
    });

// --- RUTA GET PARA LISTAR TODAS LAS MASCOTAS ---
router.get('/', async (req, res) => {
    try {
         // Seleccionamos todos los campos necesarios de las mascotas que NO estén eliminadas
         // Incluyendo el nombre del dueño.
        const query = `
            SELECT 
                m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
                m.edadme_mascot, m.razaxx_mascot, m.pesokg_mascot, m.tamano_mascot, 
                m.infoad_mascot, m.image1_mascot, m.image2_mascot, m.image3_mascot, 
                m.forane_usuari_id, 
                u.nombre_usuari AS nombre_dueño, 
                u.emailx_usuari AS email_dueño
                FROM 
                mascotas m
                JOIN 
                usuarios u ON m.forane_usuari_id = u.idxxxx_usuari
                WHERE 
                m.eliminado_logico = FALSE
                ORDER BY 
                m.idxxxx_mascot DESC;
            `;

        const result = await pool.query(query);

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

        } catch (dbError) {
        console.error('Error al obtener la lista de mascotas:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas.', error: dbError.message });
    }
});


// --- RUTA POST PARA PUBLICAR MASCOTA (CON SUBIDA A CLOUDINARY) ---
router.post('/', protect, uploadArrayMascota, async (req, res) => {
    // 1. AUTENTICACIÓN Y EXTRACCIÓN DE DATOS
    const forane_usuari_id = req.user.id; 

    // Rutas locales temporales que Multer acaba de crear
    const localImagePaths = req.files ? req.files.map(file => file.path) : [];
    let datosMascota;

    try {
        datosMascota = JSON.parse(req.body.datos);
    } catch (e) {
    // Borrar imágenes subidas si el JSON es inválido y retornar error
    cleanupUploadedFiles(localImagePaths);
        return res.status(400).json({ mensaje: 'Formato de datos de la mascota inválido (JSON no válido).' });
    }

    const {
        nombre, especie, sexo, edad, raza, peso, tamano,
        personalidad, informacionAdicional
    } = datosMascota;

    let cloudinaryImageUrls = [];
    
    // ==========================================================
    // 2. SUBIR IMÁGENES A CLOUDINARY Y LIMPIAR ARCHIVOS LOCALES
    // ==========================================================
    try {
        // Subir todas las imágenes en paralelo 
        const uploadPromises = localImagePaths.map(path => 
            uploadToCloudinary(path, 'mascotas_para_adopcion') // Carpeta destino en Cloudinary
        );
        
        cloudinaryImageUrls = await Promise.all(uploadPromises);
        
        // Verificar si alguna subida falló
        if (cloudinaryImageUrls.includes(null)) {
            throw new Error("Una o más imágenes fallaron al subir a Cloudinary.");
        }

    } catch (uploadError) {
        console.error('Fallo grave durante la subida de imágenes a Cloudinary:', uploadError);
        return res.status(500).json({ 
            mensaje: 'Error al subir una o más imágenes a Cloudinary.',
            error: uploadError.message
        });
    } finally {
        // ¡IMPORTANTE! Borrar los archivos locales sin importar si la subida a Cloudinary fue exitosa o falló
        cleanupUploadedFiles(localImagePaths);
    }
    
    // 3. PREPARAR DATOS PARA LA BD (USANDO LAS URLs DE CLOUDINARY)
    const image1_mascot = cloudinaryImageUrls[0] || null;
    const image2_mascot = cloudinaryImageUrls[1] || null;
    const image3_mascot = cloudinaryImageUrls[2] || null;
    
    const infoad_mascot = informacionAdicional || 'N/A'; 
    
    const client = await pool.connect(); 
    
    try {
        await client.query('BEGIN'); // INICIAR TRANSACCIÓN

        // ==========================================================
        // PASO A: INSERTAR MASCOTA Y OBTENER ID (idxxxx_mascot)
        // ==========================================================
        const insertQuery = `
            INSERT INTO mascotas (
                nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
                razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot, 
                image1_mascot, image2_mascot, image3_mascot, eliminado_logico, 
                forane_usuari_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING idxxxx_mascot;
        `;

        const insertValues = [
            nombre, especie, sexo, edad, 
            raza, peso, tamano, infoad_mascot, 
            image1_mascot, image2_mascot, image3_mascot, false, // <-- URLs de Cloudinary
            forane_usuari_id
        ];

        const result = await client.query(insertQuery, insertValues);
        const mascotaId = result.rows[0].idxxxx_mascot; 

        // ==========================================================
        // PASO B y C: Obtener IDs y hacer INSERT en mascota_caracteristicas
        // ==========================================================
        if (personalidad && personalidad.length > 0) {
            const placeholderList = personalidad.map((_, i) => `$${i + 1}`).join(',');

            // Nota: Aquí se usa 'idxxxx_caract' y 'nombre_caract' según tu código anterior.
            const selectQuery = `
                SELECT idxxxx_caract 
                FROM caracteristicas 
                WHERE nombre_caract IN (${placeholderList});
            `;
            
            const caracteristicasResult = await client.query(selectQuery, personalidad);
            const caracteristicaIds = caracteristicasResult.rows.map(row => row.idxxxx_caract);

            if (caracteristicaIds.length > 0) {
                const relacionValues = caracteristicaIds.map(charId => `(${mascotaId}, ${charId}, TRUE)`).join(',');
                
                // Nota: Aquí se usa 'forane_caract_id' según tu código anterior.
                const relacionQuery = `
                    INSERT INTO mascota_caracteristicas (forane_mascot_id, forane_caract_id, status_mascar) 
                    VALUES ${relacionValues};
                `;
                await client.query(relacionQuery);
            }
        }
        
        await client.query('COMMIT'); // CONFIRMAR TRANSACCIÓN

        res.status(201).json({ 
            mensaje: 'Mascota y características publicadas con éxito.',
            mascota_id: mascotaId
        });

    } catch (dbError) {
        await client.query('ROLLBACK'); // REVERTIR TRANSACCIÓN
        console.error('Error de base de datos en la transacción:', dbError);
        
        // Las imágenes locales ya fueron limpiadas. Solo devolvemos el error de BD.

        res.status(500).json({ 
            mensaje: 'Error interno del servidor al guardar la mascota y sus relaciones.', 
            error: dbError.message 
        });
    } finally {
        client.release();
    }
});

module.exports = router;