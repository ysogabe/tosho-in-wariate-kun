import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api'
import {
  StudentIdParamSchema,
  ScheduleQuerySchema,
} from '@/lib/schemas/student-schemas'

/**
 * 曜日名のマッピング定数
 */
const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'] as const

/**
 * GET /api/students/[id]/schedule
 * 図書委員の当番スケジュール取得（認証必須）
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    await authenticate(request)

    // パラメータの検証
    const params = await props.params
    const { id } = StudentIdParamSchema.parse(params)

    // クエリパラメータの検証
    const { searchParams } = new URL(request.url)
    const { term } = ScheduleQuerySchema.parse(Object.fromEntries(searchParams))

    // 図書委員の存在確認
    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!student) {
      return createErrorResponse(
        'STUDENT_NOT_FOUND',
        '指定された図書委員が見つかりません',
        404
      )
    }

    // 当番スケジュール取得
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: id,
        ...(term && { term }),
      },
      include: {
        room: {
          select: { name: true, capacity: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
    })

    // レスポンス用データ変換
    const scheduleData = assignments.map((assignment) => ({
      id: assignment.id,
      dayOfWeek: assignment.dayOfWeek,
      dayName: DAY_NAMES[assignment.dayOfWeek] || '不明',
      room: {
        name: assignment.room.name,
        capacity: assignment.room.capacity,
      },
      term: assignment.term,
      createdAt: assignment.createdAt,
    }))

    return createSuccessResponse({
      student: {
        id: student.id,
        name: student.name,
      },
      schedule: scheduleData,
      totalAssignments: scheduleData.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
