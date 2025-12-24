/**
 * Suggestion Store - Pinia state management for suggestions
 * Per plan.md - handles suggestion generation and session storage
 */

import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { db } from '@/db/database'
import type {
  SuggestionContext,
  SuggestionResult,
  TaskScore,
  SuggestionSession
} from '@/types/suggestion'
import { useTaskStore } from './taskStore'
import { nowISO } from '@/utils/dateHelpers'
import { scoreAndRankTasks } from '@/services/scoring'

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
      // For project tasks, use minimum session duration instead of total time estimate
      let filteredTasks = activeTasks.filter((task) => {
        const effectiveTime = task.type === 'project' && task.projectSession
          ? task.projectSession.minSessionDurationMinutes
          : task.timeEstimateMinutes
        return effectiveTime <= context.availableTimeMinutes
      })

      // Apply context filters if provided
      if (context.contextFilters) {
        if (context.contextFilters.effortLevel) {
          // Effort filter shows tasks at or below the selected energy level
          // e.g., if user has 'medium' energy, show 'low' and 'medium' tasks
          const effortLevels: Record<string, number> = { low: 1, medium: 2, high: 3 }
          const maxEffort = effortLevels[context.contextFilters.effortLevel] || 3
          filteredTasks = filteredTasks.filter(
            (task) => (effortLevels[task.effortLevel] || 2) <= maxEffort
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

      // Score and rank tasks using the scoring service
      const scoredTasks = scoreAndRankTasks(filteredTasks, context)

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
   * Save suggestion session to IndexedDB
   */
  async function saveSession(context: SuggestionContext, suggestions: TaskScore[]): Promise<void> {
    const session: SuggestionSession = {
      timestamp: nowISO(),
      availableTimeMinutes: context.availableTimeMinutes,
      contextFilters: context.contextFilters ? toRaw(context.contextFilters) : undefined,
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
    taskId: string,
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
