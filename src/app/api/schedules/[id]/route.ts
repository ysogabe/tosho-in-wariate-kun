/**
 * スケジュール個別更新APIエンドポイント
 * PUT /api/schedules/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticateAdmin } from '@/lib/auth/helpers'

// パラメータスキーマ
const IdParamSchema = z.string().uuid({
  message: 'スケジュールIDは有効なUUID形式である必要があります',
})

// 更新リクエストスキーマ
const UpdateAssignmentSchema = z.object({
  studentId: z.string().uuid({
    message: '学生IDは有効なUUID形式である必要があります',
  }),
  roomId: z.string().uuid({
    message: '図書室IDは有効なUUID形式である必要があります',
  }),
  dayOfWeek: z.number().int().min(1).max(5, {
    message: '曜日は1（月）から5（金）の範囲で指定してください',
  }),
  term: z.enum(['FIRST_TERM', 'SECOND_TERM'], {
    required_error: '学期は必須です',
    invalid_type_error:
      '学期は FIRST_TERM または SECOND_TERM を指定してください',
  }),
})

/**
 * スケジュール個別更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 管理者認証（重要な操作のため管理者権限が必要）
    await authenticateAdmin(request)

    // パラメータ検証
    const resolvedParams = await params
    const id = IdParamSchema.parse(resolvedParams.id)

    // リクエストボディの解析と検証
    const body = await request.json()
    const { studentId, roomId, dayOfWeek, term } =
      UpdateAssignmentSchema.parse(body)

    console.log(`スケジュール更新要求: ${id}`, {
      studentId,
      roomId,
      dayOfWeek,
      term,
    })

    // 既存のスケジュールを確認
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        room: true,
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: '指定されたスケジュールが見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // 更新対象の学生が存在するかチェック
    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
      },
    })

    if (!targetStudent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: '指定された学生が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // 更新対象の図書室が存在するかチェック
    const targetRoom = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!targetRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: '指定された図書室が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // 同じ学期・曜日・図書室での重複チェック
    const duplicateAssignment = await prisma.assignment.findFirst({
      where: {
        id: { not: id }, // 自分以外
        studentId,
        roomId,
        dayOfWeek,
        term,
      },
    })

    if (duplicateAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ASSIGNMENT',
            message:
              '同じ学期・曜日・図書室に既に同じ学生が割り当てられています',
          },
        },
        { status: 409 }
      )
    }

    // 図書室の定員チェック
    const sameTimeSlotAssignments = await prisma.assignment.count({
      where: {
        id: { not: id }, // 自分以外
        roomId,
        dayOfWeek,
        term,
      },
    })

    if (sameTimeSlotAssignments >= targetRoom.capacity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_CAPACITY_EXCEEDED',
            message: `図書室「${targetRoom.name}」の定員（${targetRoom.capacity}名）を超過します`,
          },
        },
        { status: 409 }
      )
    }

    // トランザクションで更新実行
    const updatedAssignment = await prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: {
          studentId,
          roomId,
          dayOfWeek,
          term,
        },
        include: {
          student: {
            include: {
              class: true,
            },
          },
          room: true,
        },
      })

      return updated
    })

    // 更新結果のログ出力
    console.log(`スケジュール更新完了: ${id}`, {
      before: {
        student: existingAssignment.student.name,
        room: existingAssignment.room.name,
        dayOfWeek: existingAssignment.dayOfWeek,
        term: existingAssignment.term,
      },
      after: {
        student: updatedAssignment.student.name,
        room: updatedAssignment.room.name,
        dayOfWeek: updatedAssignment.dayOfWeek,
        term: updatedAssignment.term,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          id: updatedAssignment.id,
          dayOfWeek: updatedAssignment.dayOfWeek,
          dayName: getDayName(updatedAssignment.dayOfWeek),
          term: updatedAssignment.term,
          termName: updatedAssignment.term === 'FIRST_TERM' ? '前期' : '後期',
          room: {
            id: updatedAssignment.room.id,
            name: updatedAssignment.room.name,
            capacity: updatedAssignment.room.capacity,
          },
          student: {
            id: updatedAssignment.student.id,
            name: updatedAssignment.student.name,
            grade: updatedAssignment.student.grade,
            class: {
              id: updatedAssignment.student.class.id,
              name: updatedAssignment.student.class.name,
              year: updatedAssignment.student.class.year,
              fullName: `${updatedAssignment.student.class.year}年${updatedAssignment.student.class.name}組`,
            },
          },
          updatedAt: updatedAssignment.updatedAt,
        },
        message: 'スケジュールを更新しました',
        changes: {
          studentChanged:
            existingAssignment.studentId !== updatedAssignment.studentId,
          roomChanged: existingAssignment.roomId !== updatedAssignment.roomId,
          dayChanged:
            existingAssignment.dayOfWeek !== updatedAssignment.dayOfWeek,
          termChanged: existingAssignment.term !== updatedAssignment.term,
        },
      },
    })
  } catch (error) {
    console.error('Schedule update API error:', error)
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
