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

    // Query con JOIN para obtener características (personalidad)
    const query = `
        SELECT 
            m.idxxxx_mascot as pet_id,
            m.nombre_mascot as nombre,
            CASE 
                WHEN LOWER(m.especi_mascot) LIKE '%perro%' THEN 'Perro'
                WHEN LOWER(m.especi_mascot) LIKE '%gato%' THEN 'Gato'
                ELSE m.especi_mascot
            END as especie,
            COALESCE(LOWER(m.tamano_mascot), 'mediano') as tamano,
            COALESCE(m.edadme_mascot, 24) as edad_meses,
            COALESCE(LOWER(m.nenerg_mascot), 'moderado') as nivel_energia,
            STRING_AGG(LOWER(c.nombre_caract), ',') as personalidad,
            COALESCE(m.infoad_mascot, '') as descripcion
        FROM mascotas m
        LEFT JOIN mascota_caracteristicas mc ON m.idxxxx_mascot = mc.forane_mascot_id
        LEFT JOIN caracteristicas c ON mc.forane_caract_id = c.idxxxx_caract

        
        WHERE (m.eliminado_logico IS NULL OR m.eliminado_logico = false)
        GROUP BY m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, 
                 m.tamano_mascot, m.edadme_mascot, m.nenerg_mascot, m.infoad_mascot
        ORDER BY m.idxxxx_mascot
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
        console.error('❌ No se encontraron mascotas disponibles');
        return 0;
    }

    console.log(`✅ Encontradas ${result.rows.length} mascotas disponibles`);
    console.log(`   Especies: ${result.rows.filter(r => r.especie === 'Perro').length} perros, ${result.rows.filter(r => r.especie === 'Gato').length} gatos\n`);

    // Limpiar datos y asegurar valores por defecto
    const cleanedRows = result.rows.map(row => ({
        pet_id: row.pet_id,
        nombre: row.nombre || 'Sin nombre',
        especie: row.especie || 'Perro',
        tamano: row.tamano || 'mediano',
        edad_meses: row.edad_meses || 24,
        nivel_energia: row.nivel_energia || 'moderado',
        personalidad: row.personalidad || 'amigable',
        descripcion: row.descripcion || ''
    }));

    // Convertir a CSV
    const headers = Object.keys(cleanedRows[0]).join(',');
    const rows = cleanedRows.map(row =>
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
            id as interaction_id,
            forane_idxxxx_usuari as user_id,
            forane_idxxxx_mascot as pet_id,
            typexx_intera as interaction_type,
            created_at as timestamp,
            CASE typexx_intera
                WHEN 'click' THEN 2
                WHEN 'favorito' THEN 4
                WHEN 'contacto' THEN 5
                ELSE 3
            END as rating
        FROM usuario_interacciones
        ORDER BY created_at DESC
        LIMIT 10000
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
        console.log('⚠️  No hay interacciones reales');
        console.log('   Generando datos mínimos para entrenamiento...\n');

        // Crear interacciones sintéticas mínimas
        const petsResult = await pool.query('SELECT idxxxx_mascot FROM mascotas WHERE status_mascot = \'Disponible\' LIMIT 20');
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
            nombre_usuari as nombre,
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

    //Expandir cuestionarios de JSONB a columnas
    const expandedUsers = result.rows.map(user => {
        const q = user.questionnaire_data || {};

        // Convertir personalidad (puede ser array o string)
        let personalidad = q.personalidad || 'amigable';
        if (Array.isArray(personalidad)) {
            personalidad = personalidad.join(',');
        }

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
            personalidad: personalidad,
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
