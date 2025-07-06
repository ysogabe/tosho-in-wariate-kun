/**
 * @jest-environment node
 */

/**
 * /api/students/[id] ルートの統合テスト
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/students/[id]/route'
import { prisma } from '@/lib/database/client'
import { authenticate, authenticateAdmin } from '@/lib/auth/helpers'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    student: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    class: {
      findUnique: jest.fn(),
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

describe('/api/students/[id] Route Tests', () => {
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

  describe('GET /api/students/[id]', () => {
    it('図書委員詳細を正常に取得できる', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { assignments: 2 },
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)

      const request = new NextRequest('http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c')
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.student.name).toBe('田中太郎')
      expect(data.data.student.assignmentCount).toBe(2)
    })

    it('存在しない図書委員の場合は404を返す', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/students/99999999-9999-9999-9999-999999999999'
      )
      const props = { params: Promise.resolve({ id: '99999999-9999-9999-9999-999999999999' }) }

      const response = await GET(request, props)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('STUDENT_NOT_FOUND')
    })

    it('認証されていない場合は401を返す', async () => {
      const mockAuthenticate = jest.mocked(authenticate)
      mockAuthenticate.mockRejectedValue(new Error('認証が必要です'))

      const request = new NextRequest('http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c')
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await GET(request, props)

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/students/[id]', () => {
    it('図書委員情報を正常に更新できる', async () => {
      const mockExistingStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      const mockUpdatedStudent = {
        ...mockExistingStudent,
        name: '田中次郎',
        updatedAt: new Date('2024-01-02'),
        _count: { assignments: 2 },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockExistingStudent)
      mockPrisma.student.findFirst.mockResolvedValue(null) // 重複なし
      mockPrisma.student.update.mockResolvedValue(mockUpdatedStudent)

      const requestBody = { name: '田中次郎' }

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await PUT(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.student.name).toBe('田中次郎')
      expect(data.data.message).toBe('5年1組の田中次郎さんの情報を更新しました')
    })

    it('クラス変更時に新しいクラスの存在確認を行う', async () => {
      const mockExistingStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      const mockNewClass = {
        id: '22222222-2222-2222-2222-222222222222',
        name: '2組',
        year: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      const mockUpdatedStudent = {
        ...mockExistingStudent,
        classId: '22222222-2222-2222-2222-222222222222',
        class: mockNewClass,
        _count: { assignments: 2 },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockExistingStudent)
      mockPrisma.class.findUnique.mockResolvedValue(mockNewClass)
      mockPrisma.student.findFirst.mockResolvedValue(null)
      mockPrisma.student.update.mockResolvedValue(mockUpdatedStudent)

      const requestBody = { classId: '22222222-2222-2222-2222-222222222222' }

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await PUT(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.student.classId).toBe('22222222-2222-2222-2222-222222222222')
      expect(mockPrisma.class.findUnique).toHaveBeenCalledWith({
        where: { id: '22222222-2222-2222-2222-222222222222' },
        select: { id: true, name: true, year: true },
      })
    })

    it('存在しないクラスへの変更は400を返す', async () => {
      const mockExistingStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockExistingStudent)
      mockPrisma.class.findUnique.mockResolvedValue(null)

      const requestBody = { classId: '99999999-9999-9999-9999-999999999999' }

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await PUT(request, props)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('CLASS_NOT_FOUND')
    })

    it('重複する図書委員への更新は409を返す', async () => {
      const mockExistingStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      const mockDuplicateStudent = {
        id: '33333333-3333-3333-3333-333333333333',
        name: '佐藤花子',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockExistingStudent)
      mockPrisma.student.findFirst.mockResolvedValue(mockDuplicateStudent)

      const requestBody = { name: '佐藤花子' }

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await PUT(request, props)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error.code).toBe('STUDENT_ALREADY_EXISTS')
    })

    it('存在しない図書委員の更新は404を返す', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const requestBody = { name: '新しい名前' }

      const request = new NextRequest(
        'http://localhost/api/students/99999999-9999-9999-9999-999999999999',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '99999999-9999-9999-9999-999999999999' }) }

      const response = await PUT(request, props)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('STUDENT_NOT_FOUND')
    })

    it('管理者権限がない場合は401を返す', async () => {
      const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)
      mockAuthenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const requestBody = { name: '新しい名前' }

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'PUT',
          body: JSON.stringify(requestBody),
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await PUT(request, props)

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/students/[id]', () => {
    it('図書委員を正常に削除できる', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { assignments: 0 },
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)
      mockPrisma.student.delete.mockResolvedValue(mockStudent)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'DELETE',
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await DELETE(request, props)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe(
        '5年1組の田中太郎さんを図書委員から削除しました'
      )
      expect(mockPrisma.student.delete).toHaveBeenCalledWith({
        where: { id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' },
      })
    })

    it('当番が割り当てられている図書委員の削除は400を返す', async () => {
      const mockStudent = {
        id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        name: '田中太郎',
        classId: '11111111-1111-1111-1111-111111111111',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { assignments: 3 },
        class: {
          id: '11111111-1111-1111-1111-111111111111',
          name: '1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      }

      mockPrisma.student.findUnique.mockResolvedValue(mockStudent)

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'DELETE',
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await DELETE(request, props)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('STUDENT_CANNOT_DELETE')
      expect(data.error.message).toContain(
        '3件の当番が割り当てられているため削除できません'
      )
      expect(mockPrisma.student.delete).not.toHaveBeenCalled()
    })

    it('存在しない図書委員の削除は404を返す', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost/api/students/99999999-9999-9999-9999-999999999999',
        {
          method: 'DELETE',
        }
      )
      const props = { params: Promise.resolve({ id: '99999999-9999-9999-9999-999999999999' }) }

      const response = await DELETE(request, props)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('STUDENT_NOT_FOUND')
    })

    it('管理者権限がない場合は401を返す', async () => {
      const mockAuthenticateAdmin = jest.mocked(authenticateAdmin)
      mockAuthenticateAdmin.mockRejectedValue(new Error('管理者権限が必要です'))

      const request = new NextRequest(
        'http://localhost/api/students/07c1d4ca-851b-4a33-9097-cecc3ebaf70c',
        {
          method: 'DELETE',
        }
      )
      const props = { params: Promise.resolve({ id: '07c1d4ca-851b-4a33-9097-cecc3ebaf70c' }) }

      const response = await DELETE(request, props)

      expect(response.status).toBe(403)
    })
  })
})
