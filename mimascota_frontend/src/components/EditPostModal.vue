<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        <div class="edit-modal-container-main">

            <button type="button" class="edit-modal-close" @click="emit('close')" aria-label="Cerrar">
                            ×
            </button>
            <div class="edit-modal-container">
                        

                <div class="modal-header">        
                    <h2 class="modal-title">
                        <PawPrint class="paw-icon" />
                        Editar Publicación: {{ formData.nombre_mascot || 'Cargando...' }}
                        <PawPrint class="paw-icon" />
                    </h2>
                </div>

                <div v-if="isLoadingData" class="loading-modal-state">
                    <Loader class="loading-icon animate-spin" />
                    <p>Cargando datos de la mascota...</p>
                </div>
                
                <form v-else class="edit-form" @submit.prevent="saveChanges">
                    
                    <div class="form-content-wrapper">
                        <div class="info-section">
                            <h3>Información de la Mascota</h3>
                            
                            <label for="nombre">Nombre:</label>
                            <input type="text" id="nombre" v-model="formData.nombre_mascot" required>
                            
                            <div class="container-row"> 
            
                                <div class="container-col column-half"> 
                                    <label>Especie:</label>
                                    <div class="button-group">
                                        <button type="button" :class="{ active: formData.especi_mascot === 'Perro' }" @click="formData.especi_mascot = 'Perro'">Perro</button>
                                        <button type="button" :class="{ active: formData.especi_mascot === 'Gato' }" @click="formData.especi_mascot = 'Gato'">Gato</button>
                                    </div>
                                </div>

                                <div class="container-col column-half"> 
                                    <label>Sexo:</label>
                                    <div class="button-group">
                                        <button type="button" :class="{ active: formData.sexoxx_mascot === 'Macho' }" @click="formData.sexoxx_mascot = 'Macho'">Macho</button>
                                        <button type="button" :class="{ active: formData.sexoxx_mascot === 'Hembra' }" @click="formData.sexoxx_mascot = 'Hembra'">Hembra</button>
                                    </div>
                                </div>

                            </div>


                            <div class="column">

                            <div class="container-col">
                                <label for="edad">Edad (Meses):</label>
                                <input type="number" id="edad" v-model.number="formData.edadme_mascot" min="0">
                            </div>
                            
                            <div class="container-col">
                            <label for="raza">Raza:</label>
                            <input type="text" id="raza" v-model="formData.razaxx_mascot">
                            </div>
                            </div >

                            <div class="column">

                            <div class="container-col">
                            <label for="peso">Peso (kg):</label>
                            <input type="number" step="0.1" id="peso" v-model.number="formData.pesokg_mascot">
                            </div>

                            <div class="container-col">
                            <label for="tamano">Tamaño:</label>
                            <select id="tamano" v-model="formData.tamano_mascot">
                                <option value="Pequeño">Pequeño</option>
                                <option value="Mediano">Mediano</option>
                                <option value="Grande">Grande</option>
                            </select>
                            </div>
                            </div>

                            <div class="column">
                                <div class="container-col">
                                <label for="nivelenergia">Nivel de Energía:</label>
                                <select id="nivelenergia" v-model="formData.nenerg_mascot">
                                    <option value="Tranquilo">Tranquilo</option>
                                    <option value="Moderado">Moderado</option>
                                    <option value="Energético">Energético</option>
                                </select>
                                </div>
                            </div>
                            <h3 class="section-title">Personalidad y Temperamento</h3>

                            <div class="traits-container checkbox-grid">
                                <div v-for="rasgo in opcionesPersonalidad" :key="rasgo" class="trait-checkbox-wrapper">
                                    <input 
                                        type="checkbox" 
                                        :id="'trait-' + rasgo" 
                                        :value="rasgo" 
                                        @change="togglePersonalidad(rasgo)"
                                        :checked="formData.personalidad_array && formData.personalidad_array.includes(rasgo)"
                                        style="display: none;" 
                                    >
                                    
                                    <label 
                                        :for="'trait-' + rasgo" 
                                        class="trait-chip selectable-chip" 
                                        :class="{ 'is-selected': formData.personalidad_array && formData.personalidad_array.includes(rasgo) }"
                                    >
                                        {{ rasgo }}
                                    </label>
                                </div>
                            </div>
                        </div>


                        <div class="info-section">
                            <h3>Información adicional</h3>
                            <textarea v-model="formData.infoad_mascot" placeholder="Información de salud, historia, personalidad, temperamento..."></textarea>
                            
                            <div class="image-upload-container">
                                <h3>Fotos (Máx. 3)</h3>
                                <div class="image-previews">
                                    <div v-for="(image, index) in localImages" :key="index" class="image-wrapper">
                                        <button type="button" class="remove-image-btn" @click="removeImage(index)">×</button>
                                        <img :src="image" :alt="'Mascota foto ' + (index + 1)">
                                    </div>
                                    
                                    <div v-if="localImages.length < 3" class="add-image-wrapper">
                                        <label for="image-upload" class="add-image-btn">+</label>
                                        <input type="file" id="image-upload" accept="image/*" @change="addImage" style="display: none;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="save-button" :disabled="isSaving">
                        {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                </form>

                

            </div>
            <div v-if="modal.visible" class="confirmation-modal-wrapper">

                <div class="confirmation-modal-overlay" @click.self="cerrarModal"></div>

                <div class="modal-content-confirmacion" :class="modal.tipo">
                    <div class="modal-x">
                        <button @click="cerrarModal" class="close-button-confirmacion">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="modal-header-confirmacion">
                        <h2 class="modal-title-confirmacion">Resultado de la Edición</h2>
                        <p>{{ modal.mensaje }}</p> 
                    </div>
                    
                    <div class="button-actions-confirmacion">
                        <button @click="cerrarModal" class="btn-primary-confirmacion">
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>

        </div>

    </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { PawPrint, Loader } from 'lucide-vue-next';
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const emit = defineEmits(['close', 'post-updated']);

const props = defineProps({
    isOpen: Boolean,
    mascotaId: [Number, String] // Recibimos el ID
});

const modal = reactive({
    visible: false,
    mensaje: '',
    tipo: 'success' // 'success' o 'error'
});
// ⭐️ AÑADIR LA CONSTANTE DE PERSONALIDADES AQUÍ
const opcionesPersonalidad = [
    'Juguetón', 'Tranquilo', 'Tímido', 'Energético',
    'Ruidoso', 'Amigable', 'Cariñoso', 'Agresivo',
    'Leal', 'Protector', 'Inteligente', 'Temeroso', 'Arisco'
];

// ESTADO
const formData = reactive({}); 
const localImages = ref([]); 
const newFilesMap = ref({});
const isLoadingData = ref(false); 
const isSaving = ref(false); 



/**
 * Muestra el modal con un mensaje y tipo específico.
 * @param {string} msg - Mensaje a mostrar.
 * @param {string} type - 'success' o 'error'.
 */
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

// LÓGICA DE CARGA DE DATOS (Al abrir la modal)
async function fetchMascotaData(id) {
    if (!id) return;
    isLoadingData.value = true;
    const userToken = authStore.token;
    
    try {
        const response = await fetch(`http://localhost:3000/api/mascotas/editar/${id}`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar la mascota: ' + response.statusText);
        
        const data = await response.json();
        
        Object.assign(formData, data);

        if (!Array.isArray(formData.personalidad_array)) {
            // Asume que si viene de JSON de PostgreSQL y es el valor por defecto '[]', se parseó correctamente como array.
            // Si no, lo inicializa a un array vacío.
            formData.personalidad_array = formData.personalidad_array || [];
        }

        localImages.value = [
            data.image1_mascot,
            data.image2_mascot,
            data.image3_mascot
        ].filter(url => url && url.length > 0);

    } catch (error) {
        console.error("Error al obtener la mascota:", error);
        mostrarModal("No se pudieron cargar los datos de la mascota.");
        emit('close');
    } finally {
        isLoadingData.value = false;
    }
}

watch(() => props.isOpen, (newVal) => {
    if (newVal && props.mascotaId) {
        fetchMascotaData(props.mascotaId);
    } else if (!newVal) {
        Object.keys(formData).forEach(key => delete formData[key]);
        localImages.value = [];
    }
});


/**
 * Lógica para alternar la selección de un rasgo de personalidad.
 * @param {string} rasgo - El rasgo de personalidad a añadir o quitar.
 */
 function togglePersonalidad(rasgoNombre) {
    // ⭐️ CORRECCIÓN: Usar formData.personalidad_array en lugar de mascota.personalidad
    // Aseguramos que es un array (prevención)
    if (!Array.isArray(formData.personalidad_array)) {
        formData.personalidad_array = [];
    }

    const index = formData.personalidad_array.indexOf(rasgoNombre);
    
    if (index > -1) {
        // Si ya está, lo quitamos
        formData.personalidad_array.splice(index, 1);
    } else {
        // Si no está, lo añadimos
        formData.personalidad_array.push(rasgoNombre);
    }
}

// LÓGICA DE GESTIÓN DE FOTOS
function removeImage(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta foto? Ten en cuenta que el cambio será permanente al guardar.')) {
        const item = localImages.value[index];
        // Si es una URL blob:, liberamos la memoria y eliminamos la referencia del mapa
        if (typeof item === 'string' && item.startsWith('blob:')) {
            URL.revokeObjectURL(item);
            delete newFilesMap.value[item];
        }
        localImages.value.splice(index, 1);
    }
}

function addImage(event) {
    const file = event.target.files[0];
    if (file && localImages.value.length < 3) {
        const newBlobUrl = URL.createObjectURL(file);
        
        // ⬅️ CRUCIAL: Guardamos la referencia del objeto File real usando la URL blob: como clave.
        newFilesMap.value[newBlobUrl] = file; 
        
        localImages.value.push(newBlobUrl); // Usamos la URL blob: para la previsualización
        event.target.value = null;
    }
}

async function saveChanges() {
    const userToken = authStore.token;
    if (!userToken || isSaving.value) return;
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB


    isSaving.value = true;
    
    // 1. Prepara el objeto de datos para enviar
    const dataToSend = { 
        ...formData, // Incluye todos los campos de texto: nombre_mascot, especi_mascot, etc.
        // Las URLs de las imágenes existentes que se desean mantener.
        image1_mascot: '', 
        image2_mascot: '', 
        image3_mascot: ''
    };
    
    // 2. Prepara FormData para manejar archivos binarios
    const form = new FormData();
    const paddedImages = [...localImages.value, ...Array(3 - localImages.value.length).fill('')];

    // 3. Itera sobre las 3 posibles imágenes
    for (let i = 0; i < 3; i++) {
        const urlKey = `image${i + 1}_mascot`;
        const item = paddedImages[i]; 

        if (typeof item === 'string' && item.startsWith('blob:')) {
            // Caso A: Archivo BINARIO NUEVO (identificado por su URL blob:)
            const file = newFilesMap.value[item];
            if (file) {

                // 🛑 VALIDACIÓN DE TAMAÑO AQUÍ
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    isSaving.value = false;
                    
                    // 🚨 Muestra la alerta y DETIENE el proceso de guardado
                    mostrarModal(`¡Error! La imagen excede el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB). Por favor, sube una imagen más pequeña.`);
                    
                    // Opcional: Liberar la URL blob para limpiar.
                    URL.revokeObjectURL(item);
                    
                    // Limpiar el mapa para evitar problemas
                    newFilesMap.value = {}; 
                    
                    // 🛑 TERMINA la función aquí
                    return; 
                }

                // 🚨 AJUSTE AQUÍ: Usamos el nombre de campo 'fotos'
                form.append('fotos', file); 
                dataToSend[urlKey] = ''; // Enviamos vacío para que el backend sepa que debe usar la URL de Cloudinary
            }
            // Liberamos el blob: URL ya que el File está en FormData
            URL.revokeObjectURL(item);
        } else if (typeof item === 'string' && item.startsWith('http')) {
            // Caso B: URL de CLOUDINARY existente (la queremos mantener).
            dataToSend[urlKey] = item; 
        } else {
            // Caso C: Vacío, nulo, o no válido (foto eliminada).
            dataToSend[urlKey] = ''; // Se envía vacío para que el backend lo convierta en NULL
        }
    }

    newFilesMap.value = {}; 
    // 4. Adjunta el objeto JSON serializado al FormData
    // El backend lo recibirá como req.body.datos
    form.append('datos', JSON.stringify(dataToSend));

    try {
        const response = await fetch(`http://localhost:3000/api/mascotas/actualizar/${formData.idxxxx_mascot}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${userToken}`,
            },
            body: form // Enviamos el objeto FormData
        });

        // ... (Resto de la lógica de respuesta y error) ...
         if (!response.ok) {
            const errorData = await response.json();
            throw new Error('Error al guardar los cambios: ' + (errorData.mensaje || response.statusText));
        }

        mostrarModal("¡Mascota actualizada con éxito!");
        
        emit('post-updated'); 
    } catch (error) {
        console.error("Error al guardar:", error);
        mostrarModal("Ocurrió un error al actualizar la mascota.");
    } finally {
        isSaving.value = false;
    }
}


