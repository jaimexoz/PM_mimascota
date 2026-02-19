<template>
  <div class="adoption-feed-container">

    <Navbar />

    <div class="content-wrapper">
      <h1 class="main-title">
        <PawPrint class="paw-icon-main" />
        ¡Tu Match Perfecto!
        <PawPrint class="paw-icon-main" />
      </h1>
      <p class="subtitle">
        {{ hasSavedPreferences 
           ? 'Estas son las mascotas más compatibles contigo según nuestro Sistema de Match.' 
           : 'Responde unas preguntas y nuestro Sistema de Match encontrará a tu compañero ideal.' }}
      </p>
    </div>

    <div class="content-wrapper feed-content">

      <div v-if="isLoading" class="loading-message">
        <div class="loader"></div>
      </div>

      <div v-else-if="!hasSavedPreferences && !isLoading" class="cta-container">
        <div class="match-test-cta">
          <p class="cta-text">Aún no sabemos qué buscas. ¡Cuéntanos!</p>
          <button type="button" class="match-test-button" @click="showQuestionnaire = true">
            <Search class="icon-small" /> Iniciar Test de Compatibilidad
          </button>
        </div>
      </div>

      <div v-else-if="hasSavedPreferences && !isLoading" class="match-results-section">
        
        <div class="match-results-header">
          <div class="header-text">
            <h2 class="match-results-title">Tus Recomendaciones</h2>
            <p class="match-results-subtitle">Ordenadas por % de compatibilidad</p>
          </div>
          
          <button @click="retakeTest" class="btn-retake">
            <img src="https://res.cloudinary.com/dxf384txl/image/upload/v1770000809/refresh_qvgihy.png" alt="refresh" style="width: 25px;"> Cambiar mis preferencias
          </button>
        </div>

        <div v-if="matchResults.length > 0" class="pet-card-grid">
          <PetCard 
            v-for="mascota in matchResults" 
            :key="mascota.idxxxx_mascot || mascota.id" 
            :mascota="mascota" 
          />
        </div>

        <div v-else class="empty-state">
          <p>No encontramos mascotas exactas para tus filtros actuales, pero ¡intenta ajustar tus preferencias!</p>
          <button @click="retakeTest" class="btn-link">Ajustar preferencias</button>
        </div>
      </div>

      <div v-if="matchError" class="match-error-state">
        <p class="match-error-text">{{ matchError }}</p>
        <button type="button" class="show-all-button" @click="matchError = null">Cerrar</button>
      </div>

    </div>

    <div v-if="showQuestionnaire" class="questionnaire-modal-overlay" @click.self="showQuestionnaire = false">
      <div class="questionnaire-modal-content">
        <button type="button" class="questionnaire-modal-close" @click="showQuestionnaire = false" aria-label="Cerrar">
          ×
        </button>
        <MatchTestQuestionnaire
          @close="showQuestionnaire = false"
          @submit="onQuestionnaireSubmit"
        />
      </div>
    </div>

    <Footer/>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
import MatchTestQuestionnaire from '@/components/MatchTestQuestionnaire.vue';
import Footer from '@/components/Footer.vue';
import { ref, onMounted, computed, h } from 'vue';
import { PawPrint, Search, Loader } from 'lucide-vue-next';
import { useRouter } from 'vue-router'; 
import TarjetaMascota from '../components/TarjetaMascota.vue';
import { getToken } from '../utils/auth';
import { apiUrl } from '@/config/api';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// --- ESTADOS ---
const router = useRouter();
const authStore = useAuthStore();
const showQuestionnaire = ref(false);
const isLoading = ref(true);
const matchError = ref(null);

const matchResults = ref([]);
const hasSavedPreferences = ref(false); // Determina si mostramos el botón o la lista

// ==============================================
// 1. CARGA INICIAL (RECUPERAR VECTOR GUARDADO)
// ==============================================
onMounted(async () => {
  await fetchSavedRecommendations();
});

