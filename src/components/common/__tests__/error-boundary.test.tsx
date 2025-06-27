import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
} from '../error-boundary'

// Mock react-error-boundary
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children, FallbackComponent, onError }: any) => {
    const [hasError, setHasError] = React.useState(false)
    const [error] = React.useState(new Error('Test error message'))

    React.useEffect(() => {
      // Simulate error condition for testing
      if (children?.props?.shouldThrow) {
        setHasError(true)
        onError?.(error, { componentStack: 'test stack' })
      }
    }, [children?.props?.shouldThrow, error, onError])

    if (hasError && FallbackComponent) {
      return React.createElement(FallbackComponent, {
        error,
        resetErrorBoundary: () => setHasError(false),
      })
    }

    return children
  },
}))

// Mock component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    return <div data-testid="error-trigger">Error component</div>
  }
  return <div>No error</div>
}

// Access mock from jest.setup.js
const mockReload = (global as any).mockReload

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReload.mockClear()
    // Suppress error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error fallback when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
    expect(screen.getByText('申し訳ございません')).toBeInTheDocument()
    expect(
      screen.getByText(
        '予期しないエラーが発生しました。ページを再読み込みして再試行してください。'
      )
    ).toBeInTheDocument()
  })

  it('shows retry and reload buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ページを再読み込み/ })
    ).toBeInTheDocument()
  })

  it.skip('calls window.location.reload when reload button is clicked', () => {
    // Mock window.location.reload for this test
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', {
      name: /ページを再読み込み/,
    })
    fireEvent.click(reloadButton)

    expect(mockReload).toHaveBeenCalledTimes(1)
  })

  it('calls onError callback when error occurs', () => {
    const mockOnError = jest.fn()

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  it('shows error details in development environment', () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('詳細を表示（開発環境）')).toBeInTheDocument()

    // Restore original environment
    ;(process.env as any).NODE_ENV = originalEnv
  })

  it('hides error details in production environment', () => {
    const originalEnv = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('詳細を表示（開発環境）')).not.toBeInTheDocument()

    // Restore original environment
    ;(process.env as any).NODE_ENV = originalEnv
  })
})

describe('PageErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders full-screen error layout', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    )

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()

    // Check for full-screen styling class
    const container = screen
      .getByText('エラーが発生しました')
      .closest('.min-h-screen')
    expect(container).toBeInTheDocument()
  })
})

describe('ComponentErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders component-level error layout', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('コンポーネントエラー')).toBeInTheDocument()
    expect(
      screen.getByText('このコンポーネントの読み込みに失敗しました。')
    ).toBeInTheDocument()
  })

  it('has retry button in component error boundary', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument()
  })
})
