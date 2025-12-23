<script setup lang="ts">
/**
 * SuggestionCard Component - Display a single task suggestion
 * Per tasks.md T058, T061, T062, T065 - with mark complete action and reasons
 */

import type { TaskScore } from '@/types/suggestion'

const props = defineProps<{
  suggestion: TaskScore
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'complete', taskId: string): void
  (e: 'dismiss', taskId: string): void
}>()

/**
 * Get effort level badge color
 */
function getEffortColor(effort: string): string {
  switch (effort) {
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get location icon
 */
function getLocationIcon(location: string): string {
  switch (location) {
    case 'home':
      return '🏠'
    case 'outside':
      return '🌳'
    case 'anywhere':
      return '📍'
    default:
      return '📍'
  }
}

/**
 * Get urgency indicator class
 */
function getUrgencyClass(urgency: number): string {
  if (urgency > 0) {
    return 'bg-red-100 text-red-800 border-red-200'
  } else if (urgency === 0) {
    return 'bg-orange-100 text-orange-800 border-orange-200'
  } else if (urgency >= -3) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

/**
 * Format time duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function handleComplete() {
  emit('complete', props.suggestion.taskId)
}

function handleDismiss() {
  emit('dismiss', props.suggestion.taskId)
}
</script>

<template>
  <div
    data-testid="suggestion-card"
    class="rounded-lg bg-white p-4 shadow transition-all hover:shadow-md"
  >
    <!-- Header: Task name and urgency indicator -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <h3 class="font-medium text-gray-900 text-lg leading-tight">
        {{ suggestion.task.name }}
      </h3>
      
      <!-- Urgency Badge (for recurring/deadline tasks) -->
      <span
        v-if="suggestion.urgency !== 0 || suggestion.task.type === 'recurring'"
        class="flex-shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
        :class="getUrgencyClass(suggestion.urgency)"
      >
        <template v-if="suggestion.urgency > 0">
          {{ suggestion.urgency }}d overdue
        </template>
        <template v-else-if="suggestion.urgency === 0">
          Due today
        </template>
        <template v-else>
          In {{ Math.abs(suggestion.urgency) }}d
        </template>
      </span>
    </div>

    <!-- Meta: Time, Effort, Location -->
    <div class="flex flex-wrap gap-2 mb-3">
      <!-- Time -->
      <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        ⏱️ {{ formatDuration(suggestion.task.timeEstimateMinutes) }}
      </span>
      
      <!-- Effort -->
      <span
        class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
        :class="getEffortColor(suggestion.task.effortLevel)"
      >
        {{ suggestion.task.effortLevel }} effort
      </span>
      
      <!-- Location -->
      <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
        {{ getLocationIcon(suggestion.task.location) }} {{ suggestion.task.location }}
      </span>
      
      <!-- Task Type -->
      <span
        v-if="suggestion.task.type !== 'one-off'"
        class="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
      >
        {{ suggestion.task.type === 'recurring' ? '🔁' : '📂' }}
        {{ suggestion.task.type }}
      </span>
    </div>

    <!-- Reason -->
    <p
      data-testid="suggestion-reason"
      class="text-sm text-gray-600 mb-4"
    >
      💡 {{ suggestion.reason }}
    </p>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        type="button"
        data-testid="complete-task-button"
        :disabled="loading"
        class="touch-target flex-1 rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: #059669; color: white;"
        @click="handleComplete"
      >
        <span class="flex items-center justify-center gap-2">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Done
        </span>
      </button>
      
      <button
        type="button"
        :disabled="loading"
        class="touch-target rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style="background-color: white;"
        @click="handleDismiss"
      >
        Skip
      </button>
    </div>
  </div>
</template>
