'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  BarChart3,
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
    mutate,
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
  const handleGenerateSchedule = useCallback(
    async (forceRegenerate: boolean = false) => {
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
    },
    [selectedTerm, mutate]
  )

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
  const handleExport = useCallback(
    async (format: string) => {
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
    },
    [selectedTerm]
  )

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
                  <Tabs
                    value={selectedTerm}
                    onValueChange={(value) => setSelectedTerm(value as Term)}
                  >
                    <TabsList className="mt-1">
                      <TabsTrigger value="FIRST_TERM">前期</TabsTrigger>
                      <TabsTrigger value="SECOND_TERM">後期</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <label className="text-sm font-medium">表示形式</label>
                  <Tabs
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as ViewMode)}
                  >
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
                    <div className="text-2xl font-bold">
                      {stats.totalAssignments}
                    </div>
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
                    <div className="text-2xl font-bold">
                      {stats.studentsAssigned}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      参加図書委員数
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      平均当番回数
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      バランススコア
                    </p>
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
                {selectedTerm === 'FIRST_TERM' ? '前期' : '後期'}
                のスケジュールがありません
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
              <ScheduleCalendar assignments={assignments} term={selectedTerm} />
            )}
            {viewMode === 'list' && (
              <ScheduleList assignments={assignments} term={selectedTerm} />
            )}
          </>
        )}

        {/* スケジュール生成ダイアログ */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>スケジュール生成</DialogTitle>
              <DialogDescription>
                {selectedTerm === 'FIRST_TERM' ? '前期' : '後期'}
                の当番表を生成します。
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
              <Tabs
                value={resetTerm}
                onValueChange={(value) => setResetTerm(value as Term | 'ALL')}
              >
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