</script>

<style scoped>

.modal-overlay { 
position: fixed; 
top: 0; 
left: 0;
width: 100%; 
height: 100%; 
background-color: rgba(0, 0, 0, 0.6); 
display: flex; 
justify-content: center;
align-items: center;
z-index: 1000; }

.edit-modal-container-main{
    position: relative;
    max-width: 1000px;
    overflow: hidden;
}

.edit-modal-container { 
position: relative;
background-color: #ffffff; 
border-radius: 1.5rem; 
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
width: 90%; 
max-width: 1000px; 
max-height: 90vh; 
overflow-y: auto; 
padding: 2rem;
margin: 1rem;
scrollbar-width: thin;
}


.edit-modal-close {
  position: absolute;
  top: 0.5rem;
  right: 4.5rem;
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

.edit-modal-close:hover {
  background: #ff6060;
}

.modal-header { 
display: flex; 
flex-direction: column; 
align-items: flex-start; 
margin-bottom: 1.5rem; }

.modal-title { 
font-size: 1.75rem; 
font-weight: 700; 
color: #1f2937; 
text-align: center; 
width: 100%; }

.paw-icon { 
width: 1.5rem; 
height: 1.5rem; 
color: #ff9595; 
display: inline-block; 
margin: 0 0.5rem; 
vertical-align: middle; }

.loading-modal-state { 
text-align: center; 
padding: 3rem; }

.edit-form { 
display: flex; 
flex-direction: column; }

.form-content-wrapper { 
display: grid; 
gap: 2rem; 
grid-template-columns: 1fr; }

@media (min-width: 768px) { 
.form-content-wrapper { 
grid-template-columns: repeat(2, 1fr); } 
}

.info-section { 
padding: 1rem; 
border: 1px solid #f3f4f6; 
border-radius: 0.5rem;
display: flex;
flex-direction: column;
}

.column{
    display: flex;
}

.container-col{
    width: 100%;
    margin: 10px;
}
.info-section h3 { 
font-size: 1.25rem; 
font-weight: 600; 
color: #bf5151;
margin-bottom: 1rem; 
padding-bottom: 0.5rem; 
border-bottom: 1px solid #eee; }

.info-section label { 
display: block; 
font-weight: 500; 
margin-bottom: 0.25rem; }

.info-section input[type="text"], .info-section input[type="number"], .info-section textarea, .info-section select { 
width: 100%; 
padding: 0.5rem; 
border: 1px solid #d1d5db; 
border-radius: 0.375rem; 
box-sizing: border-box; }

.info-section textarea{
    height: 150px;
}

.radio-group { 
display: flex; 
gap: 1.5rem; 
margin-bottom: 1rem; }

.radio-group label { 
display: inline-flex; 
align-items: center; 
cursor: pointer; 
font-weight: normal; }

.radio-group input[type="radio"] { 
margin-right: 0.5rem; 
accent-color: #ff9595;  }

/* Gestión de Imágenes */
.image-upload-container { 
margin-top: 1.5rem; }

.image-previews { 
display: flex; 
gap: 1rem; 
flex-wrap: wrap; 
justify-content: center; 
margin-top: 1rem; }

.image-wrapper { 
position: relative; 
width: 150px; 
height: 150px; 
border: 1px solid #d1d5db; 
border-radius: 0.5rem; 
overflow: hidden; }

.image-wrapper img { 
width: 100%; 
height: 100%; 
object-fit: cover; }

.remove-image-btn { 
position: absolute; 
top: 5px; 
right: 5px; 
background-color: rgba(255, 0, 0, 0.8); 
color: white; 
border: none; 
border-radius: 50%; 
width: 25px; 
height: 25px; 
font-size: 1.2rem; 
cursor: pointer; 
line-height: 1; 
padding: 0; 
display: flex; 
justify-content: center; 
align-items: center; 
z-index: 10; }

.add-image-wrapper { 
width: 150px; 
height: 150px; }

.add-image-btn { 
display: flex; 
justify-content: center; 
align-items: center; 
width: 100%; 
height: 100%; 
border: 2px dashed #ff9595; 
border-radius: 0.5rem; 
font-size: 3rem; 
color: #ff9595; 
cursor: pointer; 
transition: background-color 0.2s; 
align-content: center;
text-align: center; }

.add-image-btn:hover { 
background-color: #ff95951f; }

/* Botón de Guardar */
.save-button { 
margin-top: 2rem; 
width: 200px; 
align-self: center; 
background-color: #ff9595; 
color: white; 
padding: 0.75rem 1.5rem; 
border: none; 
border-radius: 25px; 
font-size: 1rem; 
font-weight: 700; 
cursor: pointer; 
transition: background-color 0.3s; 
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.save-button:hover:not(:disabled) { 
    background-color: #ff6060;}

.save-button:disabled { 
    background-color: #ff9595; 
    cursor: not-allowed; }

/*********************/
/* Añade esto a tu sección de estilos (o archivo CSS) */
.checkbox-grid {
    display: flex;
    margin: 10px;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    justify-content: center;
}

.trait-checkbox-wrapper {
    width: 100px;
}

.selectable-chip {
    padding: 3px 15px;
    border: 2px solid #ff9595; 
    border-radius: 25px;
    font-weight: 500;
    font-size: 0.9rem;
    margin-right: 10px;
    margin-top: 5px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none; /* Evita selección de texto al hacer clic */
    width: 100%;
    text-align: center;
}

.selectable-chip:hover {
    background-color: #ff9595;  /* Color naranja de la imagen */
    color: white;
    border-color: #ff9595; 
}

.is-selected {
    /* Estilo para un chip marcado */
    background-color: #ff9595; 
    color: #ffffff;
}

.button-group button {
    padding: 8px 15px;
    border: 2px solid #ff9595; 
    border-radius: 25px;
    font-weight: 500;
    font-size: 0.9rem;
    margin-right: 10px;
    margin-top: 5px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}

.button-group button.active {
    background-color: #ff9595;  /* Color naranja de la imagen */
    color: white;
    border-color: #ff9595; 
}

/* 1. Define el comportamiento de Fila */
.container-row {
    display: flex; /* Convierte el contenedor en una fila flexible */
    gap: 20px;     /* Espacio entre las columnas */
    margin-bottom: 20px; /* Espacio entre filas */
    width: 100%;
}

/* 2. Define el comportamiento de Media Columna */
.column-half {
    flex: 1 1 50%; /* Ocupa el 50% del espacio, puede crecer y encogerse */
}

/* 3. Asegura que los botones se vean bien (si no lo tienes) */
.button-group {
    display: flex;
    gap: 10px;
}

/* Modal */

/* ESTILOS CSS PARA EL MODAL (Añadir en el bloque <style> o archivo CSS) */
/* ------------------------------------------- */
/* ⭐️ ESTILOS PARA LA MODAL DE CONFIRMACIÓN/ERROR ⭐️ */
/* ------------------------------------------- */

/* Contenedor del modal de confirmación */
.confirmation-modal-wrapper {
    position: fixed; /* 👈 Clave para que flote sobre todo */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000; /* 👈 MUCHO MAYOR que el z-index del modal principal */
}

/* Overlay de la modal de confirmación (el fondo oscuro) */
.confirmation-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7); /* Oscurece el fondo */
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Contenido del modal (la caja blanca) */
.modal-content-confirmacion {
    position: relative;
    background-color: #ffffff; 
    border-radius: 1rem; /* Borde ligeramente más suave */
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
    width: 100%; 
    max-width: 500px; /* Tamaño típico para modales de confirmación */
    padding: 2.5rem 1.5rem; /* Ajuste del padding */
    text-align: center;
}

/* Estilo para el header de la confirmación */
.modal-header-confirmacion {
    margin-bottom: 20px;
}

.modal-header-confirmacion p{
    font-size: 1.2rem;
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 0 1.8rem;
}

.modal-header-confirmacion h2{
    font-size: 1.4rem;
    color: #333;
    margin: 10px;
    font-weight: 700;
}

.modal-title-confirmacion {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 10px;
}



/* Estilos de botones dentro del modal de confirmación */
.button-actions-confirmacion {
    margin-top: 20px;
}

.btn-primary-confirmacion {
    width: 100%;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px; /* Bordes redondeados */
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-width: 150px;
    background-color: #ff9595; 
    color: white;
}

.btn-primary-confirmacion:hover {
    background: #ff6060;
}

/* Botón de cerrar (X) */
.close-button-confirmacion {
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
.close-button-confirmacion:hover {
    color: #ff6060;
}
</style>