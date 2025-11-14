<template>
  <div class="veterinaria-container">
    <Navbar />

    <main class="veterinaria-content">
      <section class="hero-section-nos">
        <div class="header-box">
          <h1 class="title">
            VETERINARIA <span class="brand-text">MI MASCOTA</span>
          </h1>
        </div>
        
        <div class="info-layout">
          <div class="text-column">
            <p>
              Ubicada en Ecuador, nos destacamos por ofrecer un servicio de calidad y por brindar
              una atención personalizada a cada mascota que ingresa por sus puertas. Además, cuentan
              con las instalaciones y equipamiento necesarios para realizar diagnósticos precisos
              y procedimientos médicos efectivos.
            </p>
            
            <p>
              Nos encontramos ubicados en la provincia de Santo Domingo de los Tsáchilas,
              específicamente en el cantón Santo Domingo, Ecuador. Especializada en servicios
              veterinarios, sus instalaciones se encuentran en la dirección <strong>PRWH+RQJ, C. Latacunga,
              Santo Domingo, Ecuador</strong>.
            </p>

            <p class="highlight-text">
              Si estás en la búsqueda de un veterinario confiable y comprometido con el cuidado de tu mascota,
              la Veterinaria Mi Mascota es una excelente opción en Santo Domingo. Con años de experiencia en el campo de
              la veterinaria, este centro se posiciona como una de las mejores opciones para el bienestar de tus animales de
              compañía.
            </p>
          </div>

          <div class="image-column-nos">
            <img 
              src="../assets/dog-nosotros.jpg" 
              alt="Cachorro blanco acostado, emblema de la Veterinaria Mi Mascota"
              class="puppy-image"
            />
          </div>
        </div>
      </section>
    </main>
    
    <Footer />
  </div>
</template>

<script>
// NOTA: En Vue 3 con Composition API, no necesitas importar nada si usas
// <Navbar> y <Footer> como componentes globales o los registras localmente.

// Ejemplo de registro local (si no son globales):
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue'; 

export default {
  name: 'VeterinariaPage',
  components: {
    Navbar,
    Footer,
  },
  
};
</script>

<style scoped>
/* Colores de Marca */
:root {
  --brand-pink: #FFB6C1;
  --text-color: #333333;
  --light-grey: #f8f8f8;
}

/* Estilos Globales para el Contenedor */
.veterinaria-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Montserrat', sans-serif; /* Usando una fuente moderna */
    color: var(--text-color);
}

/* Estilos de la Sección Principal */
.veterinaria-content {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    margin-top: 100px;
    width: 100%;
}

/* Estilos de la Cabecera */
.hero-section {
    padding-top: 40px;
    padding-bottom: 40px;
}

.header-box {
    margin-bottom: 40px;
    /* Estilo de línea sutil */
    border-bottom: 2px solid var(--brand-pink);
    padding-bottom: 10px;
}

.title {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-color);
    letter-spacing: -1px;
    margin: 0;
}

.brand-text {
    color: var(--brand-pink);
    font-weight: 800;
}

/* Layout del Texto y la Imagen */
.info-layout {
    display: flex;
    gap: 40px;
    align-items: flex-start;
}

.text-column {
    flex: 1;
    font-size: 1.1rem;
    line-height: 1.7;
}

.text-column p {
    margin-bottom: 25px;
}

.highlight-text {
    font-weight: 600;
    color: #555555;
    padding: 15px;
    background-color: var(--light-grey);
    border-left: 5px solid var(--brand-pink);
    border-radius: 4px;
}

.image-column-nos {
    flex: 1;
    max-width: 50%;
    position: relative;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    border-radius: 50px;
    overflow: hidden;
}

.puppy-image {
    width: 120%;
    height: auto;
    display: block;
    object-fit: cover;
}

/* --- Media Queries para Responsividad --- */
@media (max-width: 992px) {
    .title {
        font-size: 2.5rem;
    }
    .info-layout {
        gap: 30px;
    }
}

@media (max-width: 768px) {
    .info-layout {
        flex-direction: column; /* Apila las columnas en móviles */
        gap: 20px;
    }

    .image-column {
        max-width: 100%; /* La imagen ocupa todo el ancho */
        order: -1; /* Mueve la imagen arriba del texto en móvil */
    }
    
    .title {
        font-size: 2rem;
    }
}
</style>