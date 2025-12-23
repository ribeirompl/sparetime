<script setup lang="ts">
/**
 * SuggestionsView - Time-based task suggestions
 * Per tasks.md T060 - implements suggestion generation flow
 */

import { ref, onMounted } from 'vue'
import { useSuggestionStore } from '@/stores/suggestionStore'
import { useTaskStore } from '@/stores/taskStore'
import { TimeInput, SuggestionList } from '@/components/suggestions'
import type { EffortLevel, Location } from '@/types/task'

const suggestionStore = useSuggestionStore()
const taskStore = useTaskStore()

const hasGenerated = ref(false)

onMounted(async () => {
  // Ensure tasks are loaded
  if (taskStore.tasks.length === 0) {
    await taskStore.loadTasks()
  }
})

async function handleSubmit(input: {
  availableTimeMinutes: number
  effortLevel?: EffortLevel
  location?: Location
}) {
  hasGenerated.value = true
  
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

async function handleComplete(taskId: number) {
  await taskStore.complete(taskId)
  await suggestionStore.recordAction(taskId, 'completed')
  
  // Re-generate suggestions if we have context
  if (suggestionStore.lastContext) {
    await suggestionStore.generateSuggestions(suggestionStore.lastContext)
  }
}

async function handleDismiss(taskId: number) {
  await suggestionStore.recordAction(taskId, 'dismissed')
  
  // Remove from current suggestions
  const index = suggestionStore.currentSuggestions.findIndex(s => s.taskId === taskId)
  if (index !== -1) {
    suggestionStore.currentSuggestions.splice(index, 1)
  }
}
</script>

<template>
  <div class="pb-20">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Get Suggestions</h2>

    <!-- Time Input -->
    <div class="mb-6">
      <TimeInput
        :loading="suggestionStore.loading"
        @submit="handleSubmit"
      />
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
      v-else
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
