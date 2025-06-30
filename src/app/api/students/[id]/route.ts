import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api'
import {
  StudentIdParamSchema,
  UpdateStudentSchema,
} from '@/lib/schemas/student-schemas'
import {
  transformStudentToResponse,
  buildStudentDuplicateCheckWhere,
  createStudentUpdateMessage,
  createStudentDeleteMessage,
  createStudentDuplicateMessage,
  normalizeStudentName,
  isValidStudentName,
  isValidGrade,
  canDeleteStudent,
} from '@/lib/services/student-service'

/**
 * GET /api/students/[id]
 * 図書委員詳細取得（認証必須）
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

    // 図書委員データ取得
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    if (!student) {
      return createErrorResponse(
        'STUDENT_NOT_FOUND',
        '指定された図書委員が見つかりません',
        404
      )
    }

    // レスポンス用データ変換（サービス層）
    const studentResponse = transformStudentToResponse(student)

    return createSuccessResponse({
      student: studentResponse,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/students/[id]
 * 図書委員更新（管理者権限必須）
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータの検証
    const params = await props.params
    const { id } = StudentIdParamSchema.parse(params)

    // リクエストボディの検証
    const body = await request.json()
    const updateData = UpdateStudentSchema.parse(body)

    // 入力データの正規化と追加バリデーション（サービス層）
    if (updateData.name !== undefined) {
      const normalizedName = normalizeStudentName(updateData.name)

      if (!isValidStudentName(normalizedName)) {
        return createErrorResponse('VALIDATION_ERROR', '名前が無効です', 400)
      }

      updateData.name = normalizedName
    }

    if (updateData.grade !== undefined && !isValidGrade(updateData.grade)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '学年は5年または6年である必要があります',
        400
      )
    }

    // 既存の図書委員データ取得
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
      },
    })

    if (!existingStudent) {
      return createErrorResponse(
        'STUDENT_NOT_FOUND',
        '指定された図書委員が見つかりません',
        404
      )
    }

    // クラス変更時の存在確認
    let classData = existingStudent.class
    if (updateData.classId && updateData.classId !== existingStudent.classId) {
      const newClass = await prisma.class.findUnique({
        where: { id: updateData.classId },
        select: { id: true, name: true, year: true },
      })

      if (!newClass) {
        return createErrorResponse(
          'CLASS_NOT_FOUND',
          '指定されたクラスが見つかりません',
          400
        )
      }

      classData = newClass
    }

    // 重複チェック（名前またはクラスが変更される場合）
    if (updateData.name || updateData.classId) {
      const checkName = updateData.name || existingStudent.name
      const checkClassId = updateData.classId || existingStudent.classId

      const duplicateWhere = buildStudentDuplicateCheckWhere(
        checkName,
        checkClassId
      )
      const duplicateStudent = await prisma.student.findFirst({
        where: {
          ...duplicateWhere,
          NOT: { id }, // 自分自身は除外
        },
      })

      if (duplicateStudent) {
        const duplicateMessage = createStudentDuplicateMessage(
          checkName,
          classData?.name || '不明なクラス',
          classData?.year || 0
        )
        return createErrorResponse(
          'STUDENT_ALREADY_EXISTS',
          duplicateMessage,
          409
        )
      }
    }

    // 図書委員データ更新
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData,
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
    const studentResponse = transformStudentToResponse(updatedStudent)

    // 成功メッセージ生成（サービス層）
    const successMessage = createStudentUpdateMessage(
      updatedStudent.name,
      updatedStudent.class?.name || '不明なクラス',
      updatedStudent.class?.year || 0
    )

    return createSuccessResponse({
      student: studentResponse,
      message: successMessage,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/students/[id]
 * 図書委員削除（管理者権限必須）
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータの検証
    const params = await props.params
    const { id } = StudentIdParamSchema.parse(params)

    // 既存の図書委員データ取得
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    if (!existingStudent) {
      return createErrorResponse(
        'STUDENT_NOT_FOUND',
        '指定された図書委員が見つかりません',
        404
      )
    }

    // 削除可否チェック（サービス層）
    const deleteCheck = canDeleteStudent(existingStudent._count.assignments)
    if (!deleteCheck.canDelete) {
      return createErrorResponse(
        'STUDENT_CANNOT_DELETE',
        deleteCheck.reason!,
        400
      )
    }

    // 図書委員削除
    await prisma.student.delete({
      where: { id },
    })

    // 成功メッセージ生成（サービス層）
    const successMessage = createStudentDeleteMessage(
      existingStudent.name,
      existingStudent.class?.name || '不明なクラス',
      existingStudent.class?.year || 0
    )

    return createSuccessResponse({
      message: successMessage,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
