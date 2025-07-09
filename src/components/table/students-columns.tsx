'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { SortableHeader, RowActions } from '@/components/ui/data-table'
import {
  User,
  GraduationCap,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react'

// 図書委員情報の型定義（APIレスポンスと一致）
export interface StudentData {
  id: string
  name: string
  classId: string
  grade: number
  isActive: boolean
  assignmentCount: number
  createdAt: string
  updatedAt: string
  class?: {
    id: string
    name: string
    year: number
  }
}

export const studentsColumns: ColumnDef<StudentData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader column={column}>氏名</SortableHeader>
    ),
    meta: {
      label: '氏名',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'grade',
    header: ({ column }) => (
      <SortableHeader column={column}>学年</SortableHeader>
    ),
    meta: {
      label: '学年',
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">{row.getValue('grade')}年</Badge>
      </div>
    ),
  },
  {
    accessorKey: 'class',
    header: 'クラス',
    meta: {
      label: 'クラス',
    },
    cell: ({ row }) => {
      const classData = row.getValue('class') as StudentData['class']
      if (!classData) {
        return (
          <span className="text-muted-foreground text-sm">クラス未設定</span>
        )
      }
      return (
        <div className="text-sm">
          <div className="font-medium">{classData.name}</div>
          <div className="text-muted-foreground">{classData.year}年生</div>
        </div>
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
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'アクティブ' : '非アクティブ'}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'assignmentCount',
    header: ({ column }) => (
      <SortableHeader column={column}>当番回数</SortableHeader>
    ),
    meta: {
      label: '当番回数',
    },
    cell: ({ row }) => {
      const count = row.getValue('assignmentCount') as number
      return (
        <Badge variant={count > 0 ? 'default' : 'secondary'}>{count}回</Badge>
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
      const student = row.original

      return (
        <RowActions
          row={student}
          actions={[
            {
              label: '学生詳細を表示',
              onClick: (row) => {
                // TODO: 学生詳細ページへ遷移
                console.log('View student:', row.id)
              },
            },
            {
              label: '学生情報を編集',
              onClick: (row) => {
                // TODO: 学生編集モーダルを開く
                console.log('Edit student:', row.id)
              },
            },
            {
              label: '当番履歴を表示',
              onClick: (row) => {
                // TODO: 当番履歴ページへ遷移
                console.log('View assignment history:', row.id)
              },
            },
            {
              label: student.isActive
                ? '非アクティブにする'
                : 'アクティブにする',
              onClick: (row) => {
                // TODO: ステータス切り替え処理
                console.log('Toggle status:', row.id)
              },
            },
            {
              label: '図書委員から除名',
              onClick: (row) => {
                // TODO: 除名確認ダイアログを表示
                console.log('Remove student:', row.id)
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
export const sampleStudentsData: StudentData[] = [
  {
    id: 'student-1',
    name: '田中 太郎',
    classId: 'class-1',
    grade: 5,
    isActive: true,
    assignmentCount: 5,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    class: {
      id: 'class-1',
      name: '5年1組',
      year: 5,
    },
  },
  {
    id: 'student-2',
    name: '佐藤 花子',
    classId: 'class-1',
    grade: 5,
    isActive: true,
    assignmentCount: 3,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    class: {
      id: 'class-1',
      name: '5年1組',
      year: 5,
    },
  },
  {
    id: 'student-3',
    name: '鈴木 次郎',
    classId: 'class-3',
    grade: 6,
    isActive: true,
    assignmentCount: 7,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T14:30:00Z',
    class: {
      id: 'class-3',
      name: '6年1組',
      year: 6,
    },
  },
]
