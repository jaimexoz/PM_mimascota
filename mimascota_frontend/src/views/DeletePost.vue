<template>
    <div class="adoption-feed-container">
        
        <Navbar /> 
        <button @click="irAtras" class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Volver
                </button>
        <div class="content-wrapper">
            
            <h1 class="main-title">
                <PawPrint class="paw-icon-main" />
                Elimina la publicación de tu mascota
                <PawPrint class="paw-icon-main" />
            </h1>
            
            <div class="filter-bar"> 
                <div class="search-input-container">
                    <input type="text" v-model="filters.busqueda"
                        placeholder="Buscar por nombre..."
                        class="search-input">
                    <Search class="search-icon" />
                </div>
                <button @click="clearFilters" class="clear-filters-button">
                    Limpiar
                </button>
            </div>
        </div>
        
        <div class="content-wrapper feed-content">
            
            <div v-if="isLoading" class="loading-state">
                <Loader class="loading-icon animate-spin" />
                <p class="loading-text">Cargando publicaciones...</p>
            </div>

            <div v-else-if="applyFilters.length > 0" class="pet-card-grid">
                <PetCard 
                    v-for="mascota in applyFilters" 
                    :key="mascota.idxxxx_mascot" 
                    :mascota="mascota"
                />
            </div>

            <div v-else class="no-results-state">
                <h2 class="no-results-title">¡Vaya! No tienes publicaciones activas.</h2>
                <p class="no-results-text">Crea una nueva publicación para que aparezca aquí.</p>
            </div>
        </div>
        <Footer />
    </div>

    <DeletePostModal
    :isOpen="isDeleteModalOpen"
    :isDeleting="isDeletingPost"  
    @close="closeDeleteModal"
    @confirm-delete="executeDeletePost" 
    />
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from '@/components/Footer.vue';
import DeletePostModal from '@/components/DeletePostModal.vue';
import { ref, onMounted, computed, reactive, h } from 'vue';
import { PawPrint, Search, Loader } from 'lucide-vue-next';
import { useRouter } from 'vue-router'; 
import { useAuthStore } from "@/stores/authStore";
// 🔥 IMPORTACIÓN NECESARIA: Tu cliente Axios configurado
import apiClient from '@/http'; 

const authStore = useAuthStore();
const router = useRouter(); 
const mascotas = ref([]);
const isLoading = ref(true);

// ==========================================================
// 🔥 ESTADO Y FUNCIONES DE LA MODAL DE ELIMINACIÓN
// ==========================================================
const isDeleteModalOpen = ref(false); // Cambiado a 'isDeleteModalOpen' para claridad
const postIdToDelete = ref(null); 
const isDeletingPost = ref(false); // 🔥 Nuevo estado para el botón "Aceptar"

/**
 * Abre la modal de confirmación con el ID de la publicación.
 */
function openDeleteModal(mascotaId) {
    postIdToDelete.value = mascotaId;
    isDeleteModalOpen.value = true;
}

/**
 * Cierra la modal y limpia el ID.
 */
function closeDeleteModal() {
    isDeleteModalOpen.value = false;
    postIdToDelete.value = null;
    isDeletingPost.value = false; // Asegurar que el estado de carga se reinicie
}

/**
 * 🔥 Lógica para ejecutar la eliminación de la publicación.
 * Se llama cuando la modal emite 'confirm-delete'.
 */
const executeDeletePost = async () => {
    if (!postIdToDelete.value || isDeletingPost.value) return;

    isDeletingPost.value = true; // 🚨 Activa el spinner en el botón
    const token = authStore.token;
    
    if (!token) {
        alert("Sesión expirada. Por favor, vuelve a iniciar sesión.");
        closeDeleteModal();
        return;
    }

    try {
        // Ejecutar la petición de eliminación usando Axios
        await apiClient.delete(`/mascotas/eliminar/${postIdToDelete.value}`);

        // 6. Manejo de éxito
        alert("¡Publicación eliminada con éxito!");
        
        // Cierra la modal
        closeDeleteModal(); 

        // 🔥 CRUCIAL: Vuelve a cargar la lista para reflejar el cambio
        getMascotas(); 

    } catch (error) {
        // 7. Manejo de errores de Axios
        console.error("Error al eliminar la publicación:", error);
        let message = "Ocurrió un error al eliminar la publicación.";

        if (error.response && error.response.status === 401) {
            message = "No estás autorizado para eliminar esta publicación (401).";
        } else if (error.response && error.response.data && error.response.data.mensaje) {
             message = error.response.data.mensaje;
        }

        alert(message);
        closeDeleteModal();
    }
};

// ==========================================================
// RESTO DEL SCRIPT (Filtrado, Fetch inicial, etc.)
// ==========================================================

