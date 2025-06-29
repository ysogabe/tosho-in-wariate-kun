import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../login-form'
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

describe('LoginForm', () => {
  it('renders login form with email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('パスワードを入力')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ログイン/i })
    ).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /ログイン/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
      expect(screen.getByText('パスワードは必須です')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    // Enter invalid email and valid password to trigger only email validation
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'validpassword')
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(
          screen.getByText('有効なメールアドレスを入力してください')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('validates password length', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')

    const submitButton = screen.getByRole('button', { name: /ログイン/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('パスワードは6文字以上で入力してください')
      ).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const toggleButton = screen.getByRole('button', {
      name: /パスワードを表示/i,
    })

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('calls signIn with correct credentials on valid submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({})

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({})

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to custom path when redirectTo prop is provided', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({})

    render(<LoginForm redirectTo="/admin" />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('calls onSuccess callback when provided', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = jest.fn()
    mockSignIn.mockResolvedValue({})

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: unknown) => void
    const signInPromise = new Promise<unknown>((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    resolveSignIn!(undefined)

    await waitFor(() => {
      expect(screen.queryByText('ログイン中...')).not.toBeInTheDocument()
    })
  })

  it('disables form fields during submission', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: unknown) => void
    const signInPromise = new Promise<unknown>((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })
    const toggleButton = screen.getByRole('button', {
      name: /パスワードを表示/i,
    })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(toggleButton).toBeDisabled()

    resolveSignIn!(undefined)

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled()
    })
  })

  it('handles sign in exceptions gracefully', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(
          'ログインに失敗しました。しばらく時間をおいてから再度お試しください。'
        )
      ).toBeInTheDocument()
    })
  })
})
