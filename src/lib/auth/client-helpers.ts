// クライアントサイド専用の認証ヘルパー関数

import { MVPUser } from './types'

// クライアントサイド用セッション設定
export function setClientSession(user: MVPUser) {
  if (typeof window !== 'undefined') {
    // Cookie設定 (httpOnly=falseでクライアントからアクセス可能)
    document.cookie = `auth-session=authenticated; path=/; max-age=${60 * 60 * 24 * 7}` // 7日間
    document.cookie = `user-data=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}`
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
