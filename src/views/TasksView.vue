<script setup lang="ts">
/**
 * TasksView
 * T041, T042, T043, T044, T045, T047
 *
 * Main view for User Story 1: Task CRUD with offline persistence
 */

import { ref, onMounted } from 'vue'
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
  <div data-testid="tasks-view" class="flex flex-col">
    <!-- Header Section -->
    <div class="pb-3 mx-2">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-bold text-gray-900">My Tasks</h2>
        <button
          data-testid="add-task-button"
          class="touch-target btn-primary flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm cursor-pointer"
          @click="openAddForm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Task</span>
        </button>
      </div>

      <!-- Filter tabs with subtle background -->
      <div class="flex items-center gap-1.5 overflow-x-auto bg-gray-100 rounded-lg p-1">
        <button
          class="touch-target filter-pill px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
          :class="filterType === 'all' ? 'filter-pill-active' : 'filter-pill-inactive bg-transparent hover:bg-gray-200'"
          @click="setTypeFilter('all')"
        >
          All
        </button>
        <!-- Vertical divider -->
        <div class="w-px h-6 bg-gray-300"></div>
        <button
          v-for="type in (['one-off', 'recurring', 'project'] as const)"
          :key="type"
          class="touch-target filter-pill px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
          :class="filterType === type ? 'filter-pill-active' : 'filter-pill-inactive bg-transparent hover:bg-gray-200'"
          @click="setTypeFilter(type)"
        >
          {{ type === 'one-off' ? 'One-Off' : type === 'recurring' ? 'Recurring' : 'Projects' }}
        </button>
      </div>
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
    <div class="pt-2">
      <TaskList
        v-if="!loading"
        :tasks="tasks"
        :filter-type="filterType"
        :filter-status="filterStatus"
        empty-message="No tasks yet. Add your first task to get started!"
        @task-click="openEditForm"
        @task-complete="handleComplete"
        @task-delete="handleDelete"
      />
    </div>

    <!-- Task Form Modal -->
    <TaskForm
      v-if="showForm"
      :task="editingTask ?? undefined"
      :on-close="closeForm"
      :on-save="handleSave"
    />
  </div>
</template>
