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
import {
  transformClassesToResponse,
  buildClassSearchWhere,
  buildDuplicateCheckWhere,
  createClassSuccessMessage,
  createClassDuplicateMessage,
  validatePaginationParams,
  calculateOffset,
  normalizeClassName,
  isValidClassName,
  isValidYear,
  transformClassToResponse,
} from '@/lib/services/class-service'

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

    // ページネーションバリデーション（サービス層）
    const paginationValidation = validatePaginationParams(params.page, params.limit)
    if (!paginationValidation.isValid) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        paginationValidation.errors.join(', '),
        400
      )
    }

    // WHERE条件の構築（サービス層）
    const where = buildClassSearchWhere({
      year: params.year,
      search: params.search,
    })

    // オフセット計算（サービス層）
    const offset = calculateOffset(params.page, params.limit)

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
        skip: offset,
        take: params.limit,
      }),
      prisma.class.count({ where }),
    ])

    // レスポンス用データ変換（サービス層）
    const classesResponse = transformClassesToResponse(classes)

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

    // 入力データの正規化と追加バリデーション（サービス層）
    const normalizedName = normalizeClassName(name)
    
    if (!isValidClassName(normalizedName)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'クラス名が無効です',
        400
      )
    }

    if (!isValidYear(year)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '年度は5年または6年である必要があります',
        400
      )
    }

    // 重複チェック条件生成（サービス層）
    const duplicateWhere = buildDuplicateCheckWhere(normalizedName, year)
    const existingClass = await prisma.class.findFirst({
      where: duplicateWhere,
    })

    if (existingClass) {
      // 重複エラーメッセージ生成（サービス層）
      const duplicateMessage = createClassDuplicateMessage(normalizedName, year)
      return createErrorResponse(
        'CLASS_ALREADY_EXISTS',
        duplicateMessage,
        409
      )
    }

    // 新規クラス作成
    const newClass = await prisma.class.create({
      data: { name: normalizedName, year },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    })

    // レスポンス用データ変換（サービス層）
    const classResponse = transformClassToResponse(newClass)

    // 成功メッセージ生成（サービス層）
    const successMessage = createClassSuccessMessage(normalizedName, year)

    return createSuccessResponse(
      {
        class: classResponse,
        message: successMessage,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
