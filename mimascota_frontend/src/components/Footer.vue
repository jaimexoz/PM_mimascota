<template>
    <footer>
      <div class="footer-content">
        <div class="footer-logo">
          <div class="logo-text">
            <img  src="/src/assets/LogoMiMascota.png" alt="logo-aplicación" style="width: 35%;">
          </div>
        </div>
  
        <div class="footer-info">
          <div class="contact-item">
            <img  src="/src/assets/ubicacion.png" alt="ubicacion" width="32px">
            <p>PRWH+RQJ Veterinaria Mi Mascota, C. Latacunga, Santo Domingo, Ecuador</p>
          </div>
          <div class="contact-item">
            <img  src="/src/assets/llamar.png" alt="ubicacion" width="32px">
            <p>+593 2-275-1631</p>
          </div>
          <div class="contact-item">
            <img  src="/src/assets/correo.png" alt="ubicacion" width="32px">
            <p>mimascolitacfg@gmail.com</p>
          </div>
        </div>
      </div>
  
      <div class="footer-bar">
        MI MASCOTA &copy; 2025 Todos los derechos reservado
      </div>
    </footer>
  </template>
  
  <script>
  export default {
    name: 'Footer',
  };
  </script>
  
  <style>
  /* Colores y Variables */
  :root {
    --brand-pink: #FFB6C1;
    --dark-pink-bar: #ff9595;
    --dark-text: #333333;
    --footer-bg: #f8f8f8; /* Fondo claro para la sección de info */
  }
  
  /* --- Estilos de la Barra Superior de Contenido --- */
  .footer-content {
    background-color: var(--footer-bg);
    padding: 40px 20px;
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    margin: 0 auto;
    border-top: 1px solid #e0e0e0;
  }
  
  /* Estilos del Logo (Simulado con texto) */
  .footer-logo {
    flex: 1;
    min-width: 200px;
    margin-right: 20px;
  }
  
  .logo-text {
      line-height: 1;
      text-align: center;
  }
  
  .adopciones {
      display: block;
      font-size: 1.2rem;
      font-weight: 300;
      color: var(--dark-text);
      margin-bottom: 5px;
  }
  
  .mi-mascota {
      display: block;
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--dark-text);
      /* El mismo color rosa que el título de la página */
      text-shadow: 2px 2px 0px var(--brand-pink); 
  }
  
  
  /* Estilos de la Información de Contacto */
  .footer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    font-size: 1rem;
    color: #555555;
    padding-left: 20px;
    border-left: 1px solid #e0e0e0;
  }
  
  .contact-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  
  .contact-item p {
    margin: 0;
    line-height: 1.4;
    margin: 5px;
  }
  
  .icon {
    color: var(--dark-pink-bar); /* Color de acento */
    font-size: 1.2rem;
    padding-top: 2px;
  }
  
  /* --- Estilos de la Barra Inferior (Basados en tu template) --- */
  .footer-bar {
    width: 100%;
    background: var(--dark-pink-bar); 
    color: #fff;
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
    padding: 0.5rem 0 0.5rem 0;
    letter-spacing: 2px;
    z-index: 2;
  }
  
  /* --- Media Queries para Responsividad --- */
  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 30px 10px;
    }
  
    .footer-logo {
      margin-bottom: 30px;
    }


    .footer-info {
      border-left: none;
      padding-left: 0;
      border-top: 1px solid #e0e0e0;
      padding-top: 30px;
      align-items: flex-start; /* Alinear ítems de contacto a la izquierda */
    }
  
    .contact-item {
      width: 100%;
      justify-content: flex-start;
    }
  }
  </style>