<template>
  <div class="login-page-wrapper">
      <div v-if="!loading" class="login-container">
          <div class="login-header">
              <h2>Inicio de Sesión</h2>
              <p>Inicia sesión para gestionar tus mascotas</p>
          </div>
          <form class="login-form" @submit.prevent="handleLogin">
              <div class="form-group">
                  <label for="email">Email</label>
                  <input type="email" id="email" v-model="email" placeholder="Tu correo electrónico" required>
              </div>
              <div class="form-group">
                  <label for="password">Contraseña</label>
                  <input type="password" id="password" v-model="password" placeholder="Tu contraseña" required>
              </div>

              <button type="submit" class="login-button" :disabled="loading">
                  Iniciar Sesión
              </button>
              
              <div v-if="error" class="error-message">{{ error }}</div>
          </form>
          <div class="login-footer">
              <p><router-link to="/reset-password">¿Olvidaste tu contraseña?</router-link></p>
              <p>¿No tienes cuenta? <a href="#" @click.prevent="$emit('toggle-form')">Regístrate</a></p>
          </div>
      </div>

      <div v-else class="full-page-spinner-overlay">
          <span class="loader"></span>
      </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../utils/auth'; 
import { defineEmits } from 'vue';
// 🔥 IMPORTANTE: Ahora usaremos estas dos importaciones
import apiClient, { setAuthHeader } from '@/http'; 

const emit = defineEmits(['toggle-form']);

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
    error.value = ''; 
    loading.value = true;
    try {
        
        // Axios maneja headers y JSON automáticamente
        const response = await apiClient.post('/auth/login', {
            emailx_usuari: email.value, 
            contra_usuari: password.value 
        });
        const data = response.data; 
        login(data.token); 
        
        setAuthHeader(data.token); 

        // Guardar datos del usuario
        if (data.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        
        router.push('/home');

    } catch (err) {
        if (err.response && err.response.data) {
            error.value = err.response.data.message || 'Error al iniciar sesión. Verifica tus credenciales.'; 
        } else {
            console.error('Error de red o del servidor:', err);
            error.value = 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.';
        }
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Mantén todos los estilos del formulario de login aquí. */

.full-page-spinner-overlay {
    /* Posiciona el overlay para que cubra toda la página (o el contenedor principal) */
    position: fixed; /* O 'absolute' si 'login-page-wrapper' es 'relative' */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    
    /* Centrado perfecto usando Flexbox */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    /* Fondo semi-transparente para bloquear la interacción */
    background-color: rgba(255, 255, 255, 0.9); 
    z-index: 1000; /* Asegura que esté por encima de todos los demás elementos */
    color: black;
    font-size: 1.2em;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid;
  border-color: #ff8c00 transparent;
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

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: black;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  font-size: 2em;
  margin-bottom: 10px;
  color: black;
}

.login-header p {
  font-size: 1.1em;
  color: #555;
}

.login-form {
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
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f5f5f5;
  color: black;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: black;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;

  display: flex;
    justify-content: center; /* Centra horizontalmente el contenido */
    align-items: center;
}

.login-button:hover {
  background-color: #333;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 0.9em;
}

.login-footer p {
  margin-bottom: 5px;
}

.login-footer a {
  color: black;
  text-decoration: none;
  font-weight: bold;
}

.login-footer a:hover {
  text-decoration: underline;
}

/* Mensajes de feedback (con recuadro) - Estos también podrían ser globales en style.css si se usan mucho */
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

/********************** */
.loading-content {
    /* Esto es crucial para espaciar el spinner del texto */
    display: flex;
    align-items: center;
    gap: 8px; /* Espacio entre el spinner y el texto */
}

/* --- Estilo del icono (YA ESTABA, SOLO VERIFICAR) --- */
.spinner-icon {
    width: 1.25em; 
    height: 1.25em;
    color: #fff;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Estilo para el botón deshabilitado (opcional, pero recomendado) */
.login-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
</style>