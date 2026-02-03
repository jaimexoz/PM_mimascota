const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/interactions
// Registra click, favorite o contact
router.post('/', protect, InteractionController.registerInteraction);

module.exports = router;
