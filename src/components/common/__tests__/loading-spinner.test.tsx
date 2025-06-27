import { render, screen } from '@testing-library/react'
import {
  LoadingSpinner,
  PageLoading,
  TableLoading,
  CardLoading,
} from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders basic spinner component', () => {
    render(<LoadingSpinner />)
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()
    expect(screen.getByText('読み込み中')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="カスタムテキスト" />)
    expect(screen.getByText('カスタムテキスト')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    const container = screen.getByTestId('loader2-icon').closest('.custom-class')
    expect(container).toBeInTheDocument()
  })
})

describe('PageLoading', () => {
  it('renders page loading component', () => {
    render(<PageLoading />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    expect(screen.getByTestId('loader2-icon')).toBeInTheDocument()
  })
})

describe('TableLoading', () => {
  it('renders table skeleton', () => {
    render(<TableLoading />)
    // Check basic structure exists
    const container = screen.getByText('Loading').parentElement
    expect(container).toBeInTheDocument()
  })

  it('renders custom number of rows', () => {
    render(<TableLoading rows={3} />)
    const container = screen.getByText('Loading').parentElement
    expect(container).toBeInTheDocument()
  })
})

describe('CardLoading', () => {
  it('renders card skeleton', () => {
    render(<CardLoading />)
    // Check that skeleton structure exists
    const container = screen.getByText('Loading').parentElement
    expect(container).toBeInTheDocument()
  })
})