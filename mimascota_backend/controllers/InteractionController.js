const InteractionModel = require('../models/InteractionModel');

/**
 * Registra una interacción del usuario (click, favorite, contact, adopt)
 * POST /api/interactions
 * 
 * Body: { petId: number, type: string }
 */
exports.registerInteraction = async (req, res) => {
    const userId = req.user.id; // Middleware de auth inyecta user
    const { petId, type } = req.body;

    if (!petId || !type) {
        return res.status(400).json({ message: 'Faltan datos requeridos (petId, type).' });
    }

    try {
        const interaction = await InteractionModel.upsertInteraction(userId, petId, type);

        res.status(201).json({
            message: 'Interacción registrada con éxito.',
            interaction: interaction
        });
    } catch (error) {
        console.error("Error registrando interacción:", error);
        res.status(500).json({ message: 'Error interno al registrar interacción.' });
    }
};

/**
 * Obtener todas las interacciones para exportar a ML
 * GET /api/interactions/export
 */
exports.exportInteractions = async (req, res) => {
    try {
        const interactions = await InteractionModel.getAllInteractions();

        res.status(200).json({
            total: interactions.length,
            data: interactions
        });
    } catch (error) {
        console.error("Error exportando interacciones:", error);
        res.status(500).json({ message: 'Error al exportar interacciones.' });
    }
};

/**
 * Obtener interacciones del usuario actual
 * GET /api/interactions/my-interactions
 */
exports.getMyInteractions = async (req, res) => {
    const userId = req.user.id;

    try {
        const interactions = await InteractionModel.getUserInteractions(userId);

        res.status(200).json({
            total: interactions.length,
            data: interactions
        });
    } catch (error) {
        console.error("Error obteniendo interacciones del usuario:", error);
        res.status(500).json({ message: 'Error al obtener interacciones.' });
    }
};

module.exports = exports;
