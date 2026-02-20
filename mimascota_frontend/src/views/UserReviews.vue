<template>
  <div class="reviews-page-container">
      <Navbar/>
    <div class="hero-section">
      <small class="adopcion-foto-experiencia">Designed by <a href="https://pixabay.com/">Pixabay</a></small>
      <div class="hero-overlay">
        
        <h2>COMPARTE <br> TU EXPERIENCIA</h2>
      </div>
    </div>

    <main class="content-section">
      <section class="review-form-card">
        <h3>Deja tu valoración</h3>
        
        <div class="rating-stars">
          <span v-for="star in 5" :key="star" @mouseover="setHoverRating(star)" @mouseleave="setHoverRating(0)" @click="setRating(star)">
              <svg
                  :class="{ 'star-icon': true, 'star-filled': star <= (hoverRating || newRating) }"
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
              >
                  <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
              </svg>
          </span>
        </div>
        
        <textarea
          v-model="newComment"
          placeholder="Déjanos un comentario"
          rows="4"
          maxlength="100"
        ></textarea>
        <p class="char-count">{{ newComment.length }} / 100</p>
        
        <div class="button-container">
            <button @click="submitReview" class="btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Enviando...' : 'Enviar' }}
            </button>
        </div>
      </section>

      <section class="user-reviews-list">
        <h2>Reseñas de usuarios</h2>
        <p class="reviews-subtitle">
          Lee las reseñas dejadas por los usuarios de la aplicación web.
        </p>
        
        <div class="filter-controls">
          <label>Filtrar por:</label>
          <button 
              class="filter-button" 
              :class="{ 'active-filter': currentSort === 'DESC' }"
              @click="fetchReviews(1, 'DESC')"
          >
              Más recientes
          </button>
          <button 
              class="filter-button" 
              :class="{ 'active-filter': currentSort === 'ASC' }"
              @click="fetchReviews(1, 'ASC')"
          >
              Más antiguos
          </button>
      </div>
        
        <div v-if="isLoadingReviews || isLoading || isDeleting" class="loading-message">
            <div class="loader"></div>
        </div>
        
        <div v-if="!isLoadingReviews">
          <div
            v-for="review in reviews"
            :key="review.idxxxx_review"
            class="review-item"
          >
            <img :src="review.avatar_url || 'https://i.imgur.com/Kq489Q3.jpg'" :alt="'Avatar de ' + review.nombre_usuario" class="user-avatar" />
            <div class="review-details">
              <div class="review-rating">
                <span v-for="s in 5" :key="s" :class="{ 'star-filled': s <= review.nstars_review }">&#9733;</span>
              </div>
              <p class="review-text">
                {{ review.conten_review }}
              </p>
              <div class="review-meta">
                  <p class="review-user-name">Por: {{ review.nombre_usuario || 'Usuario Anónimo' }}</p>
                  <p class="review-date">{{ formatDate(review.fechax_review) }}</p>
                  
                  <button 
                      v-if="isAuthorizedForDeletion"
                      @click="deleteReview(review.idxxxx_review)" 
                      :disabled="isDeleting"
                      class="delete-button"
                      title="Eliminar Reseña">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                      </svg>
                  </button>
                  </div>
            </div>
          </div>
          
          <p v-if="reviews.length === 0 && !isLoadingReviews">No hay reseñas disponibles.</p>
        </div>

        <div class="pagination" v-if="totalPages > 1 && !isLoadingReviews">
          <span 
            v-for="page in totalPages" 
            :key="page" 
            :class="{ 'page-number': true, 'active': currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </span>
          <a v-if="currentPage < totalPages" @click="goToPage(currentPage + 1)" class="next-link">Siguiente</a>
        </div>

      </section>
    </main>
    <div v-if="modal.visible" class="modal-overlay">
          <div class="modal-content" :class="modal.tipo">
              <div class="modal-x">
                  <button @click="cerrarModal" class="close-button">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
              <div class="modal-header">
                  <h2 class="modal-title">Reseña</h2> 
                  <template v-if="modal.tipo === 'success'">
                    <p>{{ modal.mensaje }}</p>
              </template>
              <template v-if="modal.tipo === 'error'">
                  <p>{{ modal.mensaje }}</p>
              </template>
                  
              </div>
              
              <div class="button-actions">
                  <button @click="cerrarModal" class="btn-primary">
                      Aceptar
                  </button>
              </div>
          </div>
      </div>
    </div>
    <Footer/>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import { getToken } from '../utils/auth';
