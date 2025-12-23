<script setup lang="ts">
/**
 * SyncStatus - Component for displaying sync status and conflict resolution
 * T096-T097: Status indicator and conflict resolution UI
 */

import { computed } from 'vue'
import { useSyncStore } from '@/stores/syncStore'
import { useTaskStore } from '@/stores/taskStore'
import type { SyncConflict } from '@/types/sync'
import type { Task } from '@/types/task'

const syncStore = useSyncStore()
const taskStore = useTaskStore()

// Computed
const conflicts = computed(() => syncStore.conflicts)
const hasConflicts = computed(() => syncStore.hasConflicts)
const syncStatus = computed(() => syncStore.syncStatus)

// Actions
async function resolveWithLocal(conflict: SyncConflict): Promise<void> {
  await syncStore.resolveConflict(conflict.taskId, 'local')
}

async function resolveWithRemote(conflict: SyncConflict): Promise<void> {
  await syncStore.resolveConflict(conflict.taskId, 'remote')
}

function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function getTaskNameById(taskId: string | undefined): string {
  if (!taskId) return 'None'
  const task = taskStore.tasks.find(t => t.id === taskId)
  return task ? task.name : `Unknown (${taskId.slice(0, 8)}...)`
}

function getStatusText(status: string): string {
  switch (status) {
    case 'synced': return 'All changes synced'
    case 'syncing': return 'Syncing...'
    case 'error': return 'Sync error'
    case 'conflict': return 'Conflicts need attention'
    case 'offline': return 'Offline - will sync when online'
    case 'idle': return 'Ready to sync'
    default: return 'Ready'
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'synced': return '✓'
    case 'syncing': return '↻'
    case 'error': return '✕'
    case 'conflict': return '⚠'
    case 'offline': return '○'
    case 'idle': return '○'
    default: return '○'
  }
}

function getEffortLabel(effort: string): string {
  switch (effort) {
    case 'low': return '🟢 Low'
    case 'medium': return '🟡 Medium'
    case 'high': return '🔴 High'
    default: return effort
  }
}

function getLocationLabel(location: string): string {
  switch (location) {
    case 'home': return '🏠 Home'
    case 'outside': return '🌳 Outside'
    case 'anywhere': return '📍 Anywhere'
    default: return location
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'one-off': return '☑️ One-off'
    case 'recurring': return '🔄 Recurring'
    case 'project': return '📁 Project'
    default: return type
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return '🔵 Active'
    case 'completed': return '✅ Completed'
    case 'archived': return '📦 Archived'
    default: return status
  }
}

function findDifferences(local: Task, remote: Task): Array<{ field: string; localValue: string; remoteValue: string }> {
  const diffs: Array<{ field: string; localValue: string; remoteValue: string }> = []
  
  if (local.name !== remote.name) {
    diffs.push({ field: 'Name', localValue: local.name, remoteValue: remote.name })
  }
  if (local.type !== remote.type) {
    diffs.push({ field: 'Type', localValue: getTypeLabel(local.type), remoteValue: getTypeLabel(remote.type) })
  }
  if (local.status !== remote.status) {
    diffs.push({ field: 'Status', localValue: getStatusLabel(local.status), remoteValue: getStatusLabel(remote.status) })
  }
  if (local.timeEstimateMinutes !== remote.timeEstimateMinutes) {
    diffs.push({ field: 'Time', localValue: `${local.timeEstimateMinutes} min`, remoteValue: `${remote.timeEstimateMinutes} min` })
  }
  if (local.effortLevel !== remote.effortLevel) {
    diffs.push({ field: 'Effort', localValue: getEffortLabel(local.effortLevel), remoteValue: getEffortLabel(remote.effortLevel) })
  }
  if (local.location !== remote.location) {
    diffs.push({ field: 'Location', localValue: getLocationLabel(local.location), remoteValue: getLocationLabel(remote.location) })
  }
  if (local.priority !== remote.priority) {
    diffs.push({ field: 'Priority', localValue: `${local.priority}/10`, remoteValue: `${remote.priority}/10` })
  }
  if (local.deadline !== remote.deadline) {
    diffs.push({ 
      field: 'Deadline', 
      localValue: local.deadline ? formatDate(local.deadline) : 'None', 
      remoteValue: remote.deadline ? formatDate(remote.deadline) : 'None' 
    })
  }
  if (local.dependsOnId !== remote.dependsOnId) {
    diffs.push({
      field: 'Dependency',
      localValue: getTaskNameById(local.dependsOnId),
      remoteValue: getTaskNameById(remote.dependsOnId)
    })
  }
  
  return diffs
}
</script>

