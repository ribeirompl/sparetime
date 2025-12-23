/**
 * Integration tests for sync conflict resolution edge cases
 * Tests for issues that were discovered during usage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSyncStore } from '@/stores/syncStore'
import { db } from '@/db/database'
import type { Task } from '@/types/task'

// Mock Google Drive service
vi.mock('@/services/googleDrive', () => ({
  getBackupLastModified: vi.fn(),
  downloadBackup: vi.fn(),
  uploadBackup: vi.fn(),
  createBackupPayload: vi.fn()
}))

describe('SyncStore - Conflict Resolution Edge Cases', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.tasks.clear()
    await db.syncState.clear()
  })

  afterEach(async () => {
    await db.tasks.clear()
    await db.syncState.clear()
  })

  const createTestTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'test-task-1',
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    status: 'active',
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  })

  describe('Conflict re-detection prevention', () => {
    it('should not re-detect conflict after resolution', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()
      await syncStore.storeAccessToken('fake-token')

      const localTask = createTestTask({
        id: 'task-1',
        name: 'Local Version',
        updatedAt: '2025-12-23T10:00:00Z'
      })
      const remoteTask = createTestTask({
        id: 'task-1',
        name: 'Remote Version',
        updatedAt: '2025-12-23T10:30:00Z'
      })

      // Add task to DB
      await db.tasks.add(localTask)

      // Create conflict
      await syncStore.addConflict(localTask, remoteTask)
      expect(syncStore.conflicts).toHaveLength(1)

      // Resolve conflict with local version
      const resolved = await syncStore.resolveConflict('task-1', 'local')
      expect(resolved).toBeDefined()
      expect(syncStore.conflicts).toHaveLength(0)

      // Verify lastSyncedAt was updated to conflict's detectedAt
      const syncState = await db.syncState.get(1)
      expect(syncState?.lastSyncedAt).toBeDefined()

      // Resolved task should have newer timestamp
      const updatedTask = await db.tasks.get('task-1')
      expect(updatedTask).toBeDefined()
      expect(new Date(updatedTask!.updatedAt).getTime()).toBeGreaterThan(
        new Date(remoteTask.updatedAt).getTime()
      )
    })

    it('should not lose other changes made during conflict resolution', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()
      await syncStore.storeAccessToken('fake-token')

      const conflictDetectedAt = '2025-12-23T10:00:00Z'

      // Create a conflict
      const task1Local = createTestTask({
        id: 'task-1',
        name: 'Task 1 Local',
        updatedAt: '2025-12-23T09:50:00Z'
      })
      const task1Remote = createTestTask({
        id: 'task-1',
        name: 'Task 1 Remote',
        updatedAt: '2025-12-23T09:55:00Z'
      })

      await db.tasks.add(task1Local)

      // Manually create conflict with specific detectedAt time
      const syncState = await db.syncState.get(1)
      await db.syncState.put({
        id: 1,
        pendingChanges: [],
        conflicts: [{
          taskId: 'task-1',
          localData: task1Local,
          remoteData: task1Remote,
          detectedAt: conflictDetectedAt
        }],
        accessToken: 'fake-token',
        lastSyncedAt: '2025-12-23T09:00:00Z'
      })

      await syncStore.loadSyncState()

      // Add another task AFTER conflict detection
      const task2 = createTestTask({
        id: 'task-2',
        name: 'Task 2',
        updatedAt: '2025-12-23T10:05:00Z' // After conflict detection
      })
      await db.tasks.add(task2)

      // Resolve conflict
      await syncStore.resolveConflict('task-1', 'local')

      // Check that lastSyncedAt equals conflictDetectedAt
      const updatedSyncState = await db.syncState.get(1)
      expect(updatedSyncState?.lastSyncedAt).toBe(conflictDetectedAt)

      // Task 2's update (10:05) is AFTER lastSyncedAt (10:00)
      // So it should be considered "new" and not lost
      expect(new Date(task2.updatedAt).getTime()).toBeGreaterThan(
        new Date(updatedSyncState!.lastSyncedAt!).getTime()
      )
    })
  })

  describe('Duplicate conflict prevention', () => {
    it('should not create duplicate conflicts for same task', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask = createTestTask({ id: 'task-1', name: 'Local' })
      const remoteTask = createTestTask({ id: 'task-1', name: 'Remote' })

      // Add conflict first time
      await syncStore.addConflict(localTask, remoteTask)
      expect(syncStore.conflicts).toHaveLength(1)

      // Try to add same conflict again
      await syncStore.addConflict(localTask, remoteTask)

      // Should still only have 1 conflict, not 2
      expect(syncStore.conflicts).toHaveLength(1)
    })

    it('should update existing conflict data when added again', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask1 = createTestTask({ id: 'task-1', name: 'Local v1' })
      const remoteTask1 = createTestTask({ id: 'task-1', name: 'Remote v1' })

      // Add conflict
      await syncStore.addConflict(localTask1, remoteTask1)
      const firstDetectedAt = syncStore.conflicts[0].detectedAt

      // Wait enough time to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 50))

      // Add conflict again with updated data
      const localTask2 = createTestTask({ id: 'task-1', name: 'Local v2' })
      const remoteTask2 = createTestTask({ id: 'task-1', name: 'Remote v2' })
      await syncStore.addConflict(localTask2, remoteTask2)

      // Should still have 1 conflict
      expect(syncStore.conflicts).toHaveLength(1)

      // But data should be updated
      expect(syncStore.conflicts[0].localData.name).toBe('Local v2')
      expect(syncStore.conflicts[0].remoteData.name).toBe('Remote v2')

      // detectedAt should be updated (later than first)
      expect(new Date(syncStore.conflicts[0].detectedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(firstDetectedAt).getTime()
      )
    })
  })

  describe('Offline sync handling', () => {
    it('should not show pending status when offline', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()
      await syncStore.storeAccessToken('fake-token')

      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      // Try to schedule sync while offline
      syncStore.scheduleDebouncedSync()

      // Should NOT set isSyncPending
      expect(syncStore.isSyncPending).toBe(false)

      // Should set status to offline
      expect(syncStore.syncStatus).toBe('offline')

      // Restore online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
    })
  })
})
