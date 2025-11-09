// Asume que Pinia está instalado y configurado en tu proyecto Vue.
import { defineStore } from 'pinia';

// Nombre de la clave para guardar el token en localStorage
const TOKEN_KEY = 'authToken';

/**
 * Define y exporta la tienda (Store) de autenticación usando Pinia.
 */
export const useAuthStore = defineStore('auth', {
    // 1. Estado (state): Datos reactivos
    state: () => ({
        token: null, // Almacena el token JWT
        // isInitialized: false, // Opcional: para rastrear si se ha cargado el token del localStorage
    }),

    // 2. Getters: Propiedades computadas basadas en el estado
    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    // 3. Acciones (actions): Métodos para modificar el estado o ejecutar lógica asíncrona
    actions: {
        /**
         * Establece el token y lo guarda en el almacenamiento local (localStorage).
         * @param {string} newToken - El token JWT recibido del servidor.
         */
        setToken(newToken) {
            this.token = newToken;
            if (newToken) {
                // IMPORTANTE: Limpiar todos los tokens viejos antes de guardar el nuevo
                // Esto evita que queden tokens expirados en localStorage con diferentes claves
                localStorage.removeItem('token'); // Limpiar clave antigua
                localStorage.removeItem('userToken'); // Limpiar clave antigua
                
                // Guarda en localStorage para mantener la sesión
                localStorage.setItem(TOKEN_KEY, newToken);
            } else {
                // Si el token es nulo (cierre de sesión), limpiar todas las claves posibles
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('token'); // Limpiar clave antigua
                localStorage.removeItem('userToken'); // Limpiar clave antigua
            }
        },

        /**
         * Carga el token desde el localStorage al iniciar la aplicación.
         */
        loadTokenFromLocalStorage() {
            if (!this.token) { // Evita sobreescribir si ya está en memoria
                const storedToken = localStorage.getItem(TOKEN_KEY);
                if (storedToken) {
                    this.token = storedToken;
                    console.log("Token de autenticación cargado desde localStorage.");
                }
            }
        },

        /**
         * Cierra la sesión del usuario.
         * @param {boolean} showAlert - Si debe mostrar un alert (por defecto false, el interceptor maneja los alerts)
         */
        logout(showAlert = false) {
            this.setToken(null);
            // Opcional: Redirigir al login o página principal
            // router.push('/login'); 
            console.log("Sesión cerrada.");
            if (showAlert) {
                alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            }
        }
    },
});
