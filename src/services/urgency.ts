/**
 * Urgency Calculation - Linear urgency decay model
 * Per research.md - urgency = daysOverdue (positive) or -daysUntilDue (negative)
 */

import type { Task } from '@/types/task'

/**
 * Maximum days overdue for urgency normalization
 * Tasks more overdue than this are capped at 1.0 normalized urgency
 */
const MAX_OVERDUE_DAYS = 14

/**
 * Calculate the urgency value for a task
 *
 * Returns:
 * - Positive value: days overdue (more urgent)
 * - Zero: due today
 * - Negative value: days until due (less urgent, in the future)
 *
 * @param task - The task to calculate urgency for
 * @returns Urgency value in days
 */
export function calculateUrgency(task: Task): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // For recurring tasks, use nextDueDate
  if (task.type === 'recurring' && task.recurringPattern?.nextDueDate) {
    const nextDue = new Date(task.recurringPattern.nextDueDate)
    nextDue.setHours(0, 0, 0, 0)

    const diffMs = today.getTime() - nextDue.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // For tasks with deadlines, use deadline
  if (task.deadline) {
    const deadline = new Date(task.deadline)
    deadline.setHours(0, 0, 0, 0)

    const diffMs = today.getTime() - deadline.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // For one-off tasks without deadline, urgency is neutral (0)
  return 0
}

/**
 * Normalize urgency to a 0-1 scale for scoring
 *
 * - Overdue tasks (positive urgency) return value between 0 and 1
 * - Future tasks (negative urgency) return 0 (no urgency contribution)
 * - Due today (0) returns 0.5 (moderate urgency)
 *
 * @param urgency - Raw urgency value in days
 * @returns Normalized urgency between 0 and 1
 */
export function normalizeUrgency(urgency: number): number {
  if (urgency < 0) {
    // Future tasks have no urgency contribution
    return 0
  }

  if (urgency === 0) {
    // Due today = moderate urgency
    return 0.5
  }

  // Overdue tasks: scale from 0.5 to 1.0 based on days overdue
  // Cap at MAX_OVERDUE_DAYS
  const cappedOverdue = Math.min(urgency, MAX_OVERDUE_DAYS)
  return 0.5 + (cappedOverdue / MAX_OVERDUE_DAYS) * 0.5
}

/**
 * Get a human-readable urgency description
 *
 * @param urgency - Raw urgency value in days
 * @returns Human-readable string
 */
export function getUrgencyDescription(urgency: number): string {
  if (urgency > 0) {
    return `${urgency} day${urgency === 1 ? '' : 's'} overdue`
  } else if (urgency === 0) {
    return 'due today'
  } else {
    const daysUntil = Math.abs(urgency)
    return `due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
  }
}

/**
 * Get urgency level category for UI styling
 *
 * @param urgency - Raw urgency value in days
 * @returns Category: 'overdue' | 'due-soon' | 'upcoming' | 'none'
 */
export function getUrgencyLevel(urgency: number): 'overdue' | 'due-soon' | 'upcoming' | 'none' {
  if (urgency > 0) {
    return 'overdue'
  } else if (urgency === 0) {
    return 'due-soon'
  } else if (urgency >= -3) {
    return 'upcoming'
  }
  return 'none'
}
