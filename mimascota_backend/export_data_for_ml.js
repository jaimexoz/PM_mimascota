/**
 * Script simplificado para exportar datos reales de PostgreSQL a CSV
 * Se ejecuta desde el directorio del backend
 */

const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../mimascota_ml/data/raw');

async function exportPets() {
    console.log('📦 Exportando mascotas reales de PostgreSQL...\n');

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
            COALESCE(LOWER(tamano), 'mediano') as tamano,
            COALESCE(edad_meses, 24) as edad_meses,
            COALESCE(LOWER(nivel_energia), 'moderado') as nivel_energia,
            COALESCE(personalidad, 'amigable') as personalidad,
            COALESCE(descripcion, '') as descripcion
        FROM mascotas
        WHERE estado = 'Disponible'
        ORDER BY idxxxx_mascot
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
        console.error('❌ No se encontraron mascotas disponibles');
        return 0;
    }

    console.log(`✅ Encontradas ${result.rows.length} mascotas disponibles`);
    console.log(`   Especies: ${result.rows.filter(r => r.especie === 'Perro').length} perros, ${result.rows.filter(r => r.especie === 'Gato').length} gatos\n`);

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
    return result.rows.length;
}

async function exportInteractions() {
    console.log('\n📦 Exportando interacciones reales...\n');

    const query = `
        SELECT 
            idxxxx_intera as interaction_id,
            forane_idxxxx_usuari as user_id,
            forane_idxxxx_mascot as pet_id,
            tipo_interaccion as interaction_type,
            createxx_at as timestamp,
            CASE tipo_interaccion
                WHEN 'click' THEN 2
                WHEN 'favorito' THEN 4
                WHEN 'contacto' THEN 5
                ELSE 3
            END as rating
        FROM interacciones
        ORDER BY createxx_at DESC
        LIMIT 10000
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
        console.log('⚠️  No hay interacciones reales');
        console.log('   Generando datos mínimos para entrenamiento...\n');

        // Crear interacciones sintéticas mínimas
        const petsResult = await pool.query('SELECT idxxxx_mascot FROM mascotas WHERE estado = \'Disponible\' LIMIT 20');
        const usersResult = await pool.query('SELECT idxxxx_usuari FROM usuarios LIMIT 5');

        if (petsResult.rows.length === 0 || usersResult.rows.length === 0) {
            console.log('❌ No hay suficientes datos para generar interacciones');
            return 0;
        }

        const syntheticInteractions = [];
        let idCounter = 1;

        // Generar 50 interacciones sintéticas (cada usuario interactúa con 10 mascotas)
        usersResult.rows.forEach(user => {
            const randomPets = petsResult.rows
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);

            randomPets.forEach(pet => {
                syntheticInteractions.push({
                    interaction_id: idCounter++,
                    user_id: user.idxxxx_usuari,
                    pet_id: pet.idxxxx_mascot,
                    interaction_type: Math.random() > 0.5 ? 'click' : 'favorito',
                    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                    rating: Math.random() > 0.5 ? 4 : 2
                });
            });
        });

        const headers = Object.keys(syntheticInteractions[0]).join(',');
        const rows = syntheticInteractions.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');

        const filePath = path.join(DATA_DIR, 'interactions.csv');
        fs.writeFileSync(filePath, csv, 'utf8');

        console.log(`💾 Guardadas ${syntheticInteractions.length} interacciones sintéticas en: ${filePath}`);
        return syntheticInteractions.length;
    }

    console.log(`✅ Encontradas ${result.rows.length} interacciones reales`);
    console.log(`   Tipos: clicks=${result.rows.filter(r => r.interaction_type === 'click').length}, favoritos=${result.rows.filter(r => r.interaction_type === 'favorito').length}, contactos=${result.rows.filter(r => r.interaction_type === 'contacto').length}\n`);

    // Convertir a CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const filePath = path.join(DATA_DIR, 'interactions.csv');
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`💾 Guardado en: ${filePath}`);
    return result.rows.length;
}

async function exportUsers() {
    console.log('\n📦 Exportando perfiles de usuarios...\n');

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

    if (result.rows.length === 0) {
        console.log('⚠️  No hay usuarios con cuestionarios completados');
        console.log('   El modelo Content-Based funcionará con cuestionarios en tiempo real\n');

        // Crear usuario sintético de ejemplo
        const sampleUser = {
            user_id: 999,
            nombre: 'Usuario Ejemplo',
            horasEnCasa: '6_8',
            nivelActividad: 'moderado',
            experienciaMascotas: 'moderada',
            tipoVivienda: 'casa_patio',
            tamanoMascota: 'mediano',
            edadPreferida: 'joven',
            perroOGato: 'ambos',
            nivelEnergia: 'moderado',
            personalidad: 'amigable,jugueton',
            ninosEnCasa: 'no',
            otrasMascotas: 'no',
            tiempoCuidado: '1_2',
            entrenamiento: 'si',
            presupuesto: 'moderado'
        };

        const headers = Object.keys(sampleUser).join(',');
        const csv = headers + '\n' + Object.values(sampleUser).map(v =>
            typeof v === 'string' && v.includes(',') ? `"${v}"` : v
        ).join(',');

        const filePath = path.join(DATA_DIR, 'users.csv');
        fs.writeFileSync(filePath, csv, 'utf8');

        console.log(`💾 Guardado usuario de ejemplo en: ${filePath}`);
        return 1;
    }

    console.log(`✅ Encontrados ${result.rows.length} usuarios con cuestionarios\n`);

    // Expandir cuestionarios de JSONB a columnas
    const expandedUsers = result.rows.map(user => {
        const q = user.questionnaire_data || {};
        return {
            user_id: user.user_id,
            nombre: user.nombre,
            horasEnCasa: q.horasEnCasa || '6_8',
            nivelActividad: q.nivelActividad || 'moderado',
            experienciaMascotas: q.experienciaMascotas || 'moderada',
            tipoVivienda: q.tipoVivienda || 'casa_patio',
            tamanoMascota: q.tamanoMascota || 'mediano',
            edadPreferida: q.edadPreferida || 'adulto',
            perroOGato: q.perroOGato || 'ambos',
            nivelEnergia: q.nivelEnergia || 'moderado',
            personalidad: q.personalidad || 'amigable',
            ninosEnCasa: q.ninosEnCasa || 'no',
            otrasMascotas: q.otrasMascotas || 'no',
            tiempoCuidado: q.tiempoCuidado || '1_2',
            entrenamiento: q.entrenamiento || 'si',
            presupuesto: q.presupuesto || 'moderado'
        };
    });

    const headers = Object.keys(expandedUsers[0]).join(',');
    const rows = expandedUsers.map(row =>
        Object.values(row).map(val =>
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const filePath = path.join(DATA_DIR, 'users.csv');
    fs.writeFileSync(filePath, csv, 'utf8');

    console.log(`💾 Guardado en: ${filePath}`);
    return result.rows.length;
}

async function main() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log(' 🚀 EXPORTANDO DATOS REALES DE POSTGRESQL → CSV');
        console.log('='.repeat(70) + '\n');

        const petsCount = await exportPets();
        const interactionsCount = await exportInteractions();
        const usersCount = await exportUsers();

        console.log('\n' + '='.repeat(70));
        console.log(' ✅ EXPORTACIÓN COMPLETADA');
        console.log('='.repeat(70));
        console.log(`\n📊 Resumen:`);
        console.log(`   - Mascotas: ${petsCount}`);
        console.log(`   - Interacciones: ${interactionsCount}`);
        console.log(`   - Usuarios: ${usersCount}`);
        console.log(`\n📝 Próximo paso:`);
        console.log(`   cd mimascota_ml`);
        console.log(`   .\\venv\\Scripts\\Activate.ps1`);
        console.log(`   .\\train_models.ps1\n`);

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        await pool.end();
        process.exit(1);
    }
}

main();
