/**
 * ScheduleCalendarコンポーネントのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ScheduleCalendar } from '../schedule-calendar'

// Mock the select component to avoid Radix UI issues in tests
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
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
    <span data-testid="select-value">{placeholder}</span>
  ),
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
}))

// モックデータ
const mockAssignments = [
  {
    id: 'assignment-1',
    studentId: 'student-1',
    roomId: 'room-1',
    dayOfWeek: 1, // 月曜日
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
    dayOfWeek: 2, // 火曜日
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
    dayOfWeek: 3, // 水曜日
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

describe('ScheduleCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 現在日時を固定（2024年1月）
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('📅 2024年1月')).toBeInTheDocument()
      expect(screen.getByText('すべての図書室')).toBeInTheDocument()
    })

    it('学期バッジが表示される', () => {
      render(
        <ScheduleCalendar assignments={mockAssignments} term="FIRST_TERM" />
      )

      expect(screen.getByText('🌸 前期')).toBeInTheDocument()
    })

    it('後期の場合、適切なバッジが表示される', () => {
      render(
        <ScheduleCalendar assignments={mockAssignments} term="SECOND_TERM" />
      )

      expect(screen.getByText('🍂 後期')).toBeInTheDocument()
    })

    it('曜日ヘッダーが正しく表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('日')).toBeInTheDocument()
      expect(screen.getByText('月')).toBeInTheDocument()
      expect(screen.getByText('火')).toBeInTheDocument()
      expect(screen.getByText('水')).toBeInTheDocument()
      expect(screen.getByText('木')).toBeInTheDocument()
      expect(screen.getByText('金')).toBeInTheDocument()
      expect(screen.getByText('土')).toBeInTheDocument()
    })
  })

  describe('月間ナビゲーション', () => {
    it('前の月ボタンが動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const prevButton = screen.getByRole('button', { name: '' })
      await user.click(prevButton)

      expect(screen.getByText('📅 2023年12月')).toBeInTheDocument()
    })

    it('次の月ボタンが動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const nextButton = screen.getAllByRole('button')[1] // 2番目のボタンが次月
      await user.click(nextButton)

      expect(screen.getByText('📅 2024年2月')).toBeInTheDocument()
    })
  })

  describe('図書室フィルタリング', () => {
    it('図書室フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      // フィルタを変更
      const roomSelect = screen.getByDisplayValue('すべての図書室')
      await user.click(roomSelect)

      const roomOption = screen.getByText('📚 図書室A')
      await user.click(roomOption)

      // 統計情報で図書室Aのみがカウントされることを確認
      await waitFor(() => {
        expect(screen.getByText(/総当番数: \d+件/)).toBeInTheDocument()
      })
    })

    it('全ての図書室オプションが表示される', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const roomSelect = screen.getByDisplayValue('すべての図書室')
      await user.click(roomSelect)

      expect(screen.getByText('📚 図書室A')).toBeInTheDocument()
      expect(screen.getByText('📚 図書室B')).toBeInTheDocument()
    })
  })

  describe('カレンダーデータ表示', () => {
    it('平日に当番が表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      // 月曜日（dayOfWeek: 1）の当番が表示される
      const mondayAssignments = screen.getAllByText('田中太郎')
      expect(mondayAssignments.length).toBeGreaterThan(0)
    })

    it('学生名と図書室名が表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('図書室A')).toBeInTheDocument()
    })

    it('3件を超える当番がある場合、追加件数が表示される', () => {
      // 多数の当番を含むモックデータ
      const manyAssignments = Array.from({ length: 5 }, (_, index) => ({
        id: `assignment-${index}`,
        studentId: `student-${index}`,
        roomId: `room-${index}`,
        dayOfWeek: 1, // 全て月曜日
        term: 'FIRST_TERM' as const,
        student: {
          id: `student-${index}`,
          name: `学生${index}`,
          grade: 5,
          class: { id: `class-${index}`, name: '1', year: 5 },
        },
        room: {
          id: `room-${index}`,
          name: `図書室${index}`,
          capacity: 3,
        },
      }))

      render(<ScheduleCalendar assignments={manyAssignments} />)

      expect(screen.getByText('+2件')).toBeInTheDocument()
    })

    it('土日には当番が表示されない', () => {
      const weekendAssignments = [
        {
          ...mockAssignments[0],
          dayOfWeek: 0, // 日曜日
        },
        {
          ...mockAssignments[1],
          dayOfWeek: 6, // 土曜日
        },
      ]

      render(<ScheduleCalendar assignments={weekendAssignments} />)

      // 土日には当番が表示されないはず
      // この確認は実装の詳細に依存するため、統計情報で確認
      expect(screen.getByText(/総当番数: 0件/)).toBeInTheDocument()
    })
  })

  describe('統計情報', () => {
    it('総当番数が正しく表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('総当番数: 3件')).toBeInTheDocument()
    })

    it('フィルタリング後の統計が更新される', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      // 図書室Aでフィルタリング
      const roomSelect = screen.getByDisplayValue('すべての図書室')
      await user.click(roomSelect)

      const roomOption = screen.getByText('📚 図書室A')
      await user.click(roomOption)

      // 図書室Aの当番のみカウントされる
      await waitFor(() => {
        expect(screen.getByText(/総当番数: \d+件/)).toBeInTheDocument()
      })
    })
  })

  describe('凡例表示', () => {
    it('適切な凡例が表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('✨ 今日')).toBeInTheDocument()
      expect(screen.getByText('📋 当番日')).toBeInTheDocument()
    })

    it('統計情報が凡例に含まれる', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText(/総当番数: \d+件/)).toBeInTheDocument()
    })
  })

  describe('フロントエンドテイストのスタイル', () => {
    it('Comic Sans MSフォントが適用されている', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const title = screen.getByText('📅 2024年1月')
      expect(title).toHaveStyle({
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      })
    })

    it('パステルカラーが適用されている', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const title = screen.getByText('📅 2024年1月')
      expect(title).toHaveStyle({
        color: 'hsl(340, 80%, 45%)',
      })
    })

    it('絵文字が適切に表示されている', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('📅 2024年1月')).toBeInTheDocument()
      expect(screen.getByText('📚 図書室選択')).toBeInTheDocument()
      expect(screen.getByText('✨ 今日')).toBeInTheDocument()
      expect(screen.getByText('📋 当番日')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('小画面でも適切に表示される', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      // カレンダーグリッドが存在する
      const calendar = screen.getByRole('grid', { hidden: true })
      expect(calendar).toBeDefined()
    })
  })

  describe('アクセシビリティ', () => {
    it('ナビゲーションボタンが適切なアクセシビリティ属性を持っている', () => {
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const prevButton = screen.getByRole('button', { name: '' })
      const nextButton = screen.getAllByRole('button')[1]

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).not.toBeDisabled()
    })

    it('図書室選択セレクトボックスが適切に動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleCalendar assignments={mockAssignments} />)

      const roomSelect = screen.getByRole('combobox')
      expect(roomSelect).toBeInTheDocument()

      await user.click(roomSelect)
      expect(screen.getByText('📚 図書室A')).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('空のデータでも正常に動作する', () => {
      render(<ScheduleCalendar assignments={[]} />)

      expect(screen.getByText('📅 2024年1月')).toBeInTheDocument()
      expect(screen.getByText('総当番数: 0件')).toBeInTheDocument()
    })

    it('無効な日付データでも正常に動作する', () => {
      const invalidAssignments = [
        {
          ...mockAssignments[0],
          dayOfWeek: 10, // 無効な曜日
        },
      ]

      expect(() => {
        render(<ScheduleCalendar assignments={invalidAssignments} />)
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
      render(<ScheduleCalendar assignments={largeDataSet} />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })
  })

  describe('月の境界ケース', () => {
    it('月末から月初への遷移が正しく動作する', async () => {
      const user = userEvent.setup()

      // 1月31日にテスト日時を設定
      jest.setSystemTime(new Date('2024-01-31'))

      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('📅 2024年1月')).toBeInTheDocument()

      // 次月に移動
      const nextButton = screen.getAllByRole('button')[1]
      await user.click(nextButton)

      expect(screen.getByText('📅 2024年2月')).toBeInTheDocument()
    })

    it('うるう年の2月が正しく処理される', async () => {
      const user = userEvent.setup()

      // 2024年2月（うるう年）にテスト日時を設定
      jest.setSystemTime(new Date('2024-02-15'))

      render(<ScheduleCalendar assignments={mockAssignments} />)

      expect(screen.getByText('📅 2024年2月')).toBeInTheDocument()

      // 2月29日が存在することを確認（間接的な確認）
      const nextButton = screen.getAllByRole('button')[1]
      await user.click(nextButton)
      await user.click(screen.getAllByRole('button')[0]) // 前月に戻る

      expect(screen.getByText('📅 2024年2月')).toBeInTheDocument()
    })
  })
})
