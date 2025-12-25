/**
 * Unit tests for validation utilities
 * T032a, T032b, T032d
 */

import { describe, it, expect } from 'vitest'
import { validateTask, detectCircularDependency } from '@/utils/validation'
import type { CreateTaskInput, Task, Priority } from '@/types/task'

describe('validateTask', () => {
  // Helper to create valid base input
  const validInput: CreateTaskInput = {
    name: 'Test Task',
    type: 'one-off',
    timeEstimateMinutes: 30,
    effortLevel: 'medium',
    location: 'home',
    priority: 'important'
  }

  describe('T032a: time estimate validation', () => {
    it('rejects time estimate less than 1 minute', () => {
      const input = { ...validInput, timeEstimateMinutes: 0 }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Time estimate must be between 1 and 480 minutes')
    })

    it('rejects time estimate greater than 480 minutes', () => {
      const input = { ...validInput, timeEstimateMinutes: 481 }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Time estimate must be between 1 and 480 minutes')
    })

    it('rejects negative time estimate', () => {
      const input = { ...validInput, timeEstimateMinutes: -10 }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Time estimate must be between 1 and 480 minutes')
    })

    it('accepts time estimate of exactly 1 minute', () => {
      const input = { ...validInput, timeEstimateMinutes: 1 }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts time estimate of exactly 480 minutes', () => {
      const input = { ...validInput, timeEstimateMinutes: 480 }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accepts time estimate within valid range', () => {
      const input = { ...validInput, timeEstimateMinutes: 60 }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('T032b: mandatory fields validation', () => {
    it('rejects missing name', () => {
      const input = { ...validInput, name: '' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('name'))).toBe(true)
    })

    it('rejects missing type', () => {
      const input = { ...validInput, type: undefined as unknown as 'one-off' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('type'))).toBe(true)
    })

    it('rejects invalid type value', () => {
      const input = { ...validInput, type: 'invalid' as 'one-off' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('type'))).toBe(true)
    })

    it('rejects missing effort level', () => {
      const input = { ...validInput, effortLevel: undefined as unknown as 'low' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('effort'))).toBe(true)
    })

    it('rejects invalid effort level value', () => {
      const input = { ...validInput, effortLevel: 'extreme' as 'low' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('effort'))).toBe(true)
    })

    it('rejects missing location', () => {
      const input = { ...validInput, location: undefined as unknown as 'home' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('location'))).toBe(true)
    })

    it('rejects invalid location value', () => {
      const input = { ...validInput, location: 'office' as 'home' }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('location'))).toBe(true)
    })

    it('accepts all valid mandatory fields', () => {
      const result = validateTask(validInput)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('collects multiple validation errors', () => {
      const input = {
        name: '',
        type: undefined as unknown as 'one-off',
        timeEstimateMinutes: 0,
        effortLevel: undefined as unknown as 'low',
        location: undefined as unknown as 'home',
        priority: 'important' as Priority
      }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('recurring task validation', () => {
    it('rejects recurring type without pattern', () => {
      const input: CreateTaskInput = {
        ...validInput,
        type: 'recurring'
      }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('recurring'))).toBe(true)
    })

    it('accepts recurring type with valid pattern', () => {
      const input: CreateTaskInput = {
        ...validInput,
        type: 'recurring',
        recurringPattern: {
          intervalValue: 7,
          intervalUnit: 'days',
          lastCompletedDate: new Date().toISOString()
        }
      }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
    })
  })

  describe('priority validation', () => {
    it('rejects invalid priority value', () => {
      const input = { ...validInput, priority: 'urgent' as Priority }
      const result = validateTask(input)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('priority'))).toBe(true)
    })

    it('accepts priority of optional', () => {
      const input = { ...validInput, priority: 'optional' as Priority }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
    })

    it('accepts priority of important', () => {
      const input = { ...validInput, priority: 'important' as Priority }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
    })

    it('accepts priority of critical', () => {
      const input = { ...validInput, priority: 'critical' as Priority }
      const result = validateTask(input)

      expect(result.valid).toBe(true)
    })
  })
})

describe('T032d: detectCircularDependency', () => {
  // Helper to create tasks with IDs
  function createTask(id: string, dependsOnId?: string): Task {
    return {
      id,
      name: `Task ${id}`,
      type: 'one-off',
      timeEstimateMinutes: 30,
      effortLevel: 'medium',
      location: 'home',
      status: 'active',
      priority: 'important',
      dependsOnId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  it('returns true for A→B→A circular chain', () => {
    // Task 1 depends on Task 2, Task 2 depends on Task 1
    const tasks: Task[] = [
      createTask('1', '2'), // Task 1 depends on Task 2
      createTask('2') // Task 2 has no dependency yet
    ]

    // If we try to make Task 2 depend on Task 1, it creates a cycle
    const wouldCreateCycle = detectCircularDependency('2', '1', tasks)

    expect(wouldCreateCycle).toBe(true)
  })

  it('returns true for A→B→C→A longer chain', () => {
    const tasks: Task[] = [
      createTask('1', '2'), // 1 → 2
      createTask('2', '3'), // 2 → 3
      createTask('3') // 3 has no dependency yet
    ]

    // If we try to make Task 3 depend on Task 1, it creates a cycle
    const wouldCreateCycle = detectCircularDependency('3', '1', tasks)

    expect(wouldCreateCycle).toBe(true)
  })

  it('returns true when task depends on itself', () => {
    const tasks: Task[] = [createTask('1')]

    // Task 1 trying to depend on itself
    const wouldCreateCycle = detectCircularDependency('1', '1', tasks)

    expect(wouldCreateCycle).toBe(true)
  })

  it('returns false for valid dependency chain', () => {
    const tasks: Task[] = [
      createTask('1'), // No dependency
      createTask('2', '1') // 2 depends on 1
    ]

    // Task 3 depending on Task 2 is fine (chain: 3 → 2 → 1)
    const wouldCreateCycle = detectCircularDependency('3', '2', tasks)

    expect(wouldCreateCycle).toBe(false)
  })

  it('returns false for new task with dependency', () => {
    const tasks: Task[] = [createTask('1'), createTask('2')]

    // New task (undefined ID) depending on existing task
    const wouldCreateCycle = detectCircularDependency(undefined, '1', tasks)

    expect(wouldCreateCycle).toBe(false)
  })

  it('returns false when no dependencies exist', () => {
    const tasks: Task[] = [createTask('1'), createTask('2'), createTask('3')]

    // No existing dependencies, so no cycle possible
    const wouldCreateCycle = detectCircularDependency('2', '1', tasks)

    expect(wouldCreateCycle).toBe(false)
  })
})
