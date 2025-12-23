<script setup lang="ts">
/**
 * SuggestionList Component - Display list of task suggestions
 * Per tasks.md T059, T065 - styled with Tailwind CSS
 */

import type { TaskScore } from '@/types/suggestion'
import SuggestionCard from './SuggestionCard.vue'

defineProps<{
  suggestions: TaskScore[]
  loading?: boolean
  message?: string | null
}>()

const emit = defineEmits<{
  (e: 'complete', taskId: string): void
  (e: 'dismiss', taskId: string): void
}>()

function handleComplete(taskId: string) {
  emit('complete', taskId)
}

function handleDismiss(taskId: string) {
  emit('dismiss', taskId)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Empty State -->
    <div
      v-if="suggestions.length === 0 && !loading"
      data-testid="no-suggestions-message"
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
      <h3 class="mt-4 text-lg font-medium text-gray-900">
        {{ message || 'No suggestions available' }}
      </h3>
      <p v-if="!message" class="mt-2 text-gray-500">
        Try adjusting your available time or filters, or add more tasks.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <template v-else-if="loading">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-lg bg-white p-4 shadow animate-pulse"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="h-6 bg-gray-200 rounded w-2/3"></div>
          <div class="h-5 bg-gray-200 rounded w-16"></div>
        </div>
        <div class="flex gap-2 mb-3">
          <div class="h-6 bg-gray-200 rounded w-12"></div>
          <div class="h-6 bg-gray-200 rounded w-20"></div>
          <div class="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div class="flex gap-2">
          <div class="h-10 bg-gray-200 rounded flex-1"></div>
          <div class="h-10 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </template>

    <!-- Suggestion Cards -->
    <template v-else>
      <SuggestionCard
        v-for="suggestion in suggestions"
        :key="suggestion.taskId"
        :suggestion="suggestion"
        :loading="loading"
        @complete="handleComplete"
        @dismiss="handleDismiss"
      />
    </template>

    <!-- Summary -->
    <div
      v-if="suggestions.length > 0"
      class="text-center text-sm text-gray-500"
    >
      Showing {{ suggestions.length }} suggestion{{ suggestions.length === 1 ? '' : 's' }}
    </div>
  </div>
</template>
