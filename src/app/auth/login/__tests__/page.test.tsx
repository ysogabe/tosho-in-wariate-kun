import { render, screen } from '@testing-library/react'
import LoginPage from '../page'

// Mock the AuthGuard component
jest.mock('@/components/auth/auth-guard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))

// Mock the EnhancedLoginForm component
jest.mock('@/components/auth/enhanced-login-form', () => ({
  EnhancedLoginForm: () => (
    <div data-testid="enhanced-login-form">Enhanced Login Form</div>
  ),
}))

describe('LoginPage', () => {
  it('renders login page with header', () => {
    render(<LoginPage />)

    expect(screen.getByText('図書委員当番システム')).toBeInTheDocument()
    expect(screen.getByText('Library Committee Scheduler')).toBeInTheDocument()
  })

  it('renders system introduction section', () => {
    render(<LoginPage />)

    expect(screen.getByText('効率的な当番管理を')).toBeInTheDocument()
    expect(screen.getByText('自動化しませんか？')).toBeInTheDocument()
    expect(
      screen.getByText(
        '図書委員の当番表作成を自動化し、公平で効率的なスケジュール管理を実現します。'
      )
    ).toBeInTheDocument()
  })

  it('renders feature cards', () => {
    render(<LoginPage />)

    expect(screen.getByText('委員管理')).toBeInTheDocument()
    expect(screen.getByText('図書委員の情報を一元管理')).toBeInTheDocument()

    expect(screen.getByText('自動割り当て')).toBeInTheDocument()
    expect(screen.getByText('公平で最適な当番スケジュール')).toBeInTheDocument()

    expect(screen.getByText('統計表示')).toBeInTheDocument()
    expect(screen.getByText('当番状況を視覚的に確認')).toBeInTheDocument()

    expect(screen.getByText('印刷対応')).toBeInTheDocument()
    expect(screen.getByText('A4サイズで美しく印刷')).toBeInTheDocument()
  })

  it('renders login form section', () => {
    render(<LoginPage />)

    expect(screen.getByText('ログイン')).toBeInTheDocument()
    expect(
      screen.getByText('メールアドレスとパスワードでログインしてください')
    ).toBeInTheDocument()
    expect(screen.getByTestId('enhanced-login-form')).toBeInTheDocument()
  })

  it('renders footer with help text and links', () => {
    render(<LoginPage />)

    expect(
      screen.getByText(
        'ログインでお困りの場合は、システム管理者にお問い合わせください。'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument()
    expect(screen.getByText('利用規約')).toBeInTheDocument()
  })

  it('renders privacy policy and terms links with correct attributes', () => {
    render(<LoginPage />)

    const privacyLink = screen.getByRole('link', {
      name: 'プライバシーポリシー',
    })
    const termsLink = screen.getByRole('link', { name: '利用規約' })

    expect(privacyLink).toHaveAttribute('href', '/privacy')
    expect(termsLink).toHaveAttribute('href', '/terms')
  })

  it('has proper page structure with semantic HTML', () => {
    render(<LoginPage />)

    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument() // main
  })

  it('applies correct CSS classes for responsive design', () => {
    const { container } = render(<LoginPage />)

    // Check that the main container has responsive classes
    expect(container.querySelector('.lg\\:flex-row')).toBeInTheDocument()
    expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument()
  })

  it('has proper background gradient styling', () => {
    const { container } = render(<LoginPage />)

    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
    expect(container.querySelector('.from-blue-50')).toBeInTheDocument()
  })
})
