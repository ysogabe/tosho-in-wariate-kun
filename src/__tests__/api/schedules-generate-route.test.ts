/**
 * @jest-environment node
 */

/**
 * /api/schedules/generate ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/schedules/generate/route'
import { SchedulerService } from '@/lib/services/scheduler'
import { authenticateAdmin } from '@/lib/auth/helpers'

// SchedulerServiceをモック
jest.mock('@/lib/services/scheduler')

// 認証ヘルパーをモック
jest.mock('@/lib/auth/helpers', () => ({
  authenticateAdmin: jest.fn(),
}))

describe('/api/schedules/generate Route Tests', () => {
  const mockSchedulerService = jest.mocked(SchedulerService)
  const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)

  beforeEach(() => {
    jest.clearAllMocks()

    // デフォルトの認証モック（管理者として認証成功）
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

  describe('POST /api/schedules/generate', () => {
    it('前期スケジュールを正常に生成できる', async () => {
      // SchedulerServiceのモック結果
      const mockResult = {
        success: true,
        assignments: [
          {
            studentId: 'student-1',
            roomId: 'room-1',
            dayOfWeek: 1,
            term: 'FIRST_TERM' as const,
          },
          {
            studentId: 'student-2',
            roomId: 'room-1',
            dayOfWeek: 2,
            term: 'FIRST_TERM' as const,
          },
        ],
        stats: {
          totalAssignments: 2,
          studentsAssigned: 2,
          averageAssignmentsPerStudent: 1.0,
          balanceScore: 0.85,
          assignmentsByDay: { 1: 1, 2: 1 },
          assignmentsByRoom: { 'room-1': 2 },
        },
      }

      const mockGenerateSchedule = jest.fn().mockResolvedValue(mockResult)
      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      const requestBody = {
        term: 'FIRST_TERM',
        forceRegenerate: false,
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.term).toBe('FIRST_TERM')
      expect(data.data.assignments).toHaveLength(2)
      expect(data.data.stats).toBeDefined()
      expect(data.data.message).toBe('前期のスケジュールを生成しました')

      expect(mockGenerateSchedule).toHaveBeenCalledWith('FIRST_TERM', false)
    })

    it('後期スケジュールを正常に生成できる', async () => {
      const mockResult = {
        success: true,
        assignments: [
          {
            studentId: 'student-1',
            roomId: 'room-1',
            dayOfWeek: 3,
            term: 'SECOND_TERM' as const,
          },
        ],
        stats: {
          totalAssignments: 1,
          studentsAssigned: 1,
          averageAssignmentsPerStudent: 1.0,
          balanceScore: 0.75,
          assignmentsByDay: { 3: 1 },
          assignmentsByRoom: { 'room-1': 1 },
        },
      }

      const mockGenerateSchedule = jest.fn().mockResolvedValue(mockResult)
      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      const requestBody = {
        term: 'SECOND_TERM',
        forceRegenerate: true,
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.term).toBe('SECOND_TERM')
      expect(data.data.message).toBe('後期のスケジュールを生成しました')

      expect(mockGenerateSchedule).toHaveBeenCalledWith('SECOND_TERM', true)
    })

    it('スケジュール生成に失敗した場合は400を返す', async () => {
      const mockResult = {
        success: false,
        error: 'アクティブな図書委員が登録されていません',
      }

      const mockGenerateSchedule = jest.fn().mockResolvedValue(mockResult)
      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      const requestBody = {
        term: 'FIRST_TERM',
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('SCHEDULE_GENERATION_FAILED')
      expect(data.message).toBe('アクティブな図書委員が登録されていません')
    })

    it('無効な学期パラメータの場合は400を返す', async () => {
      const requestBody = {
        term: 'INVALID_TERM',
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('学期パラメータが未指定の場合は400を返す', async () => {
      const requestBody = {
        forceRegenerate: true,
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('管理者権限がない場合は401を返す', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const requestBody = {
        term: 'FIRST_TERM',
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('リクエストボディが不正な場合は400を返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: 'invalid json',
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('SchedulerServiceでエラーが発生した場合の処理', async () => {
      const mockGenerateSchedule = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'))

      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      const requestBody = {
        term: 'FIRST_TERM',
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('forceRegenerateパラメータが正しく処理される', async () => {
      const mockResult = {
        success: true,
        assignments: [],
        stats: {
          totalAssignments: 0,
          studentsAssigned: 0,
          averageAssignmentsPerStudent: 0,
          balanceScore: 0,
          assignmentsByDay: {},
          assignmentsByRoom: {},
        },
      }

      const mockGenerateSchedule = jest.fn().mockResolvedValue(mockResult)
      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      // forceRegenerate未指定（デフォルトfalse）
      const requestBody1 = {
        term: 'FIRST_TERM',
      }

      const request1 = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody1),
        }
      )

      await POST(request1)

      expect(mockGenerateSchedule).toHaveBeenCalledWith('FIRST_TERM', false)

      // forceRegenerate明示的にtrue
      const requestBody2 = {
        term: 'FIRST_TERM',
        forceRegenerate: true,
      }

      const request2 = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody2),
        }
      )

      await POST(request2)

      expect(mockGenerateSchedule).toHaveBeenCalledWith('FIRST_TERM', true)
    })

    it('統計情報が正しくレスポンスに含まれる', async () => {
      const mockStats = {
        totalAssignments: 8,
        studentsAssigned: 4,
        averageAssignmentsPerStudent: 2.0,
        balanceScore: 0.92,
        assignmentsByDay: { 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 },
        assignmentsByRoom: { 'room-1': 4, 'room-2': 4 },
      }

      const mockResult = {
        success: true,
        assignments: Array.from({ length: 8 }, (_, i) => ({
          studentId: `student-${(i % 4) + 1}`,
          roomId: `room-${(i % 2) + 1}`,
          dayOfWeek: (i % 5) + 1,
          term: 'FIRST_TERM' as const,
        })),
        stats: mockStats,
      }

      const mockGenerateSchedule = jest.fn().mockResolvedValue(mockResult)
      mockSchedulerService.mockImplementation(() => ({
        generateSchedule: mockGenerateSchedule,
      }))

      const requestBody = {
        term: 'FIRST_TERM',
      }

      const request = new NextRequest(
        'http://localhost/api/schedules/generate',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.stats).toEqual(mockStats)
      expect(data.data.stats.totalAssignments).toBe(8)
      expect(data.data.stats.averageAssignmentsPerStudent).toBe(2.0)
    })
  })
})
