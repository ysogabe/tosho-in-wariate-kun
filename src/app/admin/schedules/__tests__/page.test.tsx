import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import ScheduleManagementPage from '../page'

// Mocks
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}
jest.mock('sonner', () => ({
  toast: mockToast,
}))

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock components
jest.mock('@/components/layout/page-layout', () => {
  return function MockPageLayout({
    children,
    title,
    description,
    actions,
  }: {
    children: React.ReactNode
    title: string
    description: string
    actions?: React.ReactNode
  }) {
    return (
      <div data-testid="page-layout">
        <div data-testid="page-title">{title}</div>
        <div data-testid="page-description">{description}</div>
        {actions && <div data-testid="page-actions">{actions}</div>}
        <div data-testid="page-content">{children}</div>
      </div>
    )
  }
})

jest.mock('@/components/schedule/schedule-grid', () => {
  return function MockScheduleGrid({
    assignments,
    term,
    onExport,
  }: {
    assignments: any[]
    term: string
    onExport: (format: string) => void
  }) {
    return (
      <div data-testid="schedule-grid">
        <div data-testid="grid-term">{term}</div>
        <div data-testid="grid-assignments-count">{assignments.length}</div>
        <button onClick={() => onExport('csv')}>Export CSV</button>
      </div>
    )
  }
})

jest.mock('@/components/schedule/schedule-calendar', () => {
  return function MockScheduleCalendar({
    assignments,
    term,
  }: {
    assignments: any[]
    term: string
  }) {
    return (
      <div data-testid="schedule-calendar">
        <div data-testid="calendar-term">{term}</div>
        <div data-testid="calendar-assignments-count">{assignments.length}</div>
      </div>
    )
  }
})

jest.mock('@/components/schedule/schedule-list', () => {
  return function MockScheduleList({
    assignments,
    term,
  }: {
    assignments: any[]
    term: string
  }) {
    return (
      <div data-testid="schedule-list">
        <div data-testid="list-term">{term}</div>
        <div data-testid="list-assignments-count">{assignments.length}</div>
      </div>
    )
  }
})

jest.mock('@/components/common/loading-spinner', () => {
  return function MockLoadingSpinner({
    size,
    text,
  }: {
    size?: string
    text?: string
  }) {
    return (
      <div data-testid="loading-spinner">
        <div data-testid="spinner-size">{size || 'default'}</div>
        <div data-testid="spinner-text">{text || 'Loading...'}</div>
      </div>
    )
  }
})

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

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

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="tabs" data-value={value} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { currentValue: value, onValueChange })
      )}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    currentValue,
    onValueChange,
    ...props
  }: any) => (
    <button
      data-testid={`tab-trigger-${value}`}
      data-active={value === currentValue}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, currentValue, ...props }: any) =>
    value === currentValue ? (
      <div data-testid={`tab-content-${value}`} {...props}>
        {children}
      </div>
    ) : null,
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, ...props }: any) => (
    <div data-testid="dialog-content" {...props}>
      {children}
    </div>
  ),
  DialogDescription: ({ children, ...props }: any) => (
    <div data-testid="dialog-description" {...props}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, ...props }: any) => (
    <div data-testid="dialog-header" {...props}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, ...props }: any) => (
    <div data-testid="dialog-title" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="alert-dialog" onClick={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  AlertDialogAction: ({ children, onClick, ...props }: any) => (
    <button data-testid="alert-dialog-action" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, ...props }: any) => (
    <button data-testid="alert-dialog-cancel" {...props}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-content" {...props}>
      {children}
    </div>
  ),
  AlertDialogDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-description" {...props}>
      {children}
    </div>
  ),
  AlertDialogFooter: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-footer" {...props}>
      {children}
    </div>
  ),
  AlertDialogHeader: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-header" {...props}>
      {children}
    </div>
  ),
  AlertDialogTitle: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-title" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: any) => (
    <div data-testid="alert" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} {...props}>
      {children}
    </span>
  ),
}))

