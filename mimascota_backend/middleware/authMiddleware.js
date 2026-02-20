// mi_mascota_backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Necesitamos el pool para buscar permisos si no están en el token

// Middleware para proteger rutas, verifica el token JWT y decodifica la información del usuario
const protect = (req, res, next) => {
    let token;
    console.log("SECRET siendo usado para VERIFICAR:", process.env.JWT_SECRET);
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];


            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // El token contiene: id, role
            // Nota: Si necesitas más información (como permissions, roleName, etc.), 
            // deberías cargarla desde la base de datos aquí o incluirla en el token durante el login
            req.user = decoded; // Adjunta la información decodificada del token a la solicitud
            next();
        } catch (error) {
            console.error('Error al verificar token:', error);
            return res.status(401).json({ message: 'No autorizado, token fallido o expirado.' });
        }
    } else {
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

// Middleware para verificar permisos específicos
// Este middleware asume que req.user.permissions ya fue cargado en 'protect'
const authorize = (requiredPermissions) => (req, res, next) => {
    // Si no hay un usuario en la solicitud o no tiene permisos, denegar
    if (!req.user || !req.user.permissions) {
        return res.status(403).json({ message: 'Acceso denegado: No se pudieron verificar los permisos.' });
    }

    // Comprobar si el usuario tiene TODOS los permisos requeridos
    const hasAllPermissions = requiredPermissions.every(perm => req.user.permissions.includes(perm));

    if (hasAllPermissions) {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes.' });
    }
};

// Middleware para verificar si el usuario tiene un permiso Y es el "dueño" del recurso, o es Admin.
// Esto es para casos como "el usuario solo puede editar/eliminar sus propias publicaciones".
// Asume que el ID del recurso (ej. mascota) está en req.params.id
// y que el recurso tiene un campo de usuario_id (id_creador_usuari) que relaciona al dueño.
const authorizeOwnerOrAdmin = (permission) => async (req, res, next) => {
    const resourceId = req.params.id; // Asume que el ID del recurso se llama 'id' en los parámetros
    if (!resourceId) {
        return res.status(400).json({ message: 'ID del recurso no proporcionado.' });
    }

    // Primero, verifica si el usuario es administrador
    // Nota: El token contiene 'role', no 'roleName'. Ajustamos la verificación.
    if (req.user.role && req.user.role.toLowerCase() === 'admin') {
        return next(); // Un administrador siempre tiene acceso completo
    }

    // Si no es administrador, verifica si tiene el permiso Y es el dueño
    // Nota: Si el token no contiene permissions, puedes omitir esta verificación
    // o cargar los permisos desde la base de datos aquí
    if (req.user.permissions && !req.user.permissions.includes(permission)) {
        return res.status(403).json({ message: 'Acceso denegado: Permisos insuficientes.' });
    }
    // Si no hay permissions en el token, continuamos con la verificación de propiedad

    try {
        // **IMPORTANTE**: Aquí necesitarás adaptar la tabla y el campo que relaciona al dueño
        // Este es un ejemplo para una tabla `publicaciones` con `id_creador_usuari`
        // Si tu recurso es diferente (ej. una `mascota` con `id_dueño_usuari`), ajústalo.
        const result = await pool.query(
            `SELECT id_creador_usuari FROM publicaciones WHERE idxxxx_publicacion = $1`, // <--- AJUSTA ESTOS NOMBRES SEGÚN TU TABLA DE PUBLICACIONES
            [resourceId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recurso no encontrado.' });
        }

        const ownerId = result.rows[0].id_creador_usuari; // <--- AJUSTA ESTE NOMBRE SEGÚN TU CAMPO DE DUEÑO

        if (ownerId === req.user.id) { // Compara el ID del dueño del recurso con el ID del usuario loggeado
            next();
        } else {
            res.status(403).json({ message: 'Acceso denegado: No eres el propietario de este recurso.' });
        }
    } catch (error) {
        console.error('Error en autorización por propietario:', error);
        res.status(500).json({ message: 'Error interno del servidor al verificar la propiedad del recurso.' });
    }
};

module.exports = { protect, authorize, authorizeOwnerOrAdmin };