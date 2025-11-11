<template>
    
    <button @click="irAtras" class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Volver
        </button>
  <div class="profile-container">
    
    <Navbar /> 
    <!-- Estado de Carga -->
    <div v-if="loading" class="loading-message">
        <span class="loader"></span>
    </div>
    
    <!-- Estado de Error -->
    <div v-else-if="error" class="loading-message">
      <h2 class="error-title">Error al cargar</h2>
      <p class="error-text mt-2">{{ error }}</p>
      <p class="error-small-text">Asegúrate de que el servidor Express esté corriendo y la ruta esté configurada correctamente.</p>
    </div>
    
    <!-- Contenido Principal del Perfil -->
    <div v-else-if="pet.id" class="profile-card">
      
      <!-- 1. Capa de color melocotón suave en el fondo de la columna de texto -->
      <div class="peach-background"></div>

      <!-- Contenido de 2 Columnas -->
      <div class="card-content">

        <!-- Columna Izquierda: Imagen y Carrusel -->
        <div class="image-column">
          <div class="image-carousel-container">
            
            <!-- Imagen Actual -->
            <img 
              :src="currentImage" 
              :alt="`Foto de ${pet.nombre}`" 
              class="pet-image"
            >

            <!-- Flecha Izquierda -->
            <div @click="prevImage" class="carousel-arrow arrow-left">
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </div>
            
            <!-- Flecha Derecha -->
            <div @click="nextImage" class="carousel-arrow arrow-right">
              <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Información y Botón -->
        <div class="info-column">
          
          <!-- Chips de Estado y Favorito -->
          <div class="chips-container">
            <div 
                class="status-chip"
                :class="{ 'status-chip-available': pet.status === 'Disponible' }"
            >
              {{ pet.status }}
            </div>

            <!-- ⭐️ Botón de Favoritos (Usando clases CSS simples) ⭐️ -->
            <button 
                @click="toggleFavorite"
                class="favorite-button"
                :class="{
                    'is-favorite': isFavorite,
                    'not-favorite': !isFavorite
                }"
                aria-label="Alternar favorito"
                title="Añadir a favoritos"
            >
                <!-- CAMBIO CLAVE: Aumentamos el tamaño del icono de w-8 h-8 a w-10 h-10 (más grande) -->
                <font-awesome-icon 
                    :icon="[isFavorite ? 'fas' : 'far', 'star']" 
                    class="w-10 h-10" 
                />
            </button>

            
          </div>

          <!-- Nombre de la Mascota -->
          <h2 class="pet-name">{{ pet.nombre }}</h2>
          
          <!-- 3. Sección de Datos -->
          <h3 class="section-title">Datos</h3>
          <ul class="data-list">
            <li><span class="data-label">Especie:</span> {{ pet.especie }}</li>
            <li><span class="data-label">Sexo:</span> {{ pet.sexo }}</li>
            <li><span class="data-label font-semibold">Edad:</span> {{ formattedPetAge }}</li>
            <li><span class="data-label">Raza:</span> {{ pet.raza }}</li>
            <li><span class="data-label">Peso:</span> {{ pet.peso }} kg</li>
            <li><span class="data-label">Tamaño:</span> {{ pet.tamano }}</li>
          </ul>

          <!-- 4. Sección de Personalidad y Temperamento -->
          <h3 class="section-title">Personalidad y Temperamento</h3>
          <div class="traits-container">
            <span v-for="trait in pet.personalidad" :key="trait" class="trait-chip" :class="getTraitColor(trait)">
              {{ trait }}
            </span>
          </div>

          <!-- 5. Sección de Información Adicional -->
          <h3 class="section-title">Información adicional</h3>
          <p class="info-text">
            {{ pet.informacionAdicional }}
          </p>

          
          <!-- 6. Botón de Acción -->
          <button @click="navigateToAdoptionForm" class="adopt-button">
            ADOPTAR
          </button>
          
        </div>
      </div>
    </div>
  </div>
  <Footer/>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router'; 
import Navbar from '../components/Navbar.vue';
import Footer from './Footer.vue';
import { useAuthStore } from "@/stores/authStore";

// NO es necesario importar FontAwesomeIcon aquí si ya está registrado GLOBALMENTE en main.js

// Inicialización de Router para obtener el ID


