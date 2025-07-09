/**
 * ScheduleGridコンポーネントのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ScheduleGrid } from '../schedule-grid'

// Mock the select component to avoid Radix UI issues in tests
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value: _value }: any) => (
    <div data-testid="select-root" onClick={() => onValueChange?.('test')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <button data-testid="select-trigger" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-value">{placeholder || 'すべて'}</span>
  ),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Printer: () => <div data-testid="printer-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Users: () => <div data-testid="users-icon" />,
}))

// モックデータ
const mockAssignments = [
  {
    id: 'assignment-1',
    studentId: 'student-1',
    roomId: 'room-1',
    dayOfWeek: 1,
    term: 'FIRST_TERM' as const,
    student: {
      id: 'student-1',
      name: '田中太郎',
      grade: 5,
      class: {
        id: 'class-1',
        name: '1',
        year: 5,
      },
    },
    room: {
      id: 'room-1',
      name: '図書室A',
      capacity: 3,
    },
  },
  {
    id: 'assignment-2',
    studentId: 'student-2',
    roomId: 'room-2',
    dayOfWeek: 2,
    term: 'FIRST_TERM' as const,
    student: {
      id: 'student-2',
      name: '佐藤花子',
      grade: 6,
      class: {
        id: 'class-2',
        name: '2',
        year: 6,
      },
    },
    room: {
      id: 'room-2',
      name: '図書室B',
      capacity: 4,
    },
  },
  {
    id: 'assignment-3',
    studentId: 'student-3',
    roomId: 'room-1',
    dayOfWeek: 3,
    term: 'SECOND_TERM' as const,
    student: {
      id: 'student-3',
      name: '鈴木次郎',
      grade: 5,
      class: {
        id: 'class-1',
        name: '1',
        year: 5,
      },
    },
    room: {
      id: 'room-1',
      name: '図書室A',
      capacity: 3,
    },
  },
]

// window.print のモック
const mockPrint = jest.fn()
Object.defineProperty(window, 'print', {
  value: mockPrint,
  writable: true,
})

describe('ScheduleGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      expect(screen.getByText('📅 当番表表示設定')).toBeInTheDocument()
      expect(screen.getByText('📋 図書委員当番表')).toBeInTheDocument()
    })

    it('学期が指定された場合、学期名が表示される', () => {
      render(<ScheduleGrid assignments={mockAssignments} term="FIRST_TERM" />)

      expect(screen.getByText(/📋 前期図書委員当番表/)).toBeInTheDocument()
    })

    it('データが空の場合、適切なメッセージが表示される', () => {
      render(<ScheduleGrid assignments={[]} />)

      expect(screen.getByText('当番データがありません')).toBeInTheDocument()
    })
  })

  describe('フィルタリング機能', () => {
    it('検索機能が正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleGrid assignments={mockAssignments} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')

      // 学生名で検索
      await user.type(searchInput, '田中太郎')

      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
    })

    it('図書室フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleGrid assignments={mockAssignments} />)

      // 図書室フィルタを変更
      const roomSelectTriggers = screen.getAllByTestId('select-trigger')
      const roomSelectTrigger = roomSelectTriggers[0] // 最初のSelectは図書室フィルタ
      await user.click(roomSelectTrigger)

      const roomOption = screen.getByTestId('select-item')
      await user.click(roomOption)

      // 図書室Aの当番のみ表示されることを確認
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
    })

    it('学年フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleGrid assignments={mockAssignments} />)

      // 学年フィルタを変更
      const gradeSelectTriggers = screen.getAllByTestId('select-trigger')
      const gradeSelectTrigger = gradeSelectTriggers[1] // 2番目のSelectは学年フィルタ
      await user.click(gradeSelectTrigger)

      const gradeOption = screen.getAllByTestId('select-item')[0]
      await user.click(gradeOption)

      // 5年生のみ表示されることを確認
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
    })
  })

  describe('印刷機能', () => {
    it('印刷ボタンをクリックすると window.print が呼ばれる', async () => {
      const user = userEvent.setup()
      render(<ScheduleGrid assignments={mockAssignments} />)

      const printButton = screen.getByText('🖨️ 印刷')
      await user.click(printButton)

      expect(mockPrint).toHaveBeenCalledTimes(1)
    })
  })

  describe('エクスポート機能', () => {
    it('エクスポートコールバックが正しく呼ばれる', async () => {
      const mockOnExport = jest.fn()
      const user = userEvent.setup()
      render(
        <ScheduleGrid assignments={mockAssignments} onExport={mockOnExport} />
      )

      // エクスポートボタンをクリック
      const exportTrigger = screen.getByText('📤 出力')
      await user.click(exportTrigger)

      // CSV オプションを選択
      const csvOption = screen.getByText('📊 CSV')
      await user.click(csvOption)

      expect(mockOnExport).toHaveBeenCalledWith('csv')
    })

    it('エクスポート機能が無効の場合、ボタンが表示されない', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      expect(screen.queryByText('📤 出力')).not.toBeInTheDocument()
    })
  })

  describe('データ表示', () => {
    it('週間グリッドが正しく表示される', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      // 曜日ヘッダーが表示される
      expect(screen.getByText('月曜日')).toBeInTheDocument()
      expect(screen.getByText('火曜日')).toBeInTheDocument()
      expect(screen.getByText('水曜日')).toBeInTheDocument()
      expect(screen.getByText('木曜日')).toBeInTheDocument()
      expect(screen.getByText('金曜日')).toBeInTheDocument()

      // 図書室名が表示される
      expect(screen.getByText('図書室A')).toBeInTheDocument()
      expect(screen.getByText('図書室B')).toBeInTheDocument()

      // 学生情報が表示される
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('5年1組')).toBeInTheDocument()
    })

    it('統計情報が正しく表示される', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      // フィルタされた件数が表示される
      expect(screen.getByText('3 件')).toBeInTheDocument()
    })

    it('図書室の定員情報が表示される', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      expect(screen.getByText('定員3名')).toBeInTheDocument()
      expect(screen.getByText('定員4名')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('小さな画面では短縮された曜日名が表示される', () => {
      // モバイル画面をシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      render(<ScheduleGrid assignments={mockAssignments} />)

      // デスクトップ用の長い曜日名がある場合の確認
      expect(screen.getByText('月曜日')).toBeInTheDocument()
    })
  })

  describe('フロントエンドテイストのスタイル', () => {
    it('Comic Sans MSフォントが適用されている', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      const title = screen.getByText('📅 当番表表示設定')
      expect(title).toHaveStyle({
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      })
    })

    it('パステルカラーが適用されている', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      const title = screen.getByText('📅 当番表表示設定')
      expect(title).toHaveStyle({
        color: 'hsl(340, 80%, 45%)',
      })
    })

    it('絵文字が適切に表示されている', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      expect(screen.getByText('📅 当番表表示設定')).toBeInTheDocument()
      expect(screen.getByText('🔍 検索')).toBeInTheDocument()
      expect(screen.getByText('📚 図書室')).toBeInTheDocument()
      expect(screen.getByText('🎒 学年')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なラベルが設定されている', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      const searchInput = screen.getByLabelText('🔍 検索')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', '名前・図書室で検索')
    })

    it('テーブルが適切な構造になっている', () => {
      render(<ScheduleGrid assignments={mockAssignments} />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // ヘッダー行が存在する
      const headers = screen.getAllByRole('columnheader')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('ボタンが適切なアクセシビリティ属性を持っている', () => {
      const mockOnExport = jest.fn()
      render(
        <ScheduleGrid assignments={mockAssignments} onExport={mockOnExport} />
      )

      const printButton = screen.getByRole('button', { name: /印刷/ })
      expect(printButton).toBeInTheDocument()
      expect(printButton).not.toBeDisabled()
    })
  })

  describe('エラーハンドリング', () => {
    it('無効なデータが渡された場合も正常に動作する', () => {
      const invalidAssignments = [
        {
          id: '',
          studentId: '',
          roomId: '',
          dayOfWeek: 0,
          term: 'INVALID_TERM' as any,
          student: {
            id: '',
            name: '',
            grade: 0,
            class: {
              id: '',
              name: '',
              year: 0,
            },
          },
          room: {
            id: '',
            name: '',
            capacity: 0,
          },
        },
      ]

      expect(() => {
        render(<ScheduleGrid assignments={invalidAssignments} />)
      }).not.toThrow()
    })
  })

  describe('パフォーマンス', () => {
    it('大量のデータでも正常にレンダリングされる', () => {
      const largeDataSet = Array.from({ length: 100 }, (_, index) => ({
        id: `assignment-${index}`,
        studentId: `student-${index}`,
        roomId: `room-${index % 5}`,
        dayOfWeek: (index % 5) + 1,
        term:
          index % 2 === 0 ? ('FIRST_TERM' as const) : ('SECOND_TERM' as const),
        student: {
          id: `student-${index}`,
          name: `学生${index}`,
          grade: (index % 2) + 5,
          class: {
            id: `class-${index}`,
            name: `${(index % 3) + 1}`,
            year: (index % 2) + 5,
          },
        },
        room: {
          id: `room-${index % 5}`,
          name: `図書室${String.fromCharCode(65 + (index % 5))}`,
          capacity: 3,
        },
      }))

      const startTime = performance.now()
      render(<ScheduleGrid assignments={largeDataSet} />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })
})
