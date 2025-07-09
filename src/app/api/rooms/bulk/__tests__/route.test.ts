/**
 * Room API bulk operations tests
 * Red Phase: 失敗するテストを先に実装
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/database/client'
import { authenticate } from '@/lib/auth/helpers'

// Next.js環境のセットアップ
const { POST } = require('../route')

// モック設定
jest.mock('@/lib/database/client', () => ({
  prisma: {
    room: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/auth/helpers', () => ({
  authenticate: jest.fn(),
}))

const mockPrisma = {
  room: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as any

const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>

// テストデータ
const mockRooms = [
  {
    id: 'room-1',
    name: '第1図書室',
    capacity: 30,
    description: 'メイン図書室',
    _count: { assignments: 0 },
  },
  {
    id: 'room-2',
    name: '第2図書室',
    capacity: 20,
    description: '小規模図書室',
    _count: { assignments: 5 },
  },
]

describe('POST /api/rooms/bulk', () => {
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

  describe('一括アクティブ化', () => {
    it('選択された図書室を一括でアクティブ化できる', async () => {
      // Arrange
      const bulkData = {
        operation: 'activate',
        roomIds: ['room-1', 'room-2'],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })

      mockPrisma.room.findMany.mockResolvedValue(mockRooms)
      mockPrisma.room.updateMany.mockResolvedValue({ count: 2 })

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.updatedCount).toBe(2)
      expect(json.data.message).toContain('アクティブ化')
    })
  })

  describe('一括非アクティブ化', () => {
    it('選択された図書室を一括で非アクティブ化できる', async () => {
      // Arrange
      const bulkData = {
        operation: 'deactivate',
        roomIds: ['room-1', 'room-2'],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })

      mockPrisma.room.findMany.mockResolvedValue(mockRooms)
      mockPrisma.room.updateMany.mockResolvedValue({ count: 2 })

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.updatedCount).toBe(2)
      expect(json.data.message).toContain('非アクティブ化')
    })
  })

  describe('一括削除', () => {
    it('割り当てのない図書室を一括削除できる', async () => {
      // Arrange
      const bulkData = {
        operation: 'delete',
        roomIds: ['room-1'], // room-1は割り当てなし
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })

      mockPrisma.room.findMany.mockResolvedValue([mockRooms[0]]) // room-1のみ
      mockPrisma.room.deleteMany.mockResolvedValue({ count: 1 })

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.deletedCount).toBe(1)
      expect(json.data.message).toContain('削除')
    })

    it('割り当てのある図書室は削除時にエラーを返す', async () => {
      // Arrange
      const bulkData = {
        operation: 'delete',
        roomIds: ['room-2'], // room-2は割り当てあり
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })

      mockPrisma.room.findMany.mockResolvedValue([mockRooms[1]]) // room-2のみ

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('ROOMS_HAVE_ASSIGNMENTS')
      expect(json.error.message).toContain('割り当て')
    })
  })

  describe('バリデーション', () => {
    it('無効な操作の場合400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        operation: 'invalid_operation',
        roomIds: ['room-1'],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('roomIdsが空の場合400エラーを返す', async () => {
      // Arrange
      const invalidData = {
        operation: 'activate',
        roomIds: [],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
    })

    it('存在しない図書室IDが含まれている場合404エラーを返す', async () => {
      // Arrange
      const bulkData = {
        operation: 'activate',
        roomIds: ['room-1', 'non-existent'],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })

      mockPrisma.room.findMany.mockResolvedValue([mockRooms[0]]) // room-1のみ見つかる

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('SOME_ROOMS_NOT_FOUND')
    })
  })

  describe('認証', () => {
    it('認証されていない場合エラーを返す', async () => {
      // Arrange
      const bulkData = {
        operation: 'activate',
        roomIds: ['room-1'],
      }
      
      const request = new NextRequest('http://localhost/api/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })
      
      mockAuthenticate.mockRejectedValue(new Error('Unauthorized'))

      // Act
      const response = await POST(request)
      const json = await response.json()

      // Assert
      expect(response.status).toBe(500) // handleApiErrorが500を返すと仮定
    })
  })
})