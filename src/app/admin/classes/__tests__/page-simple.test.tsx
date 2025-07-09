/**
 * クラス管理ページの簡単なテスト
 * エラーの原因を特定するため
 */

import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

// 簡単なモック
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: { data: { classes: [] } },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  })),
}))

// すべての依存関係をモック
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/hooks/use-form-validation', () => ({
  useFormValidation: () => ({
    errors: {},
    isSubmitting: false,
    handleSubmit: jest.fn(),
    clearErrors: jest.fn(),
  }),
}))

// 全てのUIコンポーネントをモック
jest.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children }: any) => (
    <div data-testid="page-layout">{children}</div>
  ),
}))

jest.mock('@/components/common/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/data-table', () => ({
  DataTable: () => <div data-testid="data-table">Table</div>,
}))

jest.mock('@/components/table/classes-columns', () => ({
  classesColumns: [],
}))

// 他の全ての依存関係をシンプルにモック
jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: any) => <button>{children}</button>,
}))

jest.mock('@/components/ui/input', () => ({
  Input: () => <input />,
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span>value</span>,
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children }: any) => <button>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: () => <input type="checkbox" />,
}))

jest.mock('@/components/forms/validation-error', () => ({
  ValidationError: () => <div>validation error</div>,
}))

jest.mock('lucide-react', () => ({
  Plus: () => <div>+</div>,
  Search: () => <div>search</div>,
  AlertTriangle: () => <div>!</div>,
  School: () => <div>school</div>,
  Users: () => <div>users</div>,
  Download: () => <div>download</div>,
  Settings: () => <div>settings</div>,
  CheckCircle: () => <div>check</div>,
  XCircle: () => <div>x</div>,
  BookOpen: () => <div>book</div>,
  Calendar: () => <div>calendar</div>,
}))

jest.mock('@/lib/schemas/class-schemas', () => ({
  CreateClassSchema: { parse: jest.fn() },
  UpdateClassSchema: { parse: jest.fn() },
}))

describe('ClassManagementPage Basic Test', () => {
  it.skip('should import and render without crashing', async () => {
    // Dynamic import to avoid hoisting issues
    const { default: ClassManagementPage } = await import('../page')

    const { container } = render(<ClassManagementPage />)
    expect(container).toBeInTheDocument()
  })
})
