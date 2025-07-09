/**
 * 図書室一括操作APIエンドポイント
 * POST /api/rooms/bulk - 図書室一括操作（アクティブ化/非アクティブ化/削除）
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticate } from '@/lib/auth/helpers'

// 一括操作スキーマ
const BulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete'], {
    errorMap: () => ({
      message:
        '操作は activate, deactivate, delete のいずれかを指定してください',
    }),
  }),
  roomIds: z
    .array(z.string())
    .min(1, '少なくとも1つの図書室を選択してください')
    .max(100, '一度に操作できる図書室は100件までです'),
})

/**
 * 図書室一括操作
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    await authenticate(request)

    // リクエストボディの解析とバリデーション
    const body = await request.json()
    const validationResult = BulkOperationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力データが正しくありません',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { operation, roomIds } = validationResult.data

    // 指定された図書室の存在確認
    const existingRooms = await prisma.room.findMany({
      where: {
        id: { in: roomIds },
      },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    // 存在しない図書室がある場合はエラー
    if (existingRooms.length !== roomIds.length) {
      const foundIds = existingRooms.map((room) => room.id)
      const missingIds = roomIds.filter((id) => !foundIds.includes(id))

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SOME_ROOMS_NOT_FOUND',
            message: `一部の図書室が見つかりません: ${missingIds.join(', ')}`,
            details: { missingIds },
          },
        },
        { status: 404 }
      )
    }

    // 操作に応じた処理
    switch (operation) {
      case 'activate':
        return await handleActivateRooms(roomIds)

      case 'deactivate':
        return await handleDeactivateRooms(roomIds)

      case 'delete':
        return await handleDeleteRooms(existingRooms)

      default:
        // TypeScriptの網羅性チェックのためのfallback
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_OPERATION',
              message: '不正な操作です',
            },
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Bulk operation error:', error)
    return handleApiError(error)
  }
}

/**
 * 図書室一括アクティブ化
 */
async function handleActivateRooms(roomIds: string[]) {
  const result = await prisma.room.updateMany({
    where: {
      id: { in: roomIds },
    },
    data: {
      // MVPでは図書室は常にアクティブとして扱うため、実際の更新は不要
      // 将来的にisActiveフィールドが実装された際のプレースホルダー
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      updatedCount: result.count,
      message: `${result.count}件の図書室をアクティブ化しました`,
    },
  })
}

/**
 * 図書室一括非アクティブ化
 */
async function handleDeactivateRooms(roomIds: string[]) {
  const result = await prisma.room.updateMany({
    where: {
      id: { in: roomIds },
    },
    data: {
      // MVPでは図書室は常にアクティブとして扱うため、実際の更新は不要
      // 将来的にisActiveフィールドが実装された際のプレースホルダー
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      updatedCount: result.count,
      message: `${result.count}件の図書室を非アクティブ化しました`,
    },
  })
}

/**
 * 図書室一括削除
 */
async function handleDeleteRooms(
  rooms: Array<{ id: string; _count: { assignments: number } }>
) {
  // 割り当てのある図書室がないかチェック
  const roomsWithAssignments = rooms.filter(
    (room) => room._count.assignments > 0
  )

  if (roomsWithAssignments.length > 0) {
    const roomNames = roomsWithAssignments.map((room) => room.id).join(', ')

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ROOMS_HAVE_ASSIGNMENTS',
          message: `以下の図書室には当番の割り当てがあるため削除できません: ${roomNames}`,
          details: {
            roomsWithAssignments: roomsWithAssignments.map((room) => ({
              id: room.id,
              assignmentCount: room._count.assignments,
            })),
          },
        },
      },
      { status: 409 }
    )
  }

  // 削除処理
  const roomIds = rooms.map((room) => room.id)
  const result = await prisma.room.deleteMany({
    where: {
      id: { in: roomIds },
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      deletedCount: result.count,
      message: `${result.count}件の図書室を削除しました`,
    },
  })
}
