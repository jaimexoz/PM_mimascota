<script setup>
import { defineProps, defineEmits, ref } from 'vue';

// 1. Definición de Propiedades y Eventos
const emit = defineEmits(['close', 'confirm-delete']);

const props = defineProps({
    isOpen: Boolean,
    // Propiedad opcional para indicar si el proceso de eliminación está en curso
    isDeleting: {
        type: Boolean,
        default: false
    }
});

// 2. Función de Confirmación
// Esta función simplemente emite el evento para que el componente padre
// (donde está la lógica de la API) sepa que debe proceder con la eliminación.
const confirmDelete = () => {
    // Si ya estamos eliminando, no hacemos nada
    if (props.isDeleting) return; 
    
    emit('confirm-delete');
};
</script>

<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        
        <div class="delete-modal-container">
            
            <button @click="emit('close')" class="close-button" :disabled="isDeleting">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="modal-content">
                <h2 class="modal-title">Eliminar publicación</h2>
                
                <p class="modal-message">
                    ¿Está seguro que quiere eliminar esta publicación? Esta acción no se podrá deshacer.
                </p>

                <div class="button-actions">
                    <button @click="emit('close')" class="cancel-button" :disabled="isDeleting">
                        Cancelar
                    </button>
                    
                    <button @click="confirmDelete" class="accept-button" :disabled="isDeleting">
                        {{ isDeleting ? 'Eliminando...' : 'Aceptar' }}
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>


<style scoped>
/* Estilos del Overlay (Fondo oscuro) */
.modal-overlay { 
    position: fixed; 
    top: 0; 
    left: 0;
    width: 100%; 
    height: 100%; 
    background-color: rgba(0, 0, 0, 0.6); 
    display: flex; 
    justify-content: center;
    align-items: center;
    z-index: 1000; 
}

/* Contenedor del Modal de Eliminación (Más pequeño que el de edición) */
.delete-modal-container { 
    position: relative;
    background-color: #ffffff; 
    border-radius: 1rem; /* Borde ligeramente más suave */
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); 
    width: 100%; 
    max-width: 500px; /* Tamaño típico para modales de confirmación */
    padding: 2.5rem 1.5rem; /* Ajuste del padding */
    text-align: center;
}

/* Botón de Cerrar (X) */
.close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #495057;
    cursor: pointer;
    width: 30px;
    height: 30px;
    padding: 0;
    transition: color 0.2s;
}

.close-button:hover {
    color: #ff9900;
}

/* Título */
.modal-title { 
    font-size: 1.5rem; 
    font-weight: 700; 
    color: #1f2937; 
    margin-bottom: 0.5rem;
}

/* Mensaje de Confirmación */
.modal-message {
    font-size: 1.2rem;
    color: #4b5563;
    line-height: 1.5;
    margin-bottom: 1rem;
    padding: 0 1.8rem;
}

/* Botones de Acción (Cancelar y Aceptar) */
.button-actions {
    display: flex;
    justify-content: center;
    gap: 1.5rem; /* Espacio entre los botones */
    padding: 0 1rem;
}

.cancel-button, .accept-button {
    width: 100%;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px; /* Bordes redondeados */
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-width: 150px;
}

/* Botón Cancelar (Naranja claro sin fondo) */
.cancel-button {
    background-color: #ffffff;
    color: #ff9900;
    border: 2px solid #ff9900;
}

.cancel-button:hover {
    background-color: #fffbeb;
}

/* Botón Aceptar (Naranja sólido) */
.accept-button {
    background-color: #ff9900;
    color: white;
}

.accept-button:hover {
    background-color: #f47004; /* Naranja más oscuro al pasar el ratón */
}
</style>