const pool = require('../config/db'); // Asumo que ya tienes tu configuración de base de datos
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid'); // Para generar tokens únicos de verificación
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs');

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
        user: process.env.EMAIL_USER, // Tu correo electrónico para enviar correos
        pass: process.env.EMAIL_PASS, // La contraseña de aplicación generada (NO tu contraseña de Gmail)
    },
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { nombre_usuari, emailx_usuari, contra_usuari, celula_usuari, apelli_usuari } = req.body;
    let imagep_usuari = null;

    // Subir imagen a Cloudinary si existe
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'mimascota_perfiles',
                use_filename: true,
                unique_filename: false,
                overwrite: false
            });
            imagep_usuari = result.secure_url;
            // Eliminar archivo local después de subir
            fs.unlinkSync(req.file.path);
        } catch (err) {
            return res.status(500).json({ message: 'Error al subir la imagen a Cloudinary.', error: err.message });
        }
    }

    // Validaciones básicas
    if (!nombre_usuari || !apelli_usuari || !emailx_usuari || !contra_usuari) {
        return res.status(400).json({ message: 'Por favor, introduce todos los campos requeridos.' });
    }

    // Validar el dominio del correo electrónico
    if (!isValidEmailDomain(emailx_usuari)) {
        return res.status(400).json({ message: 'Dominio de correo electrónico no permitido. Por favor, usa un dominio válido de la lista blanca.' });
    }

    try {
        // Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT * FROM usuarios WHERE emailx_usuari = $1', [emailx_usuari]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'El usuario ya existe con este correo electrónico.' });
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contra_usuari, salt);

        // Generar token de verificación de correo
        const verificationToken = uuidv4();
        const verificationExpires = new Date(Date.now() + 3600000); // Expira en 1 hora

        // Insertar el nuevo usuario en la base de datos
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
            // Pasa imagep_usuari (la ruta relativa al servidor) como el valor del parámetro $5
            [nombre_usuari, emailx_usuari, hashedPassword, celula_usuari, imagep_usuari, verificationToken, verificationExpires, apelli_usuari]
        );

        // Enviar correo de verificación
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailx_usuari,
            subject: 'Verifica tu correo electrónico - Mi Mascota App',
            html: `
                <p>Hola ${nombre_usuari},</p>
                <p>Gracias por registrarte en Mi Mascota App. Por favor, verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
                <p><a href="${verificationUrl}">Verificar Correo Electrónico</a></p>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no te registraste en nuestra aplicación, por favor ignora este correo.</p>
            `,
        };

        // TODO: Descomentar para enviar correos en producción. En desarrollo, puede dar errores si no está bien configurado.
        await transporter.sendMail(mailOptions);

        // Responder al frontend con un mensaje de éxito
        res.status(201).json({
            message: 'Registro exitoso. Se ha enviado un enlace de verificación a tu correo electrónico.',
            userId: newUser.rows[0].idxxxx_usuari,
            redirectToVerification: true,
            email: emailx_usuari
        });

    } catch (error) {
        console.error('Error en el registro de usuario:', error);
        // Si el error es una violación de restricción única (por ejemplo, email duplicado)
        if (error.code === '23505') {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        // Si el error viene de Multer (ej. tipo de archivo no permitido), lo maneja aquí.
        if (error.message === 'Solo se permiten archivos de imagen.') { //
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
        const result = await pool.query(`
            SELECT u.*, r.nombre_rolesx
            FROM usuarios u
            JOIN roles r ON u.idxxxx_rolesx = r.idxxxx_rolesx
            WHERE u.emailx_usuari = $1
        `, [emailx_usuari]);

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (correo no encontrado).' });
        }

        if (!user.mailve_usuari) {
            return res.status(401).json({ message: 'Por favor, verifica tu correo electrónico para iniciar sesión.' });
        }

        // Comparar contraseña hasheada
        const isMatch = await bcrypt.compare(contra_usuari, user.contra_usuari);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.idxxxx_usuari, role: user.nombre_rolesx },
            process.env.JWT_SECRET,
            { expiresIn: '5h' } // Token expira en 8 horas
        );

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
        // 1. Verificar autenticación (el ID proviene del token, asumido en req.user.id)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'No autorizado. Se requiere un token de usuario válido.' });
        }
        
        const userId = req.user.id;
        // Campos que se pueden actualizar
        const { nombre, apellido, celular, edad } = req.body; 

        // 2. Validación de campos requeridos
        if (!nombre || nombre.trim() === '' || !apellido || apellido.trim() === '') {
            return res.status(400).json({ message: 'Nombre y Apellido son campos obligatorios.' });
        }

        // 3. Preparar la edad para la consulta (asegurar que sea un número válido o NULL)
        let edadValue = parseInt(edad, 10);
        // Si no es un número o es menor a 1, lo establecemos como NULL (asumiendo que la columna lo permite)
        if (isNaN(edadValue) || edadValue < 1) {
            edadValue = null; 
        }

        // 4. Consulta de Actualización (PostgreSQL)
        const updateResult = await pool.query(
            `UPDATE usuarios SET 
                nombre_usuari = $1, 
                apelli_usuari = $2, 
                celula_usuari = $3, 
                edadxx_usuari = $4,
                feactu_usuari = NOW()
             WHERE idxxxx_usuari = $5
             RETURNING *`, 
            [nombre, apellido, celular, edad, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
        }

        // 5. Obtener datos completos del usuario actualizado (incluyendo el rol)
        const updatedUserResult = await pool.query(`
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
        
        const updatedUser = updatedUserResult.rows[0];

        // 6. Respuesta exitosa
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
        const result = await pool.query(
            `SELECT * FROM usuarios WHERE tokeve_usuari = $1 AND tokexp_usuari > NOW()`,
            [token]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Token de verificación inválido o expirado.' });
        }

        // Actualizar el estado de verificación del usuario
        await pool.query(
            `UPDATE usuarios SET mailve_usuari = TRUE, tokeve_usuari = NULL, tokexp_usuari = NULL WHERE idxxxx_usuari = $1`,
            [user.idxxxx_usuari]
        );

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
        const result = await pool.query('SELECT * FROM usuarios WHERE emailx_usuari = $1', [emailx_usuari]);
        const user = result.rows[0];

        if (!user) {
            // No revelar si el correo existe por razones de seguridad
            return res.status(200).json({ message: 'Si el correo electrónico existe, se ha enviado un enlace para restablecer la contraseña.' });
        }

        // Generar token de restablecimiento
        const resetToken = uuidv4();
        const resetExpires = new Date(Date.now() + 3600000); // Expira en 1 hora

        await pool.query(
            `UPDATE usuarios SET reseto_usuari = $1, resetx_usuari = $2 WHERE idxxxx_usuari = $3`,
            [resetToken, resetExpires, user.idxxxx_usuari]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailx_usuari,
            subject: 'Restablecer contraseña - Mi Mascota App',
            html: `
                <p>Hola ${user.nombre_usuari},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
                <p><a href="${resetUrl}">Restablecer Contraseña</a></p>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste esto, por favor ignora este correo.</p>
            `,
        };

        // TODO: Descomentar para enviar correos en producción.
        await transporter.sendMail(mailOptions);

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
        const result = await pool.query(
            `SELECT * FROM usuarios WHERE reseto_usuari = $1 AND resetx_usuari > NOW()`,
            [token]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Token de restablecimiento inválido o expirado.' });
        }

        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña y limpiar tokens
        await pool.query(
            `UPDATE usuarios SET contra_usuari = $1, reseto_usuari = NULL, resetx_usuari = NULL WHERE idxxxx_usuari = $2`,
            [hashedPassword, user.idxxxx_usuari]
        );

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
        // Verificar si el usuario es admin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'Administrador' && req.user.role !== 'Usuario Normal')) {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden ver la lista de usuarios.' });
        }

        // Verificar específicamente si es admin (rol = 1) o Usuario Normal (rol = 2)
        // Como el token contiene el nombre del rol, verificamos que sea admin
        if (req.user.role === 'Usuario Normal') {
            return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden ver la lista de usuarios.' });
        }

        const result = await pool.query(`
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
        // Verificar si el usuario está autenticado
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'No autorizado.' });
        }

        // Verificar si se subió una imagen
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ninguna imagen.' });
        }

        // Obtener la imagen anterior del usuario
        const userResult = await pool.query(
            'SELECT imagep_usuari FROM usuarios WHERE idxxxx_usuari = $1',
            [req.user.id]
        );

        const currentImageUrl = userResult.rows[0]?.imagep_usuari;

        // Subir nueva imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'mimascota_perfiles',
            use_filename: true,
            unique_filename: false,
            overwrite: false
        });

        // Eliminar archivo local después de subir
        fs.unlinkSync(req.file.path);

        // Si había una imagen anterior en Cloudinary, eliminarla
        if (currentImageUrl && currentImageUrl.startsWith('https://res.cloudinary.com/')) {
            try {
                // Extraer el public_id de la URL de Cloudinary
                const urlParts = currentImageUrl.split('/');
                const filenameWithExtension = urlParts[urlParts.length - 1];
                const publicId = `mimascota_perfiles/${filenameWithExtension.split('.')[0]}`;
                
                // Eliminar imagen anterior de Cloudinary
                await cloudinary.uploader.destroy(publicId);
                console.log('Imagen anterior eliminada de Cloudinary:', publicId);
            } catch (deleteError) {
                console.error('Error al eliminar imagen anterior:', deleteError);
                // No fallamos la operación si no se puede eliminar la imagen anterior
            }
        }

        // Actualizar la base de datos con la nueva URL
        await pool.query(
            'UPDATE usuarios SET imagep_usuari = $1 WHERE idxxxx_usuari = $2',
            [result.secure_url, req.user.id]
        );

        // Obtener datos actualizados del usuario
        const updatedUserResult = await pool.query(`
            SELECT 
                u.idxxxx_usuari AS id,
                u.nombre_usuari AS nombre,
                u.apelli_usuari AS apellido, 
                u.emailx_usuari AS email,
                u.celula_usuari AS celular,
                u.imagep_usuari AS imageUrl,
                r.nombre_rolesx AS role
            FROM usuarios u
            JOIN roles r ON u.idxxxx_rolesx = r.idxxxx_rolesx
            WHERE u.idxxxx_usuari = $1
        `, [req.user.id]);

        const updatedUser = updatedUserResult.rows[0];

        res.status(200).json({
            message: 'Foto de perfil actualizada exitosamente.',
            user: {
                id: updatedUser.id,
                nombre: updatedUser.nombre,
                nombre: updatedUser.apellido,
                email: updatedUser.email,
                celular: updatedUser.celular,
                role: updatedUser.role,
                imageUrl: updatedUser.imageurl // <- corregido aquí
            }
        });

    } catch (error) {
        console.error('Error al actualizar foto de perfil:', error);
        
        // Eliminar archivo local si existe y hubo error
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

        // Validaciones
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // Obtener el usuario actual
        const userResult = await pool.query(
            'SELECT contra_usuari FROM usuarios WHERE idxxxx_usuari = $1',
            [req.user.id]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar la contraseña actual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.contra_usuari);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar la contraseña en la base de datos
        await pool.query(
            'UPDATE usuarios SET contra_usuari = $1 WHERE idxxxx_usuari = $2',
            [hashedNewPassword, req.user.id]
        );

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

        if (![1, 2].includes(newRole)) {
            return res.status(400).json({ message: 'Rol inválido. Solo se permiten roles 1 (admin) y 2 (usuario normal).' });
        }

        // Verificar que el usuario existe
        const userExists = await pool.query(
            'SELECT idxxxx_usuari, idxxxx_rolesx FROM usuarios WHERE idxxxx_usuari = $1',
            [userId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const currentUser = userExists.rows[0];

        // Verificar que no se está cambiando el rol del admin actual
        if (currentUser.idxxxx_usuari === req.user.id) {
            return res.status(400).json({ message: 'No puedes cambiar tu propio rol.' });
        }

        // Actualizar el rol del usuario
        await pool.query(
            'UPDATE usuarios SET idxxxx_rolesx = $1 WHERE idxxxx_usuari = $2',
            [newRole, userId]
        );

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