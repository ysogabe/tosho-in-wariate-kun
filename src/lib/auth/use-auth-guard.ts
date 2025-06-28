'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-context'

export function useAuthGuard(redirectTo: string = '/auth/login') {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, redirectTo, router])

  return { user, isLoading }
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return { user: null, isLoading: true, isAuthenticated: false }
  }

  return {
    user,
    isLoading: false,
    isAuthenticated: !!user,
  }
}
