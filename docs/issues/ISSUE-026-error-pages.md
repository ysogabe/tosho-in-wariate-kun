# Issue #026: エラーページの実装

**Priority**: Medium  
**Difficulty**: Beginner  
**Estimated Time**: 2-3 hours  
**Type**: Frontend  
**Labels**: frontend, pages, error-handling, ux

## Description

システムで発生する各種エラーに対応するエラーページを実装します。404、500、403、ネットワークエラーなど、様々なエラー状況に対して適切なユーザー体験を提供するページを作成します。

## Background

フロントエンド設計書で定義されたエラーハンドリングの要件に基づき、ユーザーフレンドリーで復旧しやすいエラーページを実装します。

## Acceptance Criteria

- [ ] 404 Not Foundページが実装されている
- [ ] 500 Internal Server Errorページが実装されている
- [ ] 403 Forbiddenページが実装されている
- [ ] ネットワークエラーページが実装されている
- [ ] 共通エラーコンポーネントが実装されている
- [ ] 適切な復旧アクションが提供されている
- [ ] レスポンシブ対応が実装されている
- [ ] アクセシビリティ対応が実装されている

## Implementation Guidelines

### Getting Started

1. Next.js App Routerのエラーハンドリング機能を理解
2. エラーページのUXベストプラクティスを確認
3. 共通コンポーネントの設計パターンを理解
4. 復旧アクションの設計方法を学習

### Main Implementation

#### 1. Global Error Page

##### src/app/global-error.tsx

```typescript
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーログを送信（実際の実装では外部サービスに送信）
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">システムエラーが発生しました</CardTitle>
              <CardDescription>
                予期しないエラーが発生しました。しばらく時間をおいてから再度お試しください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-1">開発者情報:</p>
                  <p className="text-xs text-red-600 font-mono">{error.message}</p>
                  {error.digest && (
                    <p className="text-xs text-red-500 mt-1">Error ID: {error.digest}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={reset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  再試行
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    ホームに戻る
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>問題が続く場合は、システム管理者にお問い合わせください。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
```

#### 2. 404 Not Found Page

##### src/app/not-found.tsx

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <FileQuestion className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">ページが見つかりません</CardTitle>
          <CardDescription>
            お探しのページは存在しないか、移動された可能性があります。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <div className="text-6xl font-bold text-muted-foreground mb-2">404</div>
            <p className="text-sm text-muted-foreground">Page Not Found</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              前のページに戻る
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">お探しのページはこちらですか？</h3>
            <div className="space-y-1 text-sm">
              <Link href="/admin/schedules" className="block text-blue-600 hover:underline">
                • 当番表管理
              </Link>
              <Link href="/admin/students" className="block text-blue-600 hover:underline">
                • 図書委員管理
              </Link>
              <Link href="/admin/classes" className="block text-blue-600 hover:underline">
                • クラス管理
              </Link>
              <Link href="/admin/settings" className="block text-blue-600 hover:underline">
                • システム設定
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3. Error Boundary Component

##### src/app/error.tsx

