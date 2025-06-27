# Issue #007: レイアウトコンポーネントの作成

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, layout, components, ui

## Description

アプリケーション全体で使用するレイアウトコンポーネントを作成します。ヘッダー、サイドバー、フッター、ページレイアウトなど、一貫したレイアウト構造を提供するコンポーネントを実装します。

## Background

フロントエンド設計書で定義されているレイアウト設計に基づき、レスポンシブ対応とアクセシビリティを考慮したレイアウトコンポーネントを作成します。

## Acceptance Criteria

- [ ] Headerコンポーネントが作成されている
- [ ] PageLayoutコンポーネントが作成されている
- [ ] Navigationコンポーネントが作成されている
- [ ] FooterコンポーネントがOptionalで作成されている
- [ ] レスポンシブ対応が実装されている
- [ ] アクセシビリティ対応が実装されている
- [ ] TypeScript対応が完了している

## Implementation Guidelines

### Getting Started

1. Issue #006（基本UIコンポーネント）が完了していることを確認
2. フロントエンド設計書のレイアウト設計を確認
3. モバイルファーストアプローチで実装

### Main Components

#### 1. Header Component

##### src/components/layout/header.tsx

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, ChevronDown, User, LogOut, Settings, Users, Calendar, Home, Building } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // TODO: 認証コンテキストから取得
  const user = { displayName: '山田先生', email: 'yamada@school.jp' }

  const navigationItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: Home },
    { href: '/admin/classes', label: 'クラス管理', icon: Building },
    { href: '/admin/students', label: '図書委員管理', icon: Users },
    { href: '/admin/schedules', label: '当番表管理', icon: Calendar },
    { href: '/admin/settings', label: 'システム設定', icon: Settings },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">📚</span>
              <span className="hidden sm:inline text-lg md:text-xl font-bold">
                図書委員当番システム
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">ダッシュボード</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    管理 <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/classes">クラス管理</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/students">図書委員管理</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/schedules">当番表管理</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">システム設定</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          {/* User Menu & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                👤 {user.displayName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="grid gap-2 py-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      👤 {user.displayName}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
```

#### 2. Page Layout Component

##### src/components/layout/page-layout.tsx

```typescript
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageLayout({
  children,
  title,
  description,
  actions,
  className
}: PageLayoutProps) {
  return (
    <div className={cn('container mx-auto py-6 space-y-6', className)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
```

#### 3. Main Layout Component

##### src/components/layout/main-layout.tsx

```typescript
import { Header } from './header'
import { ErrorBoundary } from '@/components/common/error-boundary'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  )
}
```

#### 4. Root Layout Update

##### src/app/layout.tsx

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '図書委員当番システム',
  description: '小学校図書委員の当番割り当てを自動化するシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        inter.className
      )}>
        {children}
      </body>
    </html>
  )
}
```

### Testing Page

#### src/app/layout-test/page.tsx

```typescript
import { MainLayout } from '@/components/layout/main-layout'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Download, Settings } from 'lucide-react'

export default function LayoutTestPage() {
  return (
    <MainLayout>
      <PageLayout
        title="レイアウトテストページ"
        description="レイアウトコンポーネントの動作確認"
        actions={
          <>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規追加
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>コンテンツエリア</CardTitle>
              <CardDescription>
                ページレイアウトのコンテンツエリアです
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>ここにページの主要コンテンツが表示されます。</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>カード {i + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>レスポンシブ対応のテスト用カードです。</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
```

### Resources

- [Next.js Layout Documentation](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
- [Responsive Design Patterns](https://web.dev/responsive-web-design-basics/)
- [ARIA Navigation Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/navigation/)

## Implementation Results

### Work Completed

- [ ] Headerコンポーネント作成
- [ ] PageLayoutコンポーネント作成
- [ ] MainLayoutコンポーネント作成
- [ ] RootLayout更新
- [ ] レスポンシブ対応実装
- [ ] モバイルメニュー実装
- [ ] アクセシビリティ対応
- [ ] テストページ作成

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Testing Results

- [ ] デスクトップ表示確認
- [ ] タブレット表示確認
- [ ] モバイル表示確認
- [ ] ナビゲーション動作確認
- [ ] キーボードナビゲーション確認
- [ ] スクリーンリーダー対応確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #009: 認証コンテキスト実装
2. Issue #010: ログインフォーム作成
3. Issue #022: ログインページ実装
