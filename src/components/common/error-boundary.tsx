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

function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
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
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            再試行
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
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
  onError?: (
    error: Error,
    errorInfo: { componentStack?: string | null }
  ) => void
}

export function ErrorBoundary({
  children,
  fallback: Fallback = DefaultErrorFallback,
  onError,
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
          <DefaultErrorFallback
            error={error}
            resetErrorBoundary={resetErrorBoundary}
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={({ resetErrorBoundary }) => (
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
