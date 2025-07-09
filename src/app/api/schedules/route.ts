/**
 * スケジュール取得APIエンドポイント
 * GET /api/schedules
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticate } from '@/lib/auth/helpers'

// クエリパラメータスキーマ
const ScheduleQuerySchema = z.object({
  term: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      // null, undefined, 空文字列の場合はundefinedを返す
      if (!val || val === 'null' || val === 'undefined') {
        return undefined
      }
      return val
    })
    .pipe(
      z.enum(['FIRST_TERM', 'SECOND_TERM']).optional()
    ),
  format: z.enum(['list', 'calendar']).optional().default('list'),
})

/**
 * スケジュール一覧取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証（一般ユーザーも閲覧可能）
    await authenticate(request)

    // クエリパラメータの解析
    const { searchParams } = new URL(request.url)
    const queryParams = {
      term: searchParams.get('term'),
      format: searchParams.get('format') || 'list',
    }

    // パラメータ検証
    const { term, format } = ScheduleQuerySchema.parse(queryParams)

    // 基本的なWHERE条件
    const whereCondition = term ? { term } : {}

    // スケジュール取得
    const assignments = await prisma.assignment.findMany({
      where: whereCondition,
      include: {
        student: {
          include: {
            class: true,
          },
        },
        room: true,
      },
      orderBy: [
        { term: 'asc' },
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
        { student: { name: 'asc' } },
      ],
    })

    // レスポンス形式に応じた整形
    let formattedData: unknown

    if (format === 'calendar') {
      // カレンダー形式（曜日・図書室ごとのグリッド）
      formattedData = formatAsCalendar(assignments)
    } else {
      // リスト形式（デフォルト）
      formattedData = assignments.map((assignment) => ({
        id: assignment.id,
        term: assignment.term,
        dayOfWeek: assignment.dayOfWeek,
        dayName: getDayName(assignment.dayOfWeek),
        room: {
          id: assignment.room.id,
          name: assignment.room.name,
          capacity: assignment.room.capacity,
        },
        student: {
          id: assignment.student.id,
          name: assignment.student.name,
          grade: assignment.student.grade,
          class: {
            id: assignment.student.class.id,
            name: assignment.student.class.name,
            year: assignment.student.class.year,
          },
        },
        createdAt: assignment.createdAt,
      }))
    }

    // 統計情報の計算
    const stats = calculateScheduleStats(assignments)

    return NextResponse.json({
      success: true,
      data: {
        schedules: formattedData,
        stats,
        format,
        filter: { term },
      },
    })
  } catch (error) {
    console.error('Schedule fetch API error:', error)
    return handleApiError(error)
  }
}

/**
 * 曜日番号を日本語名に変換
 */
function getDayName(dayOfWeek: number): string {
  const dayNames = ['', '月', '火', '水', '木', '金', '土', '日']
  return dayNames[dayOfWeek] || '不明'
}

/**
 * カレンダー形式に整形
 */
function formatAsCalendar(
  assignments: Array<{
    term: string
    dayOfWeek: number
    room: { id: string; name: string }
    student: {
      id: string
      name: string
      grade: number
      class: { name: string }
    }
    id: string
  }>
) {
  const calendar: Record<
    string,
    Record<
      number,
      Array<{
        id: string
        room: { id: string; name: string }
        student: { id: string; name: string; grade: number; className: string }
      }>
    >
  > = {}

  // 学期ごとに整理
  const terms = ['FIRST_TERM', 'SECOND_TERM']

  for (const term of terms) {
    calendar[term] = {}

    // 曜日ごとに初期化（1-5: 月-金）
    for (let day = 1; day <= 5; day++) {
      calendar[term][day] = []
    }
  }

  // 割り当てを配置
  for (const assignment of assignments) {
    const term = assignment.term
    const day = assignment.dayOfWeek

    if (calendar[term] && calendar[term][day]) {
      calendar[term][day].push({
        id: assignment.id,
        room: {
          id: assignment.room.id,
          name: assignment.room.name,
        },
        student: {
          id: assignment.student.id,
          name: assignment.student.name,
          grade: assignment.student.grade,
          className: assignment.student.class.name,
        },
      })
    }
  }

  return calendar
}

/**
 * スケジュール統計情報の計算
 */
function calculateScheduleStats(
  assignments: Array<{
    term: string
    dayOfWeek: number
    room: { id: string; name: string }
    student: { id: string; grade: number }
  }>
) {
  const stats = {
    totalAssignments: assignments.length,
    termBreakdown: {
      FIRST_TERM: 0,
      SECOND_TERM: 0,
    },
    dayBreakdown: {} as Record<number, number>,
    roomBreakdown: {} as Record<string, { name: string; count: number }>,
    gradeBreakdown: {} as Record<number, number>,
    uniqueStudents: new Set<string>(),
  }

  for (const assignment of assignments) {
    // 学期別
    if (assignment.term === 'FIRST_TERM' || assignment.term === 'SECOND_TERM') {
      stats.termBreakdown[assignment.term]++
    }

    // 曜日別
    stats.dayBreakdown[assignment.dayOfWeek] =
      (stats.dayBreakdown[assignment.dayOfWeek] || 0) + 1

    // 図書室別
    const roomId = assignment.room.id
    if (!stats.roomBreakdown[roomId]) {
      stats.roomBreakdown[roomId] = {
        name: assignment.room.name,
        count: 0,
      }
    }
    stats.roomBreakdown[roomId].count++

    // 学年別
    const grade = assignment.student.grade
    stats.gradeBreakdown[grade] = (stats.gradeBreakdown[grade] || 0) + 1

    // ユニーク学生数
    stats.uniqueStudents.add(assignment.student.id)
  }

  return {
    totalAssignments: stats.totalAssignments,
    uniqueStudents: stats.uniqueStudents.size,
    termBreakdown: stats.termBreakdown,
    dayBreakdown: stats.dayBreakdown,
    roomBreakdown: stats.roomBreakdown,
    gradeBreakdown: stats.gradeBreakdown,
  }
}
