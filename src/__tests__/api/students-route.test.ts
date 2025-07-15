/**
 * @jest-environment node
 */

/**
 * /api/students ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/students/route'
import { prisma } from '@/lib/database/client'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    student: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
    },
  },
}))

// 認証ヘルパーをモック
jest.mock('@/lib/auth/helpers', () => ({
  authenticate: jest.fn(),
  authenticateAdmin: jest.fn(),
}))

// NextAuthをモック
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/students Route Tests', () => {
  const mockPrisma = jest.mocked(prisma)

  beforeEach(() => {
    jest.clearAllMocks()

    // デフォルトの認証モック
    const mockAuthenticate = jest.mocked(authenticate)
    const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)
    mockAuthenticate.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      confirmation_sent_at: null,
      confirmed_at: '2024-01-01T00:00:00Z',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      invited_at: null,
      last_sign_in_at: '2024-01-01T00:00:00Z',
      phone: null,
      phone_confirmed_at: null,
      recovery_sent_at: null,
    })
    mockAuthenticateAdmin.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      confirmation_sent_at: null,
      confirmed_at: '2024-01-01T00:00:00Z',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      invited_at: null,
      last_sign_in_at: '2024-01-01T00:00:00Z',
      phone: null,
      phone_confirmed_at: null,
      recovery_sent_at: null,
    })
  })

  describe('GET /api/students', () => {
    it('図書委員一覧を正常に取得できる', async () => {
      const mockStudents = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: '田中太郎',
          classId: '22222222-2222-2222-2222-222222222222',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { assignments: 2 },
          class: {
            id: '22222222-2222-2222-2222-222222222222',
            name: '1組',
            year: 5,
          },
        },
      ]

      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.student.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/students')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.students).toHaveLength(1)
      expect(data.data.students[0].name).toBe('田中太郎')
      expect(data.data.pagination.total).toBe(1)
    })

    it('検索パラメータで図書委員を絞り込める', async () => {
      const mockStudents = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: '田中太郎',
          classId: '22222222-2222-2222-2222-222222222222',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { assignments: 2 },
          class: {
            id: '22222222-2222-2222-2222-222222222222',
            name: '1組',
            year: 5,
          },
        },
      ]

      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.student.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost/api/students?search=田中&grade=5'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            grade: 5,
            name: { contains: '田中', mode: 'insensitive' },
          }),
        })
      )
    })

    it('認証されていない場合は401を返す', async () => {
      const mockAuthenticate = jest.mocked(authenticate)
      mockAuthenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost/api/students')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('無効なページネーションパラメータは400を返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/students?page=0&limit=101'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/students', () => {
    it('図書委員を正常に作成できる', async () => {
      const mockClass = {
        id: '22222222-2222-2222-2222-222222222222',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockCreatedStudent = {
        id: 'student-1',
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { assignments: 0 },
        class: mockClass,
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.student.findFirst.mockResolvedValue(null)
      mockPrisma.student.create.mockResolvedValue(mockCreatedStudent)

      const requestBody = {
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.student.name).toBe('田中太郎')
      expect(data.data.message).toBe(
        '5年1組の田中太郎さんを図書委員として登録しました'
      )
    })

    it('存在しないクラスIDの場合は400を返す', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null)

      const requestBody = {
        name: '田中太郎',
        classId: '99999999-9999-9999-9999-999999999999',
        grade: 5,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('CLASS_NOT_FOUND')
      expect(data.error.message).toBe('指定されたクラスが見つかりません')
    })

    it('重複する図書委員の作成は409を返す', async () => {
      const mockClass = {
        id: '22222222-2222-2222-2222-222222222222',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockExistingStudent = {
        id: '33333333-3333-3333-3333-333333333333',
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)
      mockPrisma.student.findFirst.mockResolvedValue(mockExistingStudent)

      const requestBody = {
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error.code).toBe('STUDENT_ALREADY_EXISTS')
      expect(data.error.message).toBe(
        '5年1組には既に田中太郎さんが図書委員として登録されています'
      )
    })

    it('無効な名前の場合は400を返す', async () => {
      const mockClass = {
        id: '22222222-2222-2222-2222-222222222222',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)

      const requestBody = {
        name: '',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラーが発生しました')
    })

    it('無効な学年の場合は400を返す', async () => {
      const mockClass = {
        id: '22222222-2222-2222-2222-222222222222',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)

      const requestBody = {
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 4,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toBe('バリデーションエラーが発生しました')
    })

    it('管理者権限がない場合は401を返す', async () => {
      const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)
      mockAuthenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const requestBody = {
        name: '田中太郎',
        classId: '22222222-2222-2222-2222-222222222222',
        grade: 5,
        isActive: true,
      }

      const request = new NextRequest('http://localhost/api/students', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })
  })
})
