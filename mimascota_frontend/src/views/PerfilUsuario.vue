<template>
  <div class="perfil-page">
    <!-- Componente de navegación (asumiendo que existe en la ruta) -->
    <Navbar /> 
    <div class="perfil-fondo"> 
    </div>
    <div class="perfil-contenido">
      
      <div class="perfil-card">
        <div class="perfil-foto-section">
          <div class="perfil-foto-wrapper">
            <!-- La imagen de perfil -->
            <img :src="userImageUrl" :alt="userName" class="perfil-foto" @error="handleImageError" />
            
            <!-- Botón para subir/cambiar foto -->
            <label class="subir-foto-btn">
              <input type="file" accept="image/*" @change="onFileChange" hidden />
              {{ loading ? 'Subiendo...' : (userImageUrl === defaultAvatar ? 'Subir Foto ↑' : 'Cambiar Foto ↑') }}
            </label>
          </div>
        </div>

        <div style="justify-content: center; position: absolute; justify-items: center; width: 93%;">
        
        <div v-if="error" class="error-message" >{{ error }}</div>
        <div v-if="success" class="success-message" :class="{ 'fade-out': isSuccessFading }">{{ success }}</div>
        </div>

        <div class="perfil-info-section">
          <div class="perfil-col info">
            <h2>Información</h2>
            
            <!-- Nombre -->
            <div class="info-item">
              <span>Nombre</span>
              <input type="text" 
                     :value="isEditing ? editableData.name : userName" 
                     :readonly="!isEditing"
                     @input="isEditing ? editableData.name = $event.target.value : null"
                     :class="{ 'editable-input': isEditing }" />
            </div>

            <!-- Apellido -->
            <div class="info-item">
              <span>Apellido</span>
              <input type="text" 
                     :value="isEditing ? editableData.lastname : userLastname" 
                     :readonly="!isEditing"
                     @input="isEditing ? editableData.lastname = $event.target.value : null"
                     :class="{ 'editable-input': isEditing }" />
            </div>

            <!-- Correo electrónico (siempre solo lectura) -->
            <div class="info-item">
              <span>Correo electrónico</span>
              <input type="text" :value="userEmail" readonly />
            </div>

            <!-- Teléfono -->
            <div class="info-item-2">
              <span>Teléfono</span>
              <input type="text" 
                     :value="isEditing ? editableData.phone : userPhone" 
                     :readonly="!isEditing"
                     @input="isEditing ? editableData.phone = $event.target.value : null"
                     :class="{ 'editable-input': isEditing }" />
            </div>
            
            <!-- Edad -->
            <div class="info-item-21">
              <span>Edad</span>
              <input type="number" 
                     :value="isEditing ? editableData.age : userAge" 
                     :readonly="!isEditing"
                     @input="isEditing ? editableData.age = $event.target.value : null"
                     :class="{ 'editable-input': isEditing }" />
            </div>
            
            
            <div class="info-buttons">
              <!-- Botón Cancelar (solo visible en modo edición) -->
              

              <!-- Botón principal de Edición/Guardado -->
              <button class="info-btnG" 
                @click="isEditing ? saveChanges() : toggleEdit()" 
                :disabled="loading" >
                <span v-if="loading && isEditing" class="loading-spinner-small"></span> {{ isEditing ? 'Guardar' : 'Editar Información' }}
            </button>
              
              <button v-if="isEditing" class="info-btnC cancel-btn-edit" @click="toggleEdit" :disabled="loading">
                  Cancelar
              </button>
              
              <!-- Botón de cambio de contraseña (siempre visible) -->
              <button class="info-btn" @click="showChangePasswordModal = true" :disabled="isEditing || loading">
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
      <!-- Sección de Funcionalidades -->
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

                <router-link to="/editarmascota" class="func-btn">
                  Editar Mascotas
                </router-link>

                <button class="func-btn">Eliminar Mascotas</button>

                <router-link to="/mypost" class="func-btn">
                  Mis Publicaciones
                </router-link>
              </div>
            </div>
        </div>

        <!-- Sección de Adopciones y Solicitudes -->
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
// Asumiendo que Navbar es un componente funcional
import Navbar from '../components/Navbar.vue'; 
// Asumiendo que estas utilidades existen y manejan el token y localStorage
import { getToken, updateUserData, onUserDataChange } from '../utils/auth'; 

const router = useRouter();
const defaultAvatar = '/default-avatar.png';
const userData = JSON.parse(localStorage.getItem('userData') || '{}');

