// @ts-check
const { test, expect } = require('@playwright/test');
const { setupDatabase } = require('../helpers/setup');

test.describe('UI変更のテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にデータベースを初期化
    await setupDatabase();
    
    // ログインページにアクセス
    await page.goto('http://localhost:3001/login');
    
    // ログインボタンをクリック
    await page.click('button:has-text("ログイン")');
    
    // ダッシュボードが表示されるまで待機
    await page.waitForURL('**/dashboard');
  });

  test('管理画面に学年管理が表示されていないことを確認', async ({ page }) => {
    // 管理画面に移動
    await page.click('a[href="/management"]');
    
    // 基本情報管理タブが選択されていることを確認
    const basicTabButton = page.locator('button:has-text("基本情報管理")');
    expect(await basicTabButton.getAttribute('class')).toContain('primary');
    
    // 学年管理のカードが存在しないことを確認
    const gradeManagementCard = page.locator('text=学年管理');
    await expect(gradeManagementCard).toHaveCount(0);
    
    // クラス管理、図書委員管理、図書室管理のカードが存在することを確認
    await expect(page.locator('text=クラス管理')).toBeVisible();
    await expect(page.locator('text=図書委員管理')).toBeVisible();
    await expect(page.locator('text=図書室管理')).toBeVisible();
  });

  test('クラス一覧に学年カラムが表示されていないことを確認', async ({ page }) => {
    // 管理画面に移動
    await page.click('a[href="/management"]');
    
    // クラス管理に移動
    await page.click('a[href="/management/classes"]');
    
    // テーブルヘッダーを確認
    const tableHeaders = page.locator('thead th');
    
    // ヘッダーのテキストを取得
    const headerTexts = await tableHeaders.allTextContents();
    
    // 学年カラムが存在しないことを確認
    expect(headerTexts).not.toContain('学年');
    
    // ID、クラス名、操作のカラムが存在することを確認
    expect(headerTexts).toContain('ID');
    expect(headerTexts).toContain('クラス名');
    expect(headerTexts).toContain('操作');
  });

  test('図書室管理で第一図書室と第二図書室が表示されることを確認', async ({ page }) => {
    // 管理画面に移動
    await page.click('a[href="/management"]');
    
    // 図書室管理に移動
    await page.click('a[href="/management/libraries"]');
    
    // 図書室のリストを確認
    const libraryNames = page.locator('tbody td:nth-child(2)');
    
    // 図書室名を取得
    const names = await libraryNames.allTextContents();
    
    // 第一図書室と第二図書室が存在することを確認
    expect(names).toContain('第一図書室');
    expect(names).toContain('第二図書室');
    
    // 中央図書館と南図書館が存在しないことを確認
    expect(names).not.toContain('中央図書館');
    expect(names).not.toContain('南図書館');
  });

  test('スケジュール管理の全てのリンクが存在することを確認', async ({ page }) => {
    // 管理画面に移動
    await page.click('a[href="/management"]');
    
    // スケジュール管理タブをクリック
    await page.click('button:has-text("スケジュール管理")');
    
    // 各リンクが存在することを確認
    await expect(page.locator('a[href="/management/schedule-rules"]')).toBeVisible();
    await expect(page.locator('a[href="/management/generate-schedule"]')).toBeVisible();
    await expect(page.locator('a[href="/management/validate-schedule"]')).toBeVisible();
  });

  test('スケジュールがない場合にスケジュール作成を促すメッセージが表示されることを確認', async ({ page }) => {
    // スケジュールを削除するためにAPIを呼び出す
    await page.request.delete('http://localhost:5001/api/schedules/1');
    await page.request.delete('http://localhost:5001/api/schedules/2');
    
    // ダッシュボードをリロード
    await page.goto('http://localhost:3001/dashboard');
    
    // スケジュールがないメッセージが表示されることを確認
    await expect(page.locator('text=スケジュールが登録されていません。')).toBeVisible();
    
    // スケジュール作成リンクが表示されることを確認
    await expect(page.locator('text=スケジュールを作成する')).toBeVisible();
  });
});
