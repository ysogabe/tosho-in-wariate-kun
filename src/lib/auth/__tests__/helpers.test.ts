/**
 * @jest-environment jsdom
 */

import { NextRequest } from 'next/server'
import {
  setClientSession,
  clearClientSession,
  getClientSession,
} from '../client-helpers'
import {
  getServerSession,
  requireAuth,
  requireAdmin,
  authenticate,
  authenticateAdmin,
  getUserProfile,
  refreshSession,
  isAdmin,
  isTeacher,
  createAuthErrorResponse
} from '../helpers'
import { MVPUser } from '../types'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

// Mock Response for Node environment
global.Response = class Response {
  status: number
  headers: Record<string, string>
  body: string

  constructor(
    body: string,
    init?: { status?: number; headers?: Record<string, string> }
  ) {
    this.body = body
    this.status = init?.status || 200
    this.headers = init?.headers || {}
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
} as any

// Mock user data
const mockTeacherUser: MVPUser = {
  id: 'teacher-1',
  email: 'teacher@example.com',
  role: 'teacher',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: null,
  confirmed_at: '2023-01-01T00:00:00.000Z',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  invited_at: null,
  last_sign_in_at: '2023-01-01T00:00:00.000Z',
  phone: null,
  phone_confirmed_at: null,
  recovery_sent_at: null,
}

const mockAdminUser: MVPUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: null,
  confirmed_at: '2023-01-01T00:00:00.000Z',
  email_confirmed_at: '2023-01-01T00:00:00.000Z',
  invited_at: null,
  last_sign_in_at: '2023-01-01T00:00:00.000Z',
  phone: null,
  phone_confirmed_at: null,
  recovery_sent_at: null,
}

