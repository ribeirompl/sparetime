import { describe, it, expect } from 'vitest'
import {
  detectCircularDependency,
  checkStorageQuota,
  formatBytes
} from '@/utils/validation'
import type { Task } from '@/types/task'
import { nowISO } from '@/utils/dateHelpers'

describe('Validation Edge Cases', () => {
  describe('detectCircularDependency - complex chains', () => {
    it('should detect cycle in long dependency chain', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-2',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-2',
          name: 'Task 2',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-3',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-3',
          name: 'Task 3',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
      ]

      // Try to make task-3 depend on task-1 (would create cycle: 1->2->3->1)
      const hasCycle = detectCircularDependency('task-3', 'task-1', tasks)
      expect(hasCycle).toBe(true)
    })

    it('should allow dependency chain without cycle', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-2',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-2',
          name: 'Task 2',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-3',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-3',
          name: 'Task 3',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-4',
          name: 'Task 4',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
      ]

      // Try to make task-3 depend on task-4 (no cycle: 1->2->3->4)
      const hasCycle = detectCircularDependency('task-3', 'task-4', tasks)
      expect(hasCycle).toBe(false)
    })

    it('should handle missing tasks in dependency chain', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'missing-task',
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
      ]

      // Try to make task-1 depend on task-2 when its current dependency is missing
      const hasCycle = detectCircularDependency('task-1', 'task-2', tasks)
      expect(hasCycle).toBe(false)
    })

    it('should detect existing cycle in chain', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-2',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-2',
          name: 'Task 2',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-3',
          createdAt: nowISO(),
          updatedAt: nowISO()
        },
        {
          id: 'task-3',
          name: 'Task 3',
          type: 'one-off',
          timeEstimateMinutes: 30,
          effortLevel: 'medium',
          location: 'home',
          status: 'active',
          priority: 'important',
          dependsOnId: 'task-1', // Already creates cycle
          createdAt: nowISO(),
          updatedAt: nowISO()
        }
      ]

      // Even though there's already a cycle, our function should detect it
      const hasCycle = detectCircularDependency('task-3', 'task-1', tasks)
      expect(hasCycle).toBe(true)
    })
  })

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(5120)).toBe('5 KB')
    })

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(5242880)).toBe('5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
      expect(formatBytes(5368709120)).toBe('5 GB')
    })

    it('should format with decimals', () => {
      expect(formatBytes(1536)).toBe('1.5 KB')
      expect(formatBytes(2621440)).toBe('2.5 MB')
    })

    it('should handle large numbers', () => {
      const result = formatBytes(9999999999)
      expect(result).toContain('GB')
    })
  })

  describe('checkStorageQuota', () => {
    it('should return default values when storage API unavailable', async () => {
      const result = await checkStorageQuota()

      // Since storage API may or may not be available in test env,
      // just verify the structure is correct
      expect(result).toHaveProperty('usage')
      expect(result).toHaveProperty('quota')
      expect(result).toHaveProperty('percentUsed')
      expect(result).toHaveProperty('shouldWarn')

      expect(typeof result.usage).toBe('number')
      expect(typeof result.quota).toBe('number')
      expect(typeof result.percentUsed).toBe('number')
      expect(typeof result.shouldWarn).toBe('boolean')
    })

    it('should calculate percent used correctly when available', async () => {
      const result = await checkStorageQuota()

      // If we have quota data, verify the calculation
      if (result.quota > 0) {
        const expectedPercent = (result.usage / result.quota) * 100
        expect(result.percentUsed).toBeCloseTo(expectedPercent, 2)

        // Verify shouldWarn logic
        if (result.percentUsed > 80) {
          expect(result.shouldWarn).toBe(true)
        } else {
          expect(result.shouldWarn).toBe(false)
        }
      } else {
        // If no quota data, should not warn
        expect(result.shouldWarn).toBe(false)
      }
    })
  })
})
