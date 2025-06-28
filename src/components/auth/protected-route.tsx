'use client'

import { useAuthGuard } from '@/lib/auth/use-auth-guard'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuthGuard(redirectTo)

  if (isLoading) {
    return <LoadingSpinner size="lg" text="認証確認中..." />
  }

  if (!user) {
    return null // リダイレクト中
  }

  return <>{children}</>
}
