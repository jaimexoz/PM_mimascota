<template>
  <div class="gatos-page">
    <!-- Navbar -->
    <Navbar />
    
    <!-- Contenido Principal -->
    <main class="main-content">
      <!-- Título de la Página -->
      <div class="page-header">
        <h1 class="page-title">GATOS</h1>
        <div class="page-underline"></div>
      </div>

      <!-- Contenido de la Página -->
      <div class="page-content">
        <div class="content-placeholder">
          <h2>Página de Gatos</h2>
          <p>Aquí se mostrará el contenido relacionado con gatos.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
</script>

<style scoped>
.gatos-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
}

.page-header {
  background: white;
  padding: 2rem 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 2rem;
}

.page-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  letter-spacing: 2px;
}

.page-underline {
  width: 60px;
  height: 3px;
  background: #333;
  margin: 1rem auto 0;
  border-radius: 2px;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-placeholder {
  text-align: center;
  padding: 3rem 0;
}

.content-placeholder h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
}

.content-placeholder p {
  font-size: 1.1rem;
  color: #666;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}
</style> 