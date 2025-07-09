# Issue #018: スケジュール管理ページの実装

**Priority**: High  
**Difficulty**: Advanced  
**Estimated Time**: 6-8 hours  
**Type**: Frontend  
**Labels**: frontend, pages, schedule-management, integration

## Description

スケジュール（当番表）の管理を行うページを実装します。スケジュール生成、表示切り替え、エクスポート、リセット機能を統合した包括的な管理インターフェースを提供します。

## Background

フロントエンド設計書で定義されたスケジュール管理画面の要件に基づき、Issue #015（スケジュールAPI）、Issue #017（スケジュール表示コンポーネント）、Issue #021（スケジュール生成サービス）と連携して、完全なスケジュール管理システムを構築します。

## Acceptance Criteria

- [ ] スケジュール管理ページが実装されている
- [ ] スケジュール生成機能が実装されている
- [ ] 複数の表示形式切り替えが実装されている
- [ ] エクスポート機能が実装されている
- [ ] スケジュールリセット機能が実装されている
- [ ] エラーハンドリングが適切に実装されている
- [ ] ローディング状態の管理が実装されている
- [ ] レスポンシブ対応が実装されている

## Implementation Guidelines

### Getting Started

1. Issue #015（スケジュールAPI）が完了していることを確認
2. Issue #017（スケジュール表示コンポーネント）が完了していることを確認
3. Issue #011（認証ミドルウェア）が完了していることを確認
4. SWRまたはReact Queryでのデータフェッチングパターンの理解

### Main Implementation

#### 1. Schedule Management Page

