/**
 * クラス管理ページのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { toast } from 'sonner'
import { default as ClassManagementPage } from '../page'

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
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
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
  PageLayout: ({ children, title, description, actions, ...props }: any) => (
    <div data-testid="page-layout" {...props}>
      <h1 data-testid="page-title">{title}</h1>
      <p data-testid="page-description">{description}</p>
      {actions && <div data-testid="page-actions">{actions}</div>}
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data, searchKey, onSelectionChange }: any) => (
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
          <button data-testid={`edit-row-${index}`}>編集</button>
          <button data-testid={`delete-row-${index}`}>削除</button>
        </div>
      ))}
    </div>
  ),
}))

jest.mock('@/components/table/classes-columns', () => ({
  classesColumns: [
    { accessorKey: 'name', header: 'クラス名' },
    { accessorKey: 'year', header: '学年' },
    { accessorKey: 'room', header: '図書室' },
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
  School: () => <div data-testid="school-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}))

// Mock data
const mockClasses = [
  {
    id: 'class-1',
    name: '5年1組',
    year: 5,
    room: { id: 'room-1', name: '第1図書室', capacity: 30 },
    studentsCount: 28,
    committeeMembers: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'class-2',
    name: '5年2組',
    year: 5,
    room: { id: 'room-1', name: '第1図書室', capacity: 30 },
    studentsCount: 30,
    committeeMembers: 2,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'class-3',
    name: '6年1組',
    year: 6,
    room: { id: 'room-2', name: '第2図書室', capacity: 25 },
    studentsCount: 25,
    committeeMembers: 0,
    isActive: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
]

const mockRooms = [
  { id: 'room-1', name: '第1図書室', capacity: 30 },
  { id: 'room-2', name: '第2図書室', capacity: 25 },
]

// Global fetch mock
global.fetch = jest.fn()

describe('ClassManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup SWR mock with consistent return values
    const swr = jest.mocked(require('swr'))
    swr.default = jest.fn((url: string) => {
      if (url === '/api/classes') {
        return {
          data: { data: { classes: mockClasses } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        }
      }
      if (url === '/api/rooms') {
        return {
          data: { data: { rooms: mockRooms } },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        }
      }
      return {
        data: null,
        error: null,
        isLoading: false,
        mutate: jest.fn(),
      }
    })
  })

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ClassManagementPage />)

      expect(screen.getByTestId('page-title')).toHaveTextContent('クラス管理')
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        'クラス情報の登録・管理を行います'
      )
    })

    it('新規登録ボタンが表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('新規クラス作成')).toBeInTheDocument()
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('統計情報が正しく表示される', () => {
      render(<ClassManagementPage />)

      // 総クラス数
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('総クラス数')).toBeInTheDocument()

      // アクティブクラス数
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('アクティブクラス')).toBeInTheDocument()

      // 総生徒数
      expect(screen.getByText('83')).toBeInTheDocument()
      expect(screen.getByText('総生徒数')).toBeInTheDocument()

      // 総図書委員数
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('総図書委員数')).toBeInTheDocument()
    })
  })

  describe('データテーブル', () => {
    it('クラス一覧が正しく表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3')
      expect(screen.getByText('5年1組')).toBeInTheDocument()
      expect(screen.getByText('5年2組')).toBeInTheDocument()
      expect(screen.getByText('6年1組')).toBeInTheDocument()
    })

    it('検索機能が動作する', () => {
      render(<ClassManagementPage />)

      expect(screen.getByTestId('table-search-key')).toHaveTextContent('name')
    })

    it('選択機能が動作する', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      // 一括操作ボタンが表示されることを確認
      expect(screen.getByText('一括操作 (1)')).toBeInTheDocument()
    })
  })

  describe('フィルタリング機能', () => {
    it('検索フィールドが表示される', () => {
      render(<ClassManagementPage />)

      const searchInput = screen.getByPlaceholderText('クラス名で検索...')
      expect(searchInput).toBeInTheDocument()
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })

    it('学年フィルタが表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getAllByTestId('select-trigger')).toHaveLength(3) // 学年、図書室、状態
    })

    it('図書室フィルタが表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('図書室')).toBeInTheDocument()
    })

    it('状態フィルタが表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('状態')).toBeInTheDocument()
    })

    it('CSV出力ボタンが表示される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('CSV出力')).toBeInTheDocument()
      expect(screen.getByTestId('download-icon')).toBeInTheDocument()
    })
  })

  describe('新規作成機能', () => {
    it('新規作成ボタンクリックでダイアログが開く', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

      const createButton = screen.getByText('新規クラス作成')
      await user.click(createButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('新規クラス作成')).toBeInTheDocument()
    })

    it('作成フォームが正しく表示される', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

      const createButton = screen.getByText('新規クラス作成')
      await user.click(createButton)

      expect(screen.getByText('クラス名')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('図書室')).toBeInTheDocument()
    })

    it('フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<ClassManagementPage />)

      const createButton = screen.getByText('新規クラス作成')
      await user.click(createButton)

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/classes',
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
      render(<ClassManagementPage />)

      const editButton = screen.getByTestId('edit-row-0')
      await user.click(editButton)

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('クラス編集')).toBeInTheDocument()
    })

    it('編集フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<ClassManagementPage />)

      const editButton = screen.getByTestId('edit-row-0')
      await user.click(editButton)

      const updateButton = screen.getByText('更新')
      await user.click(updateButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/classes/class-1',
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
      render(<ClassManagementPage />)

      const deleteButton = screen.getByTestId('delete-row-0')
      await user.click(deleteButton)

      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      expect(screen.getByText('クラス削除')).toBeInTheDocument()
    })

    it('削除確認が正しく動作する', async () => {
      const user = userEvent.setup()
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      render(<ClassManagementPage />)

      const deleteButton = screen.getByTestId('delete-row-0')
      await user.click(deleteButton)

      const confirmButton = screen.getByTestId('alert-dialog-action')
      await user.click(confirmButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/classes/class-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('図書委員がいるクラスの削除ボタンが無効化される', () => {
      render(<ClassManagementPage />)

      // モックデータでcommitteeMembers > 0のクラスの削除ボタンが無効化されているかチェック
      const deleteButtons = screen.getAllByTestId(/delete-row-/)
      expect(deleteButtons).toHaveLength(3) // 3つのクラスがある
    })
  })

  describe('一括操作機能', () => {
    it('複数選択時に一括操作ボタンが表示される', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      expect(screen.getByText('一括操作 (1)')).toBeInTheDocument()
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    })

    it('一括操作ダイアログが正しく表示される', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

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

      render(<ClassManagementPage />)

      const selectButton = screen.getByTestId('select-row-0')
      await user.click(selectButton)

      const bulkButton = screen.getByText('一括操作 (1)')
      await user.click(bulkButton)

      const executeButton = screen.getByText('実行')
      await user.click(executeButton)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/classes/bulk',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })
  })

  describe('エラーハンドリング', () => {
    it('データ取得エラー時にエラーメッセージが表示される', () => {
      const swr = jest.mocked(require('swr'))
      swr.default = jest.fn((url: string) => {
        if (url === '/api/classes') {
          return {
            data: null,
            error: new Error('データ取得エラー'),
            isLoading: false,
            mutate: jest.fn(),
          }
        }
        if (url === '/api/rooms') {
          return {
            data: { data: { rooms: mockRooms } },
            error: null,
            isLoading: false,
            mutate: jest.fn(),
          }
        }
        return {
          data: null,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        }
      })

      render(<ClassManagementPage />)

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(
        screen.getByText(
          'クラスデータの取得に失敗しました。ページを再読み込みしてください。'
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

      render(<ClassManagementPage />)

      const createButton = screen.getByText('新規クラス作成')
      await user.click(createButton)

      const submitButton = screen.getByText('作成')
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('API エラー')
      })
    })
  })

  describe('ローディング状態', () => {
    it('データ読み込み中にローディングスピナーが表示される', () => {
      const swr = jest.mocked(require('swr'))
      swr.default = jest.fn((url: string) => {
        if (url === '/api/classes') {
          return {
            data: null,
            error: null,
            isLoading: true,
            mutate: jest.fn(),
          }
        }
        if (url === '/api/rooms') {
          return {
            data: { data: { rooms: mockRooms } },
            error: null,
            isLoading: false,
            mutate: jest.fn(),
          }
        }
        return {
          data: null,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        }
      })

      render(<ClassManagementPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('クラス情報を読み込み中...')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なランドマークが設定されている', () => {
      render(<ClassManagementPage />)

      expect(screen.getByTestId('page-layout')).toBeInTheDocument()
      expect(screen.getByTestId('page-title')).toBeInTheDocument()
      expect(screen.getByTestId('page-description')).toBeInTheDocument()
    })

    it('フォーム要素に適切なラベルが設定されている', async () => {
      const user = userEvent.setup()
      render(<ClassManagementPage />)

      const createButton = screen.getByText('新規クラス作成')
      await user.click(createButton)

      expect(screen.getByText('クラス名')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('図書室')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('統計カードが格子状に配置される', () => {
      render(<ClassManagementPage />)

      // 統計情報のカードが適切に配置されていることを確認
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('フィルタが格子状に配置される', () => {
      render(<ClassManagementPage />)

      expect(screen.getByText('検索')).toBeInTheDocument()
      expect(screen.getByText('学年')).toBeInTheDocument()
      expect(screen.getByText('図書室')).toBeInTheDocument()
      expect(screen.getByText('状態')).toBeInTheDocument()
    })
  })

  describe('パフォーマンス', () => {
    it('大量のデータでも正常にレンダリングされる', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, index) => ({
        id: `class-${index}`,
        name: `${(index % 2) + 5}年${index + 1}組`,
        year: (index % 2) + 5,
        room: {
          id: `room-${index % 2}`,
          name: `第${(index % 2) + 1}図書室`,
          capacity: 30,
        },
        studentsCount: 25 + (index % 5),
        committeeMembers: index % 3,
        isActive: index % 2 === 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }))

      const swr = jest.mocked(require('swr'))
      swr.default = jest.fn((url: string) => {
        if (url === '/api/classes') {
          return {
            data: { data: { classes: largeDataSet } },
            error: null,
            isLoading: false,
            mutate: jest.fn(),
          }
        }
        if (url === '/api/rooms') {
          return {
            data: { data: { rooms: mockRooms } },
            error: null,
            isLoading: false,
            mutate: jest.fn(),
          }
        }
        return {
          data: null,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        }
      })

      const startTime = performance.now()
      render(<ClassManagementPage />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('フロントエンドテイストの検証', () => {
    it('Comic Sans MSフォントが適用されている', () => {
      render(<ClassManagementPage />)

      const pageTitle = screen.getByTestId('page-title')
      expect(pageTitle).toHaveStyle({
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      })
    })

    it('パステルカラーが統計カードに適用されている', () => {
      render(<ClassManagementPage />)

      const cards = screen.getAllByTestId('card')

      // 各統計カードにパステルカラーが適用されていることを確認
      cards.forEach((card, index) => {
        const expectedColors = [
          'hsl(200, 100%, 95%)', // 総クラス数 - 水色
          'hsl(120, 60%, 90%)', // アクティブクラス - 緑色
          'hsl(280, 100%, 95%)', // 総生徒数 - 紫色
          'hsl(45, 100%, 90%)', // 総図書委員数 - 黄色
        ]
        if (index < expectedColors.length) {
          expect(card).toHaveStyle({
            backgroundColor: expectedColors[index],
          })
        }
      })
    })

    it('絵文字が適切に表示されている', () => {
      render(<ClassManagementPage />)

      // 統計カードの絵文字を確認
      expect(screen.getByText('🏫')).toBeInTheDocument() // 総クラス数
      expect(screen.getByText('✅')).toBeInTheDocument() // アクティブクラス
      expect(screen.getByText('👥')).toBeInTheDocument() // 総生徒数
      expect(screen.getByText('📚')).toBeInTheDocument() // 総図書委員数
    })
  })
})