import { apiUrl } from '@/config/api';
import { useRouter } from 'vue-router'; 

const API_BASE_URL = apiUrl('/reviews');
const router = useRouter(); 

// --- ESTADO DEL MODAL ---
const modal = reactive({
  visible: false,
  mensaje: '',
  tipo: 'success' 
});

// --- ESTADO DEL FORMULARIO DE RESEÑA ---
const newRating = ref(0);
const hoverRating = ref(0); 
const newComment = ref('');
const isLoading = ref(false); 

// --- ESTADO DE LA LISTA Y PAGINACIÓN ---
const reviews = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const isLoadingReviews = ref(false); 
const currentSort = ref('DESC');

// --- ESTADO DE AUTENTICACIÓN Y ROL ---
const currentUserRole = ref(null); // 🚨 Nuevo estado para el rol
const isDeleting = ref(false); 

// --- COMPUTED: Verifica si el usuario tiene rol de Administrador o Empleado ---
const isAuthorizedForDeletion = computed(() => {
  // Roles permitidos: 'Administrador' o 'Empleado'
  // Convert role to lowercase for case-insensitive comparison
  const role = currentUserRole.value ? currentUserRole.value.toLowerCase() : '';
  return role === 'administrador' || role === 'admin' || role === 'empleado';
});

// --- LÓGICA DE AUTENTICACIÓN Y ROL ---
/**
* @description Obtiene el rol del usuario logueado desde localStorage.userData.
*/
const getCurrentUserRole = () => {
  const userDataString = localStorage.getItem('userData');
  
  if (userDataString) {
      try {
          const userData = JSON.parse(userDataString);
          // 🚨 Accede a la propiedad 'role' dentro del objeto userData
          currentUserRole.value = userData.role; 
          console.log('Rol de usuario cargado:', currentUserRole.value);
          
      } catch (e) {
          console.error('Error al parsear userData de localStorage:', e);
          currentUserRole.value = null;
      }
  } else {
      currentUserRole.value = null;
  }
};


// --- LÓGICA DEL MODAL ---
function mostrarModal(msg, type) {
  modal.mensaje = msg;
  modal.tipo = type;
  modal.visible = true;
}

function cerrarModal() {
  modal.visible = false;
}

// --- LÓGICA DE ESTRELLAS (HOVER Y CLICK) ---
const setHoverRating = (rating) => {
  hoverRating.value = rating;
};

const setRating = (rating) => {
  newRating.value = rating;
};

// --- UTILIDAD ---
const formatDate = (dateString) => {
  if (!dateString) return 'Fecha desconocida';
  try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('es-ES', options);
  } catch (e) {
      return 'Fecha inválida';
  }
};

// --- LÓGICA DE LA API (GET, POST y DELETE) ---

const fetchReviews = async (page = 1, sortOrder = 'DESC') => {
  isLoadingReviews.value = true;
  const startTime = Date.now();
  currentSort.value = sortOrder;
  try {
      const response = await fetch(`${API_BASE_URL}?page=${page}&sortOrder=${sortOrder}`);
      
      if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      reviews.value = data.reviews.map(review => ({
          ...review,
          nombre_usuario: review.nombre_usuari, 
          avatar_url: review.imagep_usuari, 
          nstars_review: review.nstars_review,
          conten_review: review.conten_review,
          fechax_review: review.fechax_review
      }));
      totalPages.value = data.totalPages;
      currentPage.value = data.currentPage;

  } catch (error) {
      console.error('Error al cargar las reseñas:', error);
  } finally {
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1000; 
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
          isLoadingReviews.value = false;
      }, remainingTime);
  }
};


