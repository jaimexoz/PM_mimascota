// mi_mascota_backend/config/emailConfig.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // O tu servidor SMTP, ej. smtp.sendgrid.net
    port: 587, // Puerto SMTP
    secure: false, // true para 465, false para otros puertos como 587 con STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Esto es útil en desarrollo, pero puede ser un riesgo en producción. Considera cambiar a true en producción si tienes SSL válido.
    }
});

module.exports = transporter;