// mi_mascota_backend/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Para logging de peticiones HTTP
const path = require('path'); // Para manejar rutas de archivos
require('dotenv').config(); // Cargar variables de entorno

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // ¡Importante! Asegúrate de que esta línea esté
// const otherRoutes = require('./routes/otherRoutes'); // Si tienes más rutas en el futuro

const app = express();

// Middlewares
app.use(cors()); // Permite peticiones desde dominios diferentes (tu frontend)
app.use(express.json()); // Para parsear cuerpos de solicitud con formato JSON (ej: para login/registro)
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de solicitud URL-encoded (si fuera necesario)
app.use(morgan('dev')); // Logger de peticiones: 'dev' para logs concisos en la consola

// Servir archivos estáticos de la carpeta 'uploads'
// Esto permite que las imágenes subidas sean accesibles desde el navegador
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Rutas de la API
// Prefijo '/api/auth' para todas las rutas definidas en authRoutes
app.use('/api/auth', authRoutes);
// Prefijo '/api/upload' para todas las rutas definidas en uploadRoutes
app.use('/api/upload', uploadRoutes); // ¡Importante! Asegúrate de que esta línea esté presente

// Ruta de prueba simple (opcional)
app.get('/', (req, res) => {
    res.send('API de Mi Mascota funcionando!');
});

// Manejo de errores global (opcional, pero buena práctica)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal en el servidor!');
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en el puerto ${PORT}`);
    console.log(`Acceso a la API en: http://localhost:${PORT}/api`);
});