// Estado de los filtros y búsqueda (sin cambios)
const filters = reactive({
    edad: '', sexo: '', tamano: '', orden: 'mas_recientes', busqueda: ''
});

// Lógica de fetch a la BD (MypostUser)
async function getMascotas() {
    isLoading.value = true;
    const userToken = authStore.token;
    
    // ... (El resto de tu lógica de fetch, sin cambios) ...
    if (!userToken) {
        console.error("Usuario no autenticado.");
        isLoading.value = false;
        return;
    }

    try {
        // 🔥 Reemplazar fetch con apiClient (Axios) para consistencia
        const response = await apiClient.get('/mascotas/MypostUser'); 

        mascotas.value = response.data; // Axios devuelve data en response.data
        
    } catch (error) {
        console.error("Error al obtener las mascotas:", error);
        mascotas.value = [];
    } finally {
        isLoading.value = false;
    }
}

// Lógica de Filtrado (sin cambios)
const applyFilters = computed(() => {
    let results = [...mascotas.value];
    if (filters.busqueda) {
        const busquedaLower = filters.busqueda.toLowerCase();
        results = results.filter(m => 
            (m.nombre_mascot && m.nombre_mascot.toLowerCase().includes(busquedaLower)) ||
            (m.razaxx_mascot && m.razaxx_mascot.toLowerCase().includes(busquedaLower))
        );
    }
    return results;
});
 
function clearFilters() {
    Object.assign(filters, { edad: '', sexo: '', tamano: '', orden: 'mas_recientes', busqueda: '' });
}

function irAtras() {
    router.back(); // Usar router.back() es preferible a window.history.back()
}

// Función para formatear edad (sin cambios)
function formatAge(months) {
    if (months < 12) {
        return `${months} meses`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return `${years} años`;
    }
    return `${years} a ${remainingMonths} m`;
}
 
// ==========================================================
// COMPONENTE FUNCIONAL PETCARD (CREACIÓN DE LA CARTA)
// ==========================================================
const PetCard = ({ mascota }) => {
    const ageDisplay = formatAge(mascota.edadme_mascot);
    const imageUrl = mascota.image1_mascot || `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`;
 
    // Función para abrir la modal de edición
    const openDelete = () => {
        openDeleteModal(mascota.idxxxx_mascot); // Llama a la función del padre
    };
    
    return h('div', { class: 'pet-card' }, [
        // Imagen
        h('div', { class: 'pet-card-image-container' }, [
            h('img', { 
                src: imageUrl, 
                alt: `Foto de ${mascota.nombre_mascot}`, 
                class: 'pet-card-image',
                onerror: (e) => e.target.src = `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`
            })
        ]),
        
        // Contenido
        h('div', { class: 'pet-card-content' }, [
            h('h3', { class: 'pet-card-name' }, mascota.nombre_mascot),
            
            // Detalles (Chips)
            h('div', { class: 'pet-card-chips' }, [
                h('span', { class: 'chip chip-grey' }, mascota.sexoxx_mascot),
                h('span', { class: 'chip chip-grey' }, ageDisplay),
                h('span', { class: 'chip chip-grey' }, mascota.razaxx_mascot || 'Mestizo'),
            ])
            
        ]),
            
        h('div', { class: 'pet-card-content-button' }, [
            // Botón Eliminar
            h('button', { 
              class: 'pet-card-button',
              onClick: openDelete 
            }, 'Eliminar')
        ])

    ]);
};


onMounted(() => {
    getMascotas();
});
</script>

<style scoped>

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
    margin-top: 94px;
    position: absolute;
}

.back-button:hover {
  background: #e9ecef;
  color: #495057;
}
/*
Mantenemos los estilos del layout, y agregamos los estilos con :deep() para que 
funcionen con el componente funcional PetCard creado con h().
*/
/* ==============================================
  ESTILOS DE LAYOUT Y ENCABEZADO
  ============================================== */

.adoption-feed-container { 
    min-height: 100vh; 
    background-color: #ffffff; 
    padding-top: 1rem; }

.content-wrapper { 
    max-width: 80rem; 
    margin-left: auto; 
    margin-right: auto; 
    margin-top: 100px; 
    padding-left: 1rem; 
    padding-right: 1rem; }

.feed-content { padding-bottom: 3rem; }

.main-title { 
    font-size: 2.25rem; 
    font-weight: 800; 
    color: #111827; 
    text-align: center; 
    margin-bottom: 2rem; }

.paw-icon-main { 
    width: 2rem; 
    height: 2rem; 
    display: inline-block; 
    color: #ff9595; 
    margin-right: 0.5rem; 
    margin-left: 0.5rem; 
    margin-top: -0.25rem; }

