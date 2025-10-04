const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const favoritesController = require('../controllers/favoritesController'); 

// RUTA PROTEGIDA: Obtener el estado de favorito de una mascota
router.get('/status/:mascotId', protect, favoritesController.checkFavoriteStatus);

// RUTA PROTEGIDA: Alternar el estado de favorito (POST siempre alternará)
router.post('/:mascotId', protect, favoritesController.toggleFavorite);

// Se elimina la ruta DELETE: router.delete('/:mascotId', protect, favoritesController.removeFavorite);

module.exports = router;