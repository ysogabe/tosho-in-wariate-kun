# Issue #019: クラス管理ページの実装

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Frontend  
**Labels**: frontend, pages, class-management, crud

## Description

クラス情報の管理を行うページを実装します。クラスの一覧表示、新規作成、編集、削除機能を統合した管理インターフェースを提供します。

## Background

フロントエンド設計書で定義されたクラス管理画面の要件に基づき、Issue #013（クラス管理API）、Issue #008（テーブルコンポーネント）と連携して、直感的で使いやすいクラス管理システムを構築します。

## Acceptance Criteria

- [ ] クラス管理ページが実装されている
- [ ] クラス一覧表示機能が実装されている
- [ ] クラス新規作成機能が実装されている
- [ ] クラス編集機能が実装されている
- [ ] クラス削除機能が実装されている
- [ ] 検索・フィルタ機能が実装されている
- [ ] バリデーションとエラーハンドリングが実装されている
- [ ] レスポンシブ対応が実装されている

## Implementation Guidelines

### Getting Started

1. Issue #013（クラス管理API）が完了していることを確認
2. Issue #008（テーブルコンポーネント）が完了していることを確認
3. Issue #016（フォームバリデーション）が完了していることを確認
4. CRUDページの設計パターンを理解

### Main Implementation

#### 1. Class Management Page

##### src/app/admin/classes/page.tsx

