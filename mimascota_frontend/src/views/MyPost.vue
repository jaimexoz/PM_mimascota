<template>
    <div class="adoption-feed-container">
  
    <Navbar /> 
    <button @click="irAtras" class="back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Volver
                </button>
    <!-- 1. ENCABEZADO Y FILTROS -->
    <div class="content-wrapper">
        <h1 class="main-title">
            <PawPrint class="paw-icon-main" />
            Encuentra a todas tus mascotas aquí
            <PawPrint class="paw-icon-main" />
        </h1>
        
  
        <!-- BARRA DE FILTROS -->
        <div class="filter-bar"> 
            <!-- Barra de Búsqueda -->
            <div class="search-input-container">
                <input type="text" v-model="filters.busqueda"
                    placeholder="Buscar por nombre..."
                    class="search-input">
                <Search class="search-icon" />
            </div>
            
            <!-- Botón Limpiar Filtros -->
            <button @click="clearFilters" class="clear-filters-button">
                Limpiar
            </button>
        </div>
        <!-- FIN BARRA DE FILTROS -->
    </div>
  
    <!-- 2. CONTENIDO PRINCIPAL (FEED DE MASCOTAS) -->
    <div class="content-wrapper feed-content">
    
        <!-- Estado de Carga -->
        <div v-if="isLoading" class="loading-message">
            <span class="loader"></span>
        </div>
  
        <!-- Resultados del Filtro -->
        <div v-else-if="applyFilters.length > 0" class="pet-card-grid">
            
            <!-- Componente dinámico de tarjeta de mascota -->
            <PetCard v-for="mascota in applyFilters" :key="mascota.id" :mascota="mascota" />
        </div>
  
        <!-- Sin Resultados -->
        <div v-else class="no-results-state">
            <h2 class="no-results-title">¡Vaya! No encontramos mascotas con esos filtros.</h2>
            <p class="no-results-text">Intenta ajustar tus criterios de búsqueda o limpiar los filtros.</p>
            <button @click="clearFilters" class="show-all-button">
                Mostrar todas las mascotas
            </button>
        </div>
    </div>
    <Footer/>
  </div>

  
  </template>
  
  <script setup>
  import Navbar from '../components/Navbar.vue';
  import Footer from '@/components/Footer.vue';
  import { ref, onMounted, computed, reactive, h } from 'vue';
  import { PawPrint, Search, Loader } from 'lucide-vue-next';
  import { useRouter } from 'vue-router'; 
  import { apiUrl } from '@/config/api';

  import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
  
  // Inicialización
  const router = useRouter(); 
  const mascotas = ref([]);
  const isLoading = ref(true);
  
  // Estado de los filtros y búsqueda
  const filters = reactive({
    edad: '',
    sexo: '',
    tamano: '',
    orden: 'mas_recientes', 
    busqueda: ''
  });
  

  async function getMascotas() {
    isLoading.value = true;
    const startTime = Date.now();
    const userToken = authStore.token;
    
    if (!userToken) {
        // Manejar el caso de que no haya token (usuario no autenticado)
        console.error("Usuario no autenticado. No se puede cargar la lista de favoritos.");
        // Opcional: Redirigir al login
        // router.push('/login'); 
        isLoading.value = false;
        return;
    }

    try {
        // ✅ CORRECCIÓN: Llama a la ruta que devuelve la lista de favoritos del usuario.
        // No necesitas pasar un ID de mascota.
        const response = await fetch(apiUrl('/mascotas/MypostUser'), { 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los favoritos: ' + response.statusText);
        }

        const data = await response.json();
        
        // Asignar los datos recibidos a 'mascotas.value'
        if (data.length === 0) {
            // Mostrar estado vacío o usar mocks
            mascotas.value = []; 
        } else {
            mascotas.value = data;
        }
        
    } catch (error) {
        console.error("Error al obtener las mascotas favoritas:", error);
        mascotas.value = [];
    } finally {
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000; 
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
            isLoading.value = false;
        }, remainingTime);
    }
}
  
  /**
  * Función de filtrado y ordenamiento principal.
  * Se ejecuta automáticamente cuando cambian los filtros.
  */
  const applyFilters = computed(() => {
    let results = [...mascotas.value];
  
    // 1. FILTRADO POR BÚSQUEDA (Nombre o Raza)
    if (filters.busqueda) {
        const busquedaLower = filters.busqueda.toLowerCase();
        results = results.filter(m => 
            (m.nombre_mascot && m.nombre_mascot.toLowerCase().includes(busquedaLower)) ||
            (m.raza_mascot && m.raza_mascot.toLowerCase().includes(busquedaLower))
        );
    }
    
    // 2. FILTRADO POR SEXO
    if (filters.sexo) {
        results = results.filter(m => m.sexoxx_mascot === filters.sexo);
    }
  
    // 3. FILTRADO POR TAMAÑO
    if (filters.tamano) {
        results = results.filter(m => m.tamano_mascot === filters.tamano);
    }
  
    // 4. FILTRADO POR EDAD (Asume 'edadme_mascot' está en meses)
    if (filters.edad) {
        results = results.filter(m => {
            const edadMeses = m.edadme_mascot; 
            switch (filters.edad) {
                case 'Cachorro (0-12m)': return edadMeses >= 0 && edadMeses <= 12;
                case 'Joven (1-3a)': return edadMeses > 12 && edadMeses <= 36;
                case 'Adulto (+3a)': return edadMeses > 36;
                default: return true;
            }
        });
    }
  

    return results;
    });
  
  /**
  * Función para limpiar todos los filtros
  */
  function clearFilters() {
    Object.assign(filters, {
        edad: '',
        sexo: '',
        tamano: '',
        orden: 'mas_recientes',
        busqueda: ''
    });
  }

  function irAtras() {
    window.history.back();
}
  
  // Llama a la función al cargar el componente
  onMounted(() => {
    getMascotas();
  });
  
  
  // ==============================================
  // 2. UTILIDADES DE VISUALIZACIÓN
  // ==============================================
  

  
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
    return `${years} a ${remainingMonths} m`;
  }
  
  /**
  * Componente funcional para renderizar una tarjeta de mascota.
  * Se han movido las clases de Tailwind a PetCard classes y chips.
  */
  const PetCard = ({ mascota }) => {
    const ageDisplay = formatAge(mascota.edadme_mascot);
    const imageUrl = mascota.image1_mascot || `https://placehold.co/400x400/9933FF/FFFFFF/png?text=Sin+Foto`;
  
    
    // ⚠️ ERROR CORREGIDO: navigateToProfile NO DEBE SER UNA FUNCIÓN NUEVA DENTRO DE ESTA FUNCIÓN. 
    // DEBE SER UNA FUNCIÓN QUE RETORNA OTRA FUNCIÓN PARA EL ONCLICK.
    const navigateToProfile = () => {
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
                h('span', { class: 'chip chip-grey' }, mascota.razaxx_mascot || 'Mestizo'),
            ])
            
        ]),
            
        h('div', { class: 'pet-card-content-button' }, [
            // Botón Ver Perfil
            h('button', { 
              class: 'pet-card-button',
              // ⚠️ CORRECCIÓN CLAVE: Pasamos la referencia a la función, no la LLAMAMOS inmediatamente.
              onClick: navigateToProfile 
            }, 'Ver más')
          ])
  
    ]);
  };
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
    font-weight: 800; /* font-extrabold */
    color: #111827; /* gray-900 */
    text-align: center;
    margin-bottom: 2rem;
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
    appearance: base-select;
    
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
    border-color: #ff9595;  /* focus:border-indigo-500 */
    box-shadow: 0 0 0 1px #ff9595;  /* focus:ring-indigo-500 */
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
</style>