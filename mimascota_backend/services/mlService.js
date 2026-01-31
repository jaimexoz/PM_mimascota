// backend/services/mlService.js

/**
 * SERVICIO DE MACHINE LEARNING (Content-Based Filtering)
 * -----------------------------------------------------
 * Este servicio se encarga de:
 * 1. Transformar respuestas del usuario (Vue) en un vector numérico.
 * 2. Transformar datos de la mascota (PostgreSQL) en un vector numérico.
 * 3. Calcular la similitud del coseno entre ambos vectores.
 * * Espacio Vectorial: 20 Dimensiones
 */

// ==========================================
// 1. DICCIONARIOS DE MAPEO (Traducción)
// ==========================================

// Mapeo de TAMAÑO (DB y Preferencias) -> Valor Normalizado (0.0 - 1.0)
const SIZE_MAP = {
    // Valores posibles en tu DB o Formulario
    'pequeno': 0.1, 'pequeño': 0.1, 'small': 0.1,
    'mediano': 0.5, 'medium': 0.5,
    'grande': 0.8, 'large': 0.8,
    'muy_grande': 1.0, 'very_large': 1.0,
    // Mapeos de vivienda (para restringir tamaño)
    'apto_pequeno': 0.2,
    'apto_grande': 0.6,
    'casa_patio': 0.8,
    'casa_jardin': 1.0
};

// Mapeo de ENERGÍA -> Valor Normalizado
const ENERGY_MAP = {
    'tranquilo': 0.2, 'calm': 0.2,
    'moderado': 0.5, 'moderate': 0.5,
    'energético': 0.9, 'high': 0.9, 'muy_activo': 1.0,
    'sedentario': 0.1, 'activo': 0.8 // Para el usuario
};

// Mapeo de EXPERIENCIA -> Valor Normalizado
const EXP_MAP = {
    'ninguna': 0.1,
    'poca': 0.4,
    'moderada': 0.7,
    'experta': 1.0
};

// ORDEN ESTRICTO DE RASGOS DE PERSONALIDAD (Dimensiones 5 a 17)
// Es vital que este orden sea idéntico para Usuario y Mascota.
const PERSONALITY_TRAITS = [
    'jugueton',   // 5
    'tranquilo',  // 6
    'timido',     // 7
    'energetico', // 8
    'ruidoso',    // 9
    'amigable',   // 10
    'cariñoso',   // 11
    'agresivo',   // 12 (Rasgo negativo)
    'leal',       // 13
    'protector',  // 14
    'inteligente',// 15
    'temeroso',   // 16
    'arisco'      // 17
];

// ==========================================
// 2. FUNCIONES MATEMÁTICAS (Núcleo)
// ==========================================

/**
 * Calcula la Similitud del Coseno entre dos vectores.
 * Retorna un valor entre 0.0 (diferentes) y 1.0 (idénticos).
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ==========================================
// 3. VECTORIZACIÓN DE LA MASCOTA (DB -> Vector)
// ==========================================

/**
 * Convierte un registro de mascota de la DB a vector.
 * @param {Object} pet - Objeto directo de tu consulta SQL.
 * IMPORTANTE: Debe incluir 'lista_personalidad' (array de strings) generado por el JOIN.
 */
function createPetVector(pet) {
    const vec = [];

    // --- DIM 0-1: ESPECIE ---
    // Detectamos si es perro o gato basado en tu columna 'especi_mascot'
    // Asumimos que puede venir como ID (1,2) o String ('Perro', 'Gato')
    const especieStr = String(pet.especi_mascot || '').toLowerCase();
    const isDog = especieStr.includes('perro') || especieStr === '1';
    const isCat = especieStr.includes('gato') || especieStr === '2';
    
    vec.push(isDog ? 1.0 : 0.0);
    vec.push(isCat ? 1.0 : 0.0);

    // --- DIM 2: EDAD (Normalizada) ---
    // Usamos 'edadme_mascot' (meses). Max asumido: 20 años (240 meses)
    const edadMeses = parseInt(pet.edadme_mascot) || 0;
    vec.push(Math.min(edadMeses / 240, 1.0));

    // --- DIM 3: TAMAÑO ---
    // Usamos 'tamano_mascot'. Convertimos a minúsculas para buscar en el mapa.
    const tamano = String(pet.tamano_mascot || '').toLowerCase();
    vec.push(SIZE_MAP[tamano] || 0.5); // 0.5 por defecto si no matchea

    // --- DIM 4: ENERGÍA ---
    // Usamos 'nenerg_mascot'.
    const energia = String(pet.nenerg_mascot || '').toLowerCase();
    vec.push(ENERGY_MAP[energia] || 0.5);

    // --- DIM 5-17: PERSONALIDAD ---
    // Usamos 'lista_personalidad' que viene del array_agg en tu SQL Controller
    const rasgosDB = (pet.lista_personalidad || []).map(t => t.toLowerCase());
    
    PERSONALITY_TRAITS.forEach(trait => {
        // Verificamos si la mascota tiene este rasgo específico
        // Mapeo flexible: ej. "juguetón" (con tilde) vs "jugueton" (sin tilde)
        const match = rasgosDB.some(r => r.includes(trait) || trait.includes(r));
        vec.push(match ? 1.0 : 0.0);
    });

    // --- DIM 18: TOLERANCIA NIÑOS (Inferido) ---
    // Si es amigable, juguetón o protector -> Apto para niños
    const goodWithKids = ['amigable', 'jugueton', 'juguetón', 'protector', 'paciente'];
    const hasKidTrait = rasgosDB.some(r => goodWithKids.some(k => r.includes(k)));
    vec.push(hasKidTrait ? 1.0 : 0.0);

    // --- DIM 19: SOCIABILIDAD (Inferido) ---
    const socialTraits = ['amigable', 'sociable', 'jugueton', 'juguetón'];
    const hasSocialTrait = rasgosDB.some(r => socialTraits.some(s => r.includes(s)));
    vec.push(hasSocialTrait ? 1.0 : 0.0);

    return vec;
}

