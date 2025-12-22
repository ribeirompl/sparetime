/**
 * Suggestion Store - Pinia state management for suggestions
 * Per plan.md - handles suggestion generation and session storage
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db/database'
import type { Task } from '@/types/task'
import type {
  SuggestionContext,
  SuggestionResult,
  TaskScore,
  SuggestionSession
} from '@/types/suggestion'
import { useTaskStore } from './taskStore'
import { nowISO } from '@/utils/dateHelpers'

/**
 * Maximum number of suggestions to return
 */
const MAX_SUGGESTIONS = 5

/**
 * Minimum number of suggestions to aim for
 */
const MIN_SUGGESTIONS = 3

/**
 * Suggestion store for managing suggestion state and generation
 */
export const useSuggestionStore = defineStore('suggestion', () => {
  // State
  const currentSuggestions = ref<TaskScore[]>([])
  const lastContext = ref<SuggestionContext | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const message = ref<string | null>(null)

  // Getters
  const hasSuggestions = computed(() => currentSuggestions.value.length > 0)

  const suggestionCount = computed(() => currentSuggestions.value.length)

  // Actions

  /**
   * Generate suggestions based on available time and optional context filters
   *
   * @param context - Suggestion context with available time and optional filters
   * @returns SuggestionResult with ranked suggestions
   */
  async function generateSuggestions(context: SuggestionContext): Promise<SuggestionResult> {
    loading.value = true
    error.value = null
    message.value = null
    lastContext.value = context

    try {
      const taskStore = useTaskStore()

      // Ensure tasks are loaded
      if (taskStore.tasks.length === 0) {
        await taskStore.loadTasks()
      }

      const activeTasks = taskStore.activeTasks
      const totalActiveCount = activeTasks.length

      if (totalActiveCount === 0) {
        const result: SuggestionResult = {
          suggestions: [],
          filteredCount: 0,
          totalActiveCount: 0,
          message: 'No active tasks found. Add some tasks first!'
        }
        currentSuggestions.value = []
        message.value = result.message ?? null
        return result
      }

      // Filter tasks that fit in available time
      let filteredTasks = activeTasks.filter(
        (task) => task.timeEstimateMinutes <= context.availableTimeMinutes
      )

      // Apply context filters if provided
      if (context.contextFilters) {
        if (context.contextFilters.effortLevel) {
          filteredTasks = filteredTasks.filter(
            (task) => task.effortLevel === context.contextFilters!.effortLevel
          )
        }
        if (context.contextFilters.location) {
          // 'anywhere' tasks match any location filter
          filteredTasks = filteredTasks.filter(
            (task) =>
              task.location === context.contextFilters!.location || task.location === 'anywhere'
          )
        }
      }

      // Exclude tasks with incomplete dependencies
      filteredTasks = filteredTasks.filter((task) => {
        if (!task.dependsOnId) return true
        return !taskStore.hasIncompleteDependencies(task.id!)
      })

      const filteredCount = filteredTasks.length

      if (filteredCount === 0) {
        const result: SuggestionResult = {
          suggestions: [],
          filteredCount: 0,
          totalActiveCount,
          message: `No tasks fit in ${context.availableTimeMinutes} minutes with your current filters.`
        }
        currentSuggestions.value = []
        message.value = result.message ?? null
        return result
      }

      // Score and rank tasks
      // Note: Full scoring algorithm will be implemented in src/services/scoring.ts
      // For now, use basic scoring
      const scoredTasks: TaskScore[] = filteredTasks.map((task) => ({
        taskId: task.id!,
        task,
        score: calculateBasicScore(task, context),
        urgency: calculateBasicUrgency(task),
        reason: generateReason(task, context),
        factors: {
          urgency: calculateBasicUrgency(task),
          deadlineProximity: task.deadline ? 1 : null,
          priority: task.priority / 10,
          postponements: 0,
          timeMatch: 1 - (context.availableTimeMinutes - task.timeEstimateMinutes) / context.availableTimeMinutes,
          effortMatch: context.contextFilters?.effortLevel
            ? task.effortLevel === context.contextFilters.effortLevel
              ? 1
              : 0
            : null,
          locationMatch: context.contextFilters?.location
            ? task.location === context.contextFilters.location || task.location === 'anywhere'
              ? 1
              : 0
            : null
        }
      }))

      // Sort by score (descending), then by urgency (descending) for tiebreaking
      scoredTasks.sort((a, b) => {
        const scoreDiff = b.score - a.score
        if (Math.abs(scoreDiff) < 0.01) {
          return b.urgency - a.urgency
        }
        return scoreDiff
      })

      // Take top suggestions
      const suggestions = scoredTasks.slice(0, MAX_SUGGESTIONS)

      // Save session
      await saveSession(context, suggestions)

      currentSuggestions.value = suggestions

      const result: SuggestionResult = {
        suggestions,
        filteredCount,
        totalActiveCount
      }

      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to generate suggestions'
      console.error('Failed to generate suggestions:', e)
      return {
        suggestions: [],
        filteredCount: 0,
        totalActiveCount: 0,
        message: 'An error occurred while generating suggestions.'
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Basic score calculation (placeholder - full implementation in scoring.ts)
   */
  function calculateBasicScore(task: Task, context: SuggestionContext): number {
    let score = 0
    let factors = 0

    // Priority factor (0-1)
    score += task.priority / 10
    factors++

    // Time match factor (prefer tasks that use more of available time)
    const timeMatch = task.timeEstimateMinutes / context.availableTimeMinutes
    score += Math.min(timeMatch, 1)
    factors++

    // Urgency factor (for recurring tasks)
    const urgency = calculateBasicUrgency(task)
    if (urgency > 0) {
      score += Math.min(urgency / 7, 1) // Normalize by week
      factors++
    }

    // Deadline factor
    if (task.deadline) {
      const daysUntil = Math.max(0, (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      score += Math.max(0, 1 - daysUntil / 30) // Higher score for closer deadlines
      factors++
    }

    return factors > 0 ? score / factors : 0
  }

  /**
   * Basic urgency calculation (placeholder - full implementation in urgency.ts)
   */
  function calculateBasicUrgency(task: Task): number {
    if (task.type !== 'recurring' || !task.recurringPattern?.nextDueDate) {
      return 0
    }

    const nextDue = new Date(task.recurringPattern.nextDueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    nextDue.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays // Positive = overdue, Negative = future
  }

  /**
   * Generate human-readable reason for suggestion
   */
  function generateReason(task: Task, context: SuggestionContext): string {
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

    // Urgency for recurring tasks
    if (task.type === 'recurring' && task.recurringPattern?.nextDueDate) {
      const urgency = calculateBasicUrgency(task)
      if (urgency > 0) {
        reasons.push(`${urgency} day${urgency === 1 ? '' : 's'} overdue`)
      } else if (urgency === 0) {
        reasons.push('due today')
      }
    }

    // Deadline
    if (task.deadline) {
      const daysUntil = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntil <= 1) {
        reasons.push('deadline today')
      } else if (daysUntil <= 3) {
        reasons.push(`deadline in ${daysUntil} days`)
      }
    }

    return reasons.length > 0 ? reasons.join(', ') : 'fits your available time'
  }

  /**
   * Save suggestion session to IndexedDB
   */
  async function saveSession(context: SuggestionContext, suggestions: TaskScore[]): Promise<void> {
    const session: SuggestionSession = {
      timestamp: nowISO(),
      availableTimeMinutes: context.availableTimeMinutes,
      contextFilters: context.contextFilters,
      suggestions: suggestions.map((s) => ({
        taskId: s.taskId,
        score: s.score,
        urgency: s.urgency,
        reason: s.reason
      }))
    }

    await db.suggestionSessions.add(session)
  }

  /**
   * Clear current suggestions
   */
  function clearSuggestions(): void {
    currentSuggestions.value = []
    lastContext.value = null
    message.value = null
  }

  /**
   * Record action taken on a suggestion
   */
  async function recordAction(
    taskId: number,
    action: 'completed' | 'dismissed' | 'postponed'
  ): Promise<void> {
    // This would update the most recent session with the action taken
    // Implementation for tracking user behavior
  }

  return {
    // State
    currentSuggestions,
    lastContext,
    loading,
    error,
    message,

    // Getters
    hasSuggestions,
    suggestionCount,

    // Actions
    generateSuggestions,
    clearSuggestions,
    recordAction
  }
})
