<script setup lang="ts">
/**
 * TimeInput Component - Declare available time for suggestions
 * Per tasks.md T057, T064 - mobile-first design with touch targets
 */

import { ref, computed } from 'vue'
import type { EffortLevel, Location } from '@/types/task'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', value: {
    availableTimeMinutes: number
    effortLevel?: EffortLevel
    location?: Location
  }): void
}>()

const timeValue = ref<number | null>(15)
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

// Quick time presets - common short durations
const presets = [
  { label: '5m', value: 5 },
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '60m', value: 60 }
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

// Location options (for suggestions: Home or Away only)
const locationOptions: { value: Location; label: string; emoji: string }[] = [
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'outside', label: 'Away', emoji: '🚶' }
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
  <div class="rounded-lg bg-white p-4 shadow">
    <!-- Time Input Section -->
    <div class="mb-4">
      <label for="time-input" class="block text-sm font-medium text-gray-700 mb-2">
        How much time do you have?
      </label>

      <!-- Input + Presets in grouped background -->
      <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1.5" role="group" aria-label="Time selection">
        <!-- Custom Time Input with suffix -->
        <div class="flex items-center bg-white rounded-md shadow-sm">
          <input
            id="time-input"
            data-testid="time-input"
            v-model.number="timeValue"
            type="number"
            min="1"
            max="480"
            class="touch-target block w-14 rounded-l-md border-0 text-center text-sm focus:ring-2 focus:ring-inset focus:ring-primary-500 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            :class="{ 'ring-2 ring-red-500': timeError }"
            :aria-invalid="!!timeError"
            :aria-describedby="timeError ? 'time-error' : undefined"
            aria-label="Available time in minutes"
            @keyup.enter="handleSubmit"
          />
          <span class="pr-2 text-sm text-gray-500 bg-white rounded-r-md">min</span>
        </div>

        <!-- Vertical divider -->
        <div class="w-px h-8 bg-gray-300"></div>

        <!-- Quick Presets -->
        <div class="flex gap-1 flex-1">
          <button
            v-for="preset in presets"
            :key="preset.value"
            type="button"
            class="touch-target flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 cursor-pointer"
            :class="[
              timeValue === preset.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
            :aria-pressed="timeValue === preset.value"
            :aria-label="`Set time to ${preset.label}`"
            @click="selectPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <p v-if="timeError" id="time-error" class="mt-1 text-sm text-red-600" role="alert">{{ timeError }}</p>
    </div>

    <!-- Energy Level Filter -->
    <div class="mb-4">
      <label id="energy-label" class="block text-sm font-medium text-gray-700 mb-2">
        How much energy do you have?
      </label>
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1.5" role="group" aria-labelledby="energy-label">
        <button
          v-for="option in energyOptions"
          :key="option.value"
          type="button"
          data-testid="energy-filter-button"
          class="touch-target flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 cursor-pointer"
          :class="[
            energyLevel === option.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
          :aria-pressed="energyLevel === option.value"
          :aria-label="`${option.label} energy - shows tasks up to ${option.value} effort`"
          @click="selectEnergy(option.value)"
        >
          <span class="mr-1" aria-hidden="true">{{ option.emoji }}</span>
          {{ option.label }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        Shows tasks up to {{ energyLevel }} effort
      </p>
    </div>

    <!-- Location Filter -->
    <div class="mb-4">
      <label id="location-label" class="block text-sm font-medium text-gray-700 mb-2">
        Where are you? <span class="text-gray-400 font-normal">(optional)</span>
      </label>
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1.5" role="group" aria-labelledby="location-label">
        <button
          v-for="option in locationOptions"
          :key="option.value"
          type="button"
          data-testid="location-filter-button"
          class="touch-target flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 cursor-pointer"
          :class="[
            locationFilter === option.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
          :aria-pressed="locationFilter === option.value"
          :aria-label="`Filter by ${option.label} location`"
          @click="selectLocation(option.value)"
        >
          <span class="mr-1" aria-hidden="true">{{ option.emoji }}</span>
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="button"
      data-testid="get-suggestions-button"
      :disabled="!isValid || loading"
      :aria-busy="loading"
      class="touch-target w-full btn-primary rounded-lg px-4 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="handleSubmit"
    >
      <span v-if="loading" class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Generating...</span>
      </span>
      <span v-else>Get Suggestions</span>
    </button>
  </div>
</template>
