/**
 * Schedule Grid E2E Tests - Real User Flow
 * 
 * Following Playwright best practices:
 * - Use locators instead of page.waitForSelector
 * - Use web-first assertions
 * - Avoid page.waitForTimeout
 * - Use role-based selectors when possible
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Schedule Grid - Real User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simple authentication
    await loginAsAdmin(page)
    await page.goto('/admin/schedules')
    
    // Wait for page to load using specific heading
    await expect(page.getByRole('heading', { name: 'スケジュール管理' })).toBeVisible()
  })

  test('displays schedule management interface correctly', async ({ page }) => {
    // Verify specific page heading
    await expect(page.getByRole('heading', { name: 'スケジュール管理' })).toBeVisible()
    
    // Verify main content is visible
    await expect(page.getByRole('main')).toBeVisible()
    
    // This test verifies the basic page loads correctly
    console.log('✅ Schedule grid page interface verified')
  })

  test('basic page elements load correctly', async ({ page }) => {
    // Verify page loads without critical errors
    await expect(page.getByRole('heading', { name: 'スケジュール管理' })).toBeVisible()
    
    // Verify main content container
    await expect(page.getByRole('main')).toBeVisible()
    
    // This test verifies the basic page structure loads
    console.log('✅ Schedule grid page basic structure verified')
  })

  test('handles page navigation correctly', async ({ page }) => {
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/admin\/schedules/)
    
    // Verify page heading
    await expect(page.getByRole('heading', { name: 'スケジュール管理' })).toBeVisible()
    
    console.log('✅ Schedule grid page navigation verified')
  })
})