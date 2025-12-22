/**
 * Sync Store - Pinia state management for Google Drive sync
 * Per plan.md - handles backup/restore and sync state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db/database'
import type { SyncState, PendingChange, SyncConflict, GoogleDriveBackup } from '@/types/sync'
import type { Task } from '@/types/task'
import { nowISO } from '@/utils/dateHelpers'
import { CURRENT_SCHEMA_VERSION } from '@/db/schema'

/**
 * Sync status enum
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

/**
 * Sync store for managing Google Drive backup state
 */
export const useSyncStore = defineStore('sync', () => {
  // State
  const syncState = ref<SyncState | null>(null)
  const status = ref<SyncStatus>('idle')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncTime = ref<string | null>(null)

  // Getters
  const isBackupEnabled = computed(() => !!syncState.value?.encryptedToken)

  const hasPendingChanges = computed(
    () => (syncState.value?.pendingChanges?.length ?? 0) > 0
  )

  const pendingChangeCount = computed(
    () => syncState.value?.pendingChanges?.length ?? 0
  )

  const hasConflicts = computed(
    () => (syncState.value?.conflicts?.length ?? 0) > 0
  )

  const conflictCount = computed(
    () => syncState.value?.conflicts?.length ?? 0
  )

  // Actions

  /**
   * Load sync state from IndexedDB
   */
  async function loadSyncState(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const state = await db.syncState.get('singleton')
      syncState.value = state ?? null
      lastSyncTime.value = state?.lastSyncTimestamp ?? null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load sync state'
      console.error('Failed to load sync state:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize sync state if it doesn't exist
   */
  async function initializeSyncState(): Promise<void> {
    if (syncState.value) return

    const initialState: SyncState = {
      id: 'singleton',
      pendingChanges: [],
      conflicts: []
    }

    await db.syncState.put(initialState)
    syncState.value = initialState
  }

  /**
   * Add a pending change to the queue
   * Called when tasks are created, updated, or deleted
   */
  async function addPendingChange(
    taskId: number,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    if (!syncState.value) {
      await initializeSyncState()
    }

    const change: PendingChange = {
      taskId,
      operation,
      timestamp: nowISO()
    }

    // Remove any existing changes for this task (superseded by new change)
    const existingChanges = syncState.value!.pendingChanges.filter(
      (c) => c.taskId !== taskId
    )

    // Add new change
    existingChanges.push(change)

    await db.syncState.update('singleton', {
      pendingChanges: existingChanges
    })

    syncState.value!.pendingChanges = existingChanges
  }

  /**
   * Clear pending changes after successful sync
   */
  async function clearPendingChanges(): Promise<void> {
    if (!syncState.value) return

    await db.syncState.update('singleton', {
      pendingChanges: [],
      lastSyncTimestamp: nowISO()
    })

    syncState.value.pendingChanges = []
    syncState.value.lastSyncTimestamp = nowISO()
    lastSyncTime.value = syncState.value.lastSyncTimestamp
  }

  /**
   * Add a sync conflict
   */
  async function addConflict(conflict: SyncConflict): Promise<void> {
    if (!syncState.value) {
      await initializeSyncState()
    }

    const conflicts = [...syncState.value!.conflicts, conflict]

    await db.syncState.update('singleton', { conflicts })
    syncState.value!.conflicts = conflicts
  }

  /**
   * Resolve a conflict by choosing local or remote version
   */
  async function resolveConflict(
    taskId: number,
    resolution: 'local' | 'remote'
  ): Promise<void> {
    if (!syncState.value) return

    const conflict = syncState.value.conflicts.find((c) => c.taskId === taskId)
    if (!conflict) return

    // Remove conflict from list
    const remainingConflicts = syncState.value.conflicts.filter(
      (c) => c.taskId !== taskId
    )

    // If choosing remote, update local task
    if (resolution === 'remote') {
      await db.tasks.put(conflict.remoteVersion)
    }

    await db.syncState.update('singleton', {
      conflicts: remainingConflicts
    })

    syncState.value.conflicts = remainingConflicts
  }

  /**
   * Export all tasks to backup format
   */
  async function exportToBackup(): Promise<GoogleDriveBackup> {
    const tasks = await db.tasks.toArray()

    // Generate checksum (simple hash for integrity)
    const dataString = JSON.stringify(tasks)
    const checksum = await generateChecksum(dataString)

    return {
      version: CURRENT_SCHEMA_VERSION,
      exportTimestamp: nowISO(),
      tasks,
      checksum
    }
  }

  /**
   * Import tasks from backup
   */
  async function importFromBackup(backup: GoogleDriveBackup): Promise<boolean> {
    try {
      // Verify checksum
      const dataString = JSON.stringify(backup.tasks)
      const expectedChecksum = await generateChecksum(dataString)

      if (expectedChecksum !== backup.checksum) {
        error.value = 'Backup integrity check failed'
        return false
      }

      // Clear existing tasks and import
      await db.transaction('rw', db.tasks, async () => {
        await db.tasks.clear()
        await db.tasks.bulkAdd(backup.tasks)
      })

      // Update last sync time
      await db.syncState.update('singleton', {
        lastSyncTimestamp: nowISO()
      })

      if (syncState.value) {
        syncState.value.lastSyncTimestamp = nowISO()
        lastSyncTime.value = syncState.value.lastSyncTimestamp
      }

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to import backup'
      console.error('Failed to import backup:', e)
      return false
    }
  }

  /**
   * Generate SHA-256 checksum for data integrity
   */
  async function generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Set sync status
   */
  function setStatus(newStatus: SyncStatus): void {
    status.value = newStatus
  }

  /**
   * Clear sync state (disable backup)
   */
  async function clearSyncState(): Promise<void> {
    await db.syncState.delete('singleton')
    syncState.value = null
    lastSyncTime.value = null
    status.value = 'idle'
  }

  return {
    // State
    syncState,
    status,
    loading,
    error,
    lastSyncTime,

    // Getters
    isBackupEnabled,
    hasPendingChanges,
    pendingChangeCount,
    hasConflicts,
    conflictCount,

    // Actions
    loadSyncState,
    initializeSyncState,
    addPendingChange,
    clearPendingChanges,
    addConflict,
    resolveConflict,
    exportToBackup,
    importFromBackup,
    setStatus,
    clearSyncState
  }
})