async function fetchSavedRecommendations() {
  isLoading.value = true;
  const startTime = Date.now();
  const token = authStore.token || localStorage.getItem('authToken');

  if (!token) {
    // Si no hay token, forzamos a mostrar el botón de inicio (o redirigir a login)
    isLoading.value = false;
    hasSavedPreferences.value = false;
    return;
  }

  try {
    // Usamos GET para consultar si ya existen preferencias
    const response = await axios.get(apiUrl('/recommendations/getSavedRecommendations'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.data.status === 'success') {
      matchResults.value = response.data.recommendations;
      hasSavedPreferences.value = true;
    } else if (response.data.status === 'no_data') {
      // El usuario existe pero nunca ha hecho el test
      matchResults.value = [];
      hasSavedPreferences.value = false;
    }

  } catch (error) {
    console.error("Error obteniendo perfil match (tratando como nuevo usuario):", error);
    // En caso de error (404, 500, Network Error), asumimos que no hay perfil cargado
    // y permitimos al usuario hacer el test.
    matchResults.value = [];
    hasSavedPreferences.value = false;
    matchError.value = null; // Aseguramos no mostrar error
  } finally {
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; 
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
            isLoading.value = false;
        }, remainingTime);
  }
}

// ==============================================
// 2. ENVÍO DEL CUESTIONARIO (CREAR/ACTUALIZAR)
// ==============================================
async function onQuestionnaireSubmit(answers) {
  showQuestionnaire.value = false;
  isLoading.value = true;
  const startTime = Date.now();
  matchError.value = null;

  const token = authStore.token || localStorage.getItem('authToken');
  
  if (!token) {
    matchError.value = 'Tu sesión ha expirado. Por favor inicia sesión.';
    isLoading.value = false;
    return;
  }

  try {
    // Usamos POST para guardar/actualizar el vector y recibir nuevos resultados
    const response = await axios.post(
      apiUrl('/recommendations/submitQuestionnaire'),
      answers,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.status === 'success') {
      matchResults.value = response.data.recommendations;
      hasSavedPreferences.value = true; // Activamos la vista de resultados
    } else {
      matchError.value = 'No se pudieron calcular las recomendaciones.';
    }
  } catch (error) {
    console.error('Error enviando test:', error);
    matchError.value = error.response?.data?.message || 'Error al procesar tus respuestas.';
  } finally {
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; 
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
            isLoading.value = false;
        }, remainingTime);
  }
}

// ==============================================
// 3. REINICIAR / VOLVER A HACER EL TEST
// ==============================================
function retakeTest() {
  // Simplemente abrimos el modal. Al enviar, el backend hará UPDATE sobre el vector viejo.
  showQuestionnaire.value = true;
}

// ==============================================
// 4. UTILIDADES Y COMPONENTES VISUALES
// ==============================================

function formatAge(months) {
  if (months < 12) return `${months} m`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths === 0 ? `${years} años` : `${years}a ${remainingMonths}m`;
}

// COMPONENTE TARJETA (Render Function)

const PetCard = ({ mascota }) => {
const ageDisplay = formatAge(mascota.edadme_mascot);
const imageUrl = mascota.image1_mascot || `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`;

const matchPct = mascota.match_percentage 
    ? mascota.match_percentage 
    : (mascota.match_score ? Math.round(mascota.match_score * 100) + '%' : null);

const navigateToProfile = () => {

    router.push(`/card/${mascota.id || mascota.idxxxx_mascot}`);

};

const chips = [
    h('span', { class: 'chip chip-grey' }, mascota.sexoxx_mascot),
    h('span', { class: 'chip chip-grey' }, ageDisplay),
    h('span', { class: 'chip chip-grey' }, mascota.razaxx_mascot || 'Mestizo'),

];

if (matchPct) {
    chips.push(h('span', { class: 'chip chip-match' }, `${matchPct}% Match`));
}

return h('div', { class: 'pet-card' }, [
    h('div', { class: 'pet-card-image-container' }, [
        h('img', {
            src: imageUrl,
            alt: `Foto de ${mascota.nombre_mascot}`,
            class: 'pet-card-image',
            onerror: (e) => e.target.src = `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`
        })
    ]),

    h('div', { class: 'pet-card-content' }, [

        h('h3', { class: 'pet-card-name' }, mascota.nombre_mascot),

        h('div', { class: 'pet-card-chips' }, chips)

    ]),

    h('div', { class: 'pet-card-content-button' }, [

        h('button', { class: 'pet-card-button', onClick: navigateToProfile }, 'Ver más')

    ])

]);

};
</script>

