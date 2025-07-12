import { Page, Locator, expect } from '@playwright/test'

export class SystemSettingsPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly refreshButton: Locator
  readonly infoTab: Locator
  readonly dataTab: Locator
  readonly maintenanceTab: Locator
  readonly exportButton: Locator
  readonly resetButton: Locator
  readonly systemVersion: Locator
  readonly environment: Locator
  readonly studentCount: Locator
  readonly classCount: Locator
  readonly roomCount: Locator
  readonly assignmentCount: Locator

  constructor(page: Page) {
    this.page = page
    this.pageTitle = page.getByRole('heading', { name: 'システム設定' })
    this.refreshButton = page.getByRole('button', { name: '更新' })
    this.infoTab = page.getByRole('tab', { name: 'システム情報' })
    this.dataTab = page.getByRole('tab', { name: 'データ管理' })
    this.maintenanceTab = page.getByRole('tab', { name: 'メンテナンス' })
    this.exportButton = page.getByRole('button', { name: 'データをエクスポート' })
    this.resetButton = page.getByRole('button', { name: 'データリセット' })
    this.systemVersion = page.locator('[data-testid="system-version"]')
    this.environment = page.locator('[data-testid="environment"]')
    this.studentCount = page.locator('[data-testid="student-count"]')
    this.classCount = page.locator('[data-testid="class-count"]')
    this.roomCount = page.locator('[data-testid="room-count"]')
    this.assignmentCount = page.locator('[data-testid="assignment-count"]')
  }

  async goto() {
    await this.page.goto('/admin/settings')
  }

  async clickRefreshButton() {
    await this.refreshButton.click()
  }

  async switchToDataTab() {
    await this.dataTab.click()
  }

  async switchToMaintenanceTab() {
    await this.maintenanceTab.click()
  }

  async clickExportButton() {
    await this.exportButton.click()
  }

  async clickResetButton() {
    await this.resetButton.click()
  }

  async waitForPageLoad() {
    await expect(this.pageTitle).toBeVisible()
    await expect(this.refreshButton).toBeVisible()
  }

  async verifySystemInfo() {
    await expect(this.systemVersion).toBeVisible()
    await expect(this.environment).toBeVisible()
  }

  async verifyStatistics() {
    await expect(this.studentCount).toBeVisible()
    await expect(this.classCount).toBeVisible()
    await expect(this.roomCount).toBeVisible()
    await expect(this.assignmentCount).toBeVisible()
  }
}

export class ResetDialog {
  readonly page: Page
  readonly dialog: Locator
  readonly title: Locator
  readonly passwordInput: Locator
  readonly resetTypeSelect: Locator
  readonly cancelButton: Locator
  readonly executeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.locator('[role="dialog"]')
    this.title = page.getByText('データリセット確認')
    this.passwordInput = page.getByPlaceholder('管理者パスワードを入力')
    this.resetTypeSelect = page.getByRole('combobox')
    this.cancelButton = page.getByText('キャンセル')
    this.executeButton = page.getByText('リセット実行')
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async selectResetType(type: 'assignments' | 'students' | 'all') {
    await this.resetTypeSelect.click()
    const typeMap = {
      assignments: '当番表のみ',
      students: '図書委員と当番表',
      all: 'すべてのデータ'
    }
    await this.page.getByRole('option', { name: typeMap[type] }).click()
  }

  async clickCancel() {
    await this.cancelButton.click()
  }

  async clickExecute() {
    await this.executeButton.click()
  }

  async waitForDialog() {
    await expect(this.dialog).toBeVisible()
    await expect(this.title).toBeVisible()
  }
}