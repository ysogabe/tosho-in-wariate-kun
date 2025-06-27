# Issue #027: テストセットアップ

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Testing  
**Labels**: testing, setup, jest, playwright, infrastructure

## Description

プロジェクト全体のテスト環境をセットアップします。単体テスト（Jest + Testing Library）、統合テスト、E2Eテスト（Playwright）の実行環境と設定を整備し、継続的なテスト実行基盤を構築します。

## Background

t_wada TDD方法論に基づき、品質保証と継続的開発を支援するテスト環境を構築します。各種テストツールの設定と、効率的なテスト実行のためのワークフロー整備を行います。

## Acceptance Criteria

- [ ] Jest + Testing Library の設定が完了している
- [ ] Playwright E2E テストの設定が完了している
- [ ] テスト用データベース設定が完了している
- [ ] テストスクリプトとワークフローが設定されている
- [ ] モックとテストユーティリティが準備されている
- [ ] CI/CD統合の準備が完了している
- [ ] テストカバレッジレポートが設定されている
- [ ] テストドキュメントが作成されている

## Implementation Guidelines

### Getting Started

1. プロジェクトの現在のテスト設定を確認
2. Next.js + TypeScript でのテストベストプラクティスを理解
3. TDD ワークフローの設計
4. テストデータとモックの準備方法を確認

### Main Implementation

#### 1. Jest Configuration

##### jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js アプリのパスを指定
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapping: {
    // path mapping の設定
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/lib/database.ts', // Prisma client
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
}

module.exports = createJestConfig(customJestConfig)
```

##### jest.setup.js

```javascript
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Supabase client mock
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}))

// Next.js router mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Prisma client mock
jest.mock('@/lib/database', () => ({
  prisma: {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// Fetch mock
global.fetch = jest.fn()

// matchMedia mock for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// IntersectionObserver mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// ResizeObserver mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
```

#### 2. Playwright Configuration

##### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// テスト用環境変数を読み込み
dotenv.config({ path: '.env.test.local' })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // セットアップ用プロジェクト
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // デスクトップブラウザ
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    // モバイルデバイス
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

#### 3. Test Utilities

##### src/lib/test-utils.tsx

```typescript
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/lib/context/auth-context'

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@school.jp',
  user_metadata: {
    displayName: 'テストユーザー',
  },
}

// Auth context wrapper
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AuthWrapper, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockClass = (overrides = {}) => ({
  id: 'class-1',
  name: 'A',
  year: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockStudent = (overrides = {}) => ({
  id: 'student-1',
  name: 'テスト太郎',
  grade: 5,
  classId: 'class-1',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  class: createMockClass(),
  ...overrides,
})

export const createMockRoom = (overrides = {}) => ({
  id: 'room-1',
  name: '図書室A',
  capacity: 4,
  description: 'メイン図書室',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockAssignment = (overrides = {}) => ({
  id: 'assignment-1',
  studentId: 'student-1',
  roomId: 'room-1',
  dayOfWeek: 1,
  term: 'FIRST_TERM' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  student: createMockStudent(),
  room: createMockRoom(),
  ...overrides,
})

// API mock helpers
export const mockApiResponse = (data: any, success = true) => ({
  success,
  data,
  ...(success ? {} : { error: { code: 'TEST_ERROR', message: 'Test error' } }),
})

export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
  })
}

// Form testing helpers
export const fillForm = async (container: HTMLElement, formData: Record<string, string>) => {
  const { getByLabelText, getByRole } = require('@testing-library/react')

  for (const [label, value] of Object.entries(formData)) {
    const input = getByLabelText(container, new RegExp(label, 'i'))
    await require('@testing-library/user-event').default.clear(input)
    await require('@testing-library/user-event').default.type(input, value)
  }
}

export const submitForm = async (container: HTMLElement) => {
  const { getByRole } = require('@testing-library/react')
  const submitButton = getByRole(container, 'button', { name: /送信|作成|更新|登録/i })
  await require('@testing-library/user-event').default.click(submitButton)
}
```

#### 4. Database Test Setup

##### src/lib/test-database.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const testPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = testPrisma

// テストデータのセットアップ
export async function setupTestData() {
  // テストクラスの作成
  const testClass = await testPrisma.class.create({
    data: {
      name: 'A',
      year: 5,
    },
  })

  // テスト図書室の作成
  const testRoom = await testPrisma.room.create({
    data: {
      name: '図書室A',
      capacity: 4,
      description: 'テスト用図書室',
      isActive: true,
    },
  })

  // テスト図書委員の作成
  const testStudent = await testPrisma.student.create({
    data: {
      name: 'テスト太郎',
      grade: 5,
      classId: testClass.id,
      isActive: true,
    },
  })

  return {
    testClass,
    testRoom,
    testStudent,
  }
}

// テストデータのクリーンアップ
export async function cleanupTestData() {
  await testPrisma.assignment.deleteMany()
  await testPrisma.student.deleteMany()
  await testPrisma.class.deleteMany()
  await testPrisma.room.deleteMany()
}

// テスト用トランザクション
export async function runInTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return testPrisma.$transaction(fn)
}
```

#### 5. Package.json Scripts

##### package.json (scripts section)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:unit": "jest --testPathPattern=src",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:ci && npm run test:e2e",
    "test:setup": "npm run db:test:setup",
    "db:test:setup": "dotenv -e .env.test.local -- npx prisma db push",
    "db:test:seed": "dotenv -e .env.test.local -- npx tsx prisma/seed-test.ts"
  }
}
```

#### 6. Environment Files

##### .env.test.local

```env
# Test Database
DATABASE_URL="postgresql://username:password@localhost:5432/tosho_test?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/tosho_test?schema=public"

# Supabase Test
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon-key"
SUPABASE_SERVICE_ROLE_KEY="test-service-role-key"

# E2E Test Settings
E2E_BASE_URL="http://localhost:3000"
E2E_TEST_EMAIL="test@school.jp"
E2E_TEST_PASSWORD="password123"

# Other test settings
NODE_ENV="test"
```

#### 7. GitHub Actions Workflow

##### .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tosho_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          cp .env.test.example .env.test.local
          npm run db:test:setup
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tosho_test

      - name: Run unit tests
        run: npm run test:ci

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tosho_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Setup test database
        run: |
          cp .env.test.example .env.test.local
          npm run db:test:setup
          npm run db:test:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tosho_test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Dependencies

#### package.json additions

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.8",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "dotenv-cli": "^7.3.0"
  }
}
```

### Resources

- [Next.js Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

## Implementation Results

### Work Completed

- [ ] Jest + Testing Library 設定
- [ ] Playwright E2E テスト設定
- [ ] テスト用データベース設定
- [ ] テストユーティリティ作成
- [ ] モック設定
- [ ] CI/CD ワークフロー設定
- [ ] テストスクリプト設定

### Testing Results

- [ ] 単体テスト実行確認
- [ ] E2Eテスト実行確認
- [ ] カバレッジレポート確認
- [ ] CI/CD パイプライン確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #028: E2Eテスト実装
2. Issue #029: デプロイ設定
3. Issue #030: ドキュメント整備
