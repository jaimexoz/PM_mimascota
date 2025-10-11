<template>
  <div class="adoption-page">
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
        Formulario de Adopción
        <PawPrint class="paw-icon-main" />
      </h1>

      <div v-if="mascota" class="mascot-profile-section">
        <div class="mascot-card-header">
          <img :src="mascota.image1_mascot || 'https://placehold.co/150x150/9933FF/FFFFFF/png?text=Sin+Foto'" 
               alt="Foto de la mascota" 
               class="mascot-image" />
          <div class="mascot-details">
            <h2>{{ mascota.nombre_mascot }}</h2>
            <p>{{ mascota.sexoxx_mascot }}</p>
            <p>{{ formatAge(mascota.edadme_mascot) }}</p>
            <p>{{ mascota.pesokg_mascot }}kg</p>
          </div>
        </div>
      </div>
      <div v-else-if="isLoadingMascota" class="loading-state">
        <Loader class="loading-icon animate-spin" />
        <p>Cargando datos de la mascota...</p>
      </div>
      <div v-else class="error-state">
        <p>No se pudo cargar la información de la mascota.</p>
      </div>

      <form @submit.prevent="submitForm" class="adoption-form">
        <div class="form-section">
          <h2>Información Personal y de Contacto</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="cedula">Cédula</label>
              <input type="text" id="cedula" v-model="formData.cedula_forado" required />
            </div>
            <div class="form-group">
              <label for="nombres">Nombres</label>
              <input type="text" id="nombres" v-model="formData.nombre_forado" required />
            </div>
            <div class="form-group">
              <label for="fechaNacimiento">Fecha de nacimiento</label>
              <input type="date" id="fechaNacimiento" v-model="formData.fnacim_forado" required />
            </div>
            <div class="form-group">
              <label for="correo">Correo electrónico</label>
              <input type="email" id="correo" v-model="formData.correo_forado" required />
            </div>
            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input type="tel" id="telefono" v-model="formData.telefo_forado" required />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Información sobre la Vivienda y Entorno</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="tipoVivienda">Tipo de vivienda</label>
              <input type="text" id="tipoVivienda" v-model="formData.tvivie_forado" placeholder="Casa, apartamento, etc." required />
            </div>
            <div class="form-group">
              <label>¿Es propietario o alquila?</label>
              <div class="radio-group">
                <input type="radio" id="propietario" value="Propietario" v-model="formData.propie_forado" required />
                <label for="propietario">Propietario</label>
                <input type="radio" id="alquila" value="Alquila" v-model="formData.propie_forado" />
                <label for="alquila">Alquila</label>
              </div>
            </div>
            <div class="form-group">
              <label>¿La vivienda tiene patio o jardín?</label>
              <div class="radio-group">
                <input type="radio" id="patioSi" :value="true" v-model="formData.patjar_forado" required />
                <label for="patioSi">Sí</label>
                <input type="radio" id="patioNo" :value="false" v-model="formData.patjar_forado" />
                <label for="patioNo">No</label>
              </div>
            </div>
            <div class="form-group">
              <label for="tamanoPatio">¿Qué tamaño tiene el patio o jardín?</label>
              <input type="text" id="tamanoPatio" v-model="formData.tampat_forado" :disabled="!formData.patjar_forado" placeholder="Pequeño, mediano, grande" />
            </div>
            <div class="form-group">
              <label for="numPersonas">Número de personas que viven en la casa</label>
              <input type="number" id="numPersonas" v-model.number="formData.nperca_forado" min="1" required />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Experiencia con Mascotas</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>¿Ha tenido mascotas antes?</label>
              <div class="radio-group">
                <input type="radio" id="mascotaAntesSi" :value="true" v-model="formData.masant_forado" required />
                <label for="mascotaAntesSi">Sí</label>
                <input type="radio" id="mascotaAntesNo" :value="false" v-model="formData.masant_forado" />
                <label for="mascotaAntesNo">No</label>
              </div>
            </div>
            <div class="form-group">
              <label>¿Actualmente tiene otras mascotas?</label>
              <div class="radio-group">
                <input type="radio" id="otrasMascotasSi" :value="true" v-model="formData.otrmas_forado" required />
                <label for="otrasMascotasSi">Sí</label>
                <input type="radio" id="otrasMascotasNo" :value="false" v-model="formData.otrmas_forado" />
                <label for="otrasMascotasNo">No</label>
              </div>
            </div>
            <div class="form-group">
              <label for="numMascotas">¿Cuántas mascotas tiene?</label>
              <input type="number" id="numMascotas" v-model.number="formData.nmasco_forado" :disabled="!formData.otrmas_forado" min="0" />
            </div>
            <div class="form-group full-width">
              <label for="motivoAdopcion">¿Por qué quiere adoptar una mascota?</label>
              <textarea id="motivoAdopcion" v-model="formData.motivo_forado" rows="3" required></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Cuidado y Compromiso</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="ubicacionMascota">¿La mascota estará dentro o fuera de la casa?</label>
              <input type="text" id="ubicacionMascota" v-model="formData.ubimas_forado" placeholder="Dentro, fuera, ambos" required />
            </div>
            <div class="form-group">
              <label for="horasSola">¿Cuántas horas al día la mascota estará sola?</label>
              <input type="number" id="horasSola" v-model.number="formData.horasl_forado" min="0" required />
            </div>
            <div class="form-group full-width">
              <label for="encargadoCuidado">¿Quién se encargará de los cuidados básicos?</label>
              <input type="text" id="encargadoCuidado" v-model="formData.encarg_forado" required />
            </div>
            <div class="form-group">
              <label>¿Tiene un veterinario de confianza?</label>
              <div class="radio-group">
                <input type="radio" id="veterinarioSi" :value="true" v-model="formData.veteri_forado" required />
                <label for="veterinarioSi">Sí</label>
                <input type="radio" id="veterinarioNo" :value="false" v-model="formData.veteri_forado" />
                <label for="veterinarioNo">No</label>
              </div>
            </div>
            <div class="form-group">
              <label>¿Está dispuesto a cubrir los gastos de la mascota?</label>
              <div class="radio-group">
                <input type="radio" id="gastosSi" :value="true" v-model="formData.gastos_forado" required />
                <label for="gastosSi">Sí</label>
                <input type="radio" id="gastosNo" :value="false" v-model="formData.gastos_forado" />
                <label for="gastosNo">No</label>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" class="submit-button" :disabled="isSubmitting">
          <Loader v-if="isSubmitting" class="loading-icon animate-spin" />
          {{ isSubmitting ? 'Enviando...' : 'Enviar' }}
        </button>
      </form>
    </div>

    <div v-if="modal.visible" class="modal-overlay">
    <div class="modal-content" :class="modal.tipo">
        <div class="modal-x">
            <button @click="cerrarModal" class="btn-x">
                X
            </button>
        </div>
        <div class="modal-header">
                <template v-if="modal.tipo === 'success'">
                    <h2>Su mascota ha sido añadida correctamente</h2>
                </template>
                <template v-if="modal.tipo === 'error'">
                    <h2>El archivo excede el tamaño (5MB)</h2>
                </template>
            
            
        </div>
        
        <div class="modal-actions">
            <button @click="cerrarModal" class="btn-primary">
                Aceptar
            </button>
        </div>
    </div>
