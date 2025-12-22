/**
 * Suggestion Types - Interfaces for suggestion engine
 * Per data-model.md specification
 */

import type { EffortLevel, Location, Task } from './task'

/**
 * Context filters for narrowing suggestions
 */
export interface ContextFilters {
  /** Filter by effort level */
  effortLevel?: EffortLevel
  /** Filter by location */
  location?: Location
}

/**
 * Context provided when requesting suggestions
 */
export interface SuggestionContext {
  /** Available time in minutes */
  availableTimeMinutes: number
  /** Optional context filters */
  contextFilters?: ContextFilters
}

/**
 * Scoring factors for a task suggestion
 */
export interface ScoringFactors {
  /** Urgency score (linear: daysOverdue or -daysUntilDue) */
  urgency: number
  /** Deadline proximity score (1 / daysUntilDeadline, normalized) */
  deadlineProximity: number | null
  /** User-set priority (normalized 0-1) */
  priority: number
  /** Count of times dismissed (normalized) */
  postponements: number
  /** How well task fits available time (0-1) */
  timeMatch: number
  /** Match with user's effort filter (0-1, null if no filter) */
  effortMatch: number | null
  /** Match with user's location filter (0-1, null if no filter) */
  locationMatch: number | null
}

/**
 * Scored task with ranking information
 */
export interface TaskScore {
  /** Task ID */
  taskId: number
  /** Full task object */
  task: Task
  /** Overall score (0-1 normalized) */
  score: number
  /** Urgency value for tiebreaking */
  urgency: number
  /** Human-readable explanation */
  reason: string
  /** Individual scoring factors */
  factors: ScoringFactors
}

/**
 * Result of suggestion generation
 */
export interface SuggestionResult {
  /** Ranked task suggestions (max 5) */
  suggestions: TaskScore[]
  /** Number of tasks that matched filters */
  filteredCount: number
  /** Total active tasks in system */
  totalActiveCount: number
  /** Optional message (e.g., "No tasks fit in 30 minutes") */
  message?: string
}

/**
 * Action taken on a suggestion
 */
export interface SuggestionAction {
  /** Action type */
  type: 'completed' | 'dismissed' | 'postponed'
  /** Task ID action was taken on */
  taskId?: number
  /** Timestamp of action (ISO date string) */
  timestamp: string
}

/**
 * Stored suggestion session
 */
export interface SuggestionSession {
  /** Auto-increment primary key */
  id?: number
  /** Session timestamp (ISO date string) */
  timestamp: string
  /** Available time declared by user */
  availableTimeMinutes: number
  /** Context filters used */
  contextFilters?: ContextFilters
  /** Generated suggestions with scores */
  suggestions: Array<{
    taskId: number
    score: number
    urgency: number
    reason: string
  }>
  /** Action taken on suggestion (if any) */
  actionTaken?: SuggestionAction
}
