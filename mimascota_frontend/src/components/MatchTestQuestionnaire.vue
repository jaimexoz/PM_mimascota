<template>
  <div class="questionnaire-wrapper">
    <div class="questionnaire-header">
      <h2 class="questionnaire-title">
        <PawPrint class="paw-icon" />
        Cuestionario de Preferencias
        <PawPrint class="paw-icon" />
      </h2>
      <p class="questionnaire-subtitle">Responde las preguntas para encontrar la mascota ideal para ti.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="questionnaire-form">
      <!-- Sección 1: Estilo de Vida -->
      <section class="question-section">
        <h3 class="section-title">Sección 1: Estilo de Vida</h3>

        <div class="question-block">
          <label class="question-label">¿Cuántas horas al día estás en casa?</label>
          <div class="options-group">
            <label v-for="opt in options.horasEnCasa" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.horasEnCasa" :value="opt.value" name="horasEnCasa" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Cuál es tu nivel de actividad física?</label>
          <div class="options-group">
            <label v-for="opt in options.nivelActividad" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.nivelActividad" :value="opt.value" name="nivelActividad" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Tienes experiencia previa con mascotas?</label>
          <div class="options-group">
            <label v-for="opt in options.experienciaMascotas" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.experienciaMascotas" :value="opt.value" name="experienciaMascotas" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Vives en...?</label>
          <div class="options-group">
            <label v-for="opt in options.tipoVivienda" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.tipoVivienda" :value="opt.value" name="tipoVivienda" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Sección 2: Preferencias de la Mascota -->
      <section class="question-section">
        <h3 class="section-title">Sección 2: Preferencias de la Mascota</h3>

        <div class="question-block">
          <label class="question-label">¿Qué tamaño de mascota prefieres?</label>
          <div class="options-group">
            <label v-for="opt in options.tamanoMascota" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.tamanoMascota" :value="opt.value" name="tamanoMascota" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Qué edad prefieres?</label>
          <div class="options-group">
            <label v-for="opt in options.edadPreferida" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.edadPreferida" :value="opt.value" name="edadPreferida" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Prefieres perro o gato?</label>
          <div class="options-group">
            <label v-for="opt in options.perroOGato" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.perroOGato" :value="opt.value" name="perroOGato" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">Nivel de energía deseado:</label>
          <div class="options-group">
            <label v-for="opt in options.nivelEnergia" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.nivelEnergia" :value="opt.value" name="nivelEnergia" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Sección 3: Temperamento y Personalidad -->
      <section class="question-section">
        <h3 class="section-title">Sección 3: Temperamento y Personalidad</h3>

        <div class="question-block">
          <label class="question-label">¿Qué personalidad buscas? (Selecciona hasta 3)</label>
          <div class="options-group options-checkbox">
            <label
              v-for="opt in options.personalidad"
              :key="opt.value"
              class="option-checkbox"
              :class="{ disabled: isPersonalityDisabled(opt.value) }"
            >
              <input
                type="checkbox"
                :value="opt.value"
                v-model="form.personalidad"
                :disabled="isPersonalityDisabled(opt.value)"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Tienes niños en casa?</label>
          <div class="options-group">
            <label v-for="opt in options.ninosEnCasa" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.ninosEnCasa" :value="opt.value" name="ninosEnCasa" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Tienes otras mascotas?</label>
          <div class="options-group">
            <label v-for="opt in options.otrasMascotas" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.otrasMascotas" :value="opt.value" name="otrasMascotas" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Sección 4: Cuidados y Mantenimiento -->
      <section class="question-section">
        <h3 class="section-title">Sección 4: Cuidados y Mantenimiento</h3>

        <div class="question-block">
          <label class="question-label">¿Cuánto tiempo puedes dedicar al cuidado diario?</label>
          <div class="options-group">
            <label v-for="opt in options.tiempoCuidado" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.tiempoCuidado" :value="opt.value" name="tiempoCuidado" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Estás dispuesto a invertir en entrenamiento profesional?</label>
          <div class="options-group">
            <label v-for="opt in options.entrenamiento" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.entrenamiento" :value="opt.value" name="entrenamiento" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <div class="question-block">
          <label class="question-label">¿Cuál es tu presupuesto mensual para la mascota?</label>
          <div class="options-group">
            <label v-for="opt in options.presupuesto" :key="opt.value" class="option-radio">
              <input type="radio" v-model="form.presupuesto" :value="opt.value" name="presupuesto" />
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>
      </section>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="emit('close')">
          Cerrar
        </button>
        <button type="submit" class="btn btn-primary">
          Enviar y ver mi match
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { PawPrint } from 'lucide-vue-next';

const emit = defineEmits(['submit', 'close']);

const MAX_PERSONALIDAD = 3;

const form = reactive({
  horasEnCasa: '',
  nivelActividad: '',
  experienciaMascotas: '',
  tipoVivienda: '',
  tamanoMascota: '',
  edadPreferida: '',
  perroOGato: '',
  nivelEnergia: '',
  personalidad: [],
  ninosEnCasa: '',
  otrasMascotas: '',
  tiempoCuidado: '',
  entrenamiento: '',
  presupuesto: ''
});

