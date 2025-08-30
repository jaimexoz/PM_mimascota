// mi_mascota_backend/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de entorno desde .env

// Configuración de la Pool de conexiones a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Configuración SSL para entornos donde la base de datos requiere conexión segura (ej. Heroku Postgres)
    // En desarrollo local (localhost), esto a menudo puede ser omitido o configurado como rejectUnauthorized: false
    // Si tu base de datos local no usa SSL, puedes quitar este objeto 'ssl' o dejarlo así para futura compatibilidad.
    /*ssl: {
        rejectUnauthorized: false // Establece a 'true' en producción si tu certificado SSL es válido y lo usas
    }*/
});

// Prueba de conexión (opcional, pero buena para depurar)
// Esto intentará conectar a la base de datos al iniciar el servidor
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al adquirir cliente de la pool:', err.stack);
        // Dependiendo de la gravedad del error, podrías considerar terminar el proceso aquí:
        // process.exit(1); 
    } else {
        console.log('Conexión exitosa a PostgreSQL');
        client.query('SELECT NOW()', (err, res) => {
            release(); // Libera el cliente de vuelta a la pool después de la consulta
            if (err) {
                console.error('Error al ejecutar la consulta de prueba:', err.stack);
            } else {
                console.log('Hora actual de la base de datos:', res.rows[0].now);
            }
        });
    }
});

// Exporta la pool para que pueda ser usada en otras partes de la aplicación
module.exports = pool;