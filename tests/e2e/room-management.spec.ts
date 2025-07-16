/**
 * Room Management E2E Tests - Real User Flow
 * 
 * Following Playwright best practices:
 * - Use locators instead of page.waitForSelector
 * - Use web-first assertions
 * - Avoid page.waitForTimeout
 * - Use role-based selectors when possible
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Room Management - Real User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simple authentication
    await loginAsAdmin(page)
    await page.goto('/admin/rooms')
    
    // Wait for page to load using specific heading (no emoji)
    await expect(page.getByRole('heading', { name: '図書室管理' })).toBeVisible()
  })

  test('displays room management interface correctly', async ({ page }) => {
    // Verify specific page heading
    await expect(page.getByRole('heading', { name: '図書室管理' })).toBeVisible()
    
    // Verify main content is visible
    await expect(page.getByRole('main')).toBeVisible()
    
    // Check for key UI elements that should be present
    await expect(page.getByText('新規図書室作成')).toBeVisible()
  })

  test('basic page elements load correctly', async ({ page }) => {
    // Verify page loads without critical errors
    await expect(page.getByRole('heading', { name: '図書室管理' })).toBeVisible()
    
    // Verify main content container
    await expect(page.getByRole('main')).toBeVisible()
    
    // This test verifies the basic page structure loads
    console.log('✅ Room management page basic structure verified')
  })

  test('handles page navigation correctly', async ({ page }) => {
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/admin\/rooms/)
    
    // Verify page heading
    await expect(page.getByRole('heading', { name: '図書室管理' })).toBeVisible()
    
    console.log('✅ Room management page navigation verified')
  })
})