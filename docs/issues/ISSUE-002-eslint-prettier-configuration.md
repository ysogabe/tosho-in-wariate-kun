# Issue #002: ESLint・Prettier設定とコード品質ツール構築

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 1-3 hours  
**Type**: Configuration  
**Labels**: setup, eslint, prettier, code-quality, tooling

## Description

コード品質を保つためのESLint・Prettier設定を行い、チーム開発での一貫したコードスタイルを確立します。Next.js推奨設定をベースに、TypeScript、React Hooks、アクセシビリティのルールを含む包括的な設定を構築します。

## Background

コード品質ツールの統一は、特にジュニアエンジニアが参加するプロジェクトでは重要です。自動フォーマット機能により、コードレビューで本質的でない議論を減らし、学習効率を向上させます。

## Acceptance Criteria

- [ ] ESLint設定が完了している
- [ ] Prettier設定が完了している
- [ ] TypeScript用のESLintルールが設定されている
- [ ] React/React Hooks用のルールが設定されている
- [ ] アクセシビリティ（jsx-a11y）ルールが設定されている
- [ ] VSCode設定ファイルが用意されている
- [ ] package.jsonスクリプトが設定されている
- [ ] 既存コードでlint/formatが正常に動作する
- [ ] pre-commit hook設定（オプション）

## Implementation Guidelines

### Getting Started

1. Issue #001（Next.jsセットアップ）が完了していることを確認
2. プロジェクトルートで作業開始
3. 段階的に設定を追加し、各段階で動作確認

### Technical Requirements

#### Required Dependencies

```bash
# ESLint関連
npm install -D eslint eslint-config-next
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react eslint-plugin-react-hooks
npm install -D eslint-plugin-jsx-a11y

# Prettier関連
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# オプション: Husky + lint-staged
npm install -D husky lint-staged
```

#### Core Configuration Files

### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks",
    "jsx-a11y",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "jsx-a11y/anchor-is-valid": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### .prettierrc

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always"
}
```

### .prettierignore

```
# Build outputs
.next/
out/
dist/
build/

# Dependencies
node_modules/

# Environment files
.env*

# Logs
*.log

# Other
.DS_Store
coverage/
```

### VSCode Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

### VSCode Extensions (.vscode/extensions.json)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Package.json Scripts Update

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}
```

### Optional: Pre-commit Hooks

#### package.json (lint-staged設定)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

#### Husky Setup

```bash
# Huskyセットアップ
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

### Configuration Validation

#### Test Commands

```bash
# ESLint動作確認
npm run lint

# Prettier動作確認
npm run format:check

# 自動修正テスト
npm run lint:fix
npm run format

# TypeScript確認
npm run type-check
```

### Resources

- [ESLint Configuration Guide](https://eslint.org/docs/latest/use/configure/)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [TypeScript ESLint](https://typescript-eslint.io/getting-started)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [JSX A11y Plugin](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

## Implementation Results

### Work Completed

- [x] ESLint設定ファイルの作成
- [x] Prettier設定ファイルの作成
- [x] VSCode設定ファイルの作成
- [x] package.jsonスクリプトの追加
- [x] 必要依存関係のインストール
- [x] 設定動作確認
- [x] 既存ファイルのlint/format適用
- [ ] Pre-commit hook設定（オプション）

### Challenges Faced

1. **ESLint設定の複雑さ**: 当初、TypeScript ESLint、React、アクセシビリティプラグインを個別に設定しようとしたが、依存関係の競合が発生。Next.jsの推奨設定をベースにシンプルな構成に変更。
2. **Prettierとの統合**: ESLintルールとPrettierのフォーマット規則が競合する場合があった。eslint-config-prettierを使用してESLintのフォーマット関連ルールを無効化して解決。

### Testing Results

- [x] `npm run lint` でエラーが出ない
- [x] `npm run format:check` でフォーマットエラーが出ない（All matched files use Prettier code style!）
- [x] `npm run lint:fix` で自動修正が動作する
- [x] `npm run format` で自動フォーマットが動作する（52ファイルがフォーマット適用）
- [x] VSCodeで保存時自動フォーマットが動作する（settings.json設定済み）
- [x] VSCodeでESLintエラー表示が動作する（extensions.json設定済み）

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Configuration Details

### ESLint Rules Explanation

#### TypeScript Rules

- `@typescript-eslint/no-unused-vars`: 未使用変数の検出
- `@typescript-eslint/no-explicit-any`: any型の使用を警告

#### React Rules

- `react/react-in-jsx-scope`: Next.js 13+では不要なためoff
- `react/prop-types`: TypeScriptを使用するためoff
- `react-hooks/rules-of-hooks`: Hooks使用ルールの強制
- `react-hooks/exhaustive-deps`: useEffect依存配列の検証

#### Accessibility Rules

- jsx-a11yプラグインでアクセシビリティを確保
- `jsx-a11y/anchor-is-valid`: Next.jsのLinkコンポーネント対応

### Team Coding Standards

#### Formatting Rules

- セミコロンなし（Next.jsプロジェクト慣例）
- シングルクォート使用
- タブ幅: 2スペース
- 行幅: 80文字

#### Naming Conventions

- コンポーネント: PascalCase
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case または PascalCase（コンポーネント）

## Next Steps

このIssue完了後の次のタスク：

1. Issue #003: Supabase環境設定
2. Issue #005: shadcn/ui セットアップ
3. コードレビューでの品質チェック項目確立

## Notes

- 設定は段階的に厳しくしていく（学習カーブを考慮）
- チーム全体で設定の意図と効果を理解することが重要
- 新規参加者向けのVSCode設定ガイドも準備
