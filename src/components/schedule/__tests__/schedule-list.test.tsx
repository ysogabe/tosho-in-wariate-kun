/**
 * ScheduleListコンポーネントのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ScheduleList } from '../schedule-list'

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
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Search: () => <div data-testid="search-icon" />,
  User: () => <div data-testid="user-icon" />,
  Users: () => <div data-testid="users-icon" />,
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
  {
    id: 'assignment-4',
    studentId: 'student-4',
    roomId: 'room-2',
    dayOfWeek: 1, // 月曜日
    term: 'FIRST_TERM' as const,
    student: {
      id: 'student-4',
      name: '山田三郎',
      grade: 6,
      class: {
        id: 'class-3',
        name: '3',
        year: 6,
      },
    },
    room: {
      id: 'room-2',
      name: '図書室B',
      capacity: 4,
    },
  },
]

describe('ScheduleList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本的なレンダリング', () => {
    it('正常にレンダリングされる', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('👥 当番一覧')).toBeInTheDocument()
      expect(
        screen.getByText('4件の当番が表示されています')
      ).toBeInTheDocument()
    })

    it('学期が指定された場合、学期バッジが表示される', () => {
      render(<ScheduleList assignments={mockAssignments} term="FIRST_TERM" />)

      expect(screen.getByText('🌸 前期')).toBeInTheDocument()
    })

    it('後期の場合、適切なバッジが表示される', () => {
      render(<ScheduleList assignments={mockAssignments} term="SECOND_TERM" />)

      expect(screen.getByText('🍂 後期')).toBeInTheDocument()
    })

    it('データが空の場合、適切なメッセージが表示される', () => {
      render(<ScheduleList assignments={[]} />)

      expect(
        screen.getByText('😅 条件に一致する当番が見つかりません')
      ).toBeInTheDocument()
      expect(
        screen.getByText('0件の当番が表示されています')
      ).toBeInTheDocument()
    })
  })

  describe('検索機能', () => {
    it('学生名で検索が正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')

      await user.type(searchInput, '田中太郎')

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
        expect(
          screen.getByText('1件の当番が表示されています')
        ).toBeInTheDocument()
      })
    })

    it('図書室名で検索が正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')

      await user.type(searchInput, '図書室A')

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.getByText('👤 鈴木次郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
      })
    })

    it('部分一致検索が動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')

      await user.type(searchInput, '田中')

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
      })
    })
  })

  describe('フィルタリング機能', () => {
    it('曜日フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      // 月曜日でフィルタリング
      const daySelect = screen.getByDisplayValue('📅 曜日')
      await user.click(daySelect)

      const mondayOption = screen.getByText('月曜日')
      await user.click(mondayOption)

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.getByText('👤 山田三郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
        expect(
          screen.getByText('2件の当番が表示されています')
        ).toBeInTheDocument()
      })
    })

    it('図書室フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      // 図書室Aでフィルタリング
      const roomSelect = screen.getByDisplayValue('📚 図書室')
      await user.click(roomSelect)

      const roomAOption = screen.getByText('📚 図書室A')
      await user.click(roomAOption)

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.getByText('👤 鈴木次郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
      })
    })

    it('学年フィルタが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      // 5年生でフィルタリング
      const gradeSelect = screen.getByDisplayValue('🎒 学年')
      await user.click(gradeSelect)

      const grade5Option = screen.getByText('5年生')
      await user.click(grade5Option)

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.getByText('👤 鈴木次郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 佐藤花子')).not.toBeInTheDocument()
        expect(
          screen.getByText('2件の当番が表示されています')
        ).toBeInTheDocument()
      })
    })

    it('複数フィルタの組み合わせが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      // 月曜日 AND 5年生でフィルタリング
      const daySelect = screen.getByDisplayValue('📅 曜日')
      await user.click(daySelect)
      await user.click(screen.getByText('月曜日'))

      const gradeSelect = screen.getByDisplayValue('🎒 学年')
      await user.click(gradeSelect)
      await user.click(screen.getByText('5年生'))

      await waitFor(() => {
        expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
        expect(screen.queryByText('👤 山田三郎')).not.toBeInTheDocument()
        expect(
          screen.getByText('1件の当番が表示されています')
        ).toBeInTheDocument()
      })
    })
  })

  describe('ソート機能', () => {
    it('曜日順ソートが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const sortSelect = screen.getByDisplayValue('📊 並び順')
      await user.click(sortSelect)
      await user.click(screen.getByText('📅 曜日順'))

      // データの順序を確認（月曜日の当番が先に表示される）
      const studentNames = screen.getAllByText(/👤 /)
      expect(studentNames[0]).toHaveTextContent('田中太郎')
      expect(studentNames[1]).toHaveTextContent('山田三郎')
    })

    it('名前順ソートが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const sortSelect = screen.getByDisplayValue('📊 並び順')
      await user.click(sortSelect)
      await user.click(screen.getByText('👤 名前順'))

      await waitFor(() => {
        const studentNames = screen.getAllByText(/👤 /)
        // 50音順でソートされている
        expect(studentNames[0]).toHaveTextContent('佐藤花子')
        expect(studentNames[1]).toHaveTextContent('鈴木次郎')
        expect(studentNames[2]).toHaveTextContent('田中太郎')
        expect(studentNames[3]).toHaveTextContent('山田三郎')
      })
    })

    it('図書室順ソートが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const sortSelect = screen.getByDisplayValue('📊 並び順')
      await user.click(sortSelect)
      await user.click(screen.getByText('📚 図書室順'))

      await waitFor(() => {
        const roomNames = screen.getAllByText(/📚 図書室/)
        // 図書室Aが先に来る
        expect(roomNames[0]).toHaveTextContent('図書室A')
        expect(roomNames[1]).toHaveTextContent('図書室A')
      })
    })

    it('学年順ソートが正しく動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const sortSelect = screen.getByDisplayValue('📊 並び順')
      await user.click(sortSelect)
      await user.click(screen.getByText('🎒 学年順'))

      await waitFor(() => {
        const gradeTexts = screen.getAllByText(/🎒 \d年/)
        // 5年生が先に来る
        expect(gradeTexts[0]).toHaveTextContent('5年')
        expect(gradeTexts[1]).toHaveTextContent('5年')
      })
    })
  })

  describe('統計情報表示', () => {
    it('総当番数が正しく表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('📊 総当番数')).toBeInTheDocument()
    })

    it('活動曜日数が正しく表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      // 月、火、水の3曜日
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('📅 活動曜日数')).toBeInTheDocument()
    })

    it('使用図書室数が正しく表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      // 図書室A、図書室Bの2室
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('📚 使用図書室数')).toBeInTheDocument()
    })

    it('フィルタリング後に統計が更新される', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      // 5年生でフィルタリング
      const gradeSelect = screen.getByDisplayValue('🎒 学年')
      await user.click(gradeSelect)
      await user.click(screen.getByText('5年生'))

      await waitFor(() => {
        expect(
          screen.getByText('2件の当番が表示されています')
        ).toBeInTheDocument()
        // 統計も更新される
        const totalCards = screen.getAllByText('2')
        expect(totalCards.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Avatarコンポーネント表示', () => {
    it('学生名の頭文字がAvatarに表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('田')).toBeInTheDocument() // 田中太郎の「田」
      expect(screen.getByText('佐')).toBeInTheDocument() // 佐藤花子の「佐」
      expect(screen.getByText('鈴')).toBeInTheDocument() // 鈴木次郎の「鈴」
      expect(screen.getByText('山')).toBeInTheDocument() // 山田三郎の「山」
    })

    it('Avatarが適切なスタイルで表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const avatar = screen.getByText('田').closest('div')
      expect(avatar).toHaveStyle({
        backgroundColor: 'hsl(180, 70%, 95%)',
      })
    })
  })

  describe('データ表示', () => {
    it('学生情報が正しく表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('👤 田中太郎')).toBeInTheDocument()
      expect(screen.getByText('🎒 5年1組')).toBeInTheDocument()
    })

    it('曜日と図書室情報が正しく表示される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('📅 月曜日')).toBeInTheDocument()
      expect(screen.getByText('📚 図書室A')).toBeInTheDocument()
    })

    it('学期バッジが各当番に表示される', () => {
      render(<ScheduleList assignments={mockAssignments} term="FIRST_TERM" />)

      const termBadges = screen.getAllByText('🌸 前期')
      expect(termBadges.length).toBeGreaterThan(0)
    })
  })

  describe('フロントエンドテイストのスタイル', () => {
    it('Comic Sans MSフォントが適用されている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const title = screen.getByText('👥 当番一覧')
      expect(title).toHaveStyle({
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      })
    })

    it('パステルカラーが適用されている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const title = screen.getByText('👥 当番一覧')
      expect(title).toHaveStyle({
        color: 'hsl(340, 80%, 45%)',
      })
    })

    it('絵文字が適切に表示されている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('👥 当番一覧')).toBeInTheDocument()
      expect(screen.getByText('📊 総当番数')).toBeInTheDocument()
      expect(screen.getByText('📅 活動曜日数')).toBeInTheDocument()
      expect(screen.getByText('📚 使用図書室数')).toBeInTheDocument()
    })

    it('カラフルな統計カードが表示されている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const totalCard = screen.getByText('📊 総当番数').closest('div')
      expect(totalCard).toHaveStyle({
        backgroundColor: 'hsl(200, 100%, 95%)',
      })
    })
  })

  describe('レスポンシブ対応', () => {
    it('フィルタが格子状に配置される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const filterContainer = screen
        .getByPlaceholderText('名前・図書室で検索')
        .closest('.grid')
      expect(filterContainer).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-3',
        'lg:grid-cols-6'
      )
    })

    it('統計カードが格子状に配置される', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const statsContainer = screen.getByText('📊 総当番数').closest('.grid')
      expect(statsContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })
  })

  describe('アクセシビリティ', () => {
    it('フィルタ要素が適切なアクセシビリティ属性を持っている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', '名前・図書室で検索')
    })

    it('セレクトボックスが適切に動作する', async () => {
      const user = userEvent.setup()
      render(<ScheduleList assignments={mockAssignments} />)

      const daySelect = screen.getByRole('combobox', { name: /曜日/ })
      expect(daySelect).toBeInTheDocument()

      await user.click(daySelect)
      expect(screen.getByText('月曜日')).toBeInTheDocument()
    })

    it('統計情報が適切にラベル付けされている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      expect(screen.getByText('📊 総当番数')).toBeInTheDocument()
      expect(screen.getByText('📅 活動曜日数')).toBeInTheDocument()
      expect(screen.getByText('📚 使用図書室数')).toBeInTheDocument()
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
        render(<ScheduleList assignments={invalidAssignments} />)
      }).not.toThrow()
    })

    it('空文字の学生名でもAvatarが表示される', () => {
      const emptyNameAssignment = [
        {
          ...mockAssignments[0],
          student: {
            ...mockAssignments[0].student,
            name: '',
          },
        },
      ]

      render(<ScheduleList assignments={emptyNameAssignment} />)

      // 空文字の場合は何も表示されないか、デフォルト文字が表示される
      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('無効な曜日番号でも表示される', () => {
      const invalidDayAssignment = [
        {
          ...mockAssignments[0],
          dayOfWeek: 10, // 無効な曜日
        },
      ]

      expect(() => {
        render(<ScheduleList assignments={invalidDayAssignment} />)
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
      render(<ScheduleList assignments={largeDataSet} />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    })

    it('フィルタリング操作が高速に実行される', async () => {
      const user = userEvent.setup()
      const largeDataSet = Array.from({ length: 50 }, (_, index) => ({
        ...mockAssignments[0],
        id: `assignment-${index}`,
        student: {
          ...mockAssignments[0].student,
          name: `学生${index}`,
        },
      }))

      render(<ScheduleList assignments={largeDataSet} />)

      const searchInput = screen.getByPlaceholderText('名前・図書室で検索')

      const startTime = performance.now()
      await user.type(searchInput, '学生1')
      const endTime = performance.now()

      // フィルタリング操作が高速であることを確認
      expect(endTime - startTime).toBeLessThan(500) // 0.5秒以内
    })
  })

  describe('アニメーション', () => {
    it('当番リストアイテムにアニメーションクラスが適用されている', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const firstItem = screen.getByText('👤 田中太郎').closest('div')
      expect(firstItem).toHaveClass('animate-fadeIn')
    })

    it('浮遊アニメーションアイコンが存在する', () => {
      render(<ScheduleList assignments={mockAssignments} />)

      const floatingIcon =
        screen.getByText('👥 当番一覧').previousElementSibling
      expect(floatingIcon).toHaveClass('animate-float')
    })
  })
})
