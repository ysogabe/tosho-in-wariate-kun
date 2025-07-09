/**
 * スケジュール個別更新APIエンドポイントのテスト
 * PUT /api/schedules/[id]
 */

import { NextRequest } from 'next/server'
import { PUT } from '../route'
import { prisma } from '@/lib/database/client'
import { authenticateAdmin } from '@/lib/auth/helpers'

// モック設定
jest.mock('@/lib/database/client', () => ({
  prisma: {
    assignment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    room: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticateAdmin: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<
  typeof authenticateAdmin
>

describe('PUT /api/schedules/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthenticateAdmin.mockResolvedValue(undefined)
  })

  const mockExistingAssignment = {
    id: 'assignment-1',
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
        name: '1',
        year: 5,
      },
    },
    room: {
      id: 'room-1',
      name: '図書室A',
      capacity: 3,
    },
  }

  const mockTargetStudent = {
    id: 'student-2',
    name: '佐藤花子',
    grade: 6,
    class: {
      id: 'class-2',
      name: '2',
      year: 6,
    },
  }

  const mockTargetRoom = {
    id: 'room-2',
    name: '図書室B',
    capacity: 4,
  }

  const mockUpdatedAssignment = {
    id: 'assignment-1',
    studentId: 'student-2',
    roomId: 'room-2',
    dayOfWeek: 2,
    term: 'SECOND_TERM',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    student: mockTargetStudent,
    room: mockTargetRoom,
  }

  describe('認証', () => {
    it('管理者認証が必要である', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )
      mockAuthenticateAdmin.mockRejectedValue(new Error('Unauthorized'))

      const response = await PUT(request, { params: { id: 'assignment-1' } })

      expect(mockAuthenticateAdmin).toHaveBeenCalledWith(request)
      expect(response.status).toBe(500) // handleApiError により500エラーになる
    })
  })

  describe('正常系', () => {
    it('スケジュールを正常に更新できる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(mockTargetStudent)
      mockPrisma.room.findUnique.mockResolvedValue(mockTargetRoom)
      mockPrisma.assignment.findFirst.mockResolvedValue(null) // 重複なし
      mockPrisma.assignment.count.mockResolvedValue(2) // 定員内
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          assignment: {
            update: jest.fn().mockResolvedValue(mockUpdatedAssignment),
          },
        })
      })

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.assignment).toEqual({
        id: 'assignment-1',
        dayOfWeek: 2,
        dayName: '火',
        term: 'SECOND_TERM',
        termName: '後期',
        room: {
          id: 'room-2',
          name: '図書室B',
          capacity: 4,
        },
        student: {
          id: 'student-2',
          name: '佐藤花子',
          grade: 6,
          class: {
            id: 'class-2',
            name: '2',
            year: 6,
            fullName: '6年2組',
          },
        },
        updatedAt: mockUpdatedAssignment.updatedAt,
      })
      expect(data.data.message).toBe('スケジュールを更新しました')
      expect(data.data.changes).toEqual({
        studentChanged: true,
        roomChanged: true,
        dayChanged: true,
        termChanged: true,
      })
    })

    it('部分的な変更でも正常に更新できる', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-1', // 同じ学生
            roomId: 'room-2', // 図書室のみ変更
            dayOfWeek: 1, // 同じ曜日
            term: 'FIRST_TERM', // 同じ学期
          }),
        }
      )

      const partialUpdateAssignment = {
        ...mockExistingAssignment,
        roomId: 'room-2',
        room: mockTargetRoom,
      }

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(
        mockExistingAssignment.student
      )
      mockPrisma.room.findUnique.mockResolvedValue(mockTargetRoom)
      mockPrisma.assignment.findFirst.mockResolvedValue(null)
      mockPrisma.assignment.count.mockResolvedValue(1)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          assignment: {
            update: jest.fn().mockResolvedValue(partialUpdateAssignment),
          },
        })
      })

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.changes).toEqual({
        studentChanged: false,
        roomChanged: true,
        dayChanged: false,
        termChanged: false,
      })
    })
  })

  describe('バリデーション', () => {
    it('無効なUUID形式のIDで400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/invalid-id',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      const response = await PUT(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('無効な学生IDで400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'invalid-student-id',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('無効な曜日で400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 6, // 無効な曜日
            term: 'SECOND_TERM',
          }),
        }
      )

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('無効な学期で400エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'INVALID_TERM',
          }),
        }
      )

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('エラーハンドリング', () => {
    it('存在しないスケジュールIDで404エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(null)

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ASSIGNMENT_NOT_FOUND')
      expect(data.error.message).toBe('指定されたスケジュールが見つかりません')
    })

    it('存在しない学生IDで404エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('STUDENT_NOT_FOUND')
      expect(data.error.message).toBe('指定された学生が見つかりません')
    })

    it('存在しない図書室IDで404エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(mockTargetStudent)
      mockPrisma.room.findUnique.mockResolvedValue(null)

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ROOM_NOT_FOUND')
      expect(data.error.message).toBe('指定された図書室が見つかりません')
    })

    it('重複する割り当てで409エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(mockTargetStudent)
      mockPrisma.room.findUnique.mockResolvedValue(mockTargetRoom)
      mockPrisma.assignment.findFirst.mockResolvedValue({
        id: 'other-assignment',
        studentId: 'student-2',
        roomId: 'room-2',
        dayOfWeek: 2,
        term: 'SECOND_TERM',
      })

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DUPLICATE_ASSIGNMENT')
      expect(data.error.message).toBe(
        '同じ学期・曜日・図書室に既に同じ学生が割り当てられています'
      )
    })

    it('図書室の定員超過で409エラーを返す', async () => {
      const request = new NextRequest(
        'http://localhost/api/schedules/assignment-1',
        {
          method: 'PUT',
          body: JSON.stringify({
            studentId: 'student-2',
            roomId: 'room-2',
            dayOfWeek: 2,
            term: 'SECOND_TERM',
          }),
        }
      )

      mockPrisma.assignment.findUnique.mockResolvedValue(mockExistingAssignment)
      mockPrisma.student.findUnique.mockResolvedValue(mockTargetStudent)
      mockPrisma.room.findUnique.mockResolvedValue(mockTargetRoom)
      mockPrisma.assignment.findFirst.mockResolvedValue(null)
      mockPrisma.assignment.count.mockResolvedValue(4) // 定員4を超過

      const response = await PUT(request, { params: { id: 'assignment-1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ROOM_CAPACITY_EXCEEDED')
      expect(data.error.message).toBe(
        '図書室「図書室B」の定員（4名）を超過します'
      )
    })
  })
})
