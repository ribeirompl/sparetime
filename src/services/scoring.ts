/**
 * Scoring Algorithm - Equal-weighted scoring for task suggestions
 * Per research.md - uses equal weighting for all factors with urgency tiebreaker
 */

import type { Task } from '@/types/task'
import type { SuggestionContext, ScoringFactors, TaskScore } from '@/types/suggestion'
import { calculateUrgency, normalizeUrgency } from './urgency'

/**
 * Maximum days to consider for deadline proximity normalization
 */
const MAX_DEADLINE_DAYS = 30

/**
 * Calculate the overall score for a task given a suggestion context
 *
 * @param task - The task to score
 * @param context - The suggestion context (available time, filters)
 * @returns Normalized score between 0 and 1
 */
export function calculateScore(task: Task, context: SuggestionContext): number {
  const factors = calculateFactors(task, context)

  // Get all applicable (non-null) factor values
  const applicableFactors: number[] = []

  // Always included factors
  applicableFactors.push(factors.priority)
  applicableFactors.push(factors.timeMatch)
  applicableFactors.push(normalizeUrgency(factors.urgency))
  applicableFactors.push(factors.postponements)

  // Conditionally included factors
  if (factors.deadlineProximity !== null) {
    applicableFactors.push(factors.deadlineProximity)
  }
  if (factors.effortMatch !== null) {
    applicableFactors.push(factors.effortMatch)
  }
  if (factors.locationMatch !== null) {
    applicableFactors.push(factors.locationMatch)
  }

  // Equal weighting: average all applicable factors
  if (applicableFactors.length === 0) {
    return 0
  }

  const sum = applicableFactors.reduce((acc, val) => acc + val, 0)
  const score = sum / applicableFactors.length

  // Ensure score is normalized to 0-1
  return normalizeScore(score)
}

/**
 * Calculate individual scoring factors for a task
 *
 * @param task - The task to analyze
 * @param context - The suggestion context
 * @returns Scoring factors object
 */
export function calculateFactors(task: Task, context: SuggestionContext): ScoringFactors {
  const urgency = calculateUrgency(task)

  return {
    urgency,
    deadlineProximity: calculateDeadlineProximity(task),
    priority: normalizePriority(task.priority),
    postponements: calculatePostponementScore(task),
    timeMatch: calculateTimeMatch(task.timeEstimateMinutes, context.availableTimeMinutes),
    effortMatch: calculateEffortMatch(task, context),
    locationMatch: calculateLocationMatch(task, context)
  }
}

/**
 * Normalize a score to ensure it's between 0 and 1
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score))
}

/**
 * Compare two task scores for sorting
 * Higher scores come first. Uses urgency as tiebreaker when scores are within 0.01
 *
 * @param a - First task score
 * @param b - Second task score
 * @returns Negative if a should come first, positive if b should come first
 */
export function compareTasks(a: TaskScore, b: TaskScore): number {
  const scoreDiff = b.score - a.score

  // If scores are within 0.01, use urgency as tiebreaker
  if (Math.abs(scoreDiff) < 0.01) {
    // Higher urgency (more overdue) comes first
    return b.urgency - a.urgency
  }

  return scoreDiff
}

/**
 * Calculate deadline proximity factor (0-1)
 * Higher value = closer deadline
 */
function calculateDeadlineProximity(task: Task): number | null {
  if (!task.deadline) {
    return null
  }

  const deadline = new Date(task.deadline)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)

  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntil <= 0) {
    // Past deadline or due today = max urgency
    return 1
  }

  if (daysUntil >= MAX_DEADLINE_DAYS) {
    // Far in the future = no urgency
    return 0
  }

  // Linear interpolation: closer deadline = higher score
  return 1 - (daysUntil / MAX_DEADLINE_DAYS)
}

/**
 * Normalize priority (0-10) to 0-1 scale
 */
