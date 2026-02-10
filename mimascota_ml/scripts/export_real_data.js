/**
 * Script para exportar datos REALES de PostgreSQL a CSV
 * Esto reemplaza los datos sintéticos con tus mascotas e interacciones reales
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../mimascota_backend/.env') });

const pool = require('../../mimascota_backend/config/db');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data', 'raw');

async function exportPets() {
    console.log('📦 Exportando mascotas reales de PostgreSQL...');

    // Query para obtener mascotas en formato compatible con ML
    const query = `
        SELECT 
            idxxxx_mascot as pet_id,
            namexx_mascot as nombre,
            CASE 
                WHEN LOWER(especie) LIKE '%perro%' THEN 'Perro'
                WHEN LOWER(especie) LIKE '%gato%' THEN 'Gato'
                ELSE especie
            END as especie,
            COALESCE(tamano, 'mediano') as tamano,
            COALESCE(edad_meses, 24) as edad_meses,
            COALESCE(nivel_energia, 'moderado') as nivel_energia,
            COALESCE(personalidad, 'amigable') as personalidad,
            COALESCE(descripcion, '') as descripcion
        FROM mascotas
        WHERE estado = 'Disponible'
        ORDER BY idxxxx_mascot
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
        console.error('❌ No se encontraron mascotas en PostgreSQL');
        return;
    }

    console.log(`✅ Encontradas ${result.rows.length} mascotas`);

    // Convertir a CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row =>
        Object.values(row).map(val =>
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Guardar
    const filePath = path.join(DATA_DIR, 'pets.csv');
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`💾 Guardado en: ${filePath}`);
    console.log(`📊 Total: ${result.rows.length} mascotas`);
}

async function exportInteractions() {
    console.log('\n📦 Exportando interacciones reales...');

    // Query para interacciones
    const query = `
        SELECT 
            idxxxx_intera as interaction_id,
            forane_idxxxx_usuari as user_id,
            forane_idxxxx_mascot as pet_id,
            tipo_interaccion as interaction_type,
            createxx_at as timestamp,
            CASE tipo_interaccion
                WHEN 'click' THEN 1
                WHEN 'favorito' THEN 3
                WHEN 'contacto' THEN 5
                ELSE 2
            END as rating
        FROM interacciones
        ORDER BY createxx_at DESC
        LIMIT 10000
    `;

    const result = await pool.query(query);

    console.log(`✅ Encontradas ${result.rows.length} interacciones`);

    if (result.rows.length === 0) {
        console.log('⚠️  No hay interacciones, se generarán datos sintéticos mínimos');

        // Crear interacciones sintéticas básicas para que el modelo pueda entrenar
        const petsResult = await pool.query('SELECT idxxxx_mascot FROM mascotas LIMIT 10');
        const usersResult = await pool.query('SELECT idxxxx_usuari FROM usuarios LIMIT 5');

        const syntheticInteractions = [];
        petsResult.rows.forEach((pet, idx) => {
            const user = usersResult.rows[idx % usersResult.rows.length];
            syntheticInteractions.push({
                interaction_id: idx + 1,
                user_id: user.idxxxx_usuari,
                pet_id: pet.idxxxx_mascot,
                interaction_type: 'click',
                timestamp: new Date().toISOString(),
                rating: 3
            });
        });

        // Guardar interacciones sintéticas
        const headers = Object.keys(syntheticInteractions[0]).join(',');
        const rows = syntheticInteractions.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');

        const filePath = path.join(DATA_DIR, 'interactions.csv');
        fs.writeFileSync(filePath, csv, 'utf8');

        console.log(`💾 Guardadas ${syntheticInteractions.length} interacciones sintéticas en: ${filePath}`);
        return;
    }

    // Convertir a CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Guardar
    const filePath = path.join(DATA_DIR, 'interactions.csv');
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`💾 Guardado en: ${filePath}`);
    console.log(`📊 Total: ${result.rows.length} interacciones`);
}

async function exportUsers() {
    console.log('\n📦 Exportando usuarios reales...');

    const query = `
        SELECT 
            idxxxx_usuari as user_id,
            namexx_usuari as nombre,
            vector_preferencias as questionnaire_data
        FROM usuarios
        WHERE vector_preferencias IS NOT NULL
        LIMIT 1000
    `;

    const result = await pool.query(query);

    console.log(`✅ Encontrados ${result.rows.length} usuarios con cuestionarios`);

    if (result.rows.length === 0) {
        console.log('⚠️  No hay usuarios con cuestionarios guardados');
        console.log('   Se generarán usuarios sintéticos para entrenamiento');
        return;
    }

    // Expandir cuestionarios de JSONB a columnas
    const expandedUsers = result.rows.map(user => {
        const questionnaire = user.questionnaire_data || {};
        return {
            user_id: user.user_id,
            nombre: user.nombre,
            horasEnCasa: questionnaire.horasEnCasa || '6_8',
            nivelActividad: questionnaire.nivelActividad || 'moderado',
            experienciaMascotas: questionnaire.experienciaMascotas || 'moderada',
            tipoVivienda: questionnaire.tipoVivienda || 'casa_patio',
            tamanoMascota: questionnaire.tamanoMascota || 'mediano',
            edadPreferida: questionnaire.edadPreferida || 'adulto',
            perroOGato: questionnaire.perroOGato || 'ambos',
            nivelEnergia: questionnaire.nivelEnergia || 'moderado',
            personalidad: questionnaire.personalidad || 'amigable',
            ninosEnCasa: questionnaire.ninosEnCasa || 'no',
            otrasMascotas: questionnaire.otrasMascotas || 'no',
            tiempoCuidado: questionnaire.tiempoCuidado || '1_2',
            entrenamiento: questionnaire.entrenamiento || 'si',
            presupuesto: questionnaire.presupuesto || 'moderado'
        };
    });

    // Convertir a CSV
    const headers = Object.keys(expandedUsers[0]).join(',');
    const rows = expandedUsers.map(row =>
        Object.values(row).map(val =>
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Guardar
    const filePath = path.join(DATA_DIR, 'users.csv');
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`💾 Guardado en: ${filePath}`);
    console.log(`📊 Total: ${result.rows.length} usuarios`);
}

async function main() {
    try {
        console.log('🚀 EXPORTANDO DATOS REALES DE POSTGRESQL\n');
        console.log('='.repeat(60));

        await exportPets();
        await exportInteractions();
        await exportUsers();

        console.log('\n' + '='.repeat(60));
        console.log('✅ EXPORTACIÓN COMPLETADA\n');
        console.log('📝 Próximo paso:');
        console.log('   cd mimascota_ml');
        console.log('   .\\venv\\Scripts\\Activate.ps1');
        console.log('   .\\train_models.ps1');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
