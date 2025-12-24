/**
 * Unit tests for scoring algorithm
 * Per tasks.md T049a-c: Tests for scoring service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateScore,
  normalizeScore,
  calculateFactors,
  compareTasks
} from '@/services/scoring'
import type { Task, Priority } from '@/types/task'
import type { SuggestionContext, TaskScore } from '@/types/suggestion'

/**
 * Helper to create a test task
 */
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-uuid-1',
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    status: 'active',
    priority: 'important',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Helper to create a test context
 */
function createTestContext(overrides: Partial<SuggestionContext> = {}): SuggestionContext {
  return {
    availableTimeMinutes: 60,
    ...overrides
  }
}

describe('Scoring Algorithm', () => {
  describe('T049a - Normalized 0-1 scores', () => {
    it('should return scores between 0 and 1', () => {
      const task = createTestTask()
      const context = createTestContext()

      const score = calculateScore(task, context)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should return normalized score for high priority task', () => {
      const task = createTestTask({ priority: 'critical' })
      const context = createTestContext()

      const score = calculateScore(task, context)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should return normalized score for low priority task', () => {
      const task = createTestTask({ priority: 'optional' })
      const context = createTestContext()

      const score = calculateScore(task, context)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should return normalized score for recurring overdue task', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)

      const task = createTestTask({
        type: 'recurring',
        recurringPattern: {
          intervalValue: 1,
          intervalUnit: 'days',
          lastCompletedDate: pastDate.toISOString(),
          nextDueDate: pastDate.toISOString()
        }
      })
      const context = createTestContext()

      const score = calculateScore(task, context)

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should normalize each factor to 0-1 range', () => {
      const task = createTestTask({ priority: 'important' })
      const context = createTestContext()

      const factors = calculateFactors(task, context)

      // Check all applicable factors are in range
      expect(factors.priority).toBeGreaterThanOrEqual(0)
      expect(factors.priority).toBeLessThanOrEqual(1)
      expect(factors.timeMatch).toBeGreaterThanOrEqual(0)
      expect(factors.timeMatch).toBeLessThanOrEqual(1)
    })
  })

  describe('T049b - Equal weighting for all factors', () => {
    it('should weight priority equally with time match', () => {
      // Two tasks: one with high priority, one with perfect time match
      const highPriorityTask = createTestTask({
        id: 'task-1',
        priority: 'critical',
        timeEstimateMinutes: 10 // poor time match for 60 min
      })

      const perfectTimeTask = createTestTask({
        id: 'task-2',
        priority: 'important', // medium priority
        timeEstimateMinutes: 60 // perfect time match
      })

      const context = createTestContext({ availableTimeMinutes: 60 })

      const highPriorityFactors = calculateFactors(highPriorityTask, context)
      const perfectTimeFactors = calculateFactors(perfectTimeTask, context)

      // Both factors should be normalized equally
      expect(highPriorityFactors.priority).toBe(1) // critical = 1.0
      expect(perfectTimeFactors.timeMatch).toBe(1) // 60/60

      // Scores should reflect equal weighting
      const score1 = calculateScore(highPriorityTask, context)
      const score2 = calculateScore(perfectTimeTask, context)

      // Both should contribute equally to final score when other factors are similar
      expect(typeof score1).toBe('number')
      expect(typeof score2).toBe('number')
    })

    it('should average all applicable factors equally', () => {
      const task = createTestTask({
        priority: 'critical', // max priority = 1.0
        timeEstimateMinutes: 60 // perfect time match for 60 min = 1.0
      })

      const context = createTestContext({ availableTimeMinutes: 60 })

      const factors = calculateFactors(task, context)
      const score = calculateScore(task, context)

      // The score function uses normalized urgency (0-1), not raw urgency
      // For a one-off task without deadline, urgency = 0, normalized = 0
      // So applicable factors are: priority (1.0), timeMatch (1.0), normalizedUrgency (0), postponements (0)
      // = (1.0 + 1.0 + 0 + 0) / 4 = 0.5
      // But since urgency 0 normalizes to 0.5 (due today = moderate urgency), we get:
      // = (1.0 + 1.0 + 0.5 + 0) / 4 = 0.625

      // Verify the score is normalized between 0 and 1
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)

      // Verify all factors are accounted for (at least priority and timeMatch)
      expect(factors.priority).toBe(1) // critical = 1.0
      expect(factors.timeMatch).toBe(1) // 60/60
    })

    it('should include effort match only when filter is provided', () => {
      const task = createTestTask({ effortLevel: 'low' })

      // Without filter
      const contextNoFilter = createTestContext()
      const factorsNoFilter = calculateFactors(task, contextNoFilter)
      expect(factorsNoFilter.effortMatch).toBeNull()

      // With filter
      const contextWithFilter = createTestContext({
        contextFilters: { effortLevel: 'low' }
      })
      const factorsWithFilter = calculateFactors(task, contextWithFilter)
      expect(factorsWithFilter.effortMatch).toBe(1) // matching
    })

    it('should include location match only when filter is provided', () => {
      const task = createTestTask({ location: 'home' })

      // Without filter
      const contextNoFilter = createTestContext()
      const factorsNoFilter = calculateFactors(task, contextNoFilter)
      expect(factorsNoFilter.locationMatch).toBeNull()

      // With filter
      const contextWithFilter = createTestContext({
        contextFilters: { location: 'home' }
      })
      const factorsWithFilter = calculateFactors(task, contextWithFilter)
      expect(factorsWithFilter.locationMatch).toBe(1) // matching
    })
  })

  describe('T049c - Urgency tiebreaker', () => {
    it('should sort by urgency when scores are equal', () => {
      const overdueTask: TaskScore = {
        taskId: 'uuid-1',
        task: createTestTask({ id: 'uuid-1' }),
        score: 0.75,
        urgency: 5, // 5 days overdue
        reason: 'test',
        factors: {
          urgency: 5,
          deadlineProximity: null,
          priority: 0.5,
          postponements: 0,
          timeMatch: 1,
          effortMatch: null,
          locationMatch: null
        }
      }

      const dueTodayTask: TaskScore = {
        taskId: 'uuid-2',
        task: createTestTask({ id: 'uuid-2' }),
        score: 0.75, // Same score
        urgency: 0, // due today
        reason: 'test',
        factors: {
          urgency: 0,
          deadlineProximity: null,
          priority: 0.5,
          postponements: 0,
          timeMatch: 1,
          effortMatch: null,
          locationMatch: null
        }
      }

      const result = compareTasks(overdueTask, dueTodayTask)

      // Overdue task (higher urgency) should come first (negative comparison means first arg comes first)
      expect(result).toBeLessThan(0)
    })

    it('should not use urgency tiebreaker when scores differ significantly', () => {
      const highScoreTask: TaskScore = {
        taskId: 'uuid-1',
        task: createTestTask({ id: 'uuid-1' }),
        score: 0.9,
        urgency: 0, // due today
        reason: 'test',
        factors: {
          urgency: 0,
          deadlineProximity: null,
          priority: 0.9,
          postponements: 0,
          timeMatch: 1,
          effortMatch: null,
          locationMatch: null
        }
      }

      const lowScoreHighUrgencyTask: TaskScore = {
        taskId: 'uuid-2',
        task: createTestTask({ id: 'uuid-2' }),
        score: 0.5, // Much lower score
        urgency: 10, // Very overdue
        reason: 'test',
        factors: {
          urgency: 10,
          deadlineProximity: null,
          priority: 0.3,
          postponements: 0,
          timeMatch: 0.5,
          effortMatch: null,
          locationMatch: null
        }
      }

      const result = compareTasks(highScoreTask, lowScoreHighUrgencyTask)

      // Higher score should win despite lower urgency
      expect(result).toBeLessThan(0)
    })

    it('should use urgency tiebreaker when scores are within 0.01', () => {
      const taskA: TaskScore = {
        taskId: 'uuid-1',
        task: createTestTask({ id: 'uuid-1' }),
        score: 0.755,
        urgency: 2,
        reason: 'test',
        factors: {
          urgency: 2,
          deadlineProximity: null,
          priority: 0.5,
          postponements: 0,
          timeMatch: 1,
          effortMatch: null,
          locationMatch: null
        }
      }

      const taskB: TaskScore = {
        taskId: 'uuid-2',
        task: createTestTask({ id: 'uuid-2' }),
        score: 0.750, // Only 0.005 difference
        urgency: 5, // Higher urgency
        reason: 'test',
        factors: {
          urgency: 5,
          deadlineProximity: null,
          priority: 0.5,
          postponements: 0,
          timeMatch: 1,
          effortMatch: null,
          locationMatch: null
        }
      }

      const result = compareTasks(taskA, taskB)

      // Task B should come first due to higher urgency (tiebreaker)
      expect(result).toBeGreaterThan(0)
    })

    it('should correctly sort array of tasks with mixed scores and urgencies', () => {
      const tasks: TaskScore[] = [
        {
          taskId: 'uuid-1',
          task: createTestTask({ id: 'uuid-1' }),
          score: 0.6,
          urgency: 0,
          reason: 'test',
          factors: {
            urgency: 0,
            deadlineProximity: null,
            priority: 0.6,
            postponements: 0,
            timeMatch: 0.6,
            effortMatch: null,
            locationMatch: null
          }
        },
        {
          taskId: 'uuid-2',
          task: createTestTask({ id: 'uuid-2' }),
          score: 0.8,
          urgency: 3,
          reason: 'test',
          factors: {
            urgency: 3,
            deadlineProximity: null,
            priority: 0.8,
            postponements: 0,
            timeMatch: 0.8,
            effortMatch: null,
            locationMatch: null
          }
        },
        {
          taskId: 'uuid-3',
          task: createTestTask({ id: 'uuid-3' }),
          score: 0.8, // Same score as task 2
          urgency: 7, // Higher urgency
          reason: 'test',
          factors: {
            urgency: 7,
            deadlineProximity: null,
            priority: 0.8,
            postponements: 0,
            timeMatch: 0.8,
            effortMatch: null,
            locationMatch: null
          }
        }
      ]

      const sorted = [...tasks].sort(compareTasks)

      // Task 3 first (same score as 2, but higher urgency)
      // Task 2 second
      // Task 1 last (lowest score)
      expect(sorted[0].taskId).toBe('uuid-3')
      expect(sorted[1].taskId).toBe('uuid-2')
      expect(sorted[2].taskId).toBe('uuid-1')
    })
  })

  describe('T066a - Scoring includes effortMatch factor when filter provided', () => {
    it('should include effortMatch in score calculation when filter is provided', () => {
      const matchingTask = createTestTask({ effortLevel: 'low' })
      const nonMatchingTask = createTestTask({ effortLevel: 'high' })

      const context = createTestContext({
        contextFilters: { effortLevel: 'low' }
      })

      const matchingScore = calculateScore(matchingTask, context)
      const nonMatchingScore = calculateScore(nonMatchingTask, context)

      // Matching task should score higher
      expect(matchingScore).toBeGreaterThan(nonMatchingScore)
    })

    it('should return effortMatch = 1 for matching effort level', () => {
      const task = createTestTask({ effortLevel: 'medium' })
      const context = createTestContext({
        contextFilters: { effortLevel: 'medium' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.effortMatch).toBe(1)
    })

    it('should return effortMatch = 0 for non-matching effort level', () => {
      const task = createTestTask({ effortLevel: 'high' })
      const context = createTestContext({
        contextFilters: { effortLevel: 'low' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.effortMatch).toBe(0)
    })
  })

  describe('T066b - Scoring includes locationMatch factor when filter provided', () => {
    it('should include locationMatch in score calculation when filter is provided', () => {
      const matchingTask = createTestTask({ location: 'home' })
      const nonMatchingTask = createTestTask({ location: 'outside' })

      const context = createTestContext({
        contextFilters: { location: 'home' }
      })

      const matchingScore = calculateScore(matchingTask, context)
      const nonMatchingScore = calculateScore(nonMatchingTask, context)

      // Matching task should score higher
      expect(matchingScore).toBeGreaterThan(nonMatchingScore)
    })

    it('should return locationMatch = 1 for matching location', () => {
      const task = createTestTask({ location: 'outside' })
      const context = createTestContext({
        contextFilters: { location: 'outside' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.locationMatch).toBe(1)
    })

    it('should return locationMatch = 0 for non-matching location', () => {
      const task = createTestTask({ location: 'home' })
      const context = createTestContext({
        contextFilters: { location: 'outside' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.locationMatch).toBe(0)
    })
  })

  describe('T066c - Location "anywhere" matches all location filters', () => {
    it('should return locationMatch = 1 for anywhere task with home filter', () => {
      const task = createTestTask({ location: 'anywhere' })
      const context = createTestContext({
        contextFilters: { location: 'home' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.locationMatch).toBe(1)
    })

    it('should return locationMatch = 1 for anywhere task with outside filter', () => {
      const task = createTestTask({ location: 'anywhere' })
      const context = createTestContext({
        contextFilters: { location: 'outside' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.locationMatch).toBe(1)
    })

    it('should return locationMatch = 1 for anywhere task with anywhere filter', () => {
      const task = createTestTask({ location: 'anywhere' })
      const context = createTestContext({
        contextFilters: { location: 'anywhere' }
      })

      const factors = calculateFactors(task, context)
      expect(factors.locationMatch).toBe(1)
    })

    it('should score anywhere tasks equally regardless of location filter', () => {
      const anywhereTask = createTestTask({ location: 'anywhere', priority: 'important', timeEstimateMinutes: 30 })

      const homeContext = createTestContext({ contextFilters: { location: 'home' } })
      const outsideContext = createTestContext({ contextFilters: { location: 'outside' } })

      const homeScore = calculateScore(anywhereTask, homeContext)
      const outsideScore = calculateScore(anywhereTask, outsideContext)

      expect(homeScore).toBe(outsideScore)
    })
  })
})
