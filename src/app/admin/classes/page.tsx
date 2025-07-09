'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageLayout } from '@/components/layout/page-layout'
import { DataTable } from '@/components/ui/data-table'
import { classesColumns, ClassData } from '@/components/table/classes-columns'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ValidationError } from '@/components/forms/validation-error'
import {
  Plus,
  Search,
  AlertTriangle,
  School,
  Users,
  Download,
  Settings,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type CreateClassRequest,
  type UpdateClassRequest,
} from '@/lib/schemas/class-schemas'


interface BulkOperation {
  operation: 'activate' | 'deactivate' | 'delete'
  classIds: string[]
}

export default function ClassManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<ClassData[]>([])
  const [bulkOperation, setBulkOperation] = useState<
    'activate' | 'deactivate' | 'delete'
  >('activate')

  // データフェッチング
  const {
    data: classesData,
    error: classesError,
    isLoading: classesLoading,
    mutate: mutateClasses,
  } = useSWR('/api/classes', (url) => fetch(url).then((res) => res.json()))


  // データの準備
  const classes = useMemo(() => classesData?.data?.classes || [], [classesData])

  // フィルタリングされたクラス一覧
  const filteredClasses = useMemo(() => {
    return classes.filter((cls: ClassData) => {
      const matchesSearch = cls.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesYear =
        selectedYear === 'all' || cls.year === parseInt(selectedYear)

      return matchesSearch && matchesYear
    })
  }, [classes, searchTerm, selectedYear])

  // 統計情報の計算
  const stats = useMemo(() => {
    const totalClasses = classes.length
    const totalStudents = classes.reduce(
      (sum: number, cls: ClassData) => sum + cls.studentCount,
      0
    )

    return {
      totalClasses,
      totalStudents,
    }
  }, [classes])

  // 新規作成
  async function handleCreateSubmit(data: CreateClassRequest) {
    setIsCreating(true)
    setCreateErrors({})
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'クラスの作成に失敗しました')
      }

      toast.success('クラスが正常に作成されました')
      setShowCreateDialog(false)
      await mutateClasses()
      setCreateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'クラスの作成に失敗しました'
      )
    } finally {
      setIsCreating(false)
    }
  }

  // 編集
  async function handleEditSubmit(data: UpdateClassRequest) {
    if (!selectedClass) return

    setIsUpdating(true)
    setUpdateErrors({})
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'クラスの更新に失敗しました')
      }

      toast.success('クラスが正常に更新されました')
      setShowEditDialog(false)
      setSelectedClass(null)
      await mutateClasses()
      setUpdateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'クラスの更新に失敗しました'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // フォームバリデーション
  // エラー状態管理
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 削除
  async function handleDelete() {
    if (!selectedClass) return

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'クラスの削除に失敗しました')
      }

      toast.success('クラスが正常に削除されました')
      setShowDeleteDialog(false)
      setSelectedClass(null)
      await mutateClasses()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'クラスの削除に失敗しました'
      )
    }
  }

  // 一括操作
  async function handleBulkOperation() {
    if (selectedClasses.length === 0) return

    try {
      const bulkData: BulkOperation = {
        operation: bulkOperation,
        classIds: selectedClasses.map((cls) => cls.id),
      }

      const response = await fetch('/api/classes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '一括操作に失敗しました')
      }

      toast.success('一括操作が正常に完了しました')
      setShowBulkDialog(false)
      setSelectedClasses([])
      await mutateClasses()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '一括操作に失敗しました'
      )
    }
  }

  // CSV出力
  const handleExportCSV = useCallback(() => {
    const csvData = filteredClasses.map((cls: ClassData) => [
      cls.name,
      cls.year,
      cls.studentCount,
      new Date(cls.createdAt).toLocaleDateString('ja-JP'),
    ])

    const csvContent = [
      [
        'クラス名',
        '学年',
        '生徒数',
        '作成日',
      ],
      ...csvData,
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `classes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }, [filteredClasses])

  // エラーハンドリング
  if (classesError) {
    return (
      <PageLayout
        title="クラス管理"
        description="クラス情報の登録・管理を行います"
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            クラスデータの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  // ローディング状態
  if (classesLoading) {
    return (
      <PageLayout
        title="クラス管理"
        description="クラス情報の登録・管理を行います"
      >
        <LoadingSpinner text="クラス情報を読み込み中..." />
      </PageLayout>
    )
  }

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif' }}>
      <PageLayout
        title="クラス管理"
        description="クラス情報の登録・管理を行います"
        actions={
        <div className="flex gap-2">
          {selectedClasses.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
              style={{
                backgroundColor: 'hsl(45, 100%, 95%)',
                borderColor: 'hsl(45, 70%, 70%)',
                color: 'hsl(45, 80%, 40%)',
                borderRadius: '12px',
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              一括操作 ({selectedClasses.length})
            </Button>
          )}
          <Button
            onClick={() => {
              setCreateErrors({})
              setShowCreateDialog(true)
            }}
            style={{
              backgroundColor: 'hsl(200, 100%, 85%)',
              borderColor: 'hsl(200, 70%, 70%)',
              color: 'hsl(200, 80%, 30%)',
              borderRadius: '12px',
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            新規クラス作成
          </Button>
        </div>
      }
    >
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card
          style={{
            backgroundColor: 'hsl(200, 100%, 95%)',
            border: '2px dashed hsl(200, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🏫 総クラス数</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(200, 80%, 40%)' }}
            >
              {stats.totalClasses}
            </div>
            <p className="text-xs text-muted-foreground">全学年のクラス</p>
          </CardContent>
        </Card>


        <Card
          style={{
            backgroundColor: 'hsl(280, 100%, 95%)',
            border: '2px dashed hsl(280, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">👥 総生徒数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(280, 80%, 40%)' }}
            >
              {stats.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">全クラスの生徒</p>
          </CardContent>
        </Card>

      </div>

      {/* フィルタエリア */}
      <Card className="mb-6" style={{ borderRadius: '12px' }}>
        <CardHeader>
          <CardTitle>🔍 検索・フィルタ</CardTitle>
          <CardDescription>クラス情報を絞り込んで表示できます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">検索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="クラス名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">学年</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="5">5年</SelectItem>
                  <SelectItem value="6">6年</SelectItem>
                </SelectContent>
              </Select>
            </div>


          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              style={{
                backgroundColor: 'hsl(120, 60%, 95%)',
                borderColor: 'hsl(120, 50%, 70%)',
                color: 'hsl(120, 80%, 30%)',
                borderRadius: '8px',
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV出力
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* データテーブル */}
      <DataTable
        columns={classesColumns}
        data={filteredClasses}
        searchKey="name"
        searchPlaceholder="クラス名で検索..."
        enableSelection={true}
        onSelectionChange={setSelectedClasses}
      />

      {/* 新規作成ダイアログ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent style={{ borderRadius: '12px' }}>
          <DialogHeader>
            <DialogTitle>🏫 新規クラス作成</DialogTitle>
            <DialogDescription>
              新しいクラスを作成します。必要な情報を入力してください。
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSubmit({
                name: formData.get('name') as string,
                year: parseInt(formData.get('year') as string),
              })
            }}
            className="space-y-4"
          >
            <ValidationError errors={createErrors} />

            <div className="space-y-2">
              <Label htmlFor="create-name">クラス名 *</Label>
              <Input
                id="create-name"
                name="name"
                placeholder="例: 5年1組"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-year">学年 *</Label>
              <Select name="year">
                <SelectTrigger id="create-year" style={{ borderRadius: '8px' }}>
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5年</SelectItem>
                  <SelectItem value="6">6年</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                style={{ borderRadius: '8px' }}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                style={{
                  backgroundColor: 'hsl(200, 100%, 85%)',
                  borderColor: 'hsl(200, 70%, 70%)',
                  color: 'hsl(200, 80%, 30%)',
                  borderRadius: '8px',
                }}
              >
                {isCreating ? '作成中...' : '作成'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent style={{ borderRadius: '12px' }}>
          <DialogHeader>
            <DialogTitle>✏️ クラス編集</DialogTitle>
            <DialogDescription>
              クラス情報を編集します。変更したい項目を修正してください。
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleEditSubmit({
                name: formData.get('name') as string,
                year: parseInt(formData.get('year') as string),
              })
            }}
            className="space-y-4"
          >
            <ValidationError errors={updateErrors} />

            <div className="space-y-2">
              <Label htmlFor="edit-name">クラス名</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={selectedClass?.name}
                placeholder="例: 5年1組"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year">学年</Label>
              <Select
                name="year"
                defaultValue={selectedClass?.year?.toString()}
              >
                <SelectTrigger id="edit-year" style={{ borderRadius: '8px' }}>
                  <SelectValue placeholder="学年を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5年</SelectItem>
                  <SelectItem value="6">6年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                style={{ borderRadius: '8px' }}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                style={{
                  backgroundColor: 'hsl(45, 100%, 85%)',
                  borderColor: 'hsl(45, 70%, 70%)',
                  color: 'hsl(45, 80%, 30%)',
                  borderRadius: '8px',
                }}
              >
                {isUpdating ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent style={{ borderRadius: '12px' }}>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ クラス削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedClass?.name}」を削除してもよろしいですか？
              <br />
              <strong style={{ color: 'hsl(0, 70%, 50%)' }}>
                この操作は取り消せません。
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderRadius: '8px' }}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                backgroundColor: 'hsl(0, 70%, 50%)',
                borderColor: 'hsl(0, 70%, 50%)',
                borderRadius: '8px',
              }}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 一括操作ダイアログ */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent style={{ borderRadius: '12px' }}>
          <DialogHeader>
            <DialogTitle>⚙️ 一括操作</DialogTitle>
            <DialogDescription>
              選択した{selectedClasses.length}
              件のクラスに対して一括操作を実行します。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-operation">操作</Label>
              <Select
                value={bulkOperation}
                onValueChange={setBulkOperation as (value: string) => void}
              >
                <SelectTrigger
                  id="bulk-operation"
                  style={{ borderRadius: '8px' }}
                >
                  <SelectValue placeholder="操作を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">アクティブ化</SelectItem>
                  <SelectItem value="deactivate">非アクティブ化</SelectItem>
                  <SelectItem value="delete">削除</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkDialog(false)}
                style={{ borderRadius: '8px' }}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleBulkOperation}
                style={{
                  backgroundColor:
                    bulkOperation === 'delete'
                      ? 'hsl(0, 70%, 85%)'
                      : 'hsl(45, 100%, 85%)',
                  borderColor:
                    bulkOperation === 'delete'
                      ? 'hsl(0, 70%, 70%)'
                      : 'hsl(45, 70%, 70%)',
                  color:
                    bulkOperation === 'delete'
                      ? 'hsl(0, 80%, 30%)'
                      : 'hsl(45, 80%, 30%)',
                  borderRadius: '8px',
                }}
              >
                実行
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </PageLayout>
    </div>
  )
}
