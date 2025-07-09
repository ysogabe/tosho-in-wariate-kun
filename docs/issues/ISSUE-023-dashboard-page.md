# Issue #023: ダッシュボードページの実装

**Priority**: High  
**Difficulty**: Intermediate  
**Estimated Time**: 5-7 hours  
**Type**: Frontend  
**Labels**: frontend, pages, dashboard, analytics

## Description

システムのメインダッシュボードページを実装します。当番表の状況、統計情報、最近の活動、クイックアクション機能を統合した情報管理の中心となるページを提供します。

## Background

フロントエンド設計書で定義されたダッシュボード画面の要件に基づき、教員が一目でシステムの状況を把握でき、主要な操作にすぐアクセスできる効率的なダッシュボードを構築します。

## Acceptance Criteria

- [ ] ダッシュボードページが実装されている
- [ ] 統計情報の表示が実装されている
- [ ] **今日の当番表示機能が実装されている** (新規追加)
- [ ] **週間スケジュール表示機能が実装されている** (新規追加)
- [ ] 当番表の状況表示が実装されている
- [ ] クイックアクション機能が実装されている
- [ ] 最近の活動表示が実装されている
- [ ] レスポンシブ対応が実装されている
- [ ] リアルタイム更新機能が実装されている
- [ ] アクセシビリティ対応が実装されている

## 新機能: 画面構成案

### 📋 画面レイアウト (ワイヤーフレーム)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 ダッシュボード - 図書委員当番システムの概要                                      │
│                                                     [更新] ボタン              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 統計カード（既存）                                                            │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                          │
│ │👥 12│ │🏫 6 │ │📅 48│ │📖 2 │                                          │
│ │委員数│ │クラス│ │当番数│ │図書室│                                          │
│ └─────┘ └─────┘ └─────┘ └─────┘                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌟 今日の当番 (新規追加)                            📅 今日: 7月8日(月)       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📚 図書室1                     📚 図書室2                              │ │
│ │ ┌─────────────────┐             ┌─────────────────┐                   │ │
│ │ │ 👤 田中 花子     │             │ 👤 佐藤 太郎     │                   │ │
│ │ │ 5年2組          │             │ 6年1組          │                   │ │
│ │ │ ⏰ 8:15-8:30   │             │ ⏰ 12:25-12:40 │                   │ │
│ │ └─────────────────┘             └─────────────────┘                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 今週のスケジュール (新規追加)                                              │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │      │ 月   │ 火   │ 水   │ 木   │ 金              │  [📊詳細表示]     │ │
│ │ ─────┼─────┼─────┼─────┼─────┼─────────────────┤                    │ │
│ │図書室1│田中★ │山田  │鈴木  │松本  │高橋            │  [🖨️印刷]       │ │
│ │      │5-2   │6-1   │5-1   │6-2   │5-3            │                    │ │
│ │ ─────┼─────┼─────┼─────┼─────┼─────────────────┤                    │ │
│ │図書室2│佐藤  │伊藤  │渡辺  │小林  │加藤            │                    │ │
│ │      │6-1   │5-2   │6-3   │5-1   │6-2            │                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ★印: 今日の当番                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 当番表の状況 (既存)                         │ クイックアクション (既存)        │
│ ┌─────────────────────────────────────┐    │ ┌─────────────────────────────┐│
│ │ ✅ 前期・後期の当番表が作成済み        │    │ │ ➕ 図書委員を追加           ││
│ │                                   │    │ │ 🏫 クラス管理               ││
│ │ 前期: 作成済み  │ 後期: 作成済み    │    │ │ 📊 当番表を見る             ││
│ │ 24件の当番     │ 24件の当番       │    │ │ 💾 データ出力               ││
│ │                                   │    │ │ ⚙️  システム設定             ││
│ │ [📅当番表管理] [➕新規生成]         │    │ └─────────────────────────────┘│
│ └─────────────────────────────────────┘    │                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 詳細情報 (既存)                                                              │
│ [概要] [分析] [最近の活動] タブ                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🎯 新機能の詳細仕様

#### 1. 今日の当番表示 (TodayDuties Component)

**表示位置**: 統計カードの直下
**機能要件**:
- 現在の日付と曜日を表示
- 各図書室の当番情報（名前、クラス、時間帯）
- 土日・祝日は「今日は当番がありません」表示
- リアルタイム日付更新（日付が変わったら自動更新）

**API仕様**: `GET /api/dashboard/today-duties`
```typescript
interface TodayDuty {
  roomId: string
  roomName: string
  student: {
    name: string
    class: {
      year: number
      name: string
    }
  }
  timeSlot: string
  period: 'MORNING' | 'LUNCH' | 'AFTER_SCHOOL'
}

interface TodayDutiesResponse {
  date: string  // YYYY-MM-DD
  dayOfWeek: string  // 'monday' | 'tuesday' | ...
  isWeekend: boolean
  duties: TodayDuty[]
}
```

#### 2. 週間スケジュール表示 (WeeklySchedule Component)

