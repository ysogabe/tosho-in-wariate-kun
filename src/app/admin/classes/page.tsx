'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { classesColumns, ClassData } from '@/components/table/classes-columns'
import { CreateClassDialog } from '@/components/admin/create-class-dialog'
import { useToast } from '@/components/ui/use-toast'
import { Plus, RefreshCw } from 'lucide-react'

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { toast } = useToast()

  // クラス一覧を取得
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/classes')

      if (!response.ok) {
        throw new Error('クラス一覧の取得に失敗しました')
      }

      const data = await response.json()

      // APIレスポンスをテーブル用のデータ形式に変換
      const formattedClasses: ClassData[] = data.data.classes.map(
        (classItem: any) => ({
          id: classItem.id,
          name: classItem.name,
          year: classItem.year,
          room: {
            id: 'room-default', // TODO: 実際の図書室データと連携
            name: '図書室',
            capacity: 30,
          },
          studentsCount: classItem.studentCount || 0,
          committeeMembers: 0, // TODO: 実際の図書委員数を取得
          isActive: true, // TODO: 実際のアクティブ状態を取得
          createdAt: classItem.createdAt,
          updatedAt: classItem.updatedAt,
        })
      )

      setClasses(formattedClasses)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
      toast({
        title: 'エラー',
        description: 'クラス一覧の取得に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // クラス作成成功時のハンドラ
  const handleClassCreated = () => {
    setShowCreateDialog(false)
    fetchClasses() // リストを再取得
    toast({
      title: '成功',
      description: 'クラスが正常に作成されました',
    })
  }

  // 初期データ読み込み
  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">クラス管理</h1>
          <p className="text-gray-600 mt-1">学校のクラス情報を管理します</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClasses} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            更新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            クラス追加
          </Button>
        </div>
      </div>

      {/* データテーブル */}
      <DataTable
        columns={classesColumns}
        data={classes}
        searchKey="name"
        searchPlaceholder="クラス名で検索..."
      />

      {/* クラス作成ダイアログ */}
      <CreateClassDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleClassCreated}
      />
    </div>
  )
}
