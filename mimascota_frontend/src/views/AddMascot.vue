<template>
    <div class="AddMascot">
        <Navbar />
    <div class="contenedor-principal"> 
        <button @click="irAtras" class="back-button3">
                &#8592; volver 
        </button>
        <div class="form-add">
            
            <div class="header-content">
                <h1>Dale un hogar a una mascota</h1>
                <p>Conecta con adoptantes</p>
            </div>

            <div class="form-layout">
                <div class="form-info">
                <h2>Información de la Mascota</h2>
                <div class="grid-2-cols">
                    <div class="fila-form-1st">
                        <div class="fila1-col1">
                            <label>Nombre:</label>
                            <input type="text" v-model="mascota.nombre" />
                        </div>

                        <div class="fila1-col2">
                            <label>Especie:</label>
                            <div class="toggle-group">
                                <button 
                                    :class="{ active: mascota.especie === 'Perro' }"
                                    @click="mascota.especie = 'Perro'">
                                    Perro
                                </button>
                                
                                <button 
                                    :class="{ active: mascota.especie === 'Gato' }"
                                    @click="mascota.especie = 'Gato'">
                                    Gato
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="fila-form-2nd">
                        <div class="fila2-col1">
                            <label>Sexo:</label>
                            <div class="toggle-group">
                                <button 
                                    v-for="s in opcionesSexo" :key="s"
                                    :class="{ active: mascota.sexo === s }"
                                    @click="mascota.sexo = s">
                                    {{ s }}
                                </button>
                            </div>
                        </div>
                        
                        <div class="fila2-col2">
                            
                            <label>Edad(Meses):</label>
                            
                                <input type="number" v-model.number="mascota.edad" />        
                        </div>
                    </div>
                    
                    <div class="fila-form-3rd">
                        <div class="fila3-col1"> 
                            <label>Raza:</label>
                            <input type="text" v-model="mascota.raza" />
                        </div>

                        <div class="fila3-col2">
                            <label>Peso(Kg):</label>
                            <input type="number" v-model.number="mascota.peso" />
                        </div>
                    </div>
                    <div class="fila-form-4th">
                        <div class="fila4-col1">
                            <label>Tamaño:</label>
                            <select v-model="mascota.tamano">
                                <option disabled value="">Selecciona</option>
                                <option value="Pequeño">Pequeño</option>
                                <option value="Mediano">Mediano</option>
                                <option value="Grande">Grande</option>
                            </select> 
                        </div> 
                    </div>
                </div>
        
                <h2>Personalidad y temperamento</h2>
                <div class="personalidad-tags">
                    <button
                        v-for="rasgo in opcionesPersonalidad"
                        :key="rasgo"
                        :class="{ active: mascota.personalidad.includes(rasgo) }"
                        @click="togglePersonalidad(rasgo)">
                        {{ rasgo }}
                    </button>
                </div>
                
                <h2>Información adicional</h2>
                <textarea v-model="mascota.informacionAdicional"></textarea>
                </div>
            </div>

            <div class="boton-pub">
                <button class="btn-publicar" @click="publicarMascota">
                        Publicar
                </button>

            </div>
        </div>

        

        <div class="image-panel">
            <div class="pet-image-placeholder">
                    <img src="../assets/fondoAgregar.png" alt="Mascotas" class="main-pet-image">
            </div>
                
            <div 
            class="drag-drop-area"
            :class="{ 'drag-activo': dragActivo }"
            @dragover.prevent="manejarDragOver"
            @dragleave="manejarDragLeave"
            @drop.prevent="manejarDrop">

                <div v-if="archivosSubidos.length === 0" class="upload-box">
                    <img src="../assets/upload.jpg" alt="Arrastrar y Soltar Ilustración" class="upload-illustration">
                    <p>Drag & Drop here</p>
                    <p>- or -</p>
                    <label for="file-upload" class="upload-button">
                        Upload an Image
                    </label>
                    <input 
                        type="file" 
                        id="file-upload" 
                        @change="manejarSubidaArchivo" 
                        style="display: none;"
                        multiple
                    >
                </div>

                <div v-else class="preview-grid">
                    <div v-for="archivo in archivosSubidos" :key="archivo.id" class="preview-item">
                        <img :src="archivo.url" :alt="archivo.file.name">
                        <button class="remove-btn" @click="eliminarArchivo(archivo.id)">X</button>
                    </div>
                </div>
            </div>
        </div>

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
import { reactive, ref } from 'vue'; // Importamos 'ref' para dragActivo y 'reactive' para mascota
import Navbar from '../components/Navbar.vue';
import { useRouter } from 'vue-router';

