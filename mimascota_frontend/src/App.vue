<template>
  <router-view />
</template>

<script setup>
</script>

<style>
/* Estilos globales */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh; /* Asegura que la raíz del documento ocupe toda la altura visible */
  /* El siguiente es CLAVE para la barra horizontal. Si no la quieres, ocultala aquí: */
  overflow-x: hidden; /* Evita que el scroll horizontal aparezca a menos que sea forzado */
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
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}
</style>