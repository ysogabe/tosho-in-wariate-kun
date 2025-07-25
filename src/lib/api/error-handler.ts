import { NextResponse } from 'next/server'
import { z } from 'zod'

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}

/**
 * API共通エラーハンドラー
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zodバリデーションエラー
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラーが発生しました',
          details: error.errors,
        },
      } as ApiResponse,
      { status: 400 }
    )
  }

  // Prismaエラー（PrismaClientKnownRequestError）
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string }

    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ERROR',
              message: '重複するデータが存在します',
            },
          } as ApiResponse,
          { status: 409 }
        )
      case 'P2025':
        // Record not found
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: '指定されたデータが見つかりません',
            },
          } as ApiResponse,
          { status: 404 }
        )
      default:
        // その他のPrismaエラー
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'データベースエラーが発生しました',
            },
          } as ApiResponse,
          { status: 500 }
        )
    }
  }

  // 認証エラー
  if (error instanceof Error) {
    if (error.message === '認証が必要です') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        } as ApiResponse,
        { status: 401 }
      )
    }

    if (error.message === '管理者権限が必要です') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '管理者権限が必要です',
          },
        } as ApiResponse,
        { status: 403 }
      )
    }
  }

  // デフォルトのサーバーエラー
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    } as ApiResponse,
    { status: 500 }
  )
}

/**
 * 成功レスポンスの作成
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status }
  )
}

/**
 * エラーレスポンスの作成
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    } as ApiResponse,
    { status }
  )
}

/**
 * ページネーション情報の作成
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
