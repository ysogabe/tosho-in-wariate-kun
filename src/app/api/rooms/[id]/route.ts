/**
 * 図書室個別管理APIエンドポイント
 * GET /api/rooms/[id] - 図書室詳細取得
 * PUT /api/rooms/[id] - 図書室情報更新
 * DELETE /api/rooms/[id] - 図書室削除
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database/client'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'
import { updateRoomSchema } from '@/lib/schemas/room-schemas'

/**
 * 図書室詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    await authenticate(request)

    // パラメータ取得
    const resolvedParams = await params
    const { id } = resolvedParams

    // 図書室詳細の取得（利用情報付き）
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    if (!room) {
      return createErrorResponse(
        'ROOM_NOT_FOUND',
        '図書室が見つかりません',
        404
      )
    }

    // データ変換
    const roomData = {
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      description: room.description,
      isActive: true, // MVP: 全ての図書室をアクティブとして扱う
      classCount: room._count.assignments,
      utilizationRate: Math.round(
        (room._count.assignments / Math.max(room.capacity / 10, 1)) * 100
      ),
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    }

    return createSuccessResponse({
      room: roomData,
    })
  } catch (error) {
    console.error('Room fetch error:', error)
    return handleApiError(error)
  }
}

/**
 * 図書室情報更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータ取得
    const resolvedParams = await params
    const { id } = resolvedParams

    // リクエストボディの解析とバリデーション
    const body = await request.json()
    const validationResult = updateRoomSchema.safeParse(body)

    if (!validationResult.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '入力データが正しくありません',
        400
      )
    }

    // 図書室の存在確認
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    })

    if (!existingRoom) {
      return createErrorResponse(
        'ROOM_NOT_FOUND',
        '図書室が見つかりません',
        404
      )
    }

    // 図書室名の重複チェック（自分以外）
    if (validationResult.data.name) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          name: validationResult.data.name,
          id: { not: id },
        },
      })

      if (duplicateRoom) {
        return createErrorResponse(
          'ROOM_ALREADY_EXISTS',
          '同じ名前の図書室が既に存在します',
          409
        )
      }
    }

    // 図書室情報更新
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: validationResult.data,
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    // データ変換
    const roomData = {
      id: updatedRoom.id,
      name: updatedRoom.name,
      capacity: updatedRoom.capacity,
      description: updatedRoom.description,
      isActive: true,
      classCount: updatedRoom._count.assignments,
      utilizationRate: Math.round(
        (updatedRoom._count.assignments /
          Math.max(updatedRoom.capacity / 10, 1)) *
          100
      ),
      createdAt: updatedRoom.createdAt.toISOString(),
      updatedAt: updatedRoom.updatedAt.toISOString(),
    }

    return createSuccessResponse({
      room: roomData,
      message: '図書室情報が更新されました',
    })
  } catch (error) {
    console.error('Room update error:', error)
    return handleApiError(error)
  }
}

/**
 * 図書室削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータ取得
    const resolvedParams = await params
    const { id } = resolvedParams

    // 図書室の存在確認と利用状況チェック
    const existingRoom = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    if (!existingRoom) {
      return createErrorResponse(
        'ROOM_NOT_FOUND',
        '図書室が見つかりません',
        404
      )
    }

    // 割り当てがある場合は削除不可
    if (existingRoom._count.assignments > 0) {
      return createErrorResponse(
        'ROOM_HAS_ASSIGNMENTS',
        'この図書室には当番の割り当てがあるため削除できません',
        409
      )
    }

    // 図書室削除
    await prisma.room.delete({
      where: { id },
    })

    return createSuccessResponse({
      message: '図書室が削除されました',
    })
  } catch (error) {
    console.error('Room deletion error:', error)
    return handleApiError(error)
  }
}
