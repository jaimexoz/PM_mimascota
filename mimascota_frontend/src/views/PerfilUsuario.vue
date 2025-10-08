<template>
  <div class="perfil-page">
    <Navbar />
    <div class="perfil-fondo"> 
    </div>
    <div class="perfil-contenido">
      
      <div class="perfil-card">
        <div class="perfil-foto-section">
          <div class="perfil-foto-wrapper">
            <img :src="userImageUrl" :alt="userName" class="perfil-foto" @error="handleImageError" />
            <label class="subir-foto-btn">
              <input type="file" accept="image/*" @change="onFileChange" hidden />
              {{ loading ? 'Subiendo...' : (userImageUrl === defaultAvatar ? 'Subir Foto ↑' : 'Cambiar Foto ↑') }}
            </label>
          </div>
        </div>
        
        <!-- Mensajes de estado -->
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        
        <div class="perfil-info-section">
          <div class="perfil-col info">
            <h2>Información</h2>
            <div class="info-item"><span>Nombre</span><input type="text" :value="userName" readonly /></div>
            <div class="info-item"><span>Correo electrónico</span><input type="text" :value="userEmail" readonly /></div>

           
              <div class="info-item-2"><span>Teléfono</span><input type="text" :value="userPhone" readonly /></div>
              <div class="info-item-21"><span>Edad</span><input type="text" :value="userAge" readonly /></div>
            
            
            <div class="info-buttons">
              <button class="info-btn">Guardar</button>
              <button class="info-btn" @click="showChangePasswordModal = true">Cambiar contraseña</button>
            </div>
          </div>
        </div>
      </div>
      


      <div class="perfil-card-fun">
        <div class="perfil-col funcionalidades">
            <div class="fun-top">
                <h2>Funcionalidades</h2>
            </div>
            <div class="func-grid">
              <div class="func-column">
                <router-link to="/agregarmascota" class="func-btn">
                        Agregar Mascotas
                </router-link>


                <button class="func-btn">Editar Mascotas</button>
                <button class="func-btn">Eliminar Mascotas</button>

                <router-link to="/mypost" class="func-btn">
                  Mis Publicaciones
                </router-link>
                </div>
            </div>
        </div>

        <div class="perfil-col solicitud">
          <div class="fun-top">
            <h2>Adopciones y solicitudes</h2>
          </div>
          
            <div class="func-grid">
              
              <div class="func-column">
                <router-link to="/solicitudesenviadas" class="func-btn">
                  Solicitudes enviadas
                </router-link>

                <router-link to="/solicitudesrecibidas" class="func-btn">
                  Solicitudes recibidas
                </router-link>
                  <button class="func-btn">Adopciones Realizadas</button>
              </div>
            </div>
        </div>

      </div>
      
      
    </div>
    
    <!-- Modal para cambiar contraseña -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click="closeChangePasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Cambiar Contraseña</h3>
          <button class="close-btn" @click="closeChangePasswordModal">&times;</button>
        </div>
        
        <form @submit.prevent="changePassword" class="password-form">
          <!-- Mensajes de error y éxito dentro del modal -->
          <div v-if="passwordError" class="password-error">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="password-success">{{ passwordSuccess }}</div>
          
          <div class="form-group">
            <label for="currentPassword">Contraseña Actual:</label>
            <input 
              type="password" 
              id="currentPassword"
              v-model="passwordData.currentPassword"
              required
              placeholder="Ingresa tu contraseña actual"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">Nueva Contraseña:</label>
            <input 
              type="password" 
              id="newPassword"
              v-model="passwordData.newPassword"
              required
              placeholder="Ingresa tu nueva contraseña"
            />
            <small class="password-hint">Mínimo 6 caracteres</small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirmar Nueva Contraseña:</label>
            <input 
              type="password" 
              id="confirmPassword"
              v-model="passwordData.confirmPassword"
              required
              placeholder="Confirma tu nueva contraseña"
            />
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeChangePasswordModal" :disabled="changingPassword">Cancelar</button>
            <button type="submit" class="submit-btn" :disabled="changingPassword">
              <span v-if="changingPassword" class="loading-spinner"></span>
              {{ changingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <footer class="footer-bar">MI MASCOTA</footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import { getToken, updateUserData, onUserDataChange } from '../utils/auth';

const router = useRouter();
const defaultAvatar = '/default-avatar.png';
const userData = JSON.parse(localStorage.getItem('userData') || '{}');
const userName = ref(userData.nombre || userData.name || '');
const userEmail = ref(userData.email || userData.emailx_usuari || '');
const userPhone = ref(userData.celular || userData.celula_usuari || '');
const userAge = ref(userData.edad_usuari || '');
const userImageUrl = ref(userData.imageUrl && userData.imageUrl.startsWith('http') ? userData.imageUrl : defaultAvatar);

// Función para actualizar los datos del usuario
const updateUserInfo = (newUserData) => {
  userName.value = newUserData.nombre || newUserData.name || '';
  userEmail.value = newUserData.email || newUserData.emailx_usuari || '';
  userPhone.value = newUserData.celular || newUserData.celula_usuari || '';
  userAge.value = newUserData.edad_usuari || '';
  userImageUrl.value = newUserData.imageUrl && newUserData.imageUrl.startsWith('http') ? newUserData.imageUrl : defaultAvatar;
};

// Suscribirse a cambios en los datos del usuario
let unsubscribe = null;

const loading = ref(false);
const error = ref('');
const success = ref('');

// Variables para el modal de cambio de contraseña
const showChangePasswordModal = ref(false);
const changingPassword = ref(false);
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const passwordError = ref('');
const passwordSuccess = ref('');

function handleImageError(e) {
  e.target.src = defaultAvatar;
}

async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    error.value = 'Por favor selecciona un archivo de imagen válido.';
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'La imagen debe ser menor a 5MB.';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch('http://localhost:3000/api/auth/update-profile-image', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar la foto de perfil');
    }

    // Actualizar datos del usuario usando la función centralizada
    const updatedUserData = {
      ...userData,
      ...data.user
    };
    updateUserData(updatedUserData);

    // Actualizar variables reactivas localmente
    updateUserInfo(updatedUserData);

    success.value = 'Foto de perfil actualizada exitosamente!';

    // Limpiar el input de archivo
    e.target.value = '';

  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Lifecycle hooks
onMounted(() => {
  // Suscribirse a cambios en los datos del usuario
  unsubscribe = onUserDataChange(updateUserInfo);
});

onUnmounted(() => {
  // Desuscribirse cuando el componente se desmonte
  if (unsubscribe) {
    unsubscribe();
  }
});

// Funciones para el cambio de contraseña
const closeChangePasswordModal = () => {
  showChangePasswordModal.value = false;
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  error.value = '';
  success.value = '';
  passwordError.value = '';
  passwordSuccess.value = '';
};

const changePassword = async () => {
  // Limpiar mensajes anteriores
  passwordError.value = '';
  passwordSuccess.value = '';

  // Validaciones
  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordError.value = 'Las contraseñas nuevas no coinciden.';
    return;
  }

  if (passwordData.value.newPassword.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
    return;
  }

  changingPassword.value = true;

  try {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3000/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: passwordData.value.currentPassword,
        newPassword: passwordData.value.newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al cambiar la contraseña');
    }

    passwordSuccess.value = 'Contraseña cambiada exitosamente!';
    
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      closeChangePasswordModal();
    }, 2000);

  } catch (err) {
    passwordError.value = err.message;
  } finally {
    changingPassword.value = false;
  }
}


