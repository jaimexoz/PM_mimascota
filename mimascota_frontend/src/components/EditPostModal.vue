<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">

        <div class="edit-modal-container">
            
            <div class="modal-header">
                <button @click="emit('close')" class="back-button"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Volver</button>

                
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
                        
                        <label>Especie:</label>
                        <div class="radio-group">
                            <input type="radio" id="perro" value="Perro" v-model="formData.especi_mascot">
                            <label for="perro">Perro</label>
                            <input type="radio" id="gato" value="Gato" v-model="formData.especi_mascot">
                            <label for="gato">Gato</label>
                        </div>
                        
                        <label>Sexo:</label>
                        <div class="radio-group">
                            <input type="radio" id="macho" value="Macho" v-model="formData.sexoxx_mascot">
                            <label for="macho">Macho</label>
                            <input type="radio" id="hembra" value="Hembra" v-model="formData.sexoxx_mascot">
                            <label for="hembra">Hembra</label>
                        </div>

                        <label for="edad">Edad (Meses):</label>
                        <input type="number" id="edad" v-model.number="formData.edadme_mascot" min="0">
                        
                        <label for="raza">Raza:</label>
                        <input type="text" id="raza" v-model="formData.razaxx_mascot">
                        
                        <label for="peso">Peso (kg):</label>
                        <input type="number" step="0.1" id="peso" v-model.number="formData.pesokg_mascot">

                        <label for="tamano">Tamaño:</label>
                        <select id="tamano" v-model="formData.tamano_mascot">
                            <option value="Pequeño">Pequeño</option>
                            <option value="Mediano">Mediano</option>
                            <option value="Grande">Grande</option>
                        </select>

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
        alert("No se pudieron cargar los datos de la mascota.");
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
                    alert(`¡Error! La imagen excede el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB). Por favor, sube una imagen más pequeña.`);
                    
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

        alert("¡Mascota actualizada con éxito!");
        emit('close'); 
        emit('post-updated'); 
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Ocurrió un error al actualizar la mascota.");
    } finally {
        isSaving.value = false;
    }
}
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
    margin-top: 10px;
    position: absolute;
}

.back-button:hover {
  background: #e9ecef;
  color: #495057;
}
/* Estilos Básicos para la Modal */
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

.edit-modal-container { 
background-color: #ffffff; 
border-radius: 1.5rem; 
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
width: 90%; 
max-width: 1000px; 
max-height: 90vh; 
overflow-y: auto; 
padding: 2rem; }

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
color: #FF9933; 
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
border-radius: 0.5rem; }

.info-section h3 { 
font-size: 1.25rem; 
font-weight: 600; 
color: #FF9933; 
margin-bottom: 1rem; 
padding-bottom: 0.5rem; 
border-bottom: 1px solid #eee; }

.info-section label { 
display: block; 
font-weight: 500; 
margin-top: 0.75rem; 
margin-bottom: 0.25rem; }

.info-section input[type="text"], .info-section input[type="number"], .info-section textarea, .info-section select { 
width: 100%; 
padding: 0.5rem; 
border: 1px solid #d1d5db; 
border-radius: 0.375rem; 
box-sizing: border-box; }

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
accent-color: #FF9933; }

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
border: 2px dashed #FF9933; 
border-radius: 0.5rem; 
font-size: 3rem; 
color: #FF9933; 
cursor: pointer; 
transition: background-color 0.2s; 
align-content: center;
text-align: center; }

.add-image-btn:hover { 
background-color: #fffbeb; }

/* Botón de Guardar */
.save-button { 
margin-top: 2rem; 
width: 200px; 
align-self: center; 
background-color: #FF9933; 
color: white; 
padding: 0.75rem 1.5rem; 
border: none; 
border-radius: 25px; 
font-size: 1.25rem; 
font-weight: 700; 
cursor: pointer; 
transition: background-color 0.3s; 
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.save-button:hover:not(:disabled) { 
    background-color: #f47004; }

.save-button:disabled { 
    background-color: #ffc999; 
    cursor: not-allowed; }

/*********************/
/* Añade esto a tu sección de estilos (o archivo CSS) */
.checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px; /* Espacio entre los chips */
}

.trait-checkbox-wrapper {
    display: contents; /* No afecta el flujo flex */
}

.selectable-chip {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    transition: all 0.2s ease;
    user-select: none; /* Evita selección de texto al hacer clic */
}

.selectable-chip:hover {
    background-color: #e0e0e0;
}

.is-selected {
    /* Estilo para un chip marcado */
    background-color: #4CAF50; /* Color primario, ej. verde */
    color: white;
    border-color: #4CAF50;
    font-weight: bold;
}
</style>