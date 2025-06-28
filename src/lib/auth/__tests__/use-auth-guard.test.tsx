import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '../auth-context'
import { useAuthGuard, useRequireAuth } from '../use-auth-guard'

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockRouter = { push: mockPush }

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
})

// テスト用コンポーネント
function TestUseAuthGuard({ redirectTo }: { redirectTo?: string }) {
  const { user, isLoading } = useAuthGuard(redirectTo)

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
    </div>
  )
}

function TestUseRequireAuth() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
    </div>
  )
}

describe('useAuthGuard', () => {
  it('redirects to login when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestUseAuthGuard />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  it('redirects to custom path when specified', async () => {
    render(
      <AuthProvider>
        <TestUseAuthGuard redirectTo="/custom-login" />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login')
    })
  })

  it('handles loading state correctly', async () => {
    render(
      <AuthProvider>
        <TestUseAuthGuard />
      </AuthProvider>
    )

    // 初期レンダリング直後はローディング状態
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    // ローディング中はリダイレクトしない
    expect(mockPush).not.toHaveBeenCalled()

    // ローディング完了を待機
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
    })

    // ローディング完了後にリダイレクトが発生
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })
})

describe('useRequireAuth', () => {
  it('returns correct authentication state when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestUseRequireAuth />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      )
    })
  })

  it('returns loading state initially', () => {
    render(
      <AuthProvider>
        <TestUseRequireAuth />
      </AuthProvider>
    )

    // 初期状態ではローディング
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'not-authenticated'
    )
  })
})