<style scoped>
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: #ff99a2 transparent;
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
  /* Colores y Variables */
  .paw-icon-color {
    color: #FF9933; /* Naranja principal */
  }
  .button-orange {
    background-color: #FF9933;
    transition-property: background-color;
    transition-duration: 300ms;
  }
  .button-orange:hover {
    background-color: #E0852A;
  }
  
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
    background-color: white;
    z-index: 999; 
    color: #333;
    font-size: 1.2em;

}
  /* ==============================================
    1. LAYOUT Y ENCABEZADO
    ============================================== */
  
  .adoption-feed-container {
    min-height: 100vh;
    background-color: #ffffff; /* gray-50 */
    padding-top: 1rem;
  }
  
  .content-wrapper {
    max-width: 80rem; /* max-w-7xl */
    margin-left: auto;
    margin-right: auto;
    margin-top: 100px;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .feed-content {
    padding-bottom: 3rem;
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
  
  .subtitle {
    font-size: 1.25rem; /* text-xl */
    line-height: 1.75rem;
    color: #4b5563; /* gray-600 */
    text-align: center;
    margin-bottom: 1rem;
  }

  .cta-container {
  text-align: center;
  padding: 3rem 1rem;
  background-color: #f9fafb;
  border-radius: 1rem;
  border: 2px dashed #e5e7eb;
  margin-top: 2rem;
}

  .cta-text {
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.match-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 1rem;
}

.match-results-title {
  font-size: 1.5rem;
  color: #111827;
  font-weight: 700;
  margin: 0;
}

.match-results-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.btn-retake {
  background-color: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-retake:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.btn-link {
  background: none;
  border: none;
  color: #ff9595;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

/* Chip de Match */
.chip-match {
  background-color: #ff9595 !important;
  color: white !important;
  font-weight: bold;
}

.icon-small {
  width: 1.2rem;
  height: 1.2rem;
}

/* Reutilizando tus estilos base */
.match-test-button {
  background-color: #ff9595;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 9999px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.match-test-button:hover {
  background-color: #ff7070;
}

  .match-test-cta {
    text-align: center;
    margin-bottom: 2rem;
  }

  .match-test-button {
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    background-color: #ff9595;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: background-color 0.2s, transform 0.15s;
  }

  .match-test-button:hover {
    background-color: #ff6060;
    transform: scale(1.02);
  }

  /* Resultados del match (recomendaciones) */
  .match-results-section {
    margin-top: 1rem;
  }
  .match-results-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .match-results-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.25rem;
  }
  .match-results-subtitle {
    color: #6b7280;
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  .match-results-clear {
    margin-top: 0.5rem;
  }

  .match-error-state {
    text-align: center;
    padding: 2rem;
    background-color: #fef2f2;
    border-radius: 0.75rem;
    border: 1px solid #fecaca;
  }
  .match-error-text {
    color: #b91c1c;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  /* Modal del cuestionario de match */
  .questionnaire-modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .questionnaire-modal-content {
    position: relative;
    width: 100%;
    max-width: 44rem;
    max-height: 90vh;
    overflow: hidden;
  }

  .questionnaire-modal-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: #ff9595;
    color: #ffffff;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .questionnaire-modal-close:hover {
    background: #ff6060;
  }

  /* ==============================================
    3. FEED Y TARJETAS (Pet Card)
    ============================================== */
  
  .loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 16rem; /* h-64 */
  }
  
  .loading-icon {
    width: 2.5rem; /* w-10 */
    height: 2.5rem; /* h-10 */
    color: #6366f1; /* text-indigo-500 */
  }
  
  .loading-text {
    margin-left: 0.75rem;
    font-size: 1.25rem;
    color: #4b5563; /* text-gray-600 */
  }
  
  .pet-card-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 2rem;
  }
  @media (min-width: 640px) { /* sm */
    .pet-card-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 768px) { /* md */
    .pet-card-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) { /* lg */
    .pet-card-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  
  
  /* Tarjeta Individual */
  /*
  NOTA IMPORTANTE: Como PetCard es un componente hijo renderizado con h(),
  usamos :deep() para que el CSS 'scoped' del padre GatosPage.vue pueda
  aplicarse a las clases internas de PetCard.
  */
  .pet-card {
    background-color: #ffffff; /* bg-white */
    border-radius: 0.75rem; /* rounded-xl */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); /* shadow-lg */
    overflow: hidden;
    border: 1px solid #f3f4f6; /* border-gray-100 */
    transition: all 300ms ease;
    display: flex;
    flex-direction: column;
  }
  .pet-card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* hover:shadow-2xl */
  }
  
  /* ----------------------------------------------------- */
  /* CLASES DE IMAGEN MODIFICADAS CON :deep() */
  /* ----------------------------------------------------- */
  
  :deep(.pet-card-image-container) {
    height: 15rem; /* h-48: Define la altura del contenedor */
    width: 100%;
    overflow: hidden;
    /* CENTRADO: Usamos Flexbox para centrar la imagen dentro del contenedor */
    display: flex;
    justify-content: center; /* Centrado horizontal */
    align-items: center; /* Centrado vertical */
  }
  
  :deep(.pet-card-image) {
    width: 100%;
    height: 100%;
    /* AJUSTE CLAVE: Asegura que la imagen cubra todo el contenedor */
    object-fit: cover; 
    /* AJUSTE CLAVE: Centra la parte visible de la imagen */
    object-position: center; 
    transition: transform 500ms ease;
  }
  
  /* El :deep() aplica a los selectores hijos, por lo que este :hover también funcionará */
  :deep(.pet-card-image:hover) {
    transform: scale(1.05); /* hover:scale-105 */
  }
  
  
  /* ----------------------------------------------------- */
  /* RESTO DE ESTILOS DE LA TARJETA (También se les aplica :deep()
   si están dentro de la PetCard, aunque algunos funcionan
   sin él si ya estaban aplicados al elemento raíz de la Card.
   Es mejor usarlos para asegurar el alcance.)
  */
  /* ----------------------------------------------------- */
  
  :deep(.pet-card-content) {
    padding-right: 1rem;
    padding-left: 1rem;
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  :deep(.pet-card-name) {
    font-size: 1.5rem; /* text-2xl */
    font-weight: 800; /* font-bold */
    color: #1f2937; /* gray-800 */
    margin-bottom: 0.25rem;
  }
  
  :deep(.pet-card-chips) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem; /* text-sm */
    color: #4b5563; /* text-gray-600 */
    margin-bottom: 0.75rem;
    flex-wrap: wrap; /* Permite que los elementos se envuelvan a la línea de abajo */
    
    /* Espaciado entre elementos */
    column-gap: 0.5rem; /* space-x-2 (espacio horizontal) */
    row-gap: 0.5rem; /* Espacio vertical para las nuevas líneas */
  
  }
  
  :deep(.chip) {
    padding: 0.125rem 0.5rem; /* px-2 py-0.5 */
    border-radius: 9999px; /* rounded-full */
    font-weight: 600; /* font-semibold */
  }
  
  :deep(.chip-indigo) {
    background-color: #eef2ff; /* bg-indigo-100 */
    color: #4338ca; /* text-indigo-700 */
  }
  
  :deep(.chip-yellow) {
    background-color: #fffbeb; /* bg-yellow-100 */
    color: #b45309; /* text-yellow-700 */
  }
  
  :deep(.chip-grey) {
    background-color: #c8c7c7;
  color: #ffffff; 
  }

  :deep(.chip-match) {
    background-color: #c195ff;
    color: #ffffff;
  }
  
  :deep(.pet-card-content-button){
    padding-right: 1rem;
    padding-left: 1rem;
    padding-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: auto;
  }
  
  :deep(.pet-card-button) {
    width: 50%;
    margin-top: 0.5rem;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 25px; 
    font-size: 1.125rem; /* text-lg */
    font-weight: 700; /* font-bold */
    color: #ffffff; /* text-white */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* shadow-md */
    cursor: pointer;
  }
  /* Usamos la regla de color definida arriba */
  :deep(.pet-card-button) {
    background-color: #ff9595; 
  
    transition: background-color 300ms ease;
  }
  :deep(.pet-card-button:hover) {
    background-color: #ff6060;
  }
  
  
  /* Estados sin resultados */
  .no-results-state {
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
  
  .show-all-button {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    border-radius: 9999px; /* rounded-full */
    color: #ffffff; /* text-white */
    font-weight: 700; /* font-bold */
    background-color: #4f46e5; /* indigo-600 */
    transition: background-color 200ms ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* shadow-lg */
  }
  .show-all-button:hover {
    background-color: #4338ca; /* hover:bg-indigo-700 */
  }
  
  
  </style>