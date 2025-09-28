<template>
  <div class="home-page">
    <!-- Navbar -->
    <Navbar />
    
    <!-- Contenido Principal -->
    <main class="main-content">
      <!-- Título de la Página -->
      <div class="page-header">
        <div class="title-section">
          <h1 class="page-title-1st">ENCUENTRA A <br>TU NUEVO</h1>
          <h1 class="page-title-2nd">MEJOR AMIGO</h1>
          <p class="page-title-3rd">Adopta una mascota</p>
          <a href="#loq"  class="explore-button">Explorar</a>
          
      </div>
        
        <div class="image-section" id="loquis">
            <img src="../assets/inip.png" alt="Perro y Gato" class="mascot-image" />
          
        </div>
      </div>

      <!-- Contenido de la Página -->
      <div class="page-content" id="loq">
        <div class="title-adopt-section" >
          <h2>MASCOTAS DISPONIBLES PARA ADOPTAR</h2>
        </div>
        <section class="mascotas-disponibles">
          <div class="tarjetas-grid">
            <TarjetaMascota
              v-for="mascota in mascotas"
              :key="mascota.id"
              :mascota="mascota"
            />
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script setup>
import Navbar from './Navbar.vue';

</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
}

.page-header {
  background: #fef6f2;
  padding: 2rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 2rem;
  display: flex;
}

.title-section{
  flex: 2;
  padding-left: 50px;
  height: auto;
  display: flex; 
  justify-content: center; 
 
  flex-direction: column;
}

.page-title-1st {
  text-align: left;
  font-size: 4.5rem;
  font-weight: 800;
  color: #333;
  margin: 0;
  letter-spacing: 2px;
}

.page-title-2nd {
  text-align: left;
  font-size: 4.5rem;
  font-weight: 800;
  color: #ff9100;
  margin: 0;
  letter-spacing: 2px;
}

.page-title-3rd{
  font-weight: 700;
  font-size: 2.0rem;
}

.explore-button{
  /* Fondo y color del texto */
  background-color: #FFA500; 
  color: white; 
  border: none; 
  border-radius: 50px; 
  margin-top: 25px;
  padding: 15px 40px; 
  width: 40%;
  font-family: sans-serif; 
  font-size: 30px; 
  font-weight: bold; 
  text-align: center;  
  text-decoration: none; 
  cursor: pointer; 
  transition: background-color 0.3s ease;
  box-shadow: 0px 2px 3px 2px rgba(0,0,0,0.5);

}

.explore-button:hover {
  background-color: #f47004; /* Un naranja ligeramente más oscuro al pasar el ratón */
}

.image-section{
  display: flex;
  flex: 3;

}

.mascot-image{
  width: 100%;
  height: 100%;
}



.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.title-adopt-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title-adopt-section h2 {
  font-size: 2rem;
  font-weight: 800; 
  color: #000000;
  margin-bottom: 1rem;
}



@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}
</style>