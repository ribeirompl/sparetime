/**
 * E2E tests for offline functionality
 * T032l
 */

import { test, expect } from '@playwright/test'

test.describe('Offline Functionality', () => {
  test('T032l: tasks persist when app goes offline and returns', async ({ page, context }) => {
    // Navigate to app
    await page.goto('/')
    await page.waitForSelector('[data-testid="tasks-view"]', { timeout: 10000 })

    // Add a task while online
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Offline Test Task')
    await page.selectOption('[data-testid="task-type-select"]', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '45')
    await page.selectOption('[data-testid="task-effort-select"]', 'medium')
    await page.selectOption('[data-testid="task-location-select"]', 'home')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify task is visible
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Offline Test Task' })).toBeVisible()

    // Go offline
    await context.setOffline(true)

    // Reload page while offline (should work with service worker)
    await page.reload()

    // App should still load and show the task
    await page.waitForSelector('[data-testid="tasks-view"]', { timeout: 15000 })
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Offline Test Task' })).toBeVisible()

    // Add another task while offline
    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Added While Offline')
    await page.selectOption('[data-testid="task-type-select"]', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '20')
    await page.selectOption('[data-testid="task-effort-select"]', 'low')
    await page.selectOption('[data-testid="task-location-select"]', 'anywhere')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify offline task is visible
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Added While Offline' })).toBeVisible()

    // Go back online
    await context.setOffline(false)

    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="tasks-view"]')

    // Both tasks should still be visible
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Offline Test Task' })).toBeVisible()
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Added While Offline' })).toBeVisible()
  })

  test('task edits made offline persist when coming back online', async ({ page, context }) => {
    // Navigate and add a task while online
    await page.goto('/')
    await page.waitForSelector('[data-testid="tasks-view"]', { timeout: 10000 })

    await page.click('[data-testid="add-task-button"]')
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Edit Me Offline')
    await page.selectOption('[data-testid="task-type-select"]', 'one-off')
    await page.fill('[data-testid="task-time-input"]', '30')
    await page.selectOption('[data-testid="task-effort-select"]', 'medium')
    await page.selectOption('[data-testid="task-location-select"]', 'home')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Go offline
    await context.setOffline(true)

    // Edit the task
    const taskCard = page.locator('[data-testid="task-card"]').filter({ hasText: 'Edit Me Offline' })
    await taskCard.click()
    await page.waitForSelector('[data-testid="task-form"]')
    await page.fill('[data-testid="task-name-input"]', 'Edited While Offline')
    await page.click('[data-testid="task-submit-button"]')
    await page.waitForSelector('[data-testid="task-form"]', { state: 'hidden' })

    // Verify edit is visible
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Edited While Offline' })).toBeVisible()

    // Go back online and reload
    await context.setOffline(false)
    await page.reload()
    await page.waitForSelector('[data-testid="tasks-view"]')

    // Edit should have persisted
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Edited While Offline' })).toBeVisible()
    await expect(page.locator('[data-testid="task-card"]').filter({ hasText: 'Edit Me Offline' })).not.toBeVisible()
  })
})
