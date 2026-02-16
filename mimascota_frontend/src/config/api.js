// Configuración centralizada de la API
// Este archivo maneja las URLs del backend según el entorno (desarrollo/producción)

/**
 * URL base de la API
 * En desarrollo: usa localhost:3000
 * En producción: usa la variable de entorno VITE_API_URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * URL base del servidor (para Socket.IO y recursos estáticos)
 * En desarrollo: usa localhost:3000
 * En producción: usa la variable de entorno VITE_BACKEND_URL
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Helper para construir URLs de la API
 * @param {string} endpoint - El endpoint de la API (ej: '/auth/login')
 * @returns {string} - URL completa
 */
export function apiUrl(endpoint) {
  // Si el endpoint ya incluye /api, no lo agregamos de nuevo
  if (endpoint.startsWith('/api')) {
    return `${BACKEND_URL}${endpoint}`;
  }
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Helper para construir URLs de recursos estáticos del backend
 * @param {string} path - Ruta del recurso (ej: '/uploads/imagen.jpg')
 * @returns {string} - URL completa
 */
export function backendUrl(path) {
  // Si ya es una URL completa (http/https), retornarla tal cual
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }
  return `${BACKEND_URL}${path}`;
}

export default {
  API_BASE_URL,
  BACKEND_URL,
  apiUrl,
  backendUrl
};
