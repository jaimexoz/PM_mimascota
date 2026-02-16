// Script para reemplazar todas las URLs hardcodeadas con la configuración centralizada
// Este archivo contiene ejemplos de cómo actualizar cada tipo de llamada

import { apiUrl, backendUrl, API_BASE_URL, BACKEND_URL } from '@/config/api';

// ========================================
// EJEMPLOS DE REEMPLAZO
// ========================================

// ❌ ANTES:
// const response = await fetch('http://localhost:3000/api/auth/login', {...});

// ✅ DESPUÉS (Opción 1 - Recomendada):
// const response = await fetch(apiUrl('/auth/login'), {...});

// ✅ DESPUÉS (Opción 2 - Directa):
// const response = await fetch(`${API_BASE_URL}/auth/login`, {...});

// ========================================
// Para Socket.IO:
// ========================================

// ❌ ANTES:
// socket = io('http://localhost:3000', {...});

// ✅ DESPUÉS:
// socket = io(BACKEND_URL, {...});

// ========================================
// Para imágenes del backend:
// ========================================

// ❌ ANTES:
// return `http://localhost:3000${user.imageUrl}`;

// ✅ DESPUÉS:
// return backendUrl(user.imageUrl);

export default {
  // Ejemplos de uso en componentes
  examples: {
    fetch: `const response = await fetch(apiUrl('/auth/login'), {...});`,
    axios: `const response = await axios.post(apiUrl('/auth/register'), data);`,
    socket: `socket = io(BACKEND_URL, {...});`,
    image: `const imageUrl = backendUrl(user.imageUrl);`
  }
};
