# Issue #032: Playwright E2E Test Implementation for Skipped UI Tests

**Priority**: High
**Difficulty**: Intermediate
**Estimated Time**: 5-8 days
**Type**: Testing
**Labels**: testing, e2e, playwright, frontend
**Assignee**: [TBD]
**Reviewer**: [Senior QA Engineer]

## Description

During the Jest unit test fixes in the CI pipeline, numerous UI-related tests were skipped due to their complexity and the need for proper end-to-end testing. This issue documents all the skipped tests and provides a comprehensive plan for implementing them using Playwright for proper e2e testing.

## Background

While fixing CI test failures, it became apparent that many UI interaction tests were too complex for unit testing and would be better suited for e2e testing. These tests involve complex user interactions, form submissions, modal dialogs, and integration between multiple components. Rather than maintaining fragile unit tests with extensive mocking, these scenarios should be tested with Playwright e2e tests that provide better coverage and reliability.

## Acceptance Criteria

- [ ] Playwright testing framework set up in the project
- [ ] All skipped UI tests converted to Playwright e2e tests
- [ ] Test coverage for complex user interactions and workflows
- [ ] Integration with CI/CD pipeline for automated e2e testing
- [ ] Proper test data setup and cleanup
- [ ] Documentation for running and maintaining e2e tests
- [ ] Minimum 80% coverage of critical user journeys

## Implementation Guidelines

### Getting Started

1. **Repository Setup**
   ```bash
   cd tosho-in-wariate-kun
   npm install @playwright/test
   npx playwright install
   ```

2. **Branch Creation**
   ```bash
   git checkout -b issue/032-playwright-e2e-tests
   ```

3. **Development Environment**
   ```bash
   npm run dev  # Start development server for e2e tests
   ```

### Technical Requirements

- **Framework**: Playwright with TypeScript
- **Test Location**: `tests/e2e/` directory
- **Browser Testing**: Chrome, Firefox, Safari
- **Test Data**: Seeded test database
- **CI Integration**: GitHub Actions workflow

### Architecture Considerations

- **Page Object Model**: Implement page objects for maintainability
- **Test Isolation**: Each test should be independent
- **Data Management**: Proper setup and teardown of test data
- **Parallel Execution**: Tests should run in parallel safely

## Excluded Tests Documentation

### Student Management Page Tests

**File**: `src/app/admin/students/__tests__/page.test.tsx` (EXCLUDED FROM UNIT TESTS)

#### Excluded Test Categories:
1. **基本的なレンダリング**
   - 正常にレンダリングされる
   - 新規登録ボタンが表示される
   - 統計情報が正しく表示される

2. **データテーブル**
   - 図書委員一覧が正しく表示される
   - 検索機能が動作する
   - 選択機能が動作する

3. **フィルタリング機能**
   - 検索フィールドが表示される
   - 学年フィルタが表示される
   - クラスフィルタが表示される
   - 状態フィルタが表示される
   - CSV出力ボタンが表示される

4. **新規登録機能**
   - 新規登録ボタンクリックでダイアログが開く
   - 作成フォームが正しく表示される
   - フォーム送信が正しく動作する

5. **編集機能**
   - 編集ボタンクリックでダイアログが開く
   - 編集フォーム送信が正しく動作する

6. **削除機能**
   - 当番経験がある図書委員の削除ボタンが無効化される
   - 削除ボタンクリックで確認ダイアログが開く
   - 削除確認が正しく動作する

7. **一括操作機能**
   - 複数選択時に一括操作ボタンが表示される
   - 一括操作ダイアログが正しく表示される
   - 一括操作の実行が正しく動作する

8. **エラーハンドリング**
   - データ取得エラー時にエラーメッセージが表示される
   - API エラー時にトーストが表示される

9. **ローディング状態**
   - データ読み込み中にローディングスピナーが表示される

10. **アクセシビリティ**
    - 適切なランドマークが設定されている
    - フォーム要素に適切なラベルが設定されている

11. **レスポンシブ対応**
    - 統計カードが格子状に配置される
    - フィルタが格子状に配置される

12. **パフォーマンス**
    - 大量のデータでも正常にレンダリングされる

**Playwright Implementation Priority**: High

### Classes Management Page Tests

**File**: `src/app/admin/classes/__tests__/page.test.tsx` (EXCLUDED FROM UNIT TESTS)

#### Excluded Test Categories:
1. **基本的なレンダリング**
   - 正常にレンダリングされる
   - 新規登録ボタンが表示される  
   - 統計情報が正しく表示される

2. **データテーブル**
   - クラス一覧が正しく表示される
   - 検索機能が動作する
   - 選択機能が動作する

3. **フィルタリング機能**
   - 検索フィールドが表示される
   - 学年フィルタが表示される
   - CSV出力ボタンが表示される

4. **新規作成機能**
   - 新規作成ボタンクリックでダイアログが開く
   - 作成フォームが正しく表示される
   - フォーム送信が正しく動作する

5. **編集機能**
   - 編集ボタンクリックでダイアログが開く
   - 編集フォーム送信が正しく動作する

