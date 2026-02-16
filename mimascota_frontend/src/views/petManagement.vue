<template>
    <div class="gestion-posts-page">
        <Navbar />
        <button @click="irAtras" class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Volver
        </button>
        <div class="content-wrapper">
            <div class="header-section">
                
                <h1 class="main-title">
                    <PawPrint class="paw-icon-main" />
                    Gestión de Posts de Mascotas
                    <PawPrint class="paw-icon-main" />
                </h1>
            </div>

            <div v-if="loading" class="loading-state">
                <Loader class="loading-icon animate-spin" />
                <p>Cargando posts de mascotas...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <p class="text-red-600 font-semibold">{{ error }}</p>
            </div>

            

            <div v-else-if="posts.length === 0" class="empty-state">
            <h2 class="no-results-title">¡Vaya! No se han encontrado publicaciones pendientes por el momento.</h2>
            <p class="no-results-text">Vuelve ha ingresar más tarde.</p>
            
        </div>

            <div v-else class="table-container">
                <table class="solicitudes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mascota</th>
                            <th>Especie</th>
                            <th>Dueño</th>
                            <th>Fecha Publicación</th>
                            <th>Ficha Completa</th>
                            <th>Estado Aprobación</th> 
                            </tr>
                    </thead>
                    <tbody>
                        <tr v-for="post in posts" :key="post.idxxxx_mascot">
                            <td>{{ post.idxxxx_mascot }}</td>
                            <td>{{ post.nombre_mascot }}</td>
                            <td>{{ post.especi_mascot }}</td>
                            <td>{{ post.nombre_dueno }}</td>
                            <td>{{ formatDate(post.fechap_mascot || new Date()) }}</td> 
                            <td>
                                <button @click="verFichaInformacion(post.idxxxx_mascot)" class="detail-button">
                                    Ver Detalles 
                                    <span class="detail-icon">➤</span>
                                </button>
                            </td>
                            <td>
                                <select 
                                    :value="post.approv_mascot"  
                                    @change="event => updateApprovalStatus(post.idxxxx_mascot, event.target.value)" 
                                    :class="['status-select', getApprovalClass(post.approv_mascot)]"
                                >
                                    <option class="classPendiente" value="Pendiente">Pendiente</option>
                                    <option class="classAprobada" value="Aprobada">Aprobar</option>
                                    <option class="classRechazada" value="Rechazada">Rechazar</option>
                                </select>
                            </td>
                            </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
    </div>
    <Footer/>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; 
import Navbar from '@/components/Navbar.vue'; 
import Footer from '@/components/Footer.vue';
import { useAuthStore } from "@/stores/authStore";
import { apiUrl } from '@/config/api';
import { PawPrint, Loader } from 'lucide-vue-next';


const router = useRouter();
const authStore = useAuthStore();

// --- ESTADOS REACTIVOS (Cambiado de 'solicitudes' a 'posts') ---
const posts = ref([]);
const loading = ref(true);
const error = ref(null);

// --- FUNCIONES DE NAVEGACIÓN (Se mantiene igual) ---
const verFichaInformacion = (mascotId) => {
    router.push(`/card/${mascotId}`); 
};

// Se elimina verFormularioAdopcion porque ya no aplica a una lista de posts.

/**
 * Función para cargar TODOS los posts de mascotas.
 */
const fetchAllMascotaPosts = async () => {
    loading.value = true;
    error.value = null;
    let userToken = authStore.token; // Intenta obtener el token de la tienda

    // ⭐️ VERIFICACIÓN ROBUSTA DEL TOKEN ⭐️
    if (!userToken) {
        // Si no está en la tienda (aún no cargado), búscalo en localStorage
        const storedToken = localStorage.getItem('authToken'); // Usa la clave correcta del token
        
        if (storedToken) {
            userToken = storedToken; // Usa el token almacenado para el fetch
        } else {
            // Si no hay token en la tienda ni en localStorage, forzamos la redirección
            // Asumiendo que esta página es solo para Admin/Empleado
            error.value = "Permiso denegado. Debes ser administrador o empleado.";
            loading.value = false;
            router.push({ name: 'auth' }); 
            return;
        }
    }

    try {
        // ⭐️ Importante: Este endpoint debe obtener TODOS los posts de mascotas ⭐️
        // y debe estar protegido en el backend para solo permitir Admin/Empleado.
        const response = await fetch(apiUrl('/mascotas/AllPost'), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            }
        });

        if (response.status === 401) {
            // ERROR ESPECÍFICO DE TOKEN: CERRAR SESIÓN Y REDIRIGIR
            // Esto solo debe ocurrir si el token es inválido o expirado.
            console.error('ERROR 401: Token expirado o inválido. Cerrando sesión.');
            authStore.logout();
            router.push({ name: 'auth' }); // Redirigir al login por nombre
            return;
        }

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        // Cambiamos 'solicitudes.value' a 'posts.value'
        posts.value = data; 

    } catch (err) {
        console.error('Fetch error:', err);
        error.value = `No se pudo obtener la lista de publicaciones: ${err.message}`;
    } finally {
        loading.value = false;
    }
};

