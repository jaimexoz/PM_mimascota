<template>
  <div class="profile-container">
    <Navbar /> 
    <!-- Estado de Carga -->
    <div v-if="loading" class="loading-message">
      <p class="loading-text">Cargando perfil de la mascota...</p>
      <!-- Icono de spinner simple -->
      <div class="spinner"></div>
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
            <div class="star-chip favorite-chip">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.636-.921 1.936 0l1.246 3.827h4.026c.969 0 1.371 1.244.588 1.81l-3.25 2.36 1.246 3.827c.3.921-.755 1.688-1.54 1.115L10 14.54l-3.25 2.36c-.784.573-1.84-.194-1.54-1.115l1.246-3.827-3.25-2.36c-.784-.566-.382-1.81.588-1.81h4.026l1.246-3.827z"></path></svg>
            </div>

            
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
          <button @click="handleAdopcion" class="adopt-button">
            ADOPTAR
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; // Necesitas Vue Router instalado
import Navbar from '../components/Navbar.vue';

// Inicialización de Router para obtener el ID
const route = useRoute();

// --- Estados Reactivos ---
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
  imagenes: [], // Rutas de las imágenes
  status: '',
});
const loading = ref(true);
const error = ref(null);
const currentImageIndex = ref(0);

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
            ageString += ', '; // Añade coma si ya se mostraron los años
        }
        ageString += `${months} mes${months > 1 ? 'es' : ''}`;
    }

    if (ageString === '') {
        return 'Menos de un mes'; // Para 0 meses
    }

    return ageString;
};

// --- Propiedades Calculadas (Computed) ---
// Calcula la URL de la imagen actual
const currentImage = computed(() => {
    if (pet.value && pet.value.imagenes && pet.value.imagenes.length > 0) {
        return pet.value.imagenes[currentImageIndex.value];
    }
    return null;
});

// Nueva propiedad computada para la edad formateada
const formattedPetAge = computed(() => {
    return pet.value ? formatAge(pet.value.edad) : 'Cargando...';
});

// Lógica de navegación del carrusel
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

// --- Lógica de Colores de Chips ---
const getTraitColor = (trait) => {
  const hash = trait.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Definiciones de colores específicas para cada grupo
  const colors = [
    'bg-indigo-chip text-indigo-chip', 
    'bg-yellow-chip text-yellow-chip', 
    'bg-green-chip text-green-chip', 
    'bg-red-chip text-red-chip'
  ];
  return colors[hash % colors.length];
};

// --- Manejo de Adopción (Placeholder) ---
const handleAdopcion = () => {
  // ⚠️ IMPORTANTE: No usar alert() en la aplicación final. Usar un modal o notificación.
  // Se deja para fines de demostración simple.
  alert(`Iniciando proceso de adopción para: ${pet.value.nombre}`); 
  // Aquí iría la lógica para redirigir a un formulario de aplicación
};

// --- Función para Cargar Datos ---
const fetchPetData = async () => {
  const petId = route.params.id; // Obtiene el ID de la URL (ej: /mascotas/42)
  if (!petId) {
    error.value = 'No se proporcionó un ID de mascota.';
    loading.value = false;
    return;
  }

  try {
    // ⚠️ Asegúrate que tu servidor Express esté corriendo en localhost:3000
    const response = await fetch(`http://localhost:3000/api/mascotas/card/${petId}`);
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.mensaje || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // Mapeo de datos para Vue (asumiendo que los datos vienen de la BD)
    pet.value = {
      id: data.idxxxx_mascot,
      nombre: data.nombre_mascot,
      especie: data.especi_mascot,
      sexo: data.sexoxx_mascot,
      edad: parseInt(data.edadme_mascot),
      raza: data.razaxx_mascot,
      peso: data.pesokg_mascot,
      tamano: data.tamano_mascot,
      // Los datos vienen como una cadena separada por comas, la volvemos array
      personalidad: data.infoad_mascot ? data.infoad_mascot.split('Personalidad:')[1]?.split('.')[0]?.split(',').map(s => s.trim()).filter(s => s) : [], 
      informacionAdicional: data.infoad_mascot,
      // Filtra las rutas de imagen que no sean nulas
      imagenes: [data.image1_mascot, data.image2_mascot, data.image3_mascot].filter(img => img),
      status: data.status_mascot,
    };
    
    // Ajuste de parseo para personalidad: busca el texto entre "Personalidad:" y "."
    // El código de arriba es un ejemplo robusto de cómo se podría hacer.

  } catch (err) {
    console.error('Fetch error:', err);
    error.value = `No se pudo obtener el perfil: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// --- Ciclo de Vida ---
onMounted(() => {
  fetchPetData();
});
</script>

<style scoped>
/* ======================================= */
/* === Paleta de Colores y Variables === */
/* ======================================= */

:root {
    --primary-orange: #FF9933;
    --soft-peach: #FFE8D9;
    --success-green: #10B981;
    --gray-50: #f9fafb;
    --gray-900: #1f2937;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --indigo-chip-bg: #e0e7ff;
    --indigo-chip-text: #4f46e5;
    --yellow-chip-bg: #fffbe6;
    --yellow-chip-text: #ca8a04;
    --green-chip-bg: #d1fae5;
    --green-chip-text: #059669;
    --red-chip-bg: #fee2e2;
    --red-chip-text: #dc2626;
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
    background-color: var(--gray-50);
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
    border: 1px solid #f3f4f6;
    margin-top: 100px;
}

.peach-background {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 50%;
    background-color: rgb(255, 250, 246);
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
    margin-bottom: 1.5rem; /* mb-6 */
    margin-top: 1rem; /* mt-4 */
}

@media (min-width: 768px) {
    .pet-name {
        margin-top: 0; /* md:mt-0 */
    }
}

.section-title {
    font-size: 1.25rem; /* text-xl */
    font-weight: 700; /* font-bold */
    color: var(--gray-800);
    margin-bottom: 0.5rem; /* mb-2 */
    border-bottom: 2px solid rgba(var(--primary-orange), 0.5);
    display: inline-block;
}

.data-list {
    list-style: none;
    padding: 0;
    margin-bottom: 1.5rem; /* mb-6 */
    font-size: 1.125rem; /* text-lg */
    color: var(--gray-700);
    line-height: 1.5;
}

.data-label {
    font-weight: 600; /* font-semibold */
    color: var(--gray-900);
}

.info-text {
    color: var(--gray-600);
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
    background-color: #fef3c7; /* yellow-100 */
    color: #f59e0b;           /* yellow-600 */
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
.bg-indigo-chip { background-color: var(--indigo-chip-bg); }
.text-indigo-chip { color: var(--indigo-chip-text); }
.bg-yellow-chip { background-color: var(--yellow-chip-bg); }
.text-yellow-chip { color: var(--yellow-chip-text); }
.bg-green-chip { background-color: var(--green-chip-bg); }
.text-green-chip { color: var(--green-chip-text); }
.bg-red-chip { background-color: var(--red-chip-bg); }
.text-red-chip { color: var(--red-chip-text); }


/* Botón de Adopción */
.adopt-button {
    width: 100%;
    padding: 0.75rem 2rem;
    background-color: #f59e0b;
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
    background-color: #E0852A; /* Color más oscuro para hover */
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
    text-align: center;
    padding-top: 4rem;
    padding-bottom: 4rem;
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

</style>