6. **削除機能**
   - 図書委員がいるクラスの削除ボタンが無効化される
   - 削除ボタンクリックで確認ダイアログが開く
   - 削除確認が正しく動作する

7. **一括操作機能**
   - 複数選択時に一括操作ボタンが表示される
   - 一括操作ダイアログが正しく表示される
   - 一括操作の実行が正しく動作する

8. **エラーハンドリング**
   - データ取得エラー時にエラーメッセージが表示される
   - API エラー時にトーストが表示される

9. **ローディング状態**
   - データ読み込み中にローディングスピナーが表示される

10. **アクセシビリティ**
    - 適切なランドマークが設定されている
    - フォーム要素に適切なラベルが設定されている

11. **レスポンシブ対応**
    - 統計カードが格子状に配置される
    - フィルタが格子状に配置される

12. **パフォーマンス**
    - 大量のデータでも正常にレンダリングされる

13. **フロントエンドテイストの検証**
    - 絵文字が適切に表示されている
    - Comic Sans MSフォントが適用されている
    - パステルカラーが統計カードに適用されている

**Playwright Implementation Priority**: High

### Room Management Page Tests

**File**: `src/app/admin/rooms/__tests__/page.test.tsx`

#### Skipped Tests:
1. **Form Interactions**
   - Creation form with validation
   - Edit form with pre-populated data
   - Form submission and success feedback

2. **Dialog Workflows**
   - Create room dialog
   - Edit room dialog
   - Delete confirmation dialog
   - Bulk operations dialog

3. **Advanced UI Features**
   - Comic Sans MS font rendering
   - Emoji display in UI elements
   - Responsive layout testing

**Playwright Implementation Priority**: Medium

### Schedule Management Tests

**File**: `src/components/schedule/__tests__/schedule-list.test.tsx`

#### Skipped Tests:
1. **Complex Filtering**
   - Multi-criteria filtering
   - Filter state persistence
   - Real-time search results

2. **User Interaction Flows**
   - Schedule item selection
   - Bulk schedule operations
   - CSV export functionality

**Playwright Implementation Priority**: Medium

### Dashboard Integration Tests

**File**: `src/app/dashboard/__tests__/page.test.tsx`

#### Skipped Tests:
1. **Widget Interactions**
   - Real-time data updates
   - Widget click-through navigation
   - Responsive dashboard layout

2. **Data Visualization**
   - Chart rendering and interactions
   - Statistics card updates
   - Live data refresh

**Playwright Implementation Priority**: Low

### React Hook Tests

**File**: `src/lib/hooks/__tests__/use-schedule-generation.test.ts` (EXCLUDED FROM UNIT TESTS)

#### Excluded Test Categories:
1. **初期状態テスト**
   - 初期値が正しく設定されている
   - useScheduleGeneration フックの基本動作確認

2. **スケジュール生成成功シナリオ**
   - 成功時の状態更新を正しく処理する
   - プログレス進行をシミュレートする
   - API完了まで適切に待機する
   - 最終状態が正しく設定される
   - APIコールバック確認
   - Toast通知の確認

3. **スケジュール生成エラーシナリオ**
   - APIエラーレスポンスを正しく処理する
   - ネットワークエラーを正しく処理する
   - エラー時の状態更新処理
   - エラーコールバック確認
   - エラートースト通知の確認

4. **非同期処理とタイマー**
   - setInterval による進捗シミュレーション
   - fetch API との組み合わせ
   - React state updates と act() の同期
   - タイマーのクリーンアップ処理

5. **複雑な状態管理**
   - isGenerating 状態の管理
   - progress 状態の管理
   - 非同期処理中の状態同期
   - エラー時の状態リセット

**Implementation Challenge**: 
このテストは React Testing Library の act() 要件とsetInterval/fetch の組み合わせによる複雑な非同期処理のため、単体テストでは困難。実際のブラウザ環境での E2E テストがより適切。

**Playwright Implementation Priority**: Medium

## Step-by-Step Implementation Plan

### Phase 1: Setup and Configuration (1-2 days)

- [ ] Install Playwright and configure test environment
- [ ] Set up test database and seeding scripts
- [ ] Configure CI/CD pipeline for e2e testing
- [ ] Create page object base classes
- [ ] Set up test data management utilities

### Phase 2: High Priority Tests (2-3 days)

- [ ] Implement student management e2e tests
- [ ] Create classes management e2e tests
- [ ] Set up form validation testing utilities
- [ ] Implement modal dialog testing patterns
- [ ] Create React hook e2e tests for schedule generation

### Phase 3: Medium Priority Tests (2-3 days)

- [ ] Implement room management e2e tests
- [ ] Create schedule management e2e tests
- [ ] Set up complex filtering test scenarios
- [ ] Implement bulk operations testing

### Phase 4: Integration and Optimization (1-2 days)

- [ ] Set up parallel test execution
- [ ] Optimize test performance
- [ ] Add comprehensive error handling
- [ ] Create test maintenance documentation

## Testing Requirements

### E2E Test Structure

