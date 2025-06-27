# Issue #006: 基本UIコンポーネントの作成と標準化

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 3-5 hours  
**Type**: Frontend  
**Labels**: frontend, components, ui, reusable

## Description

shadcn/uiをベースとして、図書委員当番システム専用の基本UIコンポーネントを作成します。一貫したデザインシステムを確立し、再利用可能なコンポーネントライブラリを構築することで、開発効率と品質を向上させます。

## Background

フロントエンド設計書で定義されているコンポーネント設計に基づき、プロジェクト全体で使用する標準UIコンポーネントを作成します。これにより、一貫したユーザー体験と保守性の高いコードベースを実現します。

## Acceptance Criteria

- [ ] LoadingSpinnerコンポーネントが作成されている
- [ ] ErrorBoundaryコンポーネントが作成されている
- [ ] ConfirmationDialogコンポーネントが作成されている
- [ ] Paginationコンポーネントが作成されている
- [ ] Iconコンポーネントが作成されている
- [ ] 各コンポーネントがTypeScript対応している
- [ ] アクセシビリティ対応が実装されている
- [ ] レスポンシブ対応が確認されている
- [ ] Storybookまたはテストページで動作確認されている

## Implementation Guidelines

### Getting Started

1. Issue #005（shadcn/uiセットアップ）が完了していることを確認
2. フロントエンド設計書のコンポーネント設計を確認
3. 一つずつコンポーネントを作成し、動作確認する

### Technical Requirements

#### Additional Dependencies

```bash
# React Error Boundary
npm install react-error-boundary

# Animation libraries (optional)
npm install framer-motion

# Development dependencies
npm install -D @types/react @types/react-dom
```

### Component Implementations

#### 1. LoadingSpinner Component

##### src/components/common/loading-spinner.tsx

```typescript
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  text,
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-4', className)}>
      <Loader2
        className={cn('animate-spin text-primary', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

// Specialized loading components
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="読み込み中..." />
    </div>
  )
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 w-[100px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[150px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[100px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[80px] bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

export function CardLoading() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-6 w-[200px] bg-muted animate-pulse rounded" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-[80%] bg-muted animate-pulse rounded" />
    </div>
  )
}
```

#### 2. ErrorBoundary Component

##### src/components/common/error-boundary.tsx

```typescript
'use client'

import React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          エラーが発生しました
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>申し訳ございません</AlertTitle>
          <AlertDescription>
            予期しないエラーが発生しました。ページを再読み込みして再試行してください。
          </AlertDescription>
        </Alert>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              詳細を表示（開発環境）
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            再試行
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

export function ErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
  onError
}: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo)
        onError?.(error, errorInfo)
        // TODO: エラー監視サービスに送信
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// Specialized error boundaries
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>コンポーネントエラー</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>このコンポーネントの読み込みに失敗しました。</p>
            <Button size="sm" onClick={resetErrorBoundary}>
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

#### 3. ConfirmationDialog Component

##### src/components/common/confirmation-dialog.tsx

```typescript
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Save, AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
  isLoading = false
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // エラーは上位コンポーネントで処理することを想定
    } finally {
      setIsConfirming(false)
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
          >
            {isConfirming ? '処理中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Specialized confirmation dialogs
export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading = false
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  itemName: string
  isLoading?: boolean
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="削除の確認"
      description={`「${itemName}」を削除してもよろしいですか？この操作は取り消せません。`}
      confirmText="削除"
      variant="destructive"
      isLoading={isLoading}
    />
  )
}

export function ResetConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  description,
  isLoading = false
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  description: string
  isLoading?: boolean
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="リセットの確認"
      description={description}
      confirmText="リセット"
      variant="warning"
      isLoading={isLoading}
    />
  )
}
```

#### 4. Pagination Component

##### src/components/common/pagination.tsx

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  totalItems?: number
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 20,
  onPageSizeChange,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  className
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems || 0)

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表示件数:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {totalItems && (
          <span className="text-sm text-muted-foreground">
            {startItem}-{endItem} / {totalItems}件
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="最初のページ"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="前のページ"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            aria-label={typeof page === 'number' ? `ページ ${page}` : undefined}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="次のページ"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="最後のページ"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

#### 5. Icon Component

##### src/components/common/icon.tsx

```typescript
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }

  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      aria-hidden="true"
    />
  )
}

// Common icons for the application
export const AppIcons = {
  // Navigation
  Dashboard: () => <Icon icon={require('lucide-react').LayoutDashboard} />,
  Settings: () => <Icon icon={require('lucide-react').Settings} />,
  Users: () => <Icon icon={require('lucide-react').Users} />,

  // Actions
  Add: () => <Icon icon={require('lucide-react').Plus} />,
  Edit: () => <Icon icon={require('lucide-react').Edit} />,
  Delete: () => <Icon icon={require('lucide-react').Trash2} />,
  Save: () => <Icon icon={require('lucide-react').Save} />,

  // Status
  Success: () => <Icon icon={require('lucide-react').CheckCircle} />,
  Error: () => <Icon icon={require('lucide-react').XCircle} />,
  Warning: () => <Icon icon={require('lucide-react').AlertTriangle} />,
  Info: () => <Icon icon={require('lucide-react').Info} />,

  // Library specific
  Book: () => <Icon icon={require('lucide-react').Book} />,
  Calendar: () => <Icon icon={require('lucide-react').Calendar} />,
  Clock: () => <Icon icon={require('lucide-react').Clock} />,
  School: () => <Icon icon={require('lucide-react').GraduationCap} />
}
```

### Testing Page

#### src/app/components-test/page.tsx

```typescript
'use client'

