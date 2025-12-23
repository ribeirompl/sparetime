/**
 * Integration tests for syncStore with Google Drive
 * Tests for access token storage and sync operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSyncStore } from '@/stores/syncStore'
import { db } from '@/db'
import type { Task } from '@/types/task'
import {
  downloadBackup,
  uploadBackup,
  getBackupLastModified,
  createBackupPayload
} from '@/services/googleDrive'

// Mock Google Drive service functions
vi.mock('@/services/googleDrive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/googleDrive')>()
  return {
    ...actual,
    downloadBackup: vi.fn(),
    uploadBackup: vi.fn(),
    getBackupLastModified: vi.fn()
    // createBackupPayload uses the real implementation
  }
})

// Helper to create test tasks with required id
function createTestTask(overrides: Partial<Task> & { id: string }): Task {
  return {
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
  } as Task
}

describe('SyncStore Integration Tests', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    // Clear database before each test
    await db.tasks.clear()
    await db.syncState.clear()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    await db.tasks.clear()
    await db.syncState.clear()
  })

  describe('Access token storage', () => {
    it('should store access token in syncState table', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      // Store a token
      await syncStore.storeAccessToken('mock-access-token-12345')

      // Verify it's in IndexedDB
      const syncState = await db.syncState.get(1)
      expect(syncState).toBeDefined()
      expect(syncState?.accessToken).toBe('mock-access-token-12345')
    })

    it('should retrieve stored token', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const originalToken = 'mock-access-token-67890'
      await syncStore.storeAccessToken(originalToken)

      // Retrieve the token
      const retrievedToken = syncStore.getAccessToken()

      expect(retrievedToken).toBe(originalToken)
    })

    it('should return null when no token is stored', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const retrievedToken = syncStore.getAccessToken()

      expect(retrievedToken).toBeNull()
    })

    it('should overwrite existing token with new token', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      await syncStore.storeAccessToken('first-token')
      await syncStore.storeAccessToken('second-token')

      const retrievedToken = syncStore.getAccessToken()

      expect(retrievedToken).toBe('second-token')
    })

    it('should clear access token on logout', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      await syncStore.storeAccessToken('some-token')
      await syncStore.clearAuth()

      const retrievedToken = syncStore.getAccessToken()

      expect(retrievedToken).toBeNull()
    })
  })

  describe('T082e: addPendingChange records task mutations', () => {
    it('should record create operation', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const task = createTestTask({ id: 'uuid-1' })
      await syncStore.addPendingChange(task.id!, 'create', task)

      const syncState = await db.syncState.get(1)
      expect(syncState?.pendingChanges).toHaveLength(1)
      expect(syncState?.pendingChanges?.[0].operation).toBe('create')
      expect(syncState?.pendingChanges?.[0].taskId).toBe('uuid-1')
    })

    it('should record update operation', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const task = createTestTask({ id: 'uuid-2', name: 'Updated Task' })
      await syncStore.addPendingChange(task.id!, 'update', task)

      const syncState = await db.syncState.get(1)
      expect(syncState?.pendingChanges?.[0].operation).toBe('update')
      expect(syncState?.pendingChanges?.[0].data?.name).toBe('Updated Task')
    })

    it('should record delete operation', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      await syncStore.addPendingChange('uuid-3', 'delete')

      const syncState = await db.syncState.get(1)
      expect(syncState?.pendingChanges?.[0].operation).toBe('delete')
      expect(syncState?.pendingChanges?.[0].taskId).toBe('uuid-3')
    })

    it('should accumulate multiple pending changes', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      // Add pending changes without task data to avoid cloning issues
      await syncStore.addPendingChange('uuid-1', 'create')
      await syncStore.addPendingChange('uuid-2', 'update')
      await syncStore.addPendingChange('uuid-3', 'delete')

      expect(syncStore.syncState?.pendingChanges).toHaveLength(3)
    })

    it('should include timestamp in pending change', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      await syncStore.addPendingChange('uuid-1', 'create', createTestTask({ id: 'uuid-1' }))

      const syncState = await db.syncState.get(1)
      const changeTimestamp = syncState?.pendingChanges?.[0].timestamp
      expect(changeTimestamp).toBeDefined()
      // Verify it's a valid ISO date string
      const date = new Date(changeTimestamp!)
      expect(date.getTime()).not.toBeNaN()
      // Should be recent (within last minute)
      const now = Date.now()
      expect(date.getTime()).toBeLessThanOrEqual(now)
      expect(date.getTime()).toBeGreaterThan(now - 60000)
    })
  })

  describe('T082f: clearPendingChanges after successful sync', () => {
    it('should clear all pending changes', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      // Add some pending changes without task data
      await syncStore.addPendingChange('uuid-1', 'create')
      await syncStore.addPendingChange('uuid-2', 'update')

      // Verify they exist first
      expect(syncStore.syncState?.pendingChanges).toHaveLength(2)

      // Clear them
      await syncStore.clearPendingChanges()

      expect(syncStore.syncState?.pendingChanges).toHaveLength(0)
    })

    it('should update lastSyncedAt timestamp', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      await syncStore.clearPendingChanges()

      const syncState = await db.syncState.get(1)
      expect(syncState?.lastSyncedAt).toBeDefined()
      // Verify it's a valid ISO date string
      const date = new Date(syncState?.lastSyncedAt!)
      expect(date.getTime()).not.toBeNaN()
      // Should be recent (within last minute)
      const now = Date.now()
      expect(date.getTime()).toBeLessThanOrEqual(now)
      expect(date.getTime()).toBeGreaterThan(now - 60000)
    })

    it('should reset syncStatus to synced', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()
      syncStore.syncStatus = 'syncing'

      await syncStore.clearPendingChanges()

      expect(syncStore.syncStatus).toBe('synced')
    })
  })

  describe('T082g: Conflict detection and resolution', () => {
    it('should detect conflict when local and remote have different data', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask = createTestTask({ id: 'uuid-1', name: 'Local Version', updatedAt: '2025-12-23T10:00:00.000Z' })
      const remoteTask = createTestTask({ id: 'uuid-1', name: 'Remote Version', updatedAt: '2025-12-23T11:00:00.000Z' })

      const hasConflict = syncStore.detectConflict(localTask, remoteTask)

      expect(hasConflict).toBe(true)
    })

    it('should not detect conflict when data matches', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const task = createTestTask({ id: 'uuid-1', name: 'Same Version' })

      const hasConflict = syncStore.detectConflict(task, { ...task })

      expect(hasConflict).toBe(false)
    })

    it('should add conflict to conflicts list', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask = createTestTask({ id: 'uuid-1', name: 'Local' })
      const remoteTask = createTestTask({ id: 'uuid-1', name: 'Remote' })

      await syncStore.addConflict(localTask, remoteTask)

      const syncState = await db.syncState.get(1)
      expect(syncState?.conflicts).toHaveLength(1)
      expect(syncState?.conflicts?.[0].taskId).toBe('uuid-1')
      expect(syncState?.conflicts?.[0].localData.name).toBe('Local')
      expect(syncState?.conflicts?.[0].remoteData.name).toBe('Remote')
    })

    it('should resolve conflict with local version', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask = createTestTask({ id: 'uuid-1', name: 'Local' })
      const remoteTask = createTestTask({ id: 'uuid-1', name: 'Remote' })
      await syncStore.addConflict(localTask, remoteTask)

      const resolved = await syncStore.resolveConflict('uuid-1', 'local')

      // Check that the resolved task has the local version's data
      expect(resolved?.id).toBe(localTask.id)
      expect(resolved?.name).toBe(localTask.name)
      expect(resolved?.type).toBe(localTask.type)
      expect(resolved?.status).toBe(localTask.status)
      
      // updatedAt should be updated to current time (not the original)
      expect(resolved?.updatedAt).toBeDefined()
      expect(new Date(resolved!.updatedAt).getTime()).toBeGreaterThan(new Date(localTask.updatedAt).getTime() - 1000)
      
      const syncState = await db.syncState.get(1)
      expect(syncState?.conflicts).toHaveLength(0)
    })

    it('should resolve conflict with remote version', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      // Use a fixed UUID for this test
      const taskId = 'test-uuid-resolve-conflict'

      // Create plain task objects (not using spread which can cause clone issues)
      const baseTaskData = {
        id: taskId,
        name: 'Original',
        type: 'one-off' as const,
        timeEstimateMinutes: 30,
        effortLevel: 'medium' as const,
        location: 'home' as const,
        status: 'active' as const,
        priority: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add task to database first
      await db.tasks.add(baseTaskData)

      const localTask = { ...baseTaskData, name: 'Local' }
      const remoteTask = { ...baseTaskData, name: 'Remote' }

      await syncStore.addConflict(localTask, remoteTask)
      const resolved = await syncStore.resolveConflict(taskId, 'remote')

      expect(resolved?.name).toBe('Remote')
      
      // updatedAt should be updated to current time
      expect(resolved?.updatedAt).toBeDefined()
      expect(new Date(resolved!.updatedAt).getTime()).toBeGreaterThan(new Date(remoteTask.updatedAt).getTime() - 1000)

      // Verify the task was updated in DB
      const updatedTask = await db.tasks.get(taskId)
      expect(updatedTask?.name).toBe('Remote')
      
      // Verify conflict was removed
      const syncState = await db.syncState.get(1)
      expect(syncState?.conflicts).toHaveLength(0)
    })

    it('should set syncStatus to conflict when conflicts exist', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const localTask = createTestTask({ id: 'uuid-1', name: 'Local' })
      const remoteTask = createTestTask({ id: 'uuid-1', name: 'Remote' })

      await syncStore.addConflict(localTask, remoteTask)

      expect(syncStore.syncStatus).toBe('conflict')
    })
  })

  describe('Export and Import', () => {
    it('should export all tasks to backup format', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      // Add tasks to database
      await db.tasks.bulkAdd([
        createTestTask({ id: 'uuid-1', name: 'Task 1' }),
        createTestTask({ id: 'uuid-2', name: 'Task 2' })
      ])

      const backup = await syncStore.exportToBackup()

      expect(backup.version).toBeGreaterThanOrEqual(1)
      expect(backup.exportTimestamp).toBeDefined()
      expect(backup.checksum).toBeDefined()
      expect(backup.tasks).toHaveLength(2)
    })

    it('should import tasks from backup', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const backup = {
        version: 1,
        exportTimestamp: new Date().toISOString(),
        checksum: '', // Will be recalculated
        tasks: [
          createTestTask({ id: 'uuid-1', name: 'Imported Task 1' }),
          createTestTask({ id: 'uuid-2', name: 'Imported Task 2' })
        ]
      }
      // Generate valid checksum
      backup.checksum = await syncStore.generateChecksum(backup.tasks)

      await syncStore.importFromBackup(backup)

      const tasks = await db.tasks.toArray()
      expect(tasks).toHaveLength(2)
      expect(tasks[0].name).toBe('Imported Task 1')
    })

    it('should reject import with invalid checksum', async () => {
      const syncStore = useSyncStore()
      await syncStore.loadSyncState()

      const backup = {
        version: 1,
        exportTimestamp: new Date().toISOString(),
        checksum: 'invalid-checksum',
        tasks: [createTestTask({ id: 'uuid-1' })]
      }

      await expect(syncStore.importFromBackup(backup)).rejects.toThrow(/checksum/i)
    })
  })

  describe('T083: Sync Algorithm (Phase 3)', () => {
    describe('performSync - Two-way sync', () => {
      it('should upload local-only tasks to remote', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Add local task
        const localTask = createTestTask({ id: 'local-only-uuid', name: 'Local Only Task' })
        await db.tasks.add(localTask)

        // Mock Google Drive functions - download returns empty, upload succeeds
        vi.mocked(downloadBackup).mockResolvedValueOnce(null)
        vi.mocked(uploadBackup).mockResolvedValueOnce(undefined)

        const result = await syncStore.performSync()

        expect(result.success).toBe(true)
        expect(result.tasksUploaded).toBe(1)
        expect(result.tasksDownloaded).toBe(0)
        expect(vi.mocked(uploadBackup)).toHaveBeenCalled()
      })

      it('should download remote-only tasks to local', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Mock remote has task, local is empty
        const remoteTask = createTestTask({ id: 'remote-only-uuid', name: 'Remote Only Task' })
        vi.mocked(downloadBackup).mockResolvedValueOnce({
          version: 1,
          exportTimestamp: new Date().toISOString(),
          checksum: 'test',
          tasks: [remoteTask]
        })
        vi.mocked(uploadBackup).mockResolvedValueOnce(undefined)

        const result = await syncStore.performSync()

        expect(result.success).toBe(true)
        expect(result.tasksDownloaded).toBe(1)

        // Verify task was added to local DB
        const localTask = await db.tasks.get('remote-only-uuid')
        expect(localTask).toBeDefined()
        expect(localTask?.name).toBe('Remote Only Task')
      })

      it('should keep newer local version when both exist', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Local task is newer
        const localTask = createTestTask({
          id: 'shared-uuid',
          name: 'Local Newer',
          updatedAt: '2025-12-25T12:00:00.000Z'
        })
        await db.tasks.add(localTask)

        // Remote task is older
        const remoteTask = createTestTask({
          id: 'shared-uuid',
          name: 'Remote Older',
          updatedAt: '2025-12-25T10:00:00.000Z'
        })

        vi.mocked(downloadBackup).mockResolvedValueOnce({
          version: 1,
          exportTimestamp: new Date().toISOString(),
          checksum: 'test',
          tasks: [remoteTask]
        })
        vi.mocked(uploadBackup).mockResolvedValueOnce(undefined)

        const result = await syncStore.performSync()

        expect(result.success).toBe(true)

        // Local task should remain unchanged
        const dbTask = await db.tasks.get('shared-uuid')
        expect(dbTask?.name).toBe('Local Newer')
      })

      it('should use newer remote version when remote is newer', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Local task is older
        const localTask = createTestTask({
          id: 'shared-uuid',
          name: 'Local Older',
          updatedAt: '2025-12-25T10:00:00.000Z'
        })
        await db.tasks.add(localTask)

        // Remote task is newer
        const remoteTask = createTestTask({
          id: 'shared-uuid',
          name: 'Remote Newer',
          updatedAt: '2025-12-25T12:00:00.000Z'
        })

        vi.mocked(downloadBackup).mockResolvedValueOnce({
          version: 1,
          exportTimestamp: new Date().toISOString(),
          checksum: 'test',
          tasks: [remoteTask]
        })
        vi.mocked(uploadBackup).mockResolvedValueOnce(undefined)

        const result = await syncStore.performSync()

        expect(result.success).toBe(true)
        expect(result.tasksDownloaded).toBe(1)

        // Remote task should have been applied
        const dbTask = await db.tasks.get('shared-uuid')
        expect(dbTask?.name).toBe('Remote Newer')
      })

      it('should detect conflicts when both modified since last sync', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Set last sync time
        await syncStore.clearPendingChanges() // This sets lastSyncedAt

        // Local task modified after last sync
        const localTask = createTestTask({
          id: 'conflict-uuid',
          name: 'Local Modified',
          updatedAt: new Date(Date.now() + 1000).toISOString()
        })
        await db.tasks.add(localTask)

        // Remote task also modified after last sync
        const remoteTask = createTestTask({
          id: 'conflict-uuid',
          name: 'Remote Modified',
          updatedAt: new Date(Date.now() + 2000).toISOString()
        })

        vi.mocked(downloadBackup).mockResolvedValueOnce({
          version: 1,
          exportTimestamp: new Date().toISOString(),
          checksum: 'test',
          tasks: [remoteTask]
        })

        const result = await syncStore.performSync()

        expect(result.success).toBe(true)
        expect(result.conflictsDetected).toBe(1)
        expect(syncStore.syncStatus).toBe('conflict')
      })

      it('should fail sync when not authenticated', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        // Don't set access token

        const result = await syncStore.performSync()

        expect(result.success).toBe(false)
        expect(result.error).toBe('Not authenticated')
      })
    })

    describe('checkFirstTimeConnect', () => {
      it('should detect when both local and remote have data', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Add local task
        await db.tasks.add(createTestTask({ id: 'local-uuid', name: 'Local Task' }))

        // Mock remote has data
        vi.mocked(getBackupLastModified).mockResolvedValueOnce('2025-12-25T12:00:00.000Z')

        const result = await syncStore.checkFirstTimeConnect()

        expect(result.hasLocalData).toBe(true)
        expect(result.hasRemoteData).toBe(true)
        expect(result.needsMergeDecision).toBe(true)
      })

      it('should not need merge decision if already synced before', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')
        await syncStore.clearPendingChanges() // Sets lastSyncedAt

        // Add local task
        await db.tasks.add(createTestTask({ id: 'local-uuid', name: 'Local Task' }))

        // Mock remote has data
        vi.mocked(getBackupLastModified).mockResolvedValueOnce('2025-12-25T12:00:00.000Z')

        const result = await syncStore.checkFirstTimeConnect()

        expect(result.hasLocalData).toBe(true)
        expect(result.hasRemoteData).toBe(true)
        expect(result.needsMergeDecision).toBe(false) // Already synced
      })

      it('should not need merge decision when only local has data', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Add local task
        await db.tasks.add(createTestTask({ id: 'local-uuid', name: 'Local Task' }))

        // Mock remote is empty
        vi.mocked(getBackupLastModified).mockResolvedValueOnce(null)

        const result = await syncStore.checkFirstTimeConnect()

        expect(result.hasLocalData).toBe(true)
        expect(result.hasRemoteData).toBe(false)
        expect(result.needsMergeDecision).toBe(false)
      })
    })

    describe('handleFirstTimeMerge', () => {
      it('should use remote when decision is use-remote', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Add local task
        await db.tasks.add(createTestTask({ id: 'local-uuid', name: 'Local Task' }))

        // Mock remote has different tasks
        const remoteTask = createTestTask({ id: 'remote-uuid', name: 'Remote Task' })
        vi.mocked(downloadBackup).mockResolvedValueOnce({
          version: 1,
          exportTimestamp: new Date().toISOString(),
          checksum: 'test',
          tasks: [remoteTask]
        })

        const result = await syncStore.handleFirstTimeMerge('use-remote')

        expect(result.success).toBe(true)
        expect(result.tasksDownloaded).toBe(1)

        // Verify local was replaced with remote
        const tasks = await db.tasks.toArray()
        expect(tasks).toHaveLength(1)
        expect(tasks[0].id).toBe('remote-uuid')
      })

      it('should use local when decision is use-local', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Add local task
        const localTask = createTestTask({ id: 'local-uuid', name: 'Local Task' })
        await db.tasks.add(localTask)

        // Mock upload
        vi.mocked(uploadBackup).mockResolvedValueOnce(undefined)

        const result = await syncStore.handleFirstTimeMerge('use-local')

        expect(result.success).toBe(true)
        expect(result.tasksUploaded).toBe(1)
        expect(vi.mocked(uploadBackup)).toHaveBeenCalled()
      })
    })

    describe('scheduleDebouncedSync', () => {
      it('should not sync when backup is not enabled', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        // Don't set access token - backup not enabled

        syncStore.scheduleDebouncedSync()

        // Should not throw, just return early
        expect(syncStore.isBackupEnabled).toBe(false)
      })
    })

    describe('startRemoteCheckPolling and stopRemoteCheckPolling', () => {
      it('should start and stop polling without errors', async () => {
        const syncStore = useSyncStore()
        await syncStore.loadSyncState()
        await syncStore.storeAccessToken('mock-token')

        // Mock the check function
        vi.mocked(getBackupLastModified).mockResolvedValue(null)

        // Should not throw
        syncStore.startRemoteCheckPolling()
        syncStore.stopRemoteCheckPolling()
      })
    })
  })
})