```typescript
// tests/e2e/student-management.spec.ts
import { test, expect } from '@playwright/test'
import { StudentManagementPage } from '../page-objects/student-management'

test.describe('Student Management', () => {
  test('should create new student successfully', async ({ page }) => {
    const studentPage = new StudentManagementPage(page)
    await studentPage.goto()
    await studentPage.clickCreateButton()
    await studentPage.fillCreateForm({
      name: 'テスト太郎',
      grade: 5,
      className: '1組'
    })
    await studentPage.submitForm()
    await expect(studentPage.successMessage).toBeVisible()
  })
})
```

### Page Object Pattern

```typescript
// tests/page-objects/student-management.ts
export class StudentManagementPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/students')
  }

  async clickCreateButton() {
    await this.page.click('[data-testid="create-student-button"]')
  }

  async fillCreateForm(data: StudentData) {
    await this.page.fill('[data-testid="student-name"]', data.name)
    await this.page.selectOption('[data-testid="student-grade"]', data.grade.toString())
    await this.page.fill('[data-testid="student-class"]', data.className)
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-button"]')
  }

  get successMessage() {
    return this.page.locator('[data-testid="success-message"]')
  }
}
```

### Test Data Management

```typescript
// tests/helpers/test-data.ts
export async function seedTestData() {
  // Set up test database with known data
  await db.student.createMany({
    data: [
      { name: 'テスト太郎', grade: 5, className: '1組' },
      { name: 'テスト花子', grade: 6, className: '2組' }
    ]
  })
}

export async function cleanupTestData() {
  // Clean up test data after tests
  await db.student.deleteMany({})
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Start development server
        run: npm run dev &
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      - name: Run Playwright tests
        run: npx playwright test
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage Mapping

### Critical User Journeys

1. **Student Management Flow**
   - Create → Edit → Delete student
   - Bulk operations on multiple students
   - Search and filter students

2. **Class Management Flow**
   - Create → Edit → Delete class
   - Assign students to classes
   - Manage class settings

3. **Room Management Flow**
   - Create → Edit → Delete room
   - Manage room capacity and settings
   - Bulk room operations

4. **Schedule Management Flow**
   - Generate schedules
   - Edit schedule assignments
   - Export schedules

### Form Validation Testing

- **Required Field Validation**
- **Format Validation (email, phone, etc.)**
- **Real-time Validation Feedback**
- **Form Submission Error Handling**

### UI Component Testing

- **Modal Dialog Workflows**
- **Data Table Interactions**
- **Search and Filter Functionality**
- **Responsive Design Testing**

## Definition of Done

- [ ] All skipped UI tests converted to Playwright e2e tests
- [ ] Tests run reliably in CI/CD pipeline
- [ ] Page object model implemented for maintainability
- [ ] Test data management properly implemented
- [ ] Documentation for running and maintaining tests
- [ ] Code review completed and approved
- [ ] Tests achieve minimum 80% coverage of critical user journeys

## Resources

### Documentation
- [Playwright Testing Documentation](https://playwright.dev/docs/intro)
- [Page Object Model Best Practices](https://playwright.dev/docs/pom)
- [Test Data Management](https://playwright.dev/docs/test-fixtures)

### Examples
- Existing component tests in `src/components/**/__tests__/`
- Form validation patterns in `src/lib/schemas/`
- UI component implementations in `src/components/ui/`

### Learning Materials
- [Playwright Tutorial](https://playwright.dev/docs/writing-tests)
- [E2E Testing Best Practices](https://github.com/microsoft/playwright/blob/main/docs/src/best-practices.md)
- [CI/CD Integration Guide](https://playwright.dev/docs/ci)

---

## Implementation Results

### Work Completed

- [ ] **Playwright Setup**: Framework installation and configuration
- [ ] **Test Infrastructure**: Page objects and utilities
- [ ] **Student Management Tests**: Complete e2e test suite
- [ ] **Classes Management Tests**: Complete e2e test suite
- [ ] **Room Management Tests**: Complete e2e test suite
- [ ] **Schedule Management Tests**: Complete e2e test suite
- [ ] **CI/CD Integration**: GitHub Actions workflow
- [ ] **Documentation**: Test maintenance and usage guide

### Challenges Faced

[To be filled during implementation]

### Solutions Implemented

[To be filled during implementation]

### Testing Results

- **Test Coverage**: [X]% of critical user journeys
- **Tests Passing**: [X/X]
- **CI/CD Integration**: [Success/Failure status]
- **Performance**: Average test execution time

### Code Review Feedback

[To be filled during review]

### Lessons Learned

[To be filled during implementation]

### Time Tracking

- **Estimated Time**: 5-8 days
- **Actual Time**: [To be filled]
- **Variance**: [Explanation if significantly different]

---

## Post-Implementation Checklist

- [ ] Pull request created and linked
- [ ] All skipped tests documented and converted
- [ ] CI/CD pipeline updated with e2e tests
- [ ] Documentation updated with test maintenance guide
- [ ] Team training on Playwright testing provided
- [ ] Issue marked as completed
- [ ] Knowledge shared with development team