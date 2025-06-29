import { renderHook, act } from '@testing-library/react'
import { useLoginForm } from '../use-login-form'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/auth/auth-context')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockSignIn = jest.fn()
const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

beforeEach(() => {
  ;(useAuth as jest.Mock).mockReturnValue({
    signIn: mockSignIn,
  })
  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })

  mockSignIn.mockClear()
  mockPush.mockClear()
})

describe('useLoginForm', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useLoginForm())

    expect(result.current.error).toBe('')
    expect(result.current.isLoading).toBe(false)
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
  })

  it('sets loading state during login', async () => {
    let resolveSignIn: (value: {}) => void
    const signInPromise = new Promise<{}>((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)

    const { result } = renderHook(() => useLoginForm())

    act(() => {
      result.current.login('test@example.com', 'password123')
    })

    expect(result.current.isLoading).toBe(true)

    resolveSignIn!({})

    await act(async () => {
      await signInPromise
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('calls signIn with correct credentials', async () => {
    mockSignIn.mockResolvedValue({})

    const { result } = renderHook(() => useLoginForm())

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('redirects to default dashboard on successful login', async () => {
    mockSignIn.mockResolvedValue({})

    const { result } = renderHook(() => useLoginForm())

    const loginResult = await act(async () => {
      return await result.current.login('test@example.com', 'password123')
    })

    expect(loginResult.success).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('redirects to custom path when redirectTo is provided', async () => {
    mockSignIn.mockResolvedValue({})

    const { result } = renderHook(() => useLoginForm({ redirectTo: '/admin' }))

    const loginResult = await act(async () => {
      return await result.current.login('test@example.com', 'password123')
    })

    expect(loginResult.success).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('calls onSuccess callback when provided', async () => {
    const mockOnSuccess = jest.fn()
    mockSignIn.mockResolvedValue({})

    const { result } = renderHook(() =>
      useLoginForm({ onSuccess: mockOnSuccess })
    )

    const loginResult = await act(async () => {
      return await result.current.login('test@example.com', 'password123')
    })

    expect(loginResult.success).toBe(true)
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled() // Should not redirect when onSuccess is provided
  })

  it('sets error on login failure', async () => {
    const errorMessage = 'Invalid credentials'
    mockSignIn.mockResolvedValue({ error: errorMessage })

    const { result } = renderHook(() => useLoginForm())

    const loginResult = await act(async () => {
      return await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(loginResult.success).toBe(false)
    expect(loginResult.error).toBe(errorMessage)
    expect(result.current.error).toBe(errorMessage)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('handles sign in exceptions gracefully', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLoginForm())

    const loginResult = await act(async () => {
      return await result.current.login('test@example.com', 'password123')
    })

    expect(loginResult.success).toBe(false)
    expect(loginResult.error).toBe(
      'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
    )
    expect(result.current.error).toBe(
      'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
    )
  })

  it('clears error when clearError is called', async () => {
    mockSignIn.mockResolvedValue({ error: 'Some error' })

    const { result } = renderHook(() => useLoginForm())

    // Set an error first
    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(result.current.error).toBeTruthy()

    // Clear the error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe('')
  })

  it('clears error before new login attempt', async () => {
    mockSignIn
      .mockResolvedValueOnce({ error: 'First error' })
      .mockResolvedValueOnce({})

    const { result } = renderHook(() => useLoginForm())

    // First login attempt with error
    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(result.current.error).toBe('First error')

    // Second login attempt should clear error before proceeding
    await act(async () => {
      await result.current.login('test@example.com', 'correctpassword')
    })

    expect(result.current.error).toBe('')
  })

  it('ensures loading state is cleared even on error', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLoginForm())

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(result.current.isLoading).toBe(false)
  })
})
