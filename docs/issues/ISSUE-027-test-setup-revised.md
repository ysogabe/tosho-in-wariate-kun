# Issue #027: テストセットアップ（修正版）

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Testing  
**Labels**: testing, setup, jest, ci-cd, infrastructure

## Description

プロジェクトのMVPフェーズに適したテスト環境をセットアップします。実用的な単体テスト（Jest + Testing Library）とCI/CD統合を整備し、継続的開発を支援するテスト基盤を構築します。

## Background

### 設計変更の理由

初期設計書（ISSUE-027）では70%のカバレッジ目標を設定していましたが、以下の理由により現実的な目標値に調整します：

1. **MVPフェーズの特性**
   - 機能の実装速度を優先する必要がある
   - プロトタイプレベルでの検証が主目的
   - 過度なテスト要求は開発速度を阻害する

2. **プロジェクト規模と工数制約**
   - 小規模チームでの開発
   - 限られた開発工数での実装
   - ビジネス価値の検証が最優先

3. **段階的品質向上**
   - MVPで基本的なテスト基盤を確立
   - 本格運用時に段階的にカバレッジを向上
   - 実用性を重視した現実的なアプローチ

### 修正された目標値の妥当性

**MVPフェーズ（現在）:**

- **カバレッジ目標: 40%**
- **対象**: 重要なビジネスロジックとUI コンポーネント
- **テスト範囲**: 単体テスト + CI/CD基盤

**理由**:

- 40%は実装コストと品質のバランスが取れた現実的な目標値
- コアコンポーネントの品質は確保しつつ、開発速度を維持
- 将来の拡張に向けたテスト基盤は確立

**本格運用フェーズ（将来）:**

- **カバレッジ目標: 70%**
- **対象**: 全機能 + E2Eテスト
- **テスト範囲**: 単体 + 統合 + E2E

## Acceptance Criteria

- [ ] Jest + Testing Library の設定が完了している
- [ ] GitHub Actions CI/CD統合が完了している
- [ ] 基本UIコンポーネントの単体テストが実装されている
- [ ] テストカバレッジ40%を達成している
- [ ] テストユーティリティとモック設定が準備されている
- [ ] 開発ワークフローにテスト実行が統合されている

## Implementation Guidelines

### Jest Configuration（修正版）

#### jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx,ts,tsx}',
    'src/lib/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],

  // MVPフェーズの現実的なカバレッジ目標
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },

  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(?:react-error-boundary|@radix-ui)/).*/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

module.exports = createJestConfig(config)
```

### GitHub Actions CI/CD

#### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, feature/**]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:ci

      - name: Upload coverage reports to Codecov
        if: matrix.node-version == '20.x'
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

      - name: Build application
        run: npm run build
```

### テスト実装戦略（MVPフェーズ）

#### 優先度高：必須テスト

1. **UIコンポーネント**
   - LoadingSpinner, Icon, Pagination
   - ErrorBoundary, ConfirmationDialog
   - 基本的な表示とプロパティのテスト

2. **ユーティリティ関数**
   - `src/lib/utils.ts`
   - 日付処理、バリデーション関数

#### 優先度中：推奨テスト

1. **フォームコンポーネント**
   - バリデーション機能
   - 送信処理

2. **カスタムフック**
   - 状態管理ロジック

#### 優先度低：将来実装

1. **ページコンポーネント**
2. **API統合テスト**
3. **E2Eテスト**

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:components": "jest --testPathPattern=components",
    "test:utils": "jest --testPathPattern=lib"
  }
}
```

## 段階的品質向上計画

### フェーズ1: MVP（現在）

- **目標**: カバレッジ40%
- **期間**: 開発初期〜MVP完成
- **対象**: コアコンポーネント + ユーティリティ

### フェーズ2: ベータ版

- **目標**: カバレッジ55%
- **期間**: MVP完成後
- **対象**: フォーム + API統合テスト追加

### フェーズ3: 本格運用

- **目標**: カバレッジ70%
- **期間**: ベータテスト後
- **対象**: E2Eテスト + 統合テスト追加

## Implementation Results

### Work Completed

- [ ] Jest設定（修正版）完了
- [ ] GitHub Actions CI統合完了
- [ ] 基本UIコンポーネントテスト実装
- [ ] テストユーティリティ作成
- [ ] カバレッジ40%達成

### Quality Metrics

- [ ] ビルドエラーなし
- [ ] 全テスト合格
- [ ] カバレッジ目標達成
- [ ] CI/CDパイプライン正常動作

## Rationale for Coverage Target

### 40%カバレッジが適切な理由

1. **実装対効果**
   - 最も重要な機能の品質確保
   - 開発速度の維持
   - リファクタリング安全性の確保

2. **業界標準との比較**
   - MVPフェーズ: 30-50%が一般的
   - プロダクション: 60-80%が推奨
   - 当プロジェクトは適正範囲内

3. **継続的改善**
   - テスト文化の醸成
   - 将来の拡張性確保
   - 段階的品質向上

## Next Steps

1. 基本UIコンポーネントテスト実装
2. GitHub Actions設定
3. カバレッジレポート確認
4. フェーズ2計画策定
