-- Script para limpiar datos de usuarios pero mantener datos del sistema
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar tokens de verificación
DELETE FROM verification_tokens;

-- 2. Eliminar favoritos
DELETE FROM favoritos;

-- 3. Eliminar reseñas
DELETE FROM resenas;

-- 4. Eliminar solicitudes de adopción
DELETE FROM solicitudes_adopcion;

-- 5. Eliminar mascotas
DELETE FROM mascotas;

-- 6. Eliminar usuarios (excepto administradores si los hay)
-- Si quieres mantener algún usuario admin, comenta esta línea
DELETE FROM usuarios;

-- 7. Reiniciar secuencias (IDs)
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;

ALTER SEQUENCE mascotas_id_seq RESTART WITH 1;

ALTER SEQUENCE solicitudes_adopcion_id_seq RESTART WITH 1;

ALTER SEQUENCE resenas_id_seq RESTART WITH 1;

ALTER SEQUENCE favoritos_id_seq RESTART WITH 1;

-- Verificar que las tablas estén vacías
SELECT 'usuarios' as tabla, COUNT(*) as registros
FROM usuarios
UNION ALL
SELECT 'mascotas', COUNT(*)
FROM mascotas
UNION ALL
SELECT 'solicitudes_adopcion', COUNT(*)
FROM solicitudes_adopcion
UNION ALL
SELECT 'resenas', COUNT(*)
FROM resenas
UNION ALL
SELECT 'favoritos', COUNT(*)
FROM favoritos
UNION ALL
SELECT 'verification_tokens', COUNT(*)
FROM verification_tokens;