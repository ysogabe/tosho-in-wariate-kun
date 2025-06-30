/**
 * @jest-environment node
 */

/**
 * /api/classes ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/classes/route'
import { prisma } from '@/lib/database/client'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    class: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
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

describe('/api/classes Route Tests', () => {
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
    })
    mockAuthenticateAdmin.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
    })
  })

  describe('GET /api/classes', () => {
    it('クラス一覧を正常に取得できる', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          name: '5年1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { students: 25 },
        },
        {
          id: 'class-2',
          name: '6年A組',
          year: 6,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { students: 28 },
        },
      ]

      mockPrisma.class.findMany.mockResolvedValue(mockClasses)
      mockPrisma.class.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/classes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.classes).toHaveLength(2)
      expect(data.data.classes[0].name).toBe('5年1組')
      expect(data.data.pagination.total).toBe(2)
      expect(data.data.pagination.page).toBe(1)
      expect(data.data.pagination.limit).toBe(20)
    })

    it('検索パラメータでフィルタリングできる', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          name: '5年1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { students: 25 },
        },
      ]

      mockPrisma.class.findMany.mockResolvedValue(mockClasses)
      mockPrisma.class.count.mockResolvedValue(1)

      const request = new NextRequest(
        'http://localhost:3000/api/classes?search=5年&year=5&page=1&limit=10'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            year: 5,
            name: { contains: '5年', mode: 'insensitive' },
          },
          include: {
            _count: {
              select: { students: { where: { isActive: true } } },
            },
          },
          skip: 0,
          take: 10,
        })
      )
    })

    it('認証エラーの場合401を返す', async () => {
      const mockAuthenticate = jest.mocked(authenticate)
      mockAuthenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost:3000/api/classes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('データベースエラーを適切に処理する', async () => {
      mockPrisma.class.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/classes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('POST /api/classes', () => {
    it('新しいクラスを正常に作成できる', async () => {
      const newClass = {
        id: 'class-new',
        name: '2組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { students: 0 },
      }

      // 重複チェックでクラスが見つからない
      mockPrisma.class.findFirst.mockResolvedValue(null)
      mockPrisma.class.create.mockResolvedValue(newClass)

      const requestBody = {
        name: '2組',
        year: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.class.name).toBe('2組')
      expect(data.data.class.year).toBe(5)
      expect(data.data.message).toBe('5年2組を作成しました')
      expect(mockPrisma.class.create).toHaveBeenCalledWith({
        data: requestBody,
        include: {
          _count: {
            select: { students: { where: { isActive: true } } },
          },
        },
      })
    })

    it('バリデーションエラーの場合400を返す', async () => {
      const requestBody = {
        name: '', // 無効な名前
        year: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('重複エラーの場合409を返す', async () => {
      const existingClass = {
        id: 'existing-class',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      // 重複チェックで既存クラスが見つかる
      mockPrisma.class.findFirst.mockResolvedValue(existingClass)

      const requestBody = {
        name: '1組', // 既存のクラス名
        year: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CLASS_ALREADY_EXISTS')
      expect(data.error.message).toBe('5年1組は既に存在します')
    })

    it('管理者権限が必要なエラーの場合403を返す', async () => {
      const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)
      mockAuthenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const requestBody = {
        name: '5年2組',
        year: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('年度の境界値をテストする', async () => {
      // 4年生（範囲外）
      const invalidYearRequest = new NextRequest(
        'http://localhost:3000/api/classes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'テスト', year: 4 }),
        }
      )

      const invalidResponse = await POST(invalidYearRequest)
      expect(invalidResponse.status).toBe(400)

      // 7年生（範囲外）
      const invalidHighYearRequest = new NextRequest(
        'http://localhost:3000/api/classes',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'テスト', year: 7 }),
        }
      )

      const invalidHighResponse = await POST(invalidHighYearRequest)
      expect(invalidHighResponse.status).toBe(400)
    })

    it('スペース入りクラス名を正常に作成できる', async () => {
      const newClass = {
        id: 'class-space',
        name: 'A組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { students: 0 },
      }

      // 重複チェックでクラスが見つからない
      mockPrisma.class.findFirst.mockResolvedValue(null)
      mockPrisma.class.create.mockResolvedValue(newClass)

      const requestBody = {
        name: 'A組',
        year: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.class.name).toBe('A組')
      expect(data.data.message).toBe('5年A組を作成しました')
    })
  })
})
