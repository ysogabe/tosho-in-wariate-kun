// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom'

// Test environment setup
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'file:./test.db'

// Mock Prisma Client for unit tests
jest.mock('@/lib/database/client', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    class: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

// Mock test data utilities
global.testData = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      name: '管理者',
      role: 'ADMIN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '2',
      email: 'user@example.com',
      name: '一般ユーザー',
      role: 'USER',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
  classes: [
    {
      id: '1',
      name: '1組',
      grade: 1,
      year: 2024,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '2',
      name: '2組',
      grade: 1,
      year: 2024,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
  students: [
    {
      id: '1',
      name: '佐藤太郎',
      studentNumber: '101001',
      classId: '1',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '2',
      name: '田中花子',
      studentNumber: '101002',
      classId: '1',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
  rooms: [
    {
      id: '1',
      name: '図書室A',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '2',
      name: '図書室B',
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
  assignments: [
    {
      id: '1',
      studentId: '1',
      roomId: '1',
      date: new Date('2024-04-01T00:00:00Z'),
      term: 'FIRST',
      year: 2024,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
}

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
  Loader2: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="loader2-icon"
      aria-hidden="true"
      {...props}
    >
      Loading
    </div>
  ),
  AlertCircle: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="alert-circle-icon"
      aria-hidden="true"
      {...props}
    >
      Alert
    </div>
  ),
  RefreshCw: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="refresh-icon"
      aria-hidden="true"
      {...props}
    >
      Refresh
    </div>
  ),
  ChevronLeft: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevron-left-icon"
      aria-hidden="true"
      {...props}
    >
      Left
    </div>
  ),
  ChevronRight: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevron-right-icon"
      aria-hidden="true"
      {...props}
    >
      Right
    </div>
  ),
  ChevronsLeft: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevrons-left-icon"
      aria-hidden="true"
      {...props}
    >
      First
    </div>
  ),
  ChevronsRight: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevrons-right-icon"
      aria-hidden="true"
      {...props}
    >
      Last
    </div>
  ),
  Trash2: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="trash-icon"
      aria-hidden="true"
      {...props}
    >
      Delete
    </div>
  ),
  AlertTriangle: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="warning-icon"
      aria-hidden="true"
      {...props}
    >
      Warning
    </div>
  ),
  Plus: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="plus-icon"
      aria-hidden="true"
      {...props}
    >
      Add
    </div>
  ),
  Edit: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="edit-icon"
      aria-hidden="true"
      {...props}
    >
      Edit
    </div>
  ),
  Save: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="save-icon"
      aria-hidden="true"
      {...props}
    >
      Save
    </div>
  ),
  CheckCircle: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="check-circle-icon"
      aria-hidden="true"
      {...props}
    >
      Success
    </div>
  ),
  XCircle: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="x-circle-icon"
      aria-hidden="true"
      {...props}
    >
      Error
    </div>
  ),
  Info: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="info-icon"
      aria-hidden="true"
      {...props}
    >
      Info
    </div>
  ),
  Book: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="book-icon"
      aria-hidden="true"
      {...props}
    >
      Book
    </div>
  ),
  Calendar: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="calendar-icon"
      aria-hidden="true"
      {...props}
    >
      Calendar
    </div>
  ),
  Clock: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="clock-icon"
      aria-hidden="true"
      {...props}
    >
      Clock
    </div>
  ),
  GraduationCap: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="graduation-cap-icon"
      aria-hidden="true"
      {...props}
    >
      School
    </div>
  ),
  LayoutDashboard: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="dashboard-icon"
      aria-hidden="true"
      {...props}
    >
      Dashboard
    </div>
  ),
  Settings: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="settings-icon"
      aria-hidden="true"
      {...props}
    >
      Settings
    </div>
  ),
  Users: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="users-icon"
      aria-hidden="true"
      {...props}
    >
      Users
    </div>
  ),
  Check: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="check-icon"
      aria-hidden="true"
      {...props}
    >
      Check
    </div>
  ),
  ChevronDown: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevron-down-icon"
      aria-hidden="true"
      {...props}
    >
      Down
    </div>
  ),
  ChevronUp: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="chevron-up-icon"
      aria-hidden="true"
      {...props}
    >
      Up
    </div>
  ),
  X: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="x-icon"
      aria-hidden="true"
      {...props}
    >
      X
    </div>
  ),
  BarChart3: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="bar-chart-icon"
      aria-hidden="true"
      {...props}
    >
      Chart
    </div>
  ),
  Download: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="download-icon"
      aria-hidden="true"
      {...props}
    >
      Download
    </div>
  ),
  Search: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="search-icon"
      aria-hidden="true"
      {...props}
    >
      Search
    </div>
  ),
  MoreHorizontal: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="more-horizontal-icon"
      aria-hidden="true"
      {...props}
    >
      More
    </div>
  ),
  ArrowUpDown: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="arrow-up-down-icon"
      aria-hidden="true"
      {...props}
    >
      Sort
    </div>
  ),
  ArrowLeft: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="arrow-left-icon"
      aria-hidden="true"
      {...props}
    >
      Back
    </div>
  ),
  BookOpen: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="book-open-icon"
      aria-hidden="true"
      {...props}
    >
      Open Book
    </div>
  ),
  Circle: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="circle-icon"
      aria-hidden="true"
      {...props}
    >
      Circle
    </div>
  ),
  Eye: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="eye-icon"
      aria-hidden="true"
      {...props}
    >
      Show
    </div>
  ),
  EyeOff: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="eye-off-icon"
      aria-hidden="true"
      {...props}
    >
      Hide
    </div>
  ),
  FileText: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="file-text-icon"
      aria-hidden="true"
      {...props}
    >
      File
    </div>
  ),
  Home: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="home-icon"
      aria-hidden="true"
      {...props}
    >
      Home
    </div>
  ),
  LogIn: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="log-in-icon"
      aria-hidden="true"
      {...props}
    >
      Login
    </div>
  ),
  LogOut: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="log-out-icon"
      aria-hidden="true"
      {...props}
    >
      Logout
    </div>
  ),
  MapPin: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="map-pin-icon"
      aria-hidden="true"
      {...props}
    >
      Location
    </div>
  ),
  Printer: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="printer-icon"
      aria-hidden="true"
      {...props}
    >
      Print
    </div>
  ),
  School: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="school-icon"
      aria-hidden="true"
      {...props}
    >
      School
    </div>
  ),
  Shield: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="shield-icon"
      aria-hidden="true"
      {...props}
    >
      Shield
    </div>
  ),
  User: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="user-icon"
      aria-hidden="true"
      {...props}
    >
      User
    </div>
  ),
  UserPlus: ({ className, ...props }) => (
    <div
      className={className}
      data-testid="user-plus-icon"
      aria-hidden="true"
      {...props}
    >
      Add User
    </div>
  ),
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