import { useState } from 'react'
import { LoadingSpinner, PageLoading, TableLoading, CardLoading } from '@/components/common/loading-spinner'
import { ErrorBoundary, PageErrorBoundary, ComponentErrorBoundary } from '@/components/common/error-boundary'
import { ConfirmationDialog, DeleteConfirmationDialog, ResetConfirmationDialog } from '@/components/common/confirmation-dialog'
import { Pagination } from '@/components/common/pagination'
import { Icon, AppIcons } from '@/components/common/icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings, Calendar } from 'lucide-react'

function ErrorComponent() {
  throw new Error('Test error from component')
}

export default function ComponentsTestPage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showError, setShowError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Common Components Test</h1>
        <p className="text-muted-foreground">
          共通コンポーネントの動作確認ページ
        </p>
      </div>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
          <CardDescription>ローディング表示コンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <LoadingSpinner size="sm" text="Small" />
            <LoadingSpinner size="md" text="Medium" />
            <LoadingSpinner size="lg" text="Large" />
          </div>
          <TableLoading rows={3} />
          <CardLoading />
        </CardContent>
      </Card>

      {/* Error Boundary */}
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary</CardTitle>
          <CardDescription>エラーバウンダリーコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowError(!showError)}>
            {showError ? 'エラーを非表示' : 'エラーを表示'}
          </Button>
          {showError && (
            <ComponentErrorBoundary>
              <ErrorComponent />
            </ComponentErrorBoundary>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Dialogs</CardTitle>
          <CardDescription>確認ダイアログコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowConfirm(true)}>
              基本ダイアログ
            </Button>
            <Button onClick={() => setShowDelete(true)} variant="destructive">
              削除ダイアログ
            </Button>
            <Button onClick={() => setShowReset(true)} variant="outline">
              リセットダイアログ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Icons</CardTitle>
          <CardDescription>アイコンコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Icon icon={Users} size="sm" />
            <Icon icon={Settings} size="md" />
            <Icon icon={Calendar} size="lg" />
          </div>
          <div className="flex gap-4 items-center">
            <AppIcons.Dashboard />
            <AppIcons.Add />
            <AppIcons.Success />
            <AppIcons.Book />
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Pagination</CardTitle>
          <CardDescription>ページネーションコンポーネント</CardDescription>
        </CardHeader>
        <CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            pageSize={pageSize}
            totalItems={195}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          console.log('Confirmed')
          setShowConfirm(false)
        }}
        title="確認"
        description="この操作を実行してもよろしいですか？"
      />

      <DeleteConfirmationDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => {
          console.log('Deleted')
          setShowDelete(false)
        }}
        itemName="田中花子"
      />

      <ResetConfirmationDialog
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={() => {
          console.log('Reset')
          setShowReset(false)
        }}
        description="すべての当番表がリセットされ、データは復元できません。"
      />
    </div>
  )
}
```

### Resources

- [React Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)
- [Tailwind CSS Animation](https://tailwindcss.com/docs/animation)
- [ARIA Guidelines](https://www.w3.org/WAI/ARIA/apg/)
- [フロントエンド設計書](../フロントエンド設計書.md)

## Implementation Results

### Work Completed

- [ ] LoadingSpinnerコンポーネント作成
- [ ] ErrorBoundaryコンポーネント作成
- [ ] ConfirmationDialogコンポーネント作成
- [ ] Paginationコンポーネント作成
- [ ] Iconコンポーネント作成
- [ ] テストページ作成
- [ ] TypeScript型定義確認
- [ ] アクセシビリティ確認
- [ ] レスポンシブ対応確認

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Testing Results

- [ ] テストページ (http://localhost:3000/components-test) で動作確認
- [ ] 各コンポーネントの表示確認
- [ ] インタラクション確認
- [ ] エラー処理確認
- [ ] レスポンシブ表示確認
- [ ] キーボードナビゲーション確認
- [ ] スクリーンリーダー対応確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Component Features

### LoadingSpinner

- 3つのサイズオプション（sm, md, lg）
- テキスト表示オプション
- アクセシビリティ対応（role, aria-live）
- 専用バリエーション（Page, Table, Card）

### ErrorBoundary

- 開発環境での詳細エラー表示
- 本番環境での安全なエラー表示
- 再試行機能
- 専用バリエーション（Page, Component）

### ConfirmationDialog

- 複数のバリアント（default, destructive, warning）
- 非同期処理対応
- 専用バリエーション（Delete, Reset）
- ローディング状態表示

### Pagination

- 省略表示対応（...）
- ページサイズ変更機能
- アイテム数表示
- キーボードナビゲーション対応

### Icon

- サイズ統一
- Lucide Reactベース
- 共通アイコンセット
- アクセシビリティ対応

## Next Steps

このIssue完了後の次のタスク：

1. Issue #007: レイアウトコンポーネント作成
2. Issue #008: テーブルコンポーネント作成
3. Issue #016: フォームバリデーションスキーマ作成

## Notes

- 日本語のアクセシビリティ対応を重視
- エラーメッセージは分かりやすい日本語で
- コンポーネントの再利用性を最大化
- パフォーマンスを考慮した実装