**表示位置**: 今日の当番の直下
**機能要件**:
- 月曜〜金曜の5日間表示（コンパクト版）
- 各図書室の当番を名前とクラスで表示
- 今日の当番を★印でハイライト
- [詳細表示]ボタンで完全な当番表へ遷移
- [印刷]ボタンで週間表をPDF印刷

**データ仕様**: 既存のSchedule APIを拡張利用

### 🔄 TDD実装アプローチ

#### Phase 1: Red (失敗するテストを書く)
1. `/api/dashboard/today-duties` APIのテスト作成
2. `TodayDuties` コンポーネントのテスト作成
3. `WeeklySchedule` コンポーネントのテスト作成
4. ダッシュボードページ統合テスト作成

#### Phase 2: Green (テストを通す最小限の実装)
1. API endpoint実装
2. コンポーネント基本実装
3. ダッシュボードページ統合

#### Phase 3: Refactor (品質向上)
1. パフォーマンス最適化
2. アクセシビリティ改善
3. エラーハンドリング強化
4. レスポンシブ対応完成

## Implementation Guidelines

### Getting Started

1. Issue #018（スケジュール管理ページ）が完了していることを確認
2. Issue #019（クラス管理ページ）が完了していることを確認
3. Issue #020（図書委員管理ページ）が完了していることを確認
4. ダッシュボードデザインパターンを理解

### Main Implementation

#### 1. Dashboard Page

##### src/app/dashboard/page.tsx

```typescript
'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Settings,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

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
  type: 'student_created' | 'class_created' | 'schedule_generated' | 'student_updated'
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
    mutate: mutateStats
  } = useSWR('/api/dashboard/stats', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    return response.json()
  })

  // 最近の活動の取得
  const {
    data: activitiesData,
    isLoading: activitiesLoading
  } = useSWR('/api/dashboard/activities', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch recent activities')
    }
    return response.json()
  })

  const stats = statsData?.data as DashboardStats
  const activities = activitiesData?.data?.activities as RecentActivity[] || []

  // スケジュール状況の分析
  const scheduleStatus = useMemo(() => {
    if (!stats) return { status: 'loading', message: '' }

    const { firstTerm, secondTerm } = stats.schedules

    if (!firstTerm.exists && !secondTerm.exists) {
      return {
        status: 'empty',
        message: '当番表が作成されていません',
        action: 'スケジュール生成が必要です'
      }
    }

    if (firstTerm.exists && !secondTerm.exists) {
      return {
        status: 'partial',
        message: '前期の当番表のみ作成済み',
        action: '後期のスケジュール生成を検討してください'
      }
    }

    if (firstTerm.exists && secondTerm.exists) {
      return {
        status: 'complete',
        message: '前期・後期の当番表が作成済み',
        action: ''
      }
    }

    return { status: 'unknown', message: '', action: '' }
  }, [stats])

  const handleRefreshData = async () => {
    try {
      await mutateStats()
      toast.success('データを更新しました')
    } catch (error) {
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
      title="ダッシュボード"
      description="図書委員当番システムの概要"
      actions={
        <Button variant="outline" onClick={handleRefreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      }
    >
      <div className="space-y-6">
        {/* システム状況サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.students.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">図書委員数</p>
                  {stats && (
                    <p className="text-xs text-green-600">
                      {stats.students.active}名がアクティブ
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.classes.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">クラス数</p>
                  {stats && (
                    <p className="text-xs text-green-600">
                      {stats.classes.withStudents}クラスに委員在籍
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' :
                      (stats?.schedules.firstTerm.assignmentCount || 0) +
                      (stats?.schedules.secondTerm.assignmentCount || 0)
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">総当番数</p>
                  {scheduleStatus.status === 'complete' && (
                    <p className="text-xs text-green-600">完了</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '---' : stats?.rooms.active || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">図書室数</p>
                  {stats && (
                    <p className="text-xs text-muted-foreground">
                      {stats.rooms.total}室中{stats.rooms.active}室稼働
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                        <p className="text-sm text-muted-foreground">{scheduleStatus.action}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">前期</h4>
                        <Badge variant={stats?.schedules.firstTerm.exists ? 'default' : 'secondary'}>
                          {stats?.schedules.firstTerm.exists ? '作成済み' : '未作成'}
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
                        <Badge variant={stats?.schedules.secondTerm.exists ? 'default' : 'secondary'}>
                          {stats?.schedules.secondTerm.exists ? '作成済み' : '未作成'}
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

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/classes">
                    <Building className="mr-2 h-4 w-4" />
                    クラス管理
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/schedules?format=grid">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    当番表を見る
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/schedules/export">
                    <Download className="mr-2 h-4 w-4" />
                    データ出力
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full justify-start">
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
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString('ja-JP')}
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
```

#### 2. Dashboard API Routes

