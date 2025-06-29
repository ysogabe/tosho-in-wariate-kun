'use client'

import { LoginForm } from '@/components/auth/login-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginTestPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">ログインテスト</CardTitle>
          <CardDescription className="text-center">
            ログインフォームコンポーネントの動作確認
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              テスト用のログイン情報を使用してください
            </AlertDescription>
          </Alert>

          <LoginForm
            onSuccess={() => {
              alert('ログイン成功！')
            }}
            redirectTo="/dashboard"
          />

          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>テスト用アカウント:</strong>
            </p>
            <p>メール: test@example.com</p>
            <p>パスワード: password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