function normalizePriority(priority: number): number {
  return Math.max(0, Math.min(1, priority / 10))
}

/**
 * Calculate postponement score (placeholder for future implementation)
 * Currently returns 0 as we don't track postponements yet
 */
function calculatePostponementScore(_task: Task): number {
  // TODO: Implement when postponement tracking is added
  // Higher postponement count = higher score (need to get it done)
  return 0
}

/**
 * Calculate how well the task fits the available time (0-1)
 * Tasks that use more of the available time score higher
 */
function calculateTimeMatch(taskTime: number, availableTime: number): number {
  if (availableTime <= 0) {
    return 0
  }

  // Ratio of task time to available time
  const ratio = taskTime / availableTime

  // Cap at 1.0 (task exactly fits or would slightly exceed)
  return Math.min(1, ratio)
}

/**
 * Calculate effort level match factor (0-1)
 * Returns null if no effort filter is applied
 */
function calculateEffortMatch(task: Task, context: SuggestionContext): number | null {
  if (!context.contextFilters?.effortLevel) {
    return null
  }

  return task.effortLevel === context.contextFilters.effortLevel ? 1 : 0
}

/**
 * Calculate location match factor (0-1)
 * Returns null if no location filter is applied
 * 'anywhere' tasks match all location filters
 */
function calculateLocationMatch(task: Task, context: SuggestionContext): number | null {
  if (!context.contextFilters?.location) {
    return null
  }

  // 'anywhere' tasks can be done anywhere
  if (task.location === 'anywhere') {
    return 1
  }

  return task.location === context.contextFilters.location ? 1 : 0
}

/**
 * Score and rank a list of tasks
 *
 * @param tasks - Tasks to score
 * @param context - Suggestion context
 * @returns Sorted array of task scores (highest first)
 */
export function scoreAndRankTasks(tasks: Task[], context: SuggestionContext): TaskScore[] {
  const scored: TaskScore[] = tasks.map(task => {
    const factors = calculateFactors(task, context)
    const score = calculateScore(task, context)

    return {
      taskId: task.id!,
      task,
      score,
      urgency: factors.urgency,
      reason: generateReason(task, context, factors),
      factors
    }
  })

  // Sort by score (descending) with urgency tiebreaker
  return scored.sort(compareTasks)
}

/**
 * Generate a human-readable reason for why a task is suggested
 */
function generateReason(task: Task, context: SuggestionContext, factors: ScoringFactors): string {
  const reasons: string[] = []

  // Time fit
  const percentOfTime = Math.round((task.timeEstimateMinutes / context.availableTimeMinutes) * 100)
  if (percentOfTime >= 80) {
    reasons.push(`uses ${percentOfTime}% of your time`)
  }

  // Priority
  if (task.priority >= 8) {
    reasons.push('high priority')
  }

  // Urgency for recurring/deadline tasks
  if (factors.urgency > 0) {
    reasons.push(`${Math.abs(factors.urgency)} day${Math.abs(factors.urgency) === 1 ? '' : 's'} overdue`)
  } else if (factors.urgency === 0 && (task.type === 'recurring' || task.deadline)) {
    reasons.push('due today')
  }

  // Deadline proximity
  if (task.deadline) {
    const deadline = new Date(task.deadline)
    const now = new Date()
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil <= 0) {
      reasons.push('deadline passed')
    } else if (daysUntil === 1) {
      reasons.push('deadline tomorrow')
    } else if (daysUntil <= 3) {
      reasons.push(`deadline in ${daysUntil} days`)
    }
  }

  // Context matches
  if (factors.effortMatch === 1) {
    reasons.push(`matches your ${context.contextFilters?.effortLevel} effort preference`)
  }
  if (factors.locationMatch === 1) {
    reasons.push(`can be done ${task.location === 'anywhere' ? 'anywhere' : 'at ' + task.location}`)
  }

  return reasons.length > 0 ? reasons.join(', ') : 'fits your available time'
}
