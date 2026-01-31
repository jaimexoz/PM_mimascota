const pool = require('../config/db');
const mlService = require('../services/mlService');
const mascotaModel = require('../models/mascotaModel'); // Importamos el modelo

exports.getRecommendations = async (req, res) => {
    try {
        // 1. Convertir Cuestionario (Frontend) -> Vector Usuario
        const userVector = mlService.createUserVector(req.body);

        // 2. Obtener candidatos (Ahora delegamos esto al Modelo)
        // El controlador no sabe de SQL, solo pide "dame las mascotas"
        const allPets = await mascotaModel.obtenerMascotasParaRecomendacion();

        // 3. Fase de Ranking (Machine Learning)
        const rankedPets = allPets.map(pet => {
            // Si la mascota ya tiene vector guardado, lo usa. Si no, lo calcula al vuelo.
            const petVector = pet.vector_caracteristicas || mlService.createPetVector(pet);
            
            const similarityScore = mlService.cosineSimilarity(userVector, petVector);

            return {
                ...pet,
                match_score: similarityScore,
                // Opcional: Para mostrar porcentaje amigable en el frontend
                match_percentage: Math.round(similarityScore * 100)
            };
        });

        // 4. Ordenar: El más alto (1.0) primero
        rankedPets.sort((a, b) => b.match_score - a.match_score);

        // 5. Devolver respuesta
        res.status(200).json({
            status: 'success',
            count: rankedPets.length,
            recommendations: rankedPets.slice(0, 10) // Top 10
        });

    } catch (error) {
        console.error("Error en recomendación:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Error calculando recomendaciones' 
        });
    }
};




// En recommendationController.js

exports.recalculateAllVectors = async (req, res) => {
    try {
        // 1. Traemos TODAS las mascotas usando el Modelo (que ya hace el JOIN de personalidades)
        const allPets = await mascotaModel.obtenerMascotasParaRecomendacion();
        
        let updatedCount = 0;

        // 2. Recorremos una por una
        for (const pet of allPets) {
            // Calculamos su vector con el servicio
            const vector = mlService.createPetVector(pet);
            
            // 3. Actualizamos la mascota en la DB
            await pool.query(
                'UPDATE mascotas SET vector_caracteristicas = $1 WHERE idxxxx_mascot = $2',
                [vector, pet.idxxxx_mascot]
            );
            updatedCount++;
        }

        res.json({ message: `¡Éxito! Se actualizaron los vectores de ${updatedCount} mascotas.` });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error en migración');
    }
};

// A. GUARDAR CUESTIONARIO Y MOSTRAR RESULTADOS (POST)
exports.submitQuestionnaire = async (req, res) => {
    const userId = req.user.id; // Asumiendo que tienes el ID del usuario en el token
    try {
        // 1. Calcular Vector del Usuario basado en respuestas
        const userVector = mlService.createUserVector(req.body);

        // 2. GUARDAR este vector en la tabla de usuarios (Persistencia)
        await pool.query(
            'UPDATE usuarios SET vector_preferencias = $1 WHERE idxxxx_usuari = $2',
            [userVector, userId]
        );

        // 3. Obtener mascotas y calcular similitud (Reutilizamos lógica)
        const rankedPets = await calculateMatchesForVector(userVector);

        res.json({ status: 'success', recommendations: rankedPets });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error procesando cuestionario' });
    }
};

// B. OBTENER RECOMENDACIONES GUARDADAS AL ENTRAR (GET)
exports.getSavedRecommendations = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Buscar si el usuario tiene vector guardado
        const userRes = await pool.query(
            'SELECT vector_preferencias FROM usuarios WHERE idxxxx_usuari = $1', 
            [userId]
        );

        const savedVector = userRes.rows[0]?.vector_preferencias;

        // Si no tiene vector, devolvemos array vacío (el front mostrará el botón "Hacer Test")
        if (!savedVector) {
            return res.json({ status: 'no_data', recommendations: [] });
        }

        // 2. Si tiene vector, calculamos matches frescos
        const rankedPets = await calculateMatchesForVector(savedVector);

        res.json({ status: 'success', recommendations: rankedPets });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo recomendaciones' });
    }
};

// --- Función Auxiliar para no repetir código ---
async function calculateMatchesForVector(userVector) {
    const allPets = await mascotaModel.obtenerMascotasParaRecomendacion();
    
    const rankedPets = allPets.map(pet => {
        const petVector = pet.vector_caracteristicas || mlService.createPetVector(pet);
        const score = mlService.cosineSimilarity(userVector, petVector);
        return { ...pet, match_score: score };
    });

    return rankedPets.sort((a, b) => b.match_score - a.match_score).slice(0, 10);
}