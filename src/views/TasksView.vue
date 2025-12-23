<script setup lang="ts">
/**
 * TasksView
 * T041, T042, T043, T044, T045, T047
 *
 * Main view for User Story 1: Task CRUD with offline persistence
 */

import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import { TaskList, TaskForm } from '@/components/tasks'
import type { Task, TaskType, TaskStatus } from '@/types/task'

const taskStore = useTaskStore()
const { tasks, loading, error } = storeToRefs(taskStore)

// UI state
const showForm = ref(false)
const editingTask = ref<Task | null>(null)
const filterType = ref<TaskType | 'all'>('all')
const filterStatus = ref<TaskStatus | 'all'>('active')

// Lifecycle
onMounted(async () => {
  await taskStore.loadTasks()
})

// Actions
function openAddForm() {
  editingTask.value = null
  showForm.value = true
}

function openEditForm(task: Task) {
  editingTask.value = task
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTask.value = null
}

function handleSave(_task: Task) {
  // Form already handles save via store, just close
  closeForm()
}

async function handleComplete(task: Task) {
  await taskStore.complete(task.id!)
}

async function handleDelete(task: Task) {
  if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
    await taskStore.remove(task.id!)
  }
}

function setTypeFilter(type: TaskType | 'all') {
  filterType.value = type
}
</script>

<template>
  <div data-testid="tasks-view" class="pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">My Tasks</h2>
      <button
        data-testid="add-task-button"
        class="touch-target btn-primary flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 font-medium shadow-md"
        @click="openAddForm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Task</span>
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
      <button
        v-for="type in (['all', 'one-off', 'recurring', 'project'] as const)"
        :key="type"
        class="touch-target filter-pill px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap"
        :class="filterType === type ? 'filter-pill-active' : 'filter-pill-inactive'"
        @click="setTypeFilter(type)"
      >
        {{ type === 'all' ? 'All' : type === 'one-off' ? 'One-Off' : type === 'recurring' ? 'Recurring' : 'Projects' }}
      </button>
    </div>

    <!-- Error display -->
    <div
      v-if="error"
      class="mb-4 rounded-lg bg-red-50 p-4 text-red-700"
    >
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Task list -->
    <TaskList
      v-else
      :tasks="tasks"
      :filter-type="filterType"
      :filter-status="filterStatus"
      empty-message="No tasks yet. Add your first task to get started!"
      @task-click="openEditForm"
      @task-complete="handleComplete"
      @task-delete="handleDelete"
    />

    <!-- Task Form Modal -->
    <TaskForm
      v-if="showForm"
      :task="editingTask ?? undefined"
      :on-close="closeForm"
      :on-save="handleSave"
    />
  </div>
</template>
