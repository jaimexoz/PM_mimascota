// mi_mascota_backend/routes/mascotaRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 
const fs = require('fs');
const path = require('path');

// ⭐️ Importamos las funciones de autenticación (solo necesitamos 'protect' aquí)

const { protect } = require('../middleware/authMiddleware');

// Importamos el middleware específico para subir múltiples archivos
const { uploadArrayMascota } = require('../config/multerConfig'); 

// Función de utilidad para eliminar archivos subidos si la BD falla
const cleanupUploadedFiles = (filePaths) => {
    filePaths.forEach(filePath => {
        // Obtenemos el path absoluto para asegurar la eliminación
        const absolutePath = path.resolve(filePath); 
        fs.unlink(absolutePath, (err) => {
            if (err) console.error(`Error al borrar el archivo en cleanup: ${absolutePath}`, err);
        });
    });
};

// --- NUEVA RUTA: GET PARA LISTAR TODAS LAS MASCOTAS ---
// Esta ruta es pública, por lo que NO usamos el middleware 'protect'.
router.get('/', async (req, res) => {
    try {
        // Seleccionamos todos los campos necesarios de las mascotas que NO estén eliminadas
        // Es buena práctica usar un JOIN con la tabla de usuarios (u) para obtener el nombre 
        // del publicador/dueño de la mascota.
        const query = `
            SELECT 
                m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
                m.edadme_mascot, m.razaxx_mascot, m.pesokg_mascot, m.tamano_mascot, 
                m.infoad_mascot, m.image1_mascot, m.image2_mascot, m.image3_mascot, 
                m.fecha_creacion, m.forane_usuari_id, 
                u.nombre_usuari AS nombre_dueño, 
                u.emailx_usuari AS email_dueño
            FROM 
                mascotas m
            JOIN 
                usuarios u ON m.forane_usuari_id = u.idxxxx_usuari
            WHERE 
                m.eliminado_logico = FALSE
            ORDER BY 
                m.fecha_creacion DESC;
        `;
        
        const result = await pool.query(query);

        // Envía el array de mascotas al cliente
        res.status(200).json(result.rows);

    } catch (dbError) {
        console.error('Error al obtener la lista de mascotas:', dbError);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener mascotas.', error: dbError.message });
    }
});

// --- RUTA POST PARA PUBLICAR MASCOTA ---
// ⭐️ 1. Aplicamos 'protect' primero para asegurarnos de que el usuario esté logueado
// ⭐️ 2. Luego aplicamos 'uploadArrayMascota' para manejar la subida
router.post('/', protect, uploadArrayMascota, async (req, res) => {
    
    // Si Multer detectó un error (ej. límite de archivos/tamaño), se manejaría aquí.
    if (req.multerError) {
        // Multer debería haber manejado este error antes de llegar al controlador,
        // pero se mantiene la lógica de seguridad.
    }

    // El ID del usuario ha sido adjuntado a req.user por el middleware 'protect'
    // Asumimos que el ID está en req.user.id (por tu lógica de token)
    const forane_usuari_id = req.user.id; // ⭐️ ¡Aquí está el ID real del usuario autenticado!

    // 1. Parsear los datos de texto (enviados como req.body.datos desde Vue)
    let datosMascota;
    try {
        datosMascota = JSON.parse(req.body.datos);
    } catch (e) {
        // Borrar imágenes subidas si el JSON es inválido
        const imagePaths = req.files ? req.files.map(file => file.path) : [];
        cleanupUploadedFiles(imagePaths);
        return res.status(400).json({ mensaje: 'Formato de datos de la mascota inválido (JSON no válido).' });
    }

    const {
        nombre, especie, sexo, edad, raza, peso, tamano,
        personalidad, informacionAdicional
    } = datosMascota;

    // 2. Mapear las rutas de las imágenes subidas
    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    
    // Nota: Multer almacena la ruta completa en el sistema de archivos (ej: 'uploads/foto-123.jpg')
    const image1_mascot = imagePaths[0] || null;
    const image2_mascot = imagePaths[1] || null;
    const image3_mascot = imagePaths[2] || null;
    
    // 3. Preparar los datos para la BD
    const personalidadString = Array.isArray(personalidad) ? personalidad.join(', ') : ''; 
    const infoad_mascot = `Personalidad: ${personalidadString}. Info Adicional: ${informacionAdicional || 'N/A'}`;
    
    const client = await pool.connect(); 
    try {
        const query = `
            INSERT INTO mascotas (
                nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
                razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot, 
                image1_mascot, image2_mascot, image3_mascot, eliminado_logico, 
                forane_usuari_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING idxxxx_mascot;
        `;

        const values = [
            nombre, especie, sexo, edad, 
            raza, peso, tamano, infoad_mascot, 
            image1_mascot, image2_mascot, image3_mascot, false, 
            forane_usuari_id // ⭐️ ¡El ID real del usuario!
        ];

        await client.query(query, values);

        res.status(201).json({ 
            mensaje: 'Mascota publicada con éxito y guardada en BD.',
            archivos_guardados: imagePaths.length,
            usuario_id: forane_usuari_id
        });

    } catch (dbError) {
        console.error('Error al insertar en la BD:', dbError);
        
        // Borrar los archivos subidos si la inserción en la BD falla
        cleanupUploadedFiles(imagePaths);

        res.status(500).json({ mensaje: 'Error interno del servidor al guardar la mascota.', error: dbError.message });
    } finally {
        client.release();
    }
});

module.exports = router;