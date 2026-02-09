-- ============================================
-- DATOS ESENCIALES PARA MIMASCOTA EN SUPABASE
-- ============================================
-- Ejecuta DESPUÉS de supabase_schema.sql

-- 1. ROLES (CRÍTICO - Sistema de permisos)
INSERT INTO
    roles (idxxxx_rolesx, nombre_rolesx)
VALUES (1, 'Admin'),
    (2, 'Usuario');

-- 2. PERMISOS (CRÍTICO - Funcionalidades del sistema)
INSERT INTO
    permisos (
        idxxxx_permis,
        nombre_permis,
        descri_permis
    )
VALUES (
        1,
        'crear_publicacion',
        'Permite a los usuarios crear nuevas publicaciones de mascotas.'
    ),
    (
        2,
        'editar_publicacion',
        'Permite editar publicaciones de mascotas (propia o ajena según rol).'
    ),
    (
        3,
        'eliminar_publicacion',
        'Permite eliminar publicaciones de mascotas (propia o ajena según rol).'
    ),
    (
        4,
        'aprobar_rechazar_publicacion',
        'Permite a los administradores aprobar o rechazar publicaciones de mascotas.'
    ),
    (
        5,
        'gestionar_usuarios',
        'Permite a los administradores crear, editar y eliminar otros usuarios.'
    ),
    (
        6,
        'ver_reportes_admin',
        'Permite a los administradores ver reportes del sistema.'
    ),
    (
        7,
        'convertir_a_admin',
        'Permite a un administrador convertir a otro usuario en administrador.'
    );

-- 3. RELACIÓN ROL-PERMISO (CRÍTICO - Asignación de permisos)
INSERT INTO
    rol_permiso (
        idxxxx_rol_permiso,
        idxxxx_rolesx,
        idxxxx_permis
    )
VALUES (1, 1, 1), -- Admin puede crear_publicacion
    (2, 1, 2), -- Admin puede editar_publicacion
    (3, 1, 3), -- Admin puede eliminar_publicacion
    (4, 1, 4), -- Admin puede aprobar_rechazar_publicacion
    (5, 1, 5), -- Admin puede gestionar_usuarios
    (6, 1, 6), -- Admin puede ver_reportes_admin
    (7, 1, 7), -- Admin puede convertir_a_admin
    (8, 2, 1), -- Usuario puede crear_publicacion
    (9, 2, 2), -- Usuario puede editar_publicacion
    (10, 2, 3);
-- Usuario puede eliminar_publicacion

-- 4. CARACTERÍSTICAS (CRÍTICO - Para el sistema de matching)
INSERT INTO
    caracteristicas (idxxxx_caract, nombre_caract)
VALUES (1, 'Juguetón'),
    (2, 'Tranquilo'),
    (3, 'Tímido'),
    (4, 'Energético'),
    (5, 'Ruidoso'),
    (6, 'Amigable'),
    (7, 'Cariñoso'),
    (8, 'Agresivo'),
    (9, 'Leal'),
    (10, 'Protector'),
    (11, 'Inteligente'),
    (12, 'Temeroso'),
    (13, 'Arisco');

-- 5. ACTUALIZAR SECUENCIAS (Para que los IDs continúen correctamente)
SELECT setval( 'roles_idxxxx_rolesx_seq', 2, true );

SELECT setval( 'permisos_idxxxx_permis_seq', 7, true );

SELECT setval( 'rol_permiso_idxxxx_rol_permiso_seq', 10, true );

SELECT setval( 'caracteristicas_idxxxx_caract_seq', 13, true );

-- ============================================
-- ✅ LISTO! Tu base de datos está configurada
-- ============================================