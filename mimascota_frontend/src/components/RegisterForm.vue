<script setup>
import { ref, defineEmits, nextTick } from 'vue';
import axios from 'axios';

const emit = defineEmits(['toggle-form', 'registration-success']);

const nombre = ref('');
const apellido = ref(''); 
const email = ref('');
const password = ref('');
const celular = ref('');
const profileImage = ref(null);

const errorMessage = ref(''); 

const DURATION = 3000;
// Función para actualizar el nombre del archivo visible
const updateFileNameDisplay = (file) => {
    const fileNameElement = document.querySelector('.nombre-archivo');
    if (fileNameElement) {
        fileNameElement.textContent = file ? file.name : 'Ningún archivo seleccionado';
    }
};

const handleFileChange = (event) => {
    const file = event.target.files[0];
    profileImage.value = file;
    // LLAMADA: Actualizar el texto visible con el nombre del archivo
    updateFileNameDisplay(file);
};

const register = async () => {
    errorMessage.value = '';

    const formData = new FormData();
    formData.append('nombre_usuari', nombre.value);
    formData.append('apelli_usuari', apellido.value); 
    formData.append('emailx_usuari', email.value);
    formData.append('contra_usuari', password.value);
    formData.append('celula_usuari', celular.value);

    if (profileImage.value) {
        formData.append('imagep_usuari', profileImage.value);
    }

    try {
        const response = await axios.post('http://localhost:3000/api/auth/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Emitir el mensaje de éxito al componente padre
        emit('registration-success', response.data.message || 'Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta.');
        
        // Limpiar el formulario
        nombre.value = '';
        apellido.value = '';
        email.value = '';
        password.value = '';
        celular.value = '';
        profileImage.value = null;

        updateFileNameDisplay(null);
        // Usa nextTick para asegurar que el DOM se haya actualizado antes de buscar el input
        await nextTick(); 
        const fileInput = document.getElementById('profileImage');
        if (fileInput) {
            fileInput.value = ''; // Limpiar el input nativo
        }


    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        errorMessage.value = error.response?.data?.message || 'Error al registrar el usuario.';
        
        // 💡 LÓGICA PARA EL DESVANECIMIENTO AUTOMÁTICO
        if (errorMessage.value) {
            setTimeout(() => {
                errorMessage.value = ''; // Limpia la variable, iniciando la transición de salida
            }, DURATION);
        }
    }
};
</script>

<template>
  <div class="register-container">
    <div class="register-header">
      <h2>Regístrate</h2>
      <p>Crea una cuenta para usar la aplicación</p>
    </div>
    <form class="register-form" @submit.prevent="register">
      <div class="form-group">
        <label for="nombre">Nombre</label>
        <input type="text" id="nombre" v-model="nombre" required placeholder="Tu nombre">
      </div>
      <div class="form-group">
        <label for="nombre">Apellido</label>
        <input type="text" id="apellido" v-model="apellido" required placeholder="Tu apellido">
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required placeholder="Tu correo electrónico">
      </div>
      <div class="form-group">
        <label for="password">Contraseña</label>
        <input type="password" id="password" v-model="password" required placeholder="Crea tu contraseña">
      </div>
      <div class="form-group">
        <label for="celular">Teléfono (opcional)</label>
        <input type="tel" id="celular" v-model="celular" placeholder="Tu número de teléfono">
      </div>

      <div class="form-group">
          <label for="profileImage">Imagen de perfil (opcional)</label>
          <div class="archivo">
              <input type="file" class="file-input-oculto" id="profileImage" @change="handleFileChange" accept="image/*">
              
              <label for="profileImage" class="file-label-personalizado" style="margin-bottom: 0px;">
                  <span class="icono">&#x2191;</span> Seleccionar Archivo
              </label>
              
              <span class="nombre-archivo">Ningún archivo seleccionado</span>
          </div>
        </div>
      <button type="submit" class="register-button">Registrarse</button>
    </form>
    <Transition name="fade-message">
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </Transition>
    <div class="register-footer">
      <p>¿Ya tienes cuenta? <a href="#" @click.prevent="$emit('toggle-form')">Inicia sesión</a></p>
    </div>
  </div>
</template>

<style scoped>
/* Mantén todos los estilos del formulario de registro aquí. */
.register-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-family: 'Inter', sans-serif;
  color: black;
  width: 100%;
  box-sizing: border;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 2em;
  margin-bottom: 10px;
  font-weight: 700;
}

.register-header p {
  font-size: 1.1em;
  color: #747474;
  font-weight: 600;
  
}

.register-form {
  width: 100%;
  max-width: 350px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #f5f5f5;
  color: black;
}

.fade-message-enter-active, 
.fade-message-leave-active {
  /* La duración del desvanecimiento es de 0.5s */
  transition: opacity 0.5s ease; 
}

/* Estado inicial (antes de entrar) y estado final (después de salir) */
.fade-message-enter-from,
.fade-message-leave-to {
  opacity: 0; /* Totalmente transparente */
}

/* Estilo para inputs inválidos */
.form-group input.is-invalid {
  border-color: red;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.register-button {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-weight: 700;
}

.register-button:hover {
  background-color: #333;
}

.register-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.register-button:hover:not(:disabled) {
  background-color: #333;
}

.register-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 0.9em;
}

.register-footer p {
  margin-bottom: 5px;
}

.register-footer a {
  color: black;
  text-decoration: none;
  font-weight: bold;
}

.register-footer a:hover {
  text-decoration: underline;
}

.validation-message {
  color: #007bff;
  font-size: 0.8em;
  margin-top: 5px;
}

.validation-feedback {
  margin-top: 5px;
}

.success-message,
.error-message {
  margin-top: 15px;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 350px;
  box-sizing: border-box;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

/* Oculta completamente el campo de archivo nativo */
.file-input-oculto{
  display: none; 
}

/* Estilo para tu botón visible (el label) */
.file-label-personalizado {
  /* Haz que parezca un botón */
  background-color: #007bff; /* Color primario */
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  /* Alineación y espaciado */
  display: inline-block;
  font-size: 0.7rem;
  margin-right: 10px;
  font-family: sans-serif; 
  width: 43%;
}

/* Opcional: Estilos al pasar el ratón */
.file-label-personalizado:hover {
  background-color: #0056b3;
}

.archivo{
  display: flex;
  align-items: center;
}
/* Estilo para el texto del archivo seleccionado */
.nombre-archivo {
  font-style: italic;
  justify-content: center;
  justify-items: center;
  color: #6c757d;
  font-size: 0.75rem;
}
</style>