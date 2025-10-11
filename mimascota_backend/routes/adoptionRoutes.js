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

// 1. RUTA ESPECÍFICA: Obtener solicitudes del usuario autenticado (Debe ir primero)
router.get('/user', protect, adoptionController.getUserAdoptionForms); 

// 2. RUTA DINÁMICA: Obtener un formulario específico por ID (Debe ir después)
// Ahora, el :formId solo interceptará números, no la palabra 'user'
router.get('/form/:formId', protect, adoptionController.getAdoptionFormById); 

router.get('/received', protect, adoptionController.getReceivedAdoptionForms);

router.patch('/:formId/status', protect, adoptionController.updateAdoptionStatus); 

router.patch('/:mascotId/statusM', protect, adoptionController.updateMascotStatus); 



module.exports = router;