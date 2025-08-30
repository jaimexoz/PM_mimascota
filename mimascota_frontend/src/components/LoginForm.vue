<template>
  <div class="login-container">
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
        {{ loading ? 'Iniciando...' : 'Iniciar Sesión' }}
      </button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </form>
    <div class="login-footer">
      <p><router-link to="/reset-password">¿Olvidaste tu contraseña?</router-link></p>
      <p>¿No tienes cuenta? <a href="#" @click.prevent="$emit('toggle-form')">Regístrate</a></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '../utils/auth'; // Importa la función de login
import { defineEmits } from 'vue';

const emit = defineEmits(['toggle-form']); // Permite emitir eventos al componente padre

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
    error.value = ''; // Limpiar mensajes de error anteriores
    loading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 
            body: JSON.stringify({ emailx_usuari: email.value, contra_usuari: password.value }), 
        });

        const data = await response.json();
        
        if (response.ok) {
            // Lógica para guardar el token JWT en el Local Storage
            login(data.token); // Asumiendo que tu función `login` maneja esto
            
            // Guardar datos del usuario en localStorage
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            // Redirige a la nueva ruta /home
            router.push('/home');
        } else {
            // Manejo de errores del backend
            // El backend envía `message` para errores (ej. "Credenciales inválidas", "Verifica tu correo")
            error.value = data.message || 'Error al iniciar sesión. Verifica tus credenciales.'; 
        }
    } catch (err) {
        console.error('Error de red o del servidor:', err);
        error.value = 'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.';
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
/* Mantén todos los estilos del formulario de login aquí. */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: white;
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
</style>