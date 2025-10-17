<template>
  <nav :class="['navbar', { 'navbar-scrolled': isScrolled }]">
    <div class="navbar-container">
      <div class="navbar-logo">
        <router-link to="/home" class="logo-link">
          <img src="../assets/LogoMiMascota.png" alt="MiMascota" class="logo-image" />
        </router-link>
      </div>

      <div class="navbar-nav">
        <router-link to="/home" class="nav-link" :class="{ 'active': $route.path === '/home' }">
          INICIO
        </router-link>
        <router-link to="/gatos" class="nav-link" :class="{ 'active': $route.path === '/gatos' }">
          GATOS
        </router-link>
        <router-link to="/perros" class="nav-link" :class="{ 'active': $route.path === '/perros' }">
          PERROS
        </router-link>
        <router-link to="/nosotros" class="nav-link" :class="{ 'active': $route.path === '/nosotros' }">
          NOSOTROS
        </router-link>
      </div>

      <div class="navbar-right">
        <div class="notifications-container">
          <div 
            class="notifications-icon"
            @click="toggleNotifications" 
          >
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
            </svg>
          </div>

          <div v-if="isNotificationsOpen" class="notifications-dropdown">
            <div class="dropdown-header">Notificaciones</div>
            
            <div v-if="notifications.length === 0" class="notification-empty">
                No tienes notificaciones.
            </div>

            <div 
                v-else
                v-for="notif in notifications" 
                :key="notif.id" 
                :class="['notification-item', { 'unread': !notif.is_read }]"
            >
              <div class="imagen-noti">
                <img :src="notif.image_url || '/default-avatar.png'" class="notification-avatar" alt="Avatar">
              </div >
                
                <span v-html="notif.message"></span> 
            </div>
            
            <button class="view-more-button" @click="goToNotifications">Ver más</button>
          </div>
        </div>

        <div class="vertical-separator"></div>

        <div class="user-profile-container">
          <div class="user-profile" @click="toggleDropdown">
            <div class="user-avatar">
              <img 
                :src="userImageUrl" 
                :alt="userName"
                @error="handleImageError"
              />
            </div>
            <span class="user-name">{{ userName }}</span>
            <svg 
              class="dropdown-arrow" 
              :class="{ 'rotated': isDropdownOpen }"
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>

          <div v-if="isDropdownOpen" class="dropdown-menu">
            <router-link to="/perfil" class="dropdown-item" @click="closeDropdown">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4"/>
                <path d="M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z"/>
              </svg>
              Ver Perfil
            </router-link>

            <router-link to="/favoritos" class="dropdown-item" @click="closeDropdown">
              <font-awesome-icon :icon="['fas', 'star']" class="w-10 h-10" />
              Favoritos
            </router-link>
            <router-link v-if="isAdmin" to="/usuarios" class="dropdown-item" @click="closeDropdown">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              Lista de Usuarios
            </router-link>
            <button class="dropdown-item logout-item" @click="handleLogout">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { logout, onUserDataChange } from '../utils/auth';

import { io } from 'socket.io-client';

const router = useRouter();
const isScrolled = ref(false);
const userName = ref('Usuario');
const userImageUrl = ref('/default-avatar.png');
const isDropdownOpen = ref(false);
const isNotificationsOpen = ref(false); 
const userRole = ref('');
// ⭐️ ESTADOS CLAVE PARA NOTIFICACIONES ⭐️
const notifications = ref([]); // Lista de notificaciones reales (las cargadas de la DB y las recibidas por Socket)
const unreadCount = computed(() => { // El contador que se muestra en el badge
  return notifications.value.filter(n => !n.is_read).length;
});
let socket = null; // Instancia de Socket.io

// --- LÓGICA DE DATOS Y CONEXIÓN ---

