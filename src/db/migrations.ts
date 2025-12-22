/**
 * Database Migrations - Future schema version upgrades
 * Per data-model.md migration strategy
 *
 * Each migration function handles upgrading from the previous version.
 * Migrations are run automatically by Dexie.js when the database is opened.
 */

import type { Transaction } from 'dexie'

/**
 * Migration function type
 */
export type MigrationFn = (tx: Transaction) => Promise<void>

/**
 * Migration registry - maps version numbers to migration functions
 * Version 1 is the initial schema, so no migration needed
 * Add migrations here for future versions
 */
export const migrations: Record<number, MigrationFn> = {
  // Version 2 example (future):
  // 2: async (tx) => {
  //   // Migrate existing tasks to add new fields
  //   await tx.table('tasks').toCollection().modify(task => {
  //     task.tags = []
  //   })
  // }
}

/**
 * Run migration for a specific version
 */
export async function runMigration(version: number, tx: Transaction): Promise<void> {
  const migration = migrations[version]
  if (migration) {
    await migration(tx)
  }
}

/**
 * Check if a migration exists for a version
 */
export function hasMigration(version: number): boolean {
  return version in migrations
}
