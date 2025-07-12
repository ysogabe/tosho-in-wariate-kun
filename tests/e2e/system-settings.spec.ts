import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('System Settings Page - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者としてログイン
    await loginAsAdmin(page)
    
    // Mock API responses for consistent testing
    await page.route('/api/system/info', async route => {
      const mockData = {
        data: {
          version: '1.0.0',
          buildDate: '2024-01-01T00:00:00Z',
          environment: 'test',
          database: {
            provider: 'PostgreSQL',
            lastDataUpdate: '2024-01-15T10:00:00Z',
            lastScheduleGeneration: '2024-01-20T15:00:00Z',
          },
          statistics: {
            students: {
              total: 150,
              active: 145,
              inactive: 5,
            },
            classes: {
              total: 12,
            },
            rooms: {
              total: 3,
            },
            assignments: {
              total: 300,
              firstTerm: 150,
              secondTerm: 150,
            },
          },
        },
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      })
    })
  })

  test('ページ表示とタブ切り替えが動作する', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // ページタイトルとタブの確認
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'システム情報' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'データ管理' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'メンテナンス' })).toBeVisible()
    await expect(page.getByRole('button', { name: '更新' })).toBeVisible()

    // システム基本情報の確認
    await expect(page.getByText('v1.0.0')).toBeVisible()
    await expect(page.getByText('test')).toBeVisible()
    await expect(page.getByText('PostgreSQL')).toBeVisible()
    await expect(page.getByText('システム基本情報')).toBeVisible()
    
    // エビデンス用スクリーンショット - システム設定ページ全体
    await page.screenshot({ path: 'test-results/system-settings-overview.png', fullPage: true })
  })

  test('データ管理タブでエクスポート機能が動作する', async ({ page }) => {
    // エクスポートAPIをモック
    await page.route('/api/system/export', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'test export data' }),
      })
    })
    
    await page.goto('/admin/settings')
    
    // データ管理タブに切り替え
    await page.getByRole('tab', { name: 'データ管理' }).click()
    
    // データ管理機能の確認
    await expect(page.getByRole('button', { name: 'データをエクスポート' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'データリセット' })).toBeVisible()
    await expect(page.getByText('全データをJSONファイルとしてダウンロードします')).toBeVisible()
    await expect(page.getByText('年度末のデータ整理に使用します')).toBeVisible()

    // ダウンロード処理をテスト
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'データをエクスポート' }).click()
    
    // ダウンロードが開始されることを確認
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/tosho-system-export-\d{4}-\d{2}-\d{2}\.json/)
  })

  test('データリセットダイアログが動作する', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.getByRole('tab', { name: 'データ管理' }).click()
    
    // リセットボタンをクリック
    await page.getByRole('button', { name: 'データリセット' }).click()
    
    // CI環境でのダイアログ表示を待機
    await page.waitForTimeout(500) // ダイアログアニメーション完了を待機
    
    // ダイアログの表示確認（AlertDialogはrole="alertdialog"を使用）
    await expect(page.locator('[role="alertdialog"]')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('データリセット確認')).toBeVisible()
    await expect(page.getByPlaceholder('管理者パスワードを入力')).toBeVisible()
    await expect(page.getByText('キャンセル')).toBeVisible()
    await expect(page.getByText('リセット実行')).toBeVisible()
    
    // エビデンス用スクリーンショット - 重要なダイアログのみ撮影
    await page.screenshot({ path: 'test-results/system-settings-critical-dialog.png', fullPage: true })
  })

  test('データリセット実行が動作する', async ({ page }) => {
    // リセットAPIをモック
    await page.route('/api/system/reset', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { message: 'データリセットが完了しました' }
        }),
      })
    })
    
    await page.goto('/admin/settings')
    await page.getByRole('tab', { name: 'データ管理' }).click()
    
    // リセットダイアログを開く
    await page.getByRole('button', { name: 'データリセット' }).click()
    
    // CI環境でのダイアログ表示を待機
    await page.waitForTimeout(500)
    await expect(page.locator('[role="alertdialog"]')).toBeVisible({ timeout: 15000 })
    
    // フォームに入力
    await page.getByPlaceholder('管理者パスワードを入力').fill('test123')
    
    // リセット実行
    await page.getByText('リセット実行').click()
    
    // 成功メッセージの確認
    await expect(page.getByText('データリセットが完了しました')).toBeVisible()
  })

  test('メンテナンスタブが表示される', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // メンテナンスタブに切り替え
    await page.getByRole('tab', { name: 'メンテナンス' }).click()
    
    // メンテナンス機能の確認
    await expect(page.getByText('メンテナンス機能は準備中です')).toBeVisible()
  })

  test('更新ボタンが動作する', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click()
    
    // ページが再読み込みされることを確認
    await expect(page.getByRole('heading', { name: 'システム設定' })).toBeVisible()
  })


  test('エラーハンドリングが動作する', async ({ page }) => {
    // APIエラーをモック
    await page.route('/api/system/info', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })
    
    await page.goto('/admin/settings')
    
    // エラーメッセージの表示確認
    await expect(page.getByText('システム情報の取得に失敗しました')).toBeVisible()
  })

  test('キーボードナビゲーションが動作する', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // フォーカスされた要素が表示されていることを確認
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('アクセシビリティが適切に設定されている', async ({ page }) => {
    await page.goto('/admin/settings')
    
    // ARIA属性の確認
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('tablist')).toBeVisible()
    await expect(page.getByRole('tabpanel')).toBeVisible()
    
    // ボタンがアクセシブルであることを確認
    const buttons = page.getByRole('button')
    await expect(buttons.first()).toBeVisible()
  })
})