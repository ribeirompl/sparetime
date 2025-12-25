/**
 * Unit tests for date helper utilities
 * T032c
 */

import { describe, it, expect } from 'vitest'
import {
  calculateNextDueDate,
  calculateNextDueDateFromPattern,
  calculateUrgency,
  isOverdue,
  isDueToday,
  isFuture,
  daysUntil
} from '@/utils/dateHelpers'

describe('T032c: calculateNextDueDate', () => {
  const baseDate = new Date('2024-01-15T12:00:00.000Z')

  describe('days interval', () => {
    it('correctly adds 1 day', () => {
      const result = calculateNextDueDate(baseDate, 1, 'days')
      expect(result.toISOString()).toContain('2024-01-16')
    })

    it('correctly adds 7 days', () => {
      const result = calculateNextDueDate(baseDate, 7, 'days')
      expect(result.toISOString()).toContain('2024-01-22')
    })

    it('correctly adds 30 days', () => {
      const result = calculateNextDueDate(baseDate, 30, 'days')
      expect(result.toISOString()).toContain('2024-02-14')
    })
  })

  describe('weeks interval', () => {
    it('correctly adds 1 week', () => {
      const result = calculateNextDueDate(baseDate, 1, 'weeks')
      expect(result.toISOString()).toContain('2024-01-22')
    })

    it('correctly adds 2 weeks', () => {
      const result = calculateNextDueDate(baseDate, 2, 'weeks')
      expect(result.toISOString()).toContain('2024-01-29')
    })

    it('correctly adds 4 weeks', () => {
      const result = calculateNextDueDate(baseDate, 4, 'weeks')
      expect(result.toISOString()).toContain('2024-02-12')
    })
  })

  describe('months interval', () => {
    it('correctly adds 1 month', () => {
      const result = calculateNextDueDate(baseDate, 1, 'months')
      expect(result.toISOString()).toContain('2024-02-15')
    })

    it('correctly adds 3 months', () => {
      const result = calculateNextDueDate(baseDate, 3, 'months')
      expect(result.toISOString()).toContain('2024-04-15')
    })

    it('correctly adds 12 months', () => {
      const result = calculateNextDueDate(baseDate, 12, 'months')
      expect(result.toISOString()).toContain('2025-01-15')
    })

    it('handles month-end edge case (Jan 31 + 1 month = Feb 28/29)', () => {
      const jan31 = new Date('2024-01-31T12:00:00.000Z')
      const result = calculateNextDueDate(jan31, 1, 'months')
      // In 2024 (leap year), Feb has 29 days, so Jan 31 + 1 month = Feb 29
      expect(result.toISOString()).toContain('2024-02-29')
    })

    it('handles month-end edge case in non-leap year', () => {
      const jan31 = new Date('2023-01-31T12:00:00.000Z')
      const result = calculateNextDueDate(jan31, 1, 'months')
      // In 2023 (non-leap year), Feb has 28 days
      expect(result.toISOString()).toContain('2023-02-28')
    })
  })

  describe('years interval', () => {
    it('correctly adds 1 year', () => {
      const result = calculateNextDueDate(baseDate, 1, 'years')
      expect(result.toISOString()).toContain('2025-01-15')
    })

    it('correctly adds 5 years', () => {
      const result = calculateNextDueDate(baseDate, 5, 'years')
      expect(result.toISOString()).toContain('2029-01-15')
    })

    it('handles leap year edge case (Feb 29 + 1 year)', () => {
      const feb29 = new Date('2024-02-29T12:00:00.000Z')
      const result = calculateNextDueDate(feb29, 1, 'years')
      // Feb 29, 2024 + 1 year = Feb 28, 2025 (2025 is not a leap year)
      expect(result.toISOString()).toContain('2025-02-28')
    })
  })

  describe('hours interval', () => {
    it('correctly adds 1 hour', () => {
      const result = calculateNextDueDate(baseDate, 1, 'hours')
      expect(result.toISOString()).toContain('13:00:00')
    })

    it('correctly adds 24 hours', () => {
      const result = calculateNextDueDate(baseDate, 24, 'hours')
      expect(result.toISOString()).toContain('2024-01-16')
    })
  })

  describe('ISO string input', () => {
    it('accepts ISO date string as input', () => {
      const result = calculateNextDueDate('2024-01-15T12:00:00.000Z', 7, 'days')
      expect(result.toISOString()).toContain('2024-01-22')
    })
  })
})

