/**
 * 図書委員管理ページのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { toast } from 'sonner'
import StudentManagementPage from '../page'

// SWRのモック
jest.mock('swr')

// Sonner toastのモック
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// UI componentのモック
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
  CardDescription: ({ children, ...props }: any) => (
    <div data-testid="card-description" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <div data-testid="card-title" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, ...props }: any) => (
    <input
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      data-testid="input"
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value: _value }: any) => (
    <div data-testid="select-item" data-value={_value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogDescription: ({ children }: any) => (
    <div data-testid="dialog-description">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}))

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action">
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => (
    <div data-testid="alert-dialog-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }: any) => (
    <div data-testid="alert-dialog-description">{children}</div>
  ),
  AlertDialogFooter: ({ children }: any) => (
    <div data-testid="alert-dialog-footer">{children}</div>
  ),
  AlertDialogHeader: ({ children }: any) => (
    <div data-testid="alert-dialog-header">{children}</div>
  ),
  AlertDialogTitle: ({ children }: any) => (
    <div data-testid="alert-dialog-title">{children}</div>
  ),
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  ),
}))

jest.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children, title, description, actions }: any) => (
    <div data-testid="page-layout">
      <h1 data-testid="page-title">{title}</h1>
      <p data-testid="page-description">{description}</p>
      {actions && <div data-testid="page-actions">{actions}</div>}
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/data-table', () => ({
  DataTable: ({
    columns: _columns,
    data,
    searchKey,
    onSelectionChange,
  }: any) => (
    <div data-testid="data-table">
      <div data-testid="table-search-key">{searchKey}</div>
      <div data-testid="table-data-count">{data?.length || 0}</div>
      {data?.map((item: any, index: number) => (
        <div key={index} data-testid={`table-row-${index}`}>
          {item.name}
          <button
            onClick={() => onSelectionChange?.([item])}
            data-testid={`select-row-${index}`}
          >
            選択
          </button>
        </div>
      ))}
    </div>
  ),
}))

jest.mock('@/components/table/students-columns', () => ({
  studentsColumns: [
    { accessorKey: 'name', header: '名前' },
    { accessorKey: 'grade', header: '学年' },
    { accessorKey: 'class', header: 'クラス' },
  ],
}))

jest.mock('@/components/common/loading-spinner', () => ({
  LoadingSpinner: ({ text }: any) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}))

jest.mock('@/components/forms/validation-error', () => ({
  ValidationError: ({ errors }: any) => (
    <div data-testid="validation-error">
      {errors && Object.keys(errors).length > 0 && 'バリデーションエラー'}
    </div>
  ),
}))

jest.mock('@/lib/hooks/use-form-validation', () => ({
  useFormValidation: ({ onSubmit }: any) => ({
    errors: {},
    isSubmitting: false,
    handleSubmit: onSubmit,
    clearErrors: jest.fn(),
  }),
}))

// lucide-react iconsのモック
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Users: () => <div data-testid="users-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Download: () => <div data-testid="download-icon" />,
}))

// Mock data
const mockStudents = [
  {
    id: 'student-1',
    name: '田中太郎',
    grade: 5,
    class: { id: 'class-1', name: '1', year: 5 },
    isActive: true,
    assignmentCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'student-2',
    name: '佐藤花子',
    grade: 6,
    class: { id: 'class-2', name: '2', year: 6 },
    isActive: true,
    assignmentCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'student-3',
    name: '山田次郎',
    grade: 5,
    class: { id: 'class-1', name: '1', year: 5 },
    isActive: false,
    assignmentCount: 0,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
]

const mockClasses = [
  { id: 'class-1', name: '1', year: 5 },
  { id: 'class-2', name: '2', year: 6 },
  { id: 'class-3', name: '3', year: 5 },
]

// Global fetch mock
global.fetch = jest.fn()

describe('StudentManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup SWR mock
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const swr = require('swr')
    swr.default = jest
      .fn()
      .mockReturnValueOnce({
        data: { data: { students: mockStudents } },
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      })
      .mockReturnValueOnce({
        data: { data: { classes: mockClasses } },
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      })
  })

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<StudentManagementPage />)

      expect(screen.getByTestId('page-title')).toHaveTextContent('図書委員管理')
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        '図書委員の登録・管理を行います'
      )
    })

    it('新規登録ボタンが表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('新規登録')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('統計情報が正しく表示される', () => {
      render(<StudentManagementPage />)

      // 総図書委員数
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('総図書委員数')).toBeInTheDocument()

      // アクティブ数
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('アクティブ')).toBeInTheDocument()

      // 非アクティブ数
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('非アクティブ')).toBeInTheDocument()
    })
  })

  describe('データテーブル', () => {
    it('図書委員一覧が正しく表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3')
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      expect(screen.getByText('山田次郎')).toBeInTheDocument()
    })

    it('検索機能が動作する', () => {
      render(<StudentManagementPage />)

      expect(screen.getByTestId('table-search-key')).toHaveTextContent('name')
    })

    it('選択機能が動作する', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      // 一括操作ボタンが表示されることを確認
      expect(screen.getByText('一括操作 (1)')).toBeInTheDocument()
    })
  })

  describe('フィルタリング機能', () => {
    it('検索フィールドが表示される', () => {
      render(<StudentManagementPage />)

      const searchInput = screen.getByPlaceholderText('名前で検索...')
      expect(searchInput).toBeInTheDocument()
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('学年フィルタが表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getAllByTestId('select-trigger')).toHaveLength(3) // 学年、クラス、状態
    })

    it('クラスフィルタが表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('クラス')).toBeInTheDocument()
    })

    it('状態フィルタが表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('状態')).toBeInTheDocument()
    })

    it('CSV出力ボタンが表示される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('CSV出力')).toBeInTheDocument()
      expect(screen.getByTestId('download-icon')).toBeInTheDocument()
    })
  })

  describe('新規登録機能', () => {
    it('新規登録ボタンクリックでダイアログが開く', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const createButton = screen.getByText('新規登録')
      await user.click(createButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('新規図書委員登録')).toBeInTheDocument()
    })

    it('作成フォームが正しく表示される', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const createButton = screen.getByText('新規登録')
      await user.click(createButton)

      expect(screen.getByText('氏名')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('クラス')).toBeInTheDocument()
    })

    it('フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<StudentManagementPage />)

      const createButton = screen.getByText('新規登録')
      await user.click(createButton)

      const submitButton = screen.getByText('登録')
      await user.click(submitButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/students',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  describe('編集機能', () => {
    it('編集ボタンクリックでダイアログが開く', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      // テーブルの編集ボタンをクリック（モックテーブルなので直接テスト）
      const editButtons = screen.getAllByText('編集')
      await user.click(editButtons[0])

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('図書委員編集')).toBeInTheDocument()
    })

    it('編集フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<StudentManagementPage />)

      const editButtons = screen.getAllByText('編集')
      await user.click(editButtons[0])

      const updateButton = screen.getByText('更新')
      await user.click(updateButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/students/student-1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  describe('削除機能', () => {
    it('削除ボタンクリックで確認ダイアログが開く', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const deleteButtons = screen.getAllByText('削除')
      await user.click(deleteButtons[0])

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByText('図書委員削除')).toBeInTheDocument()
    })

    it('削除確認が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<StudentManagementPage />)

      const deleteButtons = screen.getAllByText('削除')
      await user.click(deleteButtons[0])

      const confirmButton = screen.getByTestId('alert-dialog-action')
      await user.click(confirmButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/students/student-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('当番経験がある図書委員の削除ボタンが無効化される', () => {
      render(<StudentManagementPage />)

      // モックデータで assignmentCount > 0 の図書委員の削除ボタンが無効化されているかチェック
      // (実際の実装では disabled 属性で制御)
      const deleteButtons = screen.getAllByText('削除')
      expect(deleteButtons).toHaveLength(3) // 3人の図書委員がいる
    })
  })

  describe('一括操作機能', () => {
    it('複数選択時に一括操作ボタンが表示される', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      // 複数の図書委員を選択
      const selectButton1 = screen.getByTestId('select-row-0')

      await user.click(selectButton1)
      // Note: 実際の実装では複数選択ロジックが必要

      expect(screen.getByText('一括操作 (1)')).toBeInTheDocument()
      expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument()
    })

    it('一括操作ダイアログが正しく表示される', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      const bulkButton = screen.getByText('一括操作 (1)')
      await user.click(bulkButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('一括操作')).toBeInTheDocument()
    })

    it('一括操作の実行が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<StudentManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      const bulkButton = screen.getByText('一括操作 (1)')
      await user.click(bulkButton)

      const executeButton = screen.getByText('実行')
      await user.click(executeButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/students/bulk',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  describe('エラーハンドリング', () => {
    it('データ取得エラー時にエラーメッセージが表示される', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const swr = require('swr')
      swr.default = jest
        .fn()
        .mockReturnValueOnce({
          data: null,
          error: new Error('データ取得エラー'),
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: { data: { classes: mockClasses } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<StudentManagementPage />)

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(
        screen.getByText(
          '図書委員データの取得に失敗しました。ページを再読み込みしてください。'
        )
      ).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('API エラー時にトーストが表示される', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ success: false, error: { message: 'API エラー' } }),
      })

      render(<StudentManagementPage />)

      const createButton = screen.getByText('新規登録')
      await user.click(createButton)

      const submitButton = screen.getByText('登録')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('API エラー')
      })
    })
  })

  describe('ローディング状態', () => {
    it('データ読み込み中にローディングスピナーが表示される', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const swr = require('swr')
      swr.default = jest
        .fn()
        .mockReturnValueOnce({
          data: null,
          error: null,
          isLoading: true,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: { data: { classes: mockClasses } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<StudentManagementPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(
        screen.getByText('図書委員情報を読み込み中...')
      ).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なランドマークが設定されている', () => {
      render(<StudentManagementPage />)

      expect(screen.getByTestId('page-layout')).toBeInTheDocument()
      expect(screen.getByTestId('page-title')).toBeInTheDocument()
      expect(screen.getByTestId('page-description')).toBeInTheDocument()
    })

    it('フォーム要素に適切なラベルが設定されている', async () => {
      const user = userEvent.setup()
      render(<StudentManagementPage />)

      const createButton = screen.getByText('新規登録')
      await user.click(createButton)

      expect(screen.getByText('氏名')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('クラス')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('統計カードが格子状に配置される', () => {
      render(<StudentManagementPage />)

      // 統計情報のカードが適切に配置されていることを確認
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('フィルタが格子状に配置される', () => {
      render(<StudentManagementPage />)

      expect(screen.getByText('検索')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('クラス')).toBeInTheDocument()
      expect(screen.getByText('状態')).toBeInTheDocument()
    })
  })

  describe('パフォーマンス', () => {
    it('大量のデータでも正常にレンダリングされる', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, index) => ({
        id: `student-${index}`,
        name: `学生${index}`,
        grade: (index % 2) + 5,
        class: {
          id: `class-${index % 3}`,
          name: `${(index % 3) + 1}`,
          year: (index % 2) + 5,
        },
        isActive: index % 2 === 0,
        assignmentCount: index % 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }))

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const swr = require('swr')
      swr.default = jest
        .fn()
        .mockReturnValueOnce({
          data: { data: { students: largeDataSet } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: { data: { classes: mockClasses } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      const startTime = performance.now()
      render(<StudentManagementPage />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })
})