</div>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue'; // Ajusta la ruta si es necesario
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PawPrint, Loader } from 'lucide-vue-next';
import { useAuthStore } from "@/stores/authStore"; // Asumiendo que tienes un store de autenticación

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const mascotId = ref(null);
const mascota = ref(null);
const isLoadingMascota = ref(true);
const isSubmitting = ref(false);

// Estado del formulario, mapeado directamente a los nombres de columna de tu tabla formularioAdopcion
const formData = reactive({
  cedula_forado: '',
  nombre_forado: '',
  fnacim_forado: '', // Formato YYYY-MM-DD para input[type="date"]
  correo_forado: '',
  telefo_forado: '',
  tvivie_forado: '',
  propie_forado: '', // "Propietario" o "Alquila"
  patjar_forado: null, // true/false
  tampat_forado: '',
  nperca_forado: null,
  masant_forado: null, // true/false
  otrmas_forado: null, // true/false
  nmasco_forado: null,
  motivo_forado: '',
  ubimas_forado: '', // "Dentro", "Fuera", "Ambos"
  horasl_forado: null,
  encarg_forado: '',
  veteri_forado: null, // true/false
  gastos_forado: null, // true/false
  // status_forado: 'Pendiente', // El backend debería establecer esto
  // forane_usuari_id: null, // Lo obtiene el backend del token
  // forane_mascot_id: null, // Lo obtiene el backend de los parámetros
});

const modal = reactive({
    visible: false,
    mensaje: '',
    tipo: 'success' // 'success' o 'error'
});

function mostrarModal(msg, type) {
    modal.mensaje = msg;
    modal.tipo = type;
    modal.visible = true;
}

/**
 * Cierra el modal y redirige o resetea el formulario.
 */
