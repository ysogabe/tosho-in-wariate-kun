# Issue #020: 図書委員管理ページの実装

**Priority**: High  
**Difficulty**: Advanced  
**Estimated Time**: 6-8 hours  
**Type**: Frontend  
**Labels**: frontend, pages, student-management, crud

## Description

図書委員情報の管理を行うページを実装します。図書委員の一覧表示、新規登録、編集、削除、一括操作機能を統合した包括的な管理インターフェースを提供します。

## Background

フロントエンド設計書で定義された図書委員管理画面の要件に基づき、Issue #014（図書委員管理API）、Issue #008（テーブルコンポーネント）、Issue #019（クラス管理ページ）と連携して、効率的な図書委員管理システムを構築します。

## Acceptance Criteria

- [ ] 図書委員管理ページが実装されている
- [ ] 図書委員一覧表示機能が実装されている
- [ ] 図書委員新規登録機能が実装されている
- [ ] 図書委員編集機能が実装されている
- [ ] 図書委員削除機能が実装されている
- [ ] 一括操作機能が実装されている
- [ ] 検索・フィルタ機能が実装されている
- [ ] 当番履歴表示機能が実装されている

## Implementation Guidelines

### Getting Started

1. Issue #014（図書委員管理API）が完了していることを確認
2. Issue #019（クラス管理ページ）が完了していることを確認
3. Issue #008（テーブルコンポーネント）が完了していることを確認
4. 複雑なCRUDページの設計パターンを理解

### Main Implementation

#### 1. Student Management Page

##### src/app/admin/students/page.tsx

