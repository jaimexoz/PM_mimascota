const pool = require('../config/db');

/**
 * Registra un cambio en la tabla de logs_edicion.
 * 
 * @param {Object} logData
 * @param {string} logData.table - Nombre de la tabla afectada ('mascotas', 'usuarios', etc.)
 * @param {string} logData.column - Nombre de la columna modificada
 * @param {string} logData.oldValue - Valor anterior (convertido a string)
 * @param {string} logData.newValue - Valor nuevo (convertido a string)
 * @param {number} logData.recordId - ID del registro afectado
 * @param {number} logData.userId - ID del usuario que realizó el cambio
 */
const createLog = async ({ table, column, oldValue, newValue, recordId, userId }) => {
    try {
        const query = `
            INSERT INTO logs_edicion (
                tabafe_logsed, 
                camafe_logsed, 
                valant_logsed, 
                valnue_logsed, 
                forane_regist_id, 
                forane_usuari_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING idxxxx_logsed;
        `;

        // Asegurarse de que los valores sean strings o nulls
        const safeOldValue = oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
        const safeNewValue = newValue !== null && newValue !== undefined ? String(newValue) : null;

        await pool.query(query, [
            table,
            column,
            safeOldValue,
            safeNewValue,
            recordId,
            userId
        ]);

        console.log(`[LOG] Cambio registrado en ${table}.${column} (ID: ${recordId}) por Usuario ${userId}`);
    } catch (error) {
        console.error(`[ERROR LOG] Fallo al registrar log para ${table}.${column}:`, error.message);
        // No lanzamos el error para no interrumpir el flujo principal
    }
};

module.exports = {
    createLog
};
