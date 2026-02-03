// scripts/verify_ml_logic.js
// Este script simula el flujo sin conectar a la BD real

const alpha = 0.7; // 70% explícito, 30% implícito

// 1. Simulación de Vectores
// Vector Explícito (Usuario prefiere perros grandes y juguetones)
// [Perro, Gato, Edad, Tamaño, Energía, Juguetón...]
const explicitVector = [1.0, 0.0, 0.5, 0.8, 0.9, 1.0];

// Vector Implícito (Usuario ha dado like a perros pequeños y tranquilos)
// Esto contradice un poco su cuestionario, el sistema debería balancearlo.
const implicitVector = [1.0, 0.0, 0.5, 0.2, 0.3, 0.0];

console.log("=== VERIFICACIÓN DE LÓGICA HÍBRIDA ===");
console.log("Vector Explícito (Cuestionario):", explicitVector);
console.log("Vector Implícito (Interacciones):", implicitVector);

// 2. Función de Mezcla (Copia de mlService)
function mergeUserVectors(v1, v2, a) {
    const merged = [];
    for (let i = 0; i < v1.length; i++) {
        const val = (v1[i] * a) + (v2[i] * (1 - a));
        merged.push(parseFloat(val.toFixed(2)));
    }
    return merged;
}

// 3. Resultados
const finalVector = mergeUserVectors(explicitVector, implicitVector, alpha);
console.log(`\nVector Combinado (Alpha ${alpha}):`, finalVector);

// Análisis
console.log("\n--- ANÁLISIS ---");
console.log(`Tamaño (Index 3):`);
console.log(`- Quería: ${explicitVector[3]} (Grande)`);
console.log(`- Interactuó: ${implicitVector[3]} (Pequeño)`);
console.log(`- Resultado: ${finalVector[3]} (Medio-Grande) -> El sistema aprendió que quizás no los quiere TAN grandes.`);

console.log(`\nEnergía (Index 4):`);
console.log(`- Quería: ${explicitVector[4]} (Muy activo)`);
console.log(`- Interactuó: ${implicitVector[4]} (Tranquilo)`);
console.log(`- Resultado: ${finalVector[4]} (Moderado-Alto) -> Se ajustó la expectativa.`);

console.log("\nCONCLUSIÓN: El sistema ajusta exitosamente las preferencias declaradas usando el comportamiento real.");
