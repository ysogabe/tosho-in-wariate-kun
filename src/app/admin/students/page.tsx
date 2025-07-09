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
import {
  studentsColumns,
  StudentData,
} from '@/components/table/students-columns'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ValidationError } from '@/components/forms/validation-error'
import {
  Plus,
  Search,
  AlertTriangle,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
  FileText,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type CreateStudentInput,
  type UpdateStudentInput,
} from '@/lib/schemas/student-schemas'

interface Class {
  id: string
  name: string
  year: number
}

export default function StudentManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null
  )
  const [selectedStudents, setSelectedStudents] = useState<StudentData[]>([])
  const [bulkOperation, setBulkOperation] = useState<
    'activate' | 'deactivate' | 'delete' | 'changeClass'
  >('activate')

  // データフェッチング
  const {
    data: studentsData,
    error: studentsError,
    isLoading: studentsLoading,
    mutate: mutateStudents,
  } = useSWR('/api/students?limit=100', (url) =>
    fetch(url).then((res) => res.json())
  )

  // クラス一覧取得
  const { data: classesData } = useSWR('/api/classes?limit=100', (url) =>
    fetch(url).then((res) => res.json())
  )

  // エラー状態管理
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 図書委員作成
  async function handleCreateSubmit(data: CreateStudentInput) {
    setIsCreating(true)
    setCreateErrors({})
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '図書委員の登録に失敗しました')
      }

      toast.success('✨ 図書委員を登録しました！')
      setShowCreateDialog(false)
      await mutateStudents()
      setCreateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '❌ 図書委員登録に失敗しました'
      )
    } finally {
      setIsCreating(false)
    }
  }

  // 図書委員更新
  async function handleUpdateSubmit(data: UpdateStudentInput) {
    if (!selectedStudent) return

    setIsUpdating(true)
    setUpdateErrors({})
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '図書委員の更新に失敗しました')
      }

      toast.success('✨ 図書委員情報を更新しました！')
      setShowEditDialog(false)
      setSelectedStudent(null)
      await mutateStudents()
      setUpdateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '❌ 図書委員更新に失敗しました'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // 図書委員削除
  const handleDeleteStudent = useCallback(async () => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('✨ 図書委員を削除しました')
        setShowDeleteDialog(false)
        setSelectedStudent(null)
        await mutateStudents()
      } else {
        toast.error(result.error.message || '❌ 図書委員削除に失敗しました')
      }
    } catch (error) {
      console.error('Student deletion error:', error)
      toast.error('❌ 図書委員削除中にエラーが発生しました')
    }
  }, [selectedStudent, mutateStudents])

  // 一括操作
  const handleBulkOperation = useCallback(async () => {
    if (selectedStudents.length === 0) return

    try {
      const response = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents.map((s) => s.id),
          operation: bulkOperation,
          confirm: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(
          `✨ ${selectedStudents.length}名の図書委員を${getBulkOperationText(bulkOperation)}しました！`
        )
        setShowBulkDialog(false)
        setSelectedStudents([])
        await mutateStudents()
      } else {
        toast.error(result.error.message || '❌ 一括操作に失敗しました')
      }
    } catch (error) {
      console.error('Bulk operation error:', error)
      toast.error('❌ 一括操作中にエラーが発生しました')
    }
  }, [selectedStudents, bulkOperation, mutateStudents])

  const getBulkOperationText = (operation: string) => {
    switch (operation) {
      case 'activate':
        return 'アクティブ化'
      case 'deactivate':
        return '非アクティブ化'
      case 'delete':
        return '削除'
      case 'changeClass':
        return 'クラス変更'
      default:
        return '操作'
    }
  }

  const students = studentsData?.data?.students || []
  const classes = classesData?.data?.classes || []

  // 統計情報
  const statistics = useMemo(() => {
    return {
      total: students.length,
      active: students.filter((s: StudentData) => s.isActive).length,
      inactive: students.filter((s: StudentData) => !s.isActive).length,
      grade5: students.filter((s: StudentData) => s.grade === 5).length,
      grade6: students.filter((s: StudentData) => s.grade === 6).length,
      withAssignments: students.filter(
        (s: StudentData) => s.assignmentCount > 0
      ).length,
    }
  }, [students])

  // テーブル用の列設定（studentsColumnsをそのまま使用）
  const tableColumns = studentsColumns

  if (studentsError) {
    return (
      <PageLayout title="図書委員管理" description="図書委員情報の管理">
        <Alert
          variant="destructive"
          style={{
            backgroundColor: 'hsl(0, 100%, 95%)',
            borderColor: 'hsl(0, 70%, 70%)',
            color: 'hsl(340, 80%, 45%)',
            fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            😅
            図書委員データの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="📚 図書委員管理"
      description="図書委員の登録・管理を行います"
      actions={
        <>
          {selectedStudents.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
              style={{
                backgroundColor: 'hsl(280, 60%, 95%)',
                borderColor: 'hsl(280, 50%, 75%)',
                color: 'hsl(340, 70%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />⚡ 一括操作 (
              {selectedStudents.length})
            </Button>
          )}
          <Button
            onClick={() => {
              setCreateErrors({})
              setShowCreateDialog(true)
            }}
            style={{
              backgroundColor: 'hsl(140, 70%, 85%)',
              borderColor: 'hsl(140, 50%, 75%)',
              color: 'hsl(340, 80%, 45%)',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <Plus className="mr-2 h-4 w-4" />✨ 新規登録
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card
            style={{
              backgroundColor: 'hsl(200, 100%, 95%)',
              border: '2px dashed hsl(200, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.total}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                👥 総図書委員数
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(140, 100%, 95%)',
              border: '2px dashed hsl(140, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(140, 60%, 40%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.active}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                ✅ アクティブ
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(0, 0%, 95%)',
              border: '2px dashed hsl(0, 0%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(0, 0%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.inactive}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                💤 非アクティブ
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(60, 100%, 95%)',
              border: '2px dashed hsl(60, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.grade5}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                🎒 5年生
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(300, 100%, 95%)',
              border: '2px dashed hsl(300, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.grade6}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                🎓 6年生
              </p>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: 'hsl(180, 100%, 95%)',
              border: '2px dashed hsl(180, 70%, 70%)',
              borderRadius: '12px',
            }}
          >
            <CardContent className="p-4">
              <div
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {statistics.withAssignments}
              </div>
              <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
                📋 当番経験あり
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルタ */}
        <Card
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid hsl(350, 80%, 90%)',
            borderRadius: '12px',
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label
                  htmlFor="search"
                  style={{
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    fontWeight: '600',
                  }}
                >
                  🔍 検索
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="名前で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  />
                </div>
              </div>

              <div>
                <Label
                  style={{
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    fontWeight: '600',
                  }}
                >
                  🎒 学年
                </Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger
                    className="mt-1"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="5">5年生</SelectItem>
                    <SelectItem value="6">6年生</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  style={{
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    fontWeight: '600',
                  }}
                >
                  🏫 クラス
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger
                    className="mt-1"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {classes.map((cls: Class) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.year}年{cls.name}組
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  style={{
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    fontWeight: '600',
                  }}
                >
                  📊 状態
                </Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger
                    className="mt-1"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="true">アクティブ</SelectItem>
                    <SelectItem value="false">非アクティブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  style={{
                    backgroundColor: 'hsl(120, 60%, 95%)',
                    borderColor: 'hsl(120, 50%, 75%)',
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  📊 CSV出力
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 図書委員一覧テーブル */}
        <Card
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid hsl(350, 80%, 90%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader>
            <CardTitle
              style={{
                color: 'hsl(340, 80%, 45%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              👥 図書委員一覧
            </CardTitle>
            <CardDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
              登録されている図書委員の一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" text="図書委員情報を読み込み中..." />
              </div>
            ) : (
              <DataTable
                columns={studentsColumns}
                data={students}
                searchKey="name"
                searchPlaceholder="図書委員名で検索..."
                enableSelection
                onSelectionChange={setSelectedStudents}
              />
            )}
          </CardContent>
        </Card>

        {/* 図書委員作成ダイアログ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid hsl(350, 80%, 90%)',
              borderRadius: '12px',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'hsl(340, 80%, 45%)' }}>
                ✨ 新規図書委員登録
              </DialogTitle>
              <DialogDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
                新しい図書委員を登録します
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleCreateSubmit({
                  name: formData.get('name') as string,
                  grade: parseInt(formData.get('grade') as string),
                  classId: formData.get('classId') as string,
                  isActive: true,
                })
              }}
            >
              <div className="space-y-4">
                <ValidationError errors={createErrors} />

                <div className="space-y-2">
                  <Label
                    htmlFor="create-name"
                    style={{
                      color: 'hsl(340, 70%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    👤 氏名
                  </Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder="山田太郎"
                    required
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="create-grade"
                    style={{
                      color: 'hsl(340, 70%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    🎒 学年
                  </Label>
                  <select
                    id="create-grade"
                    name="grade"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                    required
                  >
                    <option value="">学年を選択</option>
                    <option value="5">5年</option>
                    <option value="6">6年</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="create-classId"
                    style={{
                      color: 'hsl(340, 70%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    🏫 クラス
                  </Label>
                  <select
                    id="create-classId"
                    name="classId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                    required
                  >
                    <option value="">クラスを選択</option>
                    {classes.map((cls: Class) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.year}年{cls.name}組
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    style={{
                      borderColor: 'hsl(0, 0%, 75%)',
                      color: 'hsl(340, 70%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    ❌ キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    style={{
                      backgroundColor: 'hsl(140, 70%, 85%)',
                      borderColor: 'hsl(140, 50%, 75%)',
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {isCreating ? '⏳ 登録中...' : '✨ 登録'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 図書委員編集ダイアログ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid hsl(350, 80%, 90%)',
              borderRadius: '12px',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'hsl(340, 80%, 45%)' }}>
                ✏️ 図書委員編集
              </DialogTitle>
              <DialogDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
                図書委員情報を編集します
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleUpdateSubmit({
                    name: formData.get('name') as string,
                    grade: parseInt(formData.get('grade') as string),
                    classId: formData.get('classId') as string,
                    isActive: formData.get('isActive') === 'true',
                  })
                }}
              >
                <div className="space-y-4">
                  <ValidationError errors={updateErrors} />

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-name"
                      style={{
                        color: 'hsl(340, 70%, 50%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      👤 氏名
                    </Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedStudent.name}
                      placeholder="山田太郎"
                      required
                      style={{
                        borderColor: 'hsl(180, 70%, 85%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-grade"
                      style={{
                        color: 'hsl(340, 70%, 50%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      🎒 学年
                    </Label>
                    <select
                      id="edit-grade"
                      name="grade"
                      defaultValue={selectedStudent.grade}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      style={{
                        borderColor: 'hsl(180, 70%, 85%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      }}
                      required
                    >
                      <option value="">学年を選択</option>
                      <option value="5">5年</option>
                      <option value="6">6年</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-classId"
                      style={{
                        color: 'hsl(340, 70%, 50%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      🏫 クラス
                    </Label>
                    <select
                      id="edit-classId"
                      name="classId"
                      defaultValue={selectedStudent.class?.id || ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      style={{
                        borderColor: 'hsl(180, 70%, 85%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      }}
                      required
                    >
                      <option value="">クラスを選択</option>
                      {classes.map((cls: Class) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.year}年{cls.name}組
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isActive"
                      name="isActive"
                      value="true"
                      defaultChecked={selectedStudent.isActive}
                    />
                    <Label
                      htmlFor="edit-isActive"
                      style={{
                        color: 'hsl(340, 70%, 50%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      ✅ アクティブ
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                      style={{
                        borderColor: 'hsl(0, 0%, 75%)',
                        color: 'hsl(340, 70%, 50%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      ❌ キャンセル
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      style={{
                        backgroundColor: 'hsl(60, 70%, 85%)',
                        borderColor: 'hsl(60, 50%, 75%)',
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      {isUpdating ? '⏳ 更新中...' : '✏️ 更新'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid hsl(0, 80%, 90%)',
              borderRadius: '12px',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle
                className="flex items-center gap-2"
                style={{ color: 'hsl(0, 70%, 50%)' }}
              >
                <AlertTriangle className="h-5 w-5" />
                🗑️ 図書委員削除
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
                {selectedStudent && (
                  <>
                    <strong>{selectedStudent.name}</strong>を削除します。
                    この操作は取り消せません。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                style={{
                  borderColor: 'hsl(0, 0%, 75%)',
                  color: 'hsl(340, 70%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                ❌ キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                style={{
                  backgroundColor: 'hsl(0, 70%, 85%)',
                  borderColor: 'hsl(0, 50%, 75%)',
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                🗑️ 削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 一括操作ダイアログ */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid hsl(350, 80%, 90%)',
              borderRadius: '12px',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'hsl(340, 80%, 45%)' }}>
                ⚡ 一括操作
              </DialogTitle>
              <DialogDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
                選択した{selectedStudents.length}
                名の図書委員に対して操作を実行します
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  style={{
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  ⚙️ 操作を選択
                </Label>
                <Select
                  value={bulkOperation}
                  onValueChange={(value: any) => setBulkOperation(value)}
                >
                  <SelectTrigger
                    style={{
                      borderColor: 'hsl(180, 70%, 85%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">✅ アクティブ化</SelectItem>
                    <SelectItem value="deactivate">
                      💤 非アクティブ化
                    </SelectItem>
                    <SelectItem value="delete">🗑️ 削除</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDialog(false)}
                  style={{
                    borderColor: 'hsl(0, 0%, 75%)',
                    color: 'hsl(340, 70%, 50%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  ❌ キャンセル
                </Button>
                <Button
                  onClick={handleBulkOperation}
                  style={{
                    backgroundColor:
                      bulkOperation === 'delete'
                        ? 'hsl(0, 70%, 85%)'
                        : 'hsl(140, 70%, 85%)',
                    borderColor:
                      bulkOperation === 'delete'
                        ? 'hsl(0, 50%, 75%)'
                        : 'hsl(140, 50%, 75%)',
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  ⚡ 実行
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
