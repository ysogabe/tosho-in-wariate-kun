# Issue #028: E2Eテストの実装

**Priority**: Medium  
**Difficulty**: Advanced  
**Estimated Time**: 6-8 hours  
**Type**: Testing  
**Labels**: testing, e2e, playwright, automation

## Description

Playwrightを使用してアプリケーションの主要なユーザーフローをカバーするE2Eテストを実装します。ログイン、図書委員管理、スケジュール生成などの重要な機能に対する自動化テストを作成します。

## Background

t_wada TDD方法論に基づき、ユーザーの実際の操作をシミュレートしたE2Eテストを実装し、システム全体の動作を保証します。リグレッションテストとしても機能する包括的なテストスイートを構築します。

## Acceptance Criteria

- [ ] 認証フローのE2Eテストが実装されている
- [ ] クラス管理のE2Eテストが実装されている
- [ ] 図書委員管理のE2Eテストが実装されている
- [ ] スケジュール管理のE2Eテストが実装されている
- [ ] レスポンシブ対応のテストが実装されている
- [ ] エラーケースのテストが実装されている
- [ ] ページオブジェクトモデルが実装されている
- [ ] テストデータ管理が実装されている

## Implementation Guidelines

### Getting Started

1. Issue #027（テストセットアップ）が完了していることを確認
2. Playwrightのページオブジェクトモデルパターンを理解
3. テストデータの準備と管理方法を確認
4. E2Eテストのベストプラクティスを学習

### Main Implementation

#### 1. Authentication Tests

##### e2e/auth.setup.ts

```typescript
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../.auth/user.json')

setup('authenticate', async ({ page }) => {
  // ログインページに移動
  await page.goto('/auth/login')

  // ログインフォームの入力
  await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL!)
  await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD!)

  // ログインボタンをクリック
  await page.click('button[type="submit"]')

  // ダッシュボードにリダイレクトされることを確認
  await expect(page).toHaveURL('/dashboard')

  // 認証状態を保存
  await page.context().storageState({ path: authFile })
})
```

##### e2e/auth/login.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('図書委員当番システム')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')

    await expect(page.locator('text=メールアドレスは必須です')).toBeVisible()
    await expect(page.locator('text=パスワードは必須です')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(
      page.locator('text=メールアドレスまたはパスワードが正しくありません')
    ).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('ダッシュボード')
  })

  test('should redirect authenticated users to dashboard', async ({ page }) => {
    // 先にログイン
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // ログインページに再アクセス
    await page.goto('/auth/login')

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard')
  })
})
```

#### 2. Page Object Models

##### e2e/pages/login-page.ts

```typescript
import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator
  readonly rememberMeCheckbox: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[name="email"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.loginButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[role="alert"]')
    this.rememberMeCheckbox = page.locator(
      'input[type="checkbox"][name="remember"]'
    )
  }

  async goto() {
    await this.page.goto('/auth/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message)
  }

  async expectToBeVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.loginButton).toBeVisible()
  }
}
```

##### e2e/pages/dashboard-page.ts

```typescript
import { Page, Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly title: Locator
  readonly studentCount: Locator
  readonly classCount: Locator
  readonly scheduleStatus: Locator
  readonly quickActions: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1')
    this.studentCount = page.locator('[data-testid="student-count"]')
    this.classCount = page.locator('[data-testid="class-count"]')
    this.scheduleStatus = page.locator('[data-testid="schedule-status"]')
    this.quickActions = page.locator('[data-testid="quick-actions"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async expectToBeVisible() {
    await expect(this.title).toContainText('ダッシュボード')
    await expect(this.studentCount).toBeVisible()
    await expect(this.classCount).toBeVisible()
  }

  async clickQuickAction(action: string) {
    await this.quickActions.locator(`text=${action}`).click()
  }
}
```

##### e2e/pages/student-management-page.ts

```typescript
import { Page, Locator, expect } from '@playwright/test'

export class StudentManagementPage {
  readonly page: Page
  readonly title: Locator
  readonly addButton: Locator
  readonly searchInput: Locator
  readonly studentTable: Locator
  readonly createDialog: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1')
    this.addButton = page.locator('text=新規登録')
    this.searchInput = page.locator('input[placeholder*="検索"]')
    this.studentTable = page.locator('[data-testid="students-table"]')
    this.createDialog = page.locator('[role="dialog"]')
  }

  async goto() {
    await this.page.goto('/admin/students')
  }

  async clickAddButton() {
    await this.addButton.click()
    await expect(this.createDialog).toBeVisible()
  }

  async fillCreateForm(studentData: {
    name: string
    grade: string
    classId: string
  }) {
    await this.createDialog.locator('input[name="name"]').fill(studentData.name)
    await this.createDialog
      .locator('select[name="grade"]')
      .selectOption(studentData.grade)
    await this.createDialog
      .locator('select[name="classId"]')
      .selectOption(studentData.classId)
  }

  async submitCreateForm() {
    await this.createDialog.locator('button[type="submit"]').click()
  }

  async searchStudent(name: string) {
    await this.searchInput.fill(name)
    await this.page.waitForTimeout(500) // デバウンス待機
  }

  async expectStudentInTable(name: string) {
    await expect(this.studentTable.locator(`text=${name}`)).toBeVisible()
  }

  async expectStudentNotInTable(name: string) {
    await expect(this.studentTable.locator(`text=${name}`)).not.toBeVisible()
  }
}
```

#### 3. Student Management Tests

##### e2e/student-management.spec.ts

```typescript
import { test, expect } from '@playwright/test'
import { StudentManagementPage } from './pages/student-management-page'
import { DashboardPage } from './pages/dashboard-page'

