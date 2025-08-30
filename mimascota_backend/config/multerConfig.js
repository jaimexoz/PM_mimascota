// mi_mascota_backend/config/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // <--- SÍ, AÑADE ESTA LÍNEA

// Configuración de almacenamiento para Multer
// Guardamos el archivo en el disco temporalmente
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Carpeta temporal para guardar los archivos antes de subirlos a Cloudinary
        const uploadDir = path.join(__dirname, '../uploads');
        // Asegurarse de que la carpeta 'uploads' exista
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // 'recursive: true' para crear carpetas anidadas si no existen
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para evitar conflictos
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Rechazar el archivo y devolver un error
        cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
};

// Inicializar Multer con la configuración
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de tamaño de archivo: 5MB (5 * 1024 * 1024 bytes)
    }
});

module.exports = upload;