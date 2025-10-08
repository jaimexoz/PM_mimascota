<template>
    <div class="solicitudes-page">
        <Navbar />
        <button @click="irAtras" class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Regresar
                </button>
        <div class="content-wrapper">
            <div class="header-section">
                
                <h1 class="main-title">
                    <PawPrint class="paw-icon-main" />
                    Solicitudes Enviadas
                    <PawPrint class="paw-icon-main" />
                </h1>
            </div>

            <div v-if="loading" class="loading-state">
                <Loader class="loading-icon animate-spin" />
                <p>Cargando tus solicitudes...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <p class="text-red-600 font-semibold">{{ error }}</p>
            </div>

            <div v-else-if="solicitudes.length === 0" class="empty-state">
                <p>No tienes solicitudes de adopción enviadas todavía. ¡Anímate a encontrar a tu nueva mascota!</p>
            </div>

            <div v-else class="table-container">
                <table class="solicitudes-table">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Fecha de Envío</th>
                            <th>Nombre de la Mascota</th>
                            <th>Ficha de Información</th>
                            <th>Formulario de Adopción</th>
                            <th>Estado de Solicitud</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(solicitud, index) in solicitudes" :key="solicitud.idxxxx_forado">
                            <td>{{ index + 1 }}</td>
                            <td>{{ formatDate(solicitud.fechax_forado) }}</td>
                            <td>{{ solicitud.nombre_mascot || 'Cargando...' }}</td> <td>
                                <button @click="verFichaInformacion(solicitud.forane_mascot_id)" class="detail-button">
                                    Ver detalles 
                                    <span class="detail-icon">➤</span>
                                </button>
                            </td>
                            <td>
                                <button @click="verFormularioAdopcion(solicitud.idxxxx_forado)" class="detail-button">
                                    Ver detalles 
                                    <span class="detail-icon"> ➤</span>
                                </button>
                            </td>
                            <td>
                                <span :class="['status-badge', getStatusClass(solicitud.status_forado)]">
                                    {{ solicitud.status_forado }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; 
import Navbar from '@/components/Navbar.vue'; // Asumo la ruta del Navbar
import { useAuthStore } from "@/stores/authStore";
import { PawPrint, Loader } from 'lucide-vue-next';


const router = useRouter();
const authStore = useAuthStore();

// --- ESTADOS REACTIVOS ---
const solicitudes = ref([]);
const loading = ref(true);
const error = ref(null);

// --- FUNCIONES DE NAVEGACIÓN ---

/**
 * Navega a la ficha de información de la mascota.
 * @param {number} mascotId - El ID de la mascota.
 */
const verFichaInformacion = (mascotId) => {
    // Redirige al componente TarjetaMascota.vue
    router.push(`/card/${mascotId}`); 
};

/**
 * Navega al formulario de adopción ya enviado para verlo en modo de lectura.
 * @param {number} formId - El ID del formulario de adopción (idxzzz_forado).
 */
const verFormularioAdopcion = (formId) => {
    console.log('ID recibido del botón:', formId); 
    // Redirige al componente adoptForm.vue en MODO LECTURA. 
    // La ruta debe ser '/formulario/:formId' para activar el modo de visualización.
    router.push(`/formulario/${formId}`); 
};

/**
 * Función para cargar las solicitudes del usuario autenticado.
 */
const fetchUserSolicitudes = async () => {
    loading.value = true;
    error.value = null;
    const userToken = authStore.token;

    if (!userToken) {
        error.value = "Debes iniciar sesión para ver tus solicitudes.";
        loading.value = false;
        router.push('/login'); // Redirigir al login si no hay token
        return;
    }

    try {
        // ⭐️ Importante: Este endpoint debe ser implementado en Express. 
        // La ruta asume que el backend usa el token para obtener las solicitudes del usuario.
        const response = await fetch('http://localhost:3000/api/adoptions/user', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            }
        });

        if (response.status === 401) {
            // Token inválido/expirado
            authStore.logout();
            router.push('/login');
            return;
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        solicitudes.value = data; 

    } catch (err) {
        console.error('Fetch error:', err);
        error.value = `No se pudo obtener la lista de solicitudes: ${err.message}`;
    } finally {
        loading.value = false;
    }
};