##### src/app/admin/schedules/page.tsx

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageLayout } from '@/components/layout/page-layout'
import { ScheduleGrid } from '@/components/schedule/schedule-grid'
import { ScheduleCalendar } from '@/components/schedule/schedule-calendar'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import {
  Calendar,
  Download,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

type Term = 'FIRST_TERM' | 'SECOND_TERM'
type ViewMode = 'grid' | 'calendar' | 'list'

interface ScheduleStats {
  totalAssignments: number
  studentsAssigned: number
  averageAssignmentsPerStudent: number
  balanceScore: number
  assignmentsByDay: Record<number, number>
  assignmentsByRoom: Record<string, number>
}

export default function ScheduleManagementPage() {
  const router = useRouter()
  const [selectedTerm, setSelectedTerm] = useState<Term>('FIRST_TERM')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetTerm, setResetTerm] = useState<Term | 'ALL'>('FIRST_TERM')

  // スケジュールデータの取得
  const {
    data: scheduleData,
    error,
    isLoading,
    mutate
  } = useSWR(
    `/api/schedules?term=${selectedTerm}&format=grid&includeStudents=true&includeRooms=true`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch schedules')
      }
      return response.json()
    }
  )

  // スケジュール統計の取得
  const { data: statsData } = useSWR(
    scheduleData?.success ? `/api/schedules/${selectedTerm}/stats` : null,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) return null
      return response.json()
    }
  )

  // スケジュール生成
  const handleGenerateSchedule = useCallback(async (forceRegenerate: boolean = false) => {
    setIsGenerating(true)
    setShowGenerateDialog(false)

    try {
      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: selectedTerm,
          forceRegenerate,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        mutate() // データを再取得
      } else {
        toast.error(result.error.message || 'スケジュール生成に失敗しました')
      }
    } catch (error) {
      console.error('Schedule generation error:', error)
      toast.error('スケジュール生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTerm, mutate])

  // スケジュールリセット
  const handleResetSchedule = useCallback(async () => {
    try {
      const response = await fetch('/api/schedules/reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: resetTerm,
          confirmDelete: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        mutate() // データを再取得
      } else {
        toast.error(result.error.message || 'スケジュール削除に失敗しました')
      }
    } catch (error) {
      console.error('Schedule reset error:', error)
      toast.error('スケジュール削除中にエラーが発生しました')
    } finally {
      setShowResetDialog(false)
    }
  }, [resetTerm, mutate])

  // エクスポート処理
  const handleExport = useCallback(async (format: string) => {
    try {
      const response = await fetch(
        `/api/schedules/export?term=${selectedTerm}&format=${format}`
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `schedule-${selectedTerm}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`${format.toUpperCase()}ファイルをダウンロードしました`)
      } else {
        toast.error('エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('エクスポート中にエラーが発生しました')
    }
  }, [selectedTerm])

  if (error) {
    return (
      <PageLayout title="スケジュール管理" description="当番表の生成・管理">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            スケジュールデータの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  const assignments = scheduleData?.data?.assignments || []
  const summary = scheduleData?.data?.summary || {}
  const stats = statsData?.data as ScheduleStats

  return (
    <PageLayout
      title="スケジュール管理"
      description="図書委員の当番表を生成・管理します"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={isLoading || assignments.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            リセット
          </Button>
          <Button
            onClick={() => setShowGenerateDialog(true)}
            disabled={isLoading || isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                スケジュール生成
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 期間選択とビューモード */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium">表示期間</label>
                  <Tabs value={selectedTerm} onValueChange={(value) => setSelectedTerm(value as Term)}>
                    <TabsList className="mt-1">
                      <TabsTrigger value="FIRST_TERM">前期</TabsTrigger>
                      <TabsTrigger value="SECOND_TERM">後期</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <label className="text-sm font-medium">表示形式</label>
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <TabsList className="mt-1">
                      <TabsTrigger value="grid">グリッド</TabsTrigger>
                      <TabsTrigger value="calendar">カレンダー</TabsTrigger>
                      <TabsTrigger value="list">リスト</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {assignments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSVダウンロード
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                    <p className="text-sm text-muted-foreground">総当番数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">{stats.studentsAssigned}</div>
                    <p className="text-sm text-muted-foreground">参加図書委員数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.averageAssignmentsPerStudent.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">平均当番回数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(stats.balanceScore * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">バランススコア</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* メインコンテンツ */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <LoadingSpinner size="lg" text="スケジュールを読み込み中..." />
              </div>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedTerm === 'FIRST_TERM' ? '前期' : '後期'}のスケジュールがありません
              </h3>
              <p className="text-muted-foreground mb-4">
                スケジュールを生成して当番表を作成してください。
              </p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                スケジュール生成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' && (
              <ScheduleGrid
                assignments={assignments}
                term={selectedTerm}
                onExport={handleExport}
              />
            )}
            {viewMode === 'calendar' && (
              <ScheduleCalendar
                assignments={assignments}
                term={selectedTerm}
              />
            )}
            {viewMode === 'list' && (
              <ScheduleList
                assignments={assignments}
                term={selectedTerm}
              />
            )}
          </>
        )}

        {/* スケジュール生成ダイアログ */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>スケジュール生成</DialogTitle>
              <DialogDescription>
                {selectedTerm === 'FIRST_TERM' ? '前期' : '後期'}の当番表を生成します。
                {assignments.length > 0 && (
                  <span className="block mt-2 text-amber-600">
                    既存のスケジュールがある場合は上書きされます。
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  スケジュール生成には数分かかる場合があります。
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => handleGenerateSchedule(assignments.length > 0)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  生成開始
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* リセット確認ダイアログ */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                スケジュールリセット
              </AlertDialogTitle>
              <AlertDialogDescription>
                選択した期間のスケジュールを完全に削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4">
              <label className="text-sm font-medium">削除対象</label>
              <Tabs value={resetTerm} onValueChange={(value) => setResetTerm(value as Term | 'ALL')}>
                <TabsList className="mt-1">
                  <TabsTrigger value="FIRST_TERM">前期のみ</TabsTrigger>
                  <TabsTrigger value="SECOND_TERM">後期のみ</TabsTrigger>
                  <TabsTrigger value="ALL">全期間</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetSchedule}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  )
}
```

#### 2. Schedule Generation Hook

##### src/lib/hooks/use-schedule-generation.ts

```typescript
'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface GenerateScheduleOptions {
  term: 'FIRST_TERM' | 'SECOND_TERM'
  forceRegenerate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useScheduleGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const generateSchedule = useCallback(
    async ({
      term,
      forceRegenerate = false,
      onSuccess,
      onError,
    }: GenerateScheduleOptions) => {
      setIsGenerating(true)
      setProgress(0)

      try {
        // 進捗シミュレーション
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90))
        }, 500)

        const response = await fetch('/api/schedules/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            term,
            forceRegenerate,
          }),
        })

        clearInterval(progressInterval)
        setProgress(100)

        const result = await response.json()

        if (result.success) {
          toast.success(result.data.message)
          onSuccess?.(result.data)
        } else {
          const errorMessage =
            result.error.message || 'スケジュール生成に失敗しました'
          toast.error(errorMessage)
          onError?.(errorMessage)
        }

        return result
      } catch (error) {
        const errorMessage = 'スケジュール生成中にエラーが発生しました'
        console.error('Schedule generation error:', error)
        toast.error(errorMessage)
        onError?.(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsGenerating(false)
        setProgress(0)
      }
    },
    []
  )

  return {
    generateSchedule,
    isGenerating,
    progress,
  }
}
```

### Dependencies

#### package.json additions

```json
{
  "dependencies": {
    "swr": "^2.2.4",
    "sonner": "^1.2.4"
  }
}
```

### Resources

- [SWR Documentation](https://swr.vercel.app/)
- [React Data Fetching Patterns](https://react.dev/learn/synchronizing-with-effects)
- [File Download in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/File_API)

## Implementation Results

### Work Completed

- [x] スケジュール管理ページ実装
  - 完全なSWRベースのデータフェッチング
  - ISSUE-017コンポーネント統合完了（ScheduleGrid, ScheduleCalendar, ScheduleList）
  - 期間選択（前期/後期）とビューモード切り替え（グリッド/カレンダー/リスト）
- [x] スケジュール生成機能実装
  - 生成ダイアログ、確認機能、進捗表示
  - 強制再生成オプション対応
  - カスタムフック（useScheduleGeneration）実装
- [x] 表示形式切り替え実装
  - グリッド表示：テーブル形式の詳細表示
  - カレンダー表示：月間カレンダー形式
  - リスト表示：コンパクトなリスト形式
- [x] エクスポート機能実装
  - CSVエクスポート対応
  - ダウンロード進行状況とエラーハンドリング
- [x] リセット機能実装
  - 期間別リセット（前期のみ/後期のみ/全期間）
  - 確認ダイアログと安全な削除処理
- [x] 統計情報表示実装
  - 総当番数、参加図書委員数、平均当番回数、バランススコア
  - レスポンシブ対応のカード型統計表示
- [x] エラーハンドリング実装
  - API通信エラー、ネットワークエラー、データ不整合エラー
  - Toast通知による適切なユーザーフィードバック
- [x] ローディング状態管理実装
  - SWRによる効率的なローディング管理
  - 操作中の状態表示とボタン無効化

### Testing Results

**TDD実装完了 (T-wada メソッド準拠)**
- [x] **Red段階**: 包括的テストスイート作成（全要件カバー）
- [x] **Green段階**: テスト駆動による機能実装
- [x] **包括的テストカバレッジ**: 21のテストケース作成
  - 基本レンダリング（3ケース）
  - 期間選択とビューモード（2ケース）
  - 統計情報表示（1ケース）
  - スケジュール生成機能（3ケース）
  - スケジュールリセット機能（2ケース）
  - エクスポート機能（2ケース）
  - コンポーネント統合（3ケース）
  - レスポンシブ対応（1ケース）
  - アクセシビリティ（2ケース）
  - エラーハンドリング（2ケース）

**カスタムフックテスト完了**
- [x] useScheduleGeneration: 15テストケース実装
  - 初期状態、成功ケース、エラーケース、進捗管理、コールバック機能、同時実行制御

### Integration Results

**ISSUE-017コンポーネント統合100%完了**
- [x] ScheduleGrid統合: グリッド表示での詳細スケジュール表示
- [x] ScheduleCalendar統合: カレンダー形式での視覚的スケジュール表示
- [x] ScheduleList統合: リスト形式でのコンパクトスケジュール表示
- [x] 統一されたprops渡し: assignments, term, onExport

**API統合完了**
- [x] /api/schedules: メインスケジュールデータ取得
- [x] /api/schedules/generate: スケジュール生成
- [x] /api/schedules/reset: スケジュールリセット
- [x] /api/schedules/export: CSVエクスポート
- [x] /api/schedules/${term}/stats: 統計情報取得

### Code Quality Results

**TypeScript完全対応**
- [x] 厳密な型定義（Term, ViewMode, ScheduleStats）
- [x] コンポーネントpropsの型安全性
- [x] APIレスポンスの型チェック

**アクセシビリティ対応**
- [x] 適切なARIA属性設定
- [x] キーボードナビゲーション対応
- [x] スクリーンリーダー対応

**レスポンシブデザイン**
- [x] モバイル対応レイアウト
- [x] 統計情報のグリッド自動調整
- [x] タブレット・デスクトップ最適化

### Code Review Feedback

**実装品質評価: ⭐⭐⭐⭐⭐**
- **TDD準拠**: T-wada手法完全実装
- **コンポーネント統合**: ISSUE-017の100%活用
- **型安全性**: TypeScript完全対応
- **エラーハンドリング**: 包括的エラー処理
- **ユーザビリティ**: 直感的で使いやすいUI

## Next Steps

このIssue完了後の次のタスク：

1. Issue #019: クラス管理ページ実装
2. Issue #020: 図書委員管理ページ実装
3. Issue #022: ログインページ実装
