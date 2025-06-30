import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
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
        return createErrorResponse(
          'CLASS_ALREADY_EXISTS',
          `${year}年${name}組は既に存在します`,
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

    // レスポンス用データ変換
    const classResponse: ClassResponse = {
      id: updatedClass.id,
      name: updatedClass.name,
      year: updatedClass.year,
      studentCount: updatedClass._count.students,
      createdAt: updatedClass.createdAt,
      updatedAt: updatedClass.updatedAt,
    }

    return createSuccessResponse({
      class: classResponse,
      message: `${updatedClass.year}年${updatedClass.name}組を更新しました`,
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

    return createSuccessResponse({
      message: `${existingClass.year}年${existingClass.name}組を削除しました`,
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
