// src/http.js
import axios from 'axios';
import { getToken } from './utils/auth';
// 🔥 IMPORTACIONES NECESARIAS
import { useAuthStore } from './stores/authStore';
import router from './router'; // Asume que tienes un archivo de configuración del router (src/router/index.js o similar)

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Tu servidor Express
  headers: { 'Content-Type': 'application/json' },
});

export function setAuthHeader(token) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Configura el header inicial al cargar la app
const initialToken = getToken();
if (initialToken) {
  setAuthHeader(initialToken);
}

// ----------------------------------------------------
// 🚨 INTERCEPTOR DE RESPUESTA 🚨
// ----------------------------------------------------

apiClient.interceptors.response.use(
    // 1. Manejo de Respuesta Exitosa (no hacemos nada)
    (response) => response,

    // 2. Manejo de Errores
    async (error) => {
        // Solo necesitamos el store para ejecutar el logout
        const authStore = useAuthStore();
        
        // Verifica si el error es 401 (No Autorizado, que incluye Token Expirado)
        if (error.response && error.response.status === 401) {
            
            console.warn("Token expirado o no autorizado. Forzando cierre de sesión.");

            // 1. Ejecuta el logout (borra localStorage, Pinia y llama a setAuthHeader(null))
            authStore.logout(); 

            // 2. Redirige al usuario a la página de inicio de sesión
            if (router) {
                // Usar router.push
                router.push({ name: 'Login' }); 
            } else {
                // Alternativa si el router no está disponible
                // window.location.href = '/login'; 
            }

            alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            
            // Rechaza la promesa para detener la ejecución en el componente que hizo la llamada
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default apiClient;