const submitReview = async () => {
  if (newRating.value === 0 || newComment.value.trim() === '') {
    mostrarModal('Por favor, selecciona una valoración y escribe un comentario.', 'error');
      return;
  }
  
  const token = localStorage.getItem('authToken'); 

  if (!token) {
    mostrarModal('Debes iniciar sesión para dejar una reseña.', 'error');
      router.push('/login'); 
      return;
  }

  isLoading.value = true;
  const startTime = Date.now();
  
  const newReviewData = {
      stars: newRating.value,
      comment: newComment.value.trim(),
  };
  
  try {
      const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, 
          },
          body: JSON.stringify(newReviewData), 
      });

      if (response.ok) {
        mostrarModal('¡Reseña enviada con éxito!', 'success');
          
          newRating.value = 0;
          newComment.value = '';
          
          // Recargar la primera página de reseñas (las más recientes)
          await fetchReviews(1); 

      } else {
          const errorText = await response.text(); 
          let mensajeError = 'Error desconocido.';
          
          try {
              const errorJson = JSON.parse(errorText);
              mensajeError = errorJson.message || errorJson.mensaje || 'Error desconocido del servidor.';
          } catch (e) {
              mensajeError = `Error ${response.status}: ${response.statusText}.`;
          }

          mostrarModal(`Hubo un error: ${mensajeError}`, 'error');
      }
      
  } catch (error) {
      console.error('Error de red al enviar el formulario:', error);
      mostrarModal('No se pudo conectar al servidor. Asegúrate de que Express esté corriendo.', 'error');
  } finally {
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1000; 
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
          isLoading.value = false;
      }, remainingTime);
  }
};

/**
* ⭐️ FUNCIÓN PARA ELIMINAR LA RESEÑA ⭐️
* @param {number} reviewId - El ID de la reseña a eliminar.
*/
async function deleteReview(reviewId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta reseña? Esta acción es irreversible.')) {
      return;
  }

  isDeleting.value = true;
  const startTime = Date.now();
  const token = localStorage.getItem('authToken');

  if (!token) {
      alert('Error: Token de autenticación no encontrado. Inicie sesión.');
      isDeleting.value = false;
      return;
  }

  try {
      const response = await fetch(apiUrl(`/reviews/${reviewId}`), {
          method: 'DELETE',
          headers: {
              // El servidor usará este token para verificar el rol/permisos (aunque el cliente ya filtró)
              'Authorization': `Bearer ${token}`, 
          },
      });

      if (response.ok) {
          alert('Reseña eliminada con éxito.');
          // Recargar la lista para mostrar el cambio
          fetchReviews(currentPage.value, currentSort.value); 
      } else if (response.status === 403) {
          alert('No tienes permiso para eliminar esta reseña (Rol insuficiente o problema del servidor).');
      } else if (response.status === 404) {
          alert('La reseña no fue encontrada.');
      } else {
          const errorData = await response.json();
          alert(`Error al eliminar la reseña: ${errorData.message || 'Error desconocido'}`);
      }
  } catch (error) {
      console.error('Error de red al intentar eliminar:', error);
      alert('Error de conexión con el servidor.');
  } finally {
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1000; 
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
          isDeleting.value = false;
      }, remainingTime);
  }
}


const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
      fetchReviews(page, currentSort.value); 
  }
};

// Cargar el rol y las reseñas iniciales al montar el componente
onMounted(() => {
  getCurrentUserRole(); // 🚨 Primero obtenemos el rol
  fetchReviews(1);
});
</script>
  
