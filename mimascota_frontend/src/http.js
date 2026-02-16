// src/http.js
import axios from 'axios';
import { getToken } from './utils/auth';
// 🔥 IMPORTACIONES NECESARIAS
import { useAuthStore } from './stores/authStore';
import router from './router'; // Asume que tienes un archivo de configuración del router (src/router/index.js o similar)
import { API_BASE_URL } from './config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Usa la configuración centralizada
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
// 🚨 INTERCEPTOR DE REQUEST 🚨
// Asegura que siempre se use el token más reciente de localStorage
// ----------------------------------------------------
apiClient.interceptors.request.use(
    (config) => {
        // Siempre obtener el token más reciente de localStorage antes de cada petición
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // Si no hay token, eliminar el header de autorización
            delete config.headers.Authorization;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
            // Obtener la URL de la petición para determinar si es un error de login
            const requestUrl = error.config?.url || '';
            const isLoginRequest = requestUrl.includes('/auth/login');
            
            // Si es un error de login, NO mostrar el alert de sesión expirada
            // Dejar que el componente LoginForm maneje el mensaje de error
            if (isLoginRequest) {
                return Promise.reject(error);
            }
            
            // Para otros errores 401 (token expirado en peticiones autenticadas)
            console.warn("Token expirado o no autorizado. Forzando cierre de sesión.");

            // 1. Limpiar el header de autorización de axios
            setAuthHeader(null);
            
            // 2. Ejecuta el logout (borra localStorage, Pinia)
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