test.describe('Student Management', () => {
  test.use({ storageState: '.auth/user.json' })

  let studentPage: StudentManagementPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    studentPage = new StudentManagementPage(page)
    dashboardPage = new DashboardPage(page)
    await studentPage.goto()
  })

  test('should display student management page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('図書委員管理')
    await expect(studentPage.addButton).toBeVisible()
    await expect(studentPage.searchInput).toBeVisible()
    await expect(studentPage.studentTable).toBeVisible()
  })

  test('should create new student', async ({ page }) => {
    const studentName = `テスト太郎_${Date.now()}`

    await studentPage.clickAddButton()

    await studentPage.fillCreateForm({
      name: studentName,
      grade: '5',
      classId: 'test-class-id', // テストデータのクラスID
    })

    await studentPage.submitCreateForm()

    // 成功メッセージの確認
    await expect(page.locator('text=図書委員を登録しました')).toBeVisible()

    // テーブルに追加されたことを確認
    await studentPage.expectStudentInTable(studentName)
  })

  test('should search students', async ({ page }) => {
    const searchTerm = 'テスト'

    await studentPage.searchStudent(searchTerm)

    // 検索結果が表示されることを確認
    const tableRows = page.locator('[data-testid="students-table"] tbody tr')
    await expect(tableRows).toHaveCountGreaterThan(0)

    // 検索結果に該当する名前が含まれることを確認
    const firstRow = tableRows.first()
    await expect(firstRow).toContainText(searchTerm, { ignoreCase: true })
  })

  test('should filter students by grade', async ({ page }) => {
    // 5年生でフィルタ
    await page.selectOption('select[name="grade"]', '5')
    await page.waitForTimeout(500)

    // 5年生のみが表示されることを確認
    const gradeColumns = page.locator(
      '[data-testid="students-table"] tbody tr td:nth-child(3)'
    )
    const count = await gradeColumns.count()

    for (let i = 0; i < count; i++) {
      await expect(gradeColumns.nth(i)).toContainText('5年')
    }
  })

  test('should edit student information', async ({ page }) => {
    // 最初の学生の編集ボタンをクリック
    await page
      .locator('[data-testid="students-table"] tbody tr')
      .first()
      .locator('button:has-text("編集")')
      .click()

    const editDialog = page.locator('[role="dialog"]')
    await expect(editDialog).toBeVisible()

    // 名前を変更
    const nameInput = editDialog.locator('input[name="name"]')
    await nameInput.clear()
    await nameInput.fill('編集テスト太郎')

    // 更新ボタンをクリック
    await editDialog.locator('button[type="submit"]').click()

    // 成功メッセージの確認
    await expect(page.locator('text=図書委員情報を更新しました')).toBeVisible()
  })

  test('should handle validation errors', async ({ page }) => {
    await studentPage.clickAddButton()

    // 空のフォームで送信
    await studentPage.submitCreateForm()

    // バリデーションエラーの確認
    await expect(page.locator('text=名前は必須です')).toBeVisible()
  })
})
```

#### 4. Schedule Management Tests

##### e2e/schedule-management.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test.describe('Schedule Management', () => {
  test.use({ storageState: '.auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/schedules')
  })

  test('should display schedule management page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('スケジュール管理')
    await expect(page.locator('text=スケジュール生成')).toBeVisible()
  })

  test('should generate schedule', async ({ page }) => {
    // スケジュール生成ボタンをクリック
    await page.click('text=スケジュール生成')

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('text=スケジュール生成')).toBeVisible()

    // 生成開始ボタンをクリック
    await dialog.locator('button:has-text("生成開始")').click()

    // 生成中の表示を確認
    await expect(page.locator('text=生成中')).toBeVisible()

    // 生成完了を待機（最大30秒）
    await expect(page.locator('text=スケジュールを生成しました')).toBeVisible({
      timeout: 30000,
    })

    // スケジュールが表示されることを確認
    await expect(page.locator('[data-testid="schedule-grid"]')).toBeVisible()
  })

  test('should switch between view modes', async ({ page }) => {
    // グリッドビュー
    await page.click('text=グリッド')
    await expect(page.locator('[data-testid="schedule-grid"]')).toBeVisible()

    // リストビュー
    await page.click('text=リスト')
    await expect(page.locator('[data-testid="schedule-list"]')).toBeVisible()

    // カレンダービュー
    await page.click('text=カレンダー')
    await expect(
      page.locator('[data-testid="schedule-calendar"]')
    ).toBeVisible()
  })

  test('should export schedule', async ({ page }) => {
    // エクスポートボタンをクリック
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=CSVダウンロード')

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/schedule.*\.csv/)
  })

  test('should reset schedule with confirmation', async ({ page }) => {
    // リセットボタンをクリック
    await page.click('text=リセット')

    const dialog = page.locator('[role="alertdialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('text=スケジュールリセット')).toBeVisible()

    // 削除対象を選択
    await dialog.locator('select').selectOption('FIRST_TERM')

    // 削除実行
    await dialog.locator('button:has-text("削除する")').click()

    // 成功メッセージの確認
    await expect(page.locator('text=スケジュールを削除しました')).toBeVisible()
  })
})
```

