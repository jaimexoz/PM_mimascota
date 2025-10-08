<template>
    <div class="adoption-page">
        <Navbar />

        <div class="max-w-4xl mx-auto p-4">
            <button @click="irAtras" class="back-button">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Regresar
            </button>
        </div>
        
        <div class="content-wrapper">
            <h1 class="main-title">
                <PawPrint class="paw-icon-main" />
                Formulario de Adopción Enviado
                <PawPrint class="paw-icon-main" />
            </h1>
            
            <div class="view-mode-alert">
               <p class="font-semibold">Modo Visualización: Este formulario ya fue enviado y no puede ser modificado.</p>
            </div>

            <div v-if="isLoadingForm || isLoadingMascota" class="loading-state">
                 <Loader class="loading-icon animate-spin" />
                 <p>Cargando datos del formulario...</p>
            </div>
            
            <div v-else-if="formError" class="error-load-state">
                 <p class="font-semibold text-red-600">🚨 Error al cargar el formulario: {{ formError }}</p>
                 <p class="text-sm text-gray-600">Por favor, inténtelo de nuevo más tarde o contacte a soporte.</p>
            </div>

            <div v-if="mascota && !formError" class="mascot-profile-section">
                <div class="mascot-card-header">
                    <img :src="mascota.image1_mascot || 'https://placehold.co/150x150/9933FF/FFFFFF/png?text=Sin+Foto'" 
                        alt="Foto de la mascota" 
                        class="mascot-image" />
                    <div class="mascot-details">
                        <h2>{{ mascota.nombre_mascot }}</h2>
                        <p class="status-badge">{{ mascota.status_mascot }}</p> 
                        <p>{{ mascota.sexoxx_mascot }}</p>
                        <p>{{ formatAge(mascota.edadme_mascot) }}</p>
                        <p>{{ mascota.pesokg_mascot }}kg</p>
                    </div>
                </div>
            </div>
            
            <form v-if="!formError && !isLoadingForm" class="adoption-form">
                
                <div class="form-section">
                    <h2>Información Personal y de Contacto</h2>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="cedula">Cédula</label>
                            <input type="text" id="cedula" v-model="formData.cedula_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="nombres">Nombres</label>
                            <input type="text" id="nombres" v-model="formData.nombre_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="fechaNacimiento">Fecha de nacimiento</label>
                            <input type="date" id="fechaNacimiento" v-model="formData.fnacim_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="correo">Correo electrónico</label>
                            <input type="email" id="correo" v-model="formData.correo_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="telefono">Teléfono</label>
                            <input type="tel" id="telefono" v-model="formData.telefo_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="status">Estado de la Solicitud</label>
                            <input type="text" id="status" :value="formData.status_forado || 'Pendiente'" disabled />
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Información sobre la Vivienda y Entorno</h2>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="tipoVivienda">Tipo de vivienda</label>
                            <input type="text" id="tipoVivienda" v-model="formData.tvivie_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label>¿Es propietario o alquila?</label>
                            <input type="text" :value="formData.propie_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label>¿Tiene patio o jardín?</label>
                            <input type="text" :value="formData.patjar_forado ? 'Sí' : (formData.patjar_forado === false ? 'No' : 'N/A')" disabled />
                        </div>
                        <div class="form-group">
                            <label for="tamanoPatio">Tamaño del patio o jardín</label>
                            <input type="text" id="tamanoPatio" v-model="formData.tampat_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="numPersonas">Número de personas que viven en la casa</label>
                            <input type="number" id="numPersonas" v-model.number="formData.nperca_forado" disabled />
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Experiencia con Mascotas</h2>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>¿Ha tenido mascotas antes?</label>
                            <input type="text" :value="formData.masant_forado ? 'Sí' : (formData.masant_forado === false ? 'No' : 'N/A')" disabled />
                        </div>
                        <div class="form-group">
                            <label>¿Actualmente tiene otras mascotas?</label>
                            <input type="text" :value="formData.otrmas_forado ? 'Sí' : (formData.otrmas_forado === false ? 'No' : 'N/A')" disabled />
                        </div>
                        <div class="form-group">
                            <label for="numMascotas">¿Cuántas mascotas tiene?</label>
                            <input type="number" id="numMascotas" v-model.number="formData.nmasco_forado" disabled />
                        </div>
                        <div class="form-group full-width">
                            <label for="motivoAdopcion">Motivo de la Adopción</label>
                            <textarea id="motivoAdopcion" v-model="formData.motivo_forado" disabled rows="3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Cuidado y Compromiso</h2>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="ubicacionMascota">Ubicación de la Mascota</label>
                            <input type="text" id="ubicacionMascota" v-model="formData.ubimas_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label for="horasSola">Horas al día sola</label>
                            <input type="number" id="horasSola" v-model.number="formData.horasl_forado" disabled />
                        </div>
                        <div class="form-group full-width">
                            <label for="encargadoCuidado">Encargado de los Cuidados Básicos</label>
                            <input type="text" id="encargadoCuidado" v-model="formData.encarg_forado" disabled />
                        </div>
                        <div class="form-group">
                            <label>¿Tiene un veterinario de confianza?</label>
                            <input type="text" :value="formData.veteri_forado ? 'Sí' : (formData.veteri_forado === false ? 'No' : 'N/A')" disabled />
                        </div>
                        <div class="form-group">
                            <label>¿Dispone a cubrir los gastos?</label>
                            <input type="text" :value="formData.gastos_forado ? 'Sí' : (formData.gastos_forado === false ? 'No' : 'N/A')" disabled />
                        </div>
                    </div>
                </div>
            </form>
            
        </div>
    </div>