// Datos de usuario actuales (solo lectura/fuente de verdad)
const userName = ref(userData.nombre || userData.name || '');
const userLastname = ref(userData.apellido || userData.lastname || '');
const userEmail = ref(userData.email || userData.emailx_usuari || '');
const userPhone = ref(userData.celular || userData.celula_usuari || '');
const userAge = ref(userData.edad_usuari || '');
const userImageUrl = ref(userData.imageUrl && userData.imageUrl.startsWith('http') ? userData.imageUrl : defaultAvatar);

// Variables de control
const loading = ref(false); // Para subir foto
const error = ref('');
const success = ref('');

const isSuccessFading = ref(false); // <--- FALTA DECLARAR
const isPasswordSuccessFading = ref(false); // <--- FALTA DECLARAR

// --- NUEVA LÓGICA DE EDICIÓN DE INFORMACIÓN ---
const isEditing = ref(false); // Estado para controlar el modo de edición
// Datos editables (para v-model)
const editableData = ref({
    name: userName.value,
    lastname: userLastname.value,
    phone: userPhone.value,
    age: userAge.value
});

// Función para sincronizar datos reactivos cuando userData cambia (externamente o internamente)
const updateUserInfo = (newUserData) => {
    // 1. Actualizar los datos de la "fuente de verdad"
    userName.value = newUserData.nombre || newUserData.name || '';
    userLastname.value = newUserData.apellido || newUserData.lastname || '';
    userEmail.value = newUserData.email || newUserData.emailx_usuari || '';
    userPhone.value = newUserData.celular || newUserData.celula_usuari || '';
    userAge.value = newUserData.edad || newUserData.edad_usuari  || '';
    userImageUrl.value = newUserData.imageUrl && newUserData.imageUrl.startsWith('http') ? newUserData.imageUrl : defaultAvatar;
    
    // 2. Asegurarse de que los datos editables reflejen los datos actuales si no estamos editando
    if (!isEditing.value) {
        editableData.value.name = userName.value;
        editableData.value.lastname = userLastname.value;
        editableData.value.phone = userPhone.value;
        editableData.value.age = userAge.value;
    }
};

// ---------------------------------------------
// Función de Auto-Ocultar (FADE OUT)
// ---------------------------------------------

/**
 * Inicia el temporizador y la transición de desvanecimiento para el mensaje global de éxito.
 */
 const autoHideSuccess = () => {
    // Limpiar cualquier fade previo
    isSuccessFading.value = false;
    
    // Tiempo de visualización antes de empezar el fade (ej: 3 segundos)
    const displayDuration = 3000; 
    // Duración del CSS transition (ej: 1000ms = 1s, debe coincidir con el CSS)
    const transitionDuration = 1000; 

    setTimeout(() => {
        isSuccessFading.value = true;
        setTimeout(() => {
            success.value = '';
        }, transitionDuration); // <--- Faltaba resetear isSuccessFading aquí
    }, displayDuration);
};

// ---------------------------------------------
// Funciones para Edición y Guardado
// ---------------------------------------------

// Función para alternar entre ver y editar
const toggleEdit = () => {
    if (isEditing.value) {
        // Si cancelamos la edición, restaurar editableData a los valores actuales
        editableData.value.name = userName.value;
        editableData.value.lastname = userLastname.value;
        editableData.value.phone = userPhone.value;
        editableData.value.age = userAge.value;
        isEditing.value = false;
    } else {
        isEditing.value = true;
    }
    // Limpiar mensajes de estado
    error.value = '';
    success.value = '';
};


const saveChanges = async () => {
    // Basic validation
    if (!editableData.value.name || !editableData.value.lastname) {
        error.value = 'El nombre y el apellido son obligatorios.';
        return;
    }
    
    // Verificar si los datos realmente cambiaron
    if (
        editableData.value.name === userName.value &&
        editableData.value.lastname === userLastname.value &&
        editableData.value.phone === userPhone.value &&
        editableData.value.age === userAge.value
    ) {
        error.value = 'No se detectaron cambios. Cancelando edición.';autoHideSuccess();
        isEditing.value = false; // Salir del modo edición si no hay cambios
         
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

        const dataToSave = {
            nombre: editableData.value.name,
            apellido: editableData.value.lastname,
            celular: editableData.value.phone,
            edad_usuari: editableData.value.age
        };

        // Simulación de llamada a API para guardar la información
        const response = await fetch('http://localhost:3000/api/auth/update-user-info', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dataToSave)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al guardar los cambios');
        }

        // 1. Actualizar datos del usuario usando la función centralizada
        const updatedUserData = {
            ...JSON.parse(localStorage.getItem('userData') || '{}'),
            ...data.user, // La respuesta de la API (si devuelve el objeto de usuario actualizado)
            // Aseguramos que los campos locales actualizados se reflejen
            nombre: dataToSave.nombre,
            apellido: dataToSave.apellido,
            celular: dataToSave.celular,
            edad_usuari: dataToSave.edad_usuari,
        };
        updateUserData(updatedUserData); // Actualiza localStorage y notifica a los suscriptores

        // 2. Actualizar estado local (esto también lo hace onUserDataChange si está correctamente implementado)
        updateUserInfo(updatedUserData);

        success.value = 'Información actualizada exitosamente!';
        isEditing.value = false; // Salir del modo edición después de guardar
        autoHideSuccess(); 

    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

// ---------------------------------------------
// Funciones de Foto de Perfil (existentes)
// ---------------------------------------------
function handleImageError(e) {
  e.target.src = defaultAvatar;
}

async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validaciones...
  if (!file.type.startsWith('image/')) {
    error.value = 'Por favor selecciona un archivo de imagen válido.';
    return;
  }
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
      ...JSON.parse(localStorage.getItem('userData') || '{}'),
      ...data.user,
      imageUrl: data.user.imageUrl // Aseguramos que la URL se actualice
    };
    updateUserData(updatedUserData);

    // Actualizar variables reactivas localmente
    updateUserInfo(updatedUserData);

    success.value = 'Foto de perfil actualizada exitosamente!';
    e.target.value = ''; // Limpiar el input de archivo
    autoHideSuccess(); 

  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// ---------------------------------------------
