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
import AdopcionesRealizadas from '@/components/AdopcionesRealizadas.vue';
import DeletePost from '@/views/DeletePost.vue';
import petManagement from '@/views/petManagement.vue';
import matchPage from '@/views/matchPage.vue';
import { isAuthenticated } from '../utils/auth'; // Importa la función de autenticación
import UserReviews from '@/views/UserReviews.vue';


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [

        {
            path: '/',
            name: 'home',
            component: HomePage, // HomePage está en la carpeta 'components'
            meta: { requiresAuth: false } // No requiere autenticación para acceder
        },
        
        {
            path: '/home',
            redirect: '/'
        },
        {
            path: '/auth',
            name: 'auth',
            component: AuthPage, // AuthPage está en la carpeta 'views'
            meta: { requiresAuth: false } // No requiere autenticación para acceder
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
            path: '/match',
            name: 'match',
            component: () => import('../views/matchPage.vue'),
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
            path: '/reviews', 
            name: 'reviews',
            component: UserReviews,
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
            // ⭐️ Esta es la ruta que necesitas
            path: '/eliminarmascota', 
            name: 'EliminarMascota',
            component: DeletePost,
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
            // ⭐️ Esta es la ruta que 
            path: '/adopcionesrealizadas', 
            name: 'AdopcionesRealizadas',
            component: AdopcionesRealizadas,
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
            path: '/petManagement',
            name: 'PetManagement',
            component: petManagement,
            meta: { requiresAuth: true}
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
    const isUserAuthenticated = isAuthenticated();

    // 1. Si el usuario ya está autenticado e intenta ir a la página de login/registro
    if (to.name === 'auth' && isUserAuthenticated) {
        // Redirigirlo a la página principal
        next({ name: 'home' });
    } 
    // 2. Si la ruta a la que va requiere autenticación y el usuario NO está autenticado
    else if (to.meta.requiresAuth && !isUserAuthenticated) {
        // Redirige al usuario a la página de autenticación (login)
        next({ name: 'auth' });
    } 
    else {
        // En cualquier otro caso, procede
        next();
    }
});

export default router;