describe('Auth Helpers', () => {
  const { cookies } = require('next/headers')

  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    
    // Clear mocks
    jest.clearAllMocks()
    consoleErrorSpy.mockClear()
    
    // Reset environment variables
    const originalNodeEnv = process.env.NODE_ENV
    const originalDevBypass = process.env.DEV_BYPASS_AUTH
    
    // Store originals for cleanup
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
    Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: originalDevBypass, writable: true, configurable: true })
  })

  // Client-side helpers tests
  describe('setClientSession', () => {
    it('sets authentication cookies for teacher user', () => {
      setClientSession(mockTeacherUser)

      expect(document.cookie).toContain('auth-session=authenticated')
      expect(document.cookie).toContain('user-role=teacher')
      expect(document.cookie).toContain('user-data=')
    })

    it('sets authentication cookies for admin user', () => {
      setClientSession(mockAdminUser)

      expect(document.cookie).toContain('auth-session=authenticated')
      expect(document.cookie).toContain('user-role=admin')
      expect(document.cookie).toContain('user-data=')
    })
  })

  describe('clearClientSession', () => {
    it('clears all authentication cookies', () => {
      // First set some cookies
      setClientSession(mockTeacherUser)
      expect(document.cookie).toContain('auth-session=authenticated')

      // Then clear them
      clearClientSession()

      // Cookies should be cleared (expired)
      expect(document.cookie).not.toContain('auth-session=authenticated')
    })
  })

  describe('getClientSession', () => {
    it('returns user data when valid session exists', () => {
      setClientSession(mockTeacherUser)

      const session = getClientSession()

      expect(session).toEqual(mockTeacherUser)
    })

    it('returns null when no session exists', () => {
      const session = getClientSession()

      expect(session).toBeNull()
    })

    it('returns null when session is invalid', () => {
      // Set invalid session cookie
      document.cookie = 'auth-session=invalid; path=/'
      document.cookie = 'user-data=invalid-json; path=/'

      const session = getClientSession()

      expect(session).toBeNull()
    })
  })

  // Server-side helpers tests
  describe('getServerSession', () => {
    it('開発環境でDEV_BYPASS_AUTHが有効な場合はデフォルトの管理者を返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await getServerSession()

      expect(result).toEqual({
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'admin',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: null,
        confirmed_at: expect.any(String),
        email_confirmed_at: expect.any(String),
        invited_at: null,
        last_sign_in_at: expect.any(String),
        phone: null,
        phone_confirmed_at: null,
        recovery_sent_at: null,
      })
    })

    it('認証Cookieが存在しない場合はnullを返す', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBeNull()
    })

    it('正常な認証Cookieがある場合はユーザーを返す', async () => {
      const mockCookieStore = {
        get: jest.fn()
          .mockReturnValueOnce({ value: 'authenticated' }) // auth-session
          .mockReturnValueOnce({ value: JSON.stringify(mockAdminUser) }) // user-data
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toEqual(mockAdminUser)
    })

    it('Cookie解析エラーの場合はnullを返しエラーログを出力', async () => {
      const mockCookieStore = {
        get: jest.fn()
          .mockReturnValueOnce({ value: 'authenticated' }) // auth-session
          .mockReturnValueOnce({ value: 'invalid-json' }) // user-data
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Server session error:', expect.any(Error))
    })
  })

  describe('requireAuth', () => {
    it('認証済みユーザーがいる場合はユーザーを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await requireAuth()

      expect(result).toEqual(expect.objectContaining({
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'admin',
      }))
    })

    it('認証されていない場合はエラーを投げる', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      cookies.mockResolvedValue(mockCookieStore)

      await expect(requireAuth()).rejects.toThrow('認証が必要です')
    })
  })

  describe('requireAdmin', () => {
    it('管理者ユーザーの場合はユーザーを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await requireAdmin()

      expect(result).toEqual(expect.objectContaining({
        role: 'admin',
      }))
    })

    it('管理者以外のユーザーの場合はエラーを投げる', async () => {
      const mockCookieStore = {
        get: jest.fn()
          .mockReturnValueOnce({ value: 'authenticated' })
          .mockReturnValueOnce({ value: JSON.stringify(mockTeacherUser) })
      }
      cookies.mockResolvedValue(mockCookieStore)

      await expect(requireAdmin()).rejects.toThrow('管理者権限が必要です')
    })
  })

  describe('authenticate', () => {
    function createMockRequest(cookieData: Record<string, string> = {}): NextRequest {
      const cookiesMap = new Map()
      Object.entries(cookieData).forEach(([name, value]) => {
        cookiesMap.set(name, { name, value })
      })

      return {
        cookies: {
          get: (name: string) => cookiesMap.get(name),
        },
      } as NextRequest
    }

    it('開発環境でDEV_BYPASS_AUTHが有効な場合はデフォルトの管理者を返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const req = createMockRequest()
      const result = await authenticate(req)

      expect(result).toEqual(expect.objectContaining({
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'admin',
      }))
    })

    it('正常な認証Cookieがある場合はユーザーを返す', async () => {
      const req = createMockRequest({
        'auth-session': 'authenticated',
        'user-data': JSON.stringify(mockAdminUser),
      })

      const result = await authenticate(req)

      expect(result).toEqual(mockAdminUser)
    })

    it('認証Cookieが存在しない場合はエラーを投げる', async () => {
      const req = createMockRequest()

      await expect(authenticate(req)).rejects.toThrow('認証が必要です')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Authentication error:', expect.any(Error))
    })
  })

  describe('authenticateAdmin', () => {
    function createMockRequest(cookieData: Record<string, string> = {}): NextRequest {
      const cookiesMap = new Map()
      Object.entries(cookieData).forEach(([name, value]) => {
        cookiesMap.set(name, { name, value })
      })

      return {
        cookies: {
          get: (name: string) => cookiesMap.get(name),
        },
      } as NextRequest
    }

    it('管理者ユーザーの場合はユーザーを返す', async () => {
      const req = createMockRequest({
        'auth-session': 'authenticated',
        'user-data': JSON.stringify(mockAdminUser),
      })

      const result = await authenticateAdmin(req)

      expect(result).toEqual(mockAdminUser)
    })

    it('管理者以外のユーザーの場合はエラーを投げる', async () => {
      const req = createMockRequest({
        'auth-session': 'authenticated',
        'user-data': JSON.stringify(mockTeacherUser),
      })

      await expect(authenticateAdmin(req)).rejects.toThrow('管理者権限が必要です')
    })
  })

  describe('getUserProfile', () => {
    it('認証済みユーザーが自分のプロファイルを取得する場合', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await getUserProfile('dev-admin')

      expect(result).toEqual(expect.objectContaining({
        id: 'dev-admin',
        email: 'admin@dev.local',
      }))
    })

    it('認証済みユーザーが他人のプロファイルを取得しようとする場合はnullを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await getUserProfile('other-user')

      expect(result).toBeNull()
    })
  })

  describe('refreshSession', () => {
    it('正常なセッションがある場合はセッションを返す', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const result = await refreshSession()

      expect(result).toEqual(expect.objectContaining({
        id: 'dev-admin',
        email: 'admin@dev.local',
        role: 'admin',
      }))
    })

    it('セッションが存在しない場合はnullを返す', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await refreshSession()

      expect(result).toBeNull()
    })
  })

  // Role checking helper tests
  describe('isAdmin', () => {
    it('returns true for admin users', () => {
      expect(isAdmin(mockAdminUser)).toBe(true)
    })

    it('returns false for non-admin users', () => {
      expect(isAdmin(mockTeacherUser)).toBe(false)
    })

    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false)
    })
  })

  describe('isTeacher', () => {
    it('returns true for teacher users', () => {
      expect(isTeacher(mockTeacherUser)).toBe(true)
    })

    it('returns true for admin users (admins are also teachers)', () => {
      expect(isTeacher(mockAdminUser)).toBe(true)
    })

    it('returns false for null user', () => {
      expect(isTeacher(null)).toBe(false)
    })
  })

  // Error response helper tests
  describe('createAuthErrorResponse', () => {
    it('creates 401 unauthorized response by default', () => {
      const response = createAuthErrorResponse('Test error message')

      expect(response.status).toBe(401)
    })

    it('creates 403 forbidden response when specified', () => {
      const response = createAuthErrorResponse('Test error message', 403)

      expect(response.status).toBe(403)
    })

    it('includes error message in response body', async () => {
      const response = createAuthErrorResponse('Test error message')
      const body = await response.json()

      expect(body).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Test error message',
        },
      })
    })

    it('sets correct error code for forbidden response', async () => {
      const response = createAuthErrorResponse('Test error message', 403)
      const body = await response.json()

      expect(body.error.code).toBe('FORBIDDEN')
    })
  })

  // Edge cases and error resilience tests
  describe('Edge Cases and Error Resilience', () => {
    it('空文字列のCookie値を適切に処理する', async () => {
      const mockCookieStore = {
        get: jest.fn()
          .mockReturnValueOnce({ value: '' }) // auth-session
          .mockReturnValueOnce({ value: JSON.stringify(mockAdminUser) }) // user-data
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBeNull()
    })

    it('不正なJSON形式のユーザーデータを適切に処理する', async () => {
      const mockCookieStore = {
        get: jest.fn()
          .mockReturnValueOnce({ value: 'authenticated' })
          .mockReturnValueOnce({ value: '{invalid-json}' })
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('cookies()アクセスエラーを適切に処理する', async () => {
      cookies.mockRejectedValue(new Error('Cookie access error'))

      const result = await getServerSession()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Server session error:', expect.any(Error))
    })

    it('環境変数の組み合わせテスト - 本番環境では認証バイパス無効', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })
      Object.defineProperty(process.env, 'DEV_BYPASS_AUTH', { value: 'true', writable: true, configurable: true })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      cookies.mockResolvedValue(mockCookieStore)

      const result = await getServerSession()

      expect(result).toBeNull()
    })
  })
})