// =================================================================
// 1. ESTADO REACTIVO Y VARIABLES (REEMPLAZA 'data')
// =================================================================

const mascota = reactive({
    nombre: '',
    especie: 'Perro',
    sexo: 'Macho',
    edad: null,
    raza: '',
    peso: null,
    tamano: '',
    personalidad: [],
    informacionAdicional: '',
    // La foto principal (ya no es un solo archivo, lo manejamos en archivosSubidos)
    // Dejamos esta línea si se planea enviar solo una, pero la ajustamos abajo.
    // fotoArchivo: null, 
});

// NUEVOS ESTADOS para el Drag and Drop
const archivosSubidos = reactive([]); // Array reactivo para almacenar {id, file, url}
const dragActivo = ref(false); // Bandera reactiva para el estilo visual del drag

// ⭐️ ESTADO PARA EL MODAL DE MENSAJES ⭐️
const modal = reactive({
    visible: false,
    mensaje: '',
    tipo: 'success' // 'success' o 'error'
});

// Inicializamos el router para redirecciones
const router = useRouter();

// Opciones predefinidas
const opcionesSexo = ['Macho', 'Hembra'];
const opcionesPersonalidad = [
    'Juguetón', 'Tranquilo', 'Tímido', 'Energético',
    'Ruidoso', 'Amigable', 'Cariñoso', 'Agresivo',
    'Leal', 'Protector', 'Inteligente', 'Temeroso', 'Arisco'
];

const MAX_ARCHIVOS = 3; // Límite de imágenes

// =================================================================
// 2. MÉTODOS (REEMPLAZA 'methods')
// =================================================================

/**
 * Lógica para alternar la selección de un rasgo de personalidad.
 * @param {string} rasgo - El rasgo de personalidad a añadir o quitar.
 */
function togglePersonalidad(rasgo) {
    const index = mascota.personalidad.indexOf(rasgo);
    if (index > -1) {
        mascota.personalidad.splice(index, 1);
    } else {
        mascota.personalidad.push(rasgo);
    }
}

// -----------------------------------------------------------------
// LÓGICA DEL MODAL
// -----------------------------------------------------------------

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


// -----------------------------------------------------------------
// LÓGICA DE DRAG AND DROP Y SUBIDA DE ARCHIVOS
// -----------------------------------------------------------------

/**
 * Maneja el evento dragover: activa el estilo visual.
 */
function manejarDragOver() {
    dragActivo.value = true;
}

/**
 * Maneja el evento dragleave: desactiva el estilo visual.
 */
function manejarDragLeave() {
    dragActivo.value = false;
}

/**
 * Maneja el evento drop: procesa los archivos soltados.
 * @param {Event} event - El evento nativo de drop.
 */
function manejarDrop(event) {
    dragActivo.value = false;
    const files = Array.from(event.dataTransfer.files);
    procesarArchivos(files);
}

/**
 * Maneja el evento change del input file (clic en el botón).
 * @param {Event} event - El evento nativo del input de archivo.
 */
function manejarSubidaArchivo(event) {
    const files = Array.from(event.target.files);
    procesarArchivos(files);
    // Limpia el input para que el mismo archivo pueda subirse de nuevo
    event.target.value = ''; 
}

/**
 * Lógica central para validar, crear URL de previsualización y agregar archivos.
 * @param {Array<File>} files - Arreglo de objetos File.
 */
function procesarArchivos(files) {
    const disponibles = MAX_ARCHIVOS - archivosSubidos.length;
    const archivosAceptados = files.slice(0, disponibles);

    archivosAceptados.forEach(file => {
        // Validación básica
        if (file.type.startsWith('image/')) {
            // 1. Crea una URL temporal para el navegador (previsualización)
            const url = URL.createObjectURL(file);
            
            // 2. Almacena la data del archivo y la URL en el estado reactivo
            archivosSubidos.push({
                id: Date.now() + Math.random(), // ID único
                file: file, // El objeto File real
                url: url
            });
        }
    });
    
    // Si se intentaron subir más del límite
    if (files.length > disponibles) {
        alert(`Solo se pudieron subir ${disponibles} imágenes. Límite: ${MAX_ARCHIVOS}.`);
    }
}

/**
 * Elimina una imagen del array de subidas.
 * @param {number} id - El ID único del archivo a eliminar.
 */
function eliminarArchivo(id) {
    const index = archivosSubidos.findIndex(a => a.id === id);
    if (index !== -1) {
        // IMPORTANTE: Revocar la URL temporal para liberar memoria del navegador
        URL.revokeObjectURL(archivosSubidos[index].url);
        archivosSubidos.splice(index, 1);
    }
}



