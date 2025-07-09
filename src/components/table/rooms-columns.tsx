'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { SortableHeader, RowActions } from '@/components/ui/data-table'
import { Building, Users, Calendar } from 'lucide-react'

// 図書室情報の型定義（APIレスポンスと一致）
export interface RoomData {
  id: string
  name: string
  capacity: number
  description?: string | null
  isActive: boolean
  classCount: number
  utilizationRate: number
  createdAt: string
  updatedAt: string
}

export const roomsColumns: ColumnDef<RoomData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column}>図書室名</SortableHeader>
    ),
    meta: {
      label: '図書室名',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'capacity',
    header: ({ column }) => (
      <SortableHeader column={column}>収容人数</SortableHeader>
    ),
    meta: {
      label: '収容人数',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{row.getValue('capacity')}名</span>
      </div>
    ),
  },
  {
    accessorKey: 'classCount',
    header: ({ column }) => (
      <SortableHeader column={column}>利用クラス数</SortableHeader>
    ),
    meta: {
      label: '利用クラス数',
    },
    cell: ({ row }) => {
      const count = row.getValue('classCount') as number
      return (
        <Badge variant={count > 0 ? 'default' : 'secondary'}>
          {count}クラス
        </Badge>
      )
    },
  },
  {
    accessorKey: 'utilizationRate',
    header: ({ column }) => (
      <SortableHeader column={column}>利用率</SortableHeader>
    ),
    meta: {
      label: '利用率',
    },
    cell: ({ row }) => {
      const rate = row.getValue('utilizationRate') as number
      const variant =
        rate >= 80 ? 'default' : rate >= 50 ? 'secondary' : 'outline'
      return <Badge variant={variant}>{rate}%</Badge>
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
    accessorKey: 'description',
    header: '説明',
    meta: {
      label: '説明',
    },
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <div className="max-w-[200px] truncate">
          {description || '説明なし'}
        </div>
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
      const roomData = row.original

      return (
        <RowActions
          row={roomData}
          actions={[
            {
              label: '図書室詳細を表示',
              onClick: (row) => {
                // TODO: 図書室詳細ページへ遷移
                console.log('View room:', row.id)
              },
            },
            {
              label: '図書室情報を編集',
              onClick: (row) => {
                // TODO: 図書室編集モーダルを開く
                console.log('Edit room:', row.id)
              },
            },
            {
              label: '利用状況を確認',
              onClick: (row) => {
                // TODO: 利用状況ページへ遷移
                console.log('View room usage:', row.id)
              },
            },
            {
              label: '図書室を削除',
              onClick: (row) => {
                // TODO: 削除確認ダイアログを表示
                console.log('Delete room:', row.id)
              },
              variant: 'destructive',
              disabled: roomData.classCount > 0, // クラスが割り当てられている場合は削除不可
            },
          ]}
        />
      )
    },
  },
]

// サンプルデータ
export const sampleRoomsData: RoomData[] = [
  {
    id: 'room-1',
    name: '第1図書室',
    capacity: 30,
    description: '校舎1階にあるメイン図書室です。',
    isActive: true,
    classCount: 5,
    utilizationRate: 85,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'room-2',
    name: '第2図書室',
    capacity: 20,
    description: '校舎2階にある小規模図書室です。',
    isActive: true,
    classCount: 3,
    utilizationRate: 65,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'room-3',
    name: '多目的図書室',
    capacity: 15,
    description: '活動室としても利用可能な図書室です。',
    isActive: true,
    classCount: 2,
    utilizationRate: 40,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'room-4',
    name: '予備図書室',
    capacity: 10,
    description: '緊急時や特別行事時に使用する予備室です。',
    isActive: false,
    classCount: 0,
    utilizationRate: 0,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
]
