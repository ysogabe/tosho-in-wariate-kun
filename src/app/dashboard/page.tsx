'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import {
  Calendar,
  Users,
  Building,
  BarChart3,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Settings,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { TodayDuties } from '@/components/dashboard/today-duties'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule'

interface DashboardStats {
  students: {
    total: number
    active: number
    grade5: number
    grade6: number
  }
  classes: {
    total: number
    withStudents: number
  }
  schedules: {
    firstTerm: {
      exists: boolean
      assignmentCount: number
      lastGenerated: string | null
    }
    secondTerm: {
      exists: boolean
      assignmentCount: number
      lastGenerated: string | null
    }
  }
  rooms: {
    total: number
    active: number
  }
}

interface RecentActivity {
  id: string
  type:
    | 'student_created'
    | 'class_created'
    | 'schedule_generated'
    | 'student_updated'
  description: string
  timestamp: string
  user?: string
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  // 統計データの取得
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
    mutate: mutateStats,
  } = useSWR('/api/dashboard/stats', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  }, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    refreshInterval: 30000, // 30秒ごとに更新
  })

  // 最近の活動の取得
  const { data: activitiesData, isLoading: activitiesLoading } = useSWR(
    '/api/dashboard/activities',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities')
      }
      return response.json()
    }
  )

  const stats = statsData?.data as DashboardStats
  const activities =
    (activitiesData?.data?.activities as RecentActivity[]) || []

  // スケジュール状況の分析
  const scheduleStatus = useMemo(() => {
    if (!stats) return { status: 'loading', message: '' }

    const { firstTerm, secondTerm } = stats.schedules

    if (!firstTerm.exists && !secondTerm.exists) {
      return {
        status: 'empty',
        message: '当番表が作成されていません',
        action: 'スケジュール生成が必要です',
      }
    }

    if (firstTerm.exists && !secondTerm.exists) {
      return {
        status: 'partial',
        message: '前期の当番表のみ作成済み',
        action: '後期のスケジュール生成を検討してください',
      }
    }

    if (firstTerm.exists && secondTerm.exists) {
      return {
        status: 'complete',
        message: '前期・後期の当番表が作成済み',
        action: '',
      }
    }

    return { status: 'unknown', message: '', action: '' }
  }, [stats])

  const handleRefreshData = async () => {
    try {
      // SWRキャッシュを完全にクリアして強制的に再取得
      await mutateStats(undefined, { revalidate: true })
      toast.success('データを更新しました')
    } catch (error) {
      console.error('データ更新エラー:', error)
      toast.error('データの更新に失敗しました')
    }
  }

  if (statsError) {
    return (
      <PageLayout title="ダッシュボード" description="システムの概要">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ダッシュボードデータの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="📊 ダッシュボード"
      description="図書委員当番システムの概要"
      schoolName="🏫 かがやき小学校 図書委員当番"
      actions={
        <Button
          variant="outline"
          onClick={handleRefreshData}
          className="bg-white hover:bg-secondary/20 border-secondary transition-all duration-300 hover:shadow-md"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      }
    >
      <div className="space-y-6">
        {/* システム状況サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full animate-float"
                  style={{
                    backgroundColor: 'hsl(202, 100%, 95%)',
                    border: '2px dashed hsl(202, 70%, 70%)',
                  }}
                >
                  <Users
                    className="h-8 w-8"
                    style={{ color: 'hsl(202, 70%, 50%)' }}
                  />
                </div>
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: 'hsl(340, 80%, 45%)' }}
                  >
                    {statsLoading ? '📚' : stats?.students.total || 0}
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    図書委員数
                  </p>
                  {stats && (
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(140, 60%, 45%)' }}
                    >
                      {stats.students.active}名がアクティブ ✨
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full animate-float"
                  style={{
                    backgroundColor: 'hsl(140, 60%, 95%)',
                    border: '2px dashed hsl(140, 60%, 70%)',
                    animationDelay: '0.5s',
                  }}
                >
                  <Building
                    className="h-8 w-8"
                    style={{ color: 'hsl(140, 60%, 45%)' }}
                  />
                </div>
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: 'hsl(340, 80%, 45%)' }}
                  >
                    {statsLoading ? '🏫' : stats?.classes.total || 0}
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    クラス数
                  </p>
                  {stats && (
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(140, 60%, 45%)' }}
                    >
                      {stats.classes.withStudents}クラスに委員在籍 🎒
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full animate-float"
                  style={{
                    backgroundColor: 'hsl(280, 60%, 95%)',
                    border: '2px dashed hsl(280, 60%, 70%)',
                    animationDelay: '1s',
                  }}
                >
                  <Calendar
                    className="h-8 w-8"
                    style={{ color: 'hsl(280, 60%, 50%)' }}
                  />
                </div>
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: 'hsl(340, 80%, 45%)' }}
                  >
                    {statsLoading
                      ? '📅'
                      : (stats?.schedules.firstTerm.assignmentCount || 0) +
                        (stats?.schedules.secondTerm.assignmentCount || 0)}
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    総当番数
                  </p>
                  {scheduleStatus.status === 'complete' && (
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(140, 60%, 45%)' }}
                    >
                      完了 🎉
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-full animate-float"
                  style={{
                    backgroundColor: 'hsl(30, 100%, 95%)',
                    border: '2px dashed hsl(30, 100%, 70%)',
                    animationDelay: '1.5s',
                  }}
                >
                  <BookOpen
                    className="h-8 w-8"
                    style={{ color: 'hsl(30, 100%, 50%)' }}
                  />
                </div>
                <div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: 'hsl(340, 80%, 45%)' }}
                  >
                    {statsLoading ? '📖' : stats?.rooms.active || 0}
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    図書室数
                  </p>
                  {stats && (
                    <p
                      className="text-xs"
                      style={{ color: 'hsl(140, 60%, 45%)' }}
                    >
                      {stats.rooms.total}室中{stats.rooms.active}室稼働 🏛️
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 今日の当番表示 */}
        <TodayDuties />

        {/* 週間スケジュール表示 */}
        <WeeklySchedule />

        {/* スケジュール状況とクイックアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* スケジュール状況 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                当番表の状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" text="状況を確認中..." />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    {scheduleStatus.status === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : scheduleStatus.status === 'partial' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{scheduleStatus.message}</p>
                      {scheduleStatus.action && (
                        <p className="text-sm text-muted-foreground">
                          {scheduleStatus.action}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">前期</h4>
                        <Badge
                          variant={
                            stats?.schedules.firstTerm.exists
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {stats?.schedules.firstTerm.exists
                            ? '作成済み'
                            : '未作成'}
                        </Badge>
                      </div>
                      {stats?.schedules.firstTerm.exists && (
                        <p className="text-sm text-muted-foreground">
                          {stats.schedules.firstTerm.assignmentCount}件の当番
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">後期</h4>
                        <Badge
                          variant={
                            stats?.schedules.secondTerm.exists
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {stats?.schedules.secondTerm.exists
                            ? '作成済み'
                            : '未作成'}
                        </Badge>
                      </div>
                      {stats?.schedules.secondTerm.exists && (
                        <p className="text-sm text-muted-foreground">
                          {stats.schedules.secondTerm.assignmentCount}件の当番
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm">
                      <Link href="/admin/schedules">
                        <Calendar className="mr-2 h-4 w-4" />
                        当番表管理
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/admin/schedules?action=generate">
                        <Plus className="mr-2 h-4 w-4" />
                        新規生成
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/students">
                    <Plus className="mr-2 h-4 w-4" />
                    図書委員を追加
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/admin/classes">
                    <Building className="mr-2 h-4 w-4" />
                    クラス管理
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/admin/schedules?format=grid">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    当番表を見る
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/admin/schedules/export">
                    <Download className="mr-2 h-4 w-4" />
                    データ出力
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    システム設定
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 詳細情報タブ */}
        <Card>
          <CardHeader>
            <CardTitle>詳細情報</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">概要</TabsTrigger>
                <TabsTrigger value="analytics">分析</TabsTrigger>
                <TabsTrigger value="activities">最近の活動</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">学年別図書委員数</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">5年生</span>
                        <Badge variant="outline">
                          {stats?.students.grade5 || 0}名
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">6年生</span>
                        <Badge variant="outline">
                          {stats?.students.grade6 || 0}名
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">システム使用状況</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">アクティブな図書委員</span>
                        <Badge variant="outline">
                          {stats?.students.active || 0}名
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">図書委員がいるクラス</span>
                        <Badge variant="outline">
                          {stats?.classes.withStudents || 0}クラス
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4 mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>詳細な分析機能は今後実装予定です</p>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4 mt-4">
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" text="活動履歴を読み込み中..." />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>最近の活動はありません</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString(
                              'ja-JP'
                            )}
                          </p>
                        </div>
                      </div>
                    ))}

                    {activities.length > 10 && (
                      <Button variant="outline" className="w-full">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        すべての活動を見る
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
