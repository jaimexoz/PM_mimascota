<template>
    <div class="auth-container">
        <p class="adopcion-foto-auth">Designed by <a href="https://pixabay.com/">Pixabay</a></p>
        <div v-if="isLogin" class="back-to-home">
            <router-link to="/" class="back-link">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Inicio
            </router-link>
        </div>
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
            <!-- <img src="../assets/dogcat.jpg" alt="Perro y Gato" class="mascot-image" />-->
          
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
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    overflow: hidden;

    /* ¡CAMBIOS CLAVE AQUÍ! */
    /* La imagen de fondo ahora va aquí */
    background-image: url('https://res.cloudinary.com/dxf384txl/image/upload/v1770000848/cat_pghsw7.jpg');
    background-position: center; /* Centramos la imagen */
    background-size: cover; /* Cubre todo el contenedor */
    background-repeat: no-repeat; /* No repite la imagen */
    background-color: #fce4ec; /* Color de fondo por si falla la imagen */
}

.form-section {
    flex: 1; /* Esta propiedad hace que ocupe 1/2 del espacio horizontal disponible */
    background-color: #ffffff; /* Fondo blanco para el formulario */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Centra el contenido verticalmente */
    align-items: center; /* Centra el contenido horizontalmente */
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
}
/** */
.image-section {
    flex: 1;
}

.mascot-image {
    width: 120%; /* La imagen ocupará el 100% del ancho del div padre */
    height: auto;
    object-fit: cover; /* Recorta la imagen para que cubra todo el espacio sin deformarse */
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
        flex-direction: row; /* Coloca los elementos uno al lado del otro */
        gap: 0; /* Elimina el espacio entre las secciones */
        width: 100%; /* Tamaño fijo para el contenedor, opcional */
        height: 500px; /* Tamaño fijo para la altura, opcional */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        
        overflow: hidden; /* Importante para que los bordes redondeados funcionen */
    }
    .form-section {
        flex: 1;
        align-items: center;
        background-color: #ffffff;
        height: 100%;
        border-bottom-right-radius: 50px;
        border-top-right-radius: 50px;
        
        box-shadow: 1px 10px 10px 10px rgba(32,32,32,0.3);
    }
}

.adopcion-foto-auth{
    position: absolute;
    bottom: 1px;
    font-size: 6px;
    text-decoration: none; /* Quita la línea */
    color: rgb(0, 0, 0);  
    text-align: end;
    margin-left: 50px;
}

.adopcion-foto-auth a{
    text-decoration: none; /* Quita la línea */
    color: rgb(0, 0, 0);  
}

/* Estilos para el botón Volver */
.back-to-home {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
}

.back-link {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #333;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 10px 16px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.back-link:hover {
   background-color: #ff9595;
    color: white;
    transform: translateX(-5px);
}

.back-link svg {
    transition: transform 0.3s ease;
}

.back-link:hover svg {
    transform: translateX(-3px);
}
</style>