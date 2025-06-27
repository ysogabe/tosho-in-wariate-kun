# Issue #015: スケジュール管理APIルートの作成

**Priority**: High  
**Difficulty**: Advanced  
**Estimated Time**: 6-8 hours  
**Type**: Backend  
**Labels**: backend, api, schedules, crud

## Description

スケジュール（当番表）管理を行うNext.js API Routesを実装します。スケジュール生成、取得、更新、削除機能と、前期・後期の期間管理、スケジュール配布機能を提供します。

## Background

API設計書で定義されたスケジュール管理APIエンドポイントを実装し、Issue #021で実装されたスケジュール生成サービスと連携して、包括的なスケジュール管理システムを構築します。

## Acceptance Criteria

- [ ] GET /api/schedules エンドポイントが実装されている
- [ ] POST /api/schedules/generate エンドポイントが実装されている
- [ ] GET /api/schedules/[term] エンドポイントが実装されている
- [ ] PUT /api/schedules/[id] エンドポイントが実装されている
- [ ] DELETE /api/schedules/reset エンドポイントが実装されている
- [ ] GET /api/schedules/export エンドポイントが実装されている
- [ ] スケジュール生成サービスとの統合が完了している
- [ ] 適切なバリデーションとエラーハンドリングが実装されている

## Implementation Guidelines

### Getting Started

1. Issue #013（クラス管理API）が完了していることを確認
2. Issue #014（図書委員管理API）が完了していることを確認
3. Issue #021（スケジュール生成サービス）が完了していることを確認
4. スケジュール生成ロジックの理解

### API Routes Implementation

#### 1. GET /api/schedules

