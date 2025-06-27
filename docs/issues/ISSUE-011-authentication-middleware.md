# Issue #011: 認証ミドルウェアの実装

**Priority**: High  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Backend  
**Labels**: backend, authentication, middleware, security

## Description

Next.js Middlewareを使用してルート保護と認証チェックを実装します。Supabase Authと連携し、認証が必要なページへの不正アクセスを防止し、適切なリダイレクト処理を行います。

## Background

認証設計書に基づき、セキュアなルート保護システムを構築します。管理者専用機能への適切なアクセス制御と、認証状態に応じた自動リダイレクトを実現します。

## Acceptance Criteria

- [ ] Next.js Middlewareが実装されている
- [ ] 認証が必要なルートが保護されている
- [ ] 管理者専用ルートの保護が実装されている
- [ ] 適切なリダイレクト処理が実装されている
- [ ] セッション管理が正しく動作している
- [ ] エラーハンドリングが実装されている
- [ ] パフォーマンスが最適化されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Getting Started

1. Issue #003（Supabase設定）が完了していることを確認
2. Issue #009（認証コンテキスト）が完了していることを確認
3. Next.js Middlewareの動作原理を理解
4. Supabase Auth Helpersの確認

### Main Implementation

#### 1. Authentication Middleware

##### middleware.ts

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証が必要なルートパス
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/api/classes',
  '/api/students',
  '/api/schedules',
  '/api/rooms',
]

// 管理者専用ルートパス
const adminRoutes = [
  '/admin',
  '/admin/classes',
  '/admin/students',
  '/admin/schedules',
  '/admin/settings',
  '/api/admin',
]

// 認証済みユーザーがアクセスできないルート
const authRestrictedRoutes = ['/auth/login', '/auth/signup']

// パブリックルート（認証不要）
const publicRoutes = ['/', '/about', '/contact', '/privacy', '/terms']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // セッション取得
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const { pathname } = req.nextUrl

    // セッション取得エラーの場合
    if (sessionError) {
      console.error('Session error:', sessionError)
      if (isProtectedRoute(pathname)) {
        return redirectToLogin(req)
      }
      return res
    }

    // 認証が必要なルートのチェック
    if (isProtectedRoute(pathname)) {
      if (!session) {
        return redirectToLogin(req)
      }

      // 管理者専用ルートのチェック
      if (isAdminRoute(pathname)) {
        const isAdmin = await checkAdminPermission(supabase, session.user.id)
        if (!isAdmin) {
          return redirectToUnauthorized(req)
        }
      }
    }

    // 認証済みユーザーが認証ページにアクセスした場合
    if (session && isAuthRestrictedRoute(pathname)) {
      return redirectToDashboard(req)
    }

    // APIルートの認証チェック
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/public/')) {
      if (!session) {
        return unauthorizedApiResponse()
      }

      // 管理者APIの権限チェック
      if (pathname.startsWith('/api/admin/')) {
        const isAdmin = await checkAdminPermission(supabase, session.user.id)
        if (!isAdmin) {
          return forbiddenApiResponse()
        }
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)

    // エラー時は保護されたルートの場合はログインページに
    if (isProtectedRoute(req.nextUrl.pathname)) {
      return redirectToLogin(req)
    }

    return res
  }
}

// ルート判定ヘルパー関数
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some((route) => pathname.startsWith(route))
}

function isAuthRestrictedRoute(pathname: string): boolean {
  return authRestrictedRoutes.some((route) => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname) || pathname.startsWith('/public/')
}

// 管理者権限チェック
async function checkAdminPermission(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    // profiles テーブルから role をチェック
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin permission:', error)
      return false
    }

    return profile?.role === 'admin'
  } catch (error) {
    console.error('Admin permission check error:', error)
    return false
  }
}

// リダイレクトヘルパー関数
function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL('/auth/login', req.url)
  loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToDashboard(req: NextRequest) {
  return NextResponse.redirect(new URL('/dashboard', req.url))
}

function redirectToUnauthorized(req: NextRequest) {
  return NextResponse.redirect(new URL('/unauthorized', req.url))
}

// API レスポンスヘルパー関数
function unauthorizedApiResponse() {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      },
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

function forbiddenApiResponse() {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'この操作を実行する権限がありません',
      },
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

// Middleware設定
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 画像ファイル (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### 2. Auth Helper Functions

##### src/lib/auth/helpers.ts

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// サーバーコンポーネント用認証チェック
export async function getServerSession() {
  const supabase = createServerComponentClient({ cookies })

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Server session error:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Get server session error:', error)
    return null
  }
}

// ユーザー認証チェック
export async function requireAuth() {
  const session = await getServerSession()

  if (!session) {
    throw new Error('認証が必要です')
  }

  return session
}

// 管理者権限チェック
export async function requireAdmin() {
  const session = await requireAuth()
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('Admin check error:', error)
      throw new Error('権限の確認に失敗しました')
    }

    if (profile?.role !== 'admin') {
      throw new Error('管理者権限が必要です')
    }

    return session
  } catch (error) {
    console.error('Require admin error:', error)
    throw error
  }
}

// API Request用認証チェック
export async function authenticate(req: NextRequest) {
  const res = new Response()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error('認証が必要です')
  }

  return session
}

// API Request用管理者認証チェック
export async function authenticateAdmin(req: NextRequest) {
  const session = await authenticate(req)
  const res = new Response()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (error) {
      console.error('API Admin check error:', error)
      throw new Error('権限の確認に失敗しました')
    }

    if (profile?.role !== 'admin') {
      throw new Error('管理者権限が必要です')
    }

    return session
  } catch (error) {
    console.error('Authenticate admin error:', error)
    throw error
  }
}

// プロファイル取得
export async function getUserProfile(userId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Get user profile error:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('User profile error:', error)
    return null
  }
}

// セッション更新
export async function refreshSession() {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('Refresh session error:', error)
      return null
    }

    return data.session
  } catch (error) {
    console.error('Session refresh error:', error)
    return null
  }
}
```

#### 3. Protected Route Component

##### src/components/auth/protected-route.tsx

```typescript
'use client'

import { useAuth } from '@/lib/context/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      // TODO: 管理者権限チェックの実装
      if (requireAdmin) {
        // プロファイルから role をチェック
        // 管理者でない場合は unauthorized ページにリダイレクト
      }
    }
  }, [user, isLoading, requireAdmin, redirectTo, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="認証確認中..." />
      </div>
    )
  }

  if (!user) {
    return null // リダイレクト中
  }

  return <>{children}</>
}
```

#### 4. Unauthorized Page

##### src/app/unauthorized/page.tsx

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">アクセス権限がありません</CardTitle>
          <CardDescription>
            このページにアクセスする権限がありません。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            管理者権限が必要なページです。権限について不明な場合は、システム管理者にお問い合わせください。
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                前のページに戻る
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Resources

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)

## Implementation Results

### Work Completed

- [ ] Next.js Middleware実装
- [ ] 認証ヘルパー関数実装
- [ ] ルート保護機能実装
- [ ] 管理者権限チェック実装
- [ ] APIルート保護実装
- [ ] リダイレクト処理実装
- [ ] Unauthorized ページ実装
- [ ] エラーハンドリング実装

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Testing Results

- [ ] 認証が必要なルートの保護確認
- [ ] 管理者専用ルートの保護確認
- [ ] APIルートの認証確認
- [ ] リダイレクト処理確認
- [ ] セッション管理確認
- [ ] エラーハンドリング確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #012: データベースマイグレーション実装
2. Issue #015: スケジュール管理APIルート作成
3. Issue #022: ログインページ実装
