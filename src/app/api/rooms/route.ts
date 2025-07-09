/**
 * 図書室管理APIエンドポイント
 * GET /api/rooms - 図書室一覧取得
 * POST /api/rooms - 図書室作成
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  createPaginationMeta,
} from '@/lib/api'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'

// 図書室作成スキーマ
const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(1, '図書室名は必須です')
    .max(50, '図書室名は50文字以内で入力してください'),
  capacity: z
    .number()
    .int()
    .min(1, '収容人数は1人以上を指定してください')
    .max(100, '収容人数は100人以下を指定してください'),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .optional(),
})

// クエリパラメータスキーマ
const RoomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
})

/**
 * 図書室一覧取得
 */
export async function GET(req: NextRequest) {
  try {
    // 認証チェック（開発環境では一時的にスキップ）
    if (process.env.NODE_ENV !== 'development') {
      await authenticate(req)
    }

    // クエリパラメータの解析
    const { searchParams } = new URL(req.url)
    const queryResult = RoomsQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
    })

    if (!queryResult.success) {
      console.error('Rooms API validation error:', queryResult.error)
      return createErrorResponse(
        'VALIDATION_ERROR',
        `パラメータが正しくありません: ${queryResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        400
      )
    }

    const { page, limit, search } = queryResult.data
    const offset = (page - 1) * limit

    // 検索条件の構築
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // 図書室一覧の取得（集計データ付き）
    const [rooms, totalCount] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
        orderBy: [{ name: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.room.count({ where }),
    ])

    // データ変換
    const roomsData = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      description: room.description,
      isActive: true, // MVP: 全ての図書室をアクティブとして扱う
      classCount: room._count.assignments,
      utilizationRate: Math.round(
        (room._count.assignments / Math.max(room.capacity / 10, 1)) * 100
      ), // 概算利用率
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    }))

    // ページネーション情報の作成
    const pagination = createPaginationMeta(page, limit, totalCount)

    return createSuccessResponse({
      rooms: roomsData,
      pagination,
    })
  } catch (error) {
    console.error('Rooms fetch error:', error)
    return handleApiError(error)
  }
}

/**
 * 図書室作成
 */
export async function POST(req: NextRequest) {
  try {
    // 管理者権限チェック（開発環境では一時的にスキップ）
    if (process.env.NODE_ENV !== 'development') {
      await authenticateAdmin(req)
    }

    // リクエストボディの解析
    const body = await req.json()
    const validationResult = CreateRoomSchema.safeParse(body)

    if (!validationResult.success) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '入力データが正しくありません',
        400
      )
    }

    const { name, capacity, description } = validationResult.data

    // 重複チェック
    const existingRoom = await prisma.room.findFirst({
      where: { name },
    })

    if (existingRoom) {
      return createErrorResponse(
        'ROOM_ALREADY_EXISTS',
        '同じ名前の図書室が既に存在します',
        409
      )
    }

    // 図書室作成
    const room = await prisma.room.create({
      data: {
        name,
        capacity,
        description,
      },
    })

    return createSuccessResponse(
      {
        room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          description: room.description,
          isActive: true,
          classCount: 0,
          utilizationRate: 0,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
        message: '図書室を作成しました',
      },
      201
    )
  } catch (error) {
    console.error('Room creation error:', error)
    return handleApiError(error)
  }
}