/**
 * Envía los datos del formulario, incluyendo los múltiples archivos, al servidor.
 */
 async function publicarMascota() {
    const formData = new FormData();
    
    // ⭐️ 1. Obtener el token de autenticación
    // CORRECCIÓN CLAVE: Usamos 'authToken' ya que así se guarda en localStorage.
    const token = localStorage.getItem('authToken'); 

    if (!token) {
        alert('Debes iniciar sesión para publicar una mascota.');
        // ⭐️ Importante: Redirigir al login si no hay token (asumiendo que tienes una ruta '/login')
        useRouter().push('/login'); 
        return;
    }

    // 2. Añadir los MÚLTIPLES archivos de imagen
    archivosSubidos.forEach((item, index) => {
        // ⭐️ CORRECCIÓN CRÍTICA: Multer espera el campo 'fotos' (sin el índice en la clave)
        // La clave debe ser 'fotos' para cada archivo.
        formData.append(`fotos`, item.file); 
    });

    // 3. Añadir todos los campos de texto como un string JSON
    formData.append('datos', JSON.stringify({
        nombre: mascota.nombre,
        // 🚨 CORRECCIÓN ANTERIOR MANTENIDA: 'mascota.especi' a 'mascota.especie'
        especie: mascota.especie, 
        sexo: mascota.sexo,
        edad: mascota.edad,
        raza: mascota.raza,
        peso: mascota.peso,
        tamano: mascota.tamano,
        personalidad: mascota.personalidad,
        informacionAdicional: mascota.informacionAdicional,
    }));

    try {
        const response = await fetch('http://localhost:3000/api/mascotas', {
            method: 'POST',
            // ⭐️ 4. AÑADIR LA CABECERA DE AUTORIZACIÓN
            headers: {
                // Usamos el token correcto en el header
                'Authorization': `Bearer ${token}`, 
            },
            body: formData,
        });

        if (response.ok) {
            mostrarModal('Su mascota ha sido añadida correctamente', 'success');
        } else {
            const errorText = await response.text(); // Leer como texto si no es JSON
            let mensajeError = 'Error desconocido.';
            
            try {
                // Intentar parsear como JSON si el error no fue de red
                const errorJson = JSON.parse(errorText);
                mensajeError = errorJson.message || errorJson.mensaje || 'Error desconocido del servidor.';
            } catch (e) {
                // Si no es JSON, mostrar el código de estado
                mensajeError = `Error ${response.status}: ${response.statusText}.`;
            }
            
            /*alert('Error al publicar: El archivo excede el tamaño (5MB) ');*/
            mostrarModal('El archivo excede el tamaño (5MB)', 'error');
        }
    } catch (error) {
        console.error('Error de red al enviar el formulario:', error);
        alert('No se pudo conectar al servidor. Asegúrate de que Express esté corriendo.');
    }
}
function irAtras() {
    window.history.back();
}
</script>

