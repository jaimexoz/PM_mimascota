// mi_mascota_backend/controllers/uploadController.js
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs'); // Módulo para interactuar con el sistema de archivos
const path = require('path'); // Módulo para manejar rutas de archivos

// Función para subir una imagen de perfil de usuario
const uploadProfileImage = async (req, res) => {
    try {
        // req.file contiene la información del archivo subido por Multer
        if (!req.file) {
            return res.status(400).json({ msg: 'No se subió ningún archivo.' });
        }

        // Subir la imagen a Cloudinary desde el buffer de memoria
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'mi_mascota/profiles', // Carpeta en Cloudinary para organizar las imágenes
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            // Puedes agregar más transformaciones aquí si lo necesitas
        });
        
        // Eliminar el archivo temporal del servidor después de subirlo a Cloudinary
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo temporal:', err);
            }
        });

        // Enviar la URL segura de la imagen de vuelta al frontend
        res.status(200).json({
            msg: 'Imagen subida exitosamente',
            imageUrl: result.secure_url,
            publicId: result.public_id,
        });

    } catch (error) {
        console.error('Error al subir la imagen a Cloudinary:', error);
        res.status(500).json({ msg: 'Error al subir la imagen' });
    }
};

module.exports = {
    uploadProfileImage,
};