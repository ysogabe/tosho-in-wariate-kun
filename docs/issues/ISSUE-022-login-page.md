# Issue #022: ログインページの実装

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, pages, authentication, login

## Description

教員用のログインページを実装します。Issue #010で作成したログインフォームコンポーネントを使用し、美しく使いやすいログインインターフェースを提供します。

## Background

認証設計書で定義されたログイン画面の要件に基づき、教員が安全かつ簡単にシステムにアクセスできるログインページを実装します。ブランディングとユーザビリティを両立したデザインを実現します。

## Acceptance Criteria

- [ ] ログインページが実装されている
- [ ] ログインフォームが適切に配置されている
- [ ] レスポンシブデザインが実装されている
- [ ] ブランディング要素が含まれている
- [ ] エラーハンドリングが実装されている
- [ ] ローディング状態の表示が実装されている
- [ ] アクセシビリティ対応が実装されている
- [ ] SEO対策が実装されている

## Implementation Guidelines

### Getting Started

1. Issue #010（ログインフォーム）が完了していることを確認
2. Issue #009（認証コンテキスト）が完了していることを確認
3. ログインページのデザインパターンを確認
4. Next.js App Routerでのページ実装方法を理解

### Main Implementation

#### 1. Login Page

##### src/app/auth/login/page.tsx

```typescript
import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoginForm } from '@/components/auth/login-form'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Book, School, Shield, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ログイン | 図書委員当番システム',
  description: '図書委員当番システムにログインします',
  robots: 'noindex, nofollow',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md space-y-6">
          {/* ヘッダー部分 */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Book className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                図書委員当番システム
              </h1>
              <p className="text-muted-foreground">
                教員用ログイン
              </p>
            </div>
          </div>

          {/* ログインフォーム */}
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">ログイン</CardTitle>
              <CardDescription className="text-center">
                メールアドレスとパスワードを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" text="認証情報を確認中..." />
                </div>
              }>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>

          {/* システム情報 */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-4 bg-white/50 rounded-lg border">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium text-sm">図書委員管理</h3>
              <p className="text-xs text-muted-foreground">委員情報の登録・編集</p>
            </div>
            <div className="text-center p-4 bg-white/50 rounded-lg border">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium text-sm">自動スケジューリング</h3>
              <p className="text-xs text-muted-foreground">公平な当番割り当て</p>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              ログインでお困りの場合は、システム管理者にお問い合わせください。
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                プライバシーポリシー
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                利用規約
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2. Enhanced Login Form (for Login Page)

##### src/components/auth/enhanced-login-form.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/context/auth-context'
import { loginSchema } from '@/lib/schemas/auth-schemas'

type LoginFormValues = z.infer<typeof loginSchema>

export function EnhancedLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [authError, setAuthError] = useState<string>('')
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const errorParam = searchParams.get('error')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // URLパラメータからエラーメッセージを設定
  useEffect(() => {
    if (errorParam === 'unauthorized') {
      setAuthError('セッションが期限切れです。再度ログインしてください。')
    } else if (errorParam === 'forbidden') {
      setAuthError('このページにアクセスする権限がありません。')
    }
  }, [errorParam])

  // 保存されたログイン情報を復元
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    const savedRemember = localStorage.getItem('rememberMe') === 'true'

    if (savedEmail && savedRemember) {
      form.setValue('email', savedEmail)
      setRememberMe(true)
    }
  }, [form])

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setAuthError('')

      // ログイン情報の保存/削除
      if (rememberMe) {
        localStorage.setItem('savedEmail', values.email)
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('savedEmail')
        localStorage.removeItem('rememberMe')
      }

      const { error } = await signIn(values.email, values.password)

      if (error) {
        setAuthError(getLocalizedErrorMessage(error))
        return
      }

      // ログイン成功 - リダイレクト
      router.push(redirectTo)
    } catch (error) {
      console.error('Login error:', error)
      setAuthError('ログインに失敗しました。しばらく時間をおいてから再度お試しください。')
    }
  }

  const getLocalizedErrorMessage = (error: string): string => {
    if (error.includes('Invalid login credentials')) {
      return 'メールアドレスまたはパスワードが正しくありません。'
    }
    if (error.includes('Email not confirmed')) {
      return 'メールアドレスの確認が完了していません。'
    }
    if (error.includes('Too many requests')) {
      return 'ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。'
    }
    return error || 'ログインに失敗しました。'
  }

  const isLoading = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* エラー表示 */}
        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {/* リダイレクト先の表示 */}
        {redirectTo !== '/dashboard' && (
          <Alert>
            <AlertDescription>
              ログイン後、元のページに戻ります。
            </AlertDescription>
          </Alert>
        )}

        {/* メールアドレス */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="teacher@school.jp"
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* パスワード */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="パスワードを入力"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ログイン情報を保存 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              disabled={isLoading}
            />
            <label
              htmlFor="remember-me"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              ログイン情報を保存
            </label>
          </div>

          <Button
            variant="link"
            size="sm"
            className="px-0 font-normal"
            disabled={isLoading}
            onClick={() => {
              // パスワードリセット機能は今回は実装しない
              setAuthError('パスワードの再設定は管理者にお問い合わせください。')
            }}
          >
            パスワードを忘れた場合
          </Button>
        </div>

        {/* ログインボタン */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </>
          )}
        </Button>

        {/* デモ用ログイン情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">開発用ログイン情報:</p>
            <div className="text-xs space-y-1">
              <p><strong>メール:</strong> admin@school.jp</p>
              <p><strong>パスワード:</strong> password123</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                form.setValue('email', 'admin@school.jp')
                form.setValue('password', 'password123')
              }}
              disabled={isLoading}
            >
              デモ用情報を入力
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
```

