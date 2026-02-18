// mi_mascota_backend/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de entorno desde .env

// Configuración de la Pool de conexiones a PostgreSQL
// Soporta DATABASE_URL (Render/Supabase) y variables individuales (local)
let poolConfig;

if (process.env.DATABASE_URL) {
    // Producción: usar DATABASE_URL (Render + Supabase)
    console.log('Usando DATABASE_URL para la conexión');
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else if (process.env.DB_USER && process.env.DB_HOST && (process.env.DB_DATABASE || process.env.DB_NAME)) {
    // Local: usar variables individuales
    console.log('Usando variables individuales (DB_USER, DB_HOST, etc.) para la conexión');
    poolConfig = {
        user: String(process.env.DB_USER),
        host: String(process.env.DB_HOST),
        database: String(process.env.DB_NAME || process.env.DB_DATABASE),
        password: String(process.env.DB_PASSWORD || ''),
        port: parseInt(process.env.DB_PORT || '5432', 10),
    };
} else {
    console.error('Error: Faltan variables de entorno para la conexión a la base de datos');
    console.error('Configura DATABASE_URL o las variables: DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT');
}

const pool = new Pool(poolConfig);

// Prueba de conexión
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al adquirir cliente de la pool:', err.stack);
    } else {
        console.log('Conexión exitosa a PostgreSQL');
        client.query('SELECT NOW()', (err, res) => {
            release();
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