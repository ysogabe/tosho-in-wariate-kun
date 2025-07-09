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

// 管理者専用ルートパス (MVP: 実装予定)
const adminRoutes = ['/admin']

// 認証済みユーザーがアクセスできないルート
const authRestrictedRoutes = ['/auth/login']

// パブリックルート（認証不要）
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/components-test',
  '/table-test',
  '/test-ui',
  '/test-db',
  '/login-test',
  '/auth-test',
]

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl

    // 静的ファイルやAPIルート以外の処理をスキップ
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/api/public/') ||
      pathname.includes('.') // ファイル拡張子を含むパス
    ) {
      return NextResponse.next()
    }

    // 開発環境での認証バイパス
    const isDevelopment = process.env.NODE_ENV === 'development'
    const devBypassAuth = process.env.DEV_BYPASS_AUTH === 'true'
    
    if (isDevelopment && devBypassAuth) {
      return NextResponse.next()
    }

    // MVPアーキテクチャ: Cookieからセッション情報を取得
    const authCookie = req.cookies.get('auth-session')
    const isAuthenticated = authCookie?.value === 'authenticated'

    // APIルートの認証チェック（先に処理）
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/public/')) {
      if (!isAuthenticated) {
        return unauthorizedApiResponse()
      }

      // 管理者APIの権限チェック (MVP: 基本実装)
      if (pathname.startsWith('/api/admin/')) {
        if (!checkAdminRole(req)) {
          return forbiddenApiResponse()
        }
      }
    }

    // 認証が必要なページルートのチェック
    if (isProtectedRoute(pathname) && !pathname.startsWith('/api/')) {
      if (!isAuthenticated) {
        return redirectToLogin(req)
      }

      // 管理者専用ルートのチェック (MVP: 基本実装)
      if (isAdminRoute(pathname)) {
        if (!checkAdminRole(req)) {
          return redirectToUnauthorized(req)
        }
      }
    }

    // 認証済みユーザーが認証ページにアクセスした場合
    if (isAuthenticated && isAuthRestrictedRoute(pathname)) {
      return redirectToDashboard(req)
    }

    return NextResponse.next()
  } catch (error) {
    // 詳細なエラーログの記録
    console.error('Middleware error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: req.nextUrl.pathname,
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    })

    // エラーの種類に応じた処理
    if (error instanceof Error) {
      // Cookie解析エラーや認証情報の破損など
      if (error.message.includes('cookie') || error.message.includes('JSON')) {
        console.warn('認証情報の解析エラー、セッションをクリア')

        // APIルートの場合は適切なエラーレスポンスを返す
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: {
                code: 'AUTHENTICATION_ERROR',
                message: '認証情報が不正です',
              },
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': [
                  'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
                  'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
                  'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
                ].join(', '),
              },
            }
          )
        }
      }
    }

    // 保護されたルートの場合はログインページにリダイレクト
    if (isProtectedRoute(req.nextUrl.pathname)) {
      console.warn('保護されたルートでエラー発生、ログインページにリダイレクト')
      return redirectToLogin(req)
    }

    // APIルートの場合は500エラーレスポンス
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'サーバー内部エラーが発生しました',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // その他の場合は処理を続行
    return NextResponse.next()
  }
}

// 管理者権限チェック関数
function checkAdminRole(req: NextRequest): boolean {
  const adminCookie = req.cookies.get('user-role')
  return adminCookie?.value === 'admin'
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
