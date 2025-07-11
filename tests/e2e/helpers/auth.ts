import { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  // ログインページに移動（管理者ページへのリダイレクト要求）
  await page.goto('/auth/login?redirectTo=/admin', { waitUntil: 'domcontentloaded' })
  
  // ページが基本的に読み込まれるまで待機
  await page.waitForLoadState('domcontentloaded')
  
  // 認証状態の確認が完了するまで待機（AuthGuardの処理）
  // 「認証状態を確認中」のメッセージが消えるまで待機
  try {
    await page.waitForSelector('text=認証状態を確認中', { timeout: 5000 })
    await page.waitForSelector('text=認証状態を確認中', { state: 'detached', timeout: 15000 })
  } catch (error) {
    // 認証状態確認メッセージが見つからない場合は続行
    console.log('認証状態確認メッセージが見つからない、または既に完了している')
  }
  
  // フォームが表示されるまで待機
  await page.waitForSelector('form', { timeout: 15000 })
  
  // ログインフォームに入力（React Hook Formのフィールド）
  await page.fill('input[name="email"]', 'admin@test.com')
  await page.fill('input[name="password"]', 'admin123')
  
  // ログインボタンをクリック
  await page.click('button[type="submit"]')
  
  // ログイン成功の確認（管理者ダッシュボードへのリダイレクト）
  await page.waitForURL('/admin', { timeout: 15000 })
}

export async function loginAsUser(page: Page) {
  // ログインページに移動
  await page.goto('/auth/login')
  
  // ログインフォームに入力
  await page.fill('input[name="email"]', 'user@test.com')
  await page.fill('input[name="password"]', 'user123')
  
  // ログインボタンをクリック
  await page.click('button[type="submit"]')
  
  // ログイン成功の確認（ダッシュボードへのリダイレクト）
  await page.waitForURL('/dashboard')
}

export async function logout(page: Page) {
  // ログアウトボタンをクリック（ヘッダーにある場合）
  await page.click('button[data-testid="logout-button"]')
  
  // ログアウト成功の確認
  await page.waitForURL('/auth/login')
}