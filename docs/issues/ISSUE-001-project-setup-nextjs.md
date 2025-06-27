# Issue #001: Next.js プロジェクトの初期セットアップ

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 2-4 hours  
**Type**: Configuration  
**Labels**: setup, nextjs, configuration, environment

## Description

図書委員当番割り当てシステムのNext.js 15プロジェクトの初期セットアップを行います。App Routerを使用したモダンなNext.jsアプリケーションの基盤を構築し、TypeScriptとTailwind CSSの設定を含む開発環境を整備します。

## Background

MVPフェーズでは、Next.js統合アーキテクチャ（フロントエンド + API Routes）を採用します。この決定はADR 0005で文書化されており、小規模チームでの迅速な開発と運用コスト削減を目的としています。

## Acceptance Criteria

- [ ] Next.js 15プロジェクトがセットアップされている
- [ ] App Routerが正しく設定されている
- [ ] TypeScript設定が完了している
- [ ] Tailwind CSS設定が完了している
- [ ] 開発サーバーが正常に起動する
- [ ] 基本的なページ構造（layout.tsx, page.tsx）が作成されている
- [ ] 環境変数設定ファイル（.env.local.example）が用意されている
- [ ] package.jsonのscriptsが適切に設定されている

## Implementation Guidelines

### Getting Started

1. プロジェクトルートディレクトリで作業開始
2. 設計書の「システムアーキテクチャ設計書」を参照
3. Next.js公式ドキュメントのApp Routerガイドを確認

### Technical Requirements

- **Next.js Version**: 15.x以降
- **TypeScript**: 5.x以降
- **Tailwind CSS**: 3.x以降
- **Node.js**: 18.x以降
- **Package Manager**: npm (MVP段階ではシンプルに)

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # UIコンポーネント
├── lib/                   # ユーティリティ・サービス
└── types/                 # 型定義
```

### Setup Commands

```bash
# Next.js プロジェクト作成
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# または手動セットアップの場合
npm init -y
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint eslint-config-next
```

### Configuration Files

#### package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Environment Setup

#### .env.local.example

```bash
# Supabase Configuration (後続のIssueで設定)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_database_url

# Application
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [TypeScript with Next.js](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
- [Tailwind CSS Installation](https://tailwindcss.com/docs/guides/nextjs)
- [システムアーキテクチャ設計書](../システムアーキテクチャ設計書.md)

## Implementation Results

### Work Completed

- [x] Next.js 15プロジェクトの作成
- [x] TypeScript設定の完了
- [x] Tailwind CSS設定の完了
- [x] 基本ファイル構造の作成
- [x] package.json scriptsの設定
- [x] 環境変数テンプレートの作成
- [x] 開発サーバーの動作確認

### Challenges Faced

1. **Next.js 15設定の非推奨警告**: `next.config.js`のexperimental.appDirオプションが非推奨になっていたため削除。Next.js 15ではapp directoryがデフォルトで有効。
2. **autoprefixer依存関係エラー**: PostCSS設定でautoprefixerが見つからないエラーが発生。`npm install -D autoprefixer`で解決。
3. **既存frontendディレクトリとの競合**: モノレポ構造の既存ディレクトリがTypeScriptのパス解決に影響。tsconfig.jsonで該当ディレクトリを除外して解決。

### Testing Results

- [x] `npm run dev` でサーバーが正常に起動
- [x] http://localhost:3000 でページが表示される（HTTP 200レスポンス確認）
- [x] `npm run lint` でエラーが出ない
- [x] `npm run type-check` でTypeScriptエラーが出ない
- [x] `npm run build` でビルドが成功する（Static export: 4/4 pages）

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応内容を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #002: ESLint・Prettier設定
2. Issue #003: Supabase環境設定
3. Issue #005: shadcn/ui セットアップ

## Notes

- MVPフェーズでは機能を最小限に絞り、後続Issueで段階的に機能を追加
- package.jsonの依存関係は必要最小限に留める
- 開発効率を重視し、不要な設定は避ける