const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navigateToAdoptionForm = () => {
    // 1. Obtener el ID de la mascota actualmente cargada
    const mascotId = pet.value.id;
     loading.value= false;

    if (!mascotId) {
        console.error("ID de mascota no disponible para iniciar adopción.");
        return;
    }

    // 2. Usamos 'router.push' para navegar a la ruta del formulario.
    // Importante: Verifica que tu ruta en Vue Router esté definida como '/adoptform/:mascotId'
    router.push(`/adoptform/${mascotId}`); 
};

// --- ESTADO REACTIVO PARA EL FAVORITO ---
const isFavorite = ref(false);



// --- ESTADOS Y LÓGICA EXISTENTE ---
const pet = ref({
  id: null,
  nombre: '',
  especie: '',
  sexo: '',
  edad: 0,
  raza: '',
  peso: 0,
  tamano: '',
  personalidad: [],
  informacionAdicional: '',
  imagenes: [],
  status: '',
});
const loading = ref(true);
const error = ref(null);
const currentImageIndex = ref(0);

// ... (Todas tus funciones y computed existentes: formatAge, currentImage, formattedPetAge, nextImage, prevImage, getTraitColor) ...
const formatAge = (totalMonths) => {
    if (typeof totalMonths !== 'number' || totalMonths < 0) {
        return 'Edad no disponible';
    }

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    let ageString = '';

    if (years > 0) {
        ageString += `${years} año${years > 1 ? 's' : ''}`;
    }

    if (months > 0) {
        if (years > 0) {
            ageString += ', ';
        }
        ageString += `${months} mes${months > 1 ? 'es' : ''}`;
    }

    if (ageString === '') {
        return 'Menos de un mes';
    }

    return ageString;
};

const currentImage = computed(() => {
    if (pet.value && pet.value.imagenes && pet.value.imagenes.length > 0) {
        return pet.value.imagenes[currentImageIndex.value];
    }
    return null;
});

const formattedPetAge = computed(() => {
    return pet.value ? formatAge(pet.value.edad) : 'Cargando...';
});

const nextImage = () => {
    if (pet.value && pet.value.imagenes.length > 0) {
        currentImageIndex.value = (currentImageIndex.value + 1) % pet.value.imagenes.length;
    }
};

const prevImage = () => {
    if (pet.value && pet.value.imagenes.length > 0) {
        currentImageIndex.value = (currentImageIndex.value - 1 + pet.value.imagenes.length) % pet.value.imagenes.length;
    }
};

const traitColorMap = {};

const getTraitColor = (trait) => {

  const colorPalette = [
    'bg-purple-chip text-purple-chip', 
    'bg-blue-chip text-blue-chip', 
    'bg-pink-chip text-pink-chip', 
    'bg-gray-chip text-gray-chip',
    'bg-yellow-chip text-yellow-chip', 
    'bg-green-chip text-green-chip', 
    'bg-red-chip text-red-chip',
    
    'bg-cyan-chip text-cyan-chip',      
    'bg-orange-chip text-orange-chip',  
    'bg-lime-chip text-lime-chip',      
    
    'bg-brown-chip text-brown-chip',    
    'bg-indigo-chip text-indigo-chip',  
    'bg-teal-chip text-teal-chip',      
  ];
    if (traitColorMap[trait]) {
        return traitColorMap[trait];
    }
    
    const hash = trait.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const randomIndex = hash % colorPalette.length;
    const assignedColor = colorPalette[randomIndex];
    
    traitColorMap[trait] = assignedColor;
    
    return assignedColor;
};

const handleAdopcion = async (petId) => {
    alert(`Iniciando proceso de adopción para: ${pet.value.nombre}`);

};

// --- NUEVA FUNCIÓN: Verificar el estado de favorito al cargar ---
const checkFavoriteStatus = async (petId) => {
    // Solo verificar si el usuario está autenticado
    const userToken = authStore.token;

    if (!userToken) {
        // Si no hay token, se asume no favorito y se termina la ejecución
        isFavorite.value = false;
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/favorites/status/${petId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            }
        });

        if (response.ok) {
            const data = await response.json();
            // El backend devuelve { isFavorite: true/false }
            isFavorite.value = data.isFavorite;
        } else if (response.status === 401) {
            // El token falló, pero por defecto es no favorito
            isFavorite.value = false;
        } else {
            console.error("Error al obtener estado de favorito:", response.statusText);
        }
    } catch (err) {
        console.error("Error de red al verificar favorito:", err);
    }
}

