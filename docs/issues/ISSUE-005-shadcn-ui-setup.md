# Issue #005: shadcn/ui セットアップとUIコンポーネント基盤構築

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 2-4 hours  
**Type**: Frontend  
**Labels**: frontend, ui, shadcn-ui, components, setup

## Description

モダンで高品質なUIコンポーネントライブラリshadcn/uiをセットアップし、図書委員当番システムのUI基盤を構築します。Tailwind CSSベースのアクセシブルなコンポーネントを導入し、一貫したデザインシステムを確立します。

## Background

フロントエンド設計書で定義されているように、shadcn/uiはRadix UIベースのアクセシブルなコンポーネントを提供し、コピー&ペースト方式でプロジェクトに組み込むことができます。これにより、高品質なUIを迅速に構築できます。

## Acceptance Criteria

- [ ] shadcn/uiがセットアップされている
- [ ] 基本UIコンポーネントがインストールされている
- [ ] テーマ設定が完了している
- [ ] コンポーネント動作確認が完了している
- [ ] TypeScript統合が正しく動作している
- [ ] Tailwind CSS統合が正しく動作している
- [ ] アクセシビリティ機能が有効になっている
- [ ] レスポンシブ対応が確認されている

## Implementation Guidelines

### Getting Started

1. Issue #001（Next.jsセットアップ）が完了していることを確認
2. Tailwind CSSが正しくセットアップされていることを確認
3. shadcn/ui公式ドキュメントを参照

### Prerequisites

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- React 18+

### Technical Requirements

#### shadcn/ui Dependencies

```bash
# 基本依存関係
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# TypeScript型定義
npm install -D @types/node
```

### Initial Setup

#### 1. shadcn/ui初期化

```bash
npx shadcn-ui@latest init
```

#### 設定オプション（プロンプト時の選択）

```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … src/app/globals.css
✔ Would you like to use CSS variables for colors? … yes
✔ Where is your tailwind.config.js located? … tailwind.config.js
✔ Configure the import alias for components? … src/components
✔ Configure the import alias for utils? … src/lib/utils
```

#### 2. 必要なコンポーネントのインストール

```bash
# 基本コンポーネント
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
```

### Theme Configuration

#### components.json (自動生成される設定ファイル)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

#### src/app/globals.css (更新される内容)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### tailwind.config.js (更新内容)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Utils Configuration

#### src/lib/utils.ts (自動生成される)

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Component Testing Page

#### src/app/ui-test/page.tsx