/**
 * 1. Conecta el cliente de Socket.io y configura los listeners.
 */

 const getUserToken = () => {
    const userDataString = localStorage.getItem('authToken');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            // Asegúrate de usar la propiedad correcta, que según tu imagen es 'id'
            return userData.id; 
        } catch (e) {
            console.error("Error al parsear userData:", e);
            return null;
        }
    }
    return null;
};

 const getUserId = () => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        try {
            const userData = JSON.parse(userDataString);
            // Asegúrate de usar la propiedad correcta, que según tu imagen es 'id'
            return userData.id; 
        } catch (e) {
            console.error("Error al parsear userData:", e);
            return null;
        }
    }
    return null;
};
 const connectSocket = () => {
    const userId = getUserId(); // Obtener el ID del usuario actual

    if (!userId) {
        console.warn('No hay ID de usuario. No se puede conectar Socket.io.');
        return;
    }

    // ⚠️ AJUSTA ESTA URL a la de tu backend si no es http://localhost:3000
    socket = io('http://localhost:3000', {
        query: {
            userId: userId // ⭐️ Enviar el ID de usuario para la autenticación y unión al "room"
        }
    });

    socket.on('connect', () => {
        console.log('Socket.io conectado. ID:', socket.id);
    });

    // ⭐️ ESCUCHA EL EVENTO EN TIEMPO REAL ⭐️
    socket.on('new_notification', (newNotif) => {
        console.log('Nueva notificación recibida por Socket:', newNotif);
        // Agregar la nueva notificación al inicio de la lista
        notifications.value.unshift({ 
            ...newNotif,
            is_read: false // Asumimos que la recibida en tiempo real aún no está leída
        });
    });

    socket.on('disconnect', () => {
        console.log('Socket.io desconectado.');
    });
};

/**
 * 2. Carga las notificaciones iniciales desde la API (las que ya están en DB).
 * 
 * 
 */
 

 const fetchNotifications = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // ⚠️ AJUSTA ESTA RUTA a la de tu endpoint de notificaciones
        const response = await fetch('http://localhost:3000/api/adoptions/notificaciones', { 
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Asignar los datos al ref de notificaciones
            notifications.value = data; 
        } else {
            console.error('Error al cargar notificaciones:', response.statusText);
        }
    } catch (error) {
        console.error('Error de red al cargar notificaciones:', error);
    }
};


/**
 * 3. Marca las notificaciones como leídas en la API.
 */
const markAllAsRead = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // Optimización: Solo marca si hay notificaciones no leídas
        if (unreadCount.value === 0) return;

        // ⚠️ AJUSTA ESTA RUTA a la de tu endpoint de marcar como leídas
        const response = await fetch('http://localhost:3000/api/adoptions/readnotifi', { 
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Actualizar el estado local para reflejar que están todas leídas
            notifications.value = notifications.value.map(n => ({ ...n, is_read: true }));
        }
    } catch (error) {
        console.error('Error al marcar como leídas:', error);
    }
};


// Manejar scroll para ocultar/mostrar navbar
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

// Manejar error de imagen
const handleImageError = (event) => {
  event.target.src = '/default-avatar.png';
};

// Verificar si es admin
const isAdmin = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'Administrador';
});

// Toggle del menú desplegable
const toggleDropdown = () => {
  isNotificationsOpen.value = false;
  isDropdownOpen.value = !isDropdownOpen.value;
};

// Toggle del menú desplegable de Notificaciones 👈 NUEVA FUNCIÓN
const toggleNotifications = () => {
    isDropdownOpen.value = false; // Cierra perfil al abrir notificaciones
    isNotificationsOpen.value = !isNotificationsOpen.value;
    
    // ⭐️ LLAMAR A MARCAR COMO LEÍDAS AL ABRIR ⭐️
    if (isNotificationsOpen.value && unreadCount.value > 0) {
        markAllAsRead(); 
    }
};

// Cerrar el menú desplegable
const closeDropdown = () => {
  isDropdownOpen.value = false;
  isNotificationsOpen.value = false;
};

// Manejar logout
const handleLogout = () => {
  logout();
  closeDropdown();
  router.push({ name: 'auth' });
};

// Cerrar dropdown al hacer clic fuera
const handleClickOutside = (event) => {
    // Verificar si el clic NO fue dentro del contenedor de perfil O el contenedor de notificaciones
    const isProfileClick = event.target.closest('.user-profile-container');
    const isNotificationsClick = event.target.closest('.notifications-container'); // Usaremos esta clase

    if (!isProfileClick && !isNotificationsClick) {
        closeDropdown();
    }
};
// Obtener datos del usuario desde localStorage o contexto
const loadUserData = () => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userName.value = user.nombre || user.name || 'Usuario';
      userRole.value = user.role || user.rol || '';
      
      // Manejar la URL de la imagen
      if (user.imageUrl) {
        // Si ya es una URL completa de Cloudinary, usarla directamente
        if (user.imageUrl.startsWith('http')) {
          userImageUrl.value = user.imageUrl;
        } else {
          // Si es una ruta local, convertirla a URL completa
          userImageUrl.value = `http://localhost:3000${user.imageUrl}`;
        }
      } else {
        userImageUrl.value = '/default-avatar.png';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      userName.value = 'Usuario';
      userImageUrl.value = '/default-avatar.png';
    }
  }
};

