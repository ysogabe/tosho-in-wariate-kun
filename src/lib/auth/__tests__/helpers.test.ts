/**
 * @jest-environment jsdom
 */

import {
  setClientSession,
  clearClientSession,
  getClientSession,
  isAdmin,
  isTeacher,
  createAuthErrorResponse,
} from '../helpers'

// Mock Response for Node environment
global.Response = class Response {
  status: number
  headers: Record<string, string>
  body: string

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body
    this.status = init?.status || 200
    this.headers = init?.headers || {}
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
} as any

// Mock user data
const mockTeacherUser = {
  id: 'teacher-1',
  email: 'teacher@example.com',
  role: 'teacher',
  created_at: '2023-01-01T00:00:00.000Z',
}

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2023-01-01T00:00:00.000Z',
}

describe('Auth Helpers', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  })

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
})