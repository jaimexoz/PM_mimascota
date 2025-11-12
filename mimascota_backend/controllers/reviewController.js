// controllers/reviewController.js

const ReviewModel = require('../models/ReviewModel');

// Constante para el límite de reseñas por página
const REVIEWS_PER_PAGE = 6;

/**
 * Obtiene reseñas paginadas.
 * GET /api/reviews?page=N
 */
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

/**
 * Crea una nueva reseña.
 * POST /api/reviews
 */
exports.createReview = async (req, res) => {
    try {
        const { comment, stars } = req.body;
        // Asumiendo que el ID del usuario se obtiene de la sesión/token de autenticación
        const userId = req.user.id; 

        // Validación
        if (!comment || typeof stars !== 'number' || stars < 1 || stars > 5) {
            return res.status(400).json({ message: 'Datos de reseña inválidos. Se requiere comentario y un número de estrellas (1-5).' });
        }
        
        // Asegurarse de que el comentario no exceda el límite (100)
        if (comment.length > 100) {
            return res.status(400).json({ message: 'El comentario excede el límite de 100 caracteres.' });
        }

        const newReview = await ReviewModel.createReview(userId, comment, stars);

        res.status(201).json({
            status: 'success',
            message: 'Reseña creada exitosamente.',
            review: newReview
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error al crear la reseña.',
        });
    }
};