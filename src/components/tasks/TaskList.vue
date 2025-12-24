<script setup lang="ts">
/**
 * TaskList Component
 * T040, T048
 *
 * Renders a list of TaskCard components with:
 * - Empty state when no tasks
 * - Filtered view options
 */

import { computed } from 'vue'
import type { Task, TaskType, TaskStatus } from '@/types/task'
import TaskCard from './TaskCard.vue'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    filterType?: TaskType | 'all'
    filterStatus?: TaskStatus | 'all'
    emptyMessage?: string
  }>(),
  {
    filterType: 'all',
    filterStatus: 'all',
    emptyMessage: 'No tasks found'
  }
)

const emit = defineEmits<{
  taskClick: [task: Task]
  taskComplete: [task: Task]
  taskDelete: [task: Task]
}>()

// Filter tasks based on props
const filteredTasks = computed(() => {
  let result = props.tasks

  // Always exclude soft-deleted tasks
  result = result.filter((t) => !t.deletedAt)

  if (props.filterType !== 'all') {
    result = result.filter((t) => t.type === props.filterType)
  }

  if (props.filterStatus !== 'all') {
    result = result.filter((t) => t.status === props.filterStatus)
  }

  return result
})

const isEmpty = computed(() => filteredTasks.value.length === 0)

function handleTaskClick(task: Task) {
  emit('taskClick', task)
}

function handleTaskComplete(task: Task) {
  emit('taskComplete', task)
}

function handleTaskDelete(task: Task) {
  emit('taskDelete', task)
}
</script>

<template>
  <div data-testid="task-list" class="space-y-3">
    <!-- Task cards -->
    <template v-if="!isEmpty">
      <TaskCard
        v-for="task in filteredTasks"
        :key="task.id"
        :task="task"
        @click="handleTaskClick"
        @complete="handleTaskComplete"
        @delete="handleTaskDelete"
      />
    </template>

    <!-- Empty state -->
    <div
      v-else
      class="rounded-lg bg-white p-8 text-center shadow-sm border border-gray-200"
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">{{ emptyMessage }}</h3>
      <p class="mt-2 text-gray-500">Get started by adding your first task.</p>
    </div>
  </div>
</template>
