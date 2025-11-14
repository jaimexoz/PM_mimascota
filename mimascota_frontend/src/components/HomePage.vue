<template>
  <div class="home-page">
    <!-- Navbar -->
    <Navbar />
    
    <!-- Contenido Principal -->
    <main  class="main-content">
      <!-- Título de la Página -->
      <div class="page-header">
        <div class="title-section">
          <h1 class="page-title-1st">ENCUENTRA A <br>TU NUEVO</h1>
          <h1 class="page-title-2nd">MEJOR AMIGO</h1>
          <p class="page-title-3rd">Adopta una mascota</p>
          <a href="#loq" @click.prevent="scrollToSection('#loq')" class="explore-button">Explorar</a>
          
      </div>
        
        <div class="image-section" id="loquis">
            <img src="../assets/inip.png" alt="Perro y Gato" class="mascot-image" />
          
        </div>
      </div>

      <!-- Contenido de la Página -->
      <div class="page-content" id="loq">
        <div class="title-adopt-section" >
          <h2>Mascotas Disponibles para Adoptar</h2>
        </div>

      </div>

     
          

      <div class="content-wrapper feed-content">
        <div class="pet-card-grid"> 
            

            <span v-if="isNavigating" class="loader">
                Cargando las mascotas...
            </span>
            <div v-else-if="mascotas.length === 0">
                <p>
                    Aún no hay mascotas disponibles. ¡Vuelve pronto!
                </p>
            </div>

            <template v-else>
            
            <span v-if="isNavigating" class="loader">
                Cargando las mascotas...
            </span>
                <component 
                    v-for="mascota in mascotas" 
                    :key="mascota.idxxxx_mascot"
                    :is="PetCard"
                    :mascota="mascota"
                    :is-navigating="isNavigating"
                />
            </template>
            
        </div>
        
    </div>

    <div class="container-3">
        
        <h2>
            Cómo Funciona el Proceso de Adopción
        </h2>

        <div class="adopcion-grid">
            
            <div class="adopcion-imagen-container">
                <img 
                    src="../assets/cat1.jpg" 
                    alt="Un gato sentado, listo para ser adoptado" 
                    class="adopcion-imagen"
                />
            </div>

            <div class="adopcion-pasos-container">
                <ol class="adopcion-lista">
                    <li class="paso-item">
                        <span class="paso-numero">1.</span> 
                        Explora nuestras mascotas.
                    </li>
                    <li class="paso-item">
                        <span class="paso-numero">2.</span> 
                        Envía tu solicitud de adopción.
                    </li>
                    <li class="paso-item">
                        <span class="paso-numero">3.</span> 
                        Entrevista y verificación.
                    </li>
                    <li class="paso-item">
                        <span class="paso-numero">4.</span> 
                        ¡Lleva a tu nuevo amigo a casa!
                    </li>
                </ol>

                <a href="/auth" class="adopcion-boton">
                    Comienza ahora 
                    <svg class="boton-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </a>
            </div>

            
        </div>
    
      </div>

      
    <div class="container-4">
        <h2>Cuéntanos tu Experiencia </h2>
        <div class="experience-primary">
            <div class="experience-tittle">
                <h1>Tu opinión es importante</h1>
                <p> ¿Disfrutaste tu experiencia? <br> Déjanos un comentario  y <br> mejora nuestro servicio. 
                </p>
                <div class="experience-button">
                    <a href="/reviews" class="adopcion-boton">
                        Ingresa aquí
                        <svg class="boton-icono" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </a>
                </div> 
            </div> 

            <div class="experience-cont">
                <div class="experience-img">
                    
                </div>
            </div>
        </div>
      </div>

    </main>
    <Footer/>
  </div>
</template>


<script setup>
import Navbar from '../components/Navbar.vue';
import Footer from './Footer.vue';
import { ref, onMounted, h } from 'vue';
import { Loader } from 'lucide-vue-next';
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from 'vue-router'; 
  
  // Inicialización
  const router = useRouter(); 

