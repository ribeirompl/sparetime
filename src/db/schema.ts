/**
 * Database Schema - Dexie.js schema definitions
 * Per data-model.md specification
 *
 * Index Strategy:
 * - [status+type]: Filter active/completed tasks by type
 * - [recurringPattern.nextDueDate+status]: Query active recurring tasks by due date
 * - dependsOnId: Quickly find tasks that depend on a given task
 */

/**
 * Schema version 1 - Initial schema
 * Index definitions for Dexie.js
 */
export const SCHEMA_VERSION_1 = {
  tasks:
    '++id, name, type, status, deadline, [status+type], dependsOnId, recurringPattern.nextDueDate, [recurringPattern.nextDueDate+status], effortLevel, location',
  suggestionSessions: '++id, timestamp',
  syncState: 'id'
} as const

/**
 * Current schema version
 */
export const CURRENT_SCHEMA_VERSION = 1

/**
 * Get schema for a specific version
 */
export function getSchemaForVersion(version: number): Record<string, string> {
  switch (version) {
    case 1:
      return { ...SCHEMA_VERSION_1 }
    default:
      throw new Error(`Unknown schema version: ${version}`)
  }
}
