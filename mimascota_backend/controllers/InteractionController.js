const InteractionModel = require('../models/InteractionModel');

/**
 * Registra una interacción del usuario (click, favorite, contact)
 * POST /api/interactions
 */
exports.registerInteraction = async (req, res) => {
    const userId = req.user.id; // Asumimos middleware de auth que inyecta user
    const { petId, type } = req.body;

    if (!petId || !type) {
        return res.status(400).json({ message: 'Faltan datos requeridos (petId, type).' });
    }

    try {
        await InteractionModel.insertInteraction(userId, petId, type);
        res.status(201).json({ message: 'Interacción registrada con éxito.' });
    } catch (error) {
        console.error("Error registrando interacción:", error);
        res.status(500).json({ message: 'Error interno al registrar interacción.' });
    }
};
