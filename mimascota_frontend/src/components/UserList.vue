<template>
  <div class="user-list-page">
    <!-- Navbar -->
    <Navbar />
    
    <!-- Contenido Principal -->
    <main class="main-content">
      
      <div class="user-list-container">
        
        <div class="header-section">
          
          <h2>Lista de Usuarios</h2>
        </div>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre de usuario..."
          />
          <Search class="search-icon" />
        </div>

        <div class="table-container">

        
        <table class="user-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Correo</th>
              <th>Celular</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5">Cargando usuarios...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="5">{{ error }}</td>
            </tr>
            <tr v-else-if="filteredUsuarios.length === 0">
              <td colspan="5">No hay usuarios para mostrar.</td>
            </tr>
            <tr v-for="usuario in filteredUsuarios" :key="usuario.id">
              <td>{{ usuario.nombre }}</td>
              <td>{{ usuario.apellido }}</td>
              <td>{{ usuario.correo }}</td>
              <td>{{ usuario.celular }}</td>
              <td>
                <span :class="rolClass(usuario.rol)">
                  {{ getRoleName(usuario.rol) }}
                </span>
              </td>
                             <td class="acciones">
                 <!-- Mostrar ícono de editar para todos los usuarios (incluyendo admin) -->
                 <div class="role-edit-container">
                   <span class="icon editar" title="Editar Rol" @click="toggleRoleMenu(usuario.id)">
                     <svg width="20" height="20" fill="#007bff" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                   </span>
                   
                   <!-- Menú desplegable de roles -->
                   <div v-if="openRoleMenu === usuario.id" class="role-dropdown">
                     <div class="role-option" @click="changeUserRole(usuario.id, 1)" :class="{ 'active': usuario.rol === 1 }">
                       <span class="role-badge admin">Admin</span>
                     </div>
                     <div class="role-option" @click="changeUserRole(usuario.id, 2)" :class="{ 'active': usuario.rol === 2 }">
                       <span class="role-badge user">Usuario</span>
                     </div>
                     <div class="role-option" @click="changeUserRole(usuario.id, 3)" :class="{ 'active': usuario.rol === 3 }">
                       <span class="role-badge employee">Empleado</span>
                     </div>
                   </div>
                 </div>
                 
                 <span class="icon bloquear" title="Bloquear Usuario">
                   <svg width="20" height="20" fill="#dc3545" viewBox="0 0 24 24">
                     <circle cx="12" cy="12" r="10" fill="#dc3545"/>
                     <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
                   </svg>
                 </span>
               </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from './Navbar.vue';
import { getToken } from '../utils/auth';

import { Search } from 'lucide-vue-next';

const router = useRouter();

const usuarios = ref([]);
const searchQuery = ref('');
const loading = ref(true);
const error = ref(null);
const openRoleMenu = ref(null);
const changingRole = ref(false);

const fetchUsuarios = async () => {
  loading.value = true;
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3000/api/auth/usuarios', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('No tienes permisos para ver la lista de usuarios');
      }
      throw new Error('Error al obtener usuarios');
    }
    
    usuarios.value = await response.json();
    error.value = null;
  } catch (err) {
    error.value = err.message;
    usuarios.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsuarios();
  document.addEventListener('click', handleClickOutside);
});

