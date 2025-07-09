/**
 * スケジュールリセットAPIエンドポイント
 * DELETE /api/schedules/reset
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticateAdmin } from '@/lib/auth/helpers'

// リクエストスキーマ
const ResetScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM', 'ALL'], {
    required_error: '削除対象の学期は必須です',
    invalid_type_error:
      '学期は FIRST_TERM、SECOND_TERM、または ALL を指定してください',
  }),
  confirmDelete: z
    .boolean({
      required_error: '削除確認フラグは必須です',
      invalid_type_error: '削除確認フラグはブール値である必要があります',
    })
    .refine((val) => val === true, {
      message: '削除を実行するには確認が必要です',
    }),
})

/**
 * スケジュールリセット（削除）
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // 管理者認証（重要な操作のため管理者権限が必要）
    await authenticateAdmin(request)

    // リクエストボディの解析と検証
    const body = await request.json()
    const { term, confirmDelete } = ResetScheduleSchema.parse(body)

    console.log(`スケジュールリセット要求: ${term}, 確認: ${confirmDelete}`)

    // 削除条件の設定
    const whereCondition = term === 'ALL' ? {} : { term }

    // 削除前にカウント取得（ログ用）
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

    // 削除対象の詳細情報を取得（ログ用）
    const assignmentsToDelete = await prisma.assignment.findMany({
      where: whereCondition,
      include: {
        student: {
          select: { name: true, grade: true },
        },
        room: {
          select: { name: true },
        },
      },
    })

    // トランザクションで削除実行
    const result = await prisma.$transaction(async (tx) => {
      const deletedAssignments = await tx.assignment.deleteMany({
        where: whereCondition,
      })

      return deletedAssignments
    })

    // 削除結果のログ出力
    console.log(`スケジュールリセット完了: ${result.count}件削除`, {
      term,
      deletedCount: result.count,
      deletedAssignments: assignmentsToDelete.map((a) => ({
        student: a.student.name,
        room: a.room.name,
        dayOfWeek: a.dayOfWeek,
        term: a.term,
      })),
    })

    const termName = getTermName(term)

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
        term,
        termName,
        message: `${termName}のスケジュール（${result.count}件）を削除しました`,
        summary: generateDeletionSummary(assignmentsToDelete),
      },
    })
  } catch (error) {
    console.error('Schedule reset API error:', error)
    return handleApiError(error)
  }
}

/**
 * 学期名を取得
 */
function getTermName(term: string): string {
  switch (term) {
    case 'FIRST_TERM':
      return '前期'
    case 'SECOND_TERM':
      return '後期'
    case 'ALL':
      return '全期間'
    default:
      return '不明'
  }
}

/**
 * 削除サマリーを生成
 */
function generateDeletionSummary(deletedAssignments: any[]) {
  const summary = {
    totalDeleted: deletedAssignments.length,
    byTerm: {} as Record<string, number>,
    byDay: {} as Record<number, number>,
    byGrade: {} as Record<number, number>,
    byRoom: {} as Record<string, number>,
    affectedStudents: new Set<string>(),
  }

  deletedAssignments.forEach((assignment) => {
    // 学期別
    const term = assignment.term
    summary.byTerm[term] = (summary.byTerm[term] || 0) + 1

    // 曜日別
    const day = assignment.dayOfWeek
    summary.byDay[day] = (summary.byDay[day] || 0) + 1

    // 学年別
    const grade = assignment.student.grade
    summary.byGrade[grade] = (summary.byGrade[grade] || 0) + 1

    // 図書室別
    const roomName = assignment.room.name
    summary.byRoom[roomName] = (summary.byRoom[roomName] || 0) + 1

    // 影響を受ける学生
    summary.affectedStudents.add(assignment.student.name)
  })

  return {
    totalDeleted: summary.totalDeleted,
    affectedStudentsCount: summary.affectedStudents.size,
    byTerm: summary.byTerm,
    byDay: summary.byDay,
    byGrade: summary.byGrade,
    byRoom: summary.byRoom,
  }
}