/* ==============================================
  ESTILOS DE BARRA DE FILTROS
  ============================================== */
.filter-bar { 
    background-color: #ffffff; 
    padding: 1rem; 
    border-radius: 1rem; 
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); 
    display: flex; 
    flex-wrap: wrap; 
    align-items: center; 
    justify-content: center; 
    gap: 1rem; 
    border-bottom: 1px solid #e0e7ff; 
    margin-bottom: 2rem; }

.search-input-container { 
    position: relative; 
    flex-grow: 1; 
    max-width: 18rem; 
    width: 100%; }

.search-input { 
    width: 100%; 
    padding: 0.5rem 1rem 0.5rem 2.5rem; 
    border-radius: 9999px; 
    border: 2px solid #d1d5db; 
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); 
    transition: all 200ms ease; }

.search-input:focus { 
    border-color: #ff9595; 
    box-shadow: 0 0 0 1px #ff9595; 
    outline: none; }

.search-icon { 
    position: absolute; 
    left: 0.75rem; 
    top: 50%; 
    transform: translateY(-50%); 
    width: 1.25rem; 
    height: 1.25rem; 
    color: #9ca3af; }

.clear-filters-button { 
    padding: 0.5rem 1rem; 
    border-radius: 9999px; 
    font-size: 0.875rem; 
    font-weight: 600; 
    color: #374151; 
    border: 1px solid #d1d5db; 
    transition: all 200ms ease; 
    cursor: pointer; 
    background-color: transparent; }

.clear-filters-button:hover { background-color: #f3f4f6; }

/* ==============================================
  ESTILOS DEL FEED Y ESTADOS
  ============================================== */
.loading-state { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    height: 16rem; }

.loading-icon { 
    width: 2.5rem; 
    height: 2.5rem; 
    color: #6366f1; }

.loading-text { 
    margin-left: 0.75rem; 
    font-size: 1.25rem; 
    color: #4b5563; }

.pet-card-grid { 
    display: grid; 
    grid-template-columns: repeat(1, minmax(0, 1fr)); 
    gap: 2rem; }

@media (min-width: 640px) { .pet-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 768px) { .pet-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .pet-card-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

.no-results-state { 
    text-align: center; 
    padding: 5rem 1.5rem; 
    background-color: #ffffff; 
    border-radius: 0.75rem; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    margin-top: 2rem; }

.no-results-title { 
    font-size: 1.5rem; 
    font-weight: 600; 
    color: #374151; }

.no-results-text { 
    color: #6b7280; 
    margin-top: 0.5rem; }

/* ==============================================
  ESTILOS DE LA TARJETA (PetCard - Usando :deep)
  ============================================== */
:deep(.pet-card) { 
    background-color: #ffffff; 
    border-radius: 0.75rem; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #f3f4f6; transition: all 300ms ease; display: flex; flex-direction: column; }

:deep(.pet-card:hover) { 
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }

:deep(.pet-card-image-container) { 
    height: 15rem; 
    width: 100%; 
    overflow: hidden; 
    display: flex; 
    justify-content: center; 
    align-items: center; }

:deep(.pet-card-image) { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    object-position: center; 
    transition: transform 500ms ease; }

:deep(.pet-card-image:hover) { transform: scale(1.05); }

:deep(.pet-card-content) { 
    padding-right: 1rem; 
    padding-left: 1rem; 
    padding-top: 1rem; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center; }

:deep(.pet-card-name) { 
    font-size: 1.5rem; 
    font-weight: 800; 
    color: #1f2937; 
    margin-bottom: 0.25rem; 
}

:deep(.pet-card-chips) { 
    display: flex; 
    align-items: center; 
    font-size: 0.875rem; 
    color: #4b5563; 
    margin-bottom: 0.75rem; 
    flex-wrap: wrap; 
    column-gap: 0.5rem; 
    row-gap: 0.5rem; }

:deep(.chip) { 
    padding: 0.125rem 0.5rem;
    border-radius: 9999px; 
    font-weight: 600; }

:deep(.chip-grey) { 
    background-color: #c8c7c7; 
    color: #ffffff; }

:deep(.pet-card-content-button) { 
    padding-right: 1rem; 
    padding-left: 1rem; 
    padding-bottom: 1rem; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center; 
    margin-top: auto; }

:deep(.pet-card-button) { 
    width: 50%; 
    margin-top: 0.5rem; 
    border: none; 
    padding: 0.5rem 1rem; 
    border-radius: 25px; 
    font-size: 1.125rem; 
    font-weight: 700; 
    color: #ffffff; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    cursor: pointer; 
    background-color: #ff9595; 
    transition: background-color 300ms ease; }

:deep(.pet-card-button:hover) { background-color: #ff6060; }


</style>