```typescript
'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { classesColumns } from '@/components/tables/classes-columns'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ValidationError } from '@/components/forms/validation-error'
import {
  Plus,
  Search,
  AlertTriangle,
  Building,
  Users,
  GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import { useFormValidation } from '@/lib/hooks/use-form-validation'
import { createClassSchema, updateClassSchema } from '@/lib/schemas/class-schemas'
import type { CreateClassData, UpdateClassData } from '@/lib/schemas/class-schemas'

interface Class {
  id: string
  name: string
  year: number
  studentCount: number
  createdAt: string
  updatedAt: string
}

export default function ClassManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  // データフェッチング
  const {
    data: classesData,
    error,
    isLoading,
    mutate
  } = useSWR(
    `/api/classes?search=${encodeURIComponent(searchTerm)}&limit=100`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      return response.json()
    }
  )

  // クラス作成
  const {
    errors: createErrors,
    isSubmitting: isCreating,
    handleSubmit: handleCreateSubmit,
    clearErrors: clearCreateErrors
  } = useFormValidation({
    schema: createClassSchema,
    onSubmit: async (data: CreateClassData) => {
      try {
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('クラスを作成しました')
          setShowCreateDialog(false)
          mutate()
        } else {
          toast.error(result.error.message || 'クラス作成に失敗しました')
        }
      } catch (error) {
        console.error('Class creation error:', error)
        toast.error('クラス作成中にエラーが発生しました')
      }
    }
  })

  // クラス更新
  const {
    errors: updateErrors,
    isSubmitting: isUpdating,
    handleSubmit: handleUpdateSubmit,
    clearErrors: clearUpdateErrors
  } = useFormValidation({
    schema: updateClassSchema,
    onSubmit: async (data: UpdateClassData) => {
      if (!selectedClass) return

      try {
        const response = await fetch(`/api/classes/${selectedClass.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('クラスを更新しました')
          setShowEditDialog(false)
          setSelectedClass(null)
          mutate()
        } else {
          toast.error(result.error.message || 'クラス更新に失敗しました')
        }
      } catch (error) {
        console.error('Class update error:', error)
        toast.error('クラス更新中にエラーが発生しました')
      }
    }
  })

  // クラス削除
  const handleDeleteClass = useCallback(async () => {
    if (!selectedClass) return

    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('クラスを削除しました')
        setShowDeleteDialog(false)
        setSelectedClass(null)
        mutate()
      } else {
        toast.error(result.error.message || 'クラス削除に失敗しました')
      }
    } catch (error) {
      console.error('Class deletion error:', error)
      toast.error('クラス削除中にエラーが発生しました')
    }
  }, [selectedClass, mutate])

  const classes = classesData?.data?.classes || []
  const pagination = classesData?.data?.pagination

  // テーブル用の列設定（アクション付き）
  const tableColumns = [
    ...classesColumns,
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: any }) => {
        const classData = row.original as Class

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClass(classData)
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
                setSelectedClass(classData)
                setShowDeleteDialog(true)
              }}
              disabled={classData.studentCount > 0}
            >
              削除
            </Button>
          </div>
        )
      },
    },
  ]

  if (error) {
    return (
      <PageLayout title="クラス管理" description="学級情報の管理">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            クラスデータの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="クラス管理"
      description="学級情報を管理します"
      actions={
        <Button
          onClick={() => {
            clearCreateErrors()
            setShowCreateDialog(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          新規クラス
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{classes.length}</div>
                  <p className="text-sm text-muted-foreground">総クラス数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">
                    {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">総図書委員数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(classes.map(cls => cls.year)).size}
                  </div>
                  <p className="text-sm text-muted-foreground">対象学年数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルタ */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">クラス検索</Label>
                <div className="relative mt-1">
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
            </div>
          </CardContent>
        </Card>

        {/* クラス一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>クラス一覧</CardTitle>
            <CardDescription>
              登録されているクラスの一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" text="クラス情報を読み込み中..." />
              </div>
            ) : (
              <DataTable
                columns={tableColumns}
                data={classes}
                searchKey="name"
                searchPlaceholder="クラス名で検索..."
              />
            )}
          </CardContent>
        </Card>

        {/* クラス作成ダイアログ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規クラス作成</DialogTitle>
              <DialogDescription>
                新しいクラスを作成します
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSubmit({
                name: formData.get('name') as string,
                year: parseInt(formData.get('year') as string),
              })
            }}>
              <div className="space-y-4">
                <ValidationError errors={createErrors} />

                <div className="space-y-2">
                  <Label htmlFor="create-name">クラス名</Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder="A, B, C..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-year">学年</Label>
                  <select
                    id="create-year"
                    name="year"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">学年を選択</option>
                    <option value="5">5年</option>
                    <option value="6">6年</option>
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
                    {isCreating ? '作成中...' : '作成'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* クラス編集ダイアログ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>クラス編集</DialogTitle>
              <DialogDescription>
                クラス情報を編集します
              </DialogDescription>
            </DialogHeader>

            {selectedClass && (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateSubmit({
                  name: formData.get('name') as string,
                  year: parseInt(formData.get('year') as string),
                })
              }}>
                <div className="space-y-4">
                  <ValidationError errors={updateErrors} />

                  <div className="space-y-2">
                    <Label htmlFor="edit-name">クラス名</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedClass.name}
                      placeholder="A, B, C..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-year">学年</Label>
                    <select
                      id="edit-year"
                      name="year"
                      defaultValue={selectedClass.year}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">学年を選択</option>
                      <option value="5">5年</option>
                      <option value="6">6年</option>
                    </select>
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
                クラス削除
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedClass && (
                  <>
                    <strong>{selectedClass.year}年{selectedClass.name}組</strong>を削除します。
                    この操作は取り消せません。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClass}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  )
}
```

### Resources

- [CRUD Page Patterns](https://ui-patterns.com/patterns/CrudOperations)
- [Form Validation Best Practices](https://ux.stackexchange.com/questions/96970/best-practices-for-form-validation)
- [Data Table Design](https://inclusive-components.design/data-tables/)

## Implementation Results

### Work Completed

- [ ] クラス管理ページ実装
- [ ] クラス一覧表示実装
- [ ] 新規作成機能実装
- [ ] 編集機能実装
- [ ] 削除機能実装
- [ ] 検索機能実装
- [ ] 統計情報表示実装
- [ ] バリデーション実装

### Testing Results

- [ ] CRUD操作確認
- [ ] バリデーション確認
- [ ] エラーハンドリング確認
- [ ] レスポンシブ表示確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #020: 図書委員管理ページ実装
2. Issue #024: 図書室管理ページ実装
3. Issue #022: ログインページ実装