##### src/app/api/schedules/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const SchedulesQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
  format: z.enum(['grid', 'list', 'calendar']).default('grid'),
  includeStudents: z.coerce.boolean().default(true),
  includeRooms: z.coerce.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const params = SchedulesQuerySchema.parse(Object.fromEntries(searchParams))

    const where = {
      ...(params.term && { term: params.term }),
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        ...(params.includeStudents && {
          student: {
            include: {
              class: {
                select: { id: true, name: true, year: true },
              },
            },
          },
        }),
        ...(params.includeRooms && {
          room: {
            select: { id: true, name: true, capacity: true },
          },
        }),
      },
      orderBy: [
        { term: 'asc' },
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
      ],
    })

    // フォーマット別データ変換
    let formattedData
    switch (params.format) {
      case 'grid':
        formattedData = formatAsGrid(assignments)
        break
      case 'calendar':
        formattedData = formatAsCalendar(assignments)
        break
      default:
        formattedData = assignments
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: formattedData,
        summary: generateSummary(assignments),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function formatAsGrid(assignments: any[]) {
  const grid: Record<string, Record<number, any[]>> = {
    FIRST_TERM: {},
    SECOND_TERM: {},
  }

  // 曜日別にグループ化
  assignments.forEach((assignment) => {
    const { term, dayOfWeek } = assignment
    if (!grid[term][dayOfWeek]) {
      grid[term][dayOfWeek] = []
    }
    grid[term][dayOfWeek].push(assignment)
  })

  return grid
}

function formatAsCalendar(assignments: any[]) {
  // カレンダー形式での表示用データ
  return assignments.map((assignment) => ({
    id: assignment.id,
    title: `${assignment.student.name} (${assignment.room.name})`,
    dayOfWeek: assignment.dayOfWeek,
    term: assignment.term,
    student: assignment.student,
    room: assignment.room,
  }))
}

function generateSummary(assignments: any[]) {
  const summary = {
    totalAssignments: assignments.length,
    byTerm: {
      FIRST_TERM: assignments.filter((a) => a.term === 'FIRST_TERM').length,
      SECOND_TERM: assignments.filter((a) => a.term === 'SECOND_TERM').length,
    },
    byDay: {},
    byRoom: {},
  }

  // 曜日別統計
  for (let day = 1; day <= 5; day++) {
    summary.byDay[day] = assignments.filter((a) => a.dayOfWeek === day).length
  }

  // 図書室別統計
  assignments.forEach((assignment) => {
    const roomName = assignment.room?.name || 'Unknown'
    summary.byRoom[roomName] = (summary.byRoom[roomName] || 0) + 1
  })

  return summary
}
```

#### 2. POST /api/schedules/generate

##### src/app/api/schedules/generate/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { SchedulerService } from '@/lib/services/scheduler'
import { z } from 'zod'

const GenerateScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']),
  forceRegenerate: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const { term, forceRegenerate } = GenerateScheduleSchema.parse(body)

    const scheduler = new SchedulerService()
    const result = await scheduler.generateSchedule(term, forceRegenerate)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: result.error || 'スケジュール生成に失敗しました',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          assignments: result.assignments,
          stats: result.stats,
          message: `${term === 'FIRST_TERM' ? '前期' : '後期'}のスケジュールを生成しました`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 3. GET /api/schedules/[term]

##### src/app/api/schedules/[term]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const TermSchema = z.enum(['FIRST_TERM', 'SECOND_TERM'])

export async function GET(
  request: NextRequest,
  { params }: { params: { term: string } }
) {
  try {
    await authenticate(request)

    const term = TermSchema.parse(params.term)

    const assignments = await prisma.assignment.findMany({
      where: { term },
      include: {
        student: {
          include: {
            class: {
              select: { id: true, name: true, year: true },
            },
          },
        },
        room: {
          select: { id: true, name: true, capacity: true },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
        { student: { name: 'asc' } },
      ],
    })

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SCHEDULE_FOUND',
            message: `${term === 'FIRST_TERM' ? '前期' : '後期'}のスケジュールが見つかりません`,
          },
        },
        { status: 404 }
      )
    }

    // 週ごとのスケジュール構造を作成
    const weeklySchedule = createWeeklySchedule(assignments)
    const statistics = calculateTermStatistics(assignments)

    return NextResponse.json({
      success: true,
      data: {
        term,
        termName: term === 'FIRST_TERM' ? '前期' : '後期',
        assignments,
        weeklySchedule,
        statistics,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function createWeeklySchedule(assignments: any[]) {
  const schedule: Record<number, Record<string, any[]>> = {}

  // 曜日1-5（月-金）で初期化
  for (let day = 1; day <= 5; day++) {
    schedule[day] = {}
  }

  assignments.forEach((assignment) => {
    const { dayOfWeek, room } = assignment
    const roomName = room.name

    if (!schedule[dayOfWeek][roomName]) {
      schedule[dayOfWeek][roomName] = []
    }

    schedule[dayOfWeek][roomName].push(assignment)
  })

  return schedule
}

function calculateTermStatistics(assignments: any[]) {
  const stats = {
    totalAssignments: assignments.length,
    studentsCount: new Set(assignments.map((a) => a.studentId)).size,
    roomsCount: new Set(assignments.map((a) => a.roomId)).size,
    averagePerDay: assignments.length / 5,
    distributionByDay: {},
    distributionByGrade: {},
    distributionByClass: {},
  }

  // 曜日別分布
  for (let day = 1; day <= 5; day++) {
    stats.distributionByDay[day] = assignments.filter(
      (a) => a.dayOfWeek === day
    ).length
  }

  // 学年別分布
  assignments.forEach((assignment) => {
    const grade = assignment.student.grade
    stats.distributionByGrade[grade] =
      (stats.distributionByGrade[grade] || 0) + 1
  })

  // クラス別分布
  assignments.forEach((assignment) => {
    const className = `${assignment.student.class.year}年${assignment.student.class.name}組`
    stats.distributionByClass[className] =
      (stats.distributionByClass[className] || 0) + 1
  })

  return stats
}
```

#### 4. DELETE /api/schedules/reset

##### src/app/api/schedules/reset/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { z } from 'zod'

const ResetScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM', 'ALL']),
  confirmDelete: z.boolean(),
})

