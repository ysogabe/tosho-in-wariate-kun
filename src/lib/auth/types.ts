// 認証関連の型定義

// MVP User type (サーバー・クライアント共通)
export interface MVPUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
  confirmation_sent_at: string | null
  confirmed_at: string | null
  email_confirmed_at: string | null
  invited_at: string | null
  last_sign_in_at: string | null
  phone: string | null
  phone_confirmed_at: string | null
  recovery_sent_at: string | null
  role: string
}

// 認証エラーレスポンス型
export interface AuthErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

// API認証レスポンス型
export interface AuthResponse {
  success: boolean
  user?: MVPUser
  error?: {
    code: string
    message: string
  }
}
