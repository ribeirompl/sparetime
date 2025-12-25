<script setup lang="ts">
/**
 * GoogleDriveSync - Component for Google Drive sync controls
 * Updated for Phase 4: Two-way sync with merge logic
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSyncStore } from '@/stores/syncStore'
import {
  initializeGoogleAuth,
  requestAccessToken,
  revokeAccessToken,
  getBackupLastModified
} from '@/services/googleDrive'
import { formatDateTimeLocale } from '@/utils/dateHelpers'
import type { TokenClient } from '@/services/googleDrive'

const syncStore = useSyncStore()

// State
const tokenClient = ref<TokenClient | null>(null)
const isConnecting = ref(false)
const isSyncing = ref(false)
const lastBackupDate = ref<Date | null>(null)
const errorMessage = ref<string | null>(null)

// First-time connect merge dialog
const showMergeDialog = ref(false)
const mergeDecisionPending = ref(false)

// Computed
const isConnected = computed(() => syncStore.isBackupEnabled)
const syncStatus = computed(() => syncStore.syncStatus)
const hasPendingChanges = computed(() => syncStore.hasPendingChanges)

// Actions
async function initializeAuth(): Promise<void> {
  try {
    tokenClient.value = await initializeGoogleAuth()
    // Store token client in sync store for silent refresh
    syncStore.setTokenClient(tokenClient.value)
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error)
    errorMessage.value = 'Failed to initialize Google Sign-In'
  }
}

async function connectGoogleDrive(): Promise<void> {
  if (!tokenClient.value) {
    errorMessage.value = 'Google Sign-In not initialized'
    return
  }

  isConnecting.value = true
  errorMessage.value = null

  try {
    const accessToken = await requestAccessToken(tokenClient.value)
    await syncStore.storeAccessToken(accessToken)

    // Check if there's an existing backup
    lastBackupDate.value = await getBackupLastModified(accessToken)

    // Check if we need a first-time merge decision
    const firstTimeStatus = await syncStore.checkFirstTimeConnect()
    if (firstTimeStatus.needsMergeDecision) {
      showMergeDialog.value = true
    } else {
      // No merge needed, perform initial sync
      await syncNow()
      // Start automatic polling
      syncStore.startRemoteCheckPolling()
    }
  } catch (error) {
    console.error('Failed to connect Google Drive:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Failed to connect'
  } finally {
    isConnecting.value = false
  }
}

async function disconnectGoogleDrive(): Promise<void> {
  try {
    // Stop polling
    syncStore.stopRemoteCheckPolling()

    const token = syncStore.getAccessToken()
    if (token) {
      await revokeAccessToken(token)
    }
    await syncStore.clearAuth()
    
    // Clear token client from store
    syncStore.setTokenClient(null)
    tokenClient.value = null
    
    lastBackupDate.value = null
  } catch (error) {
    console.error('Failed to disconnect:', error)
    errorMessage.value = 'Failed to disconnect'
  }
}

async function syncNow(): Promise<void> {
  isSyncing.value = true
  errorMessage.value = null

  try {
    const result = await syncStore.performSync()

    if (!result.success) {
      throw new Error(result.error || 'Sync failed')
    }

    lastBackupDate.value = new Date()

    if (result.conflictsDetected > 0) {
      errorMessage.value = `${result.conflictsDetected} conflict(s) detected. Please review in conflicts section.`
    }
  } catch (error) {
    console.error('Sync failed:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Sync failed'
  } finally {
    isSyncing.value = false
  }
}

async function handleMergeDecision(decision: 'merge' | 'use-remote' | 'use-local'): Promise<void> {
  mergeDecisionPending.value = true
  errorMessage.value = null

  try {
    const result = await syncStore.handleFirstTimeMerge(decision)

    if (!result.success) {
      throw new Error(result.error || 'Merge failed')
    }

    lastBackupDate.value = new Date()
    showMergeDialog.value = false

    // Start automatic polling after successful first-time merge
    syncStore.startRemoteCheckPolling()

    if (result.conflictsDetected > 0) {
      errorMessage.value = `${result.conflictsDetected} conflict(s) detected during merge.`
    }
  } catch (error) {
    console.error('Merge failed:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Merge failed'
  } finally {
    mergeDecisionPending.value = false
  }
}

function formatDate(date: Date | null): string {
  if (!date) return 'Never'
  return formatDateTimeLocale(date)
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idle: 'Ready',
    syncing: 'Syncing...',
    synced: 'Synced',
    error: 'Error',
    offline: 'Offline',
    conflict: 'Conflicts',
    'remote-newer': 'Updates available'
  }
  return labels[status] || status
}

onMounted(async () => {
  await syncStore.loadSyncState()
  await initializeAuth()

  // Register online/offline listeners
  syncStore.registerOnlineListeners()

  // If already connected, fetch last backup date and start polling
  if (isConnected.value) {
    try {
      const token = syncStore.getAccessToken()
      if (token) {
        lastBackupDate.value = await getBackupLastModified(token)
        // Start remote change polling
        syncStore.startRemoteCheckPolling()
      }
    } catch {
      // Token may have expired, user will need to reconnect
    }
  }
})

onUnmounted(() => {
  // Clean up polling when component unmounts
  syncStore.stopRemoteCheckPolling()
  syncStore.unregisterOnlineListeners()
})
</script>

<template>
  <div class="google-drive-sync">
    <h3 class="text-lg font-semibold mb-4">Google Drive Sync</h3>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error mb-4" role="alert">
      <p>{{ errorMessage }}</p>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="errorMessage = null"
      >
        Dismiss
      </button>
    </div>

    <!-- First-time Merge Dialog -->
    <div v-if="showMergeDialog" class="merge-dialog mb-4">
      <h4 class="font-medium mb-2">Data Found on Both Devices</h4>
      <p class="text-secondary text-sm mb-4">
        You have tasks on this device and on Google Drive. How would you like to proceed?
      </p>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="mergeDecisionPending"
          @click="handleMergeDecision('merge')"
        >
          {{ mergeDecisionPending ? 'Merging...' : 'Merge Both (Recommended)' }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="mergeDecisionPending"
          @click="handleMergeDecision('use-remote')"
        >
          Use Google Drive Data
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="mergeDecisionPending"
          @click="handleMergeDecision('use-local')"
        >
          Use This Device's Data
        </button>
      </div>
    </div>

    <!-- Not Connected State -->
    <div v-else-if="!isConnected" class="not-connected">
      <p class="text-secondary mb-4">
        Connect your Google account to sync your tasks across devices.
      </p>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isConnecting"
        @click="connectGoogleDrive"
      >
        <span v-if="isConnecting">Connecting...</span>
        <span v-else>Connect Google Drive</span>
      </button>
    </div>

    <!-- Connected State -->
    <div v-else class="connected">
      <div class="status-section mb-4">
        <p class="text-secondary">
          <span class="status-dot" :class="syncStatus"></span>
          Status: <strong>{{ getStatusLabel(syncStatus) }}</strong>
        </p>
        <p class="text-sm text-secondary mt-1">
          Last synced: {{ formatDate(lastBackupDate) }}
        </p>
      </div>

      <div class="actions flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isSyncing"
          @click="syncNow"
        >
          <span v-if="isSyncing">Syncing...</span>
          <span v-else>
            Sync Now
            <span v-if="hasPendingChanges" class="badge badge-warning ml-1">
              {{ syncStore.pendingChangeCount }}
            </span>
          </span>
        </button>
      </div>

      <div class="disconnect-section mt-4 pt-4 border-t border-secondary/20">
        <button
          type="button"
          class="btn btn-ghost text-error"
          @click="disconnectGoogleDrive"
        >
          Disconnect Google Drive
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.google-drive-sync {
  padding: var(--spacing-4);
  background: var(--surface-2);
  border-radius: var(--radius-lg);
}

.merge-dialog {
  padding: var(--spacing-4);
  background: var(--surface-3, var(--surface-1));
  border: 1px solid var(--warning);
  border-radius: var(--radius-md);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: var(--spacing-2);
  background-color: var(--text-secondary);
}

.status-dot.synced {
  background-color: var(--success);
}

.status-dot.syncing {
  background-color: var(--warning);
  animation: pulse 1s infinite;
}

.status-dot.error {
  background-color: var(--error);
}

.status-dot.conflict {
  background-color: var(--warning);
}

.status-dot.offline {
  background-color: var(--text-secondary);
}

.status-dot.remote-newer {
  background-color: var(--info, #3b82f6);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.alert-error {
  background-color: var(--error);
  color: white;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-2);
  font-size: 0.75rem;
  border-radius: var(--radius-full);
}

.badge-warning {
  background-color: var(--warning);
  color: var(--text-primary);
}
</style>
