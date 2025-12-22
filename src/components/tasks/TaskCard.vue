<script setup lang="ts">
/**
 * TaskCard Component
 * T039, T048
 *
 * Displays a task summary with:
 * - Task name and type indicator
 * - Time estimate, effort level, location
 * - Urgency indicator for recurring tasks
 * - Priority indicator
 */

import { computed } from 'vue'
import type { Task } from '@/types/task'
import { calculateUrgency, isOverdue, isDueToday } from '@/utils/dateHelpers'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  click: [task: Task]
  complete: [task: Task]
  delete: [task: Task]
}>()

// Computed properties
const typeLabel = computed(() => {
  switch (props.task.type) {
    case 'recurring':
      return 'recurring'
    case 'project':
      return 'project'
    default:
      return 'one-off'
  }
})

const typeBadgeClass = computed(() => {
  switch (props.task.type) {
    case 'recurring':
      return 'bg-blue-100 text-blue-700'
    case 'project':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const effortBadgeClass = computed(() => {
  switch (props.task.effortLevel) {
    case 'low':
      return 'bg-green-100 text-green-700'
    case 'high':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
})

const locationIcon = computed(() => {
  switch (props.task.location) {
    case 'home':
      return '🏠'
    case 'outside':
      return '🚶'
    default:
      return '📍'
  }
})

// Time display - for projects show session duration, for others show estimate
const timeDisplay = computed(() => {
  if (props.task.type === 'project' && props.task.projectSession) {
    return `${props.task.projectSession.minSessionDurationMinutes} min session`
  }
  return `${props.task.timeEstimateMinutes} min`
})

// Urgency for recurring tasks
const urgencyInfo = computed(() => {
  if (props.task.type !== 'recurring' || !props.task.recurringPattern?.nextDueDate) {
    return null
  }

  const nextDue = props.task.recurringPattern.nextDueDate
  const urgency = calculateUrgency(nextDue)

  if (isOverdue(nextDue)) {
    return {
      text: `${urgency} day${urgency === 1 ? '' : 's'} overdue`,
      class: 'text-red-600 bg-red-50'
    }
  } else if (isDueToday(nextDue)) {
    return {
      text: 'Due today',
      class: 'text-orange-600 bg-orange-50'
    }
  } else {
    const daysUntil = Math.abs(urgency)
    return {
      text: `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      class: 'text-green-600 bg-green-50'
    }
  }
})

// Priority display
const priorityDisplay = computed(() => {
  const p = props.task.priority
  if (p >= 8) return { label: 'High', class: 'text-red-500' }
  if (p >= 4) return { label: 'Medium', class: 'text-yellow-500' }
  return { label: 'Low', class: 'text-gray-400' }
})

function handleClick() {
  emit('click', props.task)
}

function handleComplete(e: Event) {
  e.stopPropagation()
  emit('complete', props.task)
}

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.task)
}
</script>

<template>
  <div
    data-testid="task-card"
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow touch-target"
    @click="handleClick"
  >
    <!-- Header: Name and Type -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <h3 class="font-medium text-gray-900 line-clamp-2 flex-1">
        {{ task.name }}
      </h3>
      <span
        :class="[typeBadgeClass, 'text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap']"
      >
        {{ typeLabel }}
      </span>
    </div>

    <!-- Urgency indicator for recurring tasks -->
    <div v-if="urgencyInfo" class="mb-2">
      <span :class="[urgencyInfo.class, 'text-xs px-2 py-1 rounded-full font-medium']">
        {{ urgencyInfo.text }}
      </span>
    </div>

    <!-- Meta info -->
    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
      <!-- Time -->
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ timeDisplay }}
      </span>

      <!-- Effort -->
      <span :class="[effortBadgeClass, 'text-xs px-2 py-0.5 rounded-full']">
        {{ task.effortLevel }}
      </span>

      <!-- Location -->
      <span class="flex items-center gap-1">
        <span>{{ locationIcon }}</span>
        <span class="capitalize">{{ task.location }}</span>
      </span>

      <!-- Priority indicator -->
      <span :class="[priorityDisplay.class, 'flex items-center gap-1']">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
        </svg>
        <span class="text-xs">{{ priorityDisplay.label }}</span>
      </span>
    </div>

    <!-- Deadline if set -->
    <div v-if="task.deadline" class="text-xs text-gray-500 mb-3">
      📅 Deadline: {{ new Date(task.deadline).toLocaleDateString() }}
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
      <button
        data-testid="task-complete-button"
        class="touch-target flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        @click="handleComplete"
      >
        ✓ Complete
      </button>
      <button
        data-testid="task-delete-button"
        class="touch-target px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        @click="handleDelete"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>
