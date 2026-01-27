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
        user: null,  // Almacena los datos del usuario (nombre, rol, imagen, etc.)
        // isInitialized: false, 
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
                // Limpiar claves antiguas por compatibilidad
                localStorage.removeItem('token');
                localStorage.removeItem('userToken');
                localStorage.setItem(TOKEN_KEY, newToken);
            } else {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('token');
                localStorage.removeItem('userToken');
                this.user = null; // También limpiamos el usuario si el token es nulo
                localStorage.removeItem('userData');
            }
        },

        /**
         * Establece los datos del usuario y los guarda en localStorage.
         * @param {Object} userData - Los datos del usuario.
         */
        setUser(userData) {
            this.user = userData;
            if (userData) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                localStorage.removeItem('userData');
            }
        },

        /**
         * Carga el token desde el localStorage al iniciar la aplicación.
         */
        loadTokenFromLocalStorage() {
            if (!this.token) {
                const storedToken = localStorage.getItem(TOKEN_KEY);
                if (storedToken) {
                    this.token = storedToken;
                }
            }
            // También cargamos los datos del usuario para mantener la reactividad
            if (!this.user) {
                const storedUser = localStorage.getItem('userData');
                if (storedUser) {
                    try {
                        this.user = JSON.parse(storedUser);
                    } catch (e) {
                        console.error("Error al cargar datos de usuario de localStorage", e);
                    }
                }
            }
        },

        /**
         * Cierra la sesión del usuario.
         * @param {boolean} showAlert - Si debe mostrar un alert (por defecto false, el interceptor maneja los alerts)
         */
        logout(showAlert = false) {
            this.setToken(null);
            this.setUser(null);
            console.log("Sesión cerrada.");
            if (showAlert) {
                alert("Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.");
            }
        }
    },
});