// --- NUEVA FUNCIÓN: Alternar favorito y llamar a Express ---
const toggleFavorite = async () => {
    const petId = pet.value?.id;
    const userToken = authStore.token;

    if (!petId) return;

    // 1. Bloquear si no está logueado
    if (!userToken) {
        alert("Debes iniciar sesión para gestionar tus favoritos.");
        return;
    }

    // 2. Optimistic UI: Cambiar el estado visual inmediatamente
    const previousStatus = isFavorite.value;
    isFavorite.value = !isFavorite.value; 

    const url = `http://localhost:3000/api/favorites/${petId}`;

    try {
        // 3. ⭐️ ENVIAR SIEMPRE POST para alternar el estado en el backend ⭐️
        const response = await fetch(url, {
            method: 'POST', // Siempre POST
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            }
        });

        if (response.ok || response.status === 201) {
            const data = await response.json();
            // 4. Confirmación: El backend nos devuelve el nuevo estado (data.newStatus)
            isFavorite.value = data.newStatus;
            console.log(data.message);
        } else {
            // 5. Rollback: Si falla la llamada, revertir el estado visual
            isFavorite.value = previousStatus;
            alert(`Error ${response.status}: No se pudo actualizar el estado de favorito.`);
        }

    } catch (error) {
        // 5. Rollback en caso de error de red
        isFavorite.value = previousStatus;
        console.error("Error de red al alternar favorito:", error);
    }
};