// ==========================================
// 4. VECTORIZACIÓN DEL USUARIO (Frontend -> Vector)
// ==========================================

/**
 * Convierte el JSON del formulario Vue a vector.
 * @param {Object} formData - Datos crudos del 'MatchTestQuestionnaire.vue'
 */
function createUserVector(formData) {
    const vec = [];

    // --- 1. ESPECIE ---
    // perroOGato: 'solo_perros', 'solo_gatos', 'ambos'
    const wantsDog = formData.perroOGato !== 'solo_gatos';
    const wantsCat = formData.perroOGato !== 'solo_perros';
    vec.push(wantsDog ? 1.0 : 0.0);
    vec.push(wantsCat ? 1.0 : 0.0);

    // --- 2. EDAD PREFERIDA ---
    // Mapeamos 'cachorro', 'joven', etc. a valores numéricos
    let ageVal = 0.5; // 'sin_preferencia' o 'adulto'
    if (formData.edadPreferida === 'cachorro') ageVal = 0.05; // ~1 año
    if (formData.edadPreferida === 'joven') ageVal = 0.15;    // ~3 años
    if (formData.edadPreferida === 'senior') ageVal = 0.8;
    vec.push(ageVal);

    // --- 3. TAMAÑO (Deseo vs Realidad) ---
    // El usuario quiere 'muy_grande' (1.0), pero vive en 'apto_pequeno' (0.2).
    // La recomendación debe respetar el límite físico de la vivienda.
    const desiredSize = SIZE_MAP[formData.tamanoMascota] || 0.5;
    const homeLimit = SIZE_MAP[formData.tipoVivienda] || 1.0;
    
    // Usamos el mínimo entre lo que quiere y lo que puede tener
    vec.push(Math.min(desiredSize, homeLimit));

    // --- 4. ENERGÍA (Actividad + Tiempo) ---
    // Calculamos un promedio entre su actividad física y la energía que pide
    const userActivity = ENERGY_MAP[formData.nivelActividad] || 0.5;
    const desiredEnergy = ENERGY_MAP[formData.nivelEnergia] || 0.5;
    
    let finalEnergy = (userActivity + desiredEnergy) / 2;

    // Penalización: Si no está nunca en casa, no debería tener mascota de alta energía
    if (formData.horasEnCasa === 'menos_4') {
        finalEnergy = Math.min(finalEnergy, 0.4);
    }
    vec.push(finalEnergy);

    // --- 5-17. PERSONALIDAD ---
    // El array 'personalidad' viene del checkbox de Vue
    const userTraits = (formData.personalidad || []).map(t => t.toLowerCase());
    
    PERSONALITY_TRAITS.forEach(trait => {
        // Mapeos especiales de sinónimos del Frontend
        let isMatch = userTraits.includes(trait);
        
        // Ejemplo: Si el front manda 'curioso', lo mapeamos a 'jugueton' o 'inteligente'
        if (trait === 'jugueton' && userTraits.includes('curioso')) isMatch = true;
        if (trait === 'arisco' && userTraits.includes('independiente')) isMatch = true;

        vec.push(isMatch ? 1.0 : 0.0);
    });

    // --- 18. NIÑOS ---
    // ninosEnCasa: 'no', 'menores_5', etc.
    const hasKids = formData.ninosEnCasa !== 'no';
    vec.push(hasKids ? 1.0 : 0.0); // 1.0 = Necesita mascota tolerante a niños

    // --- 19. OTRAS MASCOTAS ---
    // otrasMascotas: 'no', 'perros', etc.
    const hasPets = formData.otrasMascotas !== 'no';
    vec.push(hasPets ? 1.0 : 0.0); // 1.0 = Necesita mascota sociable

    return vec;
}

module.exports = {
    createPetVector,
    createUserVector,
    cosineSimilarity
};