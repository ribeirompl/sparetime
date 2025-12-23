import { describe, it, expect } from 'vitest'
import {
  isDueToday,
  isFuture,
  daysUntil,
  isOverdue
} from '@/utils/dateHelpers'

describe('DateHelpers Edge Cases', () => {
  describe('isDueToday', () => {
    it('should return true for today at midnight', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      expect(isDueToday(today)).toBe(true)
    })

    it('should return true for today at noon', () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      expect(isDueToday(today)).toBe(true)
    })

    it('should return true for today at end of day', () => {
      const today = new Date()
      today.setHours(23, 59, 59, 999)

      expect(isDueToday(today)).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isDueToday(yesterday)).toBe(false)
    })

    it('should return false for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isDueToday(tomorrow)).toBe(false)
    })

    it('should work with ISO string', () => {
      const today = new Date()
      expect(isDueToday(today.toISOString())).toBe(true)
    })

    it('should work with custom now parameter', () => {
      const customNow = new Date('2024-01-15T12:00:00Z')
      const testDate = new Date('2024-01-15T18:00:00Z')

      expect(isDueToday(testDate, customNow)).toBe(true)
    })
  })

  describe('isFuture', () => {
    it('should return true for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isFuture(tomorrow)).toBe(true)
    })

    it('should return true for next week', () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      expect(isFuture(nextWeek)).toBe(true)
    })

    it('should return false for today', () => {
      const today = new Date()
      expect(isFuture(today)).toBe(false)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isFuture(yesterday)).toBe(false)
    })

    it('should work with ISO string', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isFuture(tomorrow.toISOString())).toBe(true)
    })

    it('should work with custom now parameter', () => {
      const customNow = new Date('2024-01-15T12:00:00Z')
      const futureDate = new Date('2024-01-16T12:00:00Z')

      expect(isFuture(futureDate, customNow)).toBe(true)
    })
  })

  describe('isOverdue', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isOverdue(yesterday)).toBe(true)
    })

    it('should return true for last week', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)

      expect(isOverdue(lastWeek)).toBe(true)
    })

    it('should return false for today', () => {
      const today = new Date()
      expect(isOverdue(today)).toBe(false)
    })

    it('should return false for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isOverdue(tomorrow)).toBe(false)
    })

    it('should work with ISO string', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isOverdue(yesterday.toISOString())).toBe(true)
    })

    it('should work with custom now parameter', () => {
      const customNow = new Date('2024-01-15T12:00:00Z')
      const pastDate = new Date('2024-01-14T12:00:00Z')

      expect(isOverdue(pastDate, customNow)).toBe(true)
    })
  })

  describe('daysUntil', () => {
    it('should return positive days for future dates', () => {
      const today = new Date('2024-01-15')
      const future = new Date('2024-01-20')

      expect(daysUntil(future, today)).toBe(5)
    })

    it('should return negative days for past dates', () => {
      const today = new Date('2024-01-15')
      const past = new Date('2024-01-10')

      expect(daysUntil(past, today)).toBe(-5)
    })

    it('should return 0 for same day', () => {
      const today = new Date('2024-01-15T12:00:00')
      const sameDay = new Date('2024-01-15T18:00:00')

      expect(daysUntil(sameDay, today)).toBe(0)
    })

    it('should return 1 for tomorrow', () => {
      const today = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(daysUntil(tomorrow, today)).toBe(1)
    })

    it('should return -1 for yesterday', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(daysUntil(yesterday, today)).toBe(-1)
    })

    it('should work with ISO strings', () => {
      const today = new Date('2024-01-15')
      const future = new Date('2024-01-20')

      expect(daysUntil(future.toISOString(), today)).toBe(5)
    })

    it('should default to today when from parameter omitted', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Should be approximately 1 (may vary if test runs at midnight)
      const result = daysUntil(tomorrow)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(2)
    })

    it('should handle month boundaries', () => {
      const today = new Date('2024-01-31')
      const nextMonth = new Date('2024-02-05')

      expect(daysUntil(nextMonth, today)).toBe(5)
    })

    it('should handle year boundaries', () => {
      const today = new Date('2023-12-30')
      const nextYear = new Date('2024-01-03')

      expect(daysUntil(nextYear, today)).toBe(4)
    })
  })
})
