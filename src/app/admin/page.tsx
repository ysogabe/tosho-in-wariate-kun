'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  School,
  Users,
  Calendar,
  BookOpen,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react'
import useSWR from 'swr'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { toast } from 'sonner'
import Link from 'next/link'
import { TodayDuties } from '@/components/dashboard/today-duties-simple'
import { WeeklySchedule } from '@/components/dashboard/weekly-schedule-simple'

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

export default function AdminDashboard() {
  // 統計データの取得
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR(
    '/api/dashboard/stats',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return response.json()
    },
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      refreshInterval: 30000, // 30秒ごとに更新
    }
  )

  const stats = statsData?.data as DashboardStats

  // 現在の学期を判定
  const currentTerm =
    stats?.schedules.firstTerm.exists && !stats?.schedules.secondTerm.exists
      ? 'FIRST_TERM'
      : stats?.schedules.secondTerm.exists
        ? 'SECOND_TERM'
        : 'FIRST_TERM'

  const schedulesGenerated =
    (stats?.schedules.firstTerm.exists ? 1 : 0) +
    (stats?.schedules.secondTerm.exists ? 1 : 0)

  const handleRefreshData = async () => {
    try {
      // mutateStats 変数が未定義のため、直接SWRのmutateを使用
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to refresh data')
      }
      toast.success('📊 データを更新しました！')
      // ページを再読み込みして最新データを取得
      window.location.reload()
    } catch (error) {
      console.error('データ更新エラー:', error)
      toast.error('❌ データの更新に失敗しました')
    }
  }

  if (statsError) {
    return (
      <PageLayout
        title="📊 ダッシュボード"
        description="図書委員当番システムの概要"
        schoolName="🏫 かがやき小学校 図書委員当番"
      >
        <Alert
          variant="destructive"
          style={{
            backgroundColor: 'hsl(0, 100%, 95%)',
            borderColor: 'hsl(0, 70%, 70%)',
            color: 'hsl(340, 80%, 45%)',
            fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            😅
            ダッシュボードデータの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  if (statsLoading) {
    return (
      <PageLayout
        title="📊 ダッシュボード"
        description="図書委員当番システムの概要"
        schoolName="🏫 かがやき小学校 図書委員当番"
      >
        <LoadingSpinner text="データを読み込み中..." />
      </PageLayout>
    )
  }

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif' }}>
      <PageLayout
        title="📊 ダッシュボード"
        description="図書委員当番システムの概要"
        schoolName="🏫 かがやき小学校 図書委員当番"
        actions={
          <Button
            variant="outline"
            onClick={handleRefreshData}
            style={{
              backgroundColor: 'hsl(120, 60%, 95%)',
              borderColor: 'hsl(120, 50%, 70%)',
              color: 'hsl(120, 80%, 30%)',
              borderRadius: '12px',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            📊 更新
          </Button>
        }
      >
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card
            style={{
              backgroundColor: 'hsl(200, 100%, 95%)',
              border: '2px dashed hsl(200, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {stats?.classes.total || 0}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    🏫 総クラス数
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(140, 100%, 95%)',
              border: '2px dashed hsl(140, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {stats?.students.total || 0}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    👥 総生徒数
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(280, 100%, 95%)',
              border: '2px dashed hsl(280, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {stats?.students.active || 0}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    ✨ 図書委員数
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(30, 100%, 95%)',
              border: '2px dashed hsl(30, 100%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl font-bold"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {stats?.rooms.total || 0}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'hsl(340, 60%, 50%)' }}
                  >
                    📚 図書室数
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 今日の当番表示 */}
        <TodayDuties />

        {/* 週間スケジュール表示 */}
        <WeeklySchedule />

        {/* 現在の状態 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid hsl(180, 80%, 90%)',
              borderRadius: '12px',
            }}
          >
            <CardHeader>
              <CardTitle
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                📅 現在の学期
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Calendar
                  className="h-5 w-5"
                  style={{ color: 'hsl(180, 70%, 50%)' }}
                />
                <Badge
                  variant="default"
                  style={{
                    backgroundColor: 'hsl(140, 70%, 85%)',
                    color: 'hsl(140, 80%, 30%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {currentTerm === 'FIRST_TERM' ? '📗 前期' : '📘 後期'}
                </Badge>
              </div>
              <p
                className="text-sm mt-2"
                style={{
                  color: 'hsl(340, 60%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                現在は
                {currentTerm === 'FIRST_TERM' ? '前期' : '後期'}
                です。
                {schedulesGenerated > 0
                  ? `✨ スケジュールが${schedulesGenerated}回生成されています。`
                  : '⏰ まだスケジュールが生成されていません。'}
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid hsl(280, 80%, 90%)',
              borderRadius: '12px',
            }}
          >
            <CardHeader>
              <CardTitle
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                🎉 最近のアクティビティ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'hsl(120, 70%, 60%)' }}
                  ></div>
                  <span
                    style={{
                      color: 'hsl(340, 60%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    💚 システム稼働中
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'hsl(200, 70%, 60%)' }}
                  ></div>
                  <span
                    style={{
                      color: 'hsl(340, 60%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    📊 {schedulesGenerated}回のスケジュール生成
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: 'hsl(280, 70%, 60%)' }}
                  ></div>
                  <span
                    style={{
                      color: 'hsl(340, 60%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    👥 {stats?.students.active || 0}名の図書委員が登録済み
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <Card
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid hsl(350, 80%, 90%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader>
            <CardTitle
              style={{
                color: 'hsl(340, 70%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              🚀 クイックアクション
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/classes"
                className="block p-4 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'hsl(200, 100%, 95%)',
                  border: '2px dashed hsl(200, 70%, 70%)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                <School
                  className="h-6 w-6 mb-2"
                  style={{ color: 'hsl(200, 70%, 50%)' }}
                />
                <h3
                  className="font-medium mb-1"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  🏫 クラス管理
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: 'hsl(340, 60%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  クラスの追加・編集・削除
                </p>
              </Link>

              <Link
                href="/admin/students"
                className="block p-4 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'hsl(140, 100%, 95%)',
                  border: '2px dashed hsl(140, 70%, 70%)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                <Users
                  className="h-6 w-6 mb-2"
                  style={{ color: 'hsl(140, 70%, 50%)' }}
                />
                <h3
                  className="font-medium mb-1"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  👥 図書委員管理
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: 'hsl(340, 60%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  図書委員の登録・管理
                </p>
              </Link>

              <Link
                href="/admin/schedules"
                className="block p-4 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'hsl(280, 100%, 95%)',
                  border: '2px dashed hsl(280, 70%, 70%)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                <Calendar
                  className="h-6 w-6 mb-2"
                  style={{ color: 'hsl(280, 70%, 50%)' }}
                />
                <h3
                  className="font-medium mb-1"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  📅 スケジュール生成
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: 'hsl(340, 60%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  当番表の自動生成
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </div>
  )
}