function cerrarModal() {
    modal.visible = false;
    if (modal.tipo === 'success') {
        // Redirigir al perfil o a la lista de mascotas después del éxito
        router.push('/perfil');
    }else{
        window.location.reload();
    }
}
// Función para formatear la edad (ya la tenías en otros componentes)
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

// 1. Obtener los datos de la mascota al cargar la página
async function getMascotaDetails() {
  isLoadingMascota.value = true;
  mascotId.value = route.params.mascotId; // Obtener el ID de la URL
  
  if (!mascotId.value) {
    console.error('ID de mascota no encontrado en la URL.');
    isLoadingMascota.value = false;
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/mascotas/shortcard/${mascotId.value}`); // Endpoint para una sola mascota
    if (!response.ok) {
      throw new Error('Error al cargar la mascota: ' + response.statusText);
    }
    const data = await response.json();
    mascota.value = data;
  } catch (error) {
    console.error("Error al obtener detalles de la mascota:", error);
    alert('No se pudo cargar la información de la mascota.');
  } finally {
    isLoadingMascota.value = false;
  }
}

// 2. Enviar el formulario
async function submitForm() {
  isSubmitting.value = true;
  const userToken = authStore.token;

// ⭐️ Nuevo: Capturamos el objeto completo para diagnosticar mejor ⭐️
  const userObject = authStore.user;
  const userId = userObject?.id; // Obtener el ID de usuario del store

  // ⭐️ PASO DE DIAGNÓSTICO 1 (Inicio) ⭐️
  console.log("DIAGNÓSTICO AUTH STORE (Inicio de Función):");
  console.log("Token (Existe?):", !!userToken);
  console.log("User ID (Valor):", userId);     
  console.log("User Object (Estructura):", userObject);
  // ⭐️ FIN PASO DE DIAGNÓSTICO ⭐️

  // Si no tienes este bloque, vuelve a ponerlo
  if (!userToken) {
      console.error('DIAGNÓSTICO FALLA: userToken o userId es nulo/falso.');
      alert('Debes iniciar sesión para enviar un formulario de adopción.');
      router.push('/login'); // Redirigir al login
      isSubmitting.value = false;
      return;
  }

  if (!mascotId.value) {
    alert('No se pudo identificar la mascota. Intenta de nuevo.');
    isSubmitting.value = false;
    return;
  }
  console.log("User ID (Valor):", userId); 

  try {
      console.log("User ID (Valor):", userId); 
      const payload = {
        ...formData,
        // ⭐️ NOTA: El forane_usuari_id NO se envía. El backend lo obtiene del token.
        forane_mascot_id: mascotId.value, // ✅ Este SÍ debe enviarse.
      };

    console.log("User ID (Valor):", userId); 
    const response = await fetch('http://localhost:3000/api/adoptions', { // Nuevo endpoint para enviar formularios
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al enviar el formulario.');
    }

    mostrarModal('Se ha enviado su solicitud de adopción', 'success');

  } catch (error) {
    console.error('Error al enviar el formulario:', error);
    alert('Ocurrió un error al enviar tu formulario: ' + error.message);
  } finally {
    isSubmitting.value = false;
  }
}

function irAtras() {
    window.history.back();
}

// Se ejecuta al montar el componente
onMounted(() => {
  getMascotaDetails();
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
    margin-top: 110px;
    position: absolute;
}



.back-button:hover {
  background: #e9ecef;
  color: #495057;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
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
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box; /* Asegura que padding no aumente el width */
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff9933;
  box-shadow: 0 0 0 2px rgba(255, 153, 51, 0.2);
}

.form-group input[disabled] {
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
  background-color: #f47004; /* Naranja más oscuro */
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
/* Modal */

/* ESTILOS CSS PARA EL MODAL (Añadir en el bloque <style> o archivo CSS) */

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
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 400px;
    text-align: center;
    animation: fadeIn 0.3s ease-out;
    justify-items: center;
}

.modal-header {
  margin-top: 20px;
    margin-bottom: 20px;
}

.modal-header h2 {
    font-size: 1.4rem;
    color: #333;
    margin: 10px;
    font-weight: 700;
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

.btn-primary {
    margin-top: 20px;
    background: #FF9933;
    border-radius: 25px;
    margin-bottom: 10px;
    padding: 10px 25px;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
}

.btn-primary:hover{
    background: #f47004;
}

.modal-x{
  display: flex;
  width: 100%;
  justify-content: right;
  border-bottom: 1px solid #dbdbdb; 
  
}


.btn-x{
  color: #adadad;
  background: none;
  font-weight: 700;
  font-size: 1.5rem;
  border: none;
  margin-top: 5px;
  margin-right: 10px;
}


.btn-x:hover {
    color: #4f4f4f;
   
}

</style>