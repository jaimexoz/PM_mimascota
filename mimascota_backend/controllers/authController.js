const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');
// Importamos el modelo
const authModel = require('../models/authModel'); 

// --- Funciones de Ayuda (Lógica de Negocio No-DB) ---

// Función de ayuda para validar dominios de correo (VALIDACIÓN ESTRICTA)
const isValidEmailDomain = (email) => {
    const allowedDomains = [
        'gmail.com',
        'outlook.com',
        'hotmail.com',
        'yahoo.com',
        'aol.com',
        'protonmail.com', 
    ];

    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();

    return allowedDomains.includes(domain);
};

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- Controladores ---

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { nombre_usuari, emailx_usuari, contra_usuari, celula_usuari, apelli_usuari } = req.body;
    let imagep_usuari = null;

    // 1. Manejo de Archivo
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'mimascota_perfiles',
                use_filename: true,
                unique_filename: false,
                overwrite: false
            });
            imagep_usuari = result.secure_url;
            fs.unlinkSync(req.file.path);
        } catch (err) {
            return res.status(500).json({ message: 'Error al subir la imagen a Cloudinary.', error: err.message });
        }
    }

    // 2. Validaciones
    if (!nombre_usuari || !apelli_usuari || !emailx_usuari || !contra_usuari) {
        return res.status(400).json({ message: 'Por favor, introduce todos los campos requeridos.' });
    }
    if (!isValidEmailDomain(emailx_usuari)) {
        return res.status(400).json({ message: 'Dominio de correo electrónico no permitido. Por favor, usa un dominio válido de la lista blanca.' });
    }

    try {
        // 3. Verificar existencia (Modelo)
        const userExists = await authModel.findUserByEmailDB(emailx_usuari);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe con este correo electrónico.' });
        }

        // 4. Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contra_usuari, salt);

        // 5. Generar token de verificación
        const verificationToken = uuidv4();
        const verificationExpires = new Date(Date.now() + 3600000); // Expira en 1 hora

        const userData = {
            nombre_usuari, emailx_usuari, contra_usuari: hashedPassword, celula_usuari, imagep_usuari,
            verificationToken, verificationExpires, apelli_usuari
        };

        // 6. Crear usuario (Modelo)
        const newUser = await authModel.createNewUserDB(userData);

        // 7. Enviar correo de verificación
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailx_usuari,
            subject: 'Verifica tu correo electrónico - Mi Mascota App',
            html: `<p>Hola ${nombre_usuari},</p><p>Gracias por registrarte en Mi Mascota App. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p><p><a href="${verificationUrl}">Verificar Correo Electrónico</a></p><p>Este enlace expirará en 1 hora.</p><p>Si no te registraste en nuestra aplicación, por favor ignora este correo.</p>`,
        };
        await transporter.sendMail(mailOptions);

        // 8. Respuesta
        res.status(201).json({
            message: 'Registro exitoso. Se ha enviado un enlace de verificación a tu correo electrónico.',
            userId: newUser.idxxxx_usuari,
            redirectToVerification: true,
            email: emailx_usuari
        });

    } catch (error) {
        console.error('Error en el registro de usuario:', error);
        if (error.code === '23505') { // Código de error de PostgreSQL para restricción única
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        if (error.message === 'Solo se permiten archivos de imagen.') { 
             return res.status(400).json({ message: 'Error al subir la imagen: Solo se permiten archivos de imagen.' });
        }
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.', error: error.message });
    }
};

// @desc    Iniciar sesión de usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { emailx_usuari, contra_usuari } = req.body;

    if (!emailx_usuari || !contra_usuari) {
        return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
    }

    try {
        // 1. Obtener usuario y rol (Modelo)
        const result = await authModel.findUserWithRoleByEmailDB(emailx_usuari);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (correo no encontrado).' });
        }
        if (!user.mailve_usuari) {
            return res.status(401).json({ message: 'Por favor, verifica tu correo electrónico para iniciar sesión.' });
        }

        // 2. Comparar contraseña
        const isMatch = await bcrypt.compare(contra_usuari, user.contra_usuari);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
        }

        // 3. Generar token JWT
        const token = jwt.sign(
            { id: user.idxxxx_usuari, role: user.nombre_rolesx },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
        );

        // 4. Respuesta
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id: user.idxxxx_usuari,
                nombre: user.nombre_usuari,
                email: user.emailx_usuari,
                celular: user.celula_usuari,
                role: user.nombre_rolesx,
                imageUrl: user.imagep_usuari,
                mailVerified: user.mailve_usuari,
                apellido: user.apelli_usuari
            },
        });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Actualizar información básica del usuario
