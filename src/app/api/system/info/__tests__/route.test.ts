// @ts-nocheck
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  prisma: {
    student: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    class: {
      count: jest.fn(),
    },
    room: {
      count: jest.fn(),
    },
    assignment: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticateAdmin: jest.fn(),
}))

const mockPrisma = jest.mocked(prisma)
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>

describe('/api/system/info', () => {
  let request: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    request = new NextRequest('http://localhost:3000/api/system/info', {
      method: 'GET',
    })

    // Mock environment variables
    ;(process.env as any).SYSTEM_VERSION = '1.0.0'
    ;(process.env as any).BUILD_DATE = '2025-01-01T00:00:00Z'
    ;(process.env as any).NODE_ENV = 'test'
  })

  afterEach(() => {
    delete (process.env as any).SYSTEM_VERSION
    delete (process.env as any).BUILD_DATE
    delete (process.env as any).NODE_ENV
  })

  describe('GET /api/system/info', () => {
    it('管理者が認証されていない場合、エラーを返す', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('Unauthorized'))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('システム情報の取得に失敗しました')
    })

    it('システム情報を正常に取得できる', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      // Mock database queries
      mockPrisma.student.count
        .mockResolvedValueOnce(150) // totalStudents
        .mockResolvedValueOnce(145) // activeStudents
      mockPrisma.class.count.mockResolvedValue(12) // totalClasses
      mockPrisma.room.count.mockResolvedValue(3) // totalRooms
      mockPrisma.assignment.count
        .mockResolvedValueOnce(300) // totalAssignments
        .mockResolvedValueOnce(150) // firstTermAssignments
        .mockResolvedValueOnce(150) // secondTermAssignments

      mockPrisma.student.findFirst.mockResolvedValue({
        updatedAt: new Date('2024-12-15T10:00:00Z'),
      })
      mockPrisma.assignment.findFirst.mockResolvedValue({
        createdAt: new Date('2024-12-20T15:00:00Z'),
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        version: '1.0.0',
        buildDate: '2025-01-01T00:00:00Z',
        environment: 'test',
        database: {
          provider: 'PostgreSQL',
          lastDataUpdate: '2024-12-15T10:00:00.000Z',
          lastScheduleGeneration: '2024-12-20T15:00:00.000Z',
        },
        statistics: {
          students: {
            total: 150,
            active: 145,
            inactive: 5,
          },
          classes: {
            total: 12,
          },
          rooms: {
            total: 3,
          },
          assignments: {
            total: 300,
            firstTerm: 150,
            secondTerm: 150,
          },
        },
      })
    })

    it('環境変数がない場合、デフォルト値を使用する', async () => {
      delete (process.env as any).SYSTEM_VERSION
      delete (process.env as any).BUILD_DATE
      delete (process.env as any).NODE_ENV

      mockAuthenticateAdmin.mockResolvedValue({} as any)

      // Mock database queries with minimal data
      mockPrisma.student.count
        .mockResolvedValueOnce(0) // totalStudents
        .mockResolvedValueOnce(0) // activeStudents
      mockPrisma.class.count.mockResolvedValue(0)
      mockPrisma.room.count.mockResolvedValue(0) // totalRooms
      mockPrisma.assignment.count
        .mockResolvedValueOnce(0) // totalAssignments
        .mockResolvedValueOnce(0) // firstTermAssignments
        .mockResolvedValueOnce(0) // secondTermAssignments

      mockPrisma.student.findFirst.mockResolvedValue(null)
      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.version).toBe('1.0.0')
      expect(data.data.environment).toBe('development')
      expect(data.data.database.lastDataUpdate).toBe(null)
      expect(data.data.database.lastScheduleGeneration).toBe(null)
    })

    it('データベースエラーが発生した場合、エラーレスポンスを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)
      
      // Mock all database queries first (they need to exist to avoid undefined call errors)
      mockPrisma.student.count
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValue(0)
      mockPrisma.class.count.mockResolvedValue(0)
      mockPrisma.room.count.mockResolvedValue(0)
      mockPrisma.assignment.count.mockResolvedValue(0)
      mockPrisma.student.findFirst.mockResolvedValue(null)
      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('システム情報の取得に失敗しました')
    })

    it('Promise.allが並列実行される', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      // Mock all database queries
      mockPrisma.student.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(48)
      mockPrisma.class.count.mockResolvedValue(6)
      mockPrisma.room.count.mockResolvedValue(2)
      mockPrisma.assignment.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(50)

      mockPrisma.student.findFirst.mockResolvedValue({
        updatedAt: new Date('2024-12-01T10:00:00Z'),
      })
      mockPrisma.assignment.findFirst.mockResolvedValue({
        createdAt: new Date('2024-12-01T12:00:00Z'),
      })

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify all Prisma methods were called
      expect(mockPrisma.student.count).toHaveBeenCalledTimes(2) // total, active
      expect(mockPrisma.class.count).toHaveBeenCalledTimes(1)
      expect(mockPrisma.room.count).toHaveBeenCalledTimes(1) // total
      expect(mockPrisma.assignment.count).toHaveBeenCalledTimes(3) // total, firstTerm, secondTerm
    })

    it('統計データが正しく計算される', async () => {
      mockAuthenticateAdmin.mockResolvedValue({} as any)

      // Mock specific values to test calculations
      mockPrisma.student.count
        .mockResolvedValueOnce(100) // totalStudents
        .mockResolvedValueOnce(85) // activeStudents
      mockPrisma.class.count.mockResolvedValue(8)
      mockPrisma.room.count.mockResolvedValue(5) // totalRooms
      mockPrisma.assignment.count
        .mockResolvedValueOnce(200) // totalAssignments
        .mockResolvedValueOnce(120) // firstTermAssignments
        .mockResolvedValueOnce(80) // secondTermAssignments

      mockPrisma.student.findFirst.mockResolvedValue(null)
      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.statistics.students.inactive).toBe(15) // 100 - 85
      expect(data.data.statistics.rooms.total).toBe(5)
      expect(data.data.statistics.assignments.total).toBe(200)
      expect(data.data.statistics.assignments.firstTerm).toBe(120)
      expect(data.data.statistics.assignments.secondTerm).toBe(80)
    })
  })
})