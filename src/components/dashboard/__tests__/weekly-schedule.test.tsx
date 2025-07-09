/**
 * 週間スケジュール表示コンポーネントのテスト (TDD - Red Phase)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WeeklySchedule } from '../weekly-schedule'

// SWRのモック
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Next.jsのLinkコンポーネントをモック
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// React-to-printのモック
jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}))

const mockSWR = require('swr').default
const mockUseReactToPrint = require('react-to-print').useReactToPrint

describe('WeeklySchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // 現在の日付をモック（月曜日に設定）
    const mockDate = new Date('2025-07-07T10:00:00Z') // 月曜日
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    // react-to-printのモック設定
    mockUseReactToPrint.mockReturnValue(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockWeeklyScheduleData = {
    success: true,
    data: {
      assignments: [
        // 月曜日
        {
          id: 'assignment-1',
          dayOfWeek: 1,
          room: { id: 'room-1', name: '図書室1' },
          student: { name: '田中', class: { year: 5, name: '2' } },
        },
        {
          id: 'assignment-2',
          dayOfWeek: 1,
          room: { id: 'room-2', name: '図書室2' },
          student: { name: '佐藤', class: { year: 6, name: '1' } },
        },
        // 火曜日
        {
          id: 'assignment-3',
          dayOfWeek: 2,
          room: { id: 'room-1', name: '図書室1' },
          student: { name: '山田', class: { year: 6, name: '1' } },
        },
        {
          id: 'assignment-4',
          dayOfWeek: 2,
          room: { id: 'room-2', name: '図書室2' },
          student: { name: '伊藤', class: { year: 5, name: '2' } },
        },
        // 水曜日
        {
          id: 'assignment-5',
          dayOfWeek: 3,
          room: { id: 'room-1', name: '図書室1' },
          student: { name: '鈴木', class: { year: 5, name: '1' } },
        },
        {
          id: 'assignment-6',
          dayOfWeek: 3,
          room: { id: 'room-2', name: '図書室2' },
          student: { name: '渡辺', class: { year: 6, name: '3' } },
        },
        // 木曜日
        {
          id: 'assignment-7',
          dayOfWeek: 4,
          room: { id: 'room-1', name: '図書室1' },
          student: { name: '松本', class: { year: 6, name: '2' } },
        },
        {
          id: 'assignment-8',
          dayOfWeek: 4,
          room: { id: 'room-2', name: '図書室2' },
          student: { name: '小林', class: { year: 5, name: '1' } },
        },
        // 金曜日
        {
          id: 'assignment-9',
          dayOfWeek: 5,
          room: { id: 'room-1', name: '図書室1' },
          student: { name: '高橋', class: { year: 5, name: '3' } },
        },
        {
          id: 'assignment-10',
          dayOfWeek: 5,
          room: { id: 'room-2', name: '図書室2' },
          student: { name: '加藤', class: { year: 6, name: '2' } },
        },
      ],
    },
  }

  const mockEmptyScheduleData = {
    success: true,
    data: {
      assignments: [],
    },
  }

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('📋 今週のスケジュール')).toBeInTheDocument()
      expect(screen.getByText('📊詳細表示')).toBeInTheDocument()
      expect(screen.getByText('🖨️印刷')).toBeInTheDocument()
    })

    it('ローディング中の表示が正しく動作する', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
      })

      render(<WeeklySchedule />)

      expect(
        screen.getByText('スケジュールを読み込み中...')
      ).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('エラー時の表示が正しく動作する', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: new Error('API Error'),
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(
        screen.getByText('スケジュールの取得に失敗しました')
      ).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })
  })

  describe('週間スケジュール表示', () => {
    it('曜日ヘッダーが正しく表示される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('月')).toBeInTheDocument()
      expect(screen.getByText('火')).toBeInTheDocument()
      expect(screen.getByText('水')).toBeInTheDocument()
      expect(screen.getByText('木')).toBeInTheDocument()
      expect(screen.getByText('金')).toBeInTheDocument()
    })

    it('図書室名が正しく表示される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('図書室1')).toBeInTheDocument()
      expect(screen.getByText('図書室2')).toBeInTheDocument()
    })

    it('学生名とクラスが正しく表示される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      // 月曜日の当番
      expect(screen.getByText('田中')).toBeInTheDocument()
      expect(screen.getByText('5-2')).toBeInTheDocument()
      expect(screen.getByText('佐藤')).toBeInTheDocument()
      expect(screen.getByText('6-1')).toBeInTheDocument()

      // 他の曜日の当番もチェック
      expect(screen.getByText('山田')).toBeInTheDocument()
      expect(screen.getByText('伊藤')).toBeInTheDocument()
    })

    it('今日の当番に★印が表示される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      // 月曜日（今日）の当番に★印があることを確認
      const mondayColumn = screen.getByTestId('day-column-1')
      expect(mondayColumn).toHaveTextContent('田中★')
      expect(mondayColumn).toHaveTextContent('佐藤★')

      // 他の曜日には★印がないことを確認
      const tuesdayColumn = screen.getByTestId('day-column-2')
      expect(tuesdayColumn).toHaveTextContent('山田')
      expect(tuesdayColumn).not.toHaveTextContent('山田★')
    })

    it('スケジュールが空の場合の表示', () => {
      mockSWR.mockReturnValue({
        data: mockEmptyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('📋 今週のスケジュール')).toBeInTheDocument()
      expect(
        screen.getByText('今週のスケジュールはまだ作成されていません')
      ).toBeInTheDocument()
      expect(screen.getByText('スケジュール管理')).toBeInTheDocument()
    })
  })

  describe('アクション機能', () => {
    it('詳細表示ボタンがクリックできる', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const detailButton = screen.getByText('📊詳細表示')
      expect(detailButton.closest('a')).toHaveAttribute(
        'href',
        '/admin/schedules?format=grid'
      )
    })

    it('印刷ボタンがクリックされる', () => {
      const mockHandlePrint = jest.fn()
      mockUseReactToPrint.mockReturnValue(mockHandlePrint)

      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const printButton = screen.getByText('🖨️印刷')
      fireEvent.click(printButton)

      expect(mockHandlePrint).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const table = screen.getByRole('table', { name: '今週のスケジュール表' })
      expect(table).toBeInTheDocument()

      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders).toHaveLength(7) // 図書室列 + 5日間

      const rowHeaders = screen.getAllByRole('rowheader')
      expect(rowHeaders).toHaveLength(2) // 図書室1, 図書室2
    })

    it('今日の当番にスクリーンリーダー用の説明が含まれている', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(screen.getByLabelText('今日の当番')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('モバイル表示でコンパクトレイアウトが適用される', () => {
      // モバイル画面幅をシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const tableContainer = screen.getByTestId('weekly-schedule-table')
      expect(tableContainer).toHaveClass('overflow-x-auto')
    })
  })

  describe('印刷対応', () => {
    it('印刷用のスタイルが適用される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const printableSection = screen.getByTestId('printable-weekly-schedule')
      expect(printableSection).toBeInTheDocument()
      expect(printableSection).toHaveClass('print:bg-white')
    })

    it('印刷時に不要な要素が非表示になる', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const actionButtons = screen.getByTestId('schedule-actions')
      expect(actionButtons).toHaveClass('print:hidden')
    })
  })

  describe('データ変換', () => {
    it('曜日ごとにデータが正しくグループ化される', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      // 各曜日に正しい数の当番が表示されることを確認
      const mondayColumn = screen.getByTestId('day-column-1')
      expect(mondayColumn).toHaveTextContent('田中')
      expect(mondayColumn).toHaveTextContent('佐藤')

      const tuesdayColumn = screen.getByTestId('day-column-2')
      expect(tuesdayColumn).toHaveTextContent('山田')
      expect(tuesdayColumn).toHaveTextContent('伊藤')
    })

    it('同じ図書室の当番が正しい行にまとめられる', () => {
      mockSWR.mockReturnValue({
        data: mockWeeklyScheduleData,
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      const room1Row = screen.getByTestId('room-row-room-1')
      expect(room1Row).toHaveTextContent('田中')
      expect(room1Row).toHaveTextContent('山田')
      expect(room1Row).toHaveTextContent('鈴木')

      const room2Row = screen.getByTestId('room-row-room-2')
      expect(room2Row).toHaveTextContent('佐藤')
      expect(room2Row).toHaveTextContent('伊藤')
      expect(room2Row).toHaveTextContent('渡辺')
    })
  })

  describe('エラーハンドリング', () => {
    it('データ形式が不正な場合の処理', () => {
      mockSWR.mockReturnValue({
        data: { success: false, error: 'Invalid data' },
        error: null,
        isLoading: false,
      })

      render(<WeeklySchedule />)

      expect(
        screen.getByText('スケジュールの取得に失敗しました')
      ).toBeInTheDocument()
    })

    it('再試行ボタンが機能する', async () => {
      const mockMutate = jest.fn()
      mockSWR.mockReturnValue({
        data: null,
        error: new Error('Network Error'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<WeeklySchedule />)

      const retryButton = screen.getByText('再試行')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(1)
      })
    })
  })
})
