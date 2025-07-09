/**
 * 週間スケジュールコンポーネントのテスト (TDD - Red Phase)
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeeklySchedule } from '../weekly-schedule-simple'

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
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}))

// lucide-react アイコンをモック
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="chart-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
}))

const mockUseSWR = require('swr').default

describe('WeeklySchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('基本的なレンダリング', () => {
    it('コンポーネントが正常にレンダリングされる', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('📋 今週のスケジュール')).toBeInTheDocument()
      expect(screen.getByText('📊詳細表示')).toBeInTheDocument()
    })

    it('詳細表示ボタンが正しいリンクを持つ', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      const detailLink = screen.getByText('📊詳細表示')
      expect(detailLink.closest('a')).toHaveAttribute('href', '/admin/schedules?format=grid')
    })
  })

  describe('スケジュール表の構造', () => {
    it('平日の曜日がすべて表示される', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      const weekdays = ['月', '火', '水', '木', '金']
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument()
      })
    })

    it('図書室の列が表示される', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('図書室')).toBeInTheDocument()
      expect(screen.getByText('図書室1')).toBeInTheDocument()
    })

    it('テーブルが正しい構造を持つ', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      // テーブルの存在を確認
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // ヘッダー行の確認
      const headerRow = table.querySelector('thead tr')
      expect(headerRow).toBeInTheDocument()

      // データ行の確認
      const dataRows = table.querySelectorAll('tbody tr')
      expect(dataRows).toHaveLength(1) // 図書室1の1行
    })
  })

  describe('ローディング状態', () => {
    it('ローディング中のメッセージが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('スケジュールを読み込み中...')).toBeInTheDocument()
      expect(screen.getByText('少々お待ちください')).toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    it('エラー時のメッセージが表示される', () => {
      const mockMutate = jest.fn()
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: new Error('API Error'),
        isLoading: false,
        mutate: mockMutate,
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('スケジュール情報の取得に失敗しました')).toBeInTheDocument()
      
      const retryButton = screen.getByText('再試行')
      expect(retryButton).toBeInTheDocument()
      
      fireEvent.click(retryButton)
      expect(mockMutate).toHaveBeenCalled()
    })
  })

  describe('データ表示状態', () => {
    it('スケジュールデータが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('5年1組')).toBeInTheDocument()
    })

    it('空のセルが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      // 各セルに "-" が表示されていることを確認
      const emptyCells = screen.getAllByText('-')
      expect(emptyCells.length).toBeGreaterThan(0)
    })

    it('スケジュールが設定されていない場合のメッセージが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      expect(screen.getByText('スケジュールが設定されていません')).toBeInTheDocument()
      expect(screen.getByText('スケジュール管理から当番表を生成してください')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('テーブルにプリロードされるアクセシビリティ属性がある', () => {
      mockUseSWR.mockReturnValue({
        data: {
          success: true,
          data: {
            schedules: {
              FIRST_TERM: {
                '1': [{
                  id: '1',
                  room: { id: 'room-1', name: '図書室1' },
                  student: { id: 'student-1', name: '田中太郎', grade: 5, className: '5年1組' }
                }],
                '2': [],
                '3': [],
                '4': [],
                '5': []
              },
              SECOND_TERM: {
                '1': [], '2': [], '3': [], '4': [], '5': []
              }
            }
          }
        },
        error: undefined,
        isLoading: false,
        mutate: jest.fn(),
      })

      render(<WeeklySchedule />)

      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()

      // テーブルヘッダーの確認
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders.length).toBe(7) // 図書室 + 月〜金 + 図書室1 (行ヘッダー)

      // 表の行の確認
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBe(2) // ヘッダー行 + 図書室1の行

      // セルの確認
      const cells = screen.getAllByRole('cell')
      expect(cells.length).toBe(5) // 図書室1の5つのセル
    })
  })
})