</script>

<style scoped>




.perfil-page {
  min-height: 100vh;
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;
  background-image: url('../assets/huellas.jpg');
  background-size: contain;
  
}



.perfil-fondo {
  width: 100%;
  height: 100;
  background: #ffffff;
  position: relative;
}

.perfil-contenido {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin-top: 100px;
  z-index: 2;
}

.perfil-card {
  background: #ffffff4d;
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.332);
  border-radius: 24px;
  padding: 1rem;
  margin: 20px;
  align-items: center;
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  backdrop-filter: blur(8px);
}

.perfil-card-fun {
  
  border-radius: 24px;
  padding: 2.5rem 2rem 2rem 2rem;
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 500px;
  max-width: 600px;
  width: 100%;
  gap: 20px; /* Espacio entre el Recuadro 2 y el Recuadro 3 */
  flex-grow: 1;
  
}

.perfil-foto-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.perfil-foto-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.perfil-foto {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  background: #f0f0f0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.subir-foto-btn {
  background: #f6f6f6;
  border: white;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 24px;
  padding: 0.7rem 2.2rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0px 2px 5px hsl(0, 0%, 50%);
  margin-top: 0.5rem;
  text-align: center;
}
.subir-foto-btn:hover {
  background: #d1d1d1;
  border-color: #333;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  border: 1px solid #fcc;
}

