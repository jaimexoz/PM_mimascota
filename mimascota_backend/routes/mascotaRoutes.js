// mi_mascota_backend/routes/mascotaRouter.js
const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController'); 

// Importaciones necesarias para Multer y Autenticación
const { protect } = require('../middleware/authMiddleware'); 
const { uploadArrayMascota } = require('../config/multerConfig'); // Middleware para subir múltiples archivos

// =================================================================
// RUTAS
// =================================================================

// POST /api/mascotas/ -> CREAR NUEVA MASCOTA (Requiere archivos y datos)
router.post('/', protect, uploadArrayMascota, mascotaController.createMascota);

// PUT /api/mascotas/actualizar/:id -> ACTUALIZAR MASCOTA (Puede tener o no nuevos archivos)
router.put('/actualizar/:id', protect, uploadArrayMascota, mascotaController.updateMascota);

// DELETE /api/mascotas/eliminar/:id -> ELIMINACIÓN LÓGICA
router.delete('/eliminar/:id', protect, mascotaController.deleteMascota);

// GET /api/mascotas/editar/:id -> Obtener datos completos para precargar el formulario de edición
router.get('/editar/:id', protect, mascotaController.getMascotaForEdit);

// GET /api/mascotas/MypostUser -> Obtener solo mis publicaciones activas
router.get('/MypostUser', protect, mascotaController.getMyPosts);

// GET /api/mascotas/home2nd -> Últimas 4 mascotas (Función separada)
router.get('/home2nd', mascotaController.getMascotasForHome2nd);

// GET /api/mascotas/feed -> Listar Gatos (Función separada)
router.get('/feed', mascotaController.getMascotasForGatoFeed);

// GET /api/mascotas/perros -> Listar solo perros (Función separada)
router.get('/perros', mascotaController.getMascotasForPerroFeed);

// GET /api/mascotas/card/:id -> Obtener todos los detalles (Feed o página de detalle)
router.get('/card/:id', mascotaController.getMascotaCardDetails);

// GET /api/mascotas/shortcard/:mascotId -> Obtener solo datos básicos para el formulario de adopción
router.get('/shortcard/:mascotId', mascotaController.getMascotaShortCard);



// GET /api/mascotas/ -> LISTAR TODAS (Con datos del dueño)
router.get('/AllPost', mascotaController.getAllMascotas);

router.put('/approval/:mascotId',protect, mascotaController.updateMascotaApprovalStatus);

module.exports = router;