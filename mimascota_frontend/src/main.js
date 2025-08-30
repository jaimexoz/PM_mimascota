import { createApp } from 'vue';
import './assets/main.css'; // Importar estilos globales
import App from './App.vue';
import router from './router'; // Importa la configuración de tu router

const app = createApp(App);

app.use(router); // Le decimos a Vue que use Vue Router
app.mount('#app');