const options = {
  horasEnCasa: [
    { value: 'menos_4', label: 'Menos de 4 horas (trabajo tiempo completo fuera)' },
    { value: '4_6', label: '4-6 horas (medio tiempo)' },
    { value: '6_8', label: '6-8 horas (trabajo desde casa parcial)' },
    { value: 'mas_8', label: 'Más de 8 horas (trabajo desde casa o jubilado)' }
  ],
  nivelActividad: [
    { value: 'sedentario', label: 'Sedentario (prefiero actividades en casa)' },
    { value: 'moderado', label: 'Moderado (caminatas ocasionales)' },
    { value: 'activo', label: 'Activo (ejercicio regular, salidas frecuentes)' },
    { value: 'muy_activo', label: 'Muy activo (deportista, aventurero)' }
  ],
  experienciaMascotas: [
    { value: 'ninguna', label: 'Ninguna (primera vez)' },
    { value: 'poca', label: 'Poca (tuve mascotas de niño)' },
    { value: 'moderada', label: 'Moderada (he tenido mascotas adulto)' },
    { value: 'experta', label: 'Experta (he criado/entrenado mascotas)' }
  ],
  tipoVivienda: [
    { value: 'apto_pequeno', label: 'Apartamento pequeño (sin jardín)' },
    { value: 'apto_grande', label: 'Apartamento grande (sin jardín)' },
    { value: 'casa_patio', label: 'Casa con patio pequeño' },
    { value: 'casa_jardin', label: 'Casa con jardín grande' }
  ],
  tamanoMascota: [
    { value: 'pequeno', label: 'Pequeño (hasta 10kg)' },
    { value: 'mediano', label: 'Mediano (10-25kg)' },
    { value: 'grande', label: 'Grande (25-40kg)' },
    { value: 'muy_grande', label: 'Muy grande (más de 40kg)' },
    { value: 'sin_preferencia', label: 'Sin preferencia' }
  ],
  edadPreferida: [
    { value: 'cachorro', label: 'Cachorro/Gatito (0-1 año) - Requiere mucha atención' },
    { value: 'joven', label: 'Joven (1-3 años) - Energético' },
    { value: 'adulto', label: 'Adulto (3-7 años) - Equilibrado' },
    { value: 'senior', label: 'Senior (7+ años) - Tranquilo' },
    { value: 'sin_preferencia', label: 'Sin preferencia' }
  ],
  perroOGato: [
    { value: 'solo_perros', label: 'Solo perros' },
    { value: 'solo_gatos', label: 'Solo gatos' },
    { value: 'ambos', label: 'Ambos me gustan' }
  ],
  nivelEnergia: [
    { value: 'tranquilo', label: 'Tranquilo/Relajado (prefiero mascotas que duerman mucho)' },
    { value: 'moderado', label: 'Moderado (equilibrio entre juego y descanso)' },
    { value: 'energetico', label: 'Energético (me gusta jugar y hacer ejercicio con mi mascota)' }
  ],
  personalidad: [
    { value: 'Juguetón', label: 'Juguetón' },
    { value: 'Tranquilo', label: 'Tranquilo' },
    { value: 'Tímido', label: 'Tímido' },
    { value: 'Energético', label: 'Energético' },
    { value: 'Amigable', label: 'Amigable' },
    { value: 'Cariñoso', label: 'Cariñoso' },
    { value: 'Leal', label: 'Leal' },
    { value: 'Protector', label: 'Protector' },
    { value: 'Inteligente', label: 'Inteligente' }
  ],
  ninosEnCasa: [
    { value: 'no', label: 'No' },
    { value: 'menores_5', label: 'Sí, menores de 5 años' },
    { value: '5_12', label: 'Sí, entre 5-12 años' },
    { value: 'mayores_12', label: 'Sí, mayores de 12 años' }
  ],
  otrasMascotas: [
    { value: 'no', label: 'No' },
    { value: 'perros', label: 'Sí, perros' },
    { value: 'gatos', label: 'Sí, gatos' },
    { value: 'otras', label: 'Sí, otras mascotas' }
  ],
  tiempoCuidado: [
    { value: 'menos_30', label: 'Menos de 30 minutos' },
    { value: '30_60', label: '30 minutos - 1 hora' },
    { value: '1_2', label: '1-2 horas' },
    { value: 'mas_2', label: 'Más de 2 horas' }
  ],
  entrenamiento: [
    { value: 'no', label: 'No, prefiero mascotas ya entrenadas' },
    { value: 'tal_vez', label: 'Tal vez, si es necesario' },
    { value: 'si', label: 'Sí, me interesa entrenar a mi mascota' }
  ],
  presupuesto: [
    { value: 'basico', label: 'Básico ($50-100) - Comida y cuidados esenciales' },
    { value: 'moderado', label: 'Moderado ($100-200) - Incluye juguetes y visitas al vet' },
    { value: 'alto', label: 'Alto ($200+) - Incluye grooming, entrenamiento, etc.' }
  ]
};

function isPersonalityDisabled(value) {
  return form.personalidad.length >= MAX_PERSONALIDAD && !form.personalidad.includes(value);
}

function handleSubmit() {
  emit('submit', { ...form });
}
</script>

<style scoped>
.questionnaire-wrapper {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 1.5rem;
  max-width: 42rem;
  margin: 1rem;
  max-height: 85vh;
  overflow-y: auto;
  scrollbar-width: none;
}


.questionnaire-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.questionnaire-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.paw-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ff9595;
}

.questionnaire-subtitle {
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.95rem;
}

.questionnaire-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-section {
  background: #f9fafb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

.question-block {
  margin-bottom: 1rem;
}

.question-block:last-child {
  margin-bottom: 0;
}

.question-label {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.options-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.options-group.options-checkbox {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
}

.option-radio,
.option-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #4b5563;
}

.option-radio input,
.option-checkbox input {
  margin-top: 0.2rem;
  accent-color: #ff9595;
  cursor: pointer;
}

.option-checkbox.disabled:not(:has(input:checked)) {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-checkbox.disabled input {
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.btn {
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  border: none;
}

.btn-primary {
  background-color: #ff9595;
  color: #fff;
}

.btn-primary:hover {
  background-color: #ff6060;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}
</style>
