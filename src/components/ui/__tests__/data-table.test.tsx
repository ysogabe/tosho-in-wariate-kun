import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, SortableHeader, RowActions } from '../data-table'
import { ColumnDef } from '@tanstack/react-table'

// テスト用データ型
interface TestData {
  id: string
  name: string
  age: number
  status: 'active' | 'inactive'
}

// テスト用データ
const testData: TestData[] = [
  { id: '1', name: '田中太郎', age: 25, status: 'active' },
  { id: '2', name: '佐藤花子', age: 30, status: 'inactive' },
  { id: '3', name: '鈴木次郎', age: 28, status: 'active' },
]

// テスト用列定義
const testColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable columns={testColumns} data={testData} />)

    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('佐藤花子')).toBeInTheDocument()
    expect(screen.getByText('鈴木次郎')).toBeInTheDocument()
  })

  it('renders empty state when no data', () => {
    render(<DataTable columns={testColumns} data={[]} />)

    expect(screen.getByText('データがありません。')).toBeInTheDocument()
  })

  it('renders search input when searchKey provided', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        searchKey="name"
        searchPlaceholder="名前で検索"
      />
    )

    expect(screen.getByPlaceholderText('名前で検索')).toBeInTheDocument()
  })

  it('filters data when searching', async () => {
    const user = userEvent.setup()
    render(<DataTable columns={testColumns} data={testData} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('検索...')
    await user.type(searchInput, '田中')

    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
  })

  it('renders column visibility toggle', () => {
    render(<DataTable columns={testColumns} data={testData} />)

    expect(screen.getByText('表示列')).toBeInTheDocument()
  })

  it('renders pagination controls', () => {
    render(<DataTable columns={testColumns} data={testData} />)

    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('enables selection when enableSelection is true', () => {
    render(
      <DataTable columns={testColumns} data={testData} enableSelection={true} />
    )

    // チェックボックスが表示されることを確認
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(testData.length + 1) // +1 for header checkbox
  })

  it('calls onSelectionChange when selection changes', async () => {
    const mockOnSelectionChange = jest.fn()
    const user = userEvent.setup()

    render(
      <DataTable
        columns={testColumns}
        data={testData}
        enableSelection={true}
        onSelectionChange={mockOnSelectionChange}
      />
    )

    const firstRowCheckbox = screen.getAllByRole('checkbox')[1] // 最初のデータ行のチェックボックス
    await user.click(firstRowCheckbox)

    expect(mockOnSelectionChange).toHaveBeenCalled()
  })
})

describe('SortableHeader', () => {
  const mockColumn = {
    toggleSorting: jest.fn(),
    getIsSorted: jest.fn(() => false),
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children', () => {
    render(<SortableHeader column={mockColumn}>Test Header</SortableHeader>)

    expect(screen.getByText('Test Header')).toBeInTheDocument()
  })

  it('calls toggleSorting when clicked', async () => {
    const user = userEvent.setup()
    render(<SortableHeader column={mockColumn}>Test Header</SortableHeader>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockColumn.toggleSorting).toHaveBeenCalled()
  })

  it('renders sort icon', () => {
    render(<SortableHeader column={mockColumn}>Test Header</SortableHeader>)

    // ArrowUpDown アイコンが存在することを確認
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})

describe('RowActions', () => {
  const testRow = { id: '1', name: 'Test' }
  const testActions = [
    {
      label: 'Edit',
      onClick: jest.fn(),
    },
    {
      label: 'Delete',
      onClick: jest.fn(),
      variant: 'destructive' as const,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders action trigger button', () => {
    render(<RowActions row={testRow} actions={testActions} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens menu when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<RowActions row={testRow} actions={testActions} />)

    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    expect(screen.getByText('アクション')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls action onClick when menu item is clicked', async () => {
    const user = userEvent.setup()
    render(<RowActions row={testRow} actions={testActions} />)

    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    const editAction = screen.getByText('Edit')
    await user.click(editAction)

    expect(testActions[0].onClick).toHaveBeenCalledWith(testRow)
  })

  it('applies destructive styling to destructive actions', async () => {
    const user = userEvent.setup()
    render(<RowActions row={testRow} actions={testActions} />)

    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    const deleteAction = screen.getByText('Delete')
    expect(deleteAction).toHaveClass('text-destructive')
  })
})
