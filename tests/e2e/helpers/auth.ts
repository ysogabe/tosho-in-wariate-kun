import { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  // E2E環境では自動認証により、直接管理画面にアクセス可能
  await page.goto('/admin')
  
  // 認証状態の確認 - 管理画面の表示を待機
  await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 })
}

export async function loginAsUser(page: Page) {
  // E2E環境では自動認証により、直接ダッシュボードにアクセス可能
  await page.goto('/dashboard')
  await page.waitForSelector('[data-testid="user-dashboard"]', { timeout: 10000 })
}

export async function logout(page: Page) {
  // ログアウトボタンをクリック
  await page.click('button[data-testid="logout-button"]')
  await page.waitForURL('/auth/login')
}