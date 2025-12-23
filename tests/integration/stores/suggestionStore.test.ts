/**
 * Integration tests for suggestionStore with IndexedDB
 * T049e-i: Tests for suggestion generation, filtering, dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSuggestionStore } from '@/stores/suggestionStore'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db/database'
import type { CreateTaskInput } from '@/types/task'
import type { SuggestionContext } from '@/types/suggestion'

describe('suggestionStore integration with IndexedDB', () => {
  beforeEach(async () => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Clear the database before each test
    await db.tasks.clear()
    await db.suggestionSessions.clear()
  })

  afterEach(async () => {
    // Clean up after each test
    await db.tasks.clear()
    await db.suggestionSessions.clear()
  })

  // Helper to create valid task input
  const createValidInput = (overrides: Partial<CreateTaskInput> = {}): CreateTaskInput => ({
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    priority: 5,
    ...overrides
  })

  // Helper to create test context
  const createContext = (overrides: Partial<SuggestionContext> = {}): SuggestionContext => ({
    availableTimeMinutes: 60,
    ...overrides
  })

  describe('T049e: suggestionStore filters tasks exceeding available time', () => {
    it('should filter out tasks that take longer than available time', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create tasks with different time estimates
      await taskStore.create(createValidInput({ name: 'Short Task', timeEstimateMinutes: 15 }))
      await taskStore.create(createValidInput({ name: 'Medium Task', timeEstimateMinutes: 30 }))
      await taskStore.create(createValidInput({ name: 'Long Task', timeEstimateMinutes: 60 }))
      await taskStore.create(createValidInput({ name: 'Too Long Task', timeEstimateMinutes: 90 }))

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      // Should only include tasks that fit in 60 minutes
      expect(result.suggestions.every((s) => s.task.timeEstimateMinutes <= 60)).toBe(true)
      expect(result.suggestions.some((s) => s.task.name === 'Short Task')).toBe(true)
      expect(result.suggestions.some((s) => s.task.name === 'Medium Task')).toBe(true)
      expect(result.suggestions.some((s) => s.task.name === 'Long Task')).toBe(true)
      expect(result.suggestions.some((s) => s.task.name === 'Too Long Task')).toBe(false)
    })

    it('should return empty suggestions when no tasks fit the time', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create only long tasks
      await taskStore.create(createValidInput({ name: 'Long Task 1', timeEstimateMinutes: 120 }))
      await taskStore.create(createValidInput({ name: 'Long Task 2', timeEstimateMinutes: 180 }))

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 30 })
      )

      expect(result.suggestions).toHaveLength(0)
      expect(result.message).toContain('No tasks fit')
    })

    it('should include task exactly matching available time', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      await taskStore.create(createValidInput({ name: 'Exact Match', timeEstimateMinutes: 45 }))

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 45 })
      )

      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].task.name).toBe('Exact Match')
    })
  })

  describe('T049f: suggestionStore excludes tasks with incomplete dependencies', () => {
    it('should exclude task depending on incomplete task', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create parent task (not completed)
      const parentTask = await taskStore.create(
        createValidInput({ name: 'Parent Task', timeEstimateMinutes: 30 })
      )

      // Create child task that depends on parent
      await taskStore.create(
        createValidInput({
          name: 'Child Task',
          timeEstimateMinutes: 30,
          dependsOnId: parentTask!.id
        })
      )

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      // Only parent task should be in suggestions
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].task.name).toBe('Parent Task')
    })

    it('should include task with completed dependency', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create and complete parent task
      const parentTask = await taskStore.create(
        createValidInput({ name: 'Parent Task', timeEstimateMinutes: 30 })
      )
      await taskStore.complete(parentTask!.id!)

      // Create child task that depends on parent
      await taskStore.create(
        createValidInput({
          name: 'Child Task',
          timeEstimateMinutes: 30,
          dependsOnId: parentTask!.id
        })
      )

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      // Child task should now be available
      expect(result.suggestions.some((s) => s.task.name === 'Child Task')).toBe(true)
    })

    it('should include task with no dependencies', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      await taskStore.create(
        createValidInput({ name: 'Independent Task', timeEstimateMinutes: 30 })
      )

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].task.name).toBe('Independent Task')
    })
  })

  describe('T049g: suggestionStore returns max 5 suggestions sorted by score', () => {
    it('should return at most 5 suggestions', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create 10 tasks
      for (let i = 1; i <= 10; i++) {
        await taskStore.create(
          createValidInput({
            name: `Task ${i}`,
            timeEstimateMinutes: 30,
            priority: i // Different priorities
          })
        )
      }

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      expect(result.suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should sort suggestions by score (descending)', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create tasks with different priorities
      await taskStore.create(
        createValidInput({ name: 'Low Priority', timeEstimateMinutes: 30, priority: 1 })
      )
      await taskStore.create(
        createValidInput({ name: 'High Priority', timeEstimateMinutes: 30, priority: 10 })
      )
      await taskStore.create(
        createValidInput({ name: 'Medium Priority', timeEstimateMinutes: 30, priority: 5 })
      )

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      // Scores should be in descending order
      for (let i = 1; i < result.suggestions.length; i++) {
        expect(result.suggestions[i - 1].score).toBeGreaterThanOrEqual(result.suggestions[i].score)
      }
    })

    it('should include totalActiveCount and filteredCount in result', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create mix of tasks
      await taskStore.create(createValidInput({ name: 'Task 1', timeEstimateMinutes: 30 }))
      await taskStore.create(createValidInput({ name: 'Task 2', timeEstimateMinutes: 60 }))
      await taskStore.create(createValidInput({ name: 'Task 3', timeEstimateMinutes: 90 })) // Won't fit

      const result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )

      expect(result.totalActiveCount).toBe(3)
      expect(result.filteredCount).toBe(2) // Only 2 fit in 60 minutes
    })
  })

  describe('T049h: completing task A makes dependent task B available', () => {
    it('should make blocked task available after completing dependency', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create dependency chain: A -> B
      const taskA = await taskStore.create(
        createValidInput({ name: 'Task A', timeEstimateMinutes: 30 })
      )
      await taskStore.create(
        createValidInput({
          name: 'Task B',
          timeEstimateMinutes: 30,
          dependsOnId: taskA!.id
        })
      )

      // Before completing A, only A is available
      let result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )
      expect(result.suggestions.map((s) => s.task.name)).toContain('Task A')
      expect(result.suggestions.map((s) => s.task.name)).not.toContain('Task B')

      // Complete Task A
      await taskStore.complete(taskA!.id!)

      // After completing A, B should be available
      result = await suggestionStore.generateSuggestions(createContext({ availableTimeMinutes: 60 }))
      expect(result.suggestions.map((s) => s.task.name)).toContain('Task B')
    })

    it('should handle multi-level dependency chains', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      // Create chain: A -> B -> C
      const taskA = await taskStore.create(
        createValidInput({ name: 'Task A', timeEstimateMinutes: 30 })
      )
      const taskB = await taskStore.create(
        createValidInput({
          name: 'Task B',
          timeEstimateMinutes: 30,
          dependsOnId: taskA!.id
        })
      )
      await taskStore.create(
        createValidInput({
          name: 'Task C',
          timeEstimateMinutes: 30,
          dependsOnId: taskB!.id
        })
      )

      // Complete A
      await taskStore.complete(taskA!.id!)

      let result = await suggestionStore.generateSuggestions(
        createContext({ availableTimeMinutes: 60 })
      )
      // B should be available, C still blocked
      expect(result.suggestions.map((s) => s.task.name)).toContain('Task B')
      expect(result.suggestions.map((s) => s.task.name)).not.toContain('Task C')

      // Complete B
      await taskStore.complete(taskB!.id!)

      result = await suggestionStore.generateSuggestions(createContext({ availableTimeMinutes: 60 }))
      // Now C should be available
      expect(result.suggestions.map((s) => s.task.name)).toContain('Task C')
    })
  })

  describe('Suggestion Session Storage', () => {
    it('should save suggestion session to IndexedDB', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      await taskStore.create(createValidInput({ name: 'Test Task' }))
      await suggestionStore.generateSuggestions(createContext({ availableTimeMinutes: 60 }))

      const sessions = await db.suggestionSessions.toArray()
      expect(sessions.length).toBe(1)
      expect(sessions[0].availableTimeMinutes).toBe(60)
    })

    it('should save context filters in session', async () => {
      const taskStore = useTaskStore()
      const suggestionStore = useSuggestionStore()

      await taskStore.create(createValidInput({ name: 'Test Task', effortLevel: 'low' }))
      await suggestionStore.generateSuggestions(
        createContext({
          availableTimeMinutes: 60,
          contextFilters: { effortLevel: 'low' }
        })
      )

      const sessions = await db.suggestionSessions.toArray()
      expect(sessions[0].contextFilters).toEqual({ effortLevel: 'low' })
    })
  })
})

describe('T049i: completing recurring task resets urgency and calculates new nextDueDate', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.tasks.clear()
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  const createValidInput = (overrides: Partial<CreateTaskInput> = {}): CreateTaskInput => ({
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    priority: 5,
    ...overrides
  })

  it('should calculate new nextDueDate from completion time', async () => {
    const taskStore = useTaskStore()

    // Create recurring task with old lastCompletedDate
    const task = await taskStore.create(
      createValidInput({
        name: 'Water Plants',
        type: 'recurring',
        recurringPattern: {
          intervalValue: 3,
          intervalUnit: 'days',
          lastCompletedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
        }
      })
    )

    // Complete the task
    await taskStore.complete(task!.id!)

    const updated = taskStore.tasks.find((t) => t.id === task!.id)

    // lastCompletedDate should be updated to now (within recent time)
    const lastCompletedDate = new Date(updated!.recurringPattern!.lastCompletedDate)
    const now = new Date()
    expect(now.getTime() - lastCompletedDate.getTime()).toBeLessThan(60000) // Within 1 minute

    // nextDueDate should be 3 days from completion time
    const nextDueDate = new Date(updated!.recurringPattern!.nextDueDate)
    const expectedNextDue = new Date(lastCompletedDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    expect(Math.abs(nextDueDate.getTime() - expectedNextDue.getTime())).toBeLessThan(60000)
  })

  it('should keep recurring task as active after completion', async () => {
    const taskStore = useTaskStore()

    const task = await taskStore.create(
      createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    )

    await taskStore.complete(task!.id!)

    const updated = taskStore.tasks.find((t) => t.id === task!.id)
    expect(updated!.status).toBe('active')
  })

  it('should reset urgency to negative (future) after completion', async () => {
    const taskStore = useTaskStore()
    const suggestionStore = useSuggestionStore()

    // Create overdue task (12 days ago lastCompleted with 7 day interval = 5 days overdue)
    const task = await taskStore.create(
      createValidInput({
        name: 'Overdue Task',
        type: 'recurring',
        timeEstimateMinutes: 30,
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    )

    // Get initial urgency
    let result = await suggestionStore.generateSuggestions({ availableTimeMinutes: 60 })
    const initialUrgency = result.suggestions.find((s) => s.taskId === task!.id)?.urgency
    expect(initialUrgency).toBeGreaterThan(0) // Overdue = positive urgency

    // Complete the task
    await taskStore.complete(task!.id!)

    // Get urgency after completion
    result = await suggestionStore.generateSuggestions({ availableTimeMinutes: 60 })
    const newUrgency = result.suggestions.find((s) => s.taskId === task!.id)?.urgency

    // Should now be negative (due in future)
    expect(newUrgency).toBeLessThan(0)
  })
})
