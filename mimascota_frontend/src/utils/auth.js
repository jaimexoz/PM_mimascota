// mi_mascota_frontend/src/utils/auth.js

// Nombre de la clave en el almacenamiento local para el token
const TOKEN_KEY = 'authToken';

/**
 * Guarda el token de autenticación en el almacenamiento local.
 * @param {string} token - El token JWT.
 */
export function login(token) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

/**
 * Elimina el token de autenticación del almacenamiento local.
 */
export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('userData'); // Limpiar también los datos del usuario
    }
}

/**
 * Obtiene el token de autenticación del almacenamiento local.
 * @returns {string | null} El token JWT o null si no existe.
 */
export function getToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

/**
 * Comprueba si el usuario está autenticado verificando la existencia del token.
 * @returns {boolean} True si el token existe, de lo contrario False.
 */
export function isAuthenticated() {
    return !!getToken();
}

// Función para actualizar datos del usuario y notificar cambios
export function updateUserData(newUserData) {
  localStorage.setItem('userData', JSON.stringify(newUserData));
  
  // Emitir evento personalizado para notificar cambios
  window.dispatchEvent(new CustomEvent('userDataUpdated', {
    detail: newUserData
  }));
}

// Función para obtener datos del usuario de forma reactiva
export function getUserData() {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
}

// Función para suscribirse a cambios en los datos del usuario
export function onUserDataChange(callback) {
  const handler = (event) => {
    callback(event.detail);
  };
  
  window.addEventListener('userDataUpdated', handler);
  
  // Retornar función para desuscribirse
  return () => {
    window.removeEventListener('userDataUpdated', handler);
  };
}