<template>
  <div class="sync-status">
    <!-- Status Indicator -->
    <div class="status-indicator" :class="syncStatus">
      <span class="status-icon">{{ getStatusIcon(syncStatus) }}</span>
      <span class="status-text">{{ getStatusText(syncStatus) }}</span>
    </div>

    <!-- Conflict Resolution UI -->
    <div v-if="hasConflicts" class="conflicts-section mt-4">
      <div class="conflict-header-banner">
        <h4 class="font-semibold text-red-600">⚠️ {{ conflicts.length }} Sync Conflict{{ conflicts.length > 1 ? 's' : '' }}</h4>
        <p class="text-sm text-gray-600 mt-1">
          The same task was modified on multiple devices. Choose which version to keep for each conflict.
        </p>
      </div>

      <div
        v-for="conflict in conflicts"
        :key="conflict.taskId"
        class="conflict-card"
      >
        <!-- Conflict Card Header -->
        <div class="conflict-card-header">
          <div class="flex items-center gap-2">
            <span class="text-lg">📝</span>
            <span class="task-title">{{ conflict.localData.name }}</span>
          </div>
          <span class="conflict-badge">
            Detected {{ formatRelativeTime(conflict.detectedAt) }}
          </span>
        </div>

        <!-- Differences Summary -->
        <div class="differences-section" v-if="findDifferences(conflict.localData, conflict.remoteData).length > 0">
          <h5 class="text-sm font-medium text-gray-500 mb-2">What's Different:</h5>
          <div class="differences-table">
            <div class="diff-row header">
              <span class="diff-field">Field</span>
              <span class="diff-local">This Device</span>
              <span class="diff-remote">Other Device</span>
            </div>
            <div 
              v-for="diff in findDifferences(conflict.localData, conflict.remoteData)" 
              :key="diff.field"
              class="diff-row"
            >
              <span class="diff-field">{{ diff.field }}</span>
              <span class="diff-local">{{ diff.localValue }}</span>
              <span class="diff-remote">{{ diff.remoteValue }}</span>
            </div>
          </div>
        </div>

        <!-- Version Comparison -->
        <div class="version-comparison">
          <!-- Local Version -->
          <div class="version-card local">
            <div class="version-header">
              <span class="version-badge local">📱 This Device</span>
              <span class="version-time">{{ formatRelativeTime(conflict.localData.updatedAt) }}</span>
            </div>
            <div class="version-meta">
              <span>{{ getTypeLabel(conflict.localData.type) }}</span>
              <span>{{ getStatusLabel(conflict.localData.status) }}</span>
              <span>{{ conflict.localData.timeEstimateMinutes }} min</span>
            </div>
            <div class="version-meta">
              <span>{{ getEffortLabel(conflict.localData.effortLevel) }}</span>
              <span>{{ getLocationLabel(conflict.localData.location) }}</span>
              <span>Priority: {{ conflict.localData.priority }}/10</span>
            </div>
            <div v-if="conflict.localData.dependsOnId" class="version-meta">
              <span>🔗 Depends on: {{ getTaskNameById(conflict.localData.dependsOnId) }}</span>
            </div>
            <button
              type="button"
              class="btn-resolve local"
              @click="resolveWithLocal(conflict)"
            >
              ✓ Keep This Version
            </button>
          </div>

          <!-- Remote Version -->
          <div class="version-card remote">
            <div class="version-header">
              <span class="version-badge remote">☁️ Other Device</span>
              <span class="version-time">{{ formatRelativeTime(conflict.remoteData.updatedAt) }}</span>
            </div>
            <div class="version-meta">
              <span>{{ getTypeLabel(conflict.remoteData.type) }}</span>
              <span>{{ getStatusLabel(conflict.remoteData.status) }}</span>
              <span>{{ conflict.remoteData.timeEstimateMinutes }} min</span>
            </div>
            <div class="version-meta">
              <span>{{ getEffortLabel(conflict.remoteData.effortLevel) }}</span>
              <span>{{ getLocationLabel(conflict.remoteData.location) }}</span>
              <span>Priority: {{ conflict.remoteData.priority }}/10</span>
            </div>
            <div v-if="conflict.remoteData.dependsOnId" class="version-meta">
              <span>🔗 Depends on: {{ getTaskNameById(conflict.remoteData.dependsOnId) }}</span>
            </div>
            <button
              type="button"
              class="btn-resolve remote"
              @click="resolveWithRemote(conflict)"
            >
              ✓ Keep This Version
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sync-status {
  padding: var(--spacing-4);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--surface-3);
  border-radius: var(--radius-md);
}

.status-indicator.synced {
  background: var(--success-bg, rgba(34, 197, 94, 0.1));
  color: var(--success);
}

.status-indicator.syncing {
  background: var(--warning-bg, rgba(234, 179, 8, 0.1));
  color: var(--warning);
}

.status-indicator.error {
  background: var(--error-bg, rgba(239, 68, 68, 0.1));
  color: var(--error);
}

.status-indicator.conflict {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.status-indicator.offline {
  background: var(--surface-3);
  color: var(--text-secondary);
}

.status-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.conflicts-section {
  margin-top: 1rem;
}

.conflict-header-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.conflict-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.conflict-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.task-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.conflict-badge {
  font-size: 0.75rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.differences-section {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.differences-table {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diff-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.diff-row.header {
  font-weight: 600;
  background: #e5e7eb;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
}

.diff-field {
  color: #374151;
}

.diff-local {
  color: #4f46e5;
  font-weight: 500;
}

.diff-remote {
  color: #059669;
  font-weight: 500;
}

.version-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 640px) {
  .version-comparison {
    grid-template-columns: 1fr;
  }
}

.version-card {
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.version-card.local {
  background: rgba(79, 70, 229, 0.05);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

.version-card.remote {
  background: rgba(5, 150, 105, 0.05);
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.version-badge.local {
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

.version-badge.remote {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.version-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.version-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.version-meta span {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.btn-resolve {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-resolve.local {
  background: #4f46e5;
  color: white;
}

.btn-resolve.local:hover {
  background: #4338ca;
}

.btn-resolve.remote {
  background: #059669;
  color: white;
}

.btn-resolve.remote:hover {
  background: #047857;
}
</style>