</template>
  
<script setup>
import Navbar from '../components/Navbar.vue';
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PawPrint, Loader } from 'lucide-vue-next';
import { useAuthStore } from "@/stores/authStore"; 

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Parámetro CLAVE para este componente
const formId = ref(route.params.formId); 

const mascota = ref(null);
const isLoadingMascota = ref(false); // Solo se carga después de tener el form
const isLoadingForm = ref(true); // Empezamos cargando el form
const formError = ref(null);

// Estado del formulario (solo para mostrar)
const formData = reactive({
    // Inicialización de todas las propiedades de tu formularioAdopcion (image_ef3bc6.png)
    cedula_forado: '',
    nombre_forado: '',
    fnacim_forado: '', 
    correo_forado: '',
    telefo_forado: '',
    tvivie_forado: '',
    propie_forado: '', 
    patjar_forado: null, 
    tampat_forado: '',
    nperca_forado: null,
    masant_forado: null, 
    otrmas_forado: null, 
    nmasco_forado: null,
    motivo_forado: '',
    ubimas_forado: '', 
    horasl_forado: null,
    encarg_forado: '',
    veteri_forado: null, 
    gastos_forado: null, 
    status_forado: '',
    forane_mascot_id: null, // Necesario para cargar la mascota
});

// Función para el botón Regresar
const irAtras = () => {
    router.back(); 
};

