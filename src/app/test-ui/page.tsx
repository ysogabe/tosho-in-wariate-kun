'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function TestUIPage() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">
          shadcn/ui コンポーネントテスト
        </h1>
        <p className="text-muted-foreground mb-8">
          図書委員当番くんのUIコンポーネントライブラリのテストページです。
        </p>
      </div>

      {/* Button Tests */}
      <Card>
        <CardHeader>
          <CardTitle>ボタンコンポーネント</CardTitle>
          <CardDescription>
            さまざまなスタイルのボタンコンポーネントをテストします。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>デフォルト</Button>
            <Button variant="secondary">セカンダリ</Button>
            <Button variant="destructive">削除</Button>
            <Button variant="outline">アウトライン</Button>
            <Button variant="ghost">ゴースト</Button>
            <Button variant="link">リンク</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">小</Button>
            <Button>標準</Button>
            <Button size="lg">大</Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Tests */}
      <Card>
        <CardHeader>
          <CardTitle>入力コンポーネント</CardTitle>
          <CardDescription>
            フォーム入力コンポーネントをテストします。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="学校名を入力してください" />
            <Input
              type="email"
              placeholder="メールアドレスを入力してください"
            />
            <Input type="password" placeholder="パスワードを入力してください" />
            <Input disabled placeholder="無効化された入力フィールド" />
          </div>
        </CardContent>
      </Card>

      {/* Card Layout Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>図書室A</CardTitle>
            <CardDescription>第1図書室の当番スケジュール</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              収容人数: 2名
              <br />
              今週の当番: 5年1組 田中さん、山田さん
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">スケジュール編集</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>図書室B</CardTitle>
            <CardDescription>第2図書室の当番スケジュール</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              収容人数: 2名
              <br />
              今週の当番: 5年2組 佐藤さん、鈴木さん
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">スケジュール編集</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>システム状態</CardTitle>
            <CardDescription>図書委員当番システムの現在の状態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">データベース:</span>
                <span className="text-sm text-green-600">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">認証システム:</span>
                <span className="text-sm text-green-600">正常</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">UIライブラリ:</span>
                <span className="text-sm text-green-600">正常</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              システム詳細
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Dark Mode Test */}
      <Card>
        <CardHeader>
          <CardTitle>テーマ・カラーパレット</CardTitle>
          <CardDescription>
            デザインシステムのカラーパレットを確認します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-12 w-full bg-primary rounded-md"></div>
              <p className="text-xs text-center">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-secondary rounded-md"></div>
              <p className="text-xs text-center">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-muted rounded-md"></div>
              <p className="text-xs text-center">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-full bg-accent rounded-md"></div>
              <p className="text-xs text-center">Accent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
