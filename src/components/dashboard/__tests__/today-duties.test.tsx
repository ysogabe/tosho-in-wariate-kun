/**
 * 今日の当番表示コンポーネントのテスト (TDD - Red Phase)
 */

import { render, screen, waitFor } from '@testing-library/react'
import { TodayDuties } from '../today-duties'

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
    return <a href={href} {...props}>{children}</a>
  }
})

const mockSWR = require('swr').default

describe('TodayDuties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // 現在の日付をモック（月曜日に設定）
    const mockDate = new Date('2025-07-07T10:00:00Z') // 月曜日
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockTodayDutiesData = {
    success: true,
    data: {
      date: '2025-07-07',
      dayOfWeek: 'monday',
      isWeekend: false,
      duties: [
        {
          roomId: 'room-1',
          roomName: '図書室1',
          student: {
            name: '田中花子',
            class: {
              year: 5,
              name: '2組',
            },
          },
        },
        {
          roomId: 'room-2',
          roomName: '図書室2',
          student: {
            name: '佐藤太郎',
            class: {
              year: 6,
              name: '1組',
            },
          },
        },
      ],
    },
  }

  const mockWeekendData = {
    success: true,
    data: {
      date: '2025-07-05',
      dayOfWeek: 'saturday',
      isWeekend: true,
      duties: [],
    },
  }

  const mockNoDutiesData = {
    success: true,
    data: {
      date: '2025-07-07',
      dayOfWeek: 'monday',
      isWeekend: false,
      duties: [],
    },
  }

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      mockSWR.mockReturnValue({
        data: mockTodayDutiesData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('📅 今日: 7月7日(月)')).toBeInTheDocument()
    })

    it('ローディング中の表示が正しく動作する', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText('今日の当番を確認中...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('エラー時の表示が正しく動作する', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: new Error('API Error'),
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText('当番情報の取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })
  })

  describe('今日の当番表示', () => {
    it('平日の当番が正常に表示される', () => {
      mockSWR.mockReturnValue({
        data: mockTodayDutiesData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      // 各図書室の当番が表示されることを確認
      expect(screen.getByText('図書室1')).toBeInTheDocument()
      expect(screen.getByText('図書室2')).toBeInTheDocument()
      
      // 学生名とクラスが表示されることを確認
      expect(screen.getByText('田中花子')).toBeInTheDocument()
      expect(screen.getByText('5年2組')).toBeInTheDocument()
      expect(screen.getByText('佐藤太郎')).toBeInTheDocument()
      expect(screen.getByText('6年1組')).toBeInTheDocument()
    })

    it('土日の場合「当番なし」が表示される', () => {
      mockSWR.mockReturnValue({
        data: mockWeekendData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText(/\(土\)/)).toBeInTheDocument()
      expect(screen.getByText('今日は当番がありません')).toBeInTheDocument()
      expect(screen.getByText('土曜日・日曜日は図書委員の当番はお休みです')).toBeInTheDocument()
    })

    it('平日でも当番がない場合の表示', () => {
      mockSWR.mockReturnValue({
        data: mockNoDutiesData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText(/\(月\)/)).toBeInTheDocument()
      expect(screen.getByText('今日の当番は設定されていません')).toBeInTheDocument()
      expect(screen.getByText('スケジュール管理')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      mockSWR.mockReturnValue({
        data: mockTodayDutiesData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      const section = screen.getByRole('region', { name: '今日の当番' })
      expect(section).toBeInTheDocument()
      
      const dutyCards = screen.getAllByRole('article')
      expect(dutyCards).toHaveLength(2)
    })

    it('スクリーンリーダー用の説明が含まれている', () => {
      mockSWR.mockReturnValue({
        data: mockTodayDutiesData,
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByLabelText('図書室1の当番: 田中花子 5年2組')).toBeInTheDocument()
      expect(screen.getByLabelText('図書室2の当番: 佐藤太郎 6年1組')).toBeInTheDocument()
    })
  })

  describe('日付フォーマット', () => {
    const dateTestCases = [
      { date: '2025-07-07', expected: '7月7日(月)' },  // 月曜日
      { date: '2025-07-08', expected: '7月8日(火)' },  // 火曜日
      { date: '2025-07-09', expected: '7月9日(水)' },  // 水曜日
      { date: '2025-07-10', expected: '7月10日(木)' }, // 木曜日
      { date: '2025-07-11', expected: '7月11日(金)' }, // 金曜日
      { date: '2025-07-05', expected: '7月5日(土)' },  // 土曜日
      { date: '2025-07-06', expected: '7月6日(日)' },  // 日曜日
    ]

    dateTestCases.forEach(({ date, expected }) => {
      it(`${date}が${expected}として表示される`, () => {
        const testData = {
          success: true,
          data: {
            date,
            dayOfWeek: 'monday', // この値は使用せず、実際の日付から算出
            isWeekend: false,
            duties: [],
          },
        }

        mockSWR.mockReturnValue({
          data: testData,
          error: null,
          isLoading: false,
        })

        render(<TodayDuties />)
        
        // 月と日の部分をチェック
        const monthDay = expected.split('(')[0] // "7月7日" のような形式
        expect(screen.getByText(new RegExp(monthDay))).toBeInTheDocument()
      })
    })
  })

  describe('リアルタイム更新', () => {
    it('データが更新されると再レンダリングされる', async () => {
      // 初期データ
      mockSWR.mockReturnValue({
        data: mockNoDutiesData,
        error: null,
        isLoading: false,
      })

      const { rerender } = render(<TodayDuties />)
      
      expect(screen.getByText('今日の当番は設定されていません')).toBeInTheDocument()

      // データを更新
      mockSWR.mockReturnValue({
        data: mockTodayDutiesData,
        error: null,
        isLoading: false,
      })

      rerender(<TodayDuties />)

      await waitFor(() => {
        expect(screen.getByText('田中花子')).toBeInTheDocument()
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラー時に適切なエラーメッセージが表示される', () => {
      mockSWR.mockReturnValue({
        data: null,
        error: { message: 'Network Error' },
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText('当番情報の取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
    })

    it('データ形式が不正な場合の処理', () => {
      mockSWR.mockReturnValue({
        data: { success: false, error: 'Invalid data' },
        error: null,
        isLoading: false,
      })

      render(<TodayDuties />)
      
      expect(screen.getByText('当番情報の取得に失敗しました')).toBeInTheDocument()
    })
  })
})