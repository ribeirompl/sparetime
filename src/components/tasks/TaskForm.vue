<script setup lang="ts">
/**
 * TaskForm Component
 * T038, T042, T043, T044, T047
 *
 * Form for creating and editing tasks with all required fields:
 * - Name, type, time estimate, effort level, location, priority
 * - Recurring pattern fields (when type is 'recurring')
 * - Project session fields (when type is 'project')
 * - Optional dependency selection
 */

import { ref, computed, watch, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, TaskType, EffortLevel, Location, IntervalUnit, CreateTaskInput } from '@/types/task'
import { todayISO } from '@/utils/dateHelpers'

// Props
const props = defineProps<{
  task?: Task // If provided, we're editing
  onClose: () => void
  onSave?: (task: Task) => void
}>()

// Store
const taskStore = useTaskStore()

// Form state
const name = ref('')
const type = ref<TaskType>('one-off')
const timeEstimateMinutes = ref(30)
const effortLevel = ref<EffortLevel>('medium')
const location = ref<Location>('home')
const priority = ref(5)
const deadline = ref('')
const dependsOnId = ref<number | undefined>(undefined)

// Recurring pattern state
const recurringIntervalValue = ref(1)
const recurringIntervalUnit = ref<IntervalUnit>('days')
const recurringLastCompleted = ref(todayISO().split('T')[0]) // Date only

// Project session state
const minSessionDuration = ref(30)

// UI state
const isSubmitting = ref(false)
const errorMessage = ref('')

// Computed
const isEditing = computed(() => !!props.task)
const title = computed(() => (isEditing.value ? 'Edit Task' : 'Add Task'))
const submitText = computed(() => (isEditing.value ? 'Save Changes' : 'Add Task'))

const showRecurringFields = computed(() => type.value === 'recurring')
const showProjectFields = computed(() => type.value === 'project')
const showTimeEstimate = computed(() => type.value !== 'project') // Projects use session duration instead

// Available tasks for dependency dropdown (exclude current task)
const availableDependencies = computed(() => {
  return taskStore.activeTasks.filter((t) => t.id !== props.task?.id)
})

// Options
const typeOptions: { value: TaskType; label: string }[] = [
  { value: 'one-off', label: 'One-off' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'project', label: 'Project' }
]

const effortOptions: { value: EffortLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const locationOptions: { value: Location; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'outside', label: 'Outside' },
  { value: 'anywhere', label: 'Anywhere' }
]

const intervalUnitOptions: { value: IntervalUnit; label: string }[] = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' }
]

// Initialize form with task data if editing
onMounted(() => {
  if (props.task) {
    name.value = props.task.name
    type.value = props.task.type
    timeEstimateMinutes.value = props.task.timeEstimateMinutes
    effortLevel.value = props.task.effortLevel
    location.value = props.task.location
    priority.value = props.task.priority
    deadline.value = props.task.deadline?.split('T')[0] || ''
    dependsOnId.value = props.task.dependsOnId

    if (props.task.recurringPattern) {
      recurringIntervalValue.value = props.task.recurringPattern.intervalValue
      recurringIntervalUnit.value = props.task.recurringPattern.intervalUnit
      recurringLastCompleted.value = props.task.recurringPattern.lastCompletedDate.split('T')[0]
    }

    if (props.task.projectSession) {
      minSessionDuration.value = props.task.projectSession.minSessionDurationMinutes
    }
  }
})

// Reset recurring/project fields when type changes
watch(type, (newType) => {
  if (newType !== 'recurring') {
    recurringIntervalValue.value = 1
    recurringIntervalUnit.value = 'days'
  }
  if (newType !== 'project') {
    minSessionDuration.value = 30
  }
})

