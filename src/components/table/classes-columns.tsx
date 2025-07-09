'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { SortableHeader, RowActions } from '@/components/ui/data-table'
import { School, Users, Calendar } from 'lucide-react'

// クラス情報の型定義（APIレスポンスと一致）
export interface ClassData {
  id: string
  name: string
  year: number
  studentCount: number
  createdAt: string
  updatedAt: string
}

export const classesColumns: ColumnDef<ClassData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column}>クラス名</SortableHeader>
    ),
    meta: {
      label: 'クラス名',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <School className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'year',
    header: ({ column }) => (
      <SortableHeader column={column}>学年</SortableHeader>
    ),
    meta: {
      label: '学年',
    },
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue('year')}年</Badge>
    ),
  },
  {
    accessorKey: 'studentCount',
    header: ({ column }) => (
      <SortableHeader column={column}>生徒数</SortableHeader>
    ),
    meta: {
      label: '生徒数',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('studentCount')}名</span>
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SortableHeader column={column}>作成日</SortableHeader>
    ),
    meta: {
      label: '作成日',
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{date.toLocaleDateString('ja-JP')}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const classData = row.original

      return (
        <RowActions
          row={classData}
          actions={[
            {
              label: 'クラス詳細を表示',
              onClick: (row) => {
                // TODO: クラス詳細ページへ遷移
                console.log('View class:', row.id)
              },
            },
            {
              label: 'クラス情報を編集',
              onClick: (row) => {
                // TODO: クラス編集モーダルを開く
                console.log('Edit class:', row.id)
              },
            },
            {
              label: '図書委員を管理',
              onClick: (row) => {
                // TODO: 図書委員管理ページへ遷移
                console.log('Manage committee members:', row.id)
              },
            },
            {
              label: 'クラスを削除',
              onClick: (row) => {
                // TODO: 削除確認ダイアログを表示
                console.log('Delete class:', row.id)
              },
              variant: 'destructive',
            },
          ]}
        />
      )
    },
  },
]

// サンプルデータ
export const sampleClassesData: ClassData[] = [
  {
    id: 'class-1',
    name: '5年1組',
    year: 5,
    studentCount: 28,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'class-2',
    name: '5年2組',
    year: 5,
    studentCount: 29,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'class-3',
    name: '6年1組',
    year: 6,
    studentCount: 26,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
]
