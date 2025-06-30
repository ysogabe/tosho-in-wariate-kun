import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../auth-context'

// テスト用コンポーネント
function TestComponent() {
  const { user, isLoading, signIn, signOut, refetch } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in: ${user.email}` : 'Not logged in'}
      </div>
      <button
        onClick={() => signIn('test@example.com', 'Password123')}
        data-testid="sign-in"
      >
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button onClick={refetch} data-testid="refetch">
        Refetch
      </button>
    </div>
  )
}

function TestComponentWithoutProvider() {
  try {
    useAuth()
    return <div>This should not render</div>
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>
  }
}

beforeEach(() => {
  // Clear cookies before each test to ensure clean state
  if (typeof document !== 'undefined') {
    document.cookie =
      'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }
})

afterEach(() => {
  // Clear cookies after each test to prevent cross-test pollution
  if (typeof document !== 'undefined') {
    document.cookie =
      'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie =
      'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }
})

describe('AuthContext', () => {
  describe('AuthProvider', () => {
    it('provides auth context to children', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // 初期状態では未ログイン
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Not logged in'
        )
      })
    })

    it('handles sign in correctly', async () => {
      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // ローディング完了を待機
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Not logged in'
        )
      })

      // ログイン実行
      await act(async () => {
        await user.click(screen.getByTestId('sign-in'))
      })

      // ログイン後の状態確認
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Logged in: test@example.com'
        )
      })
    })

    it('handles sign out correctly', async () => {
      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // ローディング完了を待機
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Not logged in'
        )
      })

      // まずログイン
      await act(async () => {
        await user.click(screen.getByTestId('sign-in'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Logged in: test@example.com'
        )
      })

      // ログアウト実行
      await act(async () => {
        await user.click(screen.getByTestId('sign-out'))
      })

      // ログアウト後の状態確認（より長いタイムアウトで待機）
      await waitFor(
        () => {
          expect(screen.getByTestId('user-status')).toHaveTextContent(
            'Not logged in'
          )
        },
        { timeout: 3000 }
      )
    })

    it('handles refetch correctly', async () => {
      const user = userEvent.setup()
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // ローディング完了を待機
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent(
          'Not logged in'
        )
      })

      // refetch実行
      await act(async () => {
        await user.click(screen.getByTestId('refetch'))
      })

      // refetch後も認証状態は変わらない（モック実装では）
      await waitFor(
        () => {
          expect(screen.getByTestId('user-status')).toHaveTextContent(
            'Not logged in'
          )
        },
        { timeout: 3000 }
      )
    })
  })

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      render(<TestComponentWithoutProvider />)

      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      )
    })
  })
})
