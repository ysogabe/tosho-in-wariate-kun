import { render, screen } from '@testing-library/react'
import { PageLayout } from '../page-layout'
import { Button } from '@/components/ui/button'

describe('PageLayout', () => {
  const defaultProps = {
    title: 'テストページ',
    children: <div>テストコンテンツ</div>,
  }

  it('renders title correctly', () => {
    render(<PageLayout {...defaultProps} />)

    expect(screen.getByRole('heading', { name: 'テストページ' })).toBeInTheDocument()
  })

  it('renders children content', () => {
    render(<PageLayout {...defaultProps} />)

    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <PageLayout {...defaultProps} description="ページの説明文です" />
    )

    expect(screen.getByText('ページの説明文です')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<PageLayout {...defaultProps} />)

    expect(screen.queryByText('ページの説明文です')).not.toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    const actions = (
      <Button data-testid="test-action">テストアクション</Button>
    )

    render(<PageLayout {...defaultProps} actions={actions} />)

    expect(screen.getByTestId('test-action')).toBeInTheDocument()
  })

  it('does not render actions when not provided', () => {
    render(<PageLayout {...defaultProps} />)

    expect(screen.queryByTestId('test-action')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <PageLayout {...defaultProps} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper semantic structure', () => {
    render(<PageLayout {...defaultProps} />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})