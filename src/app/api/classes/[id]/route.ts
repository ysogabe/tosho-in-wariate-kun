import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api'
import {
  UpdateClassSchema,
  ClassIdParamSchema,
  type ClassResponse,
} from '@/lib/schemas/class-schemas'
import {
  transformClassToResponse,
  createClassSuccessMessage,
  createClassDuplicateMessage,
  normalizeClassName,
  isValidClassName,
  isValidYear,
} from '@/lib/services/class-service'

/**
 * GET /api/classes/[id]
 * クラス詳細取得（認証必須）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    await authenticate(request)

    // パラメータの検証
    const { id } = ClassIdParamSchema.parse(await params)

    // クラスの取得
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    })

    if (!classData) {
      return createErrorResponse(
        'CLASS_NOT_FOUND',
        'クラスが見つかりません',
        404
      )
    }

    // レスポンス用データ変換（サービス層）
    const classResponse = transformClassToResponse(classData)

    return createSuccessResponse({
      class: classResponse,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/classes/[id]
 * クラス更新（管理者権限必須）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータの検証
    const { id } = ClassIdParamSchema.parse(await params)

    // リクエストボディの検証
    const body = await request.json()
    const updateData = UpdateClassSchema.parse(body)

    // データの正規化と追加バリデーション（サービス層）
    if (updateData.name) {
      const normalizedName = normalizeClassName(updateData.name)
      if (!isValidClassName(normalizedName)) {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'クラス名が無効です',
          400
        )
      }
      updateData.name = normalizedName
    }

    if (updateData.year && !isValidYear(updateData.year)) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        '年度は5年または6年である必要があります',
        400
      )
    }

    // 更新対象のクラスが存在するかチェック
    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return createErrorResponse(
        'CLASS_NOT_FOUND',
        'クラスが見つかりません',
        404
      )
    }

    // 名前と学年の組み合わせが重複しないかチェック（自分以外）
    if (updateData.name || updateData.year) {
      const duplicateClass = await prisma.class.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // 自分以外
            {
              name: updateData.name || existingClass.name,
              year: updateData.year || existingClass.year,
            },
          ],
        },
      })

      if (duplicateClass) {
        const year = updateData.year || existingClass.year
        const name = updateData.name || existingClass.name
        // 重複エラーメッセージ生成（サービス層）
        const duplicateMessage = createClassDuplicateMessage(name, year)
        return createErrorResponse(
          'CLASS_ALREADY_EXISTS',
          duplicateMessage,
          409
        )
      }
    }

    // クラスの更新
    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    })

    // レスポンス用データ変換（サービス層）
    const classResponse = transformClassToResponse(updatedClass)

    // 成功メッセージ生成（サービス層）
    const successMessage = createClassSuccessMessage(updatedClass.name, updatedClass.year)
    const updateMessage = successMessage.replace('を作成しました', 'を更新しました')

    return createSuccessResponse({
      class: classResponse,
      message: updateMessage,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/classes/[id]
 * クラス削除（管理者権限必須）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    await authenticateAdmin(request)

    // パラメータの検証
    const { id } = ClassIdParamSchema.parse(await params)

    // 削除対象のクラスが存在するかチェック
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } },
        },
      },
    })

    if (!existingClass) {
      return createErrorResponse(
        'CLASS_NOT_FOUND',
        'クラスが見つかりません',
        404
      )
    }

    // アクティブな図書委員が存在する場合は削除を拒否
    if (existingClass._count.students > 0) {
      return createErrorResponse(
        'CLASS_HAS_STUDENTS',
        `このクラスには${existingClass._count.students}名の図書委員が登録されているため削除できません`,
        409
      )
    }

    // クラスの削除
    await prisma.class.delete({
      where: { id },
    })

    // 成功メッセージ生成（サービス層）
    const successMessage = createClassSuccessMessage(existingClass.name, existingClass.year)
    const deleteMessage = successMessage.replace('を作成しました', 'を削除しました')

    return createSuccessResponse({
      message: deleteMessage,
      deletedClass: {
        id: existingClass.id,
        name: existingClass.name,
        year: existingClass.year,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
