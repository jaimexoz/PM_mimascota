const pool = require('../config/db');
const { createLog } = require('./LogModel');

// Funciones del Modelo (Interacción con la DB)

/**
 * Busca un usuario por su email.
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<object>} El resultado de la consulta.
 */
const findUserByEmailDB = async (email) => {
    return pool.query('SELECT * FROM usuarios WHERE emailx_usuari = $1', [email]);
};

/**
 * Registra un nuevo usuario en la DB, incluyendo datos de verificación.
 * @param {object} userData - Datos del usuario a insertar.
 * @returns {Promise<object>} El usuario recién creado.
 */
const createNewUserDB = async (userData) => {
    const { nombre_usuari, emailx_usuari, contra_usuari, celula_usuari, imagep_usuari, verificationToken, verificationExpires, apelli_usuari } = userData;

    // Nota: Se asume que idxxx_rolesx para 'Usuario' se obtiene correctamente
    const newUser = await pool.query(
        `INSERT INTO usuarios (
            nombre_usuari, 
            emailx_usuari, 
            contra_usuari, 
            celula_usuari,    
            imagep_usuari,    
            idxxxx_rolesx, 
            mailve_usuari, 
            tokeve_usuari,    
            tokexp_usuari,
            apelli_usuari    
        ) VALUES ($1, $2, $3, $4, $5, 
            (SELECT idxxxx_rolesx FROM roles WHERE nombre_rolesx = 'Usuario'), 
            FALSE, $6, $7, $8) 
        RETURNING idxxxx_usuari, nombre_usuari, emailx_usuari, celula_usuari, imagep_usuari, mailve_usuari, apelli_usuari`,
        [nombre_usuari, emailx_usuari, contra_usuari, celula_usuari, imagep_usuari, verificationToken, verificationExpires, apelli_usuari]
    );
    return newUser.rows[0];
};

/**
 * Obtiene el usuario completo y su rol por email para el login.
 * NO filtra por eliminado_logico para poder verificar si el usuario está eliminado.
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<object>} El resultado de la consulta con el rol.
 */
const findUserWithRoleByEmailDB = async (email) => {
    return pool.query(`
        SELECT u.*, r.nombre_rolesx
        FROM usuarios u
        JOIN roles r ON u.idxxxx_rolesx = r.idxxxx_rolesx
        WHERE u.emailx_usuari = $1
    `, [email]);
};

/**
 * Marca el correo como verificado y limpia el token de verificación.
 * @param {number} userId - ID del usuario.
 */
const verifyEmailDB = async (userId) => {
    await pool.query(
        `UPDATE usuarios SET mailve_usuari = TRUE, tokeve_usuari = NULL, tokexp_usuari = NULL WHERE idxxxx_usuari = $1`,
        [userId]
    );
};

/**
 * Busca un usuario por su token de restablecimiento y verifica la expiración.
 * @param {string} token - Token de restablecimiento.
 * @returns {Promise<object>} El resultado de la consulta.
 */
const findUserByResetTokenDB = async (token) => {
    return pool.query(
        `SELECT * FROM usuarios WHERE reseto_usuari = $1 AND resetx_usuari > NOW()`,
        [token]
    );
};

/**
 * Actualiza el token de restablecimiento y su expiración.
 * @param {string} resetToken - Nuevo token de restablecimiento.
 * @param {Date} resetExpires - Fecha de expiración del token.
 * @param {number} userId - ID del usuario.
 */
const updateResetTokenDB = async (resetToken, resetExpires, userId) => {
    await pool.query(
        `UPDATE usuarios SET reseto_usuari = $1, resetx_usuari = $2 WHERE idxxxx_usuari = $3`,
        [resetToken, resetExpires, userId]
    );
};

/**
 * Restablece la contraseña y limpia los tokens de reseteo.
 * @param {string} hashedPassword - Contraseña hasheada.
 * @param {number} userId - ID del usuario.
 */
const setPasswordAndClearResetTokenDB = async (hashedPassword, userId) => {
    await pool.query(
        `UPDATE usuarios SET contra_usuari = $1, reseto_usuari = NULL, resetx_usuari = NULL WHERE idxxxx_usuari = $2`,
        [hashedPassword, userId]
    );
};

/**
 * Actualiza la información básica del usuario.
 * @param {number} userId - ID del usuario.
 * @param {object} data - Datos a actualizar.
 * @returns {Promise<object>} El resultado de la actualización.
 */
const updateUserInfo = async (userId, data) => {
    const { nombre, apellido, celular, edadValue } = data;
    return pool.query(
        `UPDATE usuarios SET 
            nombre_usuari = $1, 
            apelli_usuari = $2, 
            celula_usuari = $3, 
            edadxx_usuari = $4,
            feactu_usuari = NOW()
        WHERE idxxxx_usuari = $5
        RETURNING *`,
        [nombre, apellido, celular, edadValue, userId]
    );
};

