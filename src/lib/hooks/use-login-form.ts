'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

interface UseLoginFormOptions {
  onSuccess?: () => void
  redirectTo?: string
}

export function useLoginForm({
  onSuccess,
  redirectTo = '/dashboard',
}: UseLoginFormOptions = {}) {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError('')

      const { error: authError } = await signIn(email, password)

      if (authError) {
        setError(authError)
        return { success: false, error: authError }
      }

      // ログイン成功
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }

      return { success: true }
    } catch (error) {
      const errorMessage =
        'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError('')

  return {
    login,
    error,
    isLoading,
    clearError,
  }
}