/**
 * Función utilitaria para obtener la clase de color para el estado.
 * @param {string} status - El estado de la solicitud.
 */
const getStatusClass = (status) => {
    switch (status) {
        case 'Pendiente':
            return 'status-pendiente'; // Gris/Amarillo
        case 'Aceptada':
            return 'status-aceptado'; // Verde
        case 'Rechazada':
            return 'status-rechazado'; // Rojo
        default:
            return 'status-default';
    }
};

/**
 * Función para formatear la fecha a DD/MM/YYYY
 * @param {string} dateString - Fecha en formato ISO.
 */
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        // Usar Intl.DateTimeFormat para un formato local seguro y legible
        return new Intl.DateTimeFormat('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }).format(new Date(dateString));
    } catch {
        return dateString.substring(0, 10); // Fallback
    }
}

const irAtras = () => {
    window.history.back();
};


// --- CICLO DE VIDA ---
onMounted(() => {
    fetchUserSolicitudes();
});
</script>

<style scoped>
/* Estilos para el contenedor principal */
.solicitudes-enviadas {
    padding: 20px;
    background-color: #f8f9fa; /* Color de fondo ligero */
    min-height: 100vh;
}

.content-wrapper {
  max-width: 80rem; /* max-w-7xl */
  margin-left: auto;
  margin-right: auto;
  margin-top: 100px;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Estilos para el encabezado de la sección */
.header-container {
    max-width: 1000px;
    margin: 20px auto;
    text-align: center;
}

.main-title {
    font-size: 2.25rem; /* text-4xl */
    line-height: 2.5rem; /* leading-10 */
    font-weight: 800; /* font-extrabold */
    color: #111827; /* gray-900 */
    text-align: center;
    margin-bottom: 1rem;
}

.paw-icon-main {
    width: 2rem;
    height: 2rem;
    display: inline-block;
    color: #FF9933; /* Naranja principal */
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    margin-top: -0.25rem;
}

.back-button {
    width: 125px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    color: #6c757d;
    box-shadow: 0px 6px 10px -1px #757373; 
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    gap: 0.5rem;
    margin-left: 30px;
    margin-top: 10px;
    position: absolute;
}



.back-button:hover {
  background: #e9ecef;
  color: #495057;
}

/* Estilos de la tabla */
.table-container {
    max-width: 1000px;
    margin: 30px auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
    text-align: center;
    font-size: 1rem;
}

th {
    background-color: #495057; /* Fondo oscuro para el encabezado */
    color: #fff;
    font-weight: bold;
    text-transform: uppercase;
}

.status-pendiente{
    width: 125px;
    font-size: 1rem;
    font-weight: 700;
    background-color: #e7e7e7;
    color: #6b6b6b;
}

.status-aceptado{
    width: 125px;
    font-size: 1rem;
    font-weight: 700;
    background-color: #afff5f70;
    color: #5c9920;
}

.status-rechazado{
    width: 125px;
    font-size: 1rem;
    font-weight: 700;
    background-color: #ff3d3d70;
    color: #a82424;
}
/* Estilos para los botones de "Ver detalles" */
.detail-button {
    padding: 5px;
    padding-left: 10px;
    padding-right: 10px;
    border: none;
    border-radius: 25px;
    background-color: #e7e7e7;
    color: #000000; /* Color naranja distintivo */
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
}


.detail-button:hover {
    background-color: #FF9933;
    transition: 0.5s;
}

.detail-icon {
    padding-left: 5px;
}

/* Estilos para el badge de estado */
.status-badge {
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 1rem;
    display: inline-block;
}

.status-pending {
    background-color: #ffc107; /* Amarillo */
    color: #333;
}

.status-approved {
    background-color: #28a745; /* Verde */
}

.status-rejected {
    background-color: #dc3545; /* Rojo */
}

.no-data {
    text-align: center;
    padding: 30px;
    color: #6c757d;
    font-style: italic;
}

/* Estilos para mensajes de estado */
.message {
    padding: 15px;
    margin: 20px auto;
    max-width: 960px;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
}

.loading {
    background-color: #e9ecef;
    color: #495057;
}

.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}
</style>