// Test data
const mockScheduleData = {
  success: true,
  data: {
    assignments: [
      {
        id: '1',
        term: 'FIRST_TERM',
        dayOfWeek: 1,
        room: { id: 'room1', name: '図書室A', capacity: 30 },
        student: {
          id: 'student1',
          name: '田中太郎',
          grade: 5,
          class: { id: 'class1', name: '1組', year: 5 },
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        term: 'FIRST_TERM',
        dayOfWeek: 2,
        room: { id: 'room2', name: '図書室B', capacity: 25 },
        student: {
          id: 'student2',
          name: '山田花子',
          grade: 6,
          class: { id: 'class2', name: '2組', year: 6 },
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    summary: {
      totalAssignments: 2,
      studentsAssigned: 2,
      termBreakdown: { FIRST_TERM: 2, SECOND_TERM: 0 },
    },
  },
}

const mockStatsData = {
  success: true,
  data: {
    totalAssignments: 2,
    studentsAssigned: 2,
    averageAssignmentsPerStudent: 1.0,
    balanceScore: 0.95,
    assignmentsByDay: { 1: 1, 2: 1 },
    assignmentsByRoom: { room1: 1, room2: 1 },
  },
}

describe('ScheduleManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockScheduleData,
    } as Response)
  })

  describe('基本レンダリング', () => {
    it('正常にレンダリングされる', async () => {
      // Mock SWR to return data immediately
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<ScheduleManagementPage />)

      expect(screen.getByTestId('page-title')).toHaveTextContent(
        'スケジュール管理'
      )
      expect(screen.getByTestId('page-description')).toHaveTextContent(
        '図書委員の当番表を生成・管理します'
      )
    })

    it('ローディング状態を表示する', () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        mutate: jest.fn(),
      })

      render(<ScheduleManagementPage />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByTestId('spinner-text')).toHaveTextContent(
        'スケジュールを読み込み中...'
      )
    })

    it('エラー状態を表示する', () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR.mockReturnValue({
        data: null,
        error: new Error('データ取得エラー'),
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<ScheduleManagementPage />)

      expect(screen.getByTestId('alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-description')).toHaveTextContent(
        'スケジュールデータの取得に失敗しました'
      )
    })
  })

  describe('期間選択とビューモード', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
    })

    it('期間選択が正しく動作する', async () => {
      render(<ScheduleManagementPage />)

      const firstTermTab = screen.getByTestId('tab-trigger-FIRST_TERM')
      const secondTermTab = screen.getByTestId('tab-trigger-SECOND_TERM')

      expect(firstTermTab).toHaveAttribute('data-active', 'true')
      expect(secondTermTab).toHaveAttribute('data-active', 'false')

      fireEvent.click(secondTermTab)

      await waitFor(() => {
        expect(secondTermTab).toHaveAttribute('data-active', 'true')
      })
    })

    it('ビューモード切り替えが正しく動作する', async () => {
      render(<ScheduleManagementPage />)

      const gridTab = screen.getByTestId('tab-trigger-grid')
      const calendarTab = screen.getByTestId('tab-trigger-calendar')
      const listTab = screen.getByTestId('tab-trigger-list')

      expect(gridTab).toHaveAttribute('data-active', 'true')

      fireEvent.click(calendarTab)
      await waitFor(() => {
        expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument()
      })

      fireEvent.click(listTab)
      await waitFor(() => {
        expect(screen.getByTestId('schedule-list')).toBeInTheDocument()
      })
    })
  })

  describe('統計情報表示', () => {
    it('統計情報を正しく表示する', () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<ScheduleManagementPage />)

      expect(screen.getByText('2')).toBeInTheDocument() // 総当番数
      expect(screen.getByText('2')).toBeInTheDocument() // 参加図書委員数
      expect(screen.getByText('1.0')).toBeInTheDocument() // 平均当番回数
      expect(screen.getByText('95%')).toBeInTheDocument() // バランススコア
    })
  })

  describe('スケジュール生成機能', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
    })

    it('スケジュール生成ダイアログが開く', async () => {
      render(<ScheduleManagementPage />)

      const generateButton = screen.getByText('スケジュール生成')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
          'スケジュール生成'
        )
      })
    })

    it('スケジュール生成APIが正しく呼ばれる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'スケジュール生成完了' },
        }),
      } as Response)

      render(<ScheduleManagementPage />)

      const generateButton = screen.getByText('スケジュール生成')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('生成開始')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/schedules/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            term: 'FIRST_TERM',
            forceRegenerate: false,
          }),
        })
      })

      expect(mockToast.success).toHaveBeenCalledWith('スケジュール生成完了')
    })

    it('スケジュール生成エラーを正しく処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: '生成に失敗しました' },
        }),
      } as Response)

      render(<ScheduleManagementPage />)

      const generateButton = screen.getByText('スケジュール生成')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('生成開始')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('生成に失敗しました')
      })
    })
  })

  describe('スケジュールリセット機能', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
    })

    it('リセット確認ダイアログが開く', async () => {
      render(<ScheduleManagementPage />)

      const resetButton = screen.getByText('リセット')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
        expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent(
          'スケジュールリセット'
        )
      })
    })

    it('スケジュールリセットAPIが正しく呼ばれる', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'スケジュール削除完了' },
        }),
      } as Response)

      render(<ScheduleManagementPage />)

      const resetButton = screen.getByText('リセット')
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByTestId('alert-dialog-action')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/schedules/reset', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            term: 'FIRST_TERM',
            confirmDelete: true,
          }),
        })
      })

      expect(mockToast.success).toHaveBeenCalledWith('スケジュール削除完了')
    })
  })

  describe('エクスポート機能', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      // Mock URL.createObjectURL and related APIs
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      // Mock document methods
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      const originalCreateElement = document.createElement
      document.createElement = jest.fn((tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor as unknown as HTMLAnchorElement
        }
        return originalCreateElement.call(document, tagName)
      })
      document.body.appendChild = jest.fn() as any
      document.body.removeChild = jest.fn() as any
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('CSVエクスポートが正しく動作する', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      } as Response)

      render(<ScheduleManagementPage />)

      const exportButton = screen.getByText('CSVダウンロード')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/schedules/export?term=FIRST_TERM&format=csv'
        )
      })

      expect(mockToast.success).toHaveBeenCalledWith(
        'CSVファイルをダウンロードしました'
      )
    })

    it('エクスポートエラーを正しく処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      render(<ScheduleManagementPage />)

      const exportButton = screen.getByText('CSVダウンロード')
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'エクスポートに失敗しました'
        )
      })
    })
  })

  describe('スケジュール表示コンポーネント統合', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
    })

    it('ScheduleGridコンポーネントに正しいpropsが渡される', () => {
      render(<ScheduleManagementPage />)

      expect(screen.getByTestId('schedule-grid')).toBeInTheDocument()
      expect(screen.getByTestId('grid-term')).toHaveTextContent('FIRST_TERM')
      expect(screen.getByTestId('grid-assignments-count')).toHaveTextContent(
        '2'
      )
    })

    it('ScheduleCalendarに切り替えできる', async () => {
      render(<ScheduleManagementPage />)

      const calendarTab = screen.getByTestId('tab-trigger-calendar')
      fireEvent.click(calendarTab)

      await waitFor(() => {
        expect(screen.getByTestId('schedule-calendar')).toBeInTheDocument()
        expect(screen.getByTestId('calendar-term')).toHaveTextContent(
          'FIRST_TERM'
        )
        expect(
          screen.getByTestId('calendar-assignments-count')
        ).toHaveTextContent('2')
      })
    })

    it('ScheduleListに切り替えできる', async () => {
      render(<ScheduleManagementPage />)

      const listTab = screen.getByTestId('tab-trigger-list')
      fireEvent.click(listTab)

      await waitFor(() => {
        expect(screen.getByTestId('schedule-list')).toBeInTheDocument()
        expect(screen.getByTestId('list-term')).toHaveTextContent('FIRST_TERM')
        expect(screen.getByTestId('list-assignments-count')).toHaveTextContent(
          '2'
        )
      })
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル表示に適応する', () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<ScheduleManagementPage />)

      // 統計カードがgrid形式で表示されている
      const statsContainer = document.querySelector('.grid')
      expect(statsContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4')
    })
  })

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
    })

    it('適切なARIA属性が設定されている', () => {
      render(<ScheduleManagementPage />)

      const generateButton = screen.getByText('スケジュール生成')
      expect(generateButton).toBeInTheDocument()

      const resetButton = screen.getByText('リセット')
      expect(resetButton).toBeInTheDocument()
    })

    it('キーボードナビゲーションが動作する', () => {
      render(<ScheduleManagementPage />)

      const firstTermTab = screen.getByTestId('tab-trigger-FIRST_TERM')
      expect(firstTermTab).toBeInTheDocument()

      // キーボードでフォーカス可能
      firstTermTab.focus()
      expect(firstTermTab).toHaveFocus()
    })
  })

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: mockScheduleData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: mockStatsData,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ScheduleManagementPage />)

      const generateButton = screen.getByText('スケジュール生成')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('生成開始')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'スケジュール生成中にエラーが発生しました'
        )
      })
    })

    it('空のスケジュール状態を正しく表示する', () => {
      const useSWR = jest.mocked(require('swr').default)
      useSWR
        .mockReturnValueOnce({
          data: {
            ...mockScheduleData,
            data: { ...mockScheduleData.data, assignments: [] },
          },
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })
        .mockReturnValueOnce({
          data: null,
          error: null,
          isLoading: false,
          mutate: jest.fn(),
        })

      render(<ScheduleManagementPage />)

      expect(
        screen.getByText('前期のスケジュールがありません')
      ).toBeInTheDocument()
      expect(
        screen.getByText('スケジュールを生成して当番表を作成してください。')
      ).toBeInTheDocument()
    })
  })
})
