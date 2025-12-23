import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db/database'
import type { Task } from '@/types/task'
import { nowISO } from '@/utils/dateHelpers'

describe('TaskStore Edge Cases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(async () => {
    await db.tasks.clear()
  })

  describe('cleanupDeletedTasks', () => {
    it('should remove soft-deleted tasks older than retention period', async () => {
      const store = useTaskStore()

      // Create tasks with different deletion dates
      const now = new Date()
      const old = new Date(now)
      old.setDate(old.getDate() - 35) // 35 days ago
      const recent = new Date(now)
      recent.setDate(recent.getDate() - 20) // 20 days ago

      const oldDeletedTask: Task = {
        id: 'old-deleted',
        name: 'Old deleted',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        deletedAt: old.toISOString()
      }

      const recentDeletedTask: Task = {
        id: 'recent-deleted',
        name: 'Recent deleted',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        deletedAt: recent.toISOString()
      }

      const activeTask: Task = {
        id: 'active',
        name: 'Active',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.bulkAdd([oldDeletedTask, recentDeletedTask, activeTask])
      await store.loadTasks()

      // Clean up with 30-day retention
      const cleanedCount = await store.cleanupDeletedTasks(30)

      expect(cleanedCount).toBe(1)

      // Verify old deleted task is gone
      const remaining = await db.tasks.toArray()
      expect(remaining).toHaveLength(2)
      expect(remaining.find(t => t.id === 'old-deleted')).toBeUndefined()
      expect(remaining.find(t => t.id === 'recent-deleted')).toBeDefined()
      expect(remaining.find(t => t.id === 'active')).toBeDefined()
    })

    it('should return 0 when no tasks need cleanup', async () => {
      const store = useTaskStore()

      const activeTask: Task = {
        id: 'active',
        name: 'Active',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.add(activeTask)
      await store.loadTasks()

      const cleanedCount = await store.cleanupDeletedTasks(30)
      expect(cleanedCount).toBe(0)
    })
  })

  describe('hasIncompleteDependencies', () => {
    it('should return true when dependency is not completed', async () => {
      const store = useTaskStore()

      const dependencyTask: Task = {
        id: 'dep-1',
        name: 'Dependency',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      const dependentTask: Task = {
        id: 'task-1',
        name: 'Dependent',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        dependsOnId: 'dep-1',
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.bulkAdd([dependencyTask, dependentTask])
      await store.loadTasks()

      expect(store.hasIncompleteDependencies('task-1')).toBe(true)
    })

    it('should return false when dependency is completed', async () => {
      const store = useTaskStore()

      const dependencyTask: Task = {
        id: 'dep-1',
        name: 'Dependency',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'completed',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      const dependentTask: Task = {
        id: 'task-1',
        name: 'Dependent',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        dependsOnId: 'dep-1',
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.bulkAdd([dependencyTask, dependentTask])
      await store.loadTasks()

      expect(store.hasIncompleteDependencies('task-1')).toBe(false)
    })

    it('should return false when task has no dependencies', async () => {
      const store = useTaskStore()

      const task: Task = {
        id: 'task-1',
        name: 'Independent',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.add(task)
      await store.loadTasks()

      expect(store.hasIncompleteDependencies('task-1')).toBe(false)
    })

    it('should return false when dependency is missing', async () => {
      const store = useTaskStore()

      const dependentTask: Task = {
        id: 'task-1',
        name: 'Dependent',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        dependsOnId: 'missing-dep',
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.add(dependentTask)
      await store.loadTasks()

      expect(store.hasIncompleteDependencies('task-1')).toBe(false)
    })
  })

  describe('getById', () => {
    it('should return task from local state if cached', async () => {
      const store = useTaskStore()

      const task: Task = {
        id: 'task-1',
        name: 'Test Task',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      await db.tasks.add(task)
      await store.loadTasks()

      const result = await store.getById('task-1')
      expect(result).toBeDefined()
      expect(result?.id).toBe('task-1')
    })

    it('should fallback to IndexedDB if not in local state', async () => {
      const store = useTaskStore()

      const task: Task = {
        id: 'task-1',
        name: 'Test Task',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        status: 'active',
        priority: 5,
        createdAt: nowISO(),
        updatedAt: nowISO()
      }

      // Add directly to DB without loading into state
      await db.tasks.add(task)

      const result = await store.getById('task-1')
      expect(result).toBeDefined()
      expect(result?.id).toBe('task-1')
    })

    it('should return undefined for non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.getById('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle validation errors during create', async () => {
      const store = useTaskStore()

      const result = await store.create({
        name: '', // Empty name - invalid
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        priority: 5
      })

      expect(result).toBeUndefined()
      expect(store.error).toBeTruthy()
      expect(store.error).toContain('name')
    })

    it('should handle circular dependency during create', async () => {
      const store = useTaskStore()

      // Create first task
      const task1 = await store.create({
        name: 'Task 1',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        priority: 5
      })

      expect(task1).toBeDefined()

      // Try to create task that depends on non-existent task (won't be circular)
      // But if we create task2 depending on task1, then try to update task1 to depend on task2...
      const task2 = await store.create({
        name: 'Task 2',
        type: 'one-off',
        timeEstimateMinutes: 30,
        effortLevel: 'medium',
        location: 'home',
        priority: 5,
        dependsOnId: task1!.id
      })

      expect(task2).toBeDefined()

      // Now try to update task1 to depend on task2 - this should fail (circular)
      const result = await store.update({
        id: task1!.id,
        dependsOnId: task2!.id
      })

      expect(result).toBeUndefined()
      expect(store.error).toBe('Circular dependency detected')
    })

    it('should handle update of non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.update({
        id: 'non-existent',
        name: 'Updated Name'
      })

      expect(result).toBeUndefined()
      expect(store.error).toBe('Task not found')
    })

    it('should handle remove of non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.remove('non-existent')

      expect(result).toBe(false)
    })

    it('should handle updateStatus of non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.updateStatus('non-existent', 'completed')

      expect(result).toBeUndefined()
    })

    it('should handle complete of non-existent task', async () => {
      const store = useTaskStore()

      const result = await store.complete('non-existent')

      expect(result).toBeUndefined()
      expect(store.error).toBe('Task not found')
    })
  })
})
