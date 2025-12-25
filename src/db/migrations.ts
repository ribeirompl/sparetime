/**
 * Database Migrations - Future schema version upgrades
 * Per data-model.md migration strategy
 *
 * Each migration function handles upgrading from the previous version.
 * Migrations are run automatically by Dexie.js when the database is opened.
 *
 * Note: Currently no migrations needed - app uses version 1 schema with UUIDs.
 * Migration infrastructure is kept for future schema changes.
 */

import type { Transaction } from 'dexie'

/**
 * Migration function type
 */
export type MigrationFn = (tx: Transaction) => Promise<void>

/**
 * Migration registry - maps version numbers to migration functions
 * Version 1 is the initial schema with UUIDs, so no migration needed.
 * Add migrations here for future versions.
 */
export const migrations: Record<number, MigrationFn> = {
  // No migrations currently - app starts with UUID-based schema
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
