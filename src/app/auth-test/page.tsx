'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function AuthTestPage() {
  const { user, isLoading, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
    }

    setIsSigningIn(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <LoadingSpinner size="lg" text="認証状態確認中..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>認証システムテスト</CardTitle>
          <CardDescription>認証機能の動作確認</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-2">
                  ✅ ログイン成功
                </p>
                <p className="text-sm text-muted-foreground">メールアドレス:</p>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  ユーザーID:
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {user.id}
                </p>
              </div>
              <Button onClick={signOut} className="w-full" variant="outline">
                ログアウト
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-2">
                  📝 テスト用ログイン情報
                </p>
                <p className="text-xs text-muted-foreground">
                  メール: test@example.com
                </p>
                <p className="text-xs text-muted-foreground">
                  パスワード: password
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert>
                    <AlertDescription className="text-red-600">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    メールアドレス
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    パスワード
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      認証中...
                    </>
                  ) : (
                    'ログイン'
                  )}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
