const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/interactions
// Registra click, favorite, contact o adopt
router.post('/', protect, InteractionController.registerInteraction);

// GET /api/interactions/export
// Exporta todas las interacciones para ML (proteger con admin si quieres)
router.get('/export', protect, InteractionController.exportInteractions);

// GET /api/interactions/my-interactions
// Obtiene interacciones del usuario actual
router.get('/my-interactions', protect, InteractionController.getMyInteractions);

module.exports = router;