#### 3. Login Layout

##### src/app/auth/layout.tsx

```typescript
import { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '図書委員当番システム',
    template: '%s | 図書委員当番システム'
  },
  description: '小学校図書委員の当番割り当てを自動化するシステム',
  robots: 'noindex, nofollow',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      {children}
    </div>
  )
}
```

#### 4. Authentication Guard Component

##### src/components/auth/auth-guard.tsx

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        // 認証が必要だがログインしていない場合
        const currentPath = window.location.pathname
        const searchParams = new URLSearchParams()
        searchParams.set('redirectTo', currentPath)
        router.push(`${redirectTo}?${searchParams.toString()}`)
      } else if (!requireAuth && user) {
        // 認証不要だがログイン済みの場合（ログインページなど）
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, requireAuth, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="認証状態を確認中..." />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // リダイレクト中
  }

  if (!requireAuth && user) {
    return null // リダイレクト中
  }

  return <>{children}</>
}
```

#### 5. Updated Login Page with Auth Guard

##### src/app/auth/login/page.tsx (Updated)

```typescript
import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLoginForm } from '@/components/auth/enhanced-login-form'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Book, Users, Shield, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ログイン',
  description: '図書委員当番システムにログインします',
  robots: 'noindex, nofollow',
}

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* ヘッダー */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">図書委員当番システム</h1>
              <p className="text-sm text-muted-foreground">Library Committee Scheduler</p>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container mx-auto px-4 pb-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 min-h-[calc(100vh-120px)]">
            {/* 左側: システム紹介 */}
            <div className="lg:w-1/2 max-w-lg space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  効率的な当番管理を
                  <br />
                  <span className="text-primary">自動化しませんか？</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  図書委員の当番表作成を自動化し、公平で効率的なスケジュール管理を実現します。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Users className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-1">委員管理</h3>
                  <p className="text-sm text-muted-foreground">
                    図書委員の情報を一元管理
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Shield className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="font-semibold mb-1">自動割り当て</h3>
                  <p className="text-sm text-muted-foreground">
                    公平で最適な当番スケジュール
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold mb-1">統計表示</h3>
                  <p className="text-sm text-muted-foreground">
                    当番状況を視覚的に確認
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Book className="h-8 w-8 text-orange-600 mb-3" />
                  <h3 className="font-semibold mb-1">印刷対応</h3>
                  <p className="text-sm text-muted-foreground">
                    A4サイズで美しく印刷
                  </p>
                </div>
              </div>
            </div>

            {/* 右側: ログインフォーム */}
            <div className="lg:w-1/2 max-w-md w-full">
              <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl text-center">ログイン</CardTitle>
                  <CardDescription className="text-center">
                    メールアドレスとパスワードでログインしてください
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedLoginForm />
                </CardContent>
              </Card>

              {/* フッター情報 */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  ログインでお困りの場合は、システム管理者にお問い合わせください。
                </p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors underline"
                  >
                    プライバシーポリシー
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors underline"
                  >
                    利用規約
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
```

### Resources

- [Login Page Design Patterns](https://ui-patterns.com/patterns/LoginPage)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Accessibility Guidelines for Forms](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html)

## Implementation Results

### Work Completed

- [ ] ログインページ実装
- [ ] EnhancedLoginForm実装
- [ ] AuthGuardコンポーネント実装
- [ ] レスポンシブデザイン実装
- [ ] エラーハンドリング実装
- [ ] ローディング状態実装
- [ ] SEO対策実装

### Testing Results

- [ ] ログイン機能確認
- [ ] エラーハンドリング確認
- [ ] レスポンシブ表示確認
- [ ] アクセシビリティ確認
- [ ] SEO設定確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #023: ダッシュボードページ実装
2. Issue #024: 図書室管理ページ実装
3. Issue #025: システム設定ページ実装