// Mock matchMedia only if window exists (for browser-like tests)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
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
}

// Mock @radix-ui/* components to avoid portal and DOM issues in tests
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open }) => (open ? children : null),
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

// Web API polyfills for Next.js API route testing
// Polyfill Request, Response, Headers for Jest environment
global.Request = class Request {
  constructor(url, options = {}) {
    this._url = url
    this._method = options.method || 'GET'
    this._headers = new Headers(options.headers || {})
    this._body = options.body || null
    this._cache = options.cache || 'default'
    this._credentials = options.credentials || 'same-origin'
    this._integrity = options.integrity || ''
    this._keepalive = options.keepalive || false
    this._mode = options.mode || 'cors'
    this._redirect = options.redirect || 'follow'
    this._referrer = options.referrer || 'about:client'
    this._referrerPolicy = options.referrerPolicy || ''
    this._signal = options.signal || null
  }
  
  get url() { return this._url }
  get method() { return this._method }
  get headers() { return this._headers }
  get body() { return this._body }
  get cache() { return this._cache }
  get credentials() { return this._credentials }
  get integrity() { return this._integrity }
  get keepalive() { return this._keepalive }
  get mode() { return this._mode }
  get redirect() { return this._redirect }
  get referrer() { return this._referrer }
  get referrerPolicy() { return this._referrerPolicy }
  get signal() { return this._signal }
  
  clone() {
    return new Request(this._url, {
      method: this._method,
      headers: this._headers,
      body: this._body,
      cache: this._cache,
      credentials: this._credentials,
      integrity: this._integrity,
      keepalive: this._keepalive,
      mode: this._mode,
      redirect: this._redirect,
      referrer: this._referrer,
      referrerPolicy: this._referrerPolicy,
      signal: this._signal
    })
  }
  
  json() {
    return Promise.resolve(this._body ? JSON.parse(this._body) : {})
  }
  
  text() {
    return Promise.resolve(this._body ? this._body.toString() : '')
  }
  
  formData() {
    return Promise.resolve(new FormData())
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body
    this.status = options.status || 200
    this.statusText = options.statusText || 'OK'
    this.headers = new Headers(options.headers || {})
    this.ok = this.status >= 200 && this.status < 300
    this.redirected = false
    this.type = 'basic'
    this.url = ''
  }
  
  clone() {
    return new Response(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers
    })
  }
  
  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : {})
  }
  
  text() {
    return Promise.resolve(this.body ? this.body.toString() : '')
  }
  
  formData() {
    return Promise.resolve(new FormData())
  }
  
  static json(data, options = {}) {
    return new Response(JSON.stringify(data), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }
  
  static error() {
    return new Response(null, { status: 500, statusText: 'Internal Server Error' })
  }
  
  static redirect(url, status = 302) {
    return new Response(null, {
      status,
      headers: { Location: url }
    })
  }
}

global.Headers = class Headers {
  constructor(init) {
    this.map = new Map()
    if (init) {
      if (typeof init === 'object') {
        for (const [key, value] of Object.entries(init)) {
          this.set(key, value)
        }
      }
    }
  }
  
  append(name, value) {
    const existing = this.map.get(name.toLowerCase())
    if (existing) {
      this.map.set(name.toLowerCase(), existing + ', ' + value)
    } else {
      this.map.set(name.toLowerCase(), value)
    }
  }
  
  delete(name) {
    this.map.delete(name.toLowerCase())
  }
  
  get(name) {
    return this.map.get(name.toLowerCase()) || null
  }
  
  has(name) {
    return this.map.has(name.toLowerCase())
  }
  
  set(name, value) {
    this.map.set(name.toLowerCase(), value)
  }
  
  entries() {
    return this.map.entries()
  }
  
  keys() {
    return this.map.keys()
  }
  
  values() {
    return this.map.values()
  }
  
  forEach(callback) {
    this.map.forEach(callback)
  }
}

// Mock fetch for Jest environment
global.fetch = jest.fn()

// Additional Web API polyfills for server-side components
global.URL = URL
global.URLSearchParams = URLSearchParams
