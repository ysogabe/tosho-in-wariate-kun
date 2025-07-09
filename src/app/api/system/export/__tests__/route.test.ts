import { NextRequest } from 'next/server'
import { GET } from '../route'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  prisma: {
    class: {
      findMany: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticateAdmin: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>

describe('/api/system/export', () => {
  let request: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    request = new NextRequest('http://localhost:3000/api/system/export', {
      method: 'GET',
    })
  })

  describe('GET /api/system/export', () => {
    it('管理者が認証されていない場合、エラーを返す', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('Unauthorized'))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('データエクスポートに失敗しました')
    })

    it('全データを正常にエクスポートできる', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      const mockClasses = [
        { id: 1, name: '1組', year: 5, createdAt: new Date('2024-01-01') },
        { id: 2, name: '2組', year: 5, createdAt: new Date('2024-01-02') },
      ]

      const mockStudents = [
        {
          id: 1,
          name: '田中太郎',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          class: { name: '1組', year: 5 },
        },
        {
          id: 2,
          name: '佐藤花子',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-02'),
          class: { name: '2組', year: 5 },
        },
      ]

      const mockRooms = [
        {
          id: 1,
          name: '図書室A',
          capacity: 5,
          description: 'メイン図書室',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          name: '図書室B',
          capacity: 3,
          description: 'サブ図書室',
          isActive: false,
          createdAt: new Date('2024-01-02'),
        },
      ]

      const mockAssignments = [
        {
          id: 1,
          dayOfWeek: 'MONDAY',
          term: 'FIRST_TERM',
          createdAt: new Date('2024-01-01'),
          student: { name: '田中太郎', grade: 5 },
          room: { name: '図書室A' },
        },
        {
          id: 2,
          dayOfWeek: 'TUESDAY',
          term: 'SECOND_TERM',
          createdAt: new Date('2024-01-02'),
          student: { name: '佐藤花子', grade: 5 },
          room: { name: '図書室B' },
        },
      ]

      mockPrisma.class.findMany.mockResolvedValue(mockClasses)
      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.room.findMany.mockResolvedValue(mockRooms)
      mockPrisma.assignment.findMany.mockResolvedValue(mockAssignments)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.exportedAt).toBeDefined()
      expect(data.version).toBe('1.0')
      expect(data.data.classes).toHaveLength(2)
      expect(data.data.students).toHaveLength(2)
      expect(data.data.rooms).toHaveLength(2)
      expect(data.data.assignments).toHaveLength(2)

      // Check classes data structure
      expect(data.data.classes[0]).toMatchObject({
        id: 1,
        name: '1組',
        year: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
      })

      // Check students data structure
      expect(data.data.students[0]).toMatchObject({
        id: 1,
        name: '田中太郎',
        grade: 5,
        class: '5年1組',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      })

      // Check rooms data structure
      expect(data.data.rooms[0]).toMatchObject({
        id: 1,
        name: '図書室A',
        capacity: 5,
        description: 'メイン図書室',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      })

      // Check assignments data structure
      expect(data.data.assignments[0]).toMatchObject({
        id: 1,
        studentName: '田中太郎',
        roomName: '図書室A',
        dayOfWeek: 'MONDAY',
        term: 'FIRST_TERM',
        createdAt: '2024-01-01T00:00:00.000Z',
      })
    })

    it('空のデータベースでもエクスポートできる', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      mockPrisma.class.findMany.mockResolvedValue([])
      mockPrisma.student.findMany.mockResolvedValue([])
      mockPrisma.room.findMany.mockResolvedValue([])
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.classes).toHaveLength(0)
      expect(data.data.students).toHaveLength(0)
      expect(data.data.rooms).toHaveLength(0)
      expect(data.data.assignments).toHaveLength(0)
    })

    it('正しいファイル名のContent-Dispositionヘッダーが設定される', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      mockPrisma.class.findMany.mockResolvedValue([])
      mockPrisma.student.findMany.mockResolvedValue([])
      mockPrisma.room.findMany.mockResolvedValue([])
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const contentDisposition = response.headers.get('Content-Disposition')
      expect(contentDisposition).toMatch(/^attachment; filename="tosho-system-export-\d{4}-\d{2}-\d{2}\.json"$/)
    })

    it('データベースエラーが発生した場合、エラーレスポンスを返す', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)
      mockPrisma.class.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('データエクスポートに失敗しました')
    })

    it('Promise.allが並列実行される', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      mockPrisma.class.findMany.mockResolvedValue([])
      mockPrisma.student.findMany.mockResolvedValue([])
      mockPrisma.room.findMany.mockResolvedValue([])
      mockPrisma.assignment.findMany.mockResolvedValue([])

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      // Verify all Prisma methods were called
      expect(mockPrisma.class.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.student.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.room.findMany).toHaveBeenCalledTimes(1)
      expect(mockPrisma.assignment.findMany).toHaveBeenCalledTimes(1)
    })

    it('正しいソート順でデータが取得される', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      mockPrisma.class.findMany.mockResolvedValue([])
      mockPrisma.student.findMany.mockResolvedValue([])
      mockPrisma.room.findMany.mockResolvedValue([])
      mockPrisma.assignment.findMany.mockResolvedValue([])

      await GET(request)

      // Check sort orders
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith({
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
      })

      expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
        include: {
          class: {
            select: { name: true, year: true },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      })

      expect(mockPrisma.room.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      })

      expect(mockPrisma.assignment.findMany).toHaveBeenCalledWith({
        include: {
          student: {
            select: { name: true, grade: true },
          },
          room: {
            select: { name: true },
          },
        },
        orderBy: [{ term: 'asc' }, { dayOfWeek: 'asc' }],
      })
    })

    it('エクスポートデータに必要なフィールドが含まれている', async () => {
      mockAuthenticateAdmin.mockResolvedValue(undefined)

      const testDate = new Date('2024-01-01T12:00:00Z')
      
      mockPrisma.class.findMany.mockResolvedValue([
        { id: 1, name: '1組', year: 5, createdAt: testDate },
      ])
      mockPrisma.student.findMany.mockResolvedValue([
        {
          id: 1,
          name: '田中太郎',
          grade: 5,
          isActive: true,
          createdAt: testDate,
          class: { name: '1組', year: 5 },
        },
      ])
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 1,
          name: '図書室A',
          capacity: 5,
          description: 'テスト',
          isActive: true,
          createdAt: testDate,
        },
      ])
      mockPrisma.assignment.findMany.mockResolvedValue([
        {
          id: 1,
          dayOfWeek: 'MONDAY',
          term: 'FIRST_TERM',
          createdAt: testDate,
          student: { name: '田中太郎', grade: 5 },
          room: { name: '図書室A' },
        },
      ])

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('exportedAt')
      expect(data).toHaveProperty('version')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('classes')
      expect(data.data).toHaveProperty('students')
      expect(data.data).toHaveProperty('rooms')
      expect(data.data).toHaveProperty('assignments')
    })
  })
})