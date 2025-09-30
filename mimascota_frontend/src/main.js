import { createApp } from 'vue';
import './assets/main.css'; // Importar estilos globales
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router'; // Importa la configuración de tu router

const app = createApp(App);

const pinia = createPinia();

// 4. Conectar Pinia a la aplicación Vue (¡CRÍTICO!)
app.use(pinia);


app.use(router); // Le decimos a Vue que use Vue Router
app.mount('#app');