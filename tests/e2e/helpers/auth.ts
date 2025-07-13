import { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  console.log('E2E Auth: Starting admin login process')
  
  // ログインページに移動（管理者ページへのリダイレクト要求）
  console.log('E2E Auth: Navigating to login page')
  await page.goto('/auth/login?redirectTo=/admin', { waitUntil: 'domcontentloaded' })
  
  // ページが基本的に読み込まれるまで待機
  await page.waitForLoadState('domcontentloaded')
  console.log('E2E Auth: Page loaded')
  
  // 認証状態の確認が完了するまで待機（AuthGuardの処理）
  // 「認証状態を確認中」のメッセージが消えるまで待機
  try {
    await page.waitForSelector('text=認証状態を確認中', { timeout: 5000 })
    await page.waitForSelector('text=認証状態を確認中', { state: 'detached', timeout: 15000 })
    console.log('E2E Auth: Auth guard check completed')
  } catch (error) {
    // 認証状態確認メッセージが見つからない場合は続行
    console.log('E2E Auth: Auth guard message not found or already completed')
  }
  
  // フォームが表示されるまで待機
  console.log('E2E Auth: Waiting for form to appear')
  await page.waitForSelector('form', { timeout: 15000 })
  
  // ログインフォームに入力（React Hook Formのフィールド）
  console.log('E2E Auth: Filling login form with proper React events')
  
  // メールアドレス入力
  const emailInput = page.locator('input[name="email"]')
  await emailInput.click()
  await emailInput.clear()
  await emailInput.type('admin@test.com', { delay: 50 })
  await emailInput.blur()
  
  // パスワード入力
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.click()
  await passwordInput.clear()
  await passwordInput.type('Admin123', { delay: 50 })
  await passwordInput.blur()
  
  // フォームの更新を待機
  await page.waitForTimeout(500)
  
  // フォームバリデーションエラーを確認
  const emailErrors = await page.locator('[data-testid="email-error"], .text-destructive, [role="alert"]').allTextContents()
  const passwordErrors = await page.locator('[data-testid="password-error"], .text-destructive, [role="alert"]').allTextContents()
  console.log('E2E Auth: Form validation errors:', { email: emailErrors, password: passwordErrors })
  
  // フィールドの値を確認
  const emailValue = await page.inputValue('input[name="email"]')
  const passwordValue = await page.inputValue('input[name="password"]')
  console.log('E2E Auth: Form field values:', { email: emailValue, password: passwordValue.length > 0 ? 'filled' : 'empty' })
  
  // React Hook Form の状態を直接確認
  const formState = await page.evaluate(() => {
    const form = document.querySelector('form')
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
    
    return {
      emailValue: emailInput?.value,
      passwordValue: passwordInput?.value,
      emailFocused: document.activeElement === emailInput,
      passwordFocused: document.activeElement === passwordInput,
      formExists: !!form
    }
  })
  console.log('E2E Auth: DOM form state:', formState)
  
  // React Hook Form のバリデーションを手動でトリガー
  await page.evaluate(() => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
    
    if (emailInput) {
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      emailInput.dispatchEvent(new Event('change', { bubbles: true }))
      emailInput.dispatchEvent(new Event('blur', { bubbles: true }))
    }
    
    if (passwordInput) {
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }))
      passwordInput.dispatchEvent(new Event('blur', { bubbles: true }))
    }
  })
  
  // イベント処理の完了を待機
  await page.waitForTimeout(1000)
  
  // ログインボタンをクリック
  console.log('E2E Auth: Clicking login button')
  
  // すべてのブラウザコンソールメッセージを監視
  page.on('console', msg => {
    console.log(`E2E Browser Console (${msg.type()}):`, msg.text())
  })
  
  // フォームの状態を確認
  const loginButton = page.locator('button[type="submit"]')
  const isButtonDisabled = await loginButton.isDisabled()
  const buttonText = await loginButton.textContent()
  console.log('E2E Auth: Login button state:', { disabled: isButtonDisabled, text: buttonText })
  
  // フォーム送信イベントを監視
  page.on('request', request => {
    if (request.url().includes('/auth') || request.method() === 'POST') {
      console.log('E2E Auth: Request detected:', request.method(), request.url())
    }
  })
  
  // フォームのsubmitイベントを監視
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) {
      form.addEventListener('submit', (e) => {
        console.log('Browser: Form submit event detected', { 
          prevented: e.defaultPrevented,
          type: e.type,
          timestamp: new Date().toISOString()
        })
      })
    }
  })
  
  // フォーム送信試行（成功時は追加試行を停止）
  let authSuccess = false
  
  try {
    // 方法1: ボタンクリック
    console.log('E2E Auth: Method 1 - Button click')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    
    // URL変化を確認（成功判定）
    const urlAfterClick = page.url()
    console.log('E2E Auth: URL after button click:', urlAfterClick)
    
    if (urlAfterClick.includes('/admin')) {
      console.log('E2E Auth: Authentication successful, skipping additional attempts')
      authSuccess = true
    } else {
      // 方法2: パスワードフィールドでEnterキー（1回目失敗時のみ）
      console.log('E2E Auth: Method 2 - Enter key submission (backup)')
      await page.focus('input[name="password"]')
      await page.press('input[name="password"]', 'Enter')
      await page.waitForTimeout(1500)
      
      const urlAfterEnter = page.url()
      console.log('E2E Auth: URL after Enter key:', urlAfterEnter)
      
      if (urlAfterEnter.includes('/admin')) {
        console.log('E2E Auth: Enter key authentication successful')
        authSuccess = true
      }
    }
    
  } catch (error) {
    console.log('E2E Auth: Form submission error:', error)
  }
  
  // ログイン処理を少し待機
  console.log('E2E Auth: Waiting for login processing')
  await page.waitForTimeout(1500)
  
  // 現在のURLを確認
  const currentUrl = page.url()
  console.log('E2E Auth: Current URL after login attempt:', currentUrl)
  
  // ページに表示されているエラーメッセージを確認
  const errorAlert = await page.locator('[role="alert"]').first()
  if (await errorAlert.isVisible()) {
    const errorText = await errorAlert.textContent()
    console.log('E2E Auth: Error message found:', errorText)
  }
  
  // ログイン成功の確認（管理者ダッシュボードへのリダイレクト）
  console.log('E2E Auth: Waiting for redirect to /admin')
  await page.waitForURL('/admin', { timeout: 15000 })
  console.log('E2E Auth: Successfully redirected to admin page')
}

export async function loginAsUser(page: Page) {
  // ログインページに移動
  await page.goto('/auth/login')
  
  // ログインフォームに入力
  await page.fill('input[name="email"]', 'user@test.com')
  await page.fill('input[name="password"]', 'User123')
  
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