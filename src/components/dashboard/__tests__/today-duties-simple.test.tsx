/**
 * 今日の当番コンポーネントのテスト (TDD - Red Phase)
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { TodayDuties } from '../today-duties-simple'

// SWRをモック
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Next.jsのLinkコンポーネントをモック
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// shadcn-ui コンポーネントをモック
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div data-testid="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div data-testid="alert-description" {...props}>{children}</div>,
}))

// lucide-react アイコンをモック
jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
}))

const mockUseSWR = require('swr').default

describe('TodayDuties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ローディング状態', () => {
    it('ローディング中は適切なメッセージを表示する', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn(),
      })

      render(<TodayDuties />)

      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('今日の当番を確認中...')).toBeInTheDocument()
      expect(screen.getByText('少々お待ちください')).toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    it('エラー時は適切なメッセージと再試行ボタンを表示する', () => {
      const mockMutate = jest.fn()
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('API Error'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<TodayDuties />)

      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('当番情報の取得に失敗しました')).toBeInTheDocument()
      
      const retryButton = screen.getByText('再試行')
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockMutate).toHaveBeenCalled()
    })

    it('APIのレスポンスがsuccessがfalseの場合もエラーとして扱う', () => {
      const mockMutate = jest.fn()
      mockUseSWR.mockReturnValue({
        data: { success: false },
        error: undefined,
        isLoading: false,
        mutate: mockMutate,
      })

      render(<TodayDuties />)

      expect(screen.getByText('当番情報の取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })
  })

  describe('土日の場合', () => {
    it('土日の場合は当番なしのメッセージを表示する', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            date: '2025-07-05',
            dayOfWeek: 'saturday',
            isWeekend: true,
            duties: [],
          },
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<TodayDuties />)

      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('📅 今日: 7月5日(土)')).toBeInTheDocument()
      expect(screen.getByText('今日は当番がありません')).toBeInTheDocument()
      expect(screen.getByText('土曜日・日曜日は図書委員の当番はお休みです')).toBeInTheDocument()
    })
  })

  describe('平日で当番なしの場合', () => {
    it('平日で当番なしの場合は適切なメッセージとリンクを表示する', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            date: '2025-07-07',
            dayOfWeek: 'monday',
            isWeekend: false,
            duties: [],
          },
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<TodayDuties />)

      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('📅 今日: 7月7日(月)')).toBeInTheDocument()
      expect(screen.getByText('今日の当番は設定されていません')).toBeInTheDocument()
      expect(screen.getByText('スケジュール管理から当番表を確認してください')).toBeInTheDocument()
      
      const scheduleLink = screen.getByText('スケジュール管理')
      expect(scheduleLink.closest('a')).toHaveAttribute('href', '/admin/schedules')
    })
  })

  describe('当番ありの場合', () => {
    it('当番がある場合は適切に表示する', () => {
      mockUseSWR.mockReturnValue({
        data: {
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
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<TodayDuties />)

      expect(screen.getByText('🌟 今日の当番')).toBeInTheDocument()
      expect(screen.getByText('📅 今日: 7月7日(月)')).toBeInTheDocument()
      
      // 図書室1の当番
      expect(screen.getByText('図書室1')).toBeInTheDocument()
      expect(screen.getByText('田中花子')).toBeInTheDocument()
      expect(screen.getByText('5年2組')).toBeInTheDocument()
      
      // 図書室2の当番
      expect(screen.getByText('図書室2')).toBeInTheDocument()
      expect(screen.getByText('佐藤太郎')).toBeInTheDocument()
      expect(screen.getByText('6年1組')).toBeInTheDocument()
      
      // 励ましメッセージ
      expect(screen.getByText('⭐ 今日の図書委員の皆さん、よろしくお願いします！')).toBeInTheDocument()
    })
  })

  describe('日付フォーマット', () => {
    const dateTests = [
      { date: '2025-07-07', dayOfWeek: 'monday', expected: '7月7日(月)' },
      { date: '2025-07-08', dayOfWeek: 'tuesday', expected: '7月8日(火)' },
      { date: '2025-07-09', dayOfWeek: 'wednesday', expected: '7月9日(水)' },
      { date: '2025-07-10', dayOfWeek: 'thursday', expected: '7月10日(木)' },
      { date: '2025-07-11', dayOfWeek: 'friday', expected: '7月11日(金)' },
      { date: '2025-07-05', dayOfWeek: 'saturday', expected: '7月5日(土)' },
      { date: '2025-07-06', dayOfWeek: 'sunday', expected: '7月6日(日)' },
    ]

    dateTests.forEach(({ date, dayOfWeek, expected }) => {
      it(`${dayOfWeek}の日付フォーマットが正しい`, () => {
        mockUseSWR.mockReturnValue({
          data: {
            success: true,
            data: {
              date,
              dayOfWeek,
              isWeekend: dayOfWeek === 'saturday' || dayOfWeek === 'sunday',
              duties: [],
            },
          },
          error: undefined,
          isLoading: false,
          mutate: jest.fn(),
        })

        render(<TodayDuties />)

        expect(screen.getByText(`📅 今日: ${expected}`)).toBeInTheDocument()
      })
    })
  })

  describe('リフレッシュ機能', () => {
    it('エラー時の再試行ボタンでリフレッシュする', () => {
      const mockMutate = jest.fn()
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('API Error'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<TodayDuties />)

      const retryButton = screen.getByText('再試行')
      fireEvent.click(retryButton)

      expect(mockMutate).toHaveBeenCalled()
    })
  })
})