#### 5. Responsive Tests

##### e2e/responsive.spec.ts

```typescript
import { test, expect, devices } from '@playwright/test'

const mobileDevice = devices['iPhone 12']
const tabletDevice = devices['iPad']

test.describe('Responsive Design', () => {
  test.use({ storageState: '.auth/user.json' })

  test('should display mobile navigation', async ({ page }) => {
    await page.setViewportSize(mobileDevice.viewport!)
    await page.goto('/dashboard')

    // モバイルメニューボタンが表示されることを確認
    await expect(page.locator('button[aria-label*="メニュー"]')).toBeVisible()

    // デスクトップナビゲーションが非表示になることを確認
    await expect(page.locator('nav.desktop-nav')).not.toBeVisible()
  })

  test('should work on tablet layout', async ({ page }) => {
    await page.setViewportSize(tabletDevice.viewport!)
    await page.goto('/admin/students')

    // テーブルが適切に表示されることを確認
    await expect(page.locator('[data-testid="students-table"]')).toBeVisible()

    // スクロールが可能であることを確認
    const table = page.locator('[data-testid="students-table"]')
    await table.scrollIntoViewIfNeeded()
  })

  test('should handle touch interactions', async ({ page }) => {
    await page.setViewportSize(mobileDevice.viewport!)
    await page.goto('/admin/students')

    // タッチでボタンをタップ
    await page.tap('text=新規登録')

    // ダイアログが開くことを確認
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})
```

#### 6. Error Handling Tests

##### e2e/error-handling.spec.ts

```typescript
import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/non-existent-page')

    await expect(page.locator('h1')).toContainText('ページが見つかりません')
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=ダッシュボードに戻る')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // APIレスポンスをモック（エラー）
    await page.route('/api/students', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal Server Error' },
        }),
      })
    })

    await page.goto('/admin/students')

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=データの取得に失敗しました')).toBeVisible()
  })

  test('should handle network errors', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('/api/**', (route) => route.abort())

    await page.goto('/admin/students')

    // ネットワークエラーメッセージが表示されることを確認
    await expect(page.locator('text=接続エラー')).toBeVisible()
  })

  test('should redirect unauthorized users', async ({ page }) => {
    // 認証なしでアクセス
    await page.goto('/admin/settings')

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
```

#### 7. Test Data Management

##### e2e/fixtures/test-data.ts

```typescript
export const testData = {
  users: {
    admin: {
      email: 'admin@school.jp',
      password: 'password123',
      displayName: 'テスト管理者',
    },
    teacher: {
      email: 'teacher@school.jp',
      password: 'password123',
      displayName: 'テスト教員',
    },
  },

  classes: [
    { name: 'A', year: 5 },
    { name: 'B', year: 5 },
    { name: 'A', year: 6 },
    { name: 'B', year: 6 },
  ],

  students: [
    { name: 'テスト太郎', grade: 5, className: 'A' },
    { name: 'テスト花子', grade: 5, className: 'B' },
    { name: 'テスト次郎', grade: 6, className: 'A' },
    { name: 'テスト美咲', grade: 6, className: 'B' },
  ],

  rooms: [
    { name: '図書室A', capacity: 4, description: 'メイン図書室' },
    { name: '図書室B', capacity: 3, description: 'サブ図書室' },
  ],
}

export function getRandomTestStudent() {
  return {
    name: `テスト生徒_${Date.now()}`,
    grade: Math.random() > 0.5 ? 5 : 6,
    className: Math.random() > 0.5 ? 'A' : 'B',
  }
}
```

### Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Isolation](https://playwright.dev/docs/test-isolation)
- [Visual Testing](https://playwright.dev/docs/test-screenshots)

## Implementation Results

### Work Completed

- [ ] 認証フローE2Eテスト実装
- [ ] ページオブジェクトモデル実装
- [ ] 図書委員管理E2Eテスト実装
- [ ] スケジュール管理E2Eテスト実装
- [ ] レスポンシブテスト実装
- [ ] エラーハンドリングテスト実装
- [ ] テストデータ管理実装

### Testing Results

- [ ] 全E2Eテスト実行確認
- [ ] 複数ブラウザでの動作確認
- [ ] モバイル・タブレット対応確認
- [ ] エラーケース対応確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #029: デプロイ設定
2. Issue #030: ドキュメント整備
3. 本格運用開始に向けた最終テスト
