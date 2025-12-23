<script setup lang="ts">
/**
 * TimeInput Component - Declare available time for suggestions
 * Per tasks.md T057, T064 - mobile-first design with touch targets
 */

import { ref, computed } from 'vue'
import type { EffortLevel, Location } from '@/types/task'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', value: { 
    availableTimeMinutes: number
    effortLevel?: EffortLevel
    location?: Location 
  }): void
}>()

const timeValue = ref<number | null>(null)
// Default to 'high' - means "show all tasks up to high effort"
const energyLevel = ref<EffortLevel>('high')
const locationFilter = ref<Location | null>(null)

const isValid = computed(() => {
  return timeValue.value !== null && timeValue.value >= 1 && timeValue.value <= 480
})

const timeError = computed(() => {
  if (timeValue.value === null) return null
  if (timeValue.value < 1) return 'Minimum 1 minute'
  if (timeValue.value > 480) return 'Maximum 8 hours (480 minutes)'
  return null
})

function handleSubmit() {
  if (!isValid.value || timeValue.value === null) return

  emit('submit', {
    availableTimeMinutes: timeValue.value,
    effortLevel: energyLevel.value,
    location: locationFilter.value || undefined
  })
}

// Quick time presets
const presets = [
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 }
]

function selectPreset(minutes: number) {
  timeValue.value = minutes
}

// Energy level options (maps to effort level filtering)
const energyOptions: { value: EffortLevel; label: string; emoji: string }[] = [
  { value: 'low', label: 'Low', emoji: '😴' },
  { value: 'medium', label: 'Medium', emoji: '😊' },
  { value: 'high', label: 'High', emoji: '⚡' }
]

// Location options
const locationOptions: { value: Location; label: string; emoji: string }[] = [
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'outside', label: 'Outside', emoji: '🌳' },
  { value: 'anywhere', label: 'Anywhere', emoji: '📍' }
]

function selectEnergy(level: EffortLevel) {
  energyLevel.value = level
}

function selectLocation(loc: Location | null) {
  // Toggle off if same value clicked
  locationFilter.value = locationFilter.value === loc ? null : loc
}
</script>

<template>
  <div class="rounded-lg bg-white p-4 shadow sm:p-6">
    <!-- Time Input Section -->
    <div class="mb-5">
      <label for="time-input" class="block text-sm font-medium text-gray-700 mb-2">
        How much time do you have?
      </label>
      
      <!-- Quick Presets -->
      <div class="flex gap-2 mb-3">
        <button
          v-for="preset in presets"
          :key="preset.value"
          type="button"
          class="touch-target flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="[
            timeValue === preset.value
              ? 'border-transparent filter-pill-active'
              : 'border-gray-300 filter-pill-inactive'
          ]"
          @click="selectPreset(preset.value)"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Custom Time Input -->
      <div class="flex items-center gap-3">
        <input
          id="time-input"
          data-testid="time-input"
          v-model.number="timeValue"
          type="number"
          min="1"
          max="480"
          placeholder="30"
          class="touch-target block w-24 rounded-md border border-gray-300 shadow-sm text-center text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :class="{ 'border-red-500': timeError }"
          @keyup.enter="handleSubmit"
        />
        <span class="text-gray-600">minutes</span>
      </div>
      
      <p v-if="timeError" class="mt-1 text-sm text-red-600">{{ timeError }}</p>
    </div>

    <!-- Energy Level Filter -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        How much energy do you have?
      </label>
      <div class="flex gap-2">
        <button
          v-for="option in energyOptions"
          :key="option.value"
          type="button"
          data-testid="energy-filter-button"
          class="touch-target flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="[
            energyLevel === option.value
              ? 'border-transparent filter-pill-active'
              : 'border-gray-300 filter-pill-inactive'
          ]"
          @click="selectEnergy(option.value)"
        >
          <span class="mr-1">{{ option.emoji }}</span>
          {{ option.label }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        Shows tasks up to {{ energyLevel }} effort
      </p>
    </div>

    <!-- Location Filter -->
    <div class="mb-5">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Where are you? <span class="text-gray-400 font-normal">(optional)</span>
      </label>
      <div class="flex gap-2">
        <button
          v-for="option in locationOptions"
          :key="option.value"
          type="button"
          data-testid="location-filter-button"
          class="touch-target flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="[
            locationFilter === option.value
              ? 'border-transparent filter-pill-active'
              : 'border-gray-300 filter-pill-inactive'
          ]"
          @click="selectLocation(option.value)"
        >
          <span class="mr-1">{{ option.emoji }}</span>
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="button"
      data-testid="get-suggestions-button"
      :disabled="!isValid || loading"
      class="touch-target w-full btn-primary rounded-lg px-4 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="handleSubmit"
    >
      <span v-if="loading" class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Generating...
      </span>
      <span v-else>Get Suggestions</span>
    </button>
  </div>
</template>
