# Issue #025: システム設定ページの実装

**Priority**: Low  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, pages, settings, system

## Description

システム設定を管理するページを実装します。システム情報の表示、データリセット機能、エクスポート・インポート機能を統合した設定管理インターフェースを提供します。

## Background

フロントエンド設計書で定義されたシステム設定画面の要件に基づき、管理者が年度末のデータリセットやシステム情報確認を行える設定ページを構築します。

## Acceptance Criteria

- [ ] システム設定ページが実装されている
- [ ] システム情報表示機能が実装されている
- [ ] データリセット機能が実装されている
- [ ] データエクスポート機能が実装されている
- [ ] システム統計表示機能が実装されている
- [ ] 危険な操作の確認機能が実装されている
- [ ] アクセシビリティ対応が実装されている
- [ ] 管理者権限チェックが実装されている

## Implementation Guidelines

### Getting Started

1. Issue #011（認証ミドルウェア）が完了していることを確認
2. 設定ページの基本的な設計パターンを理解
3. 危険な操作のUXパターンを確認
4. システム情報取得方法の理解

### Main Implementation

#### 1. System Settings API

##### src/app/api/system/info/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    // システム統計を取得
    const [
      totalStudents,
      totalClasses,
      totalRooms,
      totalAssignments,
      activeStudents,
      activeRooms,
      firstTermAssignments,
      secondTermAssignments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.class.count(),
      prisma.room.count(),
      prisma.assignment.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.room.count({ where: { isActive: true } }),
      prisma.assignment.count({ where: { term: 'FIRST_TERM' } }),
      prisma.assignment.count({ where: { term: 'SECOND_TERM' } }),
    ])

    // 最新のデータベース更新日時
    const latestStudent = await prisma.student.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })

    const latestAssignment = await prisma.assignment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    const systemInfo = {
      version: process.env.SYSTEM_VERSION || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        provider: 'PostgreSQL',
        lastDataUpdate: latestStudent?.updatedAt || null,
        lastScheduleGeneration: latestAssignment?.createdAt || null,
      },
      statistics: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },
        classes: {
          total: totalClasses,
        },
        rooms: {
          total: totalRooms,
          active: activeRooms,
          inactive: totalRooms - activeRooms,
        },
        assignments: {
          total: totalAssignments,
          firstTerm: firstTermAssignments,
          secondTerm: secondTermAssignments,
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: systemInfo,
    })
  } catch (error) {
    console.error('System info error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'システム情報の取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
```

##### src/app/api/system/reset/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { z } from 'zod'

const ResetRequestSchema = z.object({
  resetType: z.enum(['assignments', 'students', 'all']),
  confirmPassword: z.string().min(1),
  confirm: z.boolean().refine((val) => val === true, {
    message: '確認が必要です',
  }),
})

export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const { resetType, confirmPassword, confirm } =
      ResetRequestSchema.parse(body)

    // パスワード確認（実際の実装では環境変数から取得）
    const adminPassword = process.env.ADMIN_RESET_PASSWORD || 'reset123'
    if (confirmPassword !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: '管理者パスワードが正しくありません',
          },
        },
        { status: 401 }
      )
    }

    let deletedCounts = {
      assignments: 0,
      students: 0,
      classes: 0,
      rooms: 0,
    }

    // トランザクションでデータリセット実行
    await prisma.$transaction(async (tx) => {
      switch (resetType) {
        case 'assignments':
          const assignmentResult = await tx.assignment.deleteMany({})
          deletedCounts.assignments = assignmentResult.count
          break

        case 'students':
          const assignmentResult2 = await tx.assignment.deleteMany({})
          const studentResult = await tx.student.deleteMany({})
          deletedCounts.assignments = assignmentResult2.count
          deletedCounts.students = studentResult.count
          break

        case 'all':
          const assignmentResult3 = await tx.assignment.deleteMany({})
          const studentResult2 = await tx.student.deleteMany({})
          const classResult = await tx.class.deleteMany({})
          const roomResult = await tx.room.deleteMany({})

          deletedCounts.assignments = assignmentResult3.count
          deletedCounts.students = studentResult2.count
          deletedCounts.classes = classResult.count
          deletedCounts.rooms = roomResult.count
          break
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `${getResetTypeText(resetType)}を実行しました`,
        deletedCounts,
      },
    })
  } catch (error) {
    console.error('System reset error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バリデーションエラーが発生しました',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'データリセットに失敗しました',
        },
      },
      { status: 500 }
    )
  }
}

function getResetTypeText(resetType: string): string {
  switch (resetType) {
    case 'assignments':
      return '当番表データのリセット'
    case 'students':
      return '図書委員データのリセット'
    case 'all':
      return '全データのリセット'
    default:
      return 'データリセット'
  }
}
```

##### src/app/api/system/export/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    // 全データを取得
    const [classes, students, rooms, assignments] = await Promise.all([
      prisma.class.findMany({
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
      }),
      prisma.student.findMany({
        include: {
          class: {
            select: { name: true, year: true },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      prisma.room.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.assignment.findMany({
        include: {
          student: {
            select: { name: true, grade: true },
          },
          room: {
            select: { name: true },
          },
        },
        orderBy: [{ term: 'asc' }, { dayOfWeek: 'asc' }],
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          year: c.year,
          createdAt: c.createdAt.toISOString(),
        })),
        students: students.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          class: `${s.class.year}年${s.class.name}組`,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
        })),
        rooms: rooms.map((r) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          description: r.description,
          isActive: r.isActive,
          createdAt: r.createdAt.toISOString(),
        })),
        assignments: assignments.map((a) => ({
          id: a.id,
          studentName: a.student.name,
          roomName: a.room.name,
          dayOfWeek: a.dayOfWeek,
          term: a.term,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="tosho-system-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('System export error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'データエクスポートに失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
```

#### 2. System Settings Page

##### src/app/admin/settings/page.tsx

```typescript
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import {
  Settings,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  Server,
  Calendar,
  Users,
  Building,
  BookOpen,
  RefreshCw,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemInfo {
  version: string
  buildDate: string
  environment: string
  database: {
    provider: string
    lastDataUpdate: string | null
    lastScheduleGeneration: string | null
  }
  statistics: {
    students: {
      total: number
      active: number
      inactive: number
    }
    classes: {
      total: number
    }
    rooms: {
      total: number
      active: number
      inactive: number
    }
    assignments: {
      total: number
      firstTerm: number
      secondTerm: number
    }
  }
}

export default function SystemSettingsPage() {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetType, setResetType] = useState<'assignments' | 'students' | 'all'>('assignments')
  const [resetPassword, setResetPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // システム情報の取得
  const {
    data: systemData,
    error,
    isLoading,
    mutate
  } = useSWR('/api/system/info', async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch system info')
    }
    return response.json()
  })

  // データエクスポート
  const handleExportData = useCallback(async () => {
    try {
      const response = await fetch('/api/system/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tosho-system-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success('システムデータをエクスポートしました')
      } else {
        toast.error('エクスポートに失敗しました')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('エクスポート中にエラーが発生しました')
    }
  }, [])

  // データリセット
  const handleResetData = useCallback(async () => {
    if (!resetPassword) {
      toast.error('管理者パスワードを入力してください')
      return
    }

    setIsResetting(true)

    try {
      const response = await fetch('/api/system/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetType,
          confirmPassword: resetPassword,
          confirm: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.data.message)
        setShowResetDialog(false)
        setResetPassword('')
        mutate() // システム情報を再取得
      } else {
        toast.error(result.error.message || 'データリセットに失敗しました')
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('データリセット中にエラーが発生しました')
    } finally {
      setIsResetting(false)
    }
  }, [resetType, resetPassword, mutate])

  const systemInfo = systemData?.data as SystemInfo

  const getResetTypeDescription = (type: string): string => {
    switch (type) {
      case 'assignments':
        return '当番表のみを削除します。図書委員とクラス情報は保持されます。'
      case 'students':
        return '図書委員情報と当番表を削除します。クラス情報は保持されます。'
      case 'all':
        return 'すべてのデータ（クラス、図書委員、当番表）を削除します。'
      default:
        return ''
    }
  }

  if (error) {
    return (
      <PageLayout title="システム設定" description="システムの設定と管理">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            システム情報の取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="システム設定"
      description="システムの設定と管理を行います"
      actions={
        <Button variant="outline" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          更新
        </Button>
      }
    >
      <div className="space-y-6">
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">システム情報</TabsTrigger>
            <TabsTrigger value="data">データ管理</TabsTrigger>
            <TabsTrigger value="maintenance">メンテナンス</TabsTrigger>
          </TabsList>

          {/* システム情報タブ */}
          <TabsContent value="info" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="lg" text="システム情報を読み込み中..." />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* システム基本情報 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      システム基本情報
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">バージョン</span>
                          <Badge variant="outline">v{systemInfo?.version}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">環境</span>
                          <Badge variant={systemInfo?.environment === 'production' ? 'default' : 'secondary'}>
                            {systemInfo?.environment}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">データベース</span>
                          <span className="text-sm">{systemInfo?.database.provider}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">ビルド日時</span>
                          <span className="text-sm">
                            {systemInfo?.buildDate ? new Date(systemInfo.buildDate).toLocaleString('ja-JP') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">最終データ更新</span>
                          <span className="text-sm">
                            {systemInfo?.database.lastDataUpdate ?
                              new Date(systemInfo.database.lastDataUpdate).toLocaleString('ja-JP') : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">最終スケジュール生成</span>
                          <span className="text-sm">
                            {systemInfo?.database.lastScheduleGeneration ?
                              new Date(systemInfo.database.lastScheduleGeneration).toLocaleString('ja-JP') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* データ統計 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {systemInfo?.statistics.students.total || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">図書委員</p>
                          <p className="text-xs text-green-600">
                            {systemInfo?.statistics.students.active || 0}名がアクティブ
                          </p>
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
                            {systemInfo?.statistics.classes.total || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">クラス</p>
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
                            {systemInfo?.statistics.rooms.total || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">図書室</p>
                          <p className="text-xs text-green-600">
                            {systemInfo?.statistics.rooms.active || 0}室が稼働中
                          </p>
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
                            {systemInfo?.statistics.assignments.total || 0}
                          </div>
                          <p className="text-sm text-muted-foreground">当番</p>
                          <p className="text-xs text-muted-foreground">
                            前期{systemInfo?.statistics.assignments.firstTerm || 0}件 /
                            後期{systemInfo?.statistics.assignments.secondTerm || 0}件
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* データ管理タブ */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* データエクスポート */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    データエクスポート
                  </CardTitle>
                  <CardDescription>
                    全データをJSONファイルとしてダウンロードします
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      クラス、図書委員、図書室、当番表のすべてのデータが含まれます。
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleExportData} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    データをエクスポート
                  </Button>
                </CardContent>
              </Card>

              {/* データリセット */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    データリセット
                  </CardTitle>
                  <CardDescription>
                    年度末のデータ整理に使用します
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      この操作は取り消せません。必ずデータエクスポートを行ってから実行してください。
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="destructive"
                    onClick={() => setShowResetDialog(true)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    データリセット
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* メンテナンスタブ */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  メンテナンス機能
                </CardTitle>
                <CardDescription>
                  今後のバージョンで実装予定の機能です
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4" />
                  <p>メンテナンス機能は準備中です</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* データリセット確認ダイアログ */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                データリセット確認
              </AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消すことができません。慎重に選択してください。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>リセット対象</Label>
                <Select value={resetType} onValueChange={(value: any) => setResetType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignments">当番表のみ</SelectItem>
                    <SelectItem value="students">図書委員と当番表</SelectItem>
                    <SelectItem value="all">すべてのデータ</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {getResetTypeDescription(resetType)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-password">管理者パスワード</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="管理者パスワードを入力"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetData}
                disabled={isResetting || !resetPassword}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isResetting ? '実行中...' : 'リセット実行'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  )
}
```

### Resources

- [System Administration Interfaces](https://ux.stackexchange.com/questions/96970/best-practices-for-form-validation)
- [Dangerous Actions UX](https://uxplanet.org/designing-better-error-messages-4f1b83e9a40b)
- [Data Export/Import Patterns](https://ui-patterns.com/patterns/DataExport)

## Implementation Results

### Work Completed

- [ ] システム設定API実装
- [ ] システム設定ページ実装
- [ ] システム情報表示実装
- [ ] データエクスポート機能実装
- [ ] データリセット機能実装
- [ ] 統計情報表示実装
- [ ] 危険操作の確認機能実装

### Testing Results

- [ ] システム情報表示確認
- [ ] エクスポート機能確認
- [ ] リセット機能確認
- [ ] セキュリティチェック確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #026: エラーページ実装
2. Issue #027: テストセットアップ
3. Issue #028: E2Eテスト実装