<style>

  
.modal-overlay {
    /* Fondo que cubre toda la pantalla */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7); /* Oscurece el fondo */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Asegura que esté por encima de todo */
}

.modal-content {
    position: relative;
    background-color: #ffffff; 
    border-radius: 1rem; /* Borde ligeramente más suave */
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
    width: 100%; 
    max-width: 500px; /* Tamaño típico para modales de confirmación */
    padding: 2.5rem 1.5rem; /* Ajuste del padding */
    text-align: center;
}


.modal-header h2 {
    font-size: 1.4rem;
    color: #333;
    margin: 10px;
    font-weight: 700;
}

.modal-header p{
    font-size: 1.2rem;
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 0 1.8rem;
}
.modal-icon {
    font-size: 3rem;
    display: inline-block;
    width: 60px;
    height: 60px;
    line-height: 60px;
    border-radius: 50%;
    color: white;
    font-weight: bold;
    margin-bottom: 10px;
}

.modal-content.success .modal-header{
    font-size: 1.5rem;
    color: #333;
    margin: 10px;
    font-weight: 400;
}

.modal-content.error .modal-header{
    font-size: 1.4rem;
    color: #333;
    margin: 10px;
    font-weight: 700;

}

.modal-content.error .modal-icon {
    background-color: #f44336; /* Rojo para error */
}

.modal-actions {
    width: 40%;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #495057;
    cursor: pointer;
    width: 30px;
    height: 30px;
    padding: 0;
    transition: color 0.2s;
}

.close-button:hover {
    color: #ff6060;
}

