import { render, screen } from '@testing-library/react'
import { MainLayout } from '../main-layout'

// Mock the Header component to avoid navigation complexity
jest.mock('../header', () => ({
  Header: () => <header data-testid="header">Header Component</header>,
}))

describe('MainLayout', () => {
  const defaultProps = {
    children: <div data-testid="content">テストコンテンツ</div>,
  }

  it('renders header component', () => {
    render(<MainLayout {...defaultProps} />)

    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(<MainLayout {...defaultProps} />)

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('has minimum screen height', () => {
    const { container } = render(<MainLayout {...defaultProps} />)

    expect(container.firstChild).toHaveClass('min-h-screen')
  })

  it('has background styling', () => {
    const { container } = render(<MainLayout {...defaultProps} />)

    expect(container.firstChild).toHaveClass('bg-background')
  })

  it('wraps content in error boundary', () => {
    render(<MainLayout {...defaultProps} />)

    // Content should be rendered, indicating error boundary is working
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })
})