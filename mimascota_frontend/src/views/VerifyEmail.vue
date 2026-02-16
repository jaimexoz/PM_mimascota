<template>
    <div class="verify-email-container">
        <div class="content-box">
            <h1 class="title">{{ title }}</h1>
            <p class="subtitle">{{ message }}</p>
            
            <div v-if="!verificationComplete">
                <p>Por favor, espera mientras verificamos tu cuenta...</p>
                <div class="spinner"></div>
            </div>

            <div v-if="verificationComplete">
                <button @click="goToLogin" class="submit-button">
                    Ir al inicio de sesión
                </button>
            </div>

            <div v-if="error" class="error-message">
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiUrl } from '@/config/api';

const route = useRoute();
const router = useRouter();
const title = ref('Verificando tu cuenta...');
const message = ref('No cierres esta página, por favor.');
const error = ref('');
const verificationComplete = ref(false);

const verifyToken = async (token) => {
    try {
        const response = await fetch(apiUrl(`/auth/verify-email?token=${token}`), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const data = await response.json();

        if (response.ok) {
            title.value = '¡Verificación Exitosa!';
            message.value = 'Tu cuenta ha sido verificada. Ya puedes iniciar sesión.';
            verificationComplete.value = true;
        } else {
            title.value = 'Error de Verificación';
            message.value = 'El enlace es inválido o ha expirado. Por favor, solicita uno nuevo.';
            error.value = data.msg || 'Error desconocido.';
        }
    } catch (err) {
        title.value = 'Error de Conexión';
        message.value = 'No se pudo conectar con el servidor para verificar tu cuenta.';
        error.value = 'Inténtalo de nuevo más tarde.';
    }
};

const goToLogin = () => {
    router.push('/');
};

onMounted(() => {
    // Obtiene el token de los parámetros de la URL
    const token = route.query.token;
    if (token) {
        verifyToken(token);
    } else {
        title.value = 'Enlace Inválido';
        message.value = 'Falta el token de verificación en el enlace.';
        error.value = 'Por favor, usa el enlace completo que te enviamos por correo.';
    }
});
</script>

<style scoped>
.verify-email-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f8f8;
    text-align: center;
    padding: 2rem;
    font-family: 'Inter', sans-serif;
}

.content-box {
    max-width: 500px;
    width: 90%;
    padding: 3rem 2rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.title {
    font-size: 2.2rem;
    color: #000;
    margin-bottom: 1rem;
}

.subtitle {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 2rem;
}

.spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #007bff;
    animation: spin 1s ease infinite;
    margin: 2rem auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.submit-button {
    padding: 0.9rem 2rem;
    background-color: #000;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 1rem;
}

.submit-button:hover {
    background-color: #333;
}

.error-message {
    color: #e74c3c;
    background-color: #fce7e7;
    border: 1px solid #e74c3c;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 2rem;
}
</style>