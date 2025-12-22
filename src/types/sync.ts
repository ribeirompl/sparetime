/**
 * Sync Types - Interfaces for Google Drive backup/sync
 * Per data-model.md specification
 */

import type { Task } from './task'

/**
 * Encrypted OAuth token stored in IndexedDB
 * Uses AES-GCM with PBKDF2-derived key from device fingerprint
 */
export interface EncryptedToken {
  /** Encrypted token data */
  encrypted: ArrayBuffer
  /** Salt used for key derivation */
  salt: Uint8Array
  /** Initialization vector for AES-GCM */
  iv: Uint8Array
}

/**
 * Pending change queued for sync
 */
export interface PendingChange {
  /** Task ID that was changed */
  taskId: number
  /** Type of operation */
  operation: 'create' | 'update' | 'delete'
  /** Timestamp of change (ISO date string) */
  timestamp: string
}

/**
 * Conflict between local and remote versions
 */
export interface SyncConflict {
  /** Task ID with conflict */
  taskId: number
  /** Local version of task */
  localVersion: Task
  /** Remote version of task */
  remoteVersion: Task
  /** Timestamp when conflict was detected */
  timestamp: string
}

/**
 * Sync state stored in IndexedDB
 * Only one record exists (singleton pattern with id='singleton')
 */
export interface SyncState {
  /** Always 'singleton' - only one sync state record */
  id: 'singleton'
  /** Encrypted OAuth token (if backup enabled) */
  encryptedToken?: EncryptedToken
  /** Last successful sync timestamp (ISO date string) */
  lastSyncTimestamp?: string
  /** Queue of changes made while offline */
  pendingChanges: PendingChange[]
  /** Conflicts awaiting resolution */
  conflicts: SyncConflict[]
}

/**
 * Google Drive backup file format
 */
export interface GoogleDriveBackup {
  /** Schema version for forward compatibility */
  version: number
  /** Export timestamp (ISO date string) */
  exportTimestamp: string
  /** All tasks */
  tasks: Task[]
  /** SHA-256 checksum for integrity verification */
  checksum: string
}
