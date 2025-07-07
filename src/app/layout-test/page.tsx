import { MainLayout } from '@/components/layout/main-layout'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Download, Settings } from 'lucide-react'

export default function LayoutTestPage() {
  return (
    <MainLayout>
      <PageLayout
        title="レイアウトテストページ"
        description="レイアウトコンポーネントの動作確認"
        actions={
          <>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規追加
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>コンテンツエリア</CardTitle>
              <CardDescription>
                ページレイアウトのコンテンツエリアです
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>ここにページの主要コンテンツが表示されます。</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>カード {i + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>レスポンシブ対応のテスト用カードです。</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    </MainLayout>
  )
}
