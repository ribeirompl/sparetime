/**
 * Unit tests for Google Drive service
 * T082c: Tests for GoogleDriveBackup JSON format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createBackupPayload,
  validateBackupPayload,
  parseBackupPayload
} from '@/services/googleDrive'
import type { Task } from '@/types/task'
import type { GoogleDriveBackup } from '@/types/sync'

// Helper to create test tasks
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id-1',
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    status: 'active',
    priority: 'important',
    createdAt: '2025-12-23T10:00:00.000Z',
    updatedAt: '2025-12-23T10:00:00.000Z',
    ...overrides
  }
}

describe('Google Drive Service', () => {
  describe('T082c: GoogleDriveBackup JSON includes version, timestamp, checksum', () => {
    it('should include version field in backup payload', async () => {
      const tasks = [createTestTask()]

      const backup = await createBackupPayload(tasks)

      expect(backup).toHaveProperty('version')
      expect(typeof backup.version).toBe('number')
      expect(backup.version).toBeGreaterThanOrEqual(1)
    })

    it('should include timestamp (exportTimestamp) field in backup payload', async () => {
      const tasks = [createTestTask()]

      const backup = await createBackupPayload(tasks)

      expect(backup).toHaveProperty('exportTimestamp')
      expect(typeof backup.exportTimestamp).toBe('string')

      // Should be valid ISO date string
      const date = new Date(backup.exportTimestamp)
      expect(date.getTime()).not.toBeNaN()
    })

    it('should include checksum field in backup payload', async () => {
      const tasks = [createTestTask()]

      const backup = await createBackupPayload(tasks)

      expect(backup).toHaveProperty('checksum')
      expect(typeof backup.checksum).toBe('string')
      expect(backup.checksum.length).toBe(64) // SHA-256 hex
      expect(backup.checksum).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should include tasks array in backup payload', async () => {
      const tasks = [
        createTestTask({ id: 'task-1', name: 'Task 1' }),
        createTestTask({ id: 'task-2', name: 'Task 2' }),
        createTestTask({ id: 'task-3', name: 'Task 3' })
      ]

      const backup = await createBackupPayload(tasks)

      expect(backup).toHaveProperty('tasks')
      expect(Array.isArray(backup.tasks)).toBe(true)
      expect(backup.tasks).toHaveLength(3)
      expect(backup.tasks[0].name).toBe('Task 1')
    })

    it('should produce different checksum for different task data', async () => {
      const tasks1 = [createTestTask({ id: 'task-1', name: 'Task 1' })]
      const tasks2 = [createTestTask({ id: 'task-1', name: 'Task 2' })]

      const backup1 = await createBackupPayload(tasks1)
      const backup2 = await createBackupPayload(tasks2)

      expect(backup1.checksum).not.toBe(backup2.checksum)
    })

    it('should handle empty tasks array', async () => {
      const tasks: Task[] = []

      const backup = await createBackupPayload(tasks)

      expect(backup.version).toBeGreaterThanOrEqual(1)
      expect(backup.exportTimestamp).toBeDefined()
      expect(backup.checksum).toBeDefined()
      expect(backup.tasks).toHaveLength(0)
    })

    it('should preserve all task properties in backup', async () => {
      const task = createTestTask({
        id: 'task-42',
        name: 'Complex Task',
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-20T10:00:00.000Z',
          nextDueDate: '2025-12-27T10:00:00.000Z'
        },
        deadline: '2025-12-31T23:59:59.000Z',
        dependsOnId: 'task-1'
      })

      const backup = await createBackupPayload([task])

      expect(backup.tasks[0]).toEqual(task)
    })
  })

  describe('validateBackupPayload', () => {
    it('should validate a correct backup payload', async () => {
      const tasks = [createTestTask()]
      const backup = await createBackupPayload(tasks)

      const isValid = await validateBackupPayload(backup)

      expect(isValid).toBe(true)
    })

    it('should reject payload with wrong checksum', async () => {
      const tasks = [createTestTask()]
      const backup = await createBackupPayload(tasks)

      // Tamper with checksum
      backup.checksum = 'invalid-checksum-' + 'a'.repeat(48)

      const isValid = await validateBackupPayload(backup)

      expect(isValid).toBe(false)
    })

    it('should reject payload with tampered tasks', async () => {
      const tasks = [createTestTask()]
      const backup = await createBackupPayload(tasks)

      // Tamper with tasks after checksum was generated
      backup.tasks[0].name = 'Tampered Name'

      const isValid = await validateBackupPayload(backup)

      expect(isValid).toBe(false)
    })

    it('should reject payload missing required fields', async () => {
      const invalidPayload = {
        version: 1,
        tasks: []
        // Missing exportTimestamp and checksum
      } as unknown as GoogleDriveBackup

      const isValid = await validateBackupPayload(invalidPayload)

      expect(isValid).toBe(false)
    })
  })

  describe('parseBackupPayload', () => {
    it('should parse valid JSON string to backup object', async () => {
      const tasks = [createTestTask()]
      const backup = await createBackupPayload(tasks)
      const jsonString = JSON.stringify(backup)

      const parsed = parseBackupPayload(jsonString)

      expect(parsed).not.toBeNull()
      expect(parsed?.version).toBe(backup.version)
      expect(parsed?.tasks).toHaveLength(1)
    })

    it('should return null for invalid JSON', () => {
      const parsed = parseBackupPayload('not valid json')

      expect(parsed).toBeNull()
    })

    it('should return null for JSON without required fields', () => {
      const parsed = parseBackupPayload('{"foo": "bar"}')

      expect(parsed).toBeNull()
    })

    it('should return null for empty string', () => {
      const parsed = parseBackupPayload('')

      expect(parsed).toBeNull()
    })
  })
})
