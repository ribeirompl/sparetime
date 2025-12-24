/**
 * Integration tests for task type changes
 * Tests for proper cleanup of type-specific metadata
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db/database'
import type { CreateTaskInput } from '@/types/task'

describe('TaskStore - Type Changes', () => {
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
    priority: 'important',
    ...overrides
  })

  describe('Recurring to one-off conversion', () => {
    it('should clear recurring pattern when changing to one-off', async () => {
      const store = useTaskStore()

      // Create recurring task
      const recurringInput = createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: new Date().toISOString()
        }
      })

      const task = await store.create(recurringInput)
      expect(task).toBeDefined()
      expect(task!.type).toBe('recurring')
      expect(task!.recurringPattern).toBeDefined()

      // Change to one-off
      const updated = await store.update({
        id: task!.id,
        type: 'one-off'
      })

      expect(updated).toBeDefined()
      expect(updated!.type).toBe('one-off')
      expect(updated!.recurringPattern).toBeUndefined()

      // Verify in database
      const dbTask = await db.tasks.get(task!.id)
      expect(dbTask?.type).toBe('one-off')
      expect(dbTask?.recurringPattern).toBeUndefined()
    })

    it('should not throw proxy clone error when updating task', async () => {
      const store = useTaskStore()

      // Create recurring task
      const recurringInput = createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'days',
          lastCompletedDate: new Date().toISOString()
        }
      })

      const task = await store.create(recurringInput)

      // This should not throw "Proxy object could not be cloned" error
      await expect(store.update({
        id: task!.id,
        type: 'one-off'
      })).resolves.toBeDefined()
    })
  })

  describe('Project to one-off conversion', () => {
    it('should clear project session when changing to one-off', async () => {
      const store = useTaskStore()

      // Create project task
      const projectInput = createValidInput({
        type: 'project',
        projectSession: {
          minSessionDurationMinutes: 60
        }
      })

      const task = await store.create(projectInput)
      expect(task).toBeDefined()
      expect(task!.type).toBe('project')
      expect(task!.projectSession).toBeDefined()

      // Change to one-off
      const updated = await store.update({
        id: task!.id,
        type: 'one-off'
      })

      expect(updated).toBeDefined()
      expect(updated!.type).toBe('one-off')
      expect(updated!.projectSession).toBeUndefined()

      // Verify in database
      const dbTask = await db.tasks.get(task!.id)
      expect(dbTask?.type).toBe('one-off')
      expect(dbTask?.projectSession).toBeUndefined()
    })
  })

  describe('One-off to recurring conversion', () => {
    it('should add recurring pattern when changing to recurring', async () => {
      const store = useTaskStore()

      // Create one-off task
      const task = await store.create(createValidInput({
        type: 'one-off'
      }))

      expect(task!.type).toBe('one-off')
      expect(task!.recurringPattern).toBeUndefined()

      // Change to recurring with pattern
      const updated = await store.update({
        id: task!.id,
        type: 'recurring',
        recurringPattern: {
          intervalValue: 3,
          intervalUnit: 'weeks',
          lastCompletedDate: new Date().toISOString()
        }
      })

      expect(updated).toBeDefined()
      expect(updated!.type).toBe('recurring')
      expect(updated!.recurringPattern).toBeDefined()
      expect(updated!.recurringPattern!.intervalValue).toBe(3)
      expect(updated!.recurringPattern!.intervalUnit).toBe('weeks')
      expect(updated!.recurringPattern!.nextDueDate).toBeDefined()
    })
  })

  describe('Project to recurring conversion', () => {
    it('should clear project session and add recurring pattern', async () => {
      const store = useTaskStore()

      // Create project task
      const projectInput = createValidInput({
        type: 'project',
        projectSession: {
          minSessionDurationMinutes: 45
        }
      })

      const task = await store.create(projectInput)
      expect(task!.projectSession).toBeDefined()

      // Change to recurring
      const updated = await store.update({
        id: task!.id,
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'months',
          lastCompletedDate: new Date().toISOString()
        }
      })

      expect(updated).toBeDefined()
      expect(updated!.type).toBe('recurring')
      expect(updated!.projectSession).toBeUndefined()
      expect(updated!.recurringPattern).toBeDefined()

      // Verify in database
      const dbTask = await db.tasks.get(task!.id)
      expect(dbTask?.projectSession).toBeUndefined()
      expect(dbTask?.recurringPattern).toBeDefined()
    })
  })

  describe('Updating recurring pattern', () => {
    it('should not throw error when updating recurring pattern', async () => {
      const store = useTaskStore()

      // Create recurring task
      const task = await store.create(createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'days',
          lastCompletedDate: new Date().toISOString()
        }
      }))

      // Update pattern - should not throw proxy error
      await expect(store.update({
        id: task!.id,
        recurringPattern: {
          intervalValue: 2,
          intervalUnit: 'weeks',
          lastCompletedDate: new Date().toISOString()
        }
      })).resolves.toBeDefined()

      const updated = await db.tasks.get(task!.id)
      expect(updated?.recurringPattern?.intervalValue).toBe(2)
      expect(updated?.recurringPattern?.intervalUnit).toBe('weeks')
    })
  })

  describe('Updating project session', () => {
    it('should not throw error when updating project session', async () => {
      const store = useTaskStore()

      // Create project task
      const task = await store.create(createValidInput({
        type: 'project',
        projectSession: {
          minSessionDurationMinutes: 30
        }
      }))

      // Update session - should not throw proxy error
      await expect(store.update({
        id: task!.id,
        projectSession: {
          minSessionDurationMinutes: 90
        }
      })).resolves.toBeDefined()

      const updated = await db.tasks.get(task!.id)
      expect(updated?.projectSession?.minSessionDurationMinutes).toBe(90)
    })
  })
})
