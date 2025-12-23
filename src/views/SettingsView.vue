<script setup lang="ts">
/**
 * SettingsView - Settings page with Google Drive backup controls
 * T098-T100: Settings page integration
 */

import { ref } from 'vue'
import { GoogleDriveSync, SyncStatus } from '@/components/settings'
import { useSyncStore } from '@/stores/syncStore'
import { useTaskStore } from '@/stores/taskStore'
import { db } from '@/db'

const syncStore = useSyncStore()
const taskStore = useTaskStore()

const isExporting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

async function exportToJson(): Promise<void> {
  isExporting.value = true

  try {
    const backup = await syncStore.exportToBackup()
    const jsonString = JSON.stringify(backup, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `sparetime-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

async function deleteAllData(): Promise<void> {
  if (!showDeleteConfirm.value) {
    showDeleteConfirm.value = true
    return
  }

  isDeleting.value = true

  try {
    await db.tasks.clear()
    await db.syncState.clear()
    await taskStore.loadTasks()
    await syncStore.loadSyncState()
    showDeleteConfirm.value = false
  } catch (error) {
    console.error('Delete failed:', error)
  } finally {
    isDeleting.value = false
  }
}

function cancelDelete(): void {
  showDeleteConfirm.value = false
}
</script>

<template>
  <div class="settings-view pb-20">
    <h2 class="text-2xl font-bold mb-6">Settings</h2>

    <div class="space-y-6">
      <!-- Google Drive Backup Section -->
      <section class="settings-section">
        <GoogleDriveSync />
        <SyncStatus v-if="syncStore.isBackupEnabled" class="mt-4" />
      </section>

      <!-- Export Data -->
      <section class="settings-section rounded-lg bg-surface-2 p-6">
        <h3 class="text-lg font-medium mb-2">Export Data</h3>
        <p class="text-secondary text-sm mb-4">
          Download all your tasks as a JSON file for backup or transfer.
        </p>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isExporting"
          @click="exportToJson"
        >
          {{ isExporting ? 'Exporting...' : 'Export to JSON' }}
        </button>
      </section>

      <!-- Delete Data -->
      <section class="settings-section rounded-lg bg-surface-2 p-6">
        <h3 class="text-lg font-medium mb-2 text-error">Delete All Data</h3>
        <p class="text-secondary text-sm mb-4">
          Permanently delete all local data. This cannot be undone.
        </p>

        <div v-if="!showDeleteConfirm">
          <button
            type="button"
            class="btn btn-ghost text-error"
            @click="deleteAllData"
          >
            Delete All Data
          </button>
        </div>

        <div v-else class="delete-confirm">
          <p class="text-warning mb-3 font-medium">
            Are you sure? This will permanently delete all your tasks.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-error"
              :disabled="isDeleting"
              @click="deleteAllData"
            >
              {{ isDeleting ? 'Deleting...' : 'Yes, Delete Everything' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              @click="cancelDelete"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-4);
}

.settings-section {
  border-radius: var(--radius-lg);
}

.delete-confirm {
  padding: var(--spacing-4);
  background: var(--error-bg, rgba(239, 68, 68, 0.1));
  border-radius: var(--radius-md);
}

.btn-error {
  background-color: var(--error);
  color: white;
}

.btn-error:hover {
  background-color: var(--error-dark, #dc2626);
}
</style>
