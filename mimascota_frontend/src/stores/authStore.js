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
                // Guarda en localStorage para mantener la sesión
                localStorage.setItem(TOKEN_KEY, newToken);
            } else {
                // Si el token es nulo (cierre de sesión), lo elimina
                localStorage.removeItem(TOKEN_KEY);
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
         */
        logout() {
            this.setToken(null);
            // Opcional: Redirigir al login o página principal
            // router.push('/login'); 
            console.log("Sesión cerrada.");
        }
    },
});
