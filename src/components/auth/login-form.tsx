'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import { loginSchema } from '@/lib/schemas/auth-schemas'

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
  className?: string
}

export function LoginForm({
  onSuccess,
  redirectTo = '/dashboard',
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string>('')
  const { signIn } = useAuth()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setAuthError('')

      const result = await signIn(values.email, values.password)

      if (result?.error) {
        setAuthError(result.error)
        return
      }

      // ログイン成功
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthError(
        'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
      )
    }
  }

  const isLoading = form.formState.isSubmitting

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* エラー表示 */}
          {authError && (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          {/* メールアドレス */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="example@school.jp"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* パスワード */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>パスワード</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="パスワードを入力"
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ログインボタン */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                ログイン
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