// --- Función para Cargar Datos (Modificada para Favoritos) ---
const fetchPetData = async () => {
  const petId = route.params.id;
  if (!petId) {
    error.value = 'No se proporcionó un ID de mascota.';
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/mascotas/card/${petId}`);
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.mensaje || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    pet.value = {
      id: data.idxxxx_mascot,
      nombre: data.nombre_mascot,
      especie: data.especi_mascot,
      sexo: data.sexoxx_mascot,
      edad: parseInt(data.edadme_mascot),
      raza: data.razaxx_mascot,
      peso: data.pesokg_mascot,
      tamano: data.tamano_mascot,
      personalidad: data.personalidad_array, 
      informacionAdicional: data.infoad_mascot,
      imagenes: [data.image1_mascot, data.image2_mascot, data.image3_mascot].filter(img => img),
      status: data.status_mascot,
    };
    
    // ⚠️ Llama a la función para verificar el estado de favorito DESPUÉS de obtener el ID de la mascota
    await checkFavoriteStatus(pet.value.id); 

  } catch (err) {
    console.error('Fetch error:', err);
    error.value = `No se pudo obtener el perfil: ${err.message}`;
  } finally {
        const minimumLoadingTime = 500; // Define el tiempo mínimo en milisegundos (ej: 500ms o 1000ms)
    
        setTimeout(() => {
            loading.value = false; // El spinner se oculta después de este tiempo
        }, minimumLoadingTime);
  }
};
function irAtras() {
    window.history.back();
}

// --- Ciclo de Vida ---
onMounted(() => {
  fetchPetData();
});
</script>

<style scoped>
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: #ff6060 transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 

.back-button {
    width: 110px;
    height: 40px;
    align-items: center;
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
    position: relative;
    transition: all 0.3s ease;
    gap: 0.5rem;
    margin-left: 30px;
    margin-top: 110px;
    z-index: 3;
}



.back-button:hover {
  background: #e9ecef;
  color: #495057;
}

/* ======================================= */
/* === Estructura Principal y Contenedores === */
/* ======================================= */

.profile-container {
    min-height: 100vh;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
}

@media (min-width: 768px) {
    .profile-container {
        padding: 2rem;
    }
}

@media (min-width: 1024px) {
    .profile-container {
        padding: 3rem;
    }
}

.profile-card {
    background-color: white;
    border-radius: 1rem; /* rounded-2xl */
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); /* shadow-2xl */
    max-width: 64rem; /* max-w-4xl */
    width: 100%;
    position: relative;
    overflow: hidden;
    border: 1px solid #d8d8d8;
}

.peach-background {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 50%;
    background-color: rgb(255, 255, 255);
    display: none;
}

@media (min-width: 768px) {
    .peach-background {
        display: block;
        
    }
    .card-content {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

/* ======================================= */
/* === Columnas y Contenido de Texto === */
/* ======================================= */

.image-column, .info-column {
    padding: 1rem;
    position: relative;
    z-index: 10;
}

.image-column {
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: linear-gradient(#ffe6e6c1 100%);
}

.info-column {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

@media (min-width: 768px) {
    .image-column, .info-column {
        padding: 2rem;
    }
}

/* === Títulos y Texto === */

.pet-name {
    font-size: 2.25rem; /* text-4xl */
    font-weight: 800; /* font-extrabold */
    color: var(--gray-900);
    margin-bottom: 0.5rem; /* mb-6 */
    margin-top: 1rem; /* mt-4 */
    color: #000000;
}

@media (min-width: 768px) {
    .pet-name {
        margin-top: 0; /* md:mt-0 */
    }
}

.section-title {
    font-size: 1.55rem; /* text-xl */
    font-weight: 700; /* font-bold */
    color: var(--gray-800);
    margin-bottom: 0.5rem; /* mb-2 */
    border-bottom: 2px solid rgba(var(--primary-orange), 0.5);
    display: inline-block;
    color: #000000;
}

.data-list {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem; /* mb-6 */
    font-size: 1.125rem; /* text-lg */
    color: var(--gray-700);
    line-height: 1.5;
    color: #675e5e;
}

.data-label {
    font-weight: 800; /* font-semibold */
    color: #000000;
    
}

.info-text {
  color: #675e5e;
    margin-bottom: 2rem; /* mb-8 */
    line-height: 1.625; /* leading-relaxed */
    text-align: justify;
}

/* ======================================= */
/* === Carrusel de Imágenes === */
/* ======================================= */

.image-carousel-container {
    position: relative;
    overflow: hidden;
    border-radius: 0.75rem; /* rounded-xl */
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    width: 100%; 
    height: 30rem; /* Altura fija para la consistencia en móvil */
}

@media (min-width: 768px) {
    .image-carousel-container {
        height: 100%;
        min-height: 30rem;
    }
}

.pet-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 0.75rem;
    transition: all 0.3s ease;
}

.carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    z-index: 20;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.carousel-arrow:hover {
    background-color: rgba(255, 255, 255, 0.9);
}

.arrow-left {
    left: 0.75rem;
}

.arrow-right {
    right: 0.75rem;
}


/* ======================================= */
/* === Chips y Botón === */
/* ======================================= */

.chips-container {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* gap-3 */
    position: absolute;
    top: 1rem; /* top-4 */
    right: 1rem; /* right-4 */
}

@media (min-width: 768px) {
    .chips-container {
        margin-bottom: 0.5rem; /* md:mb-2 */
        justify-content: flex-start; /* md:justify-start */
        gap: 1rem; /* md:gap-4 */
    }
}

.status-chip {
    display: inline-flex;
    padding: 0.25rem 0.75rem; /* p-1 px-3 */
    border-radius: 9999px;    /* rounded-full */
    font-size: 0.875rem;      /* text-sm */
    font-weight: 600;         /* font-semibold */
    text-transform: uppercase;
    
    /* Estilo por defecto (si no está disponible, ejemplo: gris o amarillo) */
    background-color: #ff959558; 
    color: #ff6060;
}



/* ------------------------------------------------ */
/* ESTILO CONDICIONAL PARA 'DISPONIBLE' (VERDE)     */
/* ------------------------------------------------ */
.status-chip-available {
    background-color: #d1fae5; /* green-100 (verde suave) */
    color: #059669;           /* green-700 (texto verde oscuro) */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.star-chip {
    background-color: #FFD700;
    color: white;
    padding: 0.3rem 0.5rem;
    border-radius: 9999px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    transform: rotate(10deg);
    cursor: pointer;
    transition: transform 0.2s ease;
}

.star-chip:hover {
    transform: rotate(10deg) scale(1.1);
}

/* Chips de Personalidad */
.traits-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.trait-chip {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
}

/* Clases de colores dinámicos para personalidad */
.bg-blue-chip {
  background-color: rgb(199, 196, 255); 
  }
.text-blue-chip{
  color: #0800a6
  }

.bg-pink-chip {
  background-color: rgb(255, 231, 242); 
  }
.text-pink-chip{
  color: #dd00b0
  }

.bg-purple-chip {
  background-color: rgb(254, 231, 255); 
  }
.text-purple-chip{
  color: #ce00c7
  }

.bg-gray-chip {
  background-color: rgb(235, 235, 235); 
  }
.text-gray-chip{
  color: #7e7e7e
  }


.bg-yellow-chip { 
  background-color: #fffaca; 
}

.text-yellow-chip {
  color: #ca8a04;
}
.bg-green-chip { 
  background-color: #d1fae5; 
}
.text-green-chip { 
  color: #059669;
}

.bg-red-chip { 
  background-color: #ffbdbd;
}
.text-red-chip { 
  color: rgb(155, 0, 0);
}


.bg-cyan-chip {
    background-color: #8ff2ff; /* Turquesa brillante */
    color: #212529; /* Texto oscuro para contraste */
}
.text-cyan-chip {
    color: #006e7c;
}

.bg-orange-chip {
    background-color: #ffd597; /* Naranja estándar */
    color: #212529; 
}
.text-orange-chip {
    color: #FF9800;
}

.bg-lime-chip {
    background-color: #e8f28f; /* Verde Lima */
    color: #212529; 
}
.text-lime-chip {
    color: #CDDC39;
}

.bg-brown-chip {
    background-color: #b19d95; /* Marrón */
    color: #FFFFFF; /* Texto blanco para contraste */
}
.text-brown-chip {
    color: #4a352d;
}

.bg-indigo-chip {
    background-color: hsl(231, 100%, 84%); /* Índigo */
    color: #FFFFFF;
}
.text-indigo-chip {
    color: #3F51B5;
}

.bg-teal-chip {
    background-color: #bdfff8; /* Teal */
    color: #FFFFFF;
}
.text-teal-chip {
    color: #009688;
}


/* Botón de Adopción */
.adopt-button {
    width: 100%;
    padding: 0.75rem 2rem;
    background-color: #ff9595; 
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    border-radius: 25px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s ease;
    margin-top: auto; /* Empuja el botón hacia abajo */
    align-self: center;
    border: none;
    cursor: pointer;
}

.adopt-button:hover {
    background-color: #ff6060;
}

@media (min-width: 768px) {
    .adopt-button {
        width: auto; /* md:w-auto */
    }
}

/* ======================================= */
/* === Estados de Carga y Error === */
/* ======================================= */

.loading-message {
    position: fixed; 
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    /* Centrado del contenido (spinner y texto) */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Centrado vertical */
    align-items: center;    /* Centrado horizontal */
    
    z-index: 9999; 
    color: #333;
    font-size: 1.2em;
}

.loading-text {
    font-size: 1.25rem;
    color: var(--gray-600);
}

.spinner {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border-bottom: 2px solid var(--primary-orange);
    border-top: 2px solid transparent;
    animation: spin 1s linear infinite;
    margin: 1rem auto 0;
}

.error-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #dc2626; /* text-red-600 */
}

.error-text {
    font-size: 1.125rem;
    color: var(--gray-700);
    margin-top: 0.5rem;
}

.error-small-text {
    font-size: 0.875rem;
    color: var(--gray-600);
}



@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}



/* Estilos base del botón */
.favorite-button {
    /* CAMBIO CLAVE: Aumentamos el tamaño de la fuente para asegurar que el icono crezca */
    font-size: 2.0rem; /* Esto hace que el icono sea significativamente más grande */
    
    padding: 0.25rem; 
    border-radius: 0; 
    
    background-color: transparent !important; 
    box-shadow: none !important; 
    
    transition: all 0.3s ease-in-out; 
    transform: scale(1);
    outline: none; 
    cursor: pointer; 
    border: none;
}

/* Estado de enfoque (focus-ring) - Mantenemos un anillo sutil alrededor de la estrella */
.favorite-button:focus {
    /* El box-shadow ahora actúa como un halo de enfoque alrededor del icono */
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0), 0 0 0 2px rgba(100, 116, 139, 0.4);
}

/* ------------------------------------ */
/* ESTADO: NO FAVORITO (Sutil Gris/Rojo) */
/* ------------------------------------ */
.not-favorite {
    /* **CAMBIO 2: Solo color del icono** */
    color: #6b7280; /* text-gray-500 */
}

.not-favorite:hover {
    /* **CAMBIO 3: Efecto de hover solo en el color** */
    color: #efb644; /* hover:text-red-500 */
    transform: scale(1.15); /* Efecto de escala más pronunciado */
}
.not-favorite:focus {
    /* Mantenemos el ring, pero es más sutil */
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5); 
}


/* ------------------------------------ */
/* ESTADO: FAVORITO (Dorado/Medalla) */
/* ------------------------------------ */
.is-favorite {
    /* **CAMBIO 4: Color dorado para el icono** */
    color: #f59e0b; /* bg-yellow-500 */
    /* La sombra se simula con text-shadow para dar un ligero relieve al icono */
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.2); 
}

.is-favorite:hover {
    color: #fbbf24; /* hover:bg-yellow-400 */
    transform: scale(1.15); 
}
.is-favorite:focus {
    /* Ring de enfoque para el estado favorito (amarillo) */
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.5); 
}

</style>
