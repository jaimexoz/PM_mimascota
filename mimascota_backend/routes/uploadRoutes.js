// mi_mascota_backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // Para manejar rutas de archivos
const fs = require('fs'); // <--- ¡Importa 'fs' aquí!
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de que esta ruta sea correcta

// Asegúrate de que el directorio 'uploads/' exista al iniciar la aplicación
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para el almacenamiento de archivos temporales
// Guarda los archivos subidos en la carpeta 'uploads/'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Usa la variable definida arriba
    },
    filename: (req, file, cb) => {
        // Define un nombre de archivo único para evitar conflictos
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limita el tamaño del archivo a 5MB
    },
    fileFilter: (req, file, cb) => {
        // Valida que el tipo de archivo sea una imagen
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif)'));
    },
});

// ###############################################################
// # RUTAS DE SUBIDA DE IMAGENES                                 #
// ###############################################################

// 1. Ruta para SUBIR IMAGEN DE PERFIL DURANTE EL REGISTRO (PÚBLICA)
// No usa el middleware 'protect' porque el usuario aún no está logueado.
router.post('/register-profile', upload.single('profileImage'), uploadController.uploadProfileImage);

// 2. Ruta para ACTUALIZAR IMAGEN DE PERFIL (PROTEGIDA)
// Esta ruta requiere que el usuario esté autenticado.
router.post('/profile-update', protect, upload.single('profileImage'), uploadController.uploadProfileImage);

module.exports = router;