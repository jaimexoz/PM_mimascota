// controllers/reviewController.js

const ReviewModel = require('../models/ReviewModel');

const REVIEWS_PER_PAGE = 6;
// ---------------------------------------------------
// OBTENER TODAS LAS RESEÑAS (Paginadas y Filtradas)
// ---------------------------------------------------
exports.getReviews = async (req, res) => {
    try {
        // Asegura que 'page' sea un número entero válido, por defecto 1
        const page = parseInt(req.query.page, 10) || 1; 
        
        // 🆕 CAPTURAR EL ORDEN: Si no se proporciona, usa 'DESC' (Más recientes)
        const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();
        
        // 🆕 Validación simple para evitar inyección SQL básica
        if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
            return res.status(400).json({ message: 'Parámetro sortOrder inválido.' });
        }

        
        const offset = (page - 1) * REVIEWS_PER_PAGE;

        // 🆕 PASAR EL sortOrder AL MODELO
        const data = await ReviewModel.getPaginatedReviews(REVIEWS_PER_PAGE, offset, sortOrder);

        res.status(200).json({
            status: 'success',
            ...data, // reviews, total, totalPages
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error al obtener las reseñas.',
        });
    }
};
// ---------------------------------------------------
// CREAR NUEVA RESEÑA
// ---------------------------------------------------
exports.createReview = async (req, res) => {
    const { stars, comment } = req.body;
    
    // El ID del usuario se obtiene del token JWT verificado por el middleware 'protect'
    const userId = req.user.id; 

    if (!userId || !stars || !comment) {
        return res.status(400).json({ message: 'Faltan campos requeridos (usuario, estrellas, comentario).' });
    }

    if (stars < 1 || stars > 5) {
        return res.status(400).json({ message: 'La valoración debe estar entre 1 y 5 estrellas.' });
    }

    try {
        // 1. Verificar si el usuario ya dejó una reseña (ejemplo de lógica)
        const existingReview = await ReviewModel.findUserReview(userId);
        if (existingReview) {
            // Código 409 Conflict: El recurso ya existe (una reseña por usuario)
            return res.status(409).json({ message: 'Ya has publicado una reseña. Solo se permite una por usuario.' });
        }

        // 2. Crear la reseña
        const newReview = await ReviewModel.createReview(userId, comment, stars);
        
        res.status(201).json({ 
            message: 'Reseña creada con éxito.',
            review: newReview 
        });

    } catch (error) {
        console.error('Error al crear reseña:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la reseña.' });
    }
};

// ---------------------------------------------------
// ELIMINAR RESEÑA
// ---------------------------------------------------
exports.deleteReview = async (req, res) => {
    const reviewId = req.params.id; 
    
    // ID y Rol obtenidos del token JWT por el middleware 'protect'
    const userId = req.user.id; 
    const userRole = req.user.role; 

    const userRoleLower = (userRole || '').toLowerCase();
    // 1. Verificación de Roles para la eliminación
    // Solo permitimos la eliminación a 'Admin' o 'Empleado'
    if (userRoleLower !== 'admin' && userRoleLower !== 'administrador' && userRoleLower !== 'empleado') {
        // Código 403 Forbidden: Acceso denegado
        return res.status(403).json({ message: 'Acceso denegado. Solo Administradores y Empleados pueden eliminar reseñas.' });
    }

    if (!reviewId) {
        return res.status(400).json({ message: 'El ID de la reseña es requerido.' });
    }

    try {
        // Llamamos al modelo para ejecutar la eliminación por ID
        const rowsAffected = await ReviewModel.softDeleteByAdmin(reviewId);
        if (rowsAffected === 0) {
            // 404 Not Found: La reseña no existía (o el ID era incorrecto)
            return res.status(404).json({ message: 'Reseña no encontrada o ya ha sido eliminada.' });
        }

        res.status(200).json({ message: 'Reseña eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la reseña.' });
    }
};