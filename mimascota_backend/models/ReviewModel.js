// models/ReviewModel.js

const pool = require('../config/db'); // Asume que tienes configurada la conexión a la pool de PostgreSQL

class ReviewModel {
    /**
     * @description Inserta una nueva reseña en la base de datos.
     * @param {number} userId - ID del usuario que crea la reseña.
     * @param {string} content - Contenido de la reseña (conten_review).
     * @param {number} stars - Número de estrellas (nstars_review).
     * @returns {Promise<object>} El registro de la reseña recién creada.
     */
    static async createReview(userId, content, stars) {
        // En un INSERT, 'eliminado_logico' es FALSE por defecto y 'fecha_eliminacion' es NULL.
        const query = `
            INSERT INTO reviews (forane_usuari_id, conten_review, nstars_review, eliminado_logico)
            VALUES ($1, $2, $3, FALSE)
            RETURNING idxxxx_review, conten_review, nstars_review, forane_usuari_id;
        `;
        const values = [userId, content, stars];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error al crear la reseña:", error);
            throw new Error("Error en la base de datos al crear la reseña.");
        }
    }

    /**
     * @description Obtiene reseñas paginadas que no han sido eliminadas lógicamente.
     * @param {number} limit - Número de reseñas por página (por defecto 6).
     * @param {number} offset - Desplazamiento para la paginación.
     * @returns {Promise<object>} Objeto con las reseñas y el total de registros.
     */
    static async getPaginatedReviews(limit = 6, offset = 0, sortOrder = 'DESC') {
        
        // Asegurar que la dirección sea una de las dos únicas opciones válidas.
        const orderDirection = (sortOrder === 'ASC') ? 'ASC' : 'DESC';

        // Construir la consulta de forma segura usando concatenación condicional
        // en lugar de interpolación dentro del template literal
        const reviewsQuery = `
            SELECT 
                r.idxxxx_review, 
                r.conten_review, 
                r.nstars_review,
                r.fechax_review,
                u.nombre_usuari, 
                u.imagep_usuari      
            FROM 
                reviews r
            JOIN 
                usuarios u ON r.forane_usuari_id = u.idxxxx_usuari
            WHERE 
                r.eliminado_logico = FALSE
            ORDER BY 
                r.idxxxx_review ` + orderDirection + `
            LIMIT $1 OFFSET $2;
        `;
        
        const countQuery = `
            SELECT COUNT(*) as count FROM reviews WHERE eliminado_logico = FALSE;
        `;
        
        try {
            // Se usa $1 para LIMIT y $2 para OFFSET
            const [reviewsResult, countResult] = await Promise.all([
                pool.query(reviewsQuery, [limit, offset]),
                pool.query(countQuery)
            ]);
            
            const totalReviews = parseInt(countResult.rows[0].count, 10);

            return {
                reviews: reviewsResult.rows,
                total: totalReviews,
                totalPages: Math.ceil(totalReviews / limit)
            };
        } catch (error) {
            console.error("Error al obtener reseñas paginadas:", error);
            throw new Error("Error en la base de datos al obtener las reseñas.");
        }
    }

    /**
     * @description Realiza una eliminación lógica de la reseña.
     * @param {number} reviewId - ID de la reseña a eliminar.
     * @returns {Promise<boolean>} Verdadero si se modificó 1 registro.
     */
    static async softDelete(reviewId) {
        const query = `
            UPDATE reviews
            SET 
                eliminado_logico = TRUE,
                fecha_eliminacion = NOW()
            WHERE idxxxx_review = $1
            AND eliminado_logico = FALSE;
        `;
        try {
            const result = await pool.query(query, [reviewId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error("Error al eliminar lógicamente la reseña:", error);
            throw new Error("Error en la base de datos al eliminar la reseña.");
        }
    }
}

module.exports = ReviewModel;