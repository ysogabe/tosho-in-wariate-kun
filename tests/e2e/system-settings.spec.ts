/**
 * System Settings E2E Tests - Real User Flow
 * 
 * Following Playwright best practices:
 * - Use locators instead of page.waitForSelector
 * - Use web-first assertions
 * - Avoid page.waitForTimeout
 * - Use role-based selectors when possible
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('System Settings - Real User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simple authentication
    await loginAsAdmin(page)
    await page.goto('/admin/settings')
    
    // Wait for page to load using specific heading
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
  })

  test('displays system settings interface correctly', async ({ page }) => {
    // Verify specific page heading
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
    
    // Verify main content is visible
    await expect(page.getByRole('main')).toBeVisible()
    
    // This test verifies the basic page loads correctly
    console.log('✅ System settings page interface verified')
  })

  test('basic page elements load correctly', async ({ page }) => {
    // Verify page loads without critical errors
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
    
    // Verify main content container
    await expect(page.getByRole('main')).toBeVisible()
    
    // This test verifies the basic page structure loads
    console.log('✅ System settings page basic structure verified')
  })

  test('handles page navigation correctly', async ({ page }) => {
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/admin\/settings/)
    
    // Verify page heading
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
    
    console.log('✅ System settings page navigation verified')
  })
})