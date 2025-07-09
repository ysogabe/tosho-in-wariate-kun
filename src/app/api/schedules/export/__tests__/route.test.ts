/**
 * スケジュールエクスポートAPIエンドポイントのテスト
 * GET /api/schedules/export
 */

import { NextRequest } from 'next/server'
import { GET } from '../route'
import { authenticate } from '@/lib/auth/helpers'

// モック設定
jest.mock('@/lib/database/client', () => ({
  prisma: {
    assignment: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticate: jest.fn(),
}))

const mockPrisma = {
  assignment: {
    findMany: jest.fn(),
  },
} as any

const mockAuthenticate = authenticate as jest.MockedFunction<
  typeof authenticate
>

describe.skip('GET /api/schedules/export (認証テスト除外)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthenticate.mockResolvedValue({
      id: 'test-user',
      email: 'test@example.com',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      confirmation_sent_at: null,
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      invited_at: null,
      last_sign_in_at: new Date().toISOString(),
      phone: null,
      phone_confirmed_at: null,
      recovery_sent_at: null,
    })
  })

  const mockAssignments = [
    {
      id: '1',
      term: 'FIRST_TERM',
      dayOfWeek: 1,
      studentId: 'student1',
      roomId: 'room1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      student: {
        id: 'student1',
        name: '田中太郎',
        grade: 5,
        class: {
          id: 'class1',
          name: '1',
          year: 5,
        },
      },
      room: {
        id: 'room1',
        name: '図書室A',
      },
    },
    {
      id: '2',
      term: 'SECOND_TERM',
      dayOfWeek: 2,
      studentId: 'student2',
      roomId: 'room2',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      student: {
        id: 'student2',
        name: '佐藤花子',
        grade: 6,
        class: {
          id: 'class2',
          name: '2',
          year: 6,
        },
      },
      room: {
        id: 'room2',
        name: '図書室B',
      },
    },
  ]

  describe('認証', () => {
    it('認証が必要である', async () => {
      const request = new NextRequest('http://localhost/api/schedules/export')
      mockAuthenticate.mockRejectedValue(new Error('Unauthorized'))

      const response = await GET(request)

      expect(mockAuthenticate).toHaveBeenCalledWith(request)
      expect(response.status).toBe(500) // handleApiError により500エラーになる
    })
  })

  describe('CSV エクスポート', () => {
    it('CSV形式でスケジュールをエクスポートできる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=csv'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe(
        'text/csv; charset=utf-8'
      )
      expect(response.headers.get('content-disposition')).toMatch(
        /attachment; filename="library-schedule-\d{4}-\d{2}-\d{2}\.csv"/
      )
      expect(text).toContain('期,曜日,図書室,学年,クラス,氏名,作成日')
      expect(text).toContain('前期,月,図書室A,5年,1組,田中太郎')
      expect(text).toContain('後期,火,図書室B,6年,2組,佐藤花子')
    })

    it('学期フィルタリングしてCSVエクスポートできる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=csv&term=FIRST_TERM'
      )
      mockPrisma.assignment.findMany.mockResolvedValue([mockAssignments[0]])

      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(text).toContain('前期,月,図書室A,5年,1組,田中太郎')
      expect(text).not.toContain('後期,火,図書室B,6年,2組,佐藤花子')
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: { term: 'FIRST_TERM' },
        include: {
          student: {
            include: {
              class: {
                select: { name: true, year: true },
              },
            },
          },
          room: {
            select: { name: true },
          },
        },
        orderBy: [
          { term: 'asc' },
          { dayOfWeek: 'asc' },
          { room: { name: 'asc' } },
          { student: { name: 'asc' } },
        ],
      })
    })
  })

  describe('JSON エクスポート', () => {
    it('JSON形式でスケジュールをエクスポートできる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=json'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-disposition')).toMatch(
        /attachment; filename="library-schedule-\d{4}-\d{2}-\d{2}\.json"/
      )
      expect(data.totalAssignments).toBe(2)
      expect(data.assignments).toHaveLength(2)
      expect(data.assignments[0]).toEqual({
        id: '1',
        term: 'FIRST_TERM',
        termName: '前期',
        dayOfWeek: 1,
        dayName: '月',
        room: {
          name: '図書室A',
        },
        student: {
          name: '田中太郎',
          grade: 5,
          class: '5年1組',
        },
        createdAt: mockAssignments[0].createdAt,
      })
      expect(data.summary).toEqual({
        totalAssignments: 2,
        uniqueStudents: 2,
        termBreakdown: {
          FIRST_TERM: 1,
          SECOND_TERM: 1,
        },
        dayBreakdown: {
          1: 1,
          2: 1,
          3: 0,
          4: 0,
          5: 0,
        },
        roomBreakdown: {
          図書室A: 1,
          図書室B: 1,
        },
        gradeBreakdown: {
          5: 1,
          6: 1,
        },
      })
    })
  })

  describe('PDF エクスポート', () => {
    it('PDF形式は未実装エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=pdf'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(501)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('PDF_NOT_IMPLEMENTED')
      expect(data.error.message).toBe('PDF出力は現在準備中です')
    })
  })

  describe('エラーハンドリング', () => {
    it('データが存在しない場合は404エラーを返す', async () => {
      const request = new NextRequest('http://localhost/api/schedules/export')
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NO_DATA_TO_EXPORT')
      expect(data.error.message).toBe('エクスポートするデータがありません')
    })

    it('不正な学期パラメータでバリデーションエラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?term=INVALID_TERM'
      )
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('不正なフォーマットパラメータでバリデーションエラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=invalid'
      )
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('デフォルト値', () => {
    it('フォーマット未指定時はCSVが使用される', async () => {
      const request = new NextRequest('http://localhost/api/schedules/export')
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe(
        'text/csv; charset=utf-8'
      )
      expect(text).toContain('期,曜日,図書室,学年,クラス,氏名,作成日')
    })

    it('学期未指定時は全期間が対象になる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/export?format=json'
      )
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      await GET(request)

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          student: {
            include: {
              class: {
                select: { name: true, year: true },
              },
            },
          },
          room: {
            select: { name: true },
          },
        },
        orderBy: [
          { term: 'asc' },
          { dayOfWeek: 'asc' },
          { room: { name: 'asc' } },
          { student: { name: 'asc' } },
        ],
      })
    })
  })
})
