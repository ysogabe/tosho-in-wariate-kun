import { Metadata } from 'next'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EnhancedLoginForm } from '@/components/auth/enhanced-login-form'
import { AuthGuard } from '@/components/auth/auth-guard'
import { Book, Users, Shield, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ログイン',
  description: '図書委員当番システムにログインします',
  robots: 'noindex, nofollow',
}

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* ヘッダー */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">図書委員当番システム</h1>
              <p className="text-sm text-muted-foreground">
                Library Committee Scheduler
              </p>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="container mx-auto px-4 pb-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 min-h-[calc(100vh-120px)]">
            {/* 左側: システム紹介 */}
            <div className="lg:w-1/2 max-w-lg space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  効率的な当番管理を
                  <br />
                  <span className="text-primary">自動化しませんか？</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  図書委員の当番表作成を自動化し、公平で効率的なスケジュール管理を実現します。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Users className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-1">委員管理</h3>
                  <p className="text-sm text-muted-foreground">
                    図書委員の情報を一元管理
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Shield className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="font-semibold mb-1">自動割り当て</h3>
                  <p className="text-sm text-muted-foreground">
                    公平で最適な当番スケジュール
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold mb-1">統計表示</h3>
                  <p className="text-sm text-muted-foreground">
                    当番状況を視覚的に確認
                  </p>
                </div>

                <div className="p-4 bg-white/70 rounded-lg border shadow-sm">
                  <Book className="h-8 w-8 text-orange-600 mb-3" />
                  <h3 className="font-semibold mb-1">印刷対応</h3>
                  <p className="text-sm text-muted-foreground">
                    A4サイズで美しく印刷
                  </p>
                </div>
              </div>
            </div>

            {/* 右側: ログインフォーム */}
            <div className="lg:w-1/2 max-w-md w-full">
              <Card className="shadow-xl border-0">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl text-center">
                    ログイン
                  </CardTitle>
                  <CardDescription className="text-center">
                    メールアドレスとパスワードでログインしてください
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedLoginForm />
                </CardContent>
              </Card>

              {/* フッター情報 */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  ログインでお困りの場合は、システム管理者にお問い合わせください。
                </p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors underline"
                  >
                    プライバシーポリシー
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors underline"
                  >
                    利用規約
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
