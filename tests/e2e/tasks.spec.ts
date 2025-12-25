/**
 * E2E tests for task management
 * T032i, T032j, T032k
 */

import { test, expect, Page } from '@playwright/test'

// Helper function to click button-based form options by value
async function selectFormOption(page: Page, testId: string, value: string) {
  // Find the button with matching text content
  const buttons = page.locator(`[data-testid="${testId}"]`)
  const count = await buttons.count()

  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i)
    const text = await button.textContent()
    // Match by content (case-insensitive)
    if (text?.toLowerCase().includes(value.toLowerCase())) {
      await button.click()
      return
    }
  }
  throw new Error(`Could not find option "${value}" for ${testId}`)
}

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tasks view
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

    // Reload after clearing IndexedDB
    await page.reload()

    // Wait for app to load
    await page.waitForTimeout(1000)

    // Dismiss welcome dialog by clicking "Start Fresh"
    const startFreshButton = page.locator('[data-testid="start-fresh-button"]')
    if (await startFreshButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await startFreshButton.click()
      await page.waitForSelector('[data-testid="tasks-view"]', { timeout: 10000 })
    }
  })

  test('T032i: user adds one-off task via form and sees it in list', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')

    // Wait for form to appear
    await page.waitForSelector('[data-testid="task-form"]')

    // Fill in task details
    await page.fill('[data-testid="task-name-input"]', 'Buy groceries')
    // One-off is already selected by default, but click to be explicit
    await selectFormOption(page, 'task-type-select', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '30')
    await selectFormOption(page, 'task-effort-select', 'low')
    await selectFormOption(page, 'task-location-select', 'out')

    // Submit form
    await page.click('[data-testid="task-submit-button"]')

    // Wait for form to close
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task appears in list
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Buy groceries' })
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('30m')
    await expect(taskCard).toContainText('Low')
  })

  test('T032j: user adds recurring task with interval pattern', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')

    // Wait for form
    await page.waitForSelector('[data-testid="task-form"]')

    // Fill in task details for recurring task
    await page.fill('[data-testid="task-name-input"]', 'Water plants')
    await selectFormOption(page, 'task-type-select', 'recurring')

    // Recurring pattern fields should appear
    await page.waitForSelector('[data-testid="recurring-interval-input"]')
    await page.fill('[data-testid="recurring-interval-input"]', '3')
    await page.selectOption('[data-testid="recurring-unit-select"]', 'days')

    // Fill other required fields
    await page.fill('[data-testid="task-time-input"]', '15')
    await selectFormOption(page, 'task-effort-select', 'low')
    await selectFormOption(page, 'task-location-select', 'home')

    // Submit form
    await page.click('[data-testid="task-submit-button"]')

    // Wait for form to close
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task appears in list with recurring indicator
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Water plants' })
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('Recurring')
  })

  test('T032k: user edits task and changes persist after page reload', async ({ page }) => {
    // First, add a task
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Original Task Name')
    await selectFormOption(page, 'task-type-select', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '30')
    await selectFormOption(page, 'task-effort-select', 'med')
    await selectFormOption(page, 'task-location-select', 'home')
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
    await expect(updatedCard).toContainText('60m')

    // Original name should not exist
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Original Task Name' })).not.toBeVisible()
  })

  test('user deletes task and it disappears from list', async ({ page }) => {
    // First, add a task
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Task to Delete')
    await selectFormOption(page, 'task-type-select', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '15')
    await selectFormOption(page, 'task-effort-select', 'low')
    await selectFormOption(page, 'task-location-select', 'home')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task appears
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Task to Delete' })
    await expect(taskCard).toBeVisible()

    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept())

    // Open kebab menu first (the button with vertical dots)
    await taskCard.locator('button[aria-label*="More options"]').click()

    // Wait for menu to appear and click delete button
    await page.waitForSelector('[data-testid="task-delete-button"]')
    await page.click('[data-testid="task-delete-button"]')

    // Verify task is removed
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Task to Delete' })).not.toBeVisible()

    // Reload page and verify it's still gone
    await page.reload()
    await page.waitForSelector('[data-testid="tasks-view"]')
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Task to Delete' })).not.toBeVisible()
  })

  test('deadline field is only visible for one-off tasks', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')

    // For one-off type (default), deadline should be visible
    await selectFormOption(page, 'task-type-select', 'one-off')
    await expect(page.locator('[data-testid="task-deadline-input"]')).toBeVisible()

    // Switch to recurring - deadline should be hidden
    await selectFormOption(page, 'task-type-select', 'recurring')
    await expect(page.locator('[data-testid="task-deadline-input"]')).not.toBeVisible()

    // Switch to project - deadline should be hidden
    await selectFormOption(page, 'task-type-select', 'project')
    await expect(page.locator('[data-testid="task-deadline-input"]')).not.toBeVisible()

    // Switch back to one-off - deadline should be visible again
    await selectFormOption(page, 'task-type-select', 'one-off')
    await expect(page.locator('[data-testid="task-deadline-input"]')).toBeVisible()
  })

  test('deadline is cleared when task type changes from one-off', async ({ page }) => {
    // Click add task button
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')

    // Fill in one-off task with deadline
    await page.fill('[data-testid="task-name-input"]', 'Task with deadline')
    await selectFormOption(page, 'task-type-select', 'one-off')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('[data-testid="task-deadline-input"]', dateStr)
    await page.fill('[data-testid="task-time-input"]', '30')
    await selectFormOption(page, 'task-effort-select', 'med')
    await selectFormOption(page, 'task-location-select', 'home')

    // Switch to recurring - this should clear the deadline
    await selectFormOption(page, 'task-type-select', 'recurring')

    // Switch back to one-off - deadline should be empty
    await selectFormOption(page, 'task-type-select', 'one-off')
    const deadlineValue = await page.inputValue('[data-testid="task-deadline-input"]')
    expect(deadlineValue).toBe('')
  })

  test('filter tabs show vertical divider between All and type filters', async ({ page }) => {
    // Verify the filter container exists and has the divider structure
    const filterContainer = page.locator('.bg-gray-100.rounded-lg.p-1')
    await expect(filterContainer).toBeVisible()

    // Verify the divider element exists (vertical line between All and other filters)
    const divider = filterContainer.locator('.w-px.h-6.bg-gray-300')
    await expect(divider).toBeVisible()
  })
})
