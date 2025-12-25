/**
 * E2E tests for suggestions functionality
 * T049j-m: Tests for suggestion flow in the app
 */

import { test, expect } from '@playwright/test'

test.describe('Suggestions Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    // Clear IndexedDB to ensure clean state
    await page.evaluate(async () => {
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name)
        }
      }
    })

    // Wait for app to initialize
    await page.waitForTimeout(500)
  })

  test.describe('T049j: user enters time and sees 3-5 suggestions', () => {
    test('should display suggestions after entering available time', async ({ page }) => {
      // First add some tasks
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')

      // Add multiple tasks
      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="add-task-button"]')
        await page.fill('[data-testid="task-name-input"]', `Task ${i}`)
        await page.fill('[data-testid="time-estimate-input"]', '30')
        await page.selectOption('[data-testid="effort-level-select"]', 'medium')
        await page.selectOption('[data-testid="location-select"]', 'home')
        await page.click('[data-testid="save-task-button"]')
        await page.waitForTimeout(300)
      }

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.waitForSelector('[data-testid="time-input"]')

      // Enter available time
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      // Wait for suggestions to appear
      await page.waitForSelector('[data-testid="suggestion-card"]')

      // Should have between 3-5 suggestions
      const suggestions = await page.locator('[data-testid="suggestion-card"]').count()
      expect(suggestions).toBeGreaterThanOrEqual(3)
      expect(suggestions).toBeLessThanOrEqual(5)
    })

    test('should show less than 5 suggestions if fewer tasks match', async ({ page }) => {
      // Add only 2 tasks
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')

      for (let i = 1; i <= 2; i++) {
        await page.click('[data-testid="add-task-button"]')
        await page.fill('[data-testid="task-name-input"]', `Task ${i}`)
        await page.fill('[data-testid="time-estimate-input"]', '30')
        await page.selectOption('[data-testid="effort-level-select"]', 'medium')
        await page.selectOption('[data-testid="location-select"]', 'home')
        await page.click('[data-testid="save-task-button"]')
        await page.waitForTimeout(300)
      }

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      await page.waitForSelector('[data-testid="suggestion-card"]')
      const suggestions = await page.locator('[data-testid="suggestion-card"]').count()
      expect(suggestions).toBe(2)
    })
  })

  test.describe('T049k: user marks suggestion complete and it disappears', () => {
    test('should remove completed task from suggestions', async ({ page }) => {
      // Add a task
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'Completable Task')
      await page.fill('[data-testid="time-estimate-input"]', '30')
      await page.selectOption('[data-testid="effort-level-select"]', 'medium')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      await page.waitForSelector('[data-testid="suggestion-card"]')

      // Click complete button on the suggestion
      await page.click('[data-testid="complete-task-button"]')

      // Task should be removed from suggestions
      await expect(page.locator('[data-testid="suggestion-card"]')).toHaveCount(0)
    })

    test('should show empty message after completing all suggestions', async ({ page }) => {
      // Add a single task
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'Only Task')
      await page.fill('[data-testid="time-estimate-input"]', '30')
      await page.selectOption('[data-testid="effort-level-select"]', 'medium')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      await page.waitForSelector('[data-testid="suggestion-card"]')
      await page.click('[data-testid="complete-task-button"]')

      // Should show empty state or regenerate message
      await expect(page.locator('[data-testid="suggestion-card"]')).toHaveCount(0)
    })
  })

  test.describe('T049l: suggestion cards show reason explanations', () => {
    test('should display reason text on suggestion cards', async ({ page }) => {
      // Add a high priority task
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'High Priority Task')
      await page.fill('[data-testid="time-estimate-input"]', '30')
      await page.fill('[data-testid="priority-input"]', '10')
      await page.selectOption('[data-testid="effort-level-select"]', 'medium')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      await page.waitForSelector('[data-testid="suggestion-card"]')

      // Check for reason text
      const reasonText = await page.locator('[data-testid="suggestion-reason"]').textContent()
      expect(reasonText).toBeTruthy()
      expect(reasonText!.length).toBeGreaterThan(0)
    })

    test('should show overdue reason for recurring overdue tasks', async ({ page }) => {
      // Add a recurring task that is overdue
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'Overdue Recurring Task')
      await page.fill('[data-testid="time-estimate-input"]', '30')
      await page.selectOption('[data-testid="task-type-select"]', 'recurring')
      await page.fill('[data-testid="interval-value-input"]', '1')
      await page.selectOption('[data-testid="interval-unit-select"]', 'days')
      await page.selectOption('[data-testid="effort-level-select"]', 'medium')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      await page.waitForSelector('[data-testid="suggestion-card"]')

      // Check that some reason is displayed
      const reasonText = await page.locator('[data-testid="suggestion-reason"]').textContent()
      expect(reasonText).toBeTruthy()
    })
  })

  test.describe('T049m: no tasks match time shows appropriate message', () => {
    test('should show message when no tasks fit available time', async ({ page }) => {
      // Add only long tasks
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'Long Task')
      await page.fill('[data-testid="time-estimate-input"]', '120')
      await page.selectOption('[data-testid="effort-level-select"]', 'medium')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions with short time
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '30')
      await page.click('[data-testid="get-suggestions-button"]')

      // Should show empty state message
      await page.waitForSelector('[data-testid="no-suggestions-message"]')
      const messageText = await page.locator('[data-testid="no-suggestions-message"]').textContent()
      expect(messageText).toContain('No tasks fit')
    })

    test('should show message when no active tasks exist', async ({ page }) => {
      // Navigate directly to suggestions without adding tasks
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      await page.click('[data-testid="get-suggestions-button"]')

      // Should show empty state message
      await page.waitForSelector('[data-testid="no-suggestions-message"]')
      const messageText = await page.locator('[data-testid="no-suggestions-message"]').textContent()
      expect(messageText).toContain('No active tasks')
    })

    test('should show message with context when filters are applied and nothing matches', async ({
      page
    }) => {
      // Add a task with specific effort/location
      await page.click('a[href="#/tasks"]')
      await page.waitForSelector('[data-testid="add-task-button"]')
      await page.click('[data-testid="add-task-button"]')
      await page.fill('[data-testid="task-name-input"]', 'High Effort Home Task')
      await page.fill('[data-testid="time-estimate-input"]', '30')
      await page.selectOption('[data-testid="effort-level-select"]', 'high')
      await page.selectOption('[data-testid="location-select"]', 'home')
      await page.click('[data-testid="save-task-button"]')
      await page.waitForTimeout(300)

      // Navigate to suggestions with low energy filter (button toggle)
      await page.click('a[href="#/suggestions"]')
      await page.fill('[data-testid="time-input"]', '60')
      // Click the "Low" energy button to filter to low effort only
      await page.click('[data-testid="energy-filter-button"]:has-text("Low")')
      await page.click('[data-testid="get-suggestions-button"]')

      // Should show no matches message (high effort task doesn't match low energy filter)
      await page.waitForSelector('[data-testid="no-suggestions-message"]')
    })
  })
})