describe('calculateNextDueDateFromPattern', () => {
  it('returns ISO string', () => {
    const pattern = {
      intervalValue: 7,
      intervalUnit: 'days' as const,
      lastCompletedDate: '2024-01-15T12:00:00.000Z'
    }

    const result = calculateNextDueDateFromPattern(pattern)

    expect(typeof result).toBe('string')
    expect(result).toContain('2024-01-22')
  })
})

describe('calculateUrgency', () => {
  const today = new Date('2024-01-15T12:00:00.000Z')

  it('returns positive for overdue dates', () => {
    const overdue = '2024-01-10T12:00:00.000Z' // 5 days ago
    const result = calculateUrgency(overdue, today)

    expect(result).toBe(5)
    expect(result).toBeGreaterThan(0)
  })

  it('returns negative for future dates', () => {
    const future = '2024-01-20T12:00:00.000Z' // 5 days from now
    const result = calculateUrgency(future, today)

    expect(result).toBe(-5)
    expect(result).toBeLessThan(0)
  })

  it('returns 0 for today', () => {
    const result = calculateUrgency(today, today)

    expect(result).toBe(0)
  })

  it('handles Date object input', () => {
    const overdue = new Date('2024-01-10T12:00:00.000Z')
    const result = calculateUrgency(overdue, today)

    expect(result).toBe(5)
  })
})

describe('isOverdue', () => {
  const today = new Date('2024-01-15T12:00:00.000Z')

  it('returns true for past dates', () => {
    expect(isOverdue('2024-01-10T12:00:00.000Z', today)).toBe(true)
  })

  it('returns false for today', () => {
    expect(isOverdue('2024-01-15T00:00:00.000Z', today)).toBe(false)
  })

  it('returns false for future dates', () => {
    expect(isOverdue('2024-01-20T12:00:00.000Z', today)).toBe(false)
  })
})

describe('isDueToday', () => {
  const today = new Date('2024-01-15T12:00:00.000Z')

  it('returns true for today (same day)', () => {
    // Use same timezone to avoid startOfDay differences
    expect(isDueToday(new Date('2024-01-15T08:00:00.000Z'), today)).toBe(true)
    expect(isDueToday(new Date('2024-01-15T20:00:00.000Z'), today)).toBe(true)
  })

  it('returns false for yesterday', () => {
    expect(isDueToday('2024-01-14T12:00:00.000Z', today)).toBe(false)
  })

  it('returns false for tomorrow', () => {
    expect(isDueToday('2024-01-16T12:00:00.000Z', today)).toBe(false)
  })
})

describe('isFuture', () => {
  const today = new Date('2024-01-15T12:00:00.000Z')

  it('returns true for future dates', () => {
    expect(isFuture('2024-01-20T12:00:00.000Z', today)).toBe(true)
  })

  it('returns false for today', () => {
    // Same day should not be considered "future"
    expect(isFuture(new Date('2024-01-15T20:00:00.000Z'), today)).toBe(false)
  })

  it('returns false for past dates', () => {
    expect(isFuture('2024-01-10T12:00:00.000Z', today)).toBe(false)
  })
})

describe('daysUntil', () => {
  const today = new Date('2024-01-15T12:00:00.000Z')

  it('returns positive for future dates', () => {
    const result = daysUntil('2024-01-20T12:00:00.000Z', today)
    expect(result).toBe(5)
  })

  it('returns negative for past dates', () => {
    const result = daysUntil('2024-01-10T12:00:00.000Z', today)
    expect(result).toBe(-5)
  })

  it('returns 0 for today', () => {
    const result = daysUntil('2024-01-15T08:00:00.000Z', today)
    expect(result).toBe(0)
  })
})
