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
const app = express();
// 1. Crear el servidor HTTP a partir de la aplicación Express
const server = http.createServer(app); 

// 2. Inicializar Socket.io y adjuntarlo al servidor HTTP
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173", // Usa la URL de tu frontend Vue
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    }
});

// 3. Configurar la conexión de Socket.io (opcional, pero buena práctica)
io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);
    
    // Escucha el evento para unir al usuario a su sala personal
    socket.on('register_user', (userId) => {
        socket.join(userId);
        console.log(`Usuario ${userId} unido a su sala.`);
    });

    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
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


// ⭐️ CAMBIO CLAVE: Usa la función importada para crear las rutas de adopción
// y le inyecta la instancia 'io' para que esté disponible en el controlador.
app.use('/api/adoptions', createAdoptionRouter(io));
// -----------------------------------------------------------


// Ruta de prueba simple (opcional)
app.get('/', (req, res) => {
    res.send('API de Mi Mascota funcionando!');
});

// ... (Manejo de errores global y 404 existentes) ...

// Configuración del puerto
const PORT = process.env.PORT || 3000;

app.use((req, res) => {
    res.status(404).send('Ruta no encontrada');
});

// 4. Iniciar el servidor HTTP (NO app.listen)
server.listen(PORT, () => {
    console.log(`Servidor Express/Socket.io corriendo en el puerto ${PORT}`);
    console.log(`Acceso a la API en: http://localhost:${PORT}/api`);
});