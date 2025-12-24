<script setup lang="ts">
/**
 * SuggestionsView - Time-based task suggestions
 * Per tasks.md T060 - implements suggestion generation flow
 * Redesigned with collapsible options section
 */

import { ref, computed, onMounted } from 'vue'
import { useSuggestionStore } from '@/stores/suggestionStore'
import { useTaskStore } from '@/stores/taskStore'
import { TimeInput, SuggestionList } from '@/components/suggestions'
import type { EffortLevel, Location } from '@/types/task'

const suggestionStore = useSuggestionStore()
const taskStore = useTaskStore()

const hasGenerated = ref(false)
const optionsExpanded = ref(true)

// Store the last used context for display in summary
const lastInputContext = ref<{
  availableTimeMinutes: number
  effortLevel?: EffortLevel
  location?: Location
} | null>(null)

onMounted(async () => {
  // Ensure tasks are loaded
  if (taskStore.tasks.length === 0) {
    await taskStore.loadTasks()
  }
})

const summaryText = computed(() => {
  if (!lastInputContext.value) return ''
  
  const parts: string[] = []
  
  // Time
  const mins = lastInputContext.value.availableTimeMinutes
  if (mins < 60) {
    parts.push(`${mins}m`)
  } else {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    parts.push(remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`)
  }
  
  // Effort
  if (lastInputContext.value.effortLevel) {
    const effortEmoji = lastInputContext.value.effortLevel === 'low' ? '😴' 
      : lastInputContext.value.effortLevel === 'medium' ? '😊' : '⚡'
    parts.push(`${effortEmoji} ${lastInputContext.value.effortLevel}`)
  }
  
  // Location
  if (lastInputContext.value.location) {
    const locEmoji = lastInputContext.value.location === 'home' ? '🏠' 
      : lastInputContext.value.location === 'outside' ? '🌳' : '📍'
    parts.push(`${locEmoji} ${lastInputContext.value.location}`)
  }
  
  return parts.join(' • ')
})

async function handleSubmit(input: {
  availableTimeMinutes: number
  effortLevel?: EffortLevel
  location?: Location
}) {
  hasGenerated.value = true
  optionsExpanded.value = false
  lastInputContext.value = input
  
  await suggestionStore.generateSuggestions({
    availableTimeMinutes: input.availableTimeMinutes,
    contextFilters: input.effortLevel || input.location
      ? {
          effortLevel: input.effortLevel,
          location: input.location
        }
      : undefined
  })
}

async function handleComplete(taskId: string) {
  await taskStore.complete(taskId)
  await suggestionStore.recordAction(taskId, 'completed')
  
  // Re-generate suggestions if we have context
  if (suggestionStore.lastContext) {
    await suggestionStore.generateSuggestions(suggestionStore.lastContext)
  }
}

async function handleDismiss(taskId: string) {
  await suggestionStore.recordAction(taskId, 'dismissed')
  
  // Remove from current suggestions
  const index = suggestionStore.currentSuggestions.findIndex(s => s.taskId === taskId)
  if (index !== -1) {
    suggestionStore.currentSuggestions.splice(index, 1)
  }
}

function toggleOptions() {
  optionsExpanded.value = !optionsExpanded.value
}
</script>

<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="pb-3 mx-2">
      <h2 class="text-xl font-bold text-gray-900 mb-2">Suggestions</h2>

      <!-- Options Section - Collapsible with animation -->
      <!-- Collapsed Summary View -->
      <Transition name="collapse">
        <div 
          v-if="hasGenerated && !optionsExpanded"
          class="rounded-lg bg-white p-3 shadow cursor-pointer hover:bg-gray-50 transition-colors"
          @click="toggleOptions"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Filters:</span>
              <span class="text-sm text-primary-600 font-medium">{{ summaryText }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-primary-600 cursor-pointer"
                @click.stop="toggleOptions"
              >
                Edit
              </button>
              <svg 
                class="w-4 h-4 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Expanded Options View with animation -->
      <Transition name="expand">
        <div 
          v-if="optionsExpanded"
        >
          <TimeInput
            :loading="suggestionStore.loading"
            @submit="handleSubmit"
          />
        </div>
      </Transition>
    </div>

    <!-- Initial State (before generating) -->
    <div
      v-if="!hasGenerated && !suggestionStore.loading"
      class="rounded-lg bg-white p-8 text-center shadow"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">Enter your available time</h3>
      <p class="mt-2 text-gray-500">
        Tell us how much time you have, and we'll suggest the best tasks to work on.
      </p>
    </div>

    <!-- Suggestions List -->
    <SuggestionList
      v-else-if="hasGenerated"
      :suggestions="suggestionStore.currentSuggestions"
      :loading="suggestionStore.loading"
      :message="suggestionStore.message"
      @complete="handleComplete"
      @dismiss="handleDismiss"
    />

    <!-- Error State -->
    <div
      v-if="suggestionStore.error"
      class="mt-4 rounded-md bg-red-50 p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ suggestionStore.error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Collapse animation (summary view entering) */
.collapse-enter-active {
  transition: all 0.3s ease;
}

.collapse-leave-active {
  /* Hide immediately when leaving to avoid jump during expand transition */
  transition: opacity 0.05s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

.collapse-enter-from {
  transform: translateY(-10px);
}

/* Expand animation (full options entering) */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
