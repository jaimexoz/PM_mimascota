<template>
    <div class="auth-container">
        <div class="form-section">
            <p v-show="showPostRegistrationMessage" class="success-message-on-login">
                {{ postRegistrationMessage }}
            </p>
  
            <transition name="fade" mode="out-in">
                <component 
                    :is="isLogin ? LoginForm : RegisterForm" 
                    @toggle-form="toggleForm" 
                    @registration-success="handleRegistrationSuccess" 
                />
            </transition>
        </div>
        <div class="image-section">
            <img src="../assets/mascota_login.jpg" alt="Perro y Gato" class="mascot-image" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import LoginForm from '../components/LoginForm.vue';
import RegisterForm from '../components/RegisterForm.vue';

const isLogin = ref(true);
const postRegistrationMessage = ref('');
const showPostRegistrationMessage = ref(false);
const registrationWasSuccessful = ref(false);

const toggleForm = () => {
    isLogin.value = !isLogin.value;
    if (!registrationWasSuccessful.value) {
        showPostRegistrationMessage.value = false;
        postRegistrationMessage.value = '';
    }
    registrationWasSuccessful.value = false;
};

const handleRegistrationSuccess = (message) => {
    postRegistrationMessage.value = message;
    showPostRegistrationMessage.value = true;
    registrationWasSuccessful.value = true;
    isLogin.value = true;
    setTimeout(() => {
        showPostRegistrationMessage.value = false;
        postRegistrationMessage.value = '';
    }, 10000);
};
</script>

<style scoped>
.auth-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #fff;
    padding: 2rem;
    gap: 2rem;
    font-family: 'Inter', sans-serif;
}

.form-section {
    padding: 0;
    background: none;
    border-radius: 0;
    box-shadow: none;
    width: 100%;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.image-section {
    background: none;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 550px;
    padding: 2rem;
}

.mascot-image {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Estilo para el mensaje de éxito que aparece en la página de login */
.success-message-on-login {
    color: #27ae60; /* Verde para éxito */
    background-color: #e6faed; /* Fondo verde claro */
    border: 1px solid #27ae60;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px; /* Espacio antes del formulario de login */
    font-weight: bold;
    text-align: center;
    animation: fadeInOut 10s forwards; /* Duración de la animación */
}

/* Keyframes para la animación de aparición y desaparición */
@keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(-10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
}

/* Transiciones para los formularios */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Media queries para pantallas grandes */
@media (min-width: 900px) {
    .auth-container {
        flex-direction: row;
        gap: 4rem;
        background: #fff;
    }
    .form-section {
        flex: 1;
        align-items: center;
        background: none;
        box-shadow: none;
        border-radius: 0;
    }
    .image-section {
        flex: 1;
        background: none;
    }
}
</style>