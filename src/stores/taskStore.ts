/**
 * Task Store - Pinia state management for tasks
 * Per plan.md - handles task CRUD operations with IndexedDB persistence
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db/database'
import type { Task, TaskStatus, TaskType, CreateTaskInput, UpdateTaskInput } from '@/types/task'
import { validateTask, detectCircularDependency } from '@/utils/validation'
import { calculateNextDueDateFromPattern, nowISO } from '@/utils/dateHelpers'

/**
 * Task store for managing task state and operations
 */
export const useTaskStore = defineStore('task', () => {
  // State
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeTasks = computed(() => tasks.value.filter((t) => t.status === 'active'))

  const completedTasks = computed(() => tasks.value.filter((t) => t.status === 'completed'))

  const archivedTasks = computed(() => tasks.value.filter((t) => t.status === 'archived'))

  const tasksByType = computed(() => (type: TaskType) => tasks.value.filter((t) => t.type === type))

  const taskById = computed(() => (id: number) => tasks.value.find((t) => t.id === id))

  const taskCount = computed(() => tasks.value.length)

  const activeTaskCount = computed(() => activeTasks.value.length)

  // Actions

  /**
   * Load all tasks from IndexedDB
   */
  async function loadTasks(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      tasks.value = await db.tasks.toArray()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load tasks'
      console.error('Failed to load tasks:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new task
   *
   * @param input - Task creation input
   * @returns Created task or undefined if validation fails
   */
  async function create(input: CreateTaskInput): Promise<Task | undefined> {
    loading.value = true
    error.value = null

    try {
      // Validate input
      const validation = validateTask(input)
      if (!validation.valid) {
        error.value = validation.errors.join(', ')
        return undefined
      }

      // Check for circular dependency
      if (input.dependsOnId !== undefined) {
        if (detectCircularDependency(undefined, input.dependsOnId, tasks.value)) {
          error.value = 'Circular dependency detected'
          return undefined
        }
      }

      // Build the task object
      const now = nowISO()
      const task: Task = {
        name: input.name,
        type: input.type,
        timeEstimateMinutes: input.timeEstimateMinutes,
        effortLevel: input.effortLevel,
        location: input.location,
        status: 'active',
        priority: input.priority,
        deadline: input.deadline?.toISOString(),
        dependsOnId: input.dependsOnId,
        createdAt: now,
        updatedAt: now
      }

      // Add recurring pattern with computed nextDueDate
      if (input.recurringPattern) {
        task.recurringPattern = {
          ...input.recurringPattern,
          nextDueDate: calculateNextDueDateFromPattern(input.recurringPattern)
        }
      }

      // Add project session if provided
      if (input.projectSession) {
        task.projectSession = input.projectSession
      }

      // Save to IndexedDB
      const id = await db.tasks.add(task)
      task.id = id

      // Update local state
      tasks.value.push(task)

      return task
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create task'
      console.error('Failed to create task:', e)
      return undefined
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing task
   *
   * @param input - Task update input (id required, other fields optional)
   * @returns Updated task or undefined if not found/validation fails
   */
  async function update(input: UpdateTaskInput): Promise<Task | undefined> {
    loading.value = true
    error.value = null

    try {
      const existingTask = tasks.value.find((t) => t.id === input.id)
      if (!existingTask) {
        error.value = 'Task not found'
        return undefined
      }

      // Check for circular dependency if dependsOnId is being changed
      if (input.dependsOnId !== undefined && input.dependsOnId !== existingTask.dependsOnId) {
        if (detectCircularDependency(input.id, input.dependsOnId, tasks.value)) {
          error.value = 'Circular dependency detected'
          return undefined
        }
      }

      // Build update object
      const updates: Partial<Task> = {
        updatedAt: nowISO()
      }

      if (input.name !== undefined) updates.name = input.name
      if (input.type !== undefined) updates.type = input.type
      if (input.timeEstimateMinutes !== undefined)
        updates.timeEstimateMinutes = input.timeEstimateMinutes
      if (input.effortLevel !== undefined) updates.effortLevel = input.effortLevel
      if (input.location !== undefined) updates.location = input.location
      if (input.priority !== undefined) updates.priority = input.priority
      if (input.dependsOnId !== undefined) updates.dependsOnId = input.dependsOnId

      // Handle deadline - can be Date, string, or undefined
      if (input.deadline !== undefined) {
        updates.deadline =
          input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline
      }

      // Handle recurring pattern update
      if (input.recurringPattern !== undefined) {
        updates.recurringPattern = {
          ...input.recurringPattern,
          nextDueDate: calculateNextDueDateFromPattern(input.recurringPattern)
        }
      }

      // Handle project session update
      if (input.projectSession !== undefined) {
        updates.projectSession = input.projectSession
      }

      // Update in IndexedDB
      await db.tasks.update(input.id, updates)

      // Update local state
      const index = tasks.value.findIndex((t) => t.id === input.id)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], ...updates }
        return tasks.value[index]
      }

      return undefined
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update task'
      console.error('Failed to update task:', e)
      return undefined
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a task
   *
   * @param id - Task ID to delete
   * @returns true if deleted, false otherwise
   */
  async function remove(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await db.tasks.delete(id)

      // Update local state
      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.value.splice(index, 1)
        return true
      }

      return false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete task'
      console.error('Failed to delete task:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Mark a task as complete
   * For recurring tasks, this updates lastCompletedDate and calculates next due date
   *
   * @param id - Task ID to complete
   * @returns Updated task or undefined if not found
   */
  async function complete(id: number): Promise<Task | undefined> {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) {
      error.value = 'Task not found'
      return undefined
    }

    const now = nowISO()

    if (task.type === 'recurring' && task.recurringPattern) {
      // For recurring tasks: reset with new due date calculated from completion time
      const updatedPattern = {
        ...task.recurringPattern,
        lastCompletedDate: now,
        nextDueDate: calculateNextDueDateFromPattern({
          ...task.recurringPattern,
          lastCompletedDate: now
        })
      }

      return update({
        id,
        recurringPattern: {
          intervalValue: updatedPattern.intervalValue,
          intervalUnit: updatedPattern.intervalUnit,
          lastCompletedDate: updatedPattern.lastCompletedDate
        }
      })
    } else {
      // For one-off and project tasks: mark as completed
      return updateStatus(id, 'completed')
    }
  }

  /**
   * Update task status
   *
   * @param id - Task ID
   * @param status - New status
   * @returns Updated task or undefined if not found
   */
  async function updateStatus(id: number, status: TaskStatus): Promise<Task | undefined> {
    loading.value = true
    error.value = null

    try {
      const now = nowISO()

      await db.tasks.update(id, { status, updatedAt: now })

      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.value[index] = { ...tasks.value[index], status, updatedAt: now }
        return tasks.value[index]
      }

      return undefined
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update task status'
      console.error('Failed to update task status:', e)
      return undefined
    } finally {
      loading.value = false
    }
  }

  /**
   * Get task by ID (async version that checks IndexedDB)
   *
   * @param id - Task ID
   * @returns Task or undefined if not found
   */
  async function getById(id: number): Promise<Task | undefined> {
    // First check local state
    const cached = tasks.value.find((t) => t.id === id)
    if (cached) return cached

    // Fall back to IndexedDB
    try {
      return await db.tasks.get(id)
    } catch (e) {
      console.error('Failed to get task by ID:', e)
      return undefined
    }
  }

  /**
   * Check if a task has incomplete dependencies
   *
   * @param taskId - Task ID to check
   * @returns true if task has incomplete dependencies
   */
  function hasIncompleteDependencies(taskId: number): boolean {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task || !task.dependsOnId) return false

    const dependency = tasks.value.find((t) => t.id === task.dependsOnId)
    if (!dependency) return false

    return dependency.status !== 'completed'
  }

  return {
    // State
    tasks,
    loading,
    error,

    // Getters
    activeTasks,
    completedTasks,
    archivedTasks,
    tasksByType,
    taskById,
    taskCount,
    activeTaskCount,

    // Actions
    loadTasks,
    create,
    update,
    remove,
    complete,
    updateStatus,
    getById,
    hasIncompleteDependencies
  }
})
