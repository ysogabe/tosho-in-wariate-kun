# Issue #010: ログインフォームコンポーネントの作成

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, form, authentication, ui

## Description

教員用のログインフォームコンポーネントを作成します。Supabase Authと連携し、バリデーション機能とエラーハンドリングを含む安全で使いやすいログインフォームを実装します。

## Background

認証設計書に基づき、教員が安全にシステムにアクセスできるログインインターフェースを提供します。ユーザビリティとセキュリティを両立したフォーム設計を実現します。

## Acceptance Criteria

- [ ] LoginFormコンポーネントが作成されている
- [ ] メールアドレス・パスワード入力フィールドが実装されている
- [ ] フォームバリデーションが実装されている
- [ ] エラー表示機能が実装されている
- [ ] ローディング状態の表示が実装されている
- [ ] レスポンシブ対応が実装されている
- [ ] アクセシビリティ対応が実装されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Getting Started

1. Issue #006（基本UIコンポーネント）が完了していることを確認
2. Issue #009（認証コンテキスト）が完了していることを確認
3. shadcn/ui Formコンポーネントの理解
4. React Hook Formの基本的な使用方法の確認

### Main Implementation

#### 1. Login Form Component

##### src/components/auth/login-form.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'

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
import { useAuth } from '@/lib/context/auth-context'

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(6, 'パスワードは6文字以上で入力してください'),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
  className?: string
}

export function LoginForm({
  onSuccess,
  redirectTo = '/dashboard',
  className
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string>('')
  const { signIn } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setAuthError('')

      const { error } = await signIn(values.email, values.password)

      if (error) {
        setAuthError(error)
        return
      }

      // ログイン成功
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthError('ログインに失敗しました。しばらく時間をおいてから再度お試しください。')
    }
  }

  const isLoading = form.formState.isSubmitting

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* エラー表示 */}
          {authError && (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
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
                    placeholder="example@school.jp"
                    disabled={isLoading}
                    autoComplete="email"
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

          {/* ログインボタン */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
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
        </form>
      </Form>
    </div>
  )
}
```

#### 2. Login Form Hook

##### src/lib/hooks/use-login-form.ts

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth-context'

interface UseLoginFormOptions {
  onSuccess?: () => void
  redirectTo?: string
}

export function useLoginForm({
  onSuccess,
  redirectTo = '/dashboard',
}: UseLoginFormOptions = {}) {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError('')

      const { error: authError } = await signIn(email, password)

      if (authError) {
        setError(authError)
        return { success: false, error: authError }
      }

      // ログイン成功
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }

      return { success: true }
    } catch (error) {
      const errorMessage =
        'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError('')

  return {
    login,
    error,
    isLoading,
    clearError,
  }
}
```

#### 3. Form Validation Schema

##### src/lib/schemas/auth-schemas.ts

```typescript
import * as z from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスが長すぎます'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(128, 'パスワードが長すぎます'),
})

export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスが長すぎます'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '現在のパスワードは必須です'),
    newPassword: z
      .string()
      .min(6, '新しいパスワードは6文字以上で入力してください')
      .max(128, 'パスワードが長すぎます'),
    confirmPassword: z.string().min(1, 'パスワード確認は必須です'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
```

#### 4. Testing Component

##### src/app/login-test/page.tsx

```typescript
'use client'

import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginTestPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">ログインテスト</CardTitle>
          <CardDescription className="text-center">
            ログインフォームコンポーネントの動作確認
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              テスト用のログイン情報を使用してください
            </AlertDescription>
          </Alert>

          <LoginForm
            onSuccess={() => {
              alert('ログイン成功！')
            }}
            redirectTo="/dashboard"
          />

          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>テスト用アカウント:</strong></p>
            <p>メール: test@school.jp</p>
            <p>パスワード: password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Dependencies

#### package.json additions

```json
{
  "dependencies": {
    "react-hook-form": "^7.47.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4"
  }
}
```

### Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [shadcn/ui Form Component](https://ui.shadcn.com/docs/components/form)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Implementation Results

### Work Completed

- [ ] LoginFormコンポーネント実装
- [ ] useLoginFormフック実装
- [ ] バリデーションスキーマ実装
- [ ] パスワード表示/非表示機能実装
- [ ] エラーハンドリング実装
- [ ] ローディング状態実装
- [ ] レスポンシブ対応実装
- [ ] アクセシビリティ対応実装

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Testing Results

- [ ] フォームバリデーション確認
- [ ] エラー表示確認
- [ ] ローディング状態確認
- [ ] レスポンシブ表示確認
- [ ] キーボードナビゲーション確認
- [ ] スクリーンリーダー対応確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #022: ログインページ実装
2. Issue #011: 認証ミドルウェア実装
3. Issue #023: ダッシュボードページ実装
