/**
 * @jest-environment node
 */

import { z } from 'zod'
import {
  handleApiError,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api/error-handler'

describe('API Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // console.errorをモック
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('handleApiError', () => {
    it('Zodバリデーションエラーを正しく処理する', async () => {
      const schema = z.object({
        name: z.string().min(1),
        year: z.number().min(5).max(6),
      })

      const zodError = schema.safeParse({ name: '', year: 4 }).error!

      const response = handleApiError(zodError)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラーが発生しました')
      expect(data.error.details).toBeDefined()
    })

    it('Prisma重複エラー（P2002）を正しく処理する', async () => {
      const prismaError = { code: 'P2002', message: 'Unique constraint failed' }

      const response = handleApiError(prismaError)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DUPLICATE_ERROR')
      expect(data.error.message).toBe('重複するデータが存在します')
    })

    it('Prisma NotFoundエラー（P2025）を正しく処理する', async () => {
      const prismaError = { code: 'P2025', message: 'Record not found' }

      const response = handleApiError(prismaError)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
      expect(data.error.message).toBe('指定されたデータが見つかりません')
    })

    it('その他のPrismaエラーを正しく処理する', async () => {
      const prismaError = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      }

      const response = handleApiError(prismaError)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
      expect(data.error.message).toBe('データベースエラーが発生しました')
    })

    it('認証エラーを正しく処理する', async () => {
      const authError = new Error('認証が必要です')

      const response = handleApiError(authError)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
      expect(data.error.message).toBe('認証が必要です')
    })

    it('権限エラーを正しく処理する', async () => {
      const authError = new Error('管理者権限が必要です')

      const response = handleApiError(authError)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
      expect(data.error.message).toBe('管理者権限が必要です')
    })

    it('未知のエラーをデフォルトのサーバーエラーとして処理する', async () => {
      const unknownError = new Error('Unknown error')

      const response = handleApiError(unknownError)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('サーバーエラーが発生しました')
    })

    it('nullやundefinedエラーを正しく処理する', async () => {
      const response1 = handleApiError(null)
      const data1 = await response1.json()

      expect(response1.status).toBe(500)
      expect(data1.success).toBe(false)
      expect(data1.error.code).toBe('INTERNAL_ERROR')

      const response2 = handleApiError(undefined)
      const data2 = await response2.json()

      expect(response2.status).toBe(500)
      expect(data2.success).toBe(false)
      expect(data2.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('createSuccessResponse', () => {
    it('成功レスポンスを正しく作成する', async () => {
      const data = { id: 'test', name: 'Test Class' }
      const response = createSuccessResponse(data)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(data)
    })

    it('カスタムステータスコードで成功レスポンスを作成する', async () => {
      const data = { id: 'new-test' }
      const response = createSuccessResponse(data, 201)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(data)
    })
  })

  describe('createErrorResponse', () => {
    it('エラーレスポンスを正しく作成する', async () => {
      const response = createErrorResponse('TEST_ERROR', 'テストエラー', 400)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('TEST_ERROR')
      expect(data.error.message).toBe('テストエラー')
    })

    it('詳細情報付きのエラーレスポンスを作成する', async () => {
      const details = { field: 'name', reason: 'required' }
      const response = createErrorResponse(
        'VALIDATION_ERROR',
        'バリデーションエラー',
        400,
        details
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラー')
      expect(data.error.details).toEqual(details)
    })

    it('デフォルトステータスコード400でエラーレスポンスを作成する', async () => {
      const response = createErrorResponse('DEFAULT_ERROR', 'デフォルトエラー')
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DEFAULT_ERROR')
      expect(data.error.message).toBe('デフォルトエラー')
    })
  })
})
