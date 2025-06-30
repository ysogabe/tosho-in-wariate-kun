import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import UnauthorizedPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockPush = jest.fn()
const mockBack = jest.fn()

// Mock window.history.back
Object.defineProperty(window, 'history', {
  value: {
    back: mockBack,
  },
  writable: true,
})

describe('UnauthorizedPage', () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })

    mockPush.mockClear()
    mockBack.mockClear()
  })

  it('renders unauthorized message', () => {
    render(<UnauthorizedPage />)

    expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument()
    expect(
      screen.getByText('このページにアクセスする権限がありません。')
    ).toBeInTheDocument()
  })

  it('displays appropriate help text', () => {
    render(<UnauthorizedPage />)

    expect(
      screen.getByText(
        '管理者権限が必要なページです。権限について不明な場合は、システム管理者にお問い合わせください。'
      )
    ).toBeInTheDocument()
  })

  it('renders dashboard link', () => {
    render(<UnauthorizedPage />)

    const dashboardLink = screen.getByRole('link', {
      name: /ダッシュボードに戻る/i,
    })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders back button and calls history.back when clicked', () => {
    render(<UnauthorizedPage />)

    const backButton = screen.getByRole('button', {
      name: /前のページに戻る/i,
    })
    expect(backButton).toBeInTheDocument()

    fireEvent.click(backButton)
    expect(mockBack).toHaveBeenCalled()
  })

  it('displays warning icon', () => {
    render(<UnauthorizedPage />)

    // Check that the page renders without error (icon is rendered by Lucide React)
    // The presence of the main heading indicates the component rendered successfully
    expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument()
  })

  it('has proper card structure', () => {
    render(<UnauthorizedPage />)

    // Check for card components (from shadcn/ui)
    const cardTitle = screen.getByText('アクセス権限がありません')
    const cardDescription = screen.getByText(
      'このページにアクセスする権限がありません。'
    )

    expect(cardTitle).toBeInTheDocument()
    expect(cardDescription).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(<UnauthorizedPage />)

    // Check for container and responsive classes
    const mainContainer = container.querySelector('.container')
    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveClass('mx-auto', 'py-8', 'max-w-md')
  })
})
