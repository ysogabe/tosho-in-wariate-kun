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
    const { resetType, confirmPassword } = ResetRequestSchema.parse(body)

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

    const deletedCounts = {
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
