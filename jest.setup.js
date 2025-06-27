// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  AnimatePresence: ({ children }) => children,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}))

// Mock lucide-react icons to avoid rendering issues
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'),
  Loader2: ({ className, ...props }) => <div className={className} data-testid="loader2-icon" aria-hidden="true" {...props}>Loading</div>,
  AlertCircle: ({ className, ...props }) => <div className={className} data-testid="alert-circle-icon" aria-hidden="true" {...props}>Alert</div>,
  RefreshCw: ({ className, ...props }) => <div className={className} data-testid="refresh-icon" aria-hidden="true" {...props}>Refresh</div>,
  ChevronLeft: ({ className, ...props }) => <div className={className} data-testid="chevron-left-icon" aria-hidden="true" {...props}>Left</div>,
  ChevronRight: ({ className, ...props }) => <div className={className} data-testid="chevron-right-icon" aria-hidden="true" {...props}>Right</div>,
  ChevronsLeft: ({ className, ...props }) => <div className={className} data-testid="chevrons-left-icon" aria-hidden="true" {...props}>First</div>,
  ChevronsRight: ({ className, ...props }) => <div className={className} data-testid="chevrons-right-icon" aria-hidden="true" {...props}>Last</div>,
  Trash2: ({ className, ...props }) => <div className={className} data-testid="trash-icon" aria-hidden="true" {...props}>Delete</div>,
  AlertTriangle: ({ className, ...props }) => <div className={className} data-testid="warning-icon" aria-hidden="true" {...props}>Warning</div>,
  Plus: ({ className, ...props }) => <div className={className} data-testid="plus-icon" aria-hidden="true" {...props}>Add</div>,
  Edit: ({ className, ...props }) => <div className={className} data-testid="edit-icon" aria-hidden="true" {...props}>Edit</div>,
  Save: ({ className, ...props }) => <div className={className} data-testid="save-icon" aria-hidden="true" {...props}>Save</div>,
  CheckCircle: ({ className, ...props }) => <div className={className} data-testid="check-circle-icon" aria-hidden="true" {...props}>Success</div>,
  XCircle: ({ className, ...props }) => <div className={className} data-testid="x-circle-icon" aria-hidden="true" {...props}>Error</div>,
  Info: ({ className, ...props }) => <div className={className} data-testid="info-icon" aria-hidden="true" {...props}>Info</div>,
  Book: ({ className, ...props }) => <div className={className} data-testid="book-icon" aria-hidden="true" {...props}>Book</div>,
  Calendar: ({ className, ...props }) => <div className={className} data-testid="calendar-icon" aria-hidden="true" {...props}>Calendar</div>,
  Clock: ({ className, ...props }) => <div className={className} data-testid="clock-icon" aria-hidden="true" {...props}>Clock</div>,
  GraduationCap: ({ className, ...props }) => <div className={className} data-testid="graduation-cap-icon" aria-hidden="true" {...props}>School</div>,
  LayoutDashboard: ({ className, ...props }) => <div className={className} data-testid="dashboard-icon" aria-hidden="true" {...props}>Dashboard</div>,
  Settings: ({ className, ...props }) => <div className={className} data-testid="settings-icon" aria-hidden="true" {...props}>Settings</div>,
  Users: ({ className, ...props }) => <div className={className} data-testid="users-icon" aria-hidden="true" {...props}>Users</div>,
  Check: ({ className, ...props }) => <div className={className} data-testid="check-icon" aria-hidden="true" {...props}>Check</div>,
  ChevronDown: ({ className, ...props }) => <div className={className} data-testid="chevron-down-icon" aria-hidden="true" {...props}>Down</div>,
  ChevronUp: ({ className, ...props }) => <div className={className} data-testid="chevron-up-icon" aria-hidden="true" {...props}>Up</div>,
  X: ({ className, ...props }) => <div className={className} data-testid="x-icon" aria-hidden="true" {...props}>X</div>,
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock @radix-ui/* components to avoid portal and DOM issues in tests
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }) => open ? children : null,
  Trigger: ({ children }) => children,
  Portal: ({ children }) => children,
  Overlay: ({ children }) => children,
  Content: ({ children }) => children,
  Header: ({ children }) => children,
  Footer: ({ children }) => children,
  Title: ({ children }) => children,
  Description: ({ children }) => children,
}))

jest.mock('@radix-ui/react-select', () => ({
  __esModule: true,
  Root: ({ children }) => children,
  Trigger: ({ children }) => children,
  Content: ({ children }) => children,
  Item: ({ children }) => children,
  Value: ({ children }) => children,
  ScrollUpButton: { displayName: 'ScrollUpButton' },
  ScrollDownButton: { displayName: 'ScrollDownButton' },
  Viewport: { displayName: 'Viewport' },
}))

// Mock react-error-boundary
jest.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children, FallbackComponent, onError }) => {
    try {
      return children
    } catch (error) {
      if (onError) onError(error)
      return FallbackComponent ? FallbackComponent({ error }) : null
    }
  },
}))

// Mock window.location.reload for error boundary tests - keep it simple
global.mockReload = jest.fn()