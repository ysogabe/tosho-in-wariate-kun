import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { EnhancedLoginForm } from '../enhanced-login-form'
import { useAuth } from '@/lib/auth/auth-context'

// Mock dependencies
jest.mock('@/lib/auth/auth-context')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockSignIn = jest.fn()
const mockPush = jest.fn()
const mockGet = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

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

  const mockSearchParams = {
    get: mockGet,
  } as unknown as URLSearchParams
  mockUseSearchParams.mockReturnValue(mockSearchParams as any)

  mockSignIn.mockClear()
  mockPush.mockClear()
  mockGet.mockClear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()

  // Default localStorage to return null (no saved credentials)
  localStorageMock.getItem.mockReturnValue(null)
})

describe('EnhancedLoginForm', () => {
  it('renders enhanced login form with all fields', () => {
    mockGet.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('パスワードを入力')).toBeInTheDocument()
    expect(screen.getByLabelText('ログイン情報を保存')).toBeInTheDocument()
    expect(screen.getByText('パスワードを忘れた場合')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ログイン/i })
    ).toBeInTheDocument()
  })

  it('displays error message from URL parameter', () => {
    mockGet.mockImplementation((param) => {
      if (param === 'error') return 'unauthorized'
      return null
    })

    render(<EnhancedLoginForm />)

    expect(
      screen.getByText('セッションが期限切れです。再度ログインしてください。')
    ).toBeInTheDocument()
  })

  it('displays forbidden error message from URL parameter', () => {
    mockGet.mockImplementation((param) => {
      if (param === 'error') return 'forbidden'
      return null
    })

    render(<EnhancedLoginForm />)

    expect(
      screen.getByText('このページにアクセスする権限がありません。')
    ).toBeInTheDocument()
  })

  it('displays redirect notice when redirectTo is not dashboard', () => {
    mockGet.mockImplementation((param) => {
      if (param === 'redirectTo') return '/admin'
      return null
    })

    render(<EnhancedLoginForm />)

    expect(
      screen.getByText('ログイン後、元のページに戻ります。')
    ).toBeInTheDocument()
  })

  it('restores saved login information from localStorage', () => {
    mockGet.mockReturnValue(null)
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'savedEmail') return 'saved@example.com'
      if (key === 'rememberMe') return 'true'
      return null
    })

    render(<EnhancedLoginForm />)

    expect(screen.getByDisplayValue('saved@example.com')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /ログイン情報を保存/i })
    ).toBeChecked()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)

    render(<EnhancedLoginForm />)

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

  it('submits form with valid credentials and redirects', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})
    // Ensure no saved credentials
    localStorageMock.getItem.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.clear(emailInput) // Clear any existing value
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('redirects to custom path when redirectTo is specified', async () => {
    const user = userEvent.setup()
    mockGet.mockImplementation((param) => {
      if (param === 'redirectTo') return '/admin'
      return null
    })
    mockSignIn.mockResolvedValue({})
    // Ensure no saved credentials
    localStorageMock.getItem.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.clear(emailInput) // Clear any existing value
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('saves login information to localStorage when remember me is checked', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const rememberCheckbox = screen.getByLabelText('ログイン情報を保存')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(rememberCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'savedEmail',
        'test@example.com'
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rememberMe',
        'true'
      )
    })
  })

  it('removes login information from localStorage when remember me is not checked', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({})

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('savedEmail')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberMe')
    })
  })

  it('displays localized error message on login failure', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' })

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'WrongPassword123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスまたはパスワードが正しくありません。')
      ).toBeInTheDocument()
    })
  })

  it('handles password forgot click', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    const forgotButton = screen.getByText('パスワードを忘れた場合')
    await user.click(forgotButton)

    expect(
      screen.getByText('パスワードの再設定は管理者にお問い合わせください。')
    ).toBeInTheDocument()
  })

  it('shows demo login info in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    })
    mockGet.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    expect(screen.getByText('開発用ログイン情報:')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Password123')).toBeInTheDocument()
    expect(screen.getByText('デモ用情報を入力')).toBeInTheDocument()

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('fills demo login info when demo button is clicked', async () => {
    const user = userEvent.setup()
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    })
    mockGet.mockReturnValue(null)

    render(<EnhancedLoginForm />)

    const demoButton = screen.getByText('デモ用情報を入力')
    await user.click(demoButton)

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Password123')).toBeInTheDocument()

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true,
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockGet.mockReturnValue(null)
    let resolveSignIn: () => void
    const signInPromise = new Promise<void>((resolve) => {
      resolveSignIn = resolve
    })
    mockSignIn.mockReturnValue(signInPromise)

    render(<EnhancedLoginForm />)

    const emailInput = screen.getByLabelText('メールアドレス')
    const passwordInput = screen.getByPlaceholderText('パスワードを入力')
    const submitButton = screen.getByRole('button', { name: /ログイン/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.click(submitButton)

    expect(screen.getByText('ログイン中...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    resolveSignIn!()

    await waitFor(() => {
      expect(screen.queryByText('ログイン中...')).not.toBeInTheDocument()
    })
  })
})
