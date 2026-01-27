<template>
    <div class="reset-password-container">
        <div class="form-section">
            <h1 class="title">Restablecer Contraseña</h1>
            <p class="subtitle">Introduce tu nueva contraseña</p>

            <form @submit.prevent="handleResetPassword" class="form-reset">
                <div class="input-group" v-if="!token">
                    <p>Si olvidaste tu contraseña, introduce tu email para recibir un enlace de restablecimiento.</p>
                    <label for="email">Email</label>
                    <input type="email" id="email" v-model="email" placeholder="Tu correo electrónico" required>
                    <button type="submit" class="submit-button" :disabled="loading">
                        {{ loading ? 'Enviando...' : 'Enviar enlace de restablecimiento' }}
                    </button>
                </div>
                
                <div class="input-group" v-else>
                    <label for="new-password">Nueva Contraseña</label>
                    <input type="password" id="new-password" v-model="newPassword" required>
                    <label for="confirm-password">Confirmar Contraseña</label>
                    <input type="password" id="confirm-password" v-model="confirmPassword" required>
                    <button type="submit" class="submit-button" :disabled="loading">
                        {{ loading ? 'Actualizando...' : 'Actualizar Contraseña' }}
                    </button>
                </div>
            </form>
            
            <Transition name="fade-message">
                <div v-if="success" class="success-message">{{ success }}</div>
            </Transition>
            <Transition name="fade-message">
                <div v-if="error" class="error-message">{{ error }}</div>
            </Transition>
            
            <div class="links">
                <router-link to="/">Volver al inicio de sesión</router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const token = ref(null);
const loading = ref(false);
const error = ref('');
const success = ref('');

const MESSAGE_DURATION = 5000; // 5 segundos

// Auto-ocultar mensajes después de un tiempo
const autoHideMessage = (messageType) => {
    setTimeout(() => {
        if (messageType === 'success') {
            success.value = '';
        } else if (messageType === 'error') {
            error.value = '';
        }
    }, MESSAGE_DURATION);
};

onMounted(() => {
    if (route.query.token) {
        token.value = route.query.token;
    }
});

const handleResetPassword = async () => {
    error.value = '';
    success.value = '';
    loading.value = true;

    if (!token.value) {
        // Solicitar enlace de restablecimiento
        try {
            const response = await fetch('http://localhost:3000/api/auth/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailx_usuari: email.value }),
            });
            const data = await response.json();
            if (response.ok) {
                success.value = 'Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.';
                autoHideMessage('success');
                email.value = ''; // Limpiar el campo
            } else {
                error.value = data.msg || 'Error al enviar el enlace. Por favor, verifica que el correo sea correcto.';
                autoHideMessage('error');
            }
        } catch (err) {
            error.value = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
            autoHideMessage('error');
        } finally {
            loading.value = false;
        }
    } else {
        // Actualizar contraseña con el token
        if (newPassword.value !== confirmPassword.value) {
            error.value = 'Las contraseñas no coinciden.';
            autoHideMessage('error');
            loading.value = false;
            return;
        }
        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token.value,
                    newPassword: newPassword.value
                }),
            });
            const data = await response.json();
            if (response.ok) {
                success.value = '¡Tu contraseña se ha restablecido con éxito! Redirigiendo al inicio de sesión...';
                newPassword.value = '';
                confirmPassword.value = '';
                
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    router.push('/auth');
                }, 3000);
            } else {
                // Detectar si el token está expirado o ya fue usado
                const errorMsg = data.msg || '';
                if (errorMsg.toLowerCase().includes('expirado') || 
                    errorMsg.toLowerCase().includes('expired') || 
                    errorMsg.toLowerCase().includes('utilizado') ||
                    errorMsg.toLowerCase().includes('used') ||
                    errorMsg.toLowerCase().includes('invalid')) {
                    error.value = 'Este enlace ya ha sido utilizado o ha expirado. Por favor, solicita un nuevo enlace de restablecimiento.';
                } else {
                    error.value = errorMsg || 'Error al restablecer la contraseña.';
                }
                autoHideMessage('error');
            }
        } catch (err) {
            error.value = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
            autoHideMessage('error');
        } finally {
            loading.value = false;
        }
    }
};
</script>

<style scoped>
/* Estilos reutilizados de AuthPage.vue */
.reset-password-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f8f8;
    font-family: 'Inter', sans-serif;
}

.form-section {
    max-width: 450px;
    width: 90%;
    padding: 2.5rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    text-align: center;
}

.title { font-size: 2rem; color: #333; margin-bottom: 0.5rem; }
.subtitle { font-size: 1rem; color: #666; margin-bottom: 2rem; }
.form-reset { display: flex; flex-direction: column; gap: 1.25rem; }
.input-group { text-align: left; }
.input-group p { font-size: 0.9rem; color: #777; margin-bottom: 1rem; }
.input-group label { display: block; font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; }
.input-group input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
.submit-button { padding: 0.9rem; background-color: #000; color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background-color 0.3s ease; margin-top: 1rem; width: 100%; }
.submit-button:hover { background-color: #333; }
.submit-button:disabled { background-color: #ccc; cursor: not-allowed; }
.success-message { color: #27ae60; background-color: #e8f9ed; border: 1px solid #27ae60; padding: 0.75rem; border-radius: 8px; text-align: center; margin-top: 1rem; font-weight: 600; }
.error-message { color: #e74c3c; background-color: #fce7e7; border: 1px solid #e74c3c; padding: 0.75rem; border-radius: 8px; text-align: center; margin-top: 1rem; font-weight: 600; }

/* Transiciones para mensajes */
.fade-message-enter-active, .fade-message-leave-active {
    transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-message-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}
.fade-message-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
.links { margin-top: 2rem; font-size: 0.9rem; }
.links a { color: #007bff; text-decoration: none; }
.links a:hover { text-decoration: underline; }
</style>