// Función para actualizar datos del usuario reactivamente
const updateUserData = (newUserData) => {
  userName.value = newUserData.nombre || newUserData.name || 'Usuario';
  userRole.value = newUserData.role || newUserData.rol || '';
  
  // Manejar la URL de la imagen
  if (newUserData.imageUrl) {
    if (newUserData.imageUrl.startsWith('http')) {
      userImageUrl.value = newUserData.imageUrl;
    } else {
      userImageUrl.value = `http://localhost:3000${newUserData.imageUrl}`;
    }
  } else {
    userImageUrl.value = '/default-avatar.png';
  }
};

// Variable para almacenar la función de desuscripción
let unsubscribe = null;

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
    loadUserData();
    
    // Suscribirse a cambios en los datos del usuario
    unsubscribe = onUserDataChange(updateUserData);
    
    // ⭐️ CÓDIGO CRÍTICO: INICIAR CONEXIÓN Y CARGA AL MONTAR ⭐️
    connectSocket();
    fetchNotifications(); 
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('click', handleClickOutside);
    
    // Desuscribir
    if (unsubscribe) {
        unsubscribe();
    }
    
    // DESCONEXIÓN DEL SOCKET 
    if (socket) {
        socket.disconnect();
    }
    // NOTA: Elimina cualquier otra llamada a loadUserData o addEventListener aquí.
});
</script>

<style scoped>

.nav-link:hover{
  background-color: #ffffff;
}

.logo-link:hover{
  background-color: #ffffff;
}
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0px 0px 5px 5px rgba(0,0,0,0.5);
  border-bottom: 1px solid #e0e0e0;
  z-index: 1000;
  transition: all 0.3s ease;
  padding: 1rem 0;
  font-family: 'Inter', sans-serif;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0px 0px 5px 5px rgba(0,0,0,0.5);
  padding: 0.5rem 0;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
}

/* Logo */
.navbar-logo {
  flex-shrink: 0;
  justify-self: start;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 1.5rem;
}

.logo-image {
  height: 50px;
  width: auto;
}

.logo-text {
  font-weight: 700;
}

/* Navegación Central */
.navbar-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  justify-self: center;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #333;
}

.nav-link.active {
  color: #333;
  font-weight: 600;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background: #333;
  border-radius: 1px;
}

/* Lado Derecho */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  justify-self: end;
}

img.notification-avatar {
    width: 60px;
    height: 60px;
    margin-right: 10px;
    border-radius: 50%;
    object-fit: cover;
}
.notifications-container {
    position: relative; /* Clave para el posicionamiento absoluto del dropdown */
    display: flex;
    align-items: center;
    cursor: pointer;
}

/* Notificaciones */
.notifications-icon {
  position: relative;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s ease;
  color: #555;
}

.notifications-icon:hover {
  background-color: #f5f5f5;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4757;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* 3. Estilo de la ventana de Notificaciones (Dropdown) */
.notifications-dropdown {
    position: absolute;
    top: 100%; /* Coloca el dropdown debajo del icono */
    right: 0;
    width: 350px; /* Ancho que se ajuste a tu diseño */
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10; /* Asegura que flote sobre el contenido del navbar */
    margin-top: 10px;
    padding: 10px 0;
}

.dropdown-header {
    font-weight: bold;
    padding: 5px 15px 10px;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
}

/* 4. Estilo de los ítems (ajusta para que se parezcan a tu mockup) */
.notification-item {
    display: flex;
    align-items: flex-start;
    padding: 10px 15px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s;
}

.notification-item:hover {
    background-color: #f5f5f5;
}

.notification-item.unread {
    /* Resaltar notificaciones no leídas si lo deseas */
    background-color: #e6f7ff; 
}

/* Separador Vertical */
.vertical-separator {
  width: 1px;
  height: 30px;
  background: #e0e0e0;
}

/* Perfil de Usuario */
.user-profile-container {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.user-profile:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.dropdown-arrow {
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* Menú Desplegable */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1001;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #333;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.logout-item {
  color: #dc3545;
  border-top: 1px solid #e0e0e0;
}

.dropdown-item.logout-item:hover {
  background-color: #fff5f5;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 1rem;
  }
  
  .navbar-nav {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.8rem;
  }
  
  .user-name {
    display: none;
  }
  
  .vertical-separator {
    display: none;
  }
  
  .dropdown-menu {
    right: -1rem;
  }
}

.dropdown-item font-awesome-icon {
  font-size: 2.5rem;
}
</style> 