/**
 * @jest-environment node
 */

/**
 * /api/students/[id]/schedule ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/students/[id]/schedule/route'
import { prisma } from '@/lib/database/client'
import { authenticate } from '@/lib/auth/helpers'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
  },
}))

// 認証ヘルパーをモック
jest.mock('@/lib/auth/helpers', () => ({
  authenticate: jest.fn(),
}))

// NextAuthをモック
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/students/[id]/schedule Route Tests', () => {
  const mockPrisma = jest.mocked(prisma)

  beforeEach(() => {
    jest.clearAllMocks()

    // デフォルトの認証モック
    const mockAuthenticate = jest.mocked(authenticate)
    mockAuthenticate.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'student',
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

  describe('GET /api/students/[id]/schedule', () => {
    it('図書委員のスケジュールを正常に取得できる', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockAssignments = [
        {
          id: 'ffb7eb73-5128-4a50-986a-438c20b6f274',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 1,
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          room: {
            name: '図書室',
            capacity: 2,
          },
        },
        {
          id: 'e1875134-697b-47dd-bd1d-24068f4af4c6',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 3,
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          room: {
            name: '図書室',
            capacity: 2,
          },
        },
      ]

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.student).toEqual({
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
      })
      expect(data.data.schedule).toHaveLength(2)
      expect(data.data.totalAssignments).toBe(2)

      expect(data.data.schedule[0]).toEqual({
        id: 'ffb7eb73-5128-4a50-986a-438c20b6f274',
        dayOfWeek: 1,
        dayName: '月',
        room: {
          name: '図書室',
          capacity: 2,
        },
        term: 'FIRST_TERM',
        createdAt: '2024-01-01T00:00:00.000Z',
      })

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: {
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        },
        include: {
          room: {
            select: { name: true, capacity: true },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
      })
    })

    it('学期フィルターでスケジュールを絞り込める', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockAssignments = [
        {
          id: 'ffb7eb73-5128-4a50-986a-438c20b6f274',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 1,
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          room: {
            name: '図書室',
            capacity: 2,
          },
        },
      ]

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule?term=FIRST_TERM'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.schedule).toHaveLength(1)
      expect(data.data.schedule[0].term).toBe('FIRST_TERM')

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: {
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          term: 'FIRST_TERM',
        },
        include: {
          room: {
            select: { name: true, capacity: true },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }],
      })
    })

    it('2学期のスケジュールも正しく絞り込める', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockAssignments = [
        {
          id: 'a1b2c3d4-5678-90ab-cdef-123456789012',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 2,
          term: 'SECOND_TERM',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          room: {
            name: '図書室',
            capacity: 2,
          },
        },
      ]

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule?term=SECOND_TERM'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.schedule).toHaveLength(1)
      expect(data.data.schedule[0].term).toBe('SECOND_TERM')
      expect(data.data.schedule[0].dayName).toBe('火')
    })

    it('存在しない図書委員の場合は404を返す', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/students/12345678-1234-1234-1234-123456789012/schedule'
      )
      const props = {
        params: Promise.resolve({ id: '12345678-1234-1234-1234-123456789012' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('STUDENT_NOT_FOUND')
      expect(data.error.message).toBe('指定された図書委員が見つかりません')
    })

    it('認証されていない場合は401を返す', async () => {
      const mockAuthenticate = jest.mocked(authenticate)
      mockAuthenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)

      expect(response.status).toBe(401)
    })

    it('スケジュールが空の場合も正しくレスポンスを返す', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.schedule).toEqual([])
      expect(data.data.totalAssignments).toBe(0)
    })

    it('曜日名のマッピングが正しく動作する', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockAssignments = [
        {
          id: 'ffb7eb73-5128-4a50-986a-438c20b6f274',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 0,
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          room: { name: '図書室', capacity: 2 },
        },
        {
          id: 'e1875134-697b-47dd-bd1d-24068f4af4c6',
          studentId: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
          roomId: 'room-1',
          dayOfWeek: 6,
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          room: { name: '図書室', capacity: 2 },
        },
      ]

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.schedule[0].dayName).toBe('日')
      expect(data.data.schedule[1].dayName).toBe('土')
    })

    it('無効な学期パラメータの場合は400を返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c/schedule?term=INVALID_TERM'
      )
      const props = {
        params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }),
      }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
