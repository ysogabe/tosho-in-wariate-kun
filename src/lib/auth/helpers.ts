import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { MVPUser } from './types'

// サーバーコンポーネント用認証チェック
export async function getServerSession(): Promise<MVPUser | null> {
  try {
    // 開発環境での認証バイパス
    const isDevelopment = process.env.NODE_ENV === 'development'
    const devBypassAuth = process.env.DEV_BYPASS_AUTH === 'true'

    if (isDevelopment && devBypassAuth) {
      return {
        id: 'dev-admin',
        email: 'admin@dev.local',
        name: '開発者',
        role: 'admin',
      }
    }

    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth-session')
    const userDataCookie = cookieStore.get('user-data')

    if (
      !authCookie ||
      authCookie.value !== 'authenticated' ||
      !userDataCookie
    ) {
      return null
    }

    // MVP: Cookie からユーザーデータを取得
    const userData = JSON.parse(userDataCookie.value) as MVPUser
    return userData
  } catch (error) {
    console.error('Server session error:', error)
    return null
  }
}

// ユーザー認証チェック
export async function requireAuth(): Promise<MVPUser> {
  const session = await getServerSession()

  if (!session) {
    throw new Error('認証が必要です')
  }

  return session
}

// 管理者権限チェック
export async function requireAdmin(): Promise<MVPUser> {
  const session = await requireAuth()

  if (session.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }

  return session
}

// API Request用認証チェック
export async function authenticate(req: NextRequest): Promise<MVPUser> {
  try {
    // 開発環境での認証バイパス
    const isDevelopment = process.env.NODE_ENV === 'development'
    const devBypassAuth = process.env.DEV_BYPASS_AUTH === 'true'

    if (isDevelopment && devBypassAuth) {
      return {
        id: 'dev-admin',
        email: 'admin@dev.local',
        name: '開発者',
        role: 'admin',
      }
    }

    const authCookie = req.cookies.get('auth-session')
    const userDataCookie = req.cookies.get('user-data')

    if (
      !authCookie ||
      authCookie.value !== 'authenticated' ||
      !userDataCookie
    ) {
      throw new Error('認証が必要です')
    }

    const userData = JSON.parse(userDataCookie.value) as MVPUser
    return userData
  } catch (error) {
    console.error('Authentication error:', error)
    throw new Error('認証が必要です')
  }
}

// API Request用管理者認証チェック
export async function authenticateAdmin(req: NextRequest): Promise<MVPUser> {
  const session = await authenticate(req)

  if (session.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }

  return session
}

// Note: Client-side session functions moved to client-helpers.ts
// to avoid next/headers import issues in Client Components

// プロファイル取得 (MVP: 基本情報のみ)
export async function getUserProfile(userId: string): Promise<MVPUser | null> {
  try {
    const session = await getServerSession()

    if (!session || session.id !== userId) {
      return null
    }

    return session
  } catch (error) {
    console.error('User profile error:', error)
    return null
  }
}

// セッション更新 (MVP: 基本実装)
export async function refreshSession(): Promise<MVPUser | null> {
  try {
    const session = await getServerSession()
    return session
  } catch (error) {
    console.error('Session refresh error:', error)
    return null
  }
}

// Note: syncAuthState removed - use client-helpers directly for client-side operations

// ユーザーロール判定ヘルパー
export function isAdmin(user: MVPUser | null): boolean {
  return user?.role === 'admin'
}

export function isTeacher(user: MVPUser | null): boolean {
  return user?.role === 'teacher' || user?.role === 'admin'
}

// MVP: 認証エラーレスポンス作成
export function createAuthErrorResponse(message: string, status: number = 401) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
        message,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
