import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
  createPaginationMeta,
} from '@/lib/api'
import {
  ClassesQuerySchema,
  CreateClassSchema,
  type ClassResponse,
} from '@/lib/schemas/class-schemas'

/**
 * GET /api/classes
 * クラス一覧取得（認証必須）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    await authenticate(request)

    // クエリパラメータの検証
    const { searchParams } = new URL(request.url)
    const params = ClassesQuerySchema.parse(Object.fromEntries(searchParams))

    // WHERE条件の構築
    const where = {
      ...(params.year && { year: params.year }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    }

    // データ取得（並列処理）
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          _count: {
            select: { students: { where: { isActive: true } } },
          },
        },
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.class.count({ where }),
    ])

    // レスポンス用データ変換
    const classesResponse: ClassResponse[] = classes.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      studentCount: c._count.students,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    // ページネーション情報の作成
    const pagination = createPaginationMeta(params.page, params.limit, total)

    return createSuccessResponse({
      classes: classesResponse,
      pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/classes
 * クラス作成（管理者権限必須）
 */
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // リクエストボディの検証
    const body = await request.json()
    const { name, year } = CreateClassSchema.parse(body)

    // 既存クラスの重複チェック
    const existingClass = await prisma.class.findFirst({
      where: { name, year },
    })

    if (existingClass) {
      return createErrorResponse(
        'CLASS_ALREADY_EXISTS',
        `${year}年${name}組は既に存在します`,
        409
      )
    }

    // 新規クラス作成
    const newClass = await prisma.class.create({
      data: { name, year },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    })

    // レスポンス用データ変換
    const classResponse: ClassResponse = {
      id: newClass.id,
      name: newClass.name,
      year: newClass.year,
      studentCount: newClass._count.students,
      createdAt: newClass.createdAt,
      updatedAt: newClass.updatedAt,
    }

    return createSuccessResponse(
      {
        class: classResponse,
        message: `${year}年${name}組を作成しました`,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
