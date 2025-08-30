<script setup>
import { ref, defineEmits } from 'vue';
import axios from 'axios';

const emit = defineEmits(['toggle-form', 'registration-success']);

const nombre = ref('');
const email = ref('');
const password = ref('');
const celular = ref('');
const profileImage = ref(null);

const errorMessage = ref('');

const handleFileChange = (event) => {
    profileImage.value = event.target.files[0];
};

const register = async () => {
    errorMessage.value = '';

    const formData = new FormData();
    formData.append('nombre_usuari', nombre.value);
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
        email.value = '';
        password.value = '';
        celular.value = '';
        profileImage.value = null;

    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        errorMessage.value = error.response?.data?.message || 'Error al registrar el usuario.';
    }
};
</script>

<template>
  <div class="register-container">
    <div class="register-header">
      <h2>Regístrate</h2>
      <p>Crea tu cuenta para empezar a usar la aplicación</p>
    </div>
    <form class="register-form" @submit.prevent="register">
      <div class="form-group">
        <label for="nombre">Nombre Completo</label>
        <input type="text" id="nombre" v-model="nombre" required placeholder="Tu nombre">
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
        <input type="file" id="profileImage" @change="handleFileChange" accept="image/*">
      </div>
      <button type="submit" class="register-button">Registrarse</button>
    </form>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
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
  background-color: white;
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
}

.register-header p {
  font-size: 1.1em;
  color: #555;
  
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
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f5f5f5;
  color: black;
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
</style>