.success-message {
  background: #efe;
  color: #363;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  border: 1px solid #cfc;
}

.perfil-info-section {
  display: flex;
  gap: 4rem;
  width: 100%;
  justify-content: center;
}

.perfil-col {
  background: none;
  flex: 1;
  min-width: 280px;
  max-width: 400px;
  padding-bottom: 20px;
}

.perfil-col h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  color: #000000;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 1.1rem;
  gap: 1rem;
}
.info-item span {
  min-width: 110px;
  width: 10%;
  font-weight: 700;
  font-size: 18px;
  color: #000000;
}
.info-item input {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: white;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  outline: none;
}



.info-item-2, .info-item-21{
  display: inline-block;
  align-items: center;
  margin-bottom: 1.1rem;
  gap: 1rem;
  width: 50%;
}

.info-item-2 span {
  min-width: 110px;
  width: 10%;
  font-weight: 700;
  font-size: 18px;
  color: #000000;
}

.info-item-21 span {
  min-width: 110px;
  width: 10%;
  font-weight: 700;
  font-size: 18px;
  color: #000000;
}


.info-item-2 input {
  flex: 1;
  width: 90%;
  padding: 0.5rem 0.8rem;
  margin-left: -1px;
  border: white;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  outline: none;
  
}

.info-item-21 input {
  flex: 1;
  width: 100%;
  padding: 0.5rem 0.8rem;
  margin-left: -1px;
  border: white;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  outline: none;
}



.info-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.info-btn {
  flex: 1;
  padding: 0.7rem 1.2rem;
  background: #ff9100;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}
.info-btn:hover {
  background: #ff7700;
  border-color: #ffffff;
}

.funcionalidades {
  background: #ffffffa0;
  margin-top: -40px;
  margin-bottom: 1px;
  align-items: flex-start;
  border-radius: 24px;
  min-width: 500px;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(8px);
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.332);
}

.fun-top{
  width: auto;
  justify-items: center;
  height: 49px;
  margin-bottom: 20px;
  border-bottom: 2px solid #ebebeb; 
  box-shadow: 0 2px 0px rgba(77, 68, 68, 0.12);

}

.solicitud{
  align-items: flex-start;
  background: #ffffffb1;
  border-radius: 24px;
  margin-top: 1px;
  min-width: 500px;
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(8px);
  box-shadow: 0px 0px 20px 0px rgba(0, 0, 0, 0.332);

}
.func-grid {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  padding: 0.5rem 2rem 1rem 2rem;
}

.func-column {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}
.func-btn {
  padding: 0.7rem 1.2rem;
  background: #f6f6f6;
  border: white;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 25px;
  font-weight: 600;
  color: #000000;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  width: 70%;
  text-align: center;
  box-shadow: 0px 2px 5px hsl(0, 0%, 50%);
}
.func-btn:hover {
  background: #d1d1d1;
  border-color: #d2d2d2;
}

.footer-bar {
  width: 100%;
  background: #111;
  color: #fff;
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  padding: 1.2rem 0 1rem 0;
  margin-top: 3rem;
  letter-spacing: 2px;
  z-index: 2;
}

/* Estilos para el modal de cambio de contraseña */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
  font-weight:600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.password-error {
  background: #fee;
  color: #c33;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #fcc;
  margin-bottom: 0.5rem;
}

.password-success {
  background: #efe;
  color: #363;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #cfc;
  margin-bottom: 0.5rem;
}

.password-hint {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: -15px;
  gap: 0.2rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.6rem;
  border: none;
  background: #eff1f2;
  color: white;
  border-radius: 25px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input::placeholder {
    color: #939393;    
    font-weight: 500;
}

.form-group input[type="password"] {
    color: #939393;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f8f8f8;
  border-color: #ccc;
}

.submit-btn {
  flex: 1;
  padding: 0.8rem;
  border: none;
  background: #ff9100;
  color: white;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #ff7700;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .perfil-card {
    min-width: 0;
    max-width: 98vw;
    padding: 2rem 0.5rem 2rem 0.5rem;
  }
  .perfil-info-section {
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }
}
</style> 