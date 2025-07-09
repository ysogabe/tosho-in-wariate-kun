import { NextRequest } from 'next/server'
import { POST } from '../route'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticateAdmin: jest.fn(),
}))

const mockPrisma = jest.mocked(prisma)
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>

describe('/api/system/reset', () => {
  let request: NextRequest
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    ;(process.env as any).ADMIN_RESET_PASSWORD = 'test123'
    
    // Mock console.error to prevent test output pollution
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    delete (process.env as any).ADMIN_RESET_PASSWORD
    consoleErrorSpy.mockRestore()
  })

  describe('POST /api/system/reset', () => {
    it('管理者が認証されていない場合、エラーを返す', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('Unauthorized'))

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('データリセットに失敗しました')
    })

    it('不正なリクエストボディの場合、バリデーションエラーを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'invalid',
          confirmPassword: '',
          confirm: false,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラーが発生しました')
      expect(data.error.details).toBeDefined()
    })

    it('パスワードが間違っている場合、認証エラーを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'wrong',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_PASSWORD')
      expect(data.error.message).toBe('管理者パスワードが正しくありません')
    })

    it('当番表のみのリセットが正常に実行される', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          assignment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 50 }),
          },
        }
        return callback(mockTx)
      })

      mockPrisma.$transaction.mockImplementation(mockTransaction)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('当番表データのリセットを実行しました')
      expect(data.data.deletedCounts.assignments).toBe(50)
      expect(data.data.deletedCounts.students).toBe(0)
      expect(data.data.deletedCounts.classes).toBe(0)
      expect(data.data.deletedCounts.rooms).toBe(0)
    })

    it('図書委員と当番表のリセットが正常に実行される', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          assignment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 100 }),
          },
          student: {
            deleteMany: jest.fn().mockResolvedValue({ count: 25 }),
          },
        }
        return callback(mockTx)
      })

      mockPrisma.$transaction.mockImplementation(mockTransaction)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'students',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('図書委員データのリセットを実行しました')
      expect(data.data.deletedCounts.assignments).toBe(100)
      expect(data.data.deletedCounts.students).toBe(25)
    })

    it('全データのリセットが正常に実行される', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          assignment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 200 }),
          },
          student: {
            deleteMany: jest.fn().mockResolvedValue({ count: 50 }),
          },
          class: {
            deleteMany: jest.fn().mockResolvedValue({ count: 10 }),
          },
          room: {
            deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
          },
        }
        return callback(mockTx)
      })

      mockPrisma.$transaction.mockImplementation(mockTransaction)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'all',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('全データのリセットを実行しました')
      expect(data.data.deletedCounts.assignments).toBe(200)
      expect(data.data.deletedCounts.students).toBe(50)
      expect(data.data.deletedCounts.classes).toBe(10)
      expect(data.data.deletedCounts.rooms).toBe(3)
    })

    it('トランザクションエラーが発生した場合、エラーレスポンスを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('データリセットに失敗しました')
    })

    it('環境変数にパスワードが設定されていない場合、デフォルトパスワードを使用する', async () => {
      delete (process.env as any).ADMIN_RESET_PASSWORD
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          assignment: {
            deleteMany: jest.fn().mockResolvedValue({ count: 10 }),
          },
        }
        return callback(mockTx)
      })

      mockPrisma.$transaction.mockImplementation(mockTransaction)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'reset123', // Default password
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('confirm フラグが false の場合、バリデーションエラーを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'test123',
          confirm: false,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.details).toContainEqual(
        expect.objectContaining({
          path: ['confirm'],
          message: '確認が必要です',
        })
      )
    })

    it('リセットタイプが無効な場合、バリデーションエラーを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      request = new NextRequest('http://localhost:3000/api/system/reset', {
        method: 'POST',
        body: JSON.stringify({
          resetType: 'invalid_type',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.details).toContainEqual(
        expect.objectContaining({
          path: ['resetType'],
        })
      )
    })
  })
})