```typescript
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Home, RefreshCw, Bug } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーログを送信
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl">エラーが発生しました</CardTitle>
          <CardDescription>
            ページの読み込み中に問題が発生しました。再試行するか、前のページに戻ってください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              一時的な問題の可能性があります。しばらく時間をおいてから再度お試しください。
            </AlertDescription>
          </Alert>

          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800 mb-1">開発者情報:</p>
              <p className="text-xs text-orange-600 font-mono break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-orange-500 mt-1">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>問題が続く場合は、システム管理者にお問い合わせください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 4. Forbidden Page

##### src/app/unauthorized/page.tsx

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Home, ArrowLeft, User } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">アクセス権限がありません</CardTitle>
          <CardDescription>
            このページにアクセスするための適切な権限がありません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <div className="text-6xl font-bold text-muted-foreground mb-2">403</div>
            <p className="text-sm text-muted-foreground">Forbidden</p>
          </div>

          <div className="space-y-3 text-sm">
            <h3 className="font-medium">考えられる原因:</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 管理者権限が必要なページです</li>
              <li>• セッションが期限切れになっています</li>
              <li>• 直接URLにアクセスしています</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <User className="mr-2 h-4 w-4" />
                ログインページに移動
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              前のページに戻る
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>アクセス権限について不明な場合は、システム管理者にお問い合わせください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 5. Network Error Component

##### src/components/error/network-error.tsx

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react'

interface NetworkErrorProps {
  onRetry?: () => void
  title?: string
  description?: string
}

export function NetworkError({
  onRetry,
  title = "接続エラー",
  description = "ネットワークに接続できません。インターネット接続を確認してください。"
}: NetworkErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (onRetry) {
      setIsRetrying(true)
      try {
        await onRetry()
      } finally {
        setIsRetrying(false)
      }
    } else {
      window.location.reload()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <WifiOff className="h-6 w-6 text-gray-600" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            以下の点をご確認ください:
          </AlertDescription>
        </Alert>

        <div className="space-y-2 text-sm">
          <ul className="space-y-1 text-muted-foreground">
            <li>• インターネット接続が正常か</li>
            <li>• Wi-Fiまたは有線接続が安定しているか</li>
            <li>• ファイアウォールがアクセスをブロックしていないか</li>
            <li>• サーバーがメンテナンス中でないか</li>
          </ul>
        </div>

        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              再接続中...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </>
          )}
        </Button>

        <div className="text-center text-xs text-muted-foreground">
          <p>問題が続く場合は、システム管理者にお問い合わせください。</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 6. Error Boundary Hook

##### src/lib/hooks/use-error-boundary.ts

```typescript
'use client'

import { useState, useCallback } from 'react'

interface ErrorInfo {
  message: string
  code?: string
  timestamp: Date
}

export function useErrorBoundary() {
  const [error, setError] = useState<ErrorInfo | null>(null)

  const captureError = useCallback((error: Error, code?: string) => {
    const errorInfo: ErrorInfo = {
      message: error.message,
      code,
      timestamp: new Date(),
    }

    setError(errorInfo)

    // エラーログを送信（実際の実装では外部サービスに送信）
    console.error('Captured error:', errorInfo, error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retry = useCallback(
    (retryFn: () => void) => {
      clearError()
      try {
        retryFn()
      } catch (newError) {
        if (newError instanceof Error) {
          captureError(newError)
        }
      }
    },
    [clearError, captureError]
  )

  return {
    error,
    captureError,
    clearError,
    retry,
    hasError: !!error,
  }
}
```

#### 7. Error Display Component

##### src/components/error/error-display.tsx

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NetworkError } from './network-error'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface ErrorDisplayProps {
  error: Error | string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'alert' | 'page' | 'network'
  className?: string
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  variant = 'alert',
  className
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  // ネットワークエラーの判定
  if (variant === 'network' || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return <NetworkError onRetry={onRetry} />
  }

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage}</span>
          <div className="flex items-center gap-2 ml-4">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" size="sm" onClick={onDismiss}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Page variant (for full-page errors)
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">エラーが発生しました</h3>
          <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
        </div>
        {(onRetry || onDismiss) && (
          <div className="flex justify-center gap-2">
            {onRetry && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss} size="sm">
                閉じる
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Error Page UX Best Practices](https://www.nngroup.com/articles/error-message-guidelines/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Implementation Results

### Work Completed

- [ ] Global Error Page実装
- [ ] 404 Not Found Page実装
- [ ] Error Boundary実装
- [ ] Forbidden Page実装
- [ ] Network Error Component実装
- [ ] Error Boundary Hook実装
- [ ] Error Display Component実装

### Testing Results

- [ ] 各エラーページの表示確認
- [ ] エラー復旧アクション確認
- [ ] レスポンシブ表示確認
- [ ] アクセシビリティ確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #027: テストセットアップ
2. Issue #028: E2Eテスト実装
3. Issue #029: デプロイ設定
