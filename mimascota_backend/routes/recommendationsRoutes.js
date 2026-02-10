const express = require('express');
const router = express.Router();

// Middleware de autenticación (Opcional: solo si requieres que el usuario esté logueado para ver matches)
const { protect } = require('../middleware/authMiddleware');

// Importamos el controlador
const recommendationsController = require('../controllers/recommendationController');

// Health check para ML API
router.get('/ml-health', recommendationsController.checkMLHealth);

// CORRECCIÓN:
// 1. Usamos POST porque el usuario "envía" sus respuestas.
// 2. Usamos la función 'getRecommendations' que contiene la lógica ML.
router.post('/', protect, recommendationsController.getRecommendations);

router.post('/recalculateAllVectors', protect, recommendationsController.recalculateAllVectors);

router.post('/submitQuestionnaire', protect, recommendationsController.submitQuestionnaire); // Guardar y procesar
router.get('/getSavedRecommendations', protect, recommendationsController.getSavedRecommendations); // Solo consultar

module.exports = router;