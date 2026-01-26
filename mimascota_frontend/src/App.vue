<template>
  <router-view />
</template>
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

// Esta función se ejecuta automáticamente cuando el componente App.vue se monta (al cargar la app)
onMounted(async () => {
    // Inicializar el store desde localStorage
    authStore.loadTokenFromLocalStorage();
    
    // Usar la clave correcta 'authToken' en lugar de 'token'
    const token = localStorage.getItem('authToken');
    
    // Solo procedemos si existe un token guardado
    if (token) {
        console.log("Token encontrado. Verificando su validez...");
        
        // Usamos una ruta protegida simple para verificar el token
        // Usaremos la ruta 'update-user-info' como endpoint de prueba
        try {
            const response = await fetch('http://localhost:3000/api/auth/update-user-info', {
                method: 'PUT', // PUT requiere token y es un endpoint privado
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Es crucial enviar el token
                },
                // Se envía un cuerpo mínimo. El backend solo necesita validar la autenticación.
                body: JSON.stringify({ /* No es necesario enviar datos reales aquí */ }) 
            });
            
            // Si la respuesta no es 200 OK (ej. es 401 Unauthorized o 400 Bad Request)
            if (!response.ok) {
                // Leemos el error para obtener detalles si es posible
                const errorData = await response.json();
                
                // Si el backend responde con 401 (token fallido/expirado), lo tratamos como error grave.
                if (response.status === 401) {
                    // Lanzamos un error que será capturado por el bloque catch
                    throw new Error(errorData.message || 'Token expirado o inválido.');
                }
            }
            
            // Si la petición es exitosa (response.ok es true), el token es válido.
            console.log("Token verificado correctamente. Sesión activa.");

        } catch (error) {
            console.error('Fallo en la verificación del token. Forzando cierre de sesión.', error.message);

            // Usamos el store para limpiar TODO (token, usuario, localStorage)
            authStore.logout();
            
            if (router.currentRoute.value.path !== '/login') {
                router.push({ name: 'auth' }); // Redirigir a la página de auth
            }
        }
    }
});
</script>

<style>
/* Estilos globales */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: #ffffff;
  min-height: 75vh; /* Asegura que la raíz del documento ocupe toda la altura visible */
  /* El siguiente es CLAVE para la barra horizontal. Si no la quieres, ocultala aquí: */
  /* Evita que el scroll horizontal aparezca a menos que sea forzado */
}

*, *::before, *::after {
  box-sizing: border-box; /* Un reset de box-sizing muy útil */
}

/* Si quieres que los mensajes de éxito/error sean globales y no repetirlos, podrías moverlos aquí */
.success-message,
.error-message {
  /* ... tus estilos de mensaje ... */
  margin-top: 15px;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px; /* Ajusta según el ancho deseado para mensajes */
  box-sizing: border-box;
  margin-bottom: 20px;
}

.success-message {
  color: #155724;
  background-color: #dcedd4;
  border: 1px solid #c3e6cb;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
</style>