##### src/app/api/dashboard/stats/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    // 並列でデータを取得
    const [studentsData, classesData, schedulesData, roomsData] =
      await Promise.all([
        // 図書委員統計
        prisma.student
          .aggregate({
            _count: {
              id: true,
            },
            where: {},
          })
          .then(async (total) => {
            const [active, grade5, grade6] = await Promise.all([
              prisma.student.count({ where: { isActive: true } }),
              prisma.student.count({ where: { grade: 5 } }),
              prisma.student.count({ where: { grade: 6 } }),
            ])
            return {
              total: total._count.id,
              active,
              grade5,
              grade6,
            }
          }),

        // クラス統計
        prisma.class
          .aggregate({
            _count: {
              id: true,
            },
          })
          .then(async (total) => {
            const withStudents = await prisma.class.count({
              where: {
                students: {
                  some: {},
                },
              },
            })
            return {
              total: total._count.id,
              withStudents,
            }
          }),

        // スケジュール統計
        Promise.all([
          prisma.assignment.aggregate({
            _count: { id: true },
            where: { term: 'FIRST_TERM' },
          }),
          prisma.assignment.aggregate({
            _count: { id: true },
            where: { term: 'SECOND_TERM' },
          }),
          prisma.assignment.findFirst({
            where: { term: 'FIRST_TERM' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
          prisma.assignment.findFirst({
            where: { term: 'SECOND_TERM' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]).then(
          ([
            firstTermCount,
            secondTermCount,
            firstTermLatest,
            secondTermLatest,
          ]) => ({
            firstTerm: {
              exists: firstTermCount._count.id > 0,
              assignmentCount: firstTermCount._count.id,
              lastGenerated: firstTermLatest?.createdAt.toISOString() || null,
            },
            secondTerm: {
              exists: secondTermCount._count.id > 0,
              assignmentCount: secondTermCount._count.id,
              lastGenerated: secondTermLatest?.createdAt.toISOString() || null,
            },
          })
        ),

        // 図書室統計
        prisma.room
          .aggregate({
            _count: {
              id: true,
            },
          })
          .then(async (total) => {
            const active = await prisma.room.count({
              where: { isActive: true },
            })
            return {
              total: total._count.id,
              active,
            }
          }),
      ])

    return NextResponse.json({
      success: true,
      data: {
        students: studentsData,
        classes: classesData,
        schedules: schedulesData,
        rooms: roomsData,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ダッシュボード統計の取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
```

##### src/app/api/dashboard/activities/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    // 最近の活動を取得（実際の実装では activity ログテーブルを作成）
    // ここでは簡易的に最近作成されたデータから活動を生成
    const [recentStudents, recentClasses, recentAssignments] =
      await Promise.all([
        prisma.student.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            class: {
              select: { name: true, year: true },
            },
          },
        }),
        prisma.class.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.assignment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: { name: true },
            },
          },
        }),
      ])

    const activities = [
      ...recentStudents.map((student) => ({
        id: `student-${student.id}`,
        type: 'student_created' as const,
        description: `図書委員「${student.name}」が${student.class.year}年${student.class.name}組に登録されました`,
        timestamp: student.createdAt.toISOString(),
      })),
      ...recentClasses.map((cls) => ({
        id: `class-${cls.id}`,
        type: 'class_created' as const,
        description: `クラス「${cls.year}年${cls.name}組」が作成されました`,
        timestamp: cls.createdAt.toISOString(),
      })),
      ...recentAssignments.map((assignment) => ({
        id: `assignment-${assignment.id}`,
        type: 'schedule_generated' as const,
        description: `「${assignment.student.name}」の当番が割り当てられました`,
        timestamp: assignment.createdAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.slice(0, 20),
      },
    })
  } catch (error) {
    console.error('Dashboard activities error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'アクティビティの取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
```

### Resources

- [Dashboard Design Patterns](https://ui-patterns.com/patterns/Dashboard)
- [Data Visualization Best Practices](https://www.tableau.com/learn/articles/data-visualization)
- [Analytics Dashboard Examples](https://dribbble.com/tags/dashboard)

## Implementation Results

### Work Completed

- [ ] ダッシュボードページ実装
- [ ] 統計情報表示実装
- [ ] **今日の当番表示機能実装** (新規追加)
- [ ] **週間スケジュール表示機能実装** (新規追加)
- [ ] **今日の当番API (/api/dashboard/today-duties) 実装** (新規追加)
- [ ] スケジュール状況表示実装
- [ ] クイックアクション実装
- [ ] 最近の活動表示実装
- [ ] ダッシュボードAPI実装
- [ ] レスポンシブ対応実装

### Testing Results

- [ ] 統計データ表示確認
- [ ] **今日の当番表示機能確認** (新規追加)
- [ ] **週間スケジュール表示機能確認** (新規追加)
- [ ] **今日の当番API動作確認** (新規追加)
- [ ] **土日・祝日の「当番なし」表示確認** (新規追加)
- [ ] **今日の当番ハイライト確認** (新規追加)
- [ ] クイックアクション確認
- [ ] レスポンシブ表示確認
- [ ] リアルタイム更新確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #024: 図書室管理ページ実装
2. Issue #025: システム設定ページ実装
3. Issue #026: エラーページ実装
