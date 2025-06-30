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
  StudentsQuerySchema,
  CreateStudentSchema,
} from '@/lib/schemas/student-schemas'
import {
  transformStudentsToResponse,
  buildStudentSearchWhere,
  buildStudentDuplicateCheckWhere,
  createStudentSuccessMessage,
  createStudentDuplicateMessage,
  validatePaginationParams,
  calculateOffset,
  normalizeStudentName,
  isValidStudentName,
  isValidGrade,
} from '@/lib/services/student-service'

/**
 * GET /api/students
 * 図書委員一覧取得（認証必須）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    await authenticate(request)

    // クエリパラメータの検証
    const { searchParams } = new URL(request.url)
    const params = StudentsQuerySchema.parse(Object.fromEntries(searchParams))

    // ページネーションバリデーション（サービス層）
    const paginationValidation = validatePaginationParams(
      params.page,
      params.limit
    )
    if (!paginationValidation.isValid) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        paginationValidation.errors.join(', '),
        400
      )
    }

    // WHERE条件の構築（サービス層）
    const where = buildStudentSearchWhere({
      search: params.search,
      classId: params.classId,
      grade: params.grade,
      isActive: params.isActive,
    })

    // オフセット計算（サービス層）
    const offset = calculateOffset(params.page, params.limit)

    // データ取得（並列処理）
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: {
            select: { id: true, name: true, year: true },
          },
          _count: {
            select: { assignments: true },
          },
        },
        orderBy: [
          { grade: 'asc' },
          { class: { name: 'asc' } },
          { name: 'asc' },
        ],
        skip: offset,
        take: params.limit,
      }),
      prisma.student.count({ where }),
    ])

    // レスポンス用データ変換（サービス層）
    const studentsResponse = transformStudentsToResponse(students)

    // ページネーション情報の作成
    const pagination = createPaginationMeta(params.page, params.limit, total)

    return createSuccessResponse({
      students: studentsResponse,
      pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/students
 * 図書委員作成（管理者権限必須）
 */
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // リクエストボディの検証
    const body = await request.json()
    const { name, classId, grade } = CreateStudentSchema.parse(body)

    // 入力データの正規化と追加バリデーション（サービス層）
    const normalizedName = normalizeStudentName(name)

    if (!isValidStudentName(normalizedName)) {
      return createErrorResponse('VALIDATION_ERROR', '名前が無効です', 400)
    }

    if (!isValidGrade(grade)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '学年は5年または6年である必要があります',
        400
      )
    }

    // クラスの存在確認
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, year: true },
    })

    if (!classData) {
      return createErrorResponse(
        'CLASS_NOT_FOUND',
        '指定されたクラスが見つかりません',
        400
      )
    }

    // 重複チェック条件生成（サービス層）
    const duplicateWhere = buildStudentDuplicateCheckWhere(
      normalizedName,
      classId
    )
    const existingStudent = await prisma.student.findFirst({
      where: duplicateWhere,
    })

    if (existingStudent) {
      // 重複エラーメッセージ生成（サービス層）
      const duplicateMessage = createStudentDuplicateMessage(
        normalizedName,
        classData.name,
        classData.year
      )
      return createErrorResponse(
        'STUDENT_ALREADY_EXISTS',
        duplicateMessage,
        409
      )
    }

    // 新規図書委員作成
    const newStudent = await prisma.student.create({
      data: { name: normalizedName, classId, grade },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    // レスポンス用データ変換（サービス層）
    const studentResponse = transformStudentsToResponse([newStudent])[0]

    // 成功メッセージ生成（サービス層）
    const successMessage = createStudentSuccessMessage(
      normalizedName,
      classData.name,
      classData.year
    )

    return createSuccessResponse(
      {
        student: studentResponse,
        message: successMessage,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
