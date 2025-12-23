/**
 * Unit tests for urgency calculation
 * Per tasks.md T049d: Tests for urgency service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { calculateUrgency, normalizeUrgency } from '@/services/urgency'
import type { Task } from '@/types/task'

/**
 * Helper to create a test task
 */
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    status: 'active',
    priority: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

describe('Urgency Calculation', () => {
  describe('T049d - Calculate urgency returns positive for overdue, negative for future', () => {
    beforeEach(() => {
      // Use a fixed date for consistent testing
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-23T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return positive value for overdue recurring task', () => {
      // Next due date was 5 days ago
      const overdueDate = new Date('2025-12-18T12:00:00.000Z')

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-11T12:00:00.000Z',
          nextDueDate: overdueDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(5) // 5 days overdue
      expect(urgency).toBeGreaterThan(0)
    })

    it('should return negative value for future recurring task', () => {
      // Next due date is 3 days in the future
      const futureDate = new Date('2025-12-26T12:00:00.000Z')

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-19T12:00:00.000Z',
          nextDueDate: futureDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(-3) // 3 days until due
      expect(urgency).toBeLessThan(0)
    })

    it('should return 0 for task due today', () => {
      // Next due date is today
      const todayDate = new Date('2025-12-23T00:00:00.000Z')

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-16T12:00:00.000Z',
          nextDueDate: todayDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(0) // Due today
    })

    it('should return 0 for non-recurring task without deadline', () => {
      const task = createTestTask({
        type: 'one-off'
        // No deadline
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(0)
    })

    it('should return positive for one-off task with past deadline', () => {
      const pastDeadline = new Date('2025-12-20T12:00:00.000Z') // 3 days ago

      const task = createTestTask({
        type: 'one-off',
        deadline: pastDeadline.toISOString()
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(3) // 3 days past deadline
      expect(urgency).toBeGreaterThan(0)
    })

    it('should return negative for one-off task with future deadline', () => {
      const futureDeadline = new Date('2025-12-28T12:00:00.000Z') // 5 days away

      const task = createTestTask({
        type: 'one-off',
        deadline: futureDeadline.toISOString()
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(-5) // 5 days until deadline
      expect(urgency).toBeLessThan(0)
    })

    it('should calculate correctly for task 1 day overdue', () => {
      const yesterdayDate = new Date('2025-12-22T12:00:00.000Z')

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-21T12:00:00.000Z',
          nextDueDate: yesterdayDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(1) // 1 day overdue
    })

    it('should calculate correctly for task due tomorrow', () => {
      const tomorrowDate = new Date('2025-12-24T12:00:00.000Z')

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 2,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-22T12:00:00.000Z',
          nextDueDate: tomorrowDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(-1) // Due in 1 day
    })

    it('should handle project tasks same as one-off (no recurring urgency)', () => {
      const task = createTestTask({
        type: 'project',
        projectSession: {
          minSessionDurationMinutes: 30
        }
      })

      const urgency = calculateUrgency(task)

      expect(urgency).toBe(0) // No urgency for project without deadline
    })

    it('should normalize urgency to 0-1 range for scoring', () => {
      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-09T12:00:00.000Z',
          nextDueDate: '2025-12-16T12:00:00.000Z' // 7 days overdue
        }
      })

      const urgency = calculateUrgency(task)
      const normalized = normalizeUrgency(urgency)

      expect(urgency).toBe(7)
      expect(normalized).toBeGreaterThanOrEqual(0)
      expect(normalized).toBeLessThanOrEqual(1)
    })

    it('should cap normalized urgency at 1 for very overdue tasks', () => {
      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: '2025-11-23T12:00:00.000Z',
          nextDueDate: '2025-11-30T12:00:00.000Z' // 23 days overdue
        }
      })

      const urgency = calculateUrgency(task)
      const normalized = normalizeUrgency(urgency)

      expect(urgency).toBe(23)
      expect(normalized).toBe(1) // Capped at 1
    })

    it('should return 0 normalized urgency for future tasks', () => {
      const futureDate = new Date('2025-12-30T12:00:00.000Z') // 7 days away

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 14,
          intervalUnit: 'days',
          lastCompletedDate: '2025-12-16T12:00:00.000Z',
          nextDueDate: futureDate.toISOString()
        }
      })

      const urgency = calculateUrgency(task)
      const normalized = normalizeUrgency(urgency)

      expect(urgency).toBe(-7)
      expect(normalized).toBe(0) // No urgency contribution for future tasks
    })
  })
})