// Inicialización
const authStore = useAuthStore();
const mascotas = ref([]); // Almacenará SÓLO las 4 mascotas más recientes
const isLoading = ref(true);

const isNavigating = ref(false); 
// ==============================================
// OBTENCIÓN DE DATOS DEL BACKEND
// ==============================================

/**
* Función para obtener las 4 mascotas más recientes desde el backend.
* Nota: El endpoint ahora es '/home2nd' que ya aplica el LIMIT 4.
*/
const scrollToSection = (selector) => {
    // 1. Busca el elemento en el DOM
    const targetElement = document.querySelector(selector);
    
    // 2. Si el elemento existe, aplica el desplazamiento suave
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth', // Esto hace la animación lenta
            block: 'start'      // Asegura que el elemento quede en la parte superior de la vista
        });
        
        // Opcional: Actualiza la URL para mostrar el ancla sin recargar
        // window.history.pushState(null, null, selector);
    }
};

async function getMascotasRecientes() {
    isLoading.value = true;
    try {
        // Usamos el endpoint que configuraste para obtener SOLO los 4 más recientes
        const response = await fetch('http://localhost:3000/api/mascotas/home2nd', { 
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authStore.token}` 
            },
        });

        if (!response.ok) {
            throw new Error('Error al cargar las mascotas: ' + response.statusText);
        }

        const data = await response.json();
        
        if (data.length === 0) {
            // Fallback: Usar mocks si no hay datos.
            mascotas.value = createMockMascotas(4); 
        } else {
            mascotas.value = data;
        }
        
    } catch (error) {
        console.error("Error al obtener las mascotas:", error);
        // Fallback a datos simulados en caso de error
        mascotas.value = createMockMascotas(4); 
    } finally {
        isLoading.value = false;
    }
}

// Llama a la función al cargar el componente
onMounted(() => {
    if (!authStore.token) {
        authStore.loadTokenFromLocalStorage();
    }
    getMascotasRecientes();
});


// ==============================================
// UTILIDADES DE VISUALIZACIÓN
// ==============================================

/**
* Función para simular datos de mascotas si la base de datos no funciona.
*/
function createMockMascotas(count) {
    const mockData = [];
    const names = ["Max", "Luna", "Rocky", "Bella"];
    const breeds = ["Labrador", "Mestizo", "Poodle", "Pastor Alemán"];
    const sizes = ["Pequeño", "Mediano", "Grande"];
    const imageBaseUrl = 'https://placehold.co/400x400/FF9933/FFFFFF/png?text=';

    for (let i = 0; i < count; i++) {
        const name = names[i % names.length];
        const ageMonths = (i + 1) * 6; // Edad de ejemplo
        
        mockData.push({
            idxxxx_mascot: i + 1, // Usando la columna de tu consulta SQL
            nombre_mascot: name,
            especi_mascot: i % 2 === 0 ? 'Perro' : 'Gato',
            sexoxx_mascot: i % 4 < 2 ? 'Macho' : 'Hembra',
            edadme_mascot: ageMonths, 
            razaxx_mascot: breeds[i % breeds.length], // Usando la columna de tu consulta SQL
            tamano_mascot: sizes[i % sizes.length],
            image1_mascot: `${imageBaseUrl}${name.replace(' ', '+')}`,
        });
    }
    return mockData;
}

/**
* Convierte edad en meses a formato legible (años y meses).
*/
function formatAge(months) {
    if (months < 12) {
        return `${months} meses`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
        return `${years} años`;
    }
    return `${years}a ${remainingMonths}m`;
}

// ==============================================
// COMPONENTE DE TARJETA (PetCard)
// ==============================================

/**
* Componente funcional para renderizar una tarjeta de mascota.
* Utiliza las propiedades recibidas de tu consulta SQL.
*/
const PetCard = ({ mascota }) => {
    const ageDisplay = formatAge(mascota.edadme_mascot);
    const imageUrl = mascota.image1_mascot || `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`;

    // NOTA: Se mantienen las clases genéricas 'pet-card-*' para que uses tu propio CSS/
    const navigateToProfile = () => {
        isNavigating.value = true; 
        // Utilizamos el router del componente padre
        router.push(`/card/${mascota.id || mascota.idxxxx_mascot}`);
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
                h('span', { class: 'chip chip-grey ' }, mascota.razaxx_mascot || 'Mestizo'),
            ])
            
        ]),
            
        // Botón
        h('div', { class: 'pet-card-content-button ' }, [
        h('button', { 
                class: 'pet-card-button',
                onClick: navigateToProfile,
                // AÑADIR: La propiedad 'disabled' usa el valor de isNavigating
                disabled: isNavigating.value // <--- USA .value para acceder al valor
            }, isNavigating.value ? 'Cargando...' : 'Ver más')
        ])
    ]);
};
</script>

<style scoped>
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: #FF3D00 transparent;
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

.home-page {
  min-height: 100vh;
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
}

.page-header {
  padding: 2.5rem 0;
  margin-bottom: 2rem;
  display: flex;
}

.title-section{
  flex: 2;
  padding-left: 50px;
  height: auto;
  display: flex; 
  justify-content: center; 
 
  flex-direction: column;
}

.page-title-1st {
  text-align: left;
  font-size: 4.5rem;
  font-weight: 800;
  color: #333;
  margin: 0;
  letter-spacing: 2px;
}

.page-title-2nd {
  text-align: left;
  font-size: 4.5rem;
  font-weight: 800;
  color: #ffbdbd;
  margin: 0;
  letter-spacing: 2px;
}

.page-title-3rd{
  font-weight: 700;
  font-size: 2.0rem;
}

.explore-button{
  /* Fondo y color del texto */
  background-color: #ff9595; 
  color: white; 
  border: none; 
  border-radius: 50px; 
  margin-top: 25px;
  padding: 15px 40px; 
  width: 40%;
  font-family: sans-serif; 
  font-size: 30px; 
  font-weight: bold; 
  text-align: center;  
  text-decoration: none; 
  cursor: pointer; 
  transition: background-color 0.3s ease;
  box-shadow: 0px 2px 3px 2px rgba(0,0,0,0.5);

}

.explore-button:hover {
  background-color: #ff6060; /* Un naranja ligeramente más oscuro al pasar el ratón */
}

.image-section{
  display: flex;
  flex: 3;

}

.mascot-image{
  width: 100%;
  height: 100%;
}



.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.title-adopt-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title-adopt-section h2 {
  font-size: 2rem;
  font-weight: 800; 
  color: #000000;
  margin-bottom: 1rem;
  padding-top: 3.5rem;
}



@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}

</style>

<style scoped>
/* Colores y Variables */
.paw-icon-color {
    color: #FF9933; /* Naranja principal */
}
.button-orange {
    background-color: #ff9595;
    transition-property: background-color;
    transition-duration: 300ms;
}
.button-orange:hover {
    background-color: #ff6060;
}

/* ==============================================
    1. LAYOUT Y ENCABEZADO
    ============================================== */

.adoption-feed-container {
    min-height: 100vh;
    background-color: #f9fafb; /* gray-50 */
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
    padding-bottom: 4rem;
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
    color: #ff9595; /* Naranja principal */
    margin-right: 0.5rem;
    margin-left: 0.5rem;
    margin-top: -0.25rem;
}

.subtitle {
    font-size: 1.25rem; /* text-xl */
    line-height: 1.75rem;
    color: #4b5563; /* gray-600 */
    text-align: center;
    margin-bottom: 2rem;
}

/* ==============================================
    2. BARRA DE FILTROS (Filter Bar)
    ============================================== */

.filter-bar {
    background-color: #ffffff; /* bg-white */
    padding: 1rem;
    border-radius: 1rem; /* rounded-2xl */
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border-bottom: 1px solid #e0e7ff; /* border-indigo-100 */
    margin-bottom: 2rem;
}

.filter-label {
    font-size: 1.125rem; /* text-lg */
    font-weight: 600; /* font-semibold */
    color: #374151; /* gray-700 */
    display: none;
}
@media (min-width: 640px) { /* sm */
    .filter-label {
        display: block;
    }
}

.filter-select {
    padding: 0.5rem 1rem;
    border-radius: 9999px; /* rounded-full */
    border: 2px solid #d1d5db; /* border-gray-300 */
    background-color: #ffffff; /* bg-white */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
    transition: all 200ms ease;
    cursor: pointer;
    font-size: 0.875rem; /* text-sm */
    width: 12.2%;
}

.filter-select:focus {
    border-color: #FF9933; /* focus:border-[#FF9933] */
    box-shadow: 0 0 0 1px #FF9933; /* focus:ring-[#FF9933] */
    outline: none;
}

.search-input-container {
    position: relative;
    flex-grow: 1;
    max-width: 18rem; /* max-w-sm */
    width: 100%;
}

.search-input {
    width: 100%;
    padding: 0.5rem 1rem 0.5rem 2.5rem; /* py-2 pl-10 pr-4 */
    border-radius: 9999px; /* rounded-full */
    border: 2px solid #d1d5db; /* border-gray-300 */
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); /* shadow-inner */
    transition: all 200ms ease;
}

.search-input:focus {
    border-color: #6366f1; /* focus:border-indigo-500 */
    box-shadow: 0 0 0 1px #6366f1; /* focus:ring-indigo-500 */
    outline: none;
}

.search-icon {
    position: absolute;
    left: 0.75rem; /* left-3 */
    top: 50%;
    transform: translateY(-50%);
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af; /* text-gray-400 */
}

.clear-filters-button {
    padding: 0.5rem 1rem;
    border-radius: 9999px; /* rounded-full */
    font-size: 0.875rem; /* text-sm */
    font-weight: 600; /* font-semibold */
    color: #374151; /* text-gray-700 */
    border: 1px solid #d1d5db; /* border-gray-300 */
    transition: all 200ms ease;
    cursor: pointer;
    background-color: transparent;
}

.clear-filters-button:hover {
    background-color: #f3f4f6; /* hover:bg-gray-100 */
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

/****************************** */

/* Contenedor principal del grid de 2 columnas */
.adopcion-grid {
    /* Clases equivalentes a: grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 rounded-xl shadow-2xl overflow-hidden max-w-6xl mx-auto */
    display: grid;
    grid-template-columns: 1fr; /* Una columna por defecto */
    gap: 2rem; /* gap-8 */
    width: 70%;
    margin-left: auto;
    margin-right: auto;
    border-radius: 0.75rem; /* rounded-xl */
    box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.332);
    overflow: hidden;
    
}

.experience-cont {
    /* Clases equivalentes a: grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 rounded-xl shadow-2xl overflow-hidden max-w-6xl mx-auto */
    display: grid;
    grid-template-columns: 1fr; /* Una columna por defecto */
    gap: 2rem; /* gap-8 */
    width: 50%;
    margin-left: auto;
    margin-right: auto;
    border-radius: 0.75rem; /* rounded-xl */
    box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.332);
    overflow: hidden;
    
}



.experience-img{
    display: flex;
    position: relative;
    min-height: 350px;
    background-image: url('../assets/cat-and-dog-exp.jpg');
    background-size: cover;
    align-items: end;
}

.experience-tittle{
    flex: 1;
    align-items: center;
    margin-left: 25px;
    align-content: center;
}

.experience-button{  
    flex: 1;
    text-align: center;
}

/* Solo en pantallas grandes (lg) */
@media (min-width: 1024px) {
    .adopcion-grid {
        grid-template-columns: 1fr 1fr; /* Dos columnas */
        gap: 0;
    }
}

/* ----------------------------------------
 * 2. Estilos de la Imagen
 * ----------------------------------------
 */

.adopcion-imagen-container {
    /* Clases equivalentes a: relative min-h-[300px] lg:min-h-full */
    position: relative;
    min-height: 100px;
    max-height: 350px;
}



.adopcion-imagen {
    /* Clases equivalentes a: w-full h-full object-cover */
    width: 100%;
    height: 100%;
    object-fit: cover;
}


/* ----------------------------------------
 * 3. Estilos del Bloque de Pasos (Naranja)
 * ----------------------------------------
 */

.adopcion-pasos-container {
    
    color: rgb(0, 0, 0);
    padding: 2rem; /* p-8 */
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100px;
    max-height: 350px;
}



/* Ajustes de padding para tablets (sm y lg) */
@media (min-width: 640px) {
    .adopcion-pasos-container {
        padding: 3rem; /* sm:p-12 */
    }
}
@media (min-width: 1024px) {
    .adopcion-pasos-container {
        padding: 4rem; /* lg:p-16 */
    }
}

/* ----------------------------------------
 * 4. Estilos de la Lista y Pasos
 * ----------------------------------------
 */
.container-3{
  align-items: center;
  justify-items: center;
  height: auto;
  margin-bottom: 50px;
}

 .container-3 h2{
  color: black;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 50px;
 }

 .container-4{
    align-items: center;
    justify-items: center;
    height: auto;
    margin-bottom: 50px;
}

.experience-primary{
    display: flex;
    width: 70%;
}

 .container-4 h2{
color: black;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 20px;
  text-align: center;

 }
 .container-4 h1{
  color: #ff9595;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
 }

 .container-4 p{
  color: #000000;
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
 }


.adopcion-lista {
    /* Clases equivalentes a: space-y-6 text-xl sm:text-2xl font-semibold list-none */
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 1rem; /* text-xl */
    font-weight: 600; /* font-semibold */
}


.paso-item {
    /* Clases equivalentes a: flex items-start */
    display: flex;
    align-items: flex-start;
    font-size: 1.3rem;
}

.paso-numero {
    /* Clases equivalentes a: mr-3 font-extrabold text-orange-900 text-3xl */
    color: #000000; /* text-orange-900 */
    font-weight: 800; /* font-extrabold */
    font-size: 1.3rem; /* text-3xl */
    margin-right: 0.75rem; /* mr-3 */
}

/* Ajuste de tamaño de fuente para tablets (sm) */
@media (min-width: 640px) {
    .adopcion-lista {
        font-size: 1rem; /* sm:text-2xl */
    }
}

/* ----------------------------------------
 * 5. Estilos del Botón
 * ----------------------------------------
 */

.adopcion-boton {
    /* Clases equivalentes a: mt-10 inline-flex items-center justify-center w-max px-6 py-3 text-lg font-bold text-orange-600 bg-white rounded-full shadow-lg */
    margin-top: 2.5rem; /* mt-10 */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: max-content;
    padding: 0.75rem 1.5rem; /* px-6 py-3 */
    font-size: 1.125rem; /* text-lg */
    font-weight: 700; /* font-bold */
    color: #ffffff; /* text-orange-600 */
    background-color: #ff9595; /* bg-white */
    border-radius: 25px; /* rounded-full */
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
    transition: background-color 0.3s; /* transition duration-300 */
    text-decoration: none; /* Asegura que no tenga subrayado de enlace */
}

.adopcion-boton:hover {
    background-color: #ff6060; /* hover:bg-gray-100 */
}

.boton-icono {
    /* Clases equivalentes a: ml-2 w-5 h-5 */
    margin-left: 0.5rem; /* ml-2 */
    width: 1.25rem; /* w-5 */
    height: 1.25rem; /* h-5 */
}


</style>