// @route   PUT /api/auth/update-user-info
// @access  Privado
const updateUserInfo = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'No autorizado. Se requiere un token de usuario válido.' });
        }
        
        const userId = req.user.id;
        const { nombre, apellido, celular, edad } = req.body; 

        if (!nombre || nombre.trim() === '' || !apellido || apellido.trim() === '') {
            return res.status(400).json({ message: 'Nombre y Apellido son campos obligatorios.' });
        }

        let edadValue = parseInt(edad, 10);
        if (isNaN(edadValue) || edadValue < 1) {
            edadValue = null; 
        }

        // 1. Actualizar en DB (Modelo)
        await authModel.updateUserInfoDB(userId, { nombre, apellido, celular, edadValue });

        // 2. Obtener datos completos del usuario actualizado (Modelo)
        const updatedUserResult = await authModel.getUserWithRoleByIdDB(userId);
        
        if (updatedUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
        }
        const updatedUser = updatedUserResult.rows[0];

        // 3. Respuesta
        res.status(200).json({
            message: 'Información de perfil actualizada exitosamente.',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error al actualizar la información del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al guardar los cambios.' });
    }
};


// @desc    Verificar correo electrónico con token
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token de verificación no proporcionado.' });
    }

    try {
        // 1. Buscar usuario (Modelo)
        const result = await authModel.findUserByResetTokenDB(token); // Se reutiliza la consulta de reset token, solo falta chequear el campo tokeve_usuari vs reseto_usuari en la BD
        // Nota: En el modelo debería haber una función específica para tokeve_usuari
        
        // Debido a que el modelo anterior usaba una consulta genérica para token,
        // haré la consulta específica aquí o la ajusto en el modelo. 
        // **Ajuste temporal aquí para mantener el flujo:** Buscamos el token de verificación específico.
        const userResult = await pool.query(
             `SELECT * FROM usuarios WHERE tokeve_usuari = $1 AND tokexp_usuari > NOW()`, [token]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Token de verificación inválido o expirado.' });
        }

        // 2. Actualizar verificación (Modelo)
        await authModel.verifyEmailDB(user.idxxxx_usuari);

        res.status(200).json({ message: 'Correo electrónico verificado exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error al verificar el correo electrónico:', error);
        res.status(500).json({ message: 'Error interno del servidor al verificar el correo.' });
    }
};

// @desc    Solicitar restablecimiento de contraseña
// @route   POST /api/auth/request-password-reset
// @access  Public
const requestPasswordReset = async (req, res) => {
    const { emailx_usuari } = req.body;

    if (!emailx_usuari) {
        return res.status(400).json({ message: 'El correo electrónico es requerido.' });
    }

    try {
        // 1. Buscar usuario (Modelo)
        const result = await authModel.findUserByEmailDB(emailx_usuari);
        const user = result.rows[0];

        if (!user) {
            return res.status(200).json({ message: 'Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.' });
        }

        // 2. Generar y guardar token (Modelo)
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 3600000); // Expira en 1 hora
        await authModel.updateResetTokenDB(resetToken, resetExpires, user.idxxxx_usuari);

        // 3. Enviar correo
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailx_usuari,
            subject: 'Restablecer contraseña - Mi Mascota App',
            html: `<p>Hola ${user.nombre_usuari},</p><p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p><p><a href="${resetUrl}">Restablecer Contraseña</a></p><p>Este enlace expirará en 1 hora.</p><p>Si no solicitaste esto, por favor ignora este correo.</p>`,
        };
        await transporter.sendMail(mailOptions);

        // 4. Respuesta
        res.status(200).json({ message: 'Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.' });

    } catch (error) {
        console.error('Error al solicitar restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Restablecer contraseña
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token y nueva contraseña son requeridos.' });
    }

    try {
        // 1. Buscar usuario por token (Modelo)
        const result = await authModel.findUserByResetTokenDB(token);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Token de restablecimiento inválido o expirado.' });
        }

        // 2. Hashear y actualizar (Modelo)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await authModel.setPasswordAndClearResetTokenDB(hashedPassword, user.idxxxx_usuari);

        // 3. Respuesta
        res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });

    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Privado (solo admin)