```typescript
'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
import { studentsColumns } from '@/components/tables/students-columns'
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
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useFormValidation } from '@/lib/hooks/use-form-validation'
import {
  createStudentSchema,
  updateStudentSchema,
  bulkStudentOperationSchema
} from '@/lib/schemas/student-schemas'
import type {
  CreateStudentData,
  UpdateStudentData,
  BulkStudentOperation
} from '@/lib/schemas/student-schemas'

interface Student {
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [bulkOperation, setBulkOperation] = useState<'activate' | 'deactivate' | 'delete' | 'changeClass'>('activate')

  // データフェッチング
  const {
    data: studentsData,
    error: studentsError,
    isLoading: studentsLoading,
    mutate: mutateStudents
  } = useSWR(
    `/api/students?search=${encodeURIComponent(searchTerm)}&grade=${selectedGrade}&classId=${selectedClass}&isActive=${selectedStatus}&limit=100`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      return response.json()
    }
  )

  // クラス一覧取得
  const { data: classesData } = useSWR(
    '/api/classes?limit=100',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      return response.json()
    }
  )

  // 図書委員作成
  const {
    errors: createErrors,
    isSubmitting: isCreating,
    handleSubmit: handleCreateSubmit,
    clearErrors: clearCreateErrors
  } = useFormValidation({
    schema: createStudentSchema,
    onSubmit: async (data: CreateStudentData) => {
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('図書委員を登録しました')
          setShowCreateDialog(false)
          mutateStudents()
        } else {
          toast.error(result.error.message || '図書委員登録に失敗しました')
        }
      } catch (error) {
        console.error('Student creation error:', error)
        toast.error('図書委員登録中にエラーが発生しました')
      }
    }
  })

  // 図書委員更新
  const {
    errors: updateErrors,
    isSubmitting: isUpdating,
    handleSubmit: handleUpdateSubmit,
    clearErrors: clearUpdateErrors
  } = useFormValidation({
    schema: updateStudentSchema,
    onSubmit: async (data: UpdateStudentData) => {
      if (!selectedStudent) return

      try {
        const response = await fetch(`/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('図書委員情報を更新しました')
          setShowEditDialog(false)
          setSelectedStudent(null)
          mutateStudents()
        } else {
          toast.error(result.error.message || '図書委員更新に失敗しました')
        }
      } catch (error) {
        console.error('Student update error:', error)
        toast.error('図書委員更新中にエラーが発生しました')
      }
    }
  })

  // 図書委員削除
  const handleDeleteStudent = useCallback(async () => {
    if (!selectedStudent) return

    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('図書委員を削除しました')
        setShowDeleteDialog(false)
        setSelectedStudent(null)
        mutateStudents()
      } else {
        toast.error(result.error.message || '図書委員削除に失敗しました')
      }
    } catch (error) {
      console.error('Student deletion error:', error)
      toast.error('図書委員削除中にエラーが発生しました')
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
          studentIds: selectedStudents.map(s => s.id),
          operation: bulkOperation,
          confirm: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${selectedStudents.length}名の図書委員を${getBulkOperationText(bulkOperation)}しました`)
        setShowBulkDialog(false)
        setSelectedStudents([])
        mutateStudents()
      } else {
        toast.error(result.error.message || '一括操作に失敗しました')
      }
    } catch (error) {
      console.error('Bulk operation error:', error)
      toast.error('一括操作中にエラーが発生しました')
    }
  }, [selectedStudents, bulkOperation, mutateStudents])

  const getBulkOperationText = (operation: string) => {
    switch (operation) {
      case 'activate': return 'アクティブ化'
      case 'deactivate': return '非アクティブ化'
      case 'delete': return '削除'
      case 'changeClass': return 'クラス変更'
      default: return '操作'
    }
  }

  const students = studentsData?.data?.students || []
  const classes = classesData?.data?.classes || []

  // 統計情報
  const statistics = useMemo(() => {
    return {
      total: students.length,
      active: students.filter(s => s.isActive).length,
      inactive: students.filter(s => !s.isActive).length,
      grade5: students.filter(s => s.grade === 5).length,
      grade6: students.filter(s => s.grade === 6).length,
      withAssignments: students.filter(s => s.assignmentCount > 0).length,
    }
  }, [students])

  // テーブル用の列設定（アクション付き）
  const tableColumns = [
    ...studentsColumns,
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: any }) => {
        const student = row.original as Student

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStudent(student)
                clearUpdateErrors()
                setShowEditDialog(true)
              }}
            >
              編集
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStudent(student)
                setShowDeleteDialog(true)
              }}
              disabled={student.assignmentCount > 0}
            >
              削除
            </Button>
          </div>
        )
      },
    },
  ]

  if (studentsError) {
    return (
      <PageLayout title="図書委員管理" description="図書委員情報の管理">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            図書委員データの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="図書委員管理"
      description="図書委員の登録・管理を行います"
      actions={
        <>
          {selectedStudents.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              一括操作 ({selectedStudents.length})
            </Button>
          )}
          <Button
            onClick={() => {
              clearCreateErrors()
              setShowCreateDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-sm text-muted-foreground">総図書委員数</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
              <p className="text-sm text-muted-foreground">アクティブ</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-500">{statistics.inactive}</div>
              <p className="text-sm text-muted-foreground">非アクティブ</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.grade5}</div>
              <p className="text-sm text-muted-foreground">5年生</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.grade6}</div>
              <p className="text-sm text-muted-foreground">6年生</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.withAssignments}</div>
              <p className="text-sm text-muted-foreground">当番経験あり</p>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルタ */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">検索</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="名前で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>学年</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="mt-1">
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
                <Label>クラス</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="mt-1">
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
                <Label>状態</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1">
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
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  CSV出力
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 図書委員一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>図書委員一覧</CardTitle>
            <CardDescription>
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
                columns={tableColumns}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規図書委員登録</DialogTitle>
              <DialogDescription>
                新しい図書委員を登録します
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSubmit({
                name: formData.get('name') as string,
                grade: parseInt(formData.get('grade') as string),
                classId: formData.get('classId') as string,
              })
            }}>
              <div className="space-y-4">
                <ValidationError errors={createErrors} />

                <div className="space-y-2">
                  <Label htmlFor="create-name">氏名</Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder="山田太郎"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-grade">学年</Label>
                  <select
                    id="create-grade"
                    name="grade"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">学年を選択</option>
                    <option value="5">5年</option>
                    <option value="6">6年</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-classId">クラス</Label>
                  <select
                    id="create-classId"
                    name="classId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? '登録中...' : '登録'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 図書委員編集ダイアログ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>図書委員編集</DialogTitle>
              <DialogDescription>
                図書委員情報を編集します
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateSubmit({
                  name: formData.get('name') as string,
                  grade: parseInt(formData.get('grade') as string),
                  classId: formData.get('classId') as string,
                  isActive: formData.get('isActive') === 'true',
                })
              }}>
                <div className="space-y-4">
                  <ValidationError errors={updateErrors} />

                  <div className="space-y-2">
                    <Label htmlFor="edit-name">氏名</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedStudent.name}
                      placeholder="山田太郎"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-grade">学年</Label>
                    <select
                      id="edit-grade"
                      name="grade"
                      defaultValue={selectedStudent.grade}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">学年を選択</option>
                      <option value="5">5年</option>
                      <option value="6">6年</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-classId">クラス</Label>
                    <select
                      id="edit-classId"
                      name="classId"
                      defaultValue={selectedStudent.class.id}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <Label htmlFor="edit-isActive">アクティブ</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditDialog(false)}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? '更新中...' : '更新'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                図書委員削除
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedStudent && (
                  <>
                    <strong>{selectedStudent.name}</strong>を削除します。
                    この操作は取り消せません。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 一括操作ダイアログ */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>一括操作</DialogTitle>
              <DialogDescription>
                選択した{selectedStudents.length}名の図書委員に対して操作を実行します
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>操作を選択</Label>
                <Select value={bulkOperation} onValueChange={(value: any) => setBulkOperation(value)}>
                  <SelectTrigger>
                    <SelectValue />
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
                  variant="outline"
                  onClick={() => setShowBulkDialog(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleBulkOperation}
                  variant={bulkOperation === 'delete' ? 'destructive' : 'default'}
                >
                  実行
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  )
}
```

### Resources

- [Advanced CRUD Patterns](https://www.patterns.dev/posts/presentational-container-pattern)
- [Bulk Operations UX](https://ux.stackexchange.com/questions/99828/bulk-operations-best-practices)
- [Student Information Systems](https://en.wikipedia.org/wiki/Student_information_system)

## Implementation Results

### Work Completed

- [ ] 図書委員管理ページ実装
- [ ] 一覧表示・CRUD機能実装
- [ ] 検索・フィルタ機能実装
- [ ] 一括操作機能実装
- [ ] 統計情報表示実装
- [ ] バリデーション・エラーハンドリング実装

### Testing Results

- [ ] CRUD操作確認
- [ ] 一括操作確認
- [ ] フィルタ機能確認
- [ ] バリデーション確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #022: ログインページ実装
2. Issue #023: ダッシュボードページ実装
3. Issue #024: 図書室管理ページ実装