// Función de utilidad
function formatAge(months) {
    if (months === null || months === undefined) return 'Edad desconocida';
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


// Función para obtener los datos de la mascota (simplificada)
const getMascotaDetails = async (mascotId) => {
    isLoadingMascota.value = true;
    try {
        const response = await fetch(`http://localhost:3000/api/mascotas/shortcard/${mascotId}`); 
        if (!response.ok) {
            throw new Error('Error al cargar la mascota asociada.');
        }
        mascota.value = await response.json();
    } catch (error) {
        console.error("Error al obtener detalles de la mascota:", error);
        formError.value = "No se pudo cargar la información de la mascota asociada al formulario.";
    } finally {
        isLoadingMascota.value = false;
    }
}


// Función PRINCIPAL para obtener el formulario enviado
const fetchFormData = async (id) => {
    isLoadingForm.value = true;
    const userToken = authStore.token;
    
    if (!userToken || !id) {
        formError.value = "No se encontró el ID del formulario o el token de autenticación.";
        router.push('/login');
        isLoadingForm.value = false;
        return;
    }
    
    try {
        // 🚨 URL CLAVE: Debe coincidir con tu adoptionRoutes.js (router.get('/form/:formId', ...))
        const response = await fetch(`http://localhost:3000/api/adoptions/form/${id}`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`, 
            },
        });

        if (response.status === 401) {
            authStore.logout();
            router.push('/login');
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar datos del formulario existente.');
        }
        
        const data = await response.json();

        if (data.fnacim_forado) {
            // Si el backend devuelve un timestamp (ej. "2000-01-01T05:00:00.000Z")
            // Tomamos solo la parte de la fecha (YYYY-MM-DD)
            data.fnacim_forado = data.fnacim_forado.substring(0, 10);
        }
        
        // Cargar los datos del formulario
        Object.assign(formData, data);
        
        // Cargar los datos de la mascota asociada usando el ID que viene en el formulario
        if (data.forane_mascot_id) {
            await getMascotaDetails(data.forane_mascot_id); 
        }

    } catch (error) {
        console.error('Error en fetchFormData:', error);
        formError.value = error.message; // Mostrar el error en la vista
    } finally {
        isLoadingForm.value = false;
    }
};

// Se ejecuta al montar el componente
onMounted(() => {
    if (formId.value) {
        fetchFormData(formId.value);
    } else {
        formError.value = "ID de formulario no encontrado en la URL. Revise la navegación.";
        isLoadingForm.value = false;
    }
});
</script>

<style scoped>
/* Agrega aquí los estilos CSS que tenías en adoptForm.vue, 
como .adoption-page, .content-wrapper, .main-title, .form-section, etc. */

.view-mode-alert {
    background-color: #ffe0b2; /* Tono naranja suave para alerta */
    border: 1px solid #ff9800;
    color: #e65100;
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

/* Asegúrate de que los inputs disabled se vean bien para solo lectura */
input[disabled], textarea[disabled] {
    background-color: #f5f5f5;
    color: #444;
    cursor: default;
}

/* Estilos básicos para el formulario (usa Tailwind o tu CSS global para más detalle) */
.adoption-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f8f8;
}

.content-wrapper {
  max-width: 900px;
  margin: 2rem auto;
  margin-top: 110px;
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.main-title {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  gap: 10px;
}

.paw-icon-main {
  width: 30px;
  height: 30px;
  color: #ff9933; /* Color naranja */
}

/* Sección de la Mascota */
.mascot-profile-section {
  background-color: #ffe6cc; /* Fondo naranja claro */
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.mascot-card-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.mascot-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ff9933; /* Borde naranja */
}

.mascot-details h2 {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.mascot-details p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 0.3rem;
}

/* Formulario */
.adoption-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  background-color: #fefefe;
}

.form-section h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #ff9933;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.6rem;
  color: #444;
  font-size: 0.95rem;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="date"],
.form-group input[type="number"],
.form-group textarea {
    height: 40px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box; /* Asegura que padding no aumente el width */
  transition: border-color 0.2s;
}

.form-group input[type="text"]{
    margin-left: 0px;
    margin-top: 0px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff9933;
  box-shadow: 0 0 0 2px rgba(255, 153, 51, 0.2);
}

.form-group input[disabled] {
    height: 40px;
  background-color: #f0f0f0;
  cursor: not-allowed;
}

.radio-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.radio-group input[type="radio"] {
  margin-right: 0.3rem;
}

.full-width {
  grid-column: 1 / -1; /* Ocupa todo el ancho en el grid */
}

.submit-button {
  background-color: #ff9933; /* Naranja */
  color: white;
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  margin-top: 1rem;
  align-self: flex-end; /* Alinea el botón a la derecha */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-button:hover {
  background-color: #e68a2e; /* Naranja más oscuro */
  transform: translateY(-2px);
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading-state, .error-state {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-icon {
  width: 30px;
  height: 30px;
  color: #ff9933;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Media Queries para responsividad */
@media (max-width: 768px) {
  .content-wrapper {
    margin: 1rem;
    padding: 1.5rem;
  }

  .main-title {
    font-size: 2rem;
  }

  .mascot-card-header {
    flex-direction: column;
    text-align: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>