const filteredUsuarios = computed(() => {
  if (!searchQuery.value) return usuarios.value;
  return usuarios.value.filter(u =>
    u.nombre.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const rolClass = (rol) => {
  if (rol === 1) return 'rol-admin';
  if (rol === 2) return 'rol-user';
  if (rol === 3) return 'rol-employee';
  return 'rol-admin';
};

const getRoleName = (rol) => {
  if (rol === 1) return 'Admin';
  if (rol === 2) return 'Usuario';
  if (rol === 3) return 'Empleado';
  return 'Admin';
};

const goBack = () => {
  router.push('/home');
};

// Función para abrir/cerrar el menú de roles
const toggleRoleMenu = (userId) => {
  if (openRoleMenu.value === userId) {
    openRoleMenu.value = null;
  } else {
    openRoleMenu.value = userId;
  }
};

// Función para cambiar el rol del usuario
const changeUserRole = async (userId, newRole) => {
  if (changingRole.value) return;
  
  changingRole.value = true;
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`http://localhost:3000/api/auth/change-user-role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        newRole
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al cambiar el rol del usuario');
    }

    // Actualizar la lista de usuarios
    await fetchUsuarios();
    
    // Cerrar el menú
    openRoleMenu.value = null;
    
  } catch (err) {
    console.error('Error al cambiar rol:', err);
    error.value = err.message;
  } finally {
    changingRole.value = false;
  }
};

// Cerrar menús al hacer clic fuera
const handleClickOutside = (event) => {
  if (!event.target.closest('.role-edit-container')) {
    openRoleMenu.value = null;
  }
};
</script>

<style scoped>
.user-list-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: 'Inter', sans-serif;
}

.main-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
}

.user-list-container {
  max-width: 1100px;
  margin: auto;
  padding: 10px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-top: 46px;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 24px;
}



.header-section h2 {
  margin: 0;
  font-weight: 700;
  font-size: 2rem;
}

h2 {
  text-align: left;
  margin-bottom: 24px;
  color: #2c3e50;
}


.search-bar {
  position: relative;
  justify-content: center;
  flex-grow: 1;
  max-width: 26rem; /* max-w-sm */
  margin: auto;
  width: 100%;
}

.search-bar input {
  width: 97%;
  padding: 0.5rem 1rem 0.5rem 2.5rem; /* py-2 pl-10 pr-4 */
  border-radius: 9999px; /* rounded-full */
  border: 2px solid #d1d5db; /* border-gray-300 */
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); /* shadow-inner */
  transition: all 200ms ease;
}

.search-bar input:focus {
  border-color: #ff9595;  /* focus:border-indigo-500 */
  box-shadow: 0 0 0 1px #ff9595; /* focus:ring-indigo-500 */
  outline: none;
}

.search-icon {
  position: absolute;
  left: 0.75rem; /* left-3 */
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af; /* text-gray-400 */
}


.table-container {
    max-width: 1000px;
    margin: 30px auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  background: #fafbfc;
  color: #555;
}

.user-table th {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.user-table td{
  overflow: visible;
  position: relative;
  padding-left: 15px;
  padding-top: 5px;
  padding-bottom: 10px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.user-table th {
  background-color: #ff6060;  /* Fondo oscuro para el encabezado */
  color: #fff;
  font-weight: bold;
  text-transform: uppercase;
}


.rol-user {
  background: #eafaf1;
  color: #27ae60;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.95em;
}

.rol-admin {
  background: #f3e8ff;
  color: #8e44ad;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.95em;
}

.rol-employee {
  background: #fff3cd;
  color: #856404;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.95em;
}

.acciones {
  
  gap: 10px;
}

.icon {
  cursor: pointer;
  align-items: center;
  transition: transform 0.1s;
}
.icon:hover {
  transform: scale(1.15);
}

.icon.bloquear {
  color: #dc3545;
}

.icon.bloquear:hover {
  color: #c82333;
}

/* Estilos para el menú de edición de roles */
.role-edit-container {
  position: relative;
  display: inline-block;
  margin: 7px;
  padding-bottom: 0; 
}

.role-dropdown {
  position: absolute;
  top: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  min-width: 100px;
  margin-top: 5px;
}

.role-option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.role-option:last-child {
  border-bottom: none;
}

.role-option:hover {
  background-color: #f8f9fa;
}

.role-option.active {
  background-color: #e3f2fd;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #f3e8ff;
  color: #8e44ad;
}

.role-badge.user {
  background-color: #eafaf1;
  color: #27ae60;
}

.role-badge.employee {
  background-color: #fff3cd;
  color: #856404;
}

@media (max-width: 768px) {
  .user-list-container {
    margin: 10px;
    padding: 20px 10px;
  }
  
  .search-bar input {
    width: 100%;
    max-width: 300px;
  }
}
</style> 