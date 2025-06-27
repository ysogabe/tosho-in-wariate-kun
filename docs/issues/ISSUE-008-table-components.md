# Issue #008: テーブルコンポーネントの作成

**Priority**: High  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, components, table, ui

## Description

データ表示用のテーブルコンポーネントを作成します。クラス一覧、図書委員一覧、当番表表示など、システム内で使用される各種テーブル表示に対応した再利用可能なコンポーネントを実装します。

## Background

フロントエンド設計書で定義されているテーブル設計に基づき、ソート、フィルタ、ページネーション機能を持つ高機能なテーブルコンポーネントを作成します。

## Acceptance Criteria

- [ ] DataTableコンポーネントが作成されている
- [ ] TableHeaderコンポーネントが作成されている
- [ ] TableRowコンポーネントが作成されている
- [ ] ソート機能が実装されている
- [ ] フィルタ機能が実装されている
- [ ] ページネーション機能が実装されている
- [ ] レスポンシブ対応が実装されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Getting Started

1. Issue #006（基本UIコンポーネント）が完了していることを確認
2. shadcn/ui Table コンポーネントの理解
3. TanStack Tableライブラリの検討

### Main Components

#### 1. Data Table Component

##### src/components/ui/data-table.tsx

```typescript
'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  rowActions?: (row: TData) => React.ReactNode
  enableSelection?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "検索...",
  rowActions,
  enableSelection = false,
  onSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // 選択機能用の列を追加
  const enhancedColumns = React.useMemo(() => {
    if (!enableSelection) return columns

    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="全て選択"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="行を選択"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }

    return [selectColumn, ...columns]
  }, [columns, enableSelection])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // 選択状態の変更を通知
  React.useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, enableSelection, table])

  return (
    <div className="w-full space-y-4">
      {/* テーブルツールバー */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="pl-8"
              />
            </div>
          )}
          {enableSelection && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {table.getFilteredSelectedRowModel().rows.length} 件選択中
              </Badge>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              列表示 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* テーブル本体 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
                >
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && enableSelection && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 行選択中
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">行数</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-2 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            ページ {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">最初のページ</span>
              <span className="h-4 w-4">«</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">前のページ</span>
              <span className="h-4 w-4">‹</span>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">次のページ</span>
              <span className="h-4 w-4">›</span>
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">最後のページ</span>
              <span className="h-4 w-4">»</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ソート可能なヘッダーヘルパー
export function SortableHeader({ column, children }: {
  column: any
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto p-0 font-medium"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

// 行アクションヘルパー
export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">メニューを開く</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 2. Classes Table Columns

##### src/components/tables/classes-columns.tsx

```typescript
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Edit, Trash2, Users } from 'lucide-react'
import { SortableHeader, RowActions } from '@/components/ui/data-table'

export type Class = {
  id: string
  name: string
  year: number
  studentCount: number
  createdAt: string
  updatedAt: string
}

export const classesColumns: ColumnDef<Class>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>クラス名</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <SortableHeader column={column}>学年</SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("year")}年
      </Badge>
    ),
  },
  {
    accessorKey: "studentCount",
    header: ({ column }) => (
      <SortableHeader column={column}>図書委員数</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue("studentCount")}名</span>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column}>作成日</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {new Date(row.getValue("createdAt")).toLocaleDateString('ja-JP')}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const classData = row.original

      return (
        <RowActions>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </RowActions>
      )
    },
  },
]
```

#### 3. Students Table Columns

##### src/components/tables/students-columns.tsx

```typescript
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Edit, Trash2, Calendar, User } from 'lucide-react'
import { SortableHeader, RowActions } from '@/components/ui/data-table'

export type Student = {
  id: string
  name: string
  grade: number
  class: {
    id: string
    name: string
    year: number
  }
  isActive: boolean
  assignmentCount: number
  createdAt: string
  updatedAt: string
}

export const studentsColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>氏名</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "grade",
    header: ({ column }) => (
      <SortableHeader column={column}>学年</SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("grade")}年
      </Badge>
    ),
  },
  {
    accessorKey: "class",
    header: "クラス",
    cell: ({ row }) => {
      const classData = row.getValue("class") as Student["class"]
      return (
        <div className="text-sm">
          {classData.year}年{classData.name}組
        </div>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: "状態",
    cell: ({ row }) => (
      <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
        {row.getValue("isActive") ? "アクティブ" : "非アクティブ"}
      </Badge>
    ),
  },
  {
    accessorKey: "assignmentCount",
    header: ({ column }) => (
      <SortableHeader column={column}>当番回数</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue("assignmentCount")}回</span>
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original

      return (
        <RowActions>
          <DropdownMenuItem>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Calendar className="mr-2 h-4 w-4" />
            当番表確認
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </RowActions>
      )
    },
  },
]
```

### Dependencies

#### package.json additions

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.10.7"
  }
}
```

### Resources

- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)
- [Data Table Tutorial](https://ui.shadcn.com/docs/components/data-table)

## Implementation Results

**GitHub Issue**: #11 - https://github.com/ysogabe/tosho-in-wariate-kun/issues/11

### Work Completed

- [ ] DataTableコンポーネント実装
- [ ] SortableHeaderヘルパー実装
- [ ] RowActionsヘルパー実装
- [ ] ClassesTableColumns実装
- [ ] StudentsTableColumns実装
- [ ] ページネーション機能実装
- [ ] 検索・フィルタ機能実装
- [ ] レスポンシブ対応実装
- [ ] TanStack React Table統合
- [ ] 単体テスト作成

### Testing Results

- [ ] デスクトップ表示確認
- [ ] モバイル表示確認
- [ ] ソート機能確認
- [ ] フィルタ機能確認
- [ ] ページネーション確認
- [ ] 選択機能確認
- [ ] 単体テスト実行
- [ ] TypeScript型チェック通過
- [ ] ESLint検証通過

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

### GitHub Progress Tracking

**Issue Status**: Open - Ready to Start  
**Assigned**: @ysogabe  
**Branch**: (作業開始時に作成)  
**PR**: (実装完了時に作成)

## Next Steps

このIssue完了後の次のタスク：

1. Issue #009: 認証コンテキスト実装
2. Issue #013: クラス管理APIルート作成
3. Issue #014: 図書委員管理APIルート作成