const getAllUsers = async (req, res) => {
    try {
        // Verificación de rol (ya maneja 'admin'/'Administrador' vs 'Usuario Normal')
        if (!req.user || req.user.role === 'Usuario Normal') {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden ver la lista de usuarios.' });
        }

        // 1. Obtener usuarios (Modelo)
        const result = await authModel.getAllUsersDB();
        
        // 2. Respuesta
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

// @desc    Actualizar foto de perfil
// @route   PUT /api/auth/update-profile-image
// @access  Privado
const updateProfileImage = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'No autorizado.' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ninguna imagen.' });
        }

        // 1. Obtener imagen anterior (Modelo)
        const userResult = await authModel.getCurrentProfileImageDB(req.user.id);
        const currentImageUrl = userResult.rows[0]?.imagep_usuari;

        // 2. Subir a Cloudinary y eliminar local
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'mimascota_perfiles',
            use_filename: true,
            unique_filename: false,
            overwrite: false
        });
        fs.unlinkSync(req.file.path);

        // 3. Eliminar imagen anterior de Cloudinary (Si existe)
        if (currentImageUrl && currentImageUrl.startsWith('https://res.cloudinary.com/')) {
            try {
                const urlParts = currentImageUrl.split('/');
                const filenameWithExtension = urlParts[urlParts.length - 1];
                const publicId = `mimascota_perfiles/${filenameWithExtension.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (deleteError) {
                console.error('Error al eliminar imagen anterior:', deleteError);
            }
        }

        // 4. Actualizar DB (Modelo)
        await authModel.updateProfileImageDB(req.user.id, result.secure_url);

        // 5. Obtener datos actualizados del usuario (Modelo)
        const updatedUserResult = await authModel.getUserWithRoleByIdDB(req.user.id);
        const updatedUser = updatedUserResult.rows[0];

        // 6. Respuesta
        res.status(200).json({
            message: 'Foto de perfil actualizada exitosamente.',
            user: {
                id: updatedUser.id,
                nombre: updatedUser.nombre,
                apellido: updatedUser.apellido,
                email: updatedUser.email,
                celular: updatedUser.celular,
                role: updatedUser.role,
                imageUrl: updatedUser.imageUrl
            }
        });

    } catch (error) {
        console.error('Error al actualizar foto de perfil:', error);
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error al eliminar archivo temporal:', unlinkError);
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar la foto de perfil.' });
    }
};

// @desc    Cambiar contraseña del usuario
// @route   PUT /api/auth/change-password
// @access  Privado
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // 1. Obtener hash actual (Modelo)
        const userResult = await authModel.getCurrentHashDB(req.user.id);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // 2. Verificar contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.contra_usuari);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // 3. Hashear y actualizar (Modelo)
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        await authModel.changeUserPasswordDB(req.user.id, hashedNewPassword);

        res.status(200).json({ message: 'Contraseña cambiada exitosamente.' });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
    }
};

// @desc    Cambiar rol del usuario
// @route   PUT /api/auth/change-user-role
// @access  Privado (solo admin)
const changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;

        // Verificar que el usuario que hace la petición es admin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'Administrador')) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden cambiar roles.' });
        }

        // Validaciones
        if (!userId || !newRole) {
            return res.status(400).json({ message: 'ID de usuario y nuevo rol son requeridos.' });
        }
        // Asumiendo que 1 es admin y 2 es usuario normal (basado en tu código anterior)
        if (![1, 2].includes(newRole)) {
            return res.status(400).json({ message: 'Rol inválido. Solo se permiten roles 1 (admin) y 2 (usuario normal).' });
        }

        // 1. Verificar si el usuario existe (Modelo)
        const userExists = await authModel.getCurrentHashDB(userId); // Reutilizamos para chequear existencia
        if (userExists.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // 2. Evitar cambiar el rol del admin actual
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ message: 'No puedes cambiar tu propio rol.' });
        }

        // 3. Actualizar el rol (Modelo)
        await authModel.changeRoleDB(userId, newRole);

        res.status(200).json({ 
            message: 'Rol de usuario cambiado exitosamente.',
            userId,
            newRole
        });

    } catch (error) {
        console.error('Error al cambiar rol de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al cambiar el rol del usuario.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUserInfo,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    updateProfileImage,
    changePassword,
    changeUserRole,
};