export async function DELETE(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const { term, confirmDelete } = ResetScheduleSchema.parse(body)

    if (!confirmDelete) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: '削除を実行するには確認が必要です',
          },
        },
        { status: 400 }
      )
    }

    const whereCondition = term === 'ALL' ? {} : { term }

    // 削除前にカウント取得
    const existingCount = await prisma.assignment.count({
      where: whereCondition,
    })

    if (existingCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SCHEDULE_TO_DELETE',
            message: '削除対象のスケジュールが見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // トランザクションで削除実行
    const result = await prisma.$transaction(async (tx) => {
      const deletedAssignments = await tx.assignment.deleteMany({
        where: whereCondition,
      })

      return deletedAssignments
    })

    const termName =
      term === 'ALL' ? '全期間' : term === 'FIRST_TERM' ? '前期' : '後期'

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
        message: `${termName}のスケジュール（${result.count}件）を削除しました`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 5. GET /api/schedules/export

##### src/app/api/schedules/export/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const ExportQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
})

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const params = ExportQuerySchema.parse(Object.fromEntries(searchParams))

    const where = params.term ? { term: params.term } : {}

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        student: {
          include: {
            class: {
              select: { name: true, year: true },
            },
          },
        },
        room: {
          select: { name: true },
        },
      },
      orderBy: [
        { term: 'asc' },
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
      ],
    })

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_DATA_TO_EXPORT',
            message: 'エクスポートするデータがありません',
          },
        },
        { status: 404 }
      )
    }

    switch (params.format) {
      case 'csv':
        return exportAsCsv(assignments)
      case 'json':
        return exportAsJson(assignments)
      case 'pdf':
        return exportAsPdf(assignments)
      default:
        return exportAsCsv(assignments)
    }
  } catch (error) {
    return handleApiError(error)
  }
}

function exportAsCsv(assignments: any[]) {
  const dayNames = ['', '月', '火', '水', '木', '金']
  const termNames = { FIRST_TERM: '前期', SECOND_TERM: '後期' }

  let csv = '期,曜日,図書室,学年,クラス,氏名\n'

  assignments.forEach((assignment) => {
    const termName = termNames[assignment.term]
    const dayName = dayNames[assignment.dayOfWeek]
    const roomName = assignment.room.name
    const grade = assignment.student.grade
    const className = assignment.student.class.name
    const studentName = assignment.student.name

    csv += `${termName},${dayName},${roomName},${grade}年,${className}組,${studentName}\n`
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="library-schedule-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

function exportAsJson(assignments: any[]) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalAssignments: assignments.length,
    assignments: assignments.map((assignment) => ({
      term: assignment.term,
      dayOfWeek: assignment.dayOfWeek,
      room: assignment.room.name,
      student: {
        name: assignment.student.name,
        grade: assignment.student.grade,
        class: `${assignment.student.class.year}年${assignment.student.class.name}組`,
      },
    })),
  }

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="library-schedule-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}

function exportAsPdf(assignments: any[]) {
  // PDF生成は別途実装（jsPDFやPuppeteerを使用）
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PDF_NOT_IMPLEMENTED',
        message: 'PDF出力は現在準備中です',
      },
    },
    { status: 501 }
  )
}

function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

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
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  )
}
```

### Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [CSV Export in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/Blob)

## Implementation Results

### Work Completed

- [ ] GET /api/schedules 実装
- [ ] POST /api/schedules/generate 実装
- [ ] GET /api/schedules/[term] 実装
- [ ] DELETE /api/schedules/reset 実装
- [ ] GET /api/schedules/export 実装
- [ ] スケジュール生成サービス統合
- [ ] データフォーマット変換機能実装
- [ ] エクスポート機能実装

### Testing Results

- [ ] スケジュール生成API確認
- [ ] データ取得API確認
- [ ] リセット機能確認
- [ ] エクスポート機能確認
- [ ] エラーハンドリング確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #016: フォームバリデーションスキーマ実装
2. Issue #017: スケジュール表示コンポーネント作成
3. Issue #018: スケジュール管理ページ実装
