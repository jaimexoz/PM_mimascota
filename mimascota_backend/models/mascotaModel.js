// mi_mascota_backend/models/mascotaModel.js
const pool = require('../config/db');

// --- FUNCIONES DE UTILIDAD SQL (Trasladadas del router) ---

/**
 * Obtiene los IDs de las características (personalidades) a partir de sus nombres.
 * Se asume que el cliente ya está conectado y la transacción iniciada.
 */
const getCaracteristicaIds = async (client, nombres) => {
    if (!nombres || nombres.length === 0) {
        return [];
    }
    
    // Genera placeholders como $1, $2, $3...
    const placeholders = nombres.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
        SELECT idxxxx_caract
        FROM caracteristicas
        WHERE nombre_caract IN (${placeholders});
    `;
    
    const result = await client.query(query, nombres);
    
    // Mapea el resultado para devolver solo un array de números (IDs)
    return result.rows.map(row => row.idxxxx_caract);
};

// --- OPERACIONES CRUD/TRANSACCIONALES ---

/**
 * Obtiene todos los detalles de una mascota (incluyendo características) por su ID.
 */
const getMascotaDetailsByIdDB = async (client, petId) => {
    // Primero obtener los datos de la mascota
    const mascotaQuery = `
        SELECT
            m.idxxxx_mascot, 
            m.nombre_mascot, 
            m.especi_mascot, 
            m.sexoxx_mascot, 
            m.edadme_mascot, 
            m.razaxx_mascot, 
            m.pesokg_mascot, 
            m.tamano_mascot, 
            m.infoad_mascot, 
            m.image1_mascot, 
            m.image2_mascot, 
            m.image3_mascot, 
            m.forane_usuari_id, 
            m.status_mascot
        FROM mascotas m
        WHERE m.idxxxx_mascot = $1 
            AND m.eliminado_logico = FALSE
    `;
    const mascotaResult = await client.query(mascotaQuery, [petId]);
    
    if (mascotaResult.rows.length === 0) {
        return mascotaResult;
    }
    
    // Obtener todas las características disponibles
    const allCaractQuery = `SELECT nombre_caract FROM caracteristicas ORDER BY nombre_caract`;
    const allCaractResult = await client.query(allCaractQuery);
    
    // Obtener el estado de las características para esta mascota
    const estadosQuery = `
        SELECT c.nombre_caract, COALESCE(mc.status_mascar, FALSE) as activa
        FROM caracteristicas c
        LEFT JOIN mascota_caracteristicas mc 
            ON c.idxxxx_caract = mc.forane_caract_id 
            AND mc.forane_mascot_id = $1
        ORDER BY c.nombre_caract
    `;
    const estadosResult = await client.query(estadosQuery, [petId]);
    
    // Construir el objeto de estados y el array de activas
    const personalidad_estados = {};
    const personalidad_array = [];
    
    estadosResult.rows.forEach(row => {
        personalidad_estados[row.nombre_caract] = row.activa;
        if (row.activa) {
            personalidad_array.push(row.nombre_caract);
        }
    });
    
    // Si no hay ninguna característica asociada, marcar todas como false
    if (Object.keys(personalidad_estados).length === 0) {
        allCaractResult.rows.forEach(row => {
            personalidad_estados[row.nombre_caract] = false;
        });
    }
    
    // Combinar los resultados
    mascotaResult.rows[0].personalidad_array = personalidad_array;
    mascotaResult.rows[0].personalidad_estados = personalidad_estados;
    
    return mascotaResult;
};

const getMascotaEditByIdDB = async (client, petId, userId) => {
    // Primero obtener los datos de la mascota
    const mascotaQuery = `
        SELECT
            m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
            m.edadme_mascot, m.razaxx_mascot, m.pesokg_mascot, m.tamano_mascot, 
            m.infoad_mascot, m.image1_mascot, m.image2_mascot, m.image3_mascot, 
            m.forane_usuari_id, m.status_mascot
        FROM mascotas m
        WHERE m.idxxxx_mascot = $1 
            AND m.eliminado_logico = FALSE
            AND m.forane_usuari_id = $2
    `;
    const mascotaResult = await client.query(mascotaQuery, [petId, userId]);
    
    if (mascotaResult.rows.length === 0) {
        return mascotaResult;
    }
    
    // Obtener todas las características disponibles
    const allCaractQuery = `SELECT nombre_caract FROM caracteristicas ORDER BY nombre_caract`;
    const allCaractResult = await client.query(allCaractQuery);
    
    // Obtener el estado de las características para esta mascota
    const estadosQuery = `
        SELECT c.nombre_caract, COALESCE(mc.status_mascar, FALSE) as activa
        FROM caracteristicas c
        LEFT JOIN mascota_caracteristicas mc 
            ON c.idxxxx_caract = mc.forane_caract_id 
            AND mc.forane_mascot_id = $1
        ORDER BY c.nombre_caract
    `;
    const estadosResult = await client.query(estadosQuery, [petId]);
    
    // Construir el objeto de estados y el array de activas
    const personalidad_estados = {};
    const personalidad_array = [];
    
    estadosResult.rows.forEach(row => {
        personalidad_estados[row.nombre_caract] = row.activa;
        if (row.activa) {
            personalidad_array.push(row.nombre_caract);
        }
    });
    
    // Si no hay ninguna característica asociada, marcar todas como false
    if (Object.keys(personalidad_estados).length === 0) {
        allCaractResult.rows.forEach(row => {
            personalidad_estados[row.nombre_caract] = false;
        });
    }
    
    // Combinar los resultados
    mascotaResult.rows[0].personalidad_array = personalidad_array;
    mascotaResult.rows[0].personalidad_estados = personalidad_estados;
    
    return mascotaResult;
};



const getMascotasForFeedDB = async (client, especieFilter) => {
    const query = `
        SELECT 
            m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
            m.edadme_mascot, m.razaxx_mascot, m.tamano_mascot, m.image1_mascot
        FROM 
            mascotas m
        WHERE 
            m.eliminado_logico = FALSE
        AND
            m.especi_mascot = $1 AND m.approv_mascot = 'Aprobada'
        ORDER BY 
            m.idxxxx_mascot DESC;
    `;
    return client.query(query, [especieFilter]);
};

const getMascotasForHome2ndDB = async (client) => {
    const query = `
        SELECT 
            m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
            m.edadme_mascot, m.razaxx_mascot, m.tamano_mascot, m.image1_mascot
        FROM 
            mascotas m
        WHERE 
            m.eliminado_logico = FALSE
        AND m.approv_mascot = 'Aprobada'
        ORDER BY 
            m.idxxxx_mascot DESC
        LIMIT 4;
    `;
    return client.query(query);
};

/**
 * Obtiene todas las mascotas publicadas por un usuario específico.
 */
const getMyPostsByUserIdDB = async (client, userId) => {
    const query = `
        SELECT
            m.idxxxx_mascot, m.nombre_mascot, m.sexoxx_mascot, 
            m.edadme_mascot, m.pesokg_mascot, m.image1_mascot 
        FROM
            mascotas m
        WHERE
            m.forane_usuari_id = $1
            AND m.eliminado_logico = FALSE
            AND m.approv_mascot = 'Aprobada'
        ORDER BY m.idxxxx_mascot DESC;
    `;
    return client.query(query, [userId]);
};

/**
 * Obtiene todas las mascotas activas con datos del dueño.
 */
const getAllMascotasDB = async (client) => {
    const query = `
        SELECT 
            m.idxxxx_mascot, m.nombre_mascot, m.especi_mascot, m.sexoxx_mascot, 
            m.edadme_mascot, m.razaxx_mascot, m.pesokg_mascot, m.tamano_mascot, 
            m.infoad_mascot, m.image1_mascot, m.image2_mascot, m.image3_mascot, 
            m.forane_usuari_id, m.status_mascot, m.approv_mascot, m.fechap_mascot,
            u.nombre_usuari AS nombre_dueno, 
            u.emailx_usuari AS email_dueno
        FROM 
            mascotas m
            JOIN usuarios u ON m.forane_usuari_id = u.idxxxx_usuari
        WHERE 
            m.eliminado_logico = FALSE AND m.approv_mascot = 'Pendiente'
        ORDER BY 
            m.idxxxx_mascot DESC;
    `;
    return client.query(query);
};

async function updateMascotaApproval(mascotaId, newStatus) {
    const query = `
        UPDATE mascotas
        SET approv_mascot = $1
        WHERE idxxxx_mascot = $2
        RETURNING *;
    `;
    
    const result = await pool.query(query, [newStatus, mascotaId]);
    return result.rows[0]; // Devuelve el registro actualizado
}

/**
 * Crea una nueva mascota y devuelve su ID (dentro de una transacción).
 */
const insertNewMascotaDB = async (client, petData, cloudinaryUrls) => {

    const {
        nombre, especie, sexo, edad, raza, peso, tamano, informacionAdicional, forane_usuari_id
    } = petData;
    const [image1_mascot, image2_mascot, image3_mascot] = cloudinaryUrls;
    const infoad_mascot = informacionAdicional || 'N/A'; 

    const currentTimestamp = new Date().toISOString();

    const insertQuery = `
        INSERT INTO mascotas (
            nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
            razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot, 
            image1_mascot, image2_mascot, image3_mascot, eliminado_logico, 
            forane_usuari_id, approv_mascot, fechap_mascot, status_mascot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING idxxxx_mascot;
    `;

    const insertValues = [
        nombre, especie, sexo, edad, raza, peso, tamano, infoad_mascot, 
        image1_mascot, image2_mascot, image3_mascot, false, forane_usuari_id, 'Pendiente', currentTimestamp, 'Disponible'
    ];

    const result = await client.query(insertQuery, insertValues);
    const mascotaId = result.rows[0].idxxxx_mascot; 
    return { mascotaId, caracteristicasNombres: petData.personalidad };
};

/**
 * Vincula las características a la mascota (dentro de una transacción).
 */
const insertMascotaCaracteristicasDB = async (client, mascotaId, caracteristicaIds) => {
    if (caracteristicaIds.length === 0) return;

    const relacionValues = caracteristicaIds.map(charId => `(${mascotaId}, ${charId}, TRUE)`).join(',');
    
    const relacionQuery = `
        INSERT INTO mascota_caracteristicas (forane_mascot_id, forane_caract_id, status_mascar) 
        VALUES ${relacionValues}
        ON CONFLICT (forane_mascot_id, forane_caract_id) 
        DO UPDATE SET status_mascar = TRUE;
    `;
    await client.query(relacionQuery);
};

/**
 * Actualiza los datos principales de la mascota (incluyendo status y URLs).
 */
const updateMascotaPrincipalDB = async (client, petId, petData, finalImageUrls) => {
    const {
        nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
        razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot,
        image1_mascot: existingUrl1, 
        image2_mascot: existingUrl2, 
        image3_mascot: existingUrl3,
        status_mascot
    } = petData;

    let urlIndex = 0;
    const isValidCloudinaryUrl = (url) => url && typeof url === 'string' && url.startsWith('http') && !url.includes('blob:');

    const finalImage1 = isValidCloudinaryUrl(existingUrl1) ? existingUrl1 : (finalImageUrls[urlIndex++] !== undefined ? finalImageUrls[urlIndex - 1] : null);
    const finalImage2 = isValidCloudinaryUrl(existingUrl2) ? existingUrl2 : (finalImageUrls[urlIndex] !== undefined ? finalImageUrls[urlIndex++] : null);
    const finalImage3 = isValidCloudinaryUrl(existingUrl3) ? existingUrl3 : (finalImageUrls[urlIndex] !== undefined ? finalImageUrls[urlIndex++] : null);

    const updateQuery = `
        UPDATE mascotas 
        SET 
            nombre_mascot = $1, especi_mascot = $2, sexoxx_mascot = $3, 
            edadme_mascot = $4, razaxx_mascot = $5, pesokg_mascot = $6, 
            tamano_mascot = $7, infoad_mascot = $8, 
            image1_mascot = $9, image2_mascot = $10, image3_mascot = $11,
            status_mascot = $12 
        WHERE idxxxx_mascot = $13 
        RETURNING idxxxx_mascot;
    `;
    
    const updateValues = [
        nombre_mascot, especi_mascot, sexoxx_mascot, edadme_mascot, 
        razaxx_mascot, pesokg_mascot, tamano_mascot, infoad_mascot, 
        finalImage1, finalImage2, finalImage3, status_mascot, petId 
    ];

    const result = await client.query(updateQuery, updateValues);
    
    if (result.rowCount === 0) {
        return { success: false };
    }
    return { success: true };
};

/**
 * Desactiva características viejas y actualiza a activas las nuevas (Soft Delete en la tabla pivote).
 */
const syncMascotaCaracteristicasDB = async (client, petId, newPersonalidadesNombres) => {
    // Validar que newPersonalidadesNombres sea un array
    const personalidadesArray = Array.isArray(newPersonalidadesNombres) ? newPersonalidadesNombres : [];
    const newCaractIds = await getCaracteristicaIds(client, personalidadesArray);
    
    console.log(`[syncMascotaCaracteristicasDB] Mascota ID: ${petId}, Nuevas características IDs:`, newCaractIds);
    
    // Paso 1: Desactivar TODAS las características activas de esta mascota que NO están en la nueva lista
    if (newCaractIds.length > 0) {
        // Convertir IDs a enteros para asegurar el tipo correcto
        const newCaractIdsInt = newCaractIds.map(id => parseInt(id)).filter(id => !isNaN(id));
        const placeholders = newCaractIdsInt.map((_, i) => `$${i + 2}`).join(', ');
        
        // Usar una subconsulta con ANY para evitar problemas con NOT IN y NULLs
        const deactivateQuery = `
            UPDATE mascota_caracteristicas
            SET status_mascar = FALSE
            WHERE forane_mascot_id = $1
            AND status_mascar = TRUE
            AND forane_caract_id <> ALL(ARRAY[${placeholders}]::integer[]);
        `;
        const deactivateResult = await client.query(deactivateQuery, [petId, ...newCaractIdsInt]);
        console.log(`[syncMascotaCaracteristicasDB] Desactivadas ${deactivateResult.rowCount} características para mascota ${petId}. IDs a mantener:`, newCaractIdsInt);
    } else {
        // Si no hay nuevas características, desactivar TODAS las características activas de esta mascota
        const deactivateAllQuery = `
            UPDATE mascota_caracteristicas
            SET status_mascar = FALSE
            WHERE forane_mascot_id = $1
            AND status_mascar = TRUE;
        `;
        const deactivateAllResult = await client.query(deactivateAllQuery, [petId]);
        console.log(`[syncMascotaCaracteristicasDB] Desactivadas todas las características (${deactivateAllResult.rowCount}) para mascota ${petId}`);
    }

    // Paso 2: Activar/Insertar las nuevas características
    if (newCaractIds.length > 0) {
        const newCaractIdsInt = newCaractIds.map(id => parseInt(id));
        const insertValues = newCaractIdsInt.map(caractId => `(${petId}, ${caractId}, TRUE)`).join(',');
        const insertQuery = `
            INSERT INTO mascota_caracteristicas (forane_mascot_id, forane_caract_id, status_mascar)
            VALUES ${insertValues}
            ON CONFLICT (forane_mascot_id, forane_caract_id) 
            DO UPDATE SET status_mascar = TRUE;
        `;
        const insertResult = await client.query(insertQuery);
        console.log(`[syncMascotaCaracteristicasDB] Activadas/Insertadas ${newCaractIdsInt.length} características para mascota ${petId}`);
    }
};

/**
 * Elimina lógicamente una mascota (dentro de una transacción o consulta simple).
 */
const softDeleteMascotaDB = async (client, petId, userId) => {
    const updateQuery = `
        UPDATE mascotas
        SET 
            eliminado_logico = TRUE, 
            fecha_eliminacion = NOW()
        WHERE
            idxxxx_mascot = $1 
            AND forane_usuari_id = $2 
            AND eliminado_logico = FALSE
        RETURNING idxxxx_mascot; 
    `;
    return client.query(updateQuery, [petId, userId]);
};

module.exports = {
    getMascotaDetailsByIdDB,
    getMascotaEditByIdDB,
    getMyPostsByUserIdDB,
    getMascotasForHome2ndDB,
    getMascotasForFeedDB,
    getAllMascotasDB,
    updateMascotaApproval,
    insertNewMascotaDB,
    insertMascotaCaracteristicasDB,
    updateMascotaPrincipalDB,
    syncMascotaCaracteristicasDB,
    softDeleteMascotaDB,
    getCaracteristicaIds // Incluimos la utilidad si el controlador necesita obtener IDs por nombre
};