/**
 * Obtiene los datos completos del usuario con su rol después de una actualización.
 * @param {number} userId - ID del usuario.
 * @returns {Promise<object>} El resultado de la consulta con el rol.
 */
const getUserWithRoleByIdDB = async (userId) => {
    return pool.query(`
        SELECT 
            u.idxxxx_usuari AS id, 
            u.nombre_usuari AS nombre,
            u.apelli_usuari AS apellido, 
            u.emailx_usuari AS email,
            u.celula_usuari AS celular, 
            u.imagep_usuari AS imageUrl,
            u.mailve_usuari AS mailVerified,
            u.edadxx_usuari AS edad,
            r.nombre_rolesx AS role
        FROM usuarios u
        JOIN roles r ON u.idxxxx_rolesx = r.idxxxx_rolesx
        WHERE u.idxxxx_usuari = $1
    `, [userId]);
};

/**
 * Actualiza la foto de perfil en la DB.
 * @param {number} userId - ID del usuario.
 * @param {string} newImageUrl - Nueva URL de la imagen.
 */
const updateProfileImageDB = async (userId, newImageUrl) => {
    await pool.query(
        'UPDATE usuarios SET imagep_usuari = $1 WHERE idxxxx_usuari = $2',
        [newImageUrl, userId]
    );
};

/**
 * Obtiene la URL de la imagen actual del usuario.
 * @param {number} userId - ID del usuario.
 */
const getCurrentProfileImageDB = async (userId) => {
    return pool.query(
        'SELECT imagep_usuari FROM usuarios WHERE idxxxx_usuari = $1',
        [userId]
    );
};


/**
 * Obtiene todos los usuarios (solo se usa para el rol de admin).
 * @returns {Promise<object>} Lista de usuarios.
 */
const getAllUsersDB = async () => {
    return pool.query(`
        SELECT 
            idxxxx_usuari AS id, 
            nombre_usuari AS nombre,
            apelli_usuari AS apellido, 
            emailx_usuari AS correo, 
            celula_usuari AS celular, 
            idxxxx_rolesx AS rol
        FROM usuarios
        ORDER BY idxxxx_usuari ASC
    `);
};

/**
 * Cambia la contraseña hasheada del usuario.
 * @param {number} userId - ID del usuario.
 * @param {string} hashedPassword - Nueva contraseña hasheada.
 */
const changeUserPasswordDB = async (userId, hashedPassword) => {
    await pool.query(
        'UPDATE usuarios SET contra_usuari = $1 WHERE idxxxx_usuari = $2',
        [hashedPassword, userId]
    );
};

/**
 * Obtiene la contraseña hasheada actual del usuario.
 * @param {number} userId - ID del usuario.
 */
const getCurrentHashDB = async (userId) => {
    return pool.query(
        'SELECT contra_usuari FROM usuarios WHERE idxxxx_usuari = $1',
        [userId]
    );
};

/**
 * Cambia el rol de un usuario.
 * @param {number} userId - ID del usuario a modificar.
 * @param {number} newRole - Nuevo ID de rol.
 */
const changeRoleDB = async (userId, newRole) => {
    await pool.query(
        'UPDATE usuarios SET idxxxx_rolesx = $1 WHERE idxxxx_usuari = $2',
        [newRole, userId]
    );

    // LOGGING: Cambio de Rol
    await createLog({
        table: 'usuarios',
        column: 'idxxxx_rolesx',
        oldValue: 'Unknown',
        newValue: newRole,
        recordId: userId,
        userId: null // TODO: Pasar el adminId como argumento a changeRoleDB
    });
};

const softDeleteUser = async (userId) => {

    return pool.query(
        'UPDATE usuarios SET eliminado_logico = TRUE WHERE idxxxx_usuari = $1',
        [userId]
    );
}

/**
 * Elimina un usuario no verificado (para limpiar usuarios zombie con tokens expirados).
 * @param {number} userId - ID del usuario a eliminar.
 */
const deleteUnverifiedUserDB = async (userId) => {
    return pool.query(
        'DELETE FROM usuarios WHERE idxxxx_usuari = $1 AND mailve_usuari = FALSE',
        [userId]
    );
};

module.exports = {
    findUserByEmailDB,
    createNewUserDB,
    findUserWithRoleByEmailDB,
    verifyEmailDB,
    findUserByResetTokenDB,
    updateResetTokenDB,
    setPasswordAndClearResetTokenDB,
    updateUserInfo,
    getUserWithRoleByIdDB,
    updateProfileImageDB,
    getCurrentProfileImageDB,
    getAllUsersDB,
    changeUserPasswordDB,
    getCurrentHashDB,
    changeRoleDB,
    softDeleteUser,
    deleteUnverifiedUserDB
};