<style>
.back-button3 {
    width: 125px;
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

.AddMascot{
    display: flex;
    flex-direction: column;
    align-items: center;
}
/* Usando Flexbox para el layout principal de 2 columnas */
.contenedor-principal{
    margin-top:100px;
    display: flex; 
}

.header-content h1{
    color: black;
    font-weight: 800;
    text-align: center;
}

.header-content p{
    font-size: 22px;
    font-weight: 100;
    text-align: center;
    margin-bottom: 25px;
}

.form-add{
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgb(255, 255, 255);
    width: 50%;
    padding: 30px;
    margin-top: 50px;

}

.form-layout {
    display: flex;
    background: #ffffff;
    border-radius: 25px;
    box-shadow: 0px 6px 10px -1px #757373;
    padding: 40px;
    width: 70%;
    gap: 40px; /* Espacio entre las dos columnas */
    align-items: flex-start;
}

.form-info {
    /* La columna izquierda del formulario ocupa más espacio */
    flex: 1; 
}

.form-info h2{
    text-align: center;
    font-weight: 700;
    color: #000000;
}

.fila-form-1st, .fila-form-2nd, .fila-form-3rd{
    display: flex;
    width: 100%;
}


.fila1-col1, .fila1-col2, .fila2-col1, .fila2-col2, .fila3-col1, .fila3-col2, .fila4-col1{
    width: 50%;
    margin: 8px;
}



.fila4-col1{
    padding-right: 20px;
}


.image-panel {
    /* La columna derecha de la imagen */
    width: 50%; 
    display: inline-block;
    flex-direction: column;
    gap: 30px;
    justify-items: center;
    justify-content: center;
}

/* Estilos para alinear los labels e inputs en 2 columnas dentro de la sección "Información de la Mascota" */
.grid-2-cols {
    display: flex;
    flex-direction: column;
    grid-template-columns: 150px 1fr; /* 150px para el label y 1fr para el input */
    gap: 0px 10px;
    align-items: left;
}

.grid-2-cols label{
    font-weight: 800;
    font-size: 18px;
    color: #000000;
}

/* Estilos de botones Toggle (Especie/Sexo) */
.toggle-group button {
    padding: 8px 15px;
    border: 2px solid #ff9900;
    border-radius: 25px;
    font-weight: 500;
    font-size: 0.9rem;
    margin-right: 10px;
    margin-top: 5px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-group .active {
    background-color: #ff9900; /* Color naranja de la imagen */
    color: white;
    border-color: #ff9900;
}

/* Estilos para la sección Personalidad (botones pequeños) */
.personalidad-tags {
    display: flex;
    margin: 10px;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.personalidad-tags button {
    padding: 5px 9px;
    width: 90px;
    border-radius: 20px;
    border: 2px solid #ff9900;
    background-color: white;
    font-size: 0.9rem;
    font-weight: 500;
    /* Usa la misma clase active o define un estilo de borde para el no seleccionado */
}

.personalidad-tags .active {
    padding: 5px 10px;
    width: 90px;
    border-radius: 20px;
    border: 1px solid #ff9900;
    background-color: rgb(255, 170, 0);
    color: #ffffff;
    font-size: 0.9em;
    /* Usa la misma clase active o define un estilo de borde para el no seleccionado */
}

/* Estilos para el botón de Publicar */
.btn-publicar {
    display: inline-block;
    width: 250px;
    margin: 30px auto 0;
    padding: 15px;
    background-color: #ffad31;
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 1.2em;
    cursor: pointer;
    transition: all 0.3s 
}

.btn-publicar:hover{
    background-color: #ff9900;
    box-shadow: 0px 6px 10px -1px #757373;
    animation: pulse 1.5s infinite;
}
.pet-image-placeholder{
    width: 100%;
}

.upload-illustration {
    width: 60%;
}


.main-pet-image{
    width: 100%;
    height: auto;
    background-position: 40px;
    background-size: cover; /* Cubre todo el contenedor */
}

/* Estilos básicos para inputs y textarea */
input[type="text"], input[type="number"], textarea, select {
    padding: 8px;
    margin: 5px;
    border: 2px solid #ff9d00;
    border-radius: 12px;
    width: 100%;
}


.form-info input[type="text"], input[type="number"], textarea, select:focus{
    
    outline: 0px solid #ff9d00; /* O un contorno de tu color */
    
}



textarea {
    min-height: 100px;
    resize: vertical;
}



/* Estilos para el área de Drag & Drop */

.upload-button {
    appearance: none; 
    background-color: #ffad31;
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    cursor: pointer;
    display: inline-block;
    margin-top: 10px;
    transition: transform 1s ease;
}

.upload-button:hover {
    background-color: #ff9900;
     box-shadow: 0px 6px 10px -1px #757373; 
   
}

.upload-button:active {
    background-color: #ff9900;
     box-shadow: 0px 6px 10px -1px #757373; 
    transform: scale(0.1);
}

/* Contenedor principal que maneja el borde y el centrado de todo el contenido */
.drag-drop-area {
    background: #fff8f1;
    display: flex;
    width: 90%;
    height: 35%;
    border: 4px dashed #ff9900;
    padding: 30px;
    justify-content: center;
    align-items: center;
    justify-items: center;
    text-align: center;
    border-radius: 8px;
    overflow: auto; /* Permite scroll si hay muchas miniaturas */
}

/* Retroalimentación visual al arrastrar */
.drag-drop-area.drag-activo {
    border: 4px dashed #ff9900;border-color: #ffa600;
    background-color: #ffe5c7;
}

/* Estilos del contenido inicial (Tu .upload-box) */
.upload-box {
    /* Ajustamos el upload-box para que su contenido se centre */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px; /* Espacio entre los elementos internos */
}

/* Estilos de la imagen de ilustración */
.upload-illustration {
    max-width: 100px;
    height: auto;
}

/* --- Estilos de la Cuadrícula de Previsualización --- */

.preview-grid {
     /* ... (tu código grid aquí) ... */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); 
    gap: 10px;
    width: 100%;
}

.preview-item {
    position: relative;
    padding-top: 100%; /* Crea una relación de aspecto 1:1 (cuadrado) */
    overflow: hidden;
    border-radius: 20px;
}

.preview-item img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Asegura que la imagen se vea bien */
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
    background: #ffb84d;
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
    background: #ff9900;
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