const updateApprovalStatus = async (mascotId, newStatus) => {
    // ⭐️ VERIFICACIÓN ROBUSTA DEL TOKEN ⭐️
    let userToken = authStore.token; // Intenta obtener el token de la tienda

    if (!userToken) {
        // Si no está en la tienda (aún no cargado), búscalo en localStorage
        const storedToken = localStorage.getItem('authToken');
        
        if (storedToken) {
            userToken = storedToken; // Usa el token almacenado para el fetch
        } else {
            console.error("No hay token para actualizar estado de aprobación.");
            router.push({ name: 'auth' });
            return;
        }
    }

    // Encuentra la mascota localmente y guarda su estado anterior
    const postIndex = posts.value.findIndex(p => p.idxxxx_mascot === mascotId);
    if (postIndex === -1) {
        console.warn(`Post de mascota con ID ${mascotId} no encontrado localmente.`);
        return;
    }
    const oldStatus = posts.value[postIndex].approv_mascot;

    // 🚀 OPTIMISTA: Actualiza la interfaz inmediatamente
    posts.value[postIndex].approv_mascot = newStatus;

    try {
        // ⭐️ Endpoint: Usaremos un PUT para actualizar el recurso completo.
        // Necesitas crear este endpoint en Express (PUT /api/mascotas/approval/:mascotId)
        const response = await fetch(apiUrl(`/mascotas/approval/${mascotId}`), {
            method: 'PUT', // Usamos PUT como se sugirió en el ejemplo anterior.
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
            // Enviamos el nuevo estado de aprobación
            body: JSON.stringify({ approv_mascot: newStatus }),
        });

        if (response.status === 401) {
            // ERROR ESPECÍFICO DE TOKEN: CERRAR SESIÓN Y REDIRIGIR
            console.error('ERROR 401: Token expirado o inválido. Cerrando sesión.');
            authStore.logout();
            router.push({ name: 'auth' }); 
            return;
        }

        if (!response.ok) {
            // Si el backend falla, revierte el estado local y lanza un error
            posts.value[postIndex].approv_mascot = oldStatus; 
            const errData = await response.json();
            throw new Error(errData.message || `Error HTTP: ${response.status}`);
        }

        console.log(`Estado de aprobación de mascota ${mascotId} actualizado a ${newStatus} con éxito.`);

    } catch (err) {
        console.error('Error al actualizar estado de aprobación:', err);
        // Si falló, el estado ya fue revertido en el bloque 'if (!response.ok)'
        alert(`Fallo al cambiar estado: ${err.message}. El estado ha sido revertido.`);
        error.value = `Fallo al cambiar estado: ${err.message}`;
    }
};

const getApprovalClass = (status) => {
    switch (status) {
        case 'Pendiente':
            return 'status-pendiente'; // Gris/Amarillo
        case 'Aprobada':
            return 'status-aceptado'; // Verde
        case 'Rechazada':
            return 'status-rechazado'; // Rojo
        default:
            return 'status-default'; // ⬅️ Asegúrate de tener un caso por defecto
    }
};


/**
 * Función para formatear la fecha a DD/MM/YYYY (Se mantiene igual)
 */
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Intl.DateTimeFormat('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }).format(new Date(dateString));
    } catch {
        return dateString.substring(0, 10);
    }
}

const irAtras = () => {
    window.history.back();
};


// --- CICLO DE VIDA ---
onMounted(() => {
    fetchAllMascotaPosts(); // ⭐️ Llamada a la nueva función de carga ⭐️
});
</script>

<style scoped>
/* Estilos para el contenedor principal */
.gestion-posts-page{
    min-height: 80.1vh;
   
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
    color: #ff9595; 
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    margin-top: -0.25rem;
}

.back-button {
    width: 110px;
    height: 40px;
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
    font-weight: 500;
    text-align: center;
    font-size: 1rem;
}

th {
    background-color: #ff6060; /* Fondo oscuro para el encabezado */
    color: #fff;
    font-weight: bold;
    text-transform: uppercase;
}

tr {
    color: #555555;
}

.status-pendiente{
    font-size: 1rem;
    background-color: #adadad;
    color: #ffffff;
    font-weight: 700;
    padding-left: 20px;
    padding-right: 18px;
    border: none;
    border-radius: 25px;
    appearance: base-select;
}

.status-aceptado{
    font-size: 1rem;
    background-color: #77c926;
    color: #ffffff;
    font-weight: 700;
    padding-left: 30px;
    padding-right: 18px;
    border: none;
    border-radius: 25px;
    appearance: base-select;
}

.status-rechazado{
    font-size: 1rem;
    background-color: #ff3e51;
    color: #ffffff;
    font-weight: 700;
    padding-left: 22px;
    padding-right: 18px;
    border: none;
    border-radius: 25px;
    appearance: base-select;
}

.classPendiente, .classRechazada,  .classAprobada{
    font-size: 1rem;
    background-color: #ffffff;
    color: #6b6b6b;
    font-weight: 500;
    padding-left: 20px;
    padding-right: 18px;
    border: none;
    border-radius: 25px;
    appearance: base-select;
}

/* Estilos para los botones de "Ver detalles" */
.detail-button {
    padding: 5px;
    padding-left: 10px;
    padding-right: 10px;
    border: none;
    border-radius: 25px;
    background-color: #b9b9b9;
    color: #ffffff; 
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
}


.detail-button:hover {
    background-color: #ff9595; 
    transition: 0.5s;
}

.detail-icon {
    padding-left: 5px;
}

  .empty-state{
    text-align: center;
    padding: 5rem 1.5rem;
    background-color: #ffffff; /* bg-white */
    border-radius: 0.75rem; /* rounded-xl */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* shadow-md */
    margin-top: 2rem;
  }
  
  .no-results-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151; /* gray-700 */
  }
  .no-results-text {
    color: #6b7280; /* gray-500 */
    margin-top: 0.5rem;
  }

/* Estilos para el badge de estado */
.status-badge {
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 1rem;
    display: inline-block;
}


.no-data {
    text-align: center;
    padding: 30px;
    color: #6c757d;
    font-style: italic;
}

.no-posts{
    text-align: center;
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