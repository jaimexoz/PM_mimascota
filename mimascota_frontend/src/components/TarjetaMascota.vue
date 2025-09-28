<template>
    <div class="tarjeta-mascota">
      <div class="imagen-mascota">
        <img :src="mascota.imagen_url" :alt="mascota.nombre" />
      </div>
      <div class="info-mascota">
        <div class="nombre-y-icono">
          <h3>{{ mascota.nombre }}</h3>
          <span class="icono-patita">🐾</span> </div>
        <div class="tags-mascota">
          <span class="tag">{{ mascota.sexo }}</span>
          <span class="tag">{{ mascota.raza }}</span>
          <span class="tag">{{ mascota.edad_anios }} yrs</span>
        </div>
        <button class="boton-perfil">Ver perfil</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'TarjetaMascota',
    props: {
      mascota: {
        type: Object,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  .tarjeta-mascota {
    background-color: #ffffff;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    overflow: hidden; /* Para que la imagen se ajuste al border-radius */
    width: 100%; /* Ocupa todo el ancho disponible en su columna del grid */
    max-width: 300px; /* Ancho máximo para la tarjeta */
    transition: transform 0.2s ease-in-out; /* Animación al pasar el ratón */
  }
  
  .tarjeta-mascota:hover {
    transform: translateY(-5px); /* Pequeño efecto de elevación al pasar el ratón */
  }
  
  .imagen-mascota img {
    width: 100%;
    height: 200px; /* Altura fija para las imágenes */
    object-fit: cover; /* Recorta la imagen para que llene el espacio sin distorsionarse */
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
  }
  
  .info-mascota {
    padding: 15px;
    text-align: left;
  }
  
  .nombre-y-icono {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .nombre-y-icono h3 {
    margin: 0;
    font-size: 1.5em;
    color: #333;
  }
  
  .icono-patita {
    font-size: 1.2em;
    color: #888;
  }
  
  .tags-mascota {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
  }
  
  .tag {
    background-color: #e0e0e0;
    color: #555;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 0.85em;
    white-space: nowrap; /* Evita que los tags se rompan en varias líneas */
  }
  
  .boton-perfil {
    background-color: #FFA500; /* Naranja similar al botón de "Explorar" */
    color: white;
    border: none;
    border-radius: 50px;
    padding: 10px 25px;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    width: 100%; /* El botón ocupa todo el ancho de la tarjeta */
    transition: background-color 0.3s ease;
  }
  
  .boton-perfil:hover {
    background-color: #E69500;
  }
  </style>