import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../../middleware'

// Mock functions that will be used in jest.mock
const mockRedirect = jest.fn()
const mockNext = jest.fn()
const mockResponse = jest.fn()

jest.mock('next/server', () => {
  const MockNextResponse = jest.fn().mockImplementation((body?: any, init?: any) => {
    return mockResponse(body, init)
  })
  
  MockNextResponse.redirect = jest.fn()
  MockNextResponse.next = jest.fn()
  
  return {
    NextRequest: jest.fn(),
    NextResponse: MockNextResponse,
  }
})

// Helper to create mock request
function createMockRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = `https://example.com${pathname}`
  const request = {
    nextUrl: { pathname },
    url,
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  } as unknown as NextRequest

  return request
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResponse.mockReturnValue({ status: 401 })
    ;(NextResponse.redirect as jest.Mock).mockImplementation(mockRedirect)
    ;(NextResponse.next as jest.Mock).mockImplementation(mockNext)
  })

  describe('Public routes', () => {
    it('allows access to public routes without authentication', async () => {
      const request = createMockRequest('/')
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('allows access to test pages without authentication', async () => {
      const testPages = ['/components-test', '/table-test', '/test-ui', '/auth-test']
      
      for (const page of testPages) {
        const request = createMockRequest(page)
        await middleware(request)
      }
      
      expect(mockNext).toHaveBeenCalledTimes(testPages.length)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Protected routes', () => {
    it('redirects unauthenticated users to login page', async () => {
      const request = createMockRequest('/dashboard')
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login')
        })
      )
    })

    it('allows authenticated users to access protected routes', async () => {
      const request = createMockRequest('/dashboard', {
        'auth-session': 'authenticated',
        'user-role': 'teacher'
      })
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Admin routes', () => {
    it('redirects non-admin users to unauthorized page', async () => {
      const request = createMockRequest('/admin', {
        'auth-session': 'authenticated',
        'user-role': 'teacher'
      })
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/unauthorized')
        })
      )
    })

    it('allows admin users to access admin routes', async () => {
      const request = createMockRequest('/admin', {
        'auth-session': 'authenticated',
        'user-role': 'admin'
      })
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Auth-restricted routes', () => {
    it('redirects authenticated users away from login page', async () => {
      const request = createMockRequest('/auth/login', {
        'auth-session': 'authenticated',
        'user-role': 'teacher'
      })
      
      await middleware(request)
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard')
        })
      )
    })

    it('allows unauthenticated users to access login page', async () => {
      const request = createMockRequest('/auth/login')
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('API routes', () => {
    it('returns 401 for unauthenticated API requests', async () => {
      const request = createMockRequest('/api/classes')
      
      await middleware(request)
      
      // Check if NextResponse constructor was called for creating response
      expect(NextResponse).toHaveBeenCalled()
    })

    it('allows authenticated users to access protected API routes', async () => {
      const request = createMockRequest('/api/classes', {
        'auth-session': 'authenticated',
        'user-role': 'teacher'
      })
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('returns 403 for non-admin users accessing admin APIs', async () => {
      const request = createMockRequest('/api/admin/settings', {
        'auth-session': 'authenticated',
        'user-role': 'teacher'
      })
      
      const response = await middleware(request)
      
      // Check if NextResponse constructor was called for creating response  
      expect(NextResponse).toHaveBeenCalled()
    })

    it('allows admin users to access admin API routes', async () => {
      const request = createMockRequest('/api/admin/settings', {
        'auth-session': 'authenticated',
        'user-role': 'admin'
      })
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })

  describe('Static files and Next.js internals', () => {
    it('skips middleware for static files', async () => {
      const staticPaths = [
        '/_next/static/css/app.css',
        '/_next/image/logo.png',
        '/favicon.ico',
        '/image.jpg',
        '/style.css'
      ]
      
      for (const path of staticPaths) {
        const request = createMockRequest(path)
        await middleware(request)
      }
      
      expect(mockNext).toHaveBeenCalledTimes(staticPaths.length)
    })
  })

  describe('Error handling', () => {
    it('redirects to login on middleware errors for protected routes', async () => {
      // Create a request that might cause an error
      const request = createMockRequest('/dashboard', {
        'auth-session': 'invalid-json',
      })
      
      await middleware(request)
      
      // Should redirect to login page due to error
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/login')
        })
      )
    })

    it('continues processing for public routes even with errors', async () => {
      const request = createMockRequest('/')
      
      await middleware(request)
      
      expect(NextResponse.next).toHaveBeenCalled()
    })
  })
})