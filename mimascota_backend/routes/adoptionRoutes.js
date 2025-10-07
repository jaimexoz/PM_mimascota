const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { protect } = require('../middleware/authMiddleware'); 
// Asumiendo que tienes un middleware de autenticación

// Ruta para obtener los detalles de una mascota específica
// (Asumo que ya tienes una ruta en 'mascotasRouter' para esto, si no, la añadiríamos aquí)
// Por ahora, solo necesitamos la ruta POST para el formulario de adopción

// Ruta protegida para enviar el formulario de adopción
router.post('/', protect, adoptionController.submitAdoptionForm);

module.exports = router;