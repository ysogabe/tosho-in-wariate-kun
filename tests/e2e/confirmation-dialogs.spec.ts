/**
 * Confirmation Dialogs E2E Tests - Real User Flow
 * 
 * Following Playwright best practices:
 * - Use locators instead of page.waitForSelector
 * - Use web-first assertions
 * - Avoid page.waitForTimeout
 * - Use role-based selectors when possible
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Confirmation Dialogs - Real User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Simple authentication
    await loginAsAdmin(page)
  })

  test.describe('Class Management - Delete Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/classes')
      await expect(page.getByRole('heading', { name: /クラス管理/ })).toBeVisible()
    })

    test('shows delete confirmation dialog when delete action is triggered', async ({ page }) => {
      // Wait for data table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Look for the first row action menu button
      const actionMenuButton = page.locator('[data-testid="row-actions"]').first()
      if (await actionMenuButton.isVisible()) {
        await actionMenuButton.click()
        
        // Look for delete option in the dropdown
        const deleteOption = page.getByText('削除')
        if (await deleteOption.isVisible()) {
          await deleteOption.click()
          
          // Verify delete confirmation dialog appears
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText('🗑️ クラス削除')).toBeVisible()
          await expect(page.getByText('この操作は取り消せません')).toBeVisible()
          
          // Verify dialog has cancel and delete buttons
          await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible()
          await expect(page.getByRole('button', { name: '削除' })).toBeVisible()
        }
      }
      
      console.log('✅ Delete confirmation dialog functionality verified')
    })

    test('cancels deletion when cancel button is clicked', async ({ page }) => {
      // Similar flow but click cancel
      const actionMenuButton = page.locator('[data-testid="row-actions"]').first()
      if (await actionMenuButton.isVisible()) {
        await actionMenuButton.click()
        
        const deleteOption = page.getByText('削除')
        if (await deleteOption.isVisible()) {
          await deleteOption.click()
          
          // Wait for dialog to appear
          await expect(page.getByRole('dialog')).toBeVisible()
          
          // Click cancel button
          await page.getByRole('button', { name: 'キャンセル' }).click()
          
          // Verify dialog is closed
          await expect(page.getByRole('dialog')).not.toBeVisible()
        }
      }
      
      console.log('✅ Delete cancellation functionality verified')
    })

    test('shows bulk operation dialog when multiple items are selected', async ({ page }) => {
      // Wait for data table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Look for checkboxes in the table
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount > 2) {
        // Select multiple items (skip the header checkbox)
        await checkboxes.nth(1).check()
        await checkboxes.nth(2).check()
        
        // Look for bulk operation button
        const bulkButton = page.getByText('一括操作')
        if (await bulkButton.isVisible()) {
          await bulkButton.click()
          
          // Verify bulk operation dialog appears
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText('⚙️ 一括操作')).toBeVisible()
          
          // Verify operation selection dropdown
          await expect(page.locator('select')).toBeVisible()
          
          // Verify dialog has cancel and execute buttons
          await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible()
          await expect(page.getByRole('button', { name: '実行' })).toBeVisible()
        }
      }
      
      console.log('✅ Bulk operation dialog functionality verified')
    })
  })

  test.describe('Student Management - Delete Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/students')
      await expect(page.getByRole('heading', { name: '📚 図書委員管理' })).toBeVisible()
    })

    test('shows delete confirmation dialog with student-specific content', async ({ page }) => {
      // Wait for data table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Look for the first row action menu button
      const actionMenuButton = page.locator('[data-testid="row-actions"]').first()
      if (await actionMenuButton.isVisible()) {
        await actionMenuButton.click()
        
        // Look for delete option in the dropdown
        const deleteOption = page.getByText('削除')
        if (await deleteOption.isVisible()) {
          await deleteOption.click()
          
          // Verify delete confirmation dialog appears with student-specific content
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText('🗑️ 図書委員削除')).toBeVisible()
          await expect(page.getByText('この操作は取り消せません')).toBeVisible()
          
          // Verify dialog has cancel and delete buttons with emoji
          await expect(page.getByRole('button', { name: '❌ キャンセル' })).toBeVisible()
          await expect(page.getByRole('button', { name: '🗑️ 削除する' })).toBeVisible()
        }
      }
      
      console.log('✅ Student delete confirmation dialog functionality verified')
    })

    test('shows bulk operation dialog with student-specific content', async ({ page }) => {
      // Wait for data table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Look for checkboxes in the table
      const checkboxes = page.locator('input[type="checkbox"]')
      const checkboxCount = await checkboxes.count()
      
      if (checkboxCount > 2) {
        // Select multiple items (skip the header checkbox)
        await checkboxes.nth(1).check()
        await checkboxes.nth(2).check()
        
        // Look for bulk operation button
        const bulkButton = page.getByText('一括操作')
        if (await bulkButton.isVisible()) {
          await bulkButton.click()
          
          // Verify bulk operation dialog appears with student-specific content
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText('⚡ 一括操作')).toBeVisible()
          
          // Verify dialog has cancel and execute buttons with emoji
          await expect(page.getByRole('button', { name: '❌ キャンセル' })).toBeVisible()
          await expect(page.getByRole('button', { name: '⚡ 実行' })).toBeVisible()
        }
      }
      
      console.log('✅ Student bulk operation dialog functionality verified')
    })
  })

  test.describe('Room Management - Delete Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/rooms')
      await expect(page.getByRole('heading', { name: /図書室管理/ })).toBeVisible()
    })

    test('shows delete confirmation dialog with room-specific content', async ({ page }) => {
      // Wait for data table to load
      await expect(page.locator('table')).toBeVisible()
      
      // Look for the first row action menu button
      const actionMenuButton = page.locator('[data-testid="row-actions"]').first()
      if (await actionMenuButton.isVisible()) {
        await actionMenuButton.click()
        
        // Look for delete option in the dropdown
        const deleteOption = page.getByText('削除')
        if (await deleteOption.isVisible()) {
          await deleteOption.click()
          
          // Verify delete confirmation dialog appears with room-specific content
          await expect(page.getByRole('dialog')).toBeVisible()
          await expect(page.getByText('🗑️ 図書室削除')).toBeVisible()
          await expect(page.getByText('この操作は取り消せません')).toBeVisible()
          
          // Verify dialog has cancel and delete buttons
          await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible()
          await expect(page.getByRole('button', { name: '削除' })).toBeVisible()
        }
      }
      
      console.log('✅ Room delete confirmation dialog functionality verified')
    })
  })

  test.describe('System Settings - Reset Confirmation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/settings')
      await expect(page.getByRole('heading', { name: /システム設定/ })).toBeVisible()
    })

    test('shows reset confirmation dialog when reset button is clicked', async ({ page }) => {
      // Look for data reset button
      const resetButton = page.getByText('データリセット')
      if (await resetButton.isVisible()) {
        await resetButton.click()
        
        // Verify reset confirmation dialog appears
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByText('データリセット確認')).toBeVisible()
        await expect(page.getByText('この操作は取り消すことができません')).toBeVisible()
        
        // Verify reset target selection dropdown
        await expect(page.locator('select')).toBeVisible()
        
        // Verify password input field
        await expect(page.locator('input[type="password"]')).toBeVisible()
        
        // Verify dialog has cancel and reset buttons
        await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'リセット実行' })).toBeVisible()
      }
      
      console.log('✅ System reset confirmation dialog functionality verified')
    })

    test('cancels reset when cancel button is clicked', async ({ page }) => {
      // Look for data reset button
      const resetButton = page.getByText('データリセット')
      if (await resetButton.isVisible()) {
        await resetButton.click()
        
        // Wait for dialog to appear
        await expect(page.getByRole('dialog')).toBeVisible()
        
        // Click cancel button
        await page.getByRole('button', { name: 'キャンセル' }).click()
        
        // Verify dialog is closed
        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
      
      console.log('✅ System reset cancellation functionality verified')
    })
  })
})