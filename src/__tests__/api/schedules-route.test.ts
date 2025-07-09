/**
 * @jest-environment node
 */

/**
 * /api/schedules ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/schedules/route'
import { prisma } from '@/lib/database/client'
import { authenticate } from '@/lib/auth/helpers'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    assignment: {
      findMany: jest.fn(),
    },
  },
}))

// 認証ヘルパーをモック
jest.mock('@/lib/auth/helpers', () => ({
  authenticate: jest.fn(),
}))

describe('/api/schedules Route Tests', () => {
  const mockPrisma = jest.mocked(prisma)
  const mockAuthenticate = jest.mocked(authenticate)

  beforeEach(() => {
    jest.clearAllMocks()

    // デフォルトの認証モック
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

  describe('GET /api/schedules', () => {
    const mockAssignments = [
      {
        id: 'assign-1',
        studentId: 'student-1',
        roomId: 'room-1',
        dayOfWeek: 1,
        term: 'FIRST_TERM',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        student: {
          id: 'student-1',
          name: '田中太郎',
          grade: 5,
          class: {
            id: 'class-1',
            name: '1組',
            year: 5,
          },
        },
        room: {
          id: 'room-1',
          name: '図書室',
          capacity: 4,
        },
      },
      {
        id: 'assign-2',
        studentId: 'student-2',
        roomId: 'room-1',
        dayOfWeek: 2,
        term: 'FIRST_TERM',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        student: {
          id: 'student-2',
          name: '佐藤花子',
          grade: 5,
          class: {
            id: 'class-1',
            name: '1組',
            year: 5,
          },
        },
        room: {
          id: 'room-1',
          name: '図書室',
          capacity: 4,
        },
      },
      {
        id: 'assign-3',
        studentId: 'student-3',
        roomId: 'room-2',
        dayOfWeek: 3,
        term: 'SECOND_TERM',
        createdAt: new Date('2024-04-01'),
        updatedAt: new Date('2024-04-01'),
        student: {
          id: 'student-3',
          name: '鈴木次郎',
          grade: 6,
          class: {
            id: 'class-2',
            name: '2組',
            year: 6,
          },
        },
        room: {
          id: 'room-2',
          name: '視聴覚室',
          capacity: 2,
        },
      },
    ]

    beforeEach(() => {
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)
    })

    it('全スケジュールを正常に取得できる', async () => {
      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.schedules).toHaveLength(3)
      expect(data.data.format).toBe('list')
      expect(data.data.stats).toBeDefined()

      // スケジュールデータの構造確認
      const schedule = data.data.schedules[0]
      expect(schedule).toMatchObject({
        id: 'assign-1',
        term: 'FIRST_TERM',
        dayOfWeek: 1,
        dayName: '月',
        room: {
          id: 'room-1',
          name: '図書室',
          capacity: 4,
        },
        student: {
          id: 'student-1',
          name: '田中太郎',
          grade: 5,
          class: {
            id: 'class-1',
            name: '1組',
            year: 5,
          },
        },
      })
    })

    it('学期でフィルタリングしてスケジュールを取得できる', async () => {
      // 前期のみをフィルタ
      const firstTermAssignments = mockAssignments.filter(
        (a) => a.term === 'FIRST_TERM'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(firstTermAssignments)

      const request = new NextRequest(
        'http://localhost/api/schedules?term=FIRST_TERM'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.schedules).toHaveLength(2)
      expect(data.data.filter.term).toBe('FIRST_TERM')

      // 全て前期であることを確認
      data.data.schedules.forEach((schedule: { term: string }) => {
        expect(schedule.term).toBe('FIRST_TERM')
      })

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { term: 'FIRST_TERM' },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      })
    })

    it('カレンダー形式でスケジュールを取得できる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules?format=calendar'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.format).toBe('calendar')

      // カレンダー形式の構造確認
      const calendar = data.data.schedules
      expect(calendar).toHaveProperty('FIRST_TERM')
      expect(calendar).toHaveProperty('SECOND_TERM')

      // 曜日ごとの配列があることを確認
      expect(calendar.FIRST_TERM).toHaveProperty('1') // 月曜日
      expect(calendar.FIRST_TERM).toHaveProperty('2') // 火曜日
      expect(Array.isArray(calendar.FIRST_TERM[1])).toBe(true)
    })

    it('統計情報が正しく計算される', async () => {
      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const stats = data.data.stats

      expect(stats.totalAssignments).toBe(3)
      expect(stats.uniqueStudents).toBe(3)
      expect(stats.termBreakdown).toEqual({
        FIRST_TERM: 2,
        SECOND_TERM: 1,
      })
      expect(stats.dayBreakdown).toEqual({
        1: 1, // 月曜日
        2: 1, // 火曜日
        3: 1, // 水曜日
      })
      expect(stats.roomBreakdown).toEqual({
        'room-1': { name: '図書室', count: 2 },
        'room-2': { name: '視聴覚室', count: 1 },
      })
      expect(stats.gradeBreakdown).toEqual({
        5: 2, // 5年生
        6: 1, // 6年生
      })
    })

    it('曜日名が正しく日本語に変換される', async () => {
      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const schedules = data.data.schedules
      expect(schedules[0].dayName).toBe('月') // dayOfWeek: 1
      expect(schedules[1].dayName).toBe('火') // dayOfWeek: 2
      expect(schedules[2].dayName).toBe('水') // dayOfWeek: 3
    })

    it('認証されていない場合は401を返す', async () => {
      mockAuthenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('データベースエラーが発生した場合は500を返す', async () => {
      mockPrisma.assignment.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('無効な学期パラメータの場合は400を返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules?term=INVALID_TERM'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('無効なフォーマットパラメータの場合は400を返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules?format=invalid'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('スケジュールが存在しない場合は空配列を返す', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/schedules')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.schedules).toHaveLength(0)
      expect(data.data.stats.totalAssignments).toBe(0)
      expect(data.data.stats.uniqueStudents).toBe(0)
    })

    it('複数のパラメータを組み合わせて使用できる', async () => {
      const secondTermAssignments = mockAssignments.filter(
        (a) => a.term === 'SECOND_TERM'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(secondTermAssignments)

      const request = new NextRequest(
        'http://localhost/api/schedules?term=SECOND_TERM&format=calendar'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.format).toBe('calendar')
      expect(data.data.filter.term).toBe('SECOND_TERM')

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { term: 'SECOND_TERM' },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      })
    })

    it('カレンダー形式で空のスケジュールも正しく処理される', async () => {
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost/api/schedules?format=calendar'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const calendar = data.data.schedules

      // 空のカレンダー構造が生成されていることを確認
      expect(calendar.FIRST_TERM).toBeDefined()
      expect(calendar.SECOND_TERM).toBeDefined()
      expect(Array.isArray(calendar.FIRST_TERM[1])).toBe(true)
      expect(calendar.FIRST_TERM[1]).toHaveLength(0)
    })
  })
})