```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, User } from "lucide-react"

export default function UITestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">shadcn/ui Component Test</h1>
        <p className="text-muted-foreground">
          図書委員当番システムで使用するUIコンポーネントのテスト画面
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>各種ボタンコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><User className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Components */}
      <Card>
        <CardHeader>
          <CardTitle>Form Components</CardTitle>
          <CardDescription>フォーム関連コンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名</Label>
              <Input id="name" placeholder="山田太郎" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">クラス</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="クラスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-1">5年1組</SelectItem>
                  <SelectItem value="5-2">5年2組</SelectItem>
                  <SelectItem value="6-1">6年1組</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea id="notes" placeholder="備考を入力..." />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="active" />
            <Label htmlFor="active">アクティブ</Label>
          </div>
        </CardContent>
      </Card>

      {/* Badges and Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Badges & Alerts</CardTitle>
          <CardDescription>バッジとアラートコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>5年生</Badge>
            <Badge variant="secondary">6年生</Badge>
            <Badge variant="outline">前期</Badge>
            <Badge variant="destructive">エラー</Badge>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              当番表を再生成すると、既存の割り当てが変更される可能性があります。
            </AlertDescription>
          </Alert>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>成功</AlertTitle>
            <AlertDescription>
              前期の当番表が正常に生成されました。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Table Example */}
      <Card>
        <CardHeader>
          <CardTitle>Table</CardTitle>
          <CardDescription>図書委員一覧テーブル例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">氏名</th>
                  <th className="text-left p-2">学年</th>
                  <th className="text-left p-2">クラス</th>
                  <th className="text-left p-2">ステータス</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">田中花子</td>
                  <td className="p-2">5年</td>
                  <td className="p-2">5年1組</td>
                  <td className="p-2"><Badge>アクティブ</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">佐藤次郎</td>
                  <td className="p-2">6年</td>
                  <td className="p-2">6年2組</td>
                  <td className="p-2"><Badge>アクティブ</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Test */}
      <Card>
        <CardHeader>
          <CardTitle>Dark Mode Test</CardTitle>
          <CardDescription>ダークモード対応の確認</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ブラウザの開発者ツールでhtmlタグにclass="dark"を追加すると、
            ダークモードでの表示を確認できます。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Accessibility Testing

#### src/components/ui/button.tsx の確認

```typescript
// 生成されたButtonコンポーネントでアクセシビリティ機能を確認
// - ARIA属性の適切な設定
// - キーボードナビゲーション対応
// - フォーカス管理
// - スクリーンリーダー対応
```

### Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [フロントエンド設計書](../フロントエンド設計書.md)

## Implementation Results

### Work Completed

- [x] shadcn/ui初期セットアップ（components.json設定完了）
- [x] 基本コンポーネントのインストール（Button, Card, Input）
- [x] テーマ設定の完了（CSS変数、ダークモード対応）
- [x] utils関数の設定（cn関数、clsx + tailwind-merge）
- [x] テストページの作成（/test-ui）
- [x] 全コンポーネントの動作確認（ビルド成功、型エラーなし）
- [x] レスポンシブ対応確認（グリッドレイアウト、レスポンシブクラス）
- [x] アクセシビリティ確認（Radix UI基盤、フォーカス管理）

### Challenges Faced

1. **import パス修正**: shadcn/ui CLIが生成したコンポーネントのimportパスが相対パス（"src/lib/utils"）で生成されたため、TypeScriptパスエイリアス（"@/lib/utils"）に修正が必要でした。

2. **Prettier フォーマット問題**: shadcn/ui CLIが生成したコードがPrettierの設定（シングルクォート）と異なっていたため、`npm run format`でフォーマット修正が必要でした。

3. **依存関係の統合**: 既存のTailwind設定とshadcn/ui要件の統合では、CSS変数システムとアニメーションプラグインの追加が必要でした。

### Testing Results

- [x] テストページ (http://localhost:3000/test-ui) でコンポーネント表示確認
- [x] 各ボタンの動作確認（variant, size プロパティ）
- [x] フォーム要素の入力確認（placeholder, disabled状態）
- [x] レスポンシブ表示確認（grid system, responsive classes）
- [x] ダークモード表示確認（CSS変数、dark クラス対応）
- [x] Next.jsビルドテスト成功（型安全性確認）
- [x] 開発サーバー起動成功（http://localhost:3000）

### Code Review Feedback

- **推奨**: テーマカスタマイズ（学校向け色調整）は後続Issueで検討
- **推奨**: 追加コンポーネント（Select, Table等）は必要に応じて段階的に追加
- **確認**: 日本語テキストの表示に問題なし、フォント設定は適切

## Component Checklist

### Installed Components

- [x] Button - ボタンコンポーネント（各種variant, size対応）
- [x] Input - 入力フィールド（type, placeholder, disabled対応）
- [x] Card - カードコンテナ（Header, Content, Footer, Title, Description）
- [ ] Label - ラベル
- [ ] Table - テーブル
- [ ] Form - フォーム
- [ ] Select - 選択コンポーネント
- [ ] Textarea - テキストエリア
- [ ] Checkbox - チェックボックス
- [ ] Badge - バッジ
- [ ] Avatar - アバター
- [ ] Dropdown Menu - ドロップダウンメニュー
- [ ] Alert - アラート
- [ ] Toast - トースト通知
- [ ] Skeleton - ローディング表示
- [ ] Dialog - モーダルダイアログ
- [ ] Sheet - サイドシート

### Future Components (後続Issueで追加)

- [ ] Calendar - カレンダー
- [ ] Pagination - ページネーション
- [ ] Progress - プログレスバー
- [ ] Tabs - タブ
- [ ] Toggle - トグル

## Design System Notes

### Color Scheme

- Primary: スレート系（落ち着いた学校らしい色合い）
- アクセント: 図書委員らしい色の検討
- エラー: 標準的な赤系
- 成功: 標準的な緑系

### Typography

- フォント: システムフォント（日本語対応）
- 見出し: セマンティックなヘディング階層
- 本文: 読みやすいサイズと行間

### Spacing

- 一貫したマージン・パディング
- レスポンシブ対応のスペーシング

## Next Steps

このIssue完了後の次のタスク：

1. Issue #006: 基本UIコンポーネント作成
2. Issue #007: レイアウトコンポーネント作成
3. Issue #010: ログインフォーム作成

## Notes

- 日本語フォント対応の確認
- 学校現場での使いやすさを重視
- アクセシビリティは最優先事項
- レスポンシブ対応は必須
