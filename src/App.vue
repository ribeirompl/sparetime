<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useSyncStore } from '@/stores/syncStore'
import { onMounted, onUnmounted, computed } from 'vue'

const router = useRouter()
const syncStore = useSyncStore()

// Computed for sync indicator state
const isShowingSyncActivity = computed(() => 
  syncStore.isSyncPending || syncStore.syncStatus === 'syncing'
)

const hasConflicts = computed(() => syncStore.hasConflicts)

onMounted(async () => {
  await syncStore.loadSyncState()
  
  // Register online/offline listeners
  syncStore.registerOnlineListeners()
  
  // Start remote polling if backup is enabled (auto-syncs in background)
  if (syncStore.isBackupEnabled) {
    syncStore.startRemoteCheckPolling()
  }
})

onUnmounted(() => {
  syncStore.stopRemoteCheckPolling()
  syncStore.unregisterOnlineListeners()
})

function navigateToSettings() {
  router.push('/settings')
}

function getStatusColor(): string {
  // Conflicts take priority - show red
  if (hasConflicts.value) return 'bg-red-500'
  
  // Offline - show gray
  if (!syncStore.isOnline) return 'bg-gray-400'
  
  // Syncing or pending sync - show animated yellow
  if (isShowingSyncActivity.value) return 'bg-yellow-400 animate-pulse'
  
  // Has pending changes waiting to sync
  if (syncStore.hasPendingChanges) return 'bg-yellow-400'
  
  // Status-based colors
  switch (syncStore.syncStatus) {
    case 'synced': return 'bg-green-400'
    case 'error': return 'bg-red-400'
    case 'remote-newer': return 'bg-blue-400'
    default: return 'bg-gray-400'
  }
}

function getStatusTitle(): string {
  // Conflicts take priority
  if (hasConflicts.value) {
    return `${syncStore.conflictCount} conflict(s) - tap to resolve`
  }
  
  // Offline
  if (!syncStore.isOnline) return 'Offline - changes will sync when back online'
  
  // Syncing states
  if (syncStore.syncStatus === 'syncing') return 'Syncing with Google Drive...'
  if (syncStore.isSyncPending) return 'Syncing in a moment...'
  
  // Other states
  if (syncStore.hasPendingChanges) return 'Changes pending sync'
  
  switch (syncStore.syncStatus) {
    case 'synced': return 'Synced with Google Drive'
    case 'error': return 'Sync error - tap to view'
    case 'remote-newer': return 'Syncing remote changes...'
    case 'idle': return 'Connected to Google Drive'
    default: return 'Google Drive Sync'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-primary-600 text-white shadow-lg">
      <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <!-- App Logo and Name -->
        <div class="flex items-center gap-3">
          <img src="/icons/icon.svg" alt="SpareTime" class="h-8 w-8 rounded-lg bg-white p-0.5" />
          <h1 class="text-2xl font-bold">SpareTime</h1>
        </div>

        <!-- Sync Status Indicator (show after initialization) -->
        <button
          v-if="syncStore.isInitialized"
          class="flex items-center gap-2 touch-target px-3 py-1.5 rounded-full transition-colors"
          :class="[
            syncStore.isBackupEnabled 
              ? (hasConflicts ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20')
              : 'bg-orange-500/80 hover:bg-orange-500'
          ]"
          :title="syncStore.isBackupEnabled ? getStatusTitle() : 'Not backed up - tap to set up'"
          @click="navigateToSettings"
        >
          <!-- Warning icon when not set up -->
          <template v-if="!syncStore.isBackupEnabled">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span class="text-xs font-medium">Not backed up</span>
          </template>
          
          <!-- Connected state -->
          <template v-else>
            <!-- Status dot -->
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="getStatusColor()"
            ></span>
            
            <!-- Offline warning icon -->
            <svg
              v-if="!syncStore.isOnline"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            
            <!-- Conflict warning icon (red) -->
            <svg
              v-else-if="hasConflicts"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-red-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            
            <!-- Syncing spinner -->
            <svg
              v-else-if="isShowingSyncActivity"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            
            <!-- Normal cloud icon -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            
            <!-- Conflict count badge (red) -->
            <span v-if="hasConflicts" class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
              {{ syncStore.conflictCount }}
            </span>
            <!-- Offline badge -->
            <span v-else-if="!syncStore.isOnline" class="text-xs text-gray-300 font-medium">
              Offline
            </span>
          </template>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 safe-area-inset">
      <RouterView />
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset">
      <div class="mx-auto max-w-7xl flex justify-around py-2">
        <router-link
          to="/"
          class="flex flex-col items-center touch-target justify-center text-gray-600 hover:text-primary-600"
          active-class="text-primary-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span class="text-xs mt-1">Tasks</span>
        </router-link>

        <router-link
          to="/suggestions"
          class="flex flex-col items-center touch-target justify-center text-gray-600 hover:text-primary-600"
          active-class="text-primary-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span class="text-xs mt-1">Suggestions</span>
        </router-link>

        <router-link
          to="/settings"
          class="flex flex-col items-center touch-target justify-center text-gray-600 hover:text-primary-600"
          active-class="text-primary-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="text-xs mt-1">Settings</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
