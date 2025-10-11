// mi_mascota_frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
// Componentes que están en la carpeta 'components'
import HomePage from '../components/HomePage.vue';
import LoginForm from '../components/LoginForm.vue';
import RegisterForm from '../components/RegisterForm.vue';

// Componentes que están en la carpeta 'views'
import AuthPage from '../views/AuthPage.vue';
import ResetPassword from '../views/ResetPassword.vue';
import VerifyEmail from '../views/VerifyEmail.vue';
import PerfilUsuario from '../views/PerfilUsuario.vue';
import AddMascot from '@/views/AddMascot.vue';
import TarjetaMascota from '@/components/TarjetaMascota.vue';
import favoritesPage from '@/views/favoritesPage.vue';
import adoptForm from '@/views/adoptForm.vue'; 
import ViewAdoptionForm from '@/views/ViewAdoptionForm.vue';
import SolicitudesEnviadas from '@/components/SolicitudesEnviadas.vue';
import SolicitudesRecibidas from '@/components/SolicitudesRecibidas.vue';
import MyPost from '@/views/MyPost.vue';
import MyPostsEdit from '@/views/MyPostsEdit.vue';

import { isAuthenticated } from '../utils/auth'; // Importa la función de autenticación


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [

        {
            path: '/',
            name: 'auth',
            component: AuthPage, // AuthPage está en la carpeta 'views'
            meta: { requiresAuth: false } // No requiere autenticación para acceder
        },
        
        {
            path: '/home',
            name: 'home',
            component: HomePage, // HomePage está en la carpeta 'components'
            meta: { requiresAuth: true } // Requiere que el usuario esté autenticado
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: ResetPassword, // ResetPassword está en la carpeta 'views'
            meta: { requiresAuth: false } // No requiere autenticación
        },
        {
            path: '/verify-email',
            name: 'verify-email',
            component: VerifyEmail, // VerifyEmail está en la carpeta 'views'
            meta: { requiresAuth: false } // No requiere autenticación
        },
        {
            path: '/usuarios',
            name: 'usuarios',
            component: () => import('../components/UserList.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/gatos',
            name: 'gatos',
            component: () => import('../views/GatosPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/perros',
            name: 'perros',
            component: () => import('../views/PerrosPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/nosotros',
            name: 'nosotros',
            component: () => import('../views/NosotrosPage.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/perfil',
            name: 'perfil',
            component: () => import('../views/PerfilUsuario.vue'),
            meta: { requiresAuth: true }
        },

        {
            // ⭐️ Esta es la ruta que necesitas
            path: '/agregarmascota', 
            name: 'AgregarMascota',
            component: AddMascot,
            meta: { requiresAuth: true }
        },
        {
            // ⭐️ Esta es la ruta que necesitas
            path: '/editarmascota', 
            name: 'EditarMascota',
            component: MyPostsEdit,
            meta: { requiresAuth: true }
        },

        {
            // ⭐️ Esta es la ruta que 
            path: '/mypost', 
            name: 'MyPost',
            component: MyPost,
            meta: { requiresAuth: true }
        },

        {
            // ⭐️ Esta es la ruta que necesitas
            path: '/solicitudesenviadas', 
            name: 'SolicitudesEnviadas',
            component: SolicitudesEnviadas,
            meta: { requiresAuth: true }
        },

        {
            // ⭐️ Esta es la ruta que 
            path: '/solicitudesrecibidas', 
            name: 'SolicitudesRecibidas',
            component: SolicitudesRecibidas,
            meta: { requiresAuth: true }
        },


        {
            // ⭐️ Esta es la ruta que necesitas
            path: '/card/:id', 
            name: 'TarjetaMascota',
            component: TarjetaMascota,
            meta: { requiresAuth: false }
        },
        {
            // ⭐️ Esta es la ruta que necesitas
            path: '/favoritos', 
            name: 'Favoritos',
            component: favoritesPage,
            meta: { requiresAuth: true }
        },
        {
            path: '/adoptForm/:mascotId', 
            name: 'NewAdoptionForm', // Nombre único
            component: adoptForm,
            meta: { requiresAuth: true }
        },
        // 2. RUTA PARA VISUALIZAR FORMULARIO (Se activa desde "Ver detalles" de solicitud)
        {
            path: '/formulario/:formId', // Usamos un path base diferente
            name: 'ViewAdoptionForm', // Nombre único
            component: ViewAdoptionForm,
            meta: { requiresAuth: true }
        },
        // Ruta comodín para manejar rutas no encontradas
        {
            path: '/:pathMatch(.*)*',
            name: 'NotFound',
            redirect: '/'
        }
    ]
});

// Guardia de navegación global para proteger rutas
router.beforeEach((to, from, next) => {
    // Si la ruta a la que vas requiere autenticación y el usuario no está autenticado
    if (to.meta.requiresAuth && !isAuthenticated()) {
        // Redirige al usuario a la página de autenticación (login)
        next({ name: 'auth' });
    } else {
        // Si no se necesita autenticación o el usuario está autenticado, procede
        next();
    }
});

export default router;