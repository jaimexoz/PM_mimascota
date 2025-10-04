import { createApp } from 'vue';
import './assets/main.css'; // Importar estilos globales
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router'; // Importa la configuración de tu router
/* 1. Importar el Core y el Componente Vue */
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // <<delete>/* 2. Importar y añadir los iconos que usas (Estrella) */   

/* 2. Importar y añadir los iconos que usas (Estrella) */
import { faStar } from '@fortawesome/free-solid-svg-icons'; // Estrella rellena
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'; // Estrella vacía
import { useAuthStore } from './stores/authStore';

library.add(faStar, farStar); // ¡IMPORTANTE! Añadir los iconos a la librería


const app = createApp(App);

const pinia = createPinia();
app.component('font-awesome-icon', FontAwesomeIcon); 

// 4. Conectar Pinia a la aplicación Vue (¡CRÍTICO!)
app.use(pinia);

const authStore = useAuthStore();
authStore.loadTokenFromLocalStorage();

app.use(router); // Le decimos a Vue que use Vue Router
app.mount('#app');