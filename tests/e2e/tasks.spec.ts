/**
 * E2E tests for task management
 * T032i, T032j, T032k
 */

import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tasks view
    await page.goto('/')
    // Wait for app to load
    await page.waitForSelector('[data-testid="tasks-view"]', { timeout: 10000 })
  })

  test('T032i: user adds one-off task via form and sees it in list', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')

    // Wait for form to appear
    await page.waitForSelector('[data-testid="task-form"]')

    // Fill in task details
    await page.fill('[data-testid="task-name-input"]', 'Buy groceries')
    await page.selectOption('[data-testid="task-type-select"]', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '30')
    await page.selectOption('[data-testid="task-effort-select"]', 'low')
    await page.selectOption('[data-testid="task-location-select"]', 'outside')

    // Submit form
    await page.click('[data-testid="task-submit-button"]')

    // Wait for form to close
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task appears in list
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Buy groceries' })
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('30 min')
    await expect(taskCard).toContainText('low')
  })

  test('T032j: user adds recurring task with interval pattern', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')

    // Wait for form
    await page.waitForSelector('[data-testid="task-form"]')

    // Fill in task details for recurring task
    await page.fill('[data-testid="task-name-input"]', 'Water plants')
    await page.selectOption('[data-testid="task-type-select"]', 'recurring')

    // Recurring pattern fields should appear
    await page.waitForSelector('[data-testid="recurring-interval-input"]')
    await page.fill('[data-testid="recurring-interval-input"]', '3')
    await page.selectOption('[data-testid="recurring-unit-select"]', 'days')

    // Fill other required fields
    await page.fill('[data-testid="task-time-input"]', '15')
    await page.selectOption('[data-testid="task-effort-select"]', 'low')
    await page.selectOption('[data-testid="task-location-select"]', 'home')

    // Submit form
    await page.click('[data-testid="task-submit-button"]')

    // Wait for form to close
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task appears in list with recurring indicator
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Water plants' })
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('recurring')
  })

  test('T032k: user edits task and changes persist after page reload', async ({ page }) => {
    // First, add a task
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Original Task Name')
    await page.selectOption('[data-testid="task-type-select"]', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '30')
    await page.selectOption('[data-testid="task-effort-select"]', 'medium')
    await page.selectOption('[data-testid="task-location-select"]', 'home')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Click on task to edit it
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Original Task Name' })
    await taskCard.click()

    // Wait for edit form
    await page.waitForSelector('[data-testid="task-form"]')

    // Change the task name
    await page.fill('[data-testid="task-name-input"]', 'Updated Task Name')
    await page.fill('[data-testid="task-time-input"]', '60')

    // Save changes
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify changes appear
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Updated Task Name' })).toBeVisible()

    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="tasks-view"]')

    // Verify changes persisted
    const updatedCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Updated Task Name' })
    await expect(updatedCard).toBeVisible()
    await expect(updatedCard).toContainText('60 min')

    // Original name should not exist
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Original Task Name' })).not.toBeVisible()
  })
})
