'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { SortableHeader, RowActions } from '@/components/ui/data-table'
import { School, Users, BookOpen, Calendar } from 'lucide-react'

// クラス情報の型定義
export interface ClassData {
  id: string
  name: string
  year: number
  room: {
    id: string
    name: string
    capacity: number
  }
  studentsCount: number
  committeeMembers: number
  isActive: boolean
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
    accessorKey: 'room',
    header: '図書室',
    meta: {
      label: '図書室',
    },
    cell: ({ row }) => {
      const room = row.getValue('room') as ClassData['room']
      return (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">{room.name}</div>
            <div className="text-muted-foreground">定員: {room.capacity}名</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'studentsCount',
    header: ({ column }) => (
      <SortableHeader column={column}>生徒数</SortableHeader>
    ),
    meta: {
      label: '生徒数',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('studentsCount')}名</span>
      </div>
    ),
  },
  {
    accessorKey: 'committeeMembers',
    header: ({ column }) => (
      <SortableHeader column={column}>図書委員数</SortableHeader>
    ),
    meta: {
      label: '図書委員数',
    },
    cell: ({ row }) => {
      const count = row.getValue('committeeMembers') as number
      return (
        <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}名</Badge>
      )
    },
  },
  {
    accessorKey: 'isActive',
    header: 'ステータス',
    meta: {
      label: 'ステータス',
    },
    cell: ({ row }) => {
      const isActive = row.getValue('isActive')
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'アクティブ' : '非アクティブ'}
        </Badge>
      )
    },
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
    name: '1年A組',
    year: 1,
    room: {
      id: 'room-1',
      name: '第1図書室',
      capacity: 30,
    },
    studentsCount: 28,
    committeeMembers: 2,
    isActive: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'class-2',
    name: '1年B組',
    year: 1,
    room: {
      id: 'room-1',
      name: '第1図書室',
      capacity: 30,
    },
    studentsCount: 29,
    committeeMembers: 2,
    isActive: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'class-3',
    name: '2年A組',
    year: 2,
    room: {
      id: 'room-2',
      name: '第2図書室',
      capacity: 25,
    },
    studentsCount: 26,
    committeeMembers: 3,
    isActive: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'class-4',
    name: '3年A組',
    year: 3,
    room: {
      id: 'room-2',
      name: '第2図書室',
      capacity: 25,
    },
    studentsCount: 24,
    committeeMembers: 0,
    isActive: false,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
]
