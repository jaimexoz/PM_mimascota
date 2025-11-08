// Script para eliminar todos los datos de la tabla mascota_caracteristicas
const pool = require('../config/db');

async function clearMascotaCaracteristicas() {
    const client = await pool.connect();
    
    try {
        console.log('Iniciando eliminación de datos de mascota_caracteristicas...');
        
        // Primero, contar cuántos registros hay
        const countResult = await client.query('SELECT COUNT(*) FROM mascota_caracteristicas');
        const totalRecords = countResult.rows[0].count;
        console.log(`Total de registros a eliminar: ${totalRecords}`);
        
        // Eliminar todos los registros
        const deleteResult = await client.query('DELETE FROM mascota_caracteristicas');
        console.log(`✅ Eliminados ${deleteResult.rowCount} registros de mascota_caracteristicas`);
        
        // Verificar que la tabla esté vacía
        const verifyResult = await client.query('SELECT COUNT(*) FROM mascota_caracteristicas');
        console.log(`Registros restantes: ${verifyResult.rows[0].count}`);
        
        console.log('✅ Proceso completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al eliminar datos:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar el script
clearMascotaCaracteristicas()
    .then(() => {
        console.log('Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error fatal:', error);
        process.exit(1);
    });

