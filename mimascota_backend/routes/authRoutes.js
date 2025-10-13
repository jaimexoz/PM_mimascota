// mi_mascota_backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
// Importa el controlador de autenticación
const { 
    registerUser, 
    loginUser,
    updateUserInfo, 
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    updateProfileImage,
    changePassword,
    changeUserRole
} = require('../controllers/authController'); 

const multer = require('multer'); // <-- Importar multer
const path = require('path');    // <-- Importar path si no lo tienes
const { protect } = require('../middleware/authMiddleware');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define la carpeta donde se guardarán las imágenes subidas.
        // Asegúrate de que esta carpeta 'uploads' exista en la raíz de tu backend.
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Define el nombre del archivo. Usamos el nombre original con un timestamp para evitar colisiones.
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
};

// Crear la instancia de Multer con la configuración
// 'imagep_usuari' es el nombre del campo 'name' en tu input de tipo file del frontend.
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por archivo
    }
});

// Rutas de autenticación
// Para el registro, usa 'upload.single('imagep_usuari')' como middleware
// 'imagep_usuari' debe coincidir con el nombre del campo en tu FormData del frontend
router.post('/register', upload.single('imagep_usuari'), registerUser); // <-- ¡CAMBIO AQUÍ!

router.post('/login', loginUser);

router.get('/verify-email', verifyEmail);

// Opcional: Rutas para restablecimiento de contraseña
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Ruta para obtener todos los usuarios (solo admin)
router.get('/usuarios', protect, getAllUsers);

// Ruta para actualizar foto de perfil (solo usuarios autenticados)
router.put('/update-profile-image', protect, upload.single('profileImage'), updateProfileImage);

router.put('/update-user-info', protect, updateUserInfo);

// Ruta para cambiar contraseña (solo usuarios autenticados)
router.put('/change-password', protect, changePassword);

// Ruta para cambiar rol de usuario (solo admin)
router.put('/change-user-role', protect, changeUserRole);

module.exports = router;