/**
 * @jest-environment node
 */

/**
 * クラス管理API統合テスト（簡素版）
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/classes/route'

// モックのセットアップ
const mockPrisma = {
  class: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@/lib/database/client', () => ({
  prisma: mockPrisma,
}))

// 認証モックのセットアップ
jest.mock('@/lib/auth/helpers', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'user-1',
    role: 'admin',
  }),
  requireAdminUser: jest.fn().mockResolvedValue({
    id: 'user-1',
    role: 'admin',
  }),
}))

describe('/api/classes API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/classes', () => {
    it('クラス一覧を正常に取得できる', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          name: '5年1組',
          year: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { students: 25 },
        },
      ]

      mockPrisma.class.findMany.mockResolvedValue(mockClasses)
      mockPrisma.class.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/classes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.classes).toHaveLength(1)
    })

    it('認証エラーの場合401を返す', async () => {
      const { getCurrentUser } = jest.requireMock('@/lib/auth/helpers')
      getCurrentUser.mockRejectedValueOnce(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost:3000/api/classes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/classes', () => {
    it('新しいクラスを正常に作成できる', async () => {
      const newClass = {
        id: 'class-new',
        name: '5年2組',
        year: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.class.create.mockResolvedValue(newClass)

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

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('5年2組')
    })

    it('重複エラーの場合409を返す', async () => {
      const duplicateError = {
        code: 'P2002',
        message: 'Unique constraint failed',
      }

      mockPrisma.class.create.mockRejectedValue(duplicateError)

      const requestBody = {
        name: '5年1組',
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
      expect(data.error.code).toBe('DUPLICATE_ERROR')
    })
  })
})