.button-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem; /* Espacio entre los botones */
    padding: 0 1rem;
}
    /* La clase `star-filled` ahora apunta a una variable definida: */
    .star-filled {
      color: #FFD700;; /* ¡Esto hará que las estrellas se pinten! */
    }

    .star-icon {
    width: 35px; /* Define el ancho */
    height: 35px; /* Define el alto */
    fill: currentColor; /* Asegura que el SVG use el color definido por su contenedor (rating-stars o star-filled) */
    margin: 0 2px;
}
    /* La clase `.rating-stars` apunta a la variable de borde (gris claro): */
    .rating-stars {
      display: flex;
      font-size: 2em;
      color: #ccc;  /* Estrellas vacías grises */
      cursor: pointer;
      margin-bottom: 20px;
      text-align: center; 
      height: 50px;
    }

    .rating-stars span {
        transition: color 0.2s;
        user-select: none;
    }
  
  /* --- El resto de tus estilos --- */
  
  .reviews-page-container {
    display: flex;
    flex-direction: column;
    margin-top: 80px;
    align-items: center;
    background-color:rgb(255, 255, 255);
  }
  
  /* Sección Superior (Hero) */
  .hero-section {
    position: relative;
    width: 90%;
    height: 500px; 
    background-image: url('https://res.cloudinary.com/dxf384txl/image/upload/v1769999906/experience_aqpufc.jpg'); 
    background-size: cover;
    background-position: center;
    border-bottom-left-radius: 50px;
    border-bottom-right-radius: 50px;
    overflow: hidden;
  }
  
  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding-left: 10%;
    margin-top: 90px;
  }
  
  .hero-overlay h2 {
    color: rgb(255, 255, 255);
    font-size: 3em;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  /* Sección de Contenido */
  .content-section {
    display: flex;
    justify-content: center;
    gap: 80px;
    padding: 50px 10%;
  }
  
  /* Tarjeta de Formulario de Reseña */
  .review-form-card {
    width: 350px;
    background-color: #ffffff;
    padding: 30px;
    box-shadow: 0 3px 5px 5px rgba(255, 176, 176, 0.801);
    border-radius: 8px;
    height: fit-content;
    display: flex; /* Añadido para mejor control */
    flex-direction: column; /* Añadido para mejor control */
    align-items: center; /* Centrar el contenido */
  }
  
  .review-form-card h3 {
    font-size: 1.5em;
    font-weight: 700;
    color: #000000;
    margin-bottom: 20px;
    text-align: center;
    width: 100%;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc; 
    border-radius: 4px;
    resize: vertical;
    margin-bottom: 20px;
    box-sizing: border-box;
  }
  
  /* Conteo de caracteres */
  .char-count {
      font-size: 0.8em;
      color: #888;
      text-align: right;
      width: 100%;
      margin-top: -15px; 
      margin-bottom: 20px;
  }

  .button-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  
  .btn-primary {
    background-color: #ff9595; 
    color: #ffffff; 
    border: none;
    padding: 10px 30px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    transition: background-color 0.3s;
    display: block;
    width: 50%;
  }

  .adopcion-foto-experiencia {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 6px;
    color: #ffffff;
    margin-right: 10px;
  }

  .adopcion-foto-experiencia a {
    color: #ffffff;
  }
  
  .btn-primary:hover {
    background-color: #ff6060;
  }
  
  /* Lista de Reseñas */
  .user-reviews-list {
    width: 600px;
  }
  
  .user-reviews-list h2 {
    font-size: 2em;
    font-weight: 700;
    color: #000000;
    margin-bottom: 5px;
  }
  
  .reviews-subtitle {
    color: #666;
    margin-bottom: 30px;
  }
  
  .filter-controls {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .filter-controls label {
    font-weight: bold;
    margin-right: 10px;
  }
  
  .filter-button {
    background-color: #ffffff;
    border: 2px solid #ff9595; 
    margin: 5px;
    padding: 8px 15px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 600;
    transition: background-color 0.3s;
  }

  .filter-button:hover {
    color: white;
    font-weight: 600;
    background-color: #ff9595; 
  }
  
  /* Ítem de Reseña Individual */
  .review-item {
    display: flex;
    align-items: flex-start;
    background-color: #ffffff;
    padding: 15px;
    border: 1px solid #ccc; 
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 1px 2px 3px rgba(255, 176, 176, 0.801);
  }
  
  .user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 15px;
  }
  
  .review-details {
    flex-grow: 1;
  }
  
  .review-rating {
    font-size: 1.2em;
    margin-bottom: 5px;
  }
  
  .review-rating .star-filled {
    color:  #FFD700; 
  }
  
  .review-rating span {
    color: #ccc;    
  }
  
  .review-text {
    margin: 0;
    color: #000000;
  }
  

  /* Paginación */
  .pagination {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 20px;
      font-size: 1em;
  }
  
  .page-number {
      margin: 0 8px;
      cursor: pointer;
      color: #666;
      padding: 5px 10px;
      border-radius: 4px;
      transition: background-color 0.3s;
  }
  
  .page-number.active {
      font-weight: bold;
      color: #ffffff;
      background-color: #ff9595; 
  }
  
  .page-number:not(.active):hover {
      background-color: #eee;
  }
  
  .next-link {
      margin-left: 15px;
      color: #ff9595; 
      text-decoration: none;
      cursor: pointer;
      font-weight: bold;
  }

  .review-meta {
    display: flex; /* Alinea el nombre y la fecha horizontalmente */
    justify-content: space-between; /* Empuja el nombre a la izquierda y la fecha a la derecha */
    align-items: center;
    margin-top: 5px; /* Espacio superior */
    font-size: 0.9em;
    color: #666;
}

.review-meta p {
    margin: 0; /* Elimina márgenes extra de los párrafos */
}

.review-user-name {
    font-weight: bold;
    color: #333; /* Color más oscuro para el nombre */
}

.review-date {
    font-style: italic;
    color: #999; 
    padding-left: 200px;
}

.delete-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ef4444; /* Rojo suave */
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.delete-button:hover:not(:disabled) {
    background-color: #fee2e2;
}

.delete-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.delete-button svg {
    width: 20px;
    height: 20px;
    vertical-align: middle;
}
/* Loader Global */
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
  </style>