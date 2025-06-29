import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '../auth-guard'
import { useAuth } from '@/lib/auth/auth-context'

// Mock dependencies
jest.mock('@/lib/auth/auth-context')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))
jest.mock('@/components/common/loading-spinner', () => ({
  LoadingSpinner: ({ text }: { text: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

beforeEach(() => {
  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })

  mockPush.mockClear()
})

describe('AuthGuard', () => {
  it('shows loading spinner when auth is loading', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    })

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('認証状態を確認中...')).toBeInTheDocument()
  })

  it('renders children when user is authenticated and auth is required', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isLoading: false,
    })

    render(
      <AuthGuard requireAuth={true}>
        <div>Protected content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when user is not authenticated and auth is not required', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(
      <AuthGuard requireAuth={false}>
        <div>Public content</div>
      </AuthGuard>
    )

    expect(screen.getByText('Public content')).toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated and auth is required', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(
      <AuthGuard requireAuth={true} currentPath="/protected-page">
        <div>Protected content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/auth/login?redirectTo=%2Fprotected-page'
      )
    })
  })

  it('redirects to dashboard when user is authenticated but auth is not required', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isLoading: false,
    })

    render(
      <AuthGuard requireAuth={false}>
        <div>Login page</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('uses custom redirectTo path when provided', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(
      <AuthGuard
        requireAuth={true}
        redirectTo="/custom-login"
        currentPath="/admin"
      >
        <div>Protected content</div>
      </AuthGuard>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login?redirectTo=%2Fadmin')
    })
  })

  it('returns null when redirecting unauthenticated user', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    const { container } = render(
      <AuthGuard requireAuth={true}>
        <div>Protected content</div>
      </AuthGuard>
    )

    expect(container.firstChild).toBeNull()
  })

  it('returns null when redirecting authenticated user from public page', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      isLoading: false,
    })

    const { container } = render(
      <AuthGuard requireAuth={false}>
        <div>Login page</div>
      </AuthGuard>
    )

    expect(container.firstChild).toBeNull()
  })
})
