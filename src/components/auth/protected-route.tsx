'use client'

import { useAuth } from '@/lib/auth/auth-context'
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
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    try {
      if (!isLoading) {
        if (!user) {
          // 認証されていない場合はログインページへ
          const currentPath = window.location.pathname
          console.log('未認証ユーザーをリダイレクト:', currentPath)
          router.push(
            `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
          )
          return
        }

        // 管理者権限が必要な場合のチェック
        if (requireAdmin && user.role !== 'admin') {
          console.log('管理者権限なし、アクセス拒否:', user.role)
          router.push('/unauthorized')
          return
        }
      }
    } catch (error) {
      console.error('ProtectedRoute エラー:', error)
      // エラー時はログインページにリダイレクト
      router.push(redirectTo)
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

  if (requireAdmin && user.role !== 'admin') {
    return null // 権限不足でリダイレクト中
  }

  return <>{children}</>
}
