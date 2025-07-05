'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  studentsColumns,
  LibraryCommitteeMemberData,
} from '@/components/table/students-columns'
import { CreateStudentDialog } from '@/components/admin/create-student-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, RefreshCw, Users } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState<LibraryCommitteeMemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  // 図書委員一覧を取得
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')

      if (!response.ok) {
        throw new Error('図書委員一覧の取得に失敗しました')
      }

      const data = await response.json()

      // APIレスポンスをテーブル用のデータ形式に変換
      const formattedStudents: LibraryCommitteeMemberData[] =
        data.data.students.map((student: any) => ({
          id: student.id,
          name: student.name,
          grade: student.grade,
          class: {
            id: student.class?.id || 'unknown',
            name: student.class?.name || '未所属',
            year: student.class?.year || student.grade,
          },
          isActive: student.isActive,
          assignmentCount: 0, // TODO: 実際の当番回数を取得
          lastAssignment: null, // TODO: 最終当番日を取得
          joinDate: student.createdAt,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        }))

      setStudents(formattedStudents)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast({
        title: 'エラー',
        description: '図書委員一覧の取得に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // 図書委員作成成功時のハンドラ
  const handleStudentCreated = () => {
    setShowCreateDialog(false)
    fetchStudents() // リストを再取得
    toast({
      title: '成功',
      description: '図書委員が正常に登録されました',
    })
  }

  // 初期データ読み込み
  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">図書委員管理</h1>
          <p className="text-gray-600 mt-1">図書委員の登録・管理を行います</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStudents} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            更新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            図書委員追加
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">総図書委員数</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">アクティブ</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">5年生</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.grade === 5).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">6年生</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.grade === 6).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* データテーブル */}
      <DataTable
        columns={studentsColumns}
        data={students}
        searchKey="name"
        searchPlaceholder="図書委員名で検索..."
      />

      {/* 図書委員作成ダイアログ */}
      <CreateStudentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleStudentCreated}
      />
    </div>
  )
}
