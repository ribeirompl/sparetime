/**
 * Integration tests for taskStore with IndexedDB
 * T032e, T032f, T032g, T032h
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db/database'
import type { CreateTaskInput } from '@/types/task'

describe('taskStore integration with IndexedDB', () => {
  beforeEach(async () => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())

    // Clear the database before each test
    await db.tasks.clear()
  })

  afterEach(async () => {
    // Clean up after each test
    await db.tasks.clear()
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

  describe('T032e: taskStore.create persists task to IndexedDB', () => {
    it('creates task and persists to IndexedDB', async () => {
      const store = useTaskStore()
      const input = createValidInput({ name: 'Persisted Task' })

      const task = await store.create(input)

      expect(task).toBeDefined()
      expect(task!.id).toBeDefined()
      expect(task!.name).toBe('Persisted Task')

      // Verify task is in IndexedDB
      const dbTask = await db.tasks.get(task!.id!)
      expect(dbTask).toBeDefined()
      expect(dbTask!.name).toBe('Persisted Task')
    })

    it('assigns createdAt and updatedAt timestamps', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())

      expect(task!.createdAt).toBeDefined()
      expect(task!.updatedAt).toBeDefined()
      expect(typeof task!.createdAt).toBe('string')
    })

    it('sets status to active by default', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())

      expect(task!.status).toBe('active')
    })

    it('updates local state after create', async () => {
      const store = useTaskStore()
      expect(store.tasks).toHaveLength(0)

      await store.create(createValidInput())

      expect(store.tasks).toHaveLength(1)
    })

    it('rejects invalid input and does not persist', async () => {
      const store = useTaskStore()
      const invalidInput = createValidInput({ timeEstimateMinutes: 0 })

      const task = await store.create(invalidInput)

      expect(task).toBeUndefined()
      expect(store.error).toBeDefined()

      // Verify nothing was saved to IndexedDB
      const count = await db.tasks.count()
      expect(count).toBe(0)
    })
  })

  describe('T032f: taskStore.update modifies existing task in IndexedDB', () => {
    it('updates task and persists changes to IndexedDB', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput({ name: 'Original Name' }))

      const updated = await store.update({ id: task!.id!, name: 'Updated Name' })

      expect(updated).toBeDefined()
      expect(updated!.name).toBe('Updated Name')

      // Verify update persisted to IndexedDB
      const dbTask = await db.tasks.get(task!.id!)
      expect(dbTask!.name).toBe('Updated Name')
    })

    it('updates updatedAt timestamp on update', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())
      const originalUpdatedAt = task!.updatedAt

      // Wait to ensure different timestamp (formatISO has second precision)
      await new Promise((r) => setTimeout(r, 1100))

      const updated = await store.update({ id: task!.id!, name: 'New Name' })

      expect(updated!.updatedAt).not.toBe(originalUpdatedAt)
    })

    it('updates multiple fields at once', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())

      const updated = await store.update({
        id: task!.id!,
        name: 'New Name',
        priority: 10,
        effortLevel: 'high',
        location: 'outside'
      })

      expect(updated!.name).toBe('New Name')
      expect(updated!.priority).toBe(10)
      expect(updated!.effortLevel).toBe('high')
      expect(updated!.location).toBe('outside')
    })

    it('returns undefined for non-existent task', async () => {
      const store = useTaskStore()

      const updated = await store.update({ id: 99999, name: 'Ghost' })

      expect(updated).toBeUndefined()
      expect(store.error).toBe('Task not found')
    })

    it('updates local state after update', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput({ name: 'Original' }))

      await store.update({ id: task!.id!, name: 'Updated' })

      const localTask = store.tasks.find((t) => t.id === task!.id)
      expect(localTask!.name).toBe('Updated')
    })
  })

  describe('T032g: taskStore.delete removes task from IndexedDB', () => {
    it('deletes task from IndexedDB', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())

      const result = await store.remove(task!.id!)

      expect(result).toBe(true)

      // Verify task is removed from IndexedDB
      const dbTask = await db.tasks.get(task!.id!)
      expect(dbTask).toBeUndefined()
    })

    it('removes task from local state', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput())
      expect(store.tasks).toHaveLength(1)

      await store.remove(task!.id!)

      expect(store.tasks).toHaveLength(0)
    })

    it('returns false for non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.remove(99999)

      expect(result).toBe(false)
    })

    it('can delete multiple tasks independently', async () => {
      const store = useTaskStore()
      const task1 = await store.create(createValidInput({ name: 'Task 1' }))
      const task2 = await store.create(createValidInput({ name: 'Task 2' }))
      const task3 = await store.create(createValidInput({ name: 'Task 3' }))

      await store.remove(task2!.id!)

      expect(store.tasks).toHaveLength(2)
      expect(store.tasks.find((t) => t.id === task1!.id)).toBeDefined()
      expect(store.tasks.find((t) => t.id === task2!.id)).toBeUndefined()
      expect(store.tasks.find((t) => t.id === task3!.id)).toBeDefined()
    })
  })

  describe('T032h: recurring task nextDueDate auto-computed on create', () => {
    it('computes nextDueDate for recurring task on create', async () => {
      const store = useTaskStore()
      const input = createValidInput({
        name: 'Water plants',
        type: 'recurring',
        recurringPattern: {
          intervalValue: 3,
          intervalUnit: 'days',
          lastCompletedDate: '2024-01-15T12:00:00.000Z'
        }
      })

      const task = await store.create(input)

      expect(task).toBeDefined()
      expect(task!.recurringPattern).toBeDefined()
      expect(task!.recurringPattern!.nextDueDate).toBeDefined()
      expect(task!.recurringPattern!.nextDueDate).toContain('2024-01-18')
    })

    it('computes nextDueDate with weekly interval', async () => {
      const store = useTaskStore()
      const input = createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 2,
          intervalUnit: 'weeks',
          lastCompletedDate: '2024-01-15T12:00:00.000Z'
        }
      })

      const task = await store.create(input)

      expect(task!.recurringPattern!.nextDueDate).toContain('2024-01-29')
    })

    it('computes nextDueDate with monthly interval', async () => {
      const store = useTaskStore()
      const input = createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'months',
          lastCompletedDate: '2024-01-15T12:00:00.000Z'
        }
      })

      const task = await store.create(input)

      expect(task!.recurringPattern!.nextDueDate).toContain('2024-02-15')
    })

    it('persists computed nextDueDate to IndexedDB', async () => {
      const store = useTaskStore()
      const input = createValidInput({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2024-01-15T12:00:00.000Z'
        }
      })

      const task = await store.create(input)
      const dbTask = await db.tasks.get(task!.id!)

      expect(dbTask!.recurringPattern!.nextDueDate).toBeDefined()
      expect(dbTask!.recurringPattern!.nextDueDate).toContain('2024-01-22')
    })
  })

  describe('loadTasks', () => {
    it('loads tasks from IndexedDB into store', async () => {
      // Add tasks directly to DB
      await db.tasks.add({
        name: 'Direct Task 1',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'low',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      await db.tasks.add({
        name: 'Direct Task 2',
        type: 'one-off',
        timeEstimateMinutes: 60,
        effortLevel: 'high',
        location: 'outside',
        status: 'active',
        priority: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const store = useTaskStore()
      expect(store.tasks).toHaveLength(0)

      await store.loadTasks()

      expect(store.tasks).toHaveLength(2)
      expect(store.tasks.some((t) => t.name === 'Direct Task 1')).toBe(true)
      expect(store.tasks.some((t) => t.name === 'Direct Task 2')).toBe(true)
    })
  })

  describe('complete', () => {
    it('marks one-off task as completed', async () => {
      const store = useTaskStore()
      const task = await store.create(createValidInput({ type: 'one-off' }))

      const completed = await store.complete(task!.id!)

      expect(completed!.status).toBe('completed')
    })

    it('updates recurring task with new nextDueDate on complete', async () => {
      const store = useTaskStore()
      const task = await store.create(
        createValidInput({
          type: 'recurring',
          recurringPattern: {
            intervalValue: 3,
            intervalUnit: 'days',
            lastCompletedDate: '2024-01-15T12:00:00.000Z'
          }
        })
      )

      const originalNextDue = task!.recurringPattern!.nextDueDate

      await store.complete(task!.id!)

      const updated = store.tasks.find((t) => t.id === task!.id)
      expect(updated!.recurringPattern!.nextDueDate).not.toBe(originalNextDue)
      expect(updated!.status).toBe('active') // Recurring tasks stay active
    })
  })
})