// Funciones de Modal y Contraseña (existentes)
// ---------------------------------------------
const showChangePasswordModal = ref(false);
const changingPassword = ref(false);
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const passwordError = ref('');
const passwordSuccess = ref('');

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
  passwordError.value = '';
  passwordSuccess.value = '';

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
    // 💡 LÓGICA DE FADE-OUT DEL MODAL
        const displayDuration = 2000; 
    const transitionDuration = 1000; 
    
    setTimeout(() => {
        isPasswordSuccessFading.value = true;
        
        setTimeout(() => {
            closeChangePasswordModal(); // Cierra el modal después de que el mensaje se desvanece
        }, transitionDuration);
        
    }, displayDuration);

  } catch (err) {
    passwordError.value = err.message;
  } finally {
    changingPassword.value = false;
  }
}



// ---------------------------------------------
// Lifecycle Hooks (existentes)
// ---------------------------------------------
let unsubscribe = null;

onMounted(() => {
  unsubscribe = onUserDataChange(updateUserInfo);
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped>
/* Estilos para hacer visible el campo de entrada cuando es editable */
.info-item input:not([readonly]),
.info-item-2 input:not([readonly]),
.info-item-21 input:not([readonly]) {
    border: 2px solid #ff9100; /* Borde más visible al editar */
    box-shadow: 0px 0px 8px rgba(255, 145, 0, 0.5); /* Sombra suave para indicar edición */
    color: #000000;
}
/* Estilos existentes */

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
  height: 85.3vh;
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
  margin-bottom: 3.5rem;
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
  padding: 0.4rem 1rem;
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
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  border: 1px solid #fcc;
  margin-top: -40px;
  opacity: 1; 
  transition: opacity 1s ease-out, visibility 1s ease-out;
  visibility: visible;
}

.success-message {
  background: #efe;
  color: #363;
  border-radius: 8px;
  margin-top: -60px;
  text-align: center;
  border: 1px solid #cfc;
  opacity: 1; 
  transition: opacity 1s ease-out, visibility 1s ease-out;
  visibility: visible;
}

.fade-out {
  opacity: 0;
  visibility: hidden; /* Oculta el elemento para que no se pueda hacer clic */
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
  margin-bottom: 0.8rem;
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
  border: 1px solid #bdbdbd;
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
  border: 1px solid #bdbdbd;
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
  border: 1px solid #bdbdbd;
  box-shadow: 0px 6px 10px -1px #d0cfcf;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  outline: none;
}

/* ESTILO NUEVO PARA EL BOTÓN CANCELAR EN MODO EDICIÓN */
.cancel-btn-edit {
    background: #ccc !important;
    color: #ffffff !important;
}
.cancel-btn-edit:hover {
    background: #aaa !important;
    border-color: #aaa !important;
}
/* FIN ESTILO NUEVO */

.info-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}
.info-btn {
  padding: 0.7rem 1.2rem;
  background: #ff9100;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  width: 50%;
}

.info-btnG {
  flex: 1;
  background: #ff9100;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  width: 90px;
}

.info-btnC {
  flex: 1;
  background: #ff9100;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}
.info-btn:hover:not(:disabled) {
  background: #ff7700;
  border-color: #ffffff;
}
.info-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

/* Spinner pequeño para el botón de guardado/edición */
.loading-spinner-small {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s ease-in-out infinite;
    margin-right: 5px;
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
  opacity: 1; 
  transition: opacity 1s ease-out, visibility 1s ease-out;
  visibility: visible;
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