// Form submission
async function handleSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // For project tasks, use minSessionDuration as the time estimate
    // (since projects don't have a total time, but need a value for filtering)
    const effectiveTimeEstimate = type.value === 'project'
      ? minSessionDuration.value
      : timeEstimateMinutes.value

    const input: CreateTaskInput = {
      name: name.value.trim(),
      type: type.value,
      timeEstimateMinutes: effectiveTimeEstimate,
      effortLevel: effortLevel.value,
      location: location.value,
      priority: priority.value,
      deadline: deadline.value ? new Date(deadline.value) : undefined,
      dependsOnId: dependsOnId.value
    }

    // Add recurring pattern if type is recurring
    if (type.value === 'recurring') {
      input.recurringPattern = {
        intervalValue: recurringIntervalValue.value,
        intervalUnit: recurringIntervalUnit.value,
        lastCompletedDate: new Date(recurringLastCompleted.value).toISOString()
      }
    }

    // Add project session if type is project
    if (type.value === 'project') {
      input.projectSession = {
        minSessionDurationMinutes: minSessionDuration.value
      }
    }

    let result: Task | undefined

    if (isEditing.value && props.task?.id) {
      result = await taskStore.update({
        id: props.task.id,
        ...input
      })
    } else {
      result = await taskStore.create(input)
    }

    if (result) {
      props.onSave?.(result)
      props.onClose()
    } else {
      errorMessage.value = taskStore.error || 'Failed to save task'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  props.onClose()
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
    @click.self="handleCancel"
  >
    <div
      data-testid="task-form"
      class="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        <button
          type="button"
          class="touch-target p-2 -mr-2 text-gray-400 hover:text-gray-600"
          @click="handleCancel"
        >
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form class="p-4 space-y-4" @submit.prevent="handleSubmit">
        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- Task Name -->
        <div>
          <label for="task-name" class="block text-sm font-medium text-gray-700 mb-1">
            Task Name <span class="text-red-500">*</span>
          </label>
          <input
            id="task-name"
            v-model="name"
            data-testid="task-name-input"
            type="text"
            required
            maxlength="200"
            placeholder="What do you need to do?"
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <!-- Task Type -->
        <div>
          <label for="task-type" class="block text-sm font-medium text-gray-700 mb-1">
            Type <span class="text-red-500">*</span>
          </label>
          <select
            id="task-type"
            v-model="type"
            data-testid="task-type-select"
            required
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Recurring Pattern Fields -->
        <div v-if="showRecurringFields" class="p-3 bg-gray-50 rounded-lg space-y-3">
          <p class="text-sm font-medium text-gray-700">Recurring Pattern</p>

          <div class="flex gap-3">
            <div class="flex-1">
              <label for="recurring-interval" class="block text-xs text-gray-500 mb-1">Every</label>
              <input
                id="recurring-interval"
                v-model.number="recurringIntervalValue"
                data-testid="recurring-interval-input"
                type="number"
                min="1"
                max="999"
                required
                class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div class="flex-1">
              <label for="recurring-unit" class="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                id="recurring-unit"
                v-model="recurringIntervalUnit"
                data-testid="recurring-unit-select"
                required
                class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option v-for="opt in intervalUnitOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label for="last-completed" class="block text-xs text-gray-500 mb-1">Last Completed</label>
            <input
              id="last-completed"
              v-model="recurringLastCompleted"
              data-testid="recurring-last-completed-input"
              type="date"
              required
              class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <!-- Project Session Fields -->
        <div v-if="showProjectFields" class="p-3 bg-purple-50 rounded-lg space-y-2">
          <p class="text-sm font-medium text-purple-800">Project Session</p>
          <p class="text-xs text-purple-600">Projects are ongoing tasks. Set the minimum time needed for a productive work session.</p>
          <div>
            <label for="min-session" class="block text-sm font-medium text-gray-700 mb-1">
              Minimum Session Duration (minutes) <span class="text-red-500">*</span>
            </label>
            <input
              id="min-session"
              v-model.number="minSessionDuration"
              data-testid="project-min-session-input"
              type="number"
              min="1"
              max="480"
              required
              class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p class="text-xs text-gray-500 mt-1">This task will only be suggested when you have at least this much time available.</p>
          </div>
        </div>

        <!-- Time Estimate (not shown for project tasks) -->
        <div v-if="showTimeEstimate">
          <label for="time-estimate" class="block text-sm font-medium text-gray-700 mb-1">
            Time Estimate (minutes) <span class="text-red-500">*</span>
          </label>
          <input
            id="time-estimate"
            v-model.number="timeEstimateMinutes"
            data-testid="task-time-input"
            type="number"
            min="1"
            max="480"
            required
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p class="text-xs text-gray-500 mt-1">Between 1 and 480 minutes (8 hours)</p>
        </div>

        <!-- Effort Level -->
        <div>
          <label for="effort-level" class="block text-sm font-medium text-gray-700 mb-1">
            Effort Level <span class="text-red-500">*</span>
          </label>
          <select
            id="effort-level"
            v-model="effortLevel"
            data-testid="task-effort-select"
            required
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="opt in effortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
            Location <span class="text-red-500">*</span>
          </label>
          <select
            id="location"
            v-model="location"
            data-testid="task-location-select"
            required
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="opt in locationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
            Priority ({{ priority }})
          </label>
          <input
            id="priority"
            v-model.number="priority"
            data-testid="task-priority-input"
            type="range"
            min="0"
            max="10"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <!-- Deadline (optional) -->
        <div>
          <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">
            Deadline (optional)
          </label>
          <input
            id="deadline"
            v-model="deadline"
            data-testid="task-deadline-input"
            type="date"
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Dependency (optional) -->
        <div v-if="availableDependencies.length > 0">
          <label for="depends-on" class="block text-sm font-medium text-gray-700 mb-1">
            Depends On (optional)
          </label>
          <select
            id="depends-on"
            v-model="dependsOnId"
            data-testid="task-depends-on-select"
            class="touch-target w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option :value="undefined">None</option>
            <option v-for="t in availableDependencies" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">This task won't be suggested until the dependency is complete</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            class="touch-target flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            @click="handleCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="task-submit-button"
            :disabled="isSubmitting"
            class="touch-target flex-1 px-4 py-3 btn-primary rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'Saving...' : submitText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
