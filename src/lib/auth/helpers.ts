import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// MVP架構用的用户类型
interface MVPUser {
  id: string
  email: string
  role: string
  created_at: string
}

// サーバーコンポーネント用認証チェック
export async function getServerSession(): Promise<MVPUser | null> {
  try {
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

// クライアントサイド用セッション設定
export function setClientSession(user: MVPUser) {
  if (typeof window !== 'undefined') {
    // Cookie設定 (httpOnly=falseでクライアントからアクセス可能)
    document.cookie = `auth-session=authenticated; path=/; max-age=${60 * 60 * 24 * 7}` // 7日間
    document.cookie = `user-data=${JSON.stringify(user)}; path=/; max-age=${60 * 60 * 24 * 7}`
    document.cookie = `user-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}`
  }
}

// クライアントサイド用セッション削除
export function clearClientSession() {
  if (typeof window !== 'undefined') {
    document.cookie =
      'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }
}

// セッション状態チェック (クライアントサイド)
export function getClientSession(): MVPUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const cookies = document.cookie.split(';')
    const authCookie = cookies.find((c) => c.trim().startsWith('auth-session='))
    const userDataCookie = cookies.find((c) =>
      c.trim().startsWith('user-data=')
    )

    if (!authCookie || !userDataCookie) {
      return null
    }

    const authValue = authCookie.split('=')[1]
    if (authValue !== 'authenticated') {
      return null
    }

    const userDataValue = userDataCookie.split('=')[1]
    const userData = JSON.parse(decodeURIComponent(userDataValue)) as MVPUser
    return userData
  } catch (error) {
    console.error('Client session error:', error)
    return null
  }
}

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

// 認証状態を同期 (クライアントサイドとサーバーサイド)
export function syncAuthState(user: MVPUser | null) {
  if (user) {
    setClientSession(user)
  } else {
    clearClientSession()
  }
}

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
