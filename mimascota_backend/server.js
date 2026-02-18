// mi_mascota_backend/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http'); // 👈 Importamos el módulo HTTP
const { Server } = require('socket.io'); // 👈 Importamos el constructor de Socket.io
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const mascotaRoutes = require('./routes/mascotaRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const createAdoptionRouter = require('./routes/adoptionRoutes'); // 👈 CAMBIO: Importamos la función
const reviewRoutes = require('./routes/reviewRoutes');
const recommendationsRoutes = require('./routes/recommendationsRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const app = express();
// 1. Crear el servidor HTTP a partir de la aplicación Express
const server = http.createServer(app);

// 2. Inicializar Socket.io y adjuntarlo al servidor HTTP
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true // ⭐️ Agregar esto para permitir credenciales
    },
    transports: ['websocket', 'polling'] // ⭐️ Especificar transportes explícitamente
});

// 3. Configurar la conexión de Socket.io con mejor manejo de errores
io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    const userId = socket.handshake.query.userId;

    if (userId) {
        socket.join(userId.toString());
        console.log(`✅ Usuario ${userId} unido a su sala de notificaciones (Socket ID: ${socket.id})`);
    } else {
        console.warn(`⚠️ Cliente conectado sin userId (Socket ID: ${socket.id})`);
    }

    // Listener para registro manual de usuario (por si acaso)
    socket.on('register_user', (userId) => {
        if (userId) {
            socket.join(userId.toString());
            console.log(`Usuario ${userId} registrado manualmente en sala.`);
        }
    });

    // Manejo de desconexión
    socket.on('disconnect', (reason) => {
        console.log(`Cliente desconectado: ${socket.id}. Razón: ${reason}`);
    });

    // Manejo de errores
    socket.on('error', (error) => {
        console.error(`Error en socket ${socket.id}:`, error);
    });
});
// -----------------------------------------------------------

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API (Sin cambio en cómo se usan las rutas que no necesitan 'io')
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/interactions', interactionRoutes);



// ⭐️ CAMBIO CLAVE: Usa la función importada para crear las rutas de adopción
// y le inyecta la instancia 'io' para que esté disponible en el controlador.
app.use('/api/adoptions', createAdoptionRouter(io));
// -----------------------------------------------------------


// Ruta de prueba simple (opcional)
app.get('/', (req, res) => {
    res.send('API de Mi Mascota funcionando!');
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;

app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada', ruta: req.originalUrl });
});

// 4. Iniciar el servidor HTTP (NO app.listen)
server.listen(PORT, () => {
    console.log(`Servidor Express/Socket.io corriendo en el puerto ${PORT}`);
    console.log(`Acceso a la API en: http://localhost:${PORT}/api`);
});

// ⚠️ IMPORTANTE: El middleware 404 debe ir AL FINAL, después de todas las rutas
// (Eliminado duplicado que causaba conflicto)