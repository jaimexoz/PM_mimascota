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
    background-image: url('../assets/cat.jpeg');
    background-position: 40px;
    background-size: cover; /* Cubre todo el contenedor */
    background-repeat: no-repeat; /* No repite la imagen */
    
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
/*
    .image-section {
        flex: 2;
        background: none;
    }*/
}
</style>