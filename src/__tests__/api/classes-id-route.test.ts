/**
 * @jest-environment node
 */

/**
 * /api/classes/[id] ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/classes/[id]/route'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    class: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

describe('/api/classes/[id] Route Tests', () => {
  const mockPrisma = require('@/lib/database/client').prisma

  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトの認証モック
    const { authenticate, authenticateAdmin } = require('@/lib/auth/helpers')
    authenticate.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
    })
    authenticateAdmin.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
    })
  })

  describe('GET /api/classes/[id]', () => {
    it('指定されたクラスの詳細を取得できる', async () => {
      const mockClass = {
        id: 'class-1',
        name: '5年1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { students: 25 },
      }

      mockPrisma.class.findUnique.mockResolvedValue(mockClass)

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.class.id).toBe('class-1')
      expect(data.data.class.name).toBe('5年1組')
      expect(data.data.class.studentCount).toBe(25)
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: 'class-1' },
        include: {
          _count: {
            select: { students: { where: { isActive: true } } },
          },
        },
      })
    })

    it('存在しないクラスの場合404を返す', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/classes/nonexistent')
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CLASS_NOT_FOUND')
      expect(data.error.message).toBe('クラスが見つかりません')
    })

    it('無効なクラスIDの場合400を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/classes/invalid@id')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid@id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('認証エラーの場合401を返す', async () => {
      const { authenticate } = require('@/lib/auth/helpers')
      authenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('PUT /api/classes/[id]', () => {
    it('クラス情報を正常に更新できる', async () => {
      const existingClass = {
        id: 'class-1',
        name: '5年1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const updatedClass = {
        id: 'class-1',
        name: '1組更新',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        _count: { students: 0 },
      }

      // 既存クラスの取得
      mockPrisma.class.findUnique.mockResolvedValue(existingClass)
      // 重複チェック（重複なし）
      mockPrisma.class.findFirst.mockResolvedValue(null)
      // 更新実行
      mockPrisma.class.update.mockResolvedValue(updatedClass)

      const requestBody = {
        name: '1組更新',
      }

      const request = new NextRequest('http://localhost:3000/api/classes/class-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.class.name).toBe('1組更新')
      expect(data.data.message).toBe('5年1組更新を更新しました')
      expect(mockPrisma.class.update).toHaveBeenCalledWith({
        where: { id: 'class-1' },
        data: requestBody,
        include: {
          _count: {
            select: { students: { where: { isActive: true } } },
          },
        },
      })
    })

    it('年度のみ更新できる', async () => {
      const existingClass = {
        id: 'class-1',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const updatedClass = {
        id: 'class-1',
        name: '1組',
        year: 6,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        _count: { students: 0 },
      }

      // 既存クラスの取得
      mockPrisma.class.findUnique.mockResolvedValue(existingClass)
      // 重複チェック（重複なし）
      mockPrisma.class.findFirst.mockResolvedValue(null)
      // 更新実行
      mockPrisma.class.update.mockResolvedValue(updatedClass)

      const requestBody = {
        year: 6,
      }

      const request = new NextRequest('http://localhost:3000/api/classes/class-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.class.year).toBe(6)
      expect(data.data.message).toBe('6年1組を更新しました')
    })

    it('存在しないクラスの更新で404エラー', async () => {
      // 既存クラスの存在確認で見つからない
      mockPrisma.class.findUnique.mockResolvedValue(null)

      const requestBody = {
        name: '存在しないクラス',
      }

      const request = new NextRequest('http://localhost:3000/api/classes/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CLASS_NOT_FOUND')
    })

    it('バリデーションエラーの場合400を返す', async () => {
      const requestBody = {
        year: 4, // 無効な年度
      }

      const request = new NextRequest('http://localhost:3000/api/classes/class-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('管理者権限が必要なエラーの場合403を返す', async () => {
      const { authenticateAdmin } = require('@/lib/auth/helpers')
      authenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const requestBody = {
        name: '更新テスト',
      }

      const request = new NextRequest('http://localhost:3000/api/classes/class-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('DELETE /api/classes/[id]', () => {
    it('クラスを正常に削除できる', async () => {
      const existingClass = {
        id: 'class-1',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { students: 0 },
      }

      // 削除前の存在確認で見つかる
      mockPrisma.class.findUnique.mockResolvedValue(existingClass)
      // 削除実行
      mockPrisma.class.delete.mockResolvedValue(existingClass)

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.deletedClass.id).toBe('class-1')
      expect(data.data.deletedClass.name).toBe('1組')
      expect(data.data.message).toBe('5年1組を削除しました')
      expect(mockPrisma.class.delete).toHaveBeenCalledWith({
        where: { id: 'class-1' },
      })
    })

    it('存在しないクラスの削除で404エラー', async () => {
      // 削除前の存在確認で見つからない
      mockPrisma.class.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/classes/nonexistent')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CLASS_NOT_FOUND')
    })

    it('無効なクラスIDの場合400を返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/classes/invalid@id')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid@id' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('管理者権限が必要なエラーの場合403を返す', async () => {
      const { authenticateAdmin } = require('@/lib/auth/helpers')
      authenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('関連データ制約エラーを適切に処理する', async () => {
      const existingClassWithStudents = {
        id: 'class-1',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { students: 3 }, // 図書委員が3名いる
      }

      // 削除前の存在確認で学生がいるクラスが見つかる
      mockPrisma.class.findUnique.mockResolvedValue(existingClassWithStudents)

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CLASS_HAS_STUDENTS')
      expect(data.error.message).toBe('このクラスには3名の図書委員が登録されているため削除できません')
    })
  })

  describe('エラーハンドリング統合テスト', () => {
    it('データベース接続エラーを適切に処理する', async () => {
      mockPrisma.class.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/classes/class-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('空のリクエストボディを適切に処理する', async () => {
      const existingClass = {
        id: 'class-1',
        name: '1組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const updatedClass = {
        ...existingClass,
        updatedAt: new Date('2024-01-02'),
        _count: { students: 0 },
      }

      // 既存クラスの取得
      mockPrisma.class.findUnique.mockResolvedValue(existingClass)
      // 重複チェック（実行されない）
      mockPrisma.class.findFirst.mockResolvedValue(null)
      // 更新実行
      mockPrisma.class.update.mockResolvedValue(updatedClass)

      const request = new NextRequest('http://localhost:3000/api/classes/class-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'class-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})