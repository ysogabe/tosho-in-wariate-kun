'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/auth/login',
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
