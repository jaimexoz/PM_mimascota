// routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware'); 

// GET /api/reviews -> Para obtener la lista de reseñas (con paginación)
router.get('/', reviewController.getReviews);

// POST /api/reviews -> Para enviar una nueva reseña
// router.post('/', authMiddleware, reviewController.createReview); // Con autenticación
router.post('/', protect, reviewController.createReview); // Sin autenticación

module.exports = router;