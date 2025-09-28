// mi_mascota_backend/config/multerConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configuración de Almacenamiento (La misma que tenías)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Carpeta temporal para guardar los archivos
        const uploadDir = path.join(__dirname, '../uploads');
        
        // Asegurarse de que la carpeta 'uploads' exista
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// 2. Filtro para aceptar solo imágenes (La misma que tenías)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Rechazar el archivo
        cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
};

// 3. Configuración base con filtro y límites
const multerOptions = {
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB por archivo
    }
};

// --- Exportaciones Específicas ---

// Exportación A: Para la subida de un único archivo (ej. Foto de perfil)
// Se usa en la ruta de registro. El nombre de campo ('foto_perfil' es un ejemplo, ajusta si es diferente)
exports.uploadSingle = multer(multerOptions).single('foto_perfil'); 

// Exportación B: Para la subida de MÚLTIPLES archivos (ej. Fotos de mascota)
// Usa .array() y debe coincidir con el nombre de campo 'fotos' que usamos en Vue.
exports.uploadArrayMascota = multer(multerOptions).array('fotos', 3); // Límite de 3 archivos

// NOTA: Si necesitas el Multer sin ninguna llamada .single() o .array(), puedes exportar solo 'multerOptions'