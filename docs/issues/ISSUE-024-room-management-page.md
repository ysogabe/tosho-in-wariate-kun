# Issue #024: 図書室管理ページの実装

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Frontend  
**Labels**: frontend, pages, room-management, crud

## Description

図書室情報の管理を行うページを実装します。図書室の一覧表示、新規作成、編集、削除機能を統合した管理インターフェースを提供します。

## Background

フロントエンド設計書で定義された図書室管理画面の要件に基づき、図書室の基本情報と定員管理を行う効率的な管理システムを構築します。

## Acceptance Criteria

- [ ] 図書室管理ページが実装されている
- [ ] 図書室一覧表示機能が実装されている
- [ ] 図書室新規作成機能が実装されている
- [ ] 図書室編集機能が実装されている
- [ ] 図書室削除機能が実装されている
- [ ] 検索・フィルタ機能が実装されている
- [ ] 使用状況表示機能が実装されている
- [ ] バリデーションとエラーハンドリングが実装されている

## Implementation Guidelines

### Getting Started

1. Issue #016（フォームバリデーション）が完了していることを確認
2. Issue #008（テーブルコンポーネント）が完了していることを確認
3. 図書室管理APIエンドポイントの実装
4. CRUDページの設計パターンを理解

### Main Implementation

#### 1. Room Management API

##### src/app/api/rooms/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin, authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'
import { createRoomSchema } from '@/lib/schemas/room-schemas'

const RoomsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const params = RoomsQuerySchema.parse(Object.fromEntries(searchParams))

    const where = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          _count: {
            select: { assignments: true },
          },
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.room.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms.map((r) => ({
          ...r,
          assignmentCount: r._count.assignments,
        })),
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const { name, capacity, description, isActive } =
      createRoomSchema.parse(body)

    const existingRoom = await prisma.room.findFirst({
      where: { name },
    })

    if (existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_ALREADY_EXISTS',
            message: '同じ名前の図書室が既に存在します',
          },
        },
        { status: 409 }
      )
    }

    const newRoom = await prisma.room.create({
      data: { name, capacity, description, isActive },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          room: {
            ...newRoom,
            assignmentCount: newRoom._count.assignments,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラーが発生しました',
          details: error.errors,
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  )
}
```

##### src/app/api/rooms/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { updateRoomSchema } from '@/lib/schemas/room-schemas'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const updateData = updateRoomSchema.parse(body)

    const existingRoom = await prisma.room.findUnique({
      where: { id: params.id },
    })

    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: '図書室が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        room: {
          ...updatedRoom,
          assignmentCount: updatedRoom._count.assignments,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request)

    const existingRoom = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    })

    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: '図書室が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    if (existingRoom._count.assignments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ROOM_HAS_ASSIGNMENTS',
            message: 'この図書室には当番が割り当てられているため削除できません',
          },
        },
        { status: 409 }
      )
    }

    await prisma.room.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: '図書室が削除されました',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  )
}
```

#### 2. Room Management Page

##### src/app/admin/rooms/page.tsx

```typescript
'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ValidationError } from '@/components/forms/validation-error'
import {
  Plus,
  Search,
  AlertTriangle,
  BookOpen,
  Users,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useFormValidation } from '@/lib/hooks/use-form-validation'
import { createRoomSchema, updateRoomSchema } from '@/lib/schemas/room-schemas'
import type { CreateRoomData, UpdateRoomData } from '@/lib/schemas/room-schemas'

interface Room {
  id: string
  name: string
  capacity: number
  description?: string
  isActive: boolean
  assignmentCount: number
  createdAt: string
  updatedAt: string
}

export default function RoomManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // データフェッチング
  const {
    data: roomsData,
    error,
    isLoading,
    mutate
  } = useSWR(
    `/api/rooms?search=${encodeURIComponent(searchTerm)}&isActive=${statusFilter}&limit=100`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }
      return response.json()
    }
  )

  // 図書室作成
  const {
    errors: createErrors,
    isSubmitting: isCreating,
    handleSubmit: handleCreateSubmit,
    clearErrors: clearCreateErrors
  } = useFormValidation({
    schema: createRoomSchema,
    onSubmit: async (data: CreateRoomData) => {
      try {
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('図書室を作成しました')
          setShowCreateDialog(false)
          mutate()
        } else {
          toast.error(result.error.message || '図書室作成に失敗しました')
        }
      } catch (error) {
        console.error('Room creation error:', error)
        toast.error('図書室作成中にエラーが発生しました')
      }
    }
  })

  // 図書室更新
  const {
    errors: updateErrors,
    isSubmitting: isUpdating,
    handleSubmit: handleUpdateSubmit,
    clearErrors: clearUpdateErrors
  } = useFormValidation({
    schema: updateRoomSchema,
    onSubmit: async (data: UpdateRoomData) => {
      if (!selectedRoom) return

      try {
        const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          toast.success('図書室情報を更新しました')
          setShowEditDialog(false)
          setSelectedRoom(null)
          mutate()
        } else {
          toast.error(result.error.message || '図書室更新に失敗しました')
        }
      } catch (error) {
        console.error('Room update error:', error)
        toast.error('図書室更新中にエラーが発生しました')
      }
    }
  })

  // 図書室削除
  const handleDeleteRoom = useCallback(async () => {
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('図書室を削除しました')
        setShowDeleteDialog(false)
        setSelectedRoom(null)
        mutate()
      } else {
        toast.error(result.error.message || '図書室削除に失敗しました')
      }
    } catch (error) {
      console.error('Room deletion error:', error)
      toast.error('図書室削除中にエラーが発生しました')
    }
  }, [selectedRoom, mutate])

  const rooms = roomsData?.data?.rooms || []

  // 統計情報
  const statistics = useMemo(() => {
    return {
      total: rooms.length,
      active: rooms.filter(r => r.isActive).length,
      inactive: rooms.filter(r => !r.isActive).length,
      totalCapacity: rooms.filter(r => r.isActive).reduce((sum, r) => sum + r.capacity, 0),
      withAssignments: rooms.filter(r => r.assignmentCount > 0).length,
    }
  }, [rooms])

  // テーブル用の列設定
  const tableColumns = [
    {
      accessorKey: "name",
      header: "図書室名",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "capacity",
      header: "定員",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("capacity")}名</span>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "状態",
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
          {row.getValue("isActive") ? "稼働中" : "停止中"}
        </Badge>
      ),
    },
    {
      accessorKey: "assignmentCount",
      header: "使用状況",
      cell: ({ row }: { row: any }) => {
        const count = row.getValue("assignmentCount") as number
        return (
          <div className="flex items-center gap-2">
            {count > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            <span>{count}件の当番</span>
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: "説明",
      cell: ({ row }: { row: any }) => {
        const description = row.getValue("description") as string
        return description ? (
          <span className="text-sm text-muted-foreground truncate max-w-xs">
            {description}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }: { row: any }) => {
        const room = row.original as Room

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRoom(room)
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
                setSelectedRoom(room)
                setShowDeleteDialog(true)
              }}
              disabled={room.assignmentCount > 0}
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
      <PageLayout title="図書室管理" description="図書室情報の管理">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            図書室データの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="図書室管理"
      description="図書室の基本情報を管理します"
      actions={
        <Button
          onClick={() => {
            clearCreateErrors()
            setShowCreateDialog(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          新規図書室
        </Button>
      }
    >
      <div className="space-y-6">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{statistics.total}</div>
                  <p className="text-sm text-muted-foreground">総図書室数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                  <p className="text-sm text-muted-foreground">稼働中</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-2xl font-bold text-gray-500">{statistics.inactive}</div>
                  <p className="text-sm text-muted-foreground">停止中</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{statistics.totalCapacity}</div>
                  <p className="text-sm text-muted-foreground">総定員数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{statistics.withAssignments}</div>
                  <p className="text-sm text-muted-foreground">使用中の図書室</p>
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
                <Label htmlFor="search">図書室検索</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="図書室名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>状態</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="true">稼働中</SelectItem>
                    <SelectItem value="false">停止中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 図書室一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>図書室一覧</CardTitle>
            <CardDescription>
              登録されている図書室の一覧です
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" text="図書室情報を読み込み中..." />
              </div>
            ) : (
              <DataTable
                columns={tableColumns}
                data={rooms}
                searchKey="name"
                searchPlaceholder="図書室名で検索..."
              />
            )}
          </CardContent>
        </Card>

        {/* 図書室作成ダイアログ */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規図書室作成</DialogTitle>
              <DialogDescription>
                新しい図書室を作成します
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSubmit({
                name: formData.get('name') as string,
                capacity: parseInt(formData.get('capacity') as string),
                description: formData.get('description') as string || undefined,
                isActive: formData.get('isActive') === 'on',
              })
            }}>
              <div className="space-y-4">
                <ValidationError errors={createErrors} />

                <div className="space-y-2">
                  <Label htmlFor="create-name">図書室名</Label>
                  <Input
                    id="create-name"
                    name="name"
                    placeholder="図書室A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-capacity">定員</Label>
                  <Input
                    id="create-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">説明（任意）</Label>
                  <Textarea
                    id="create-description"
                    name="description"
                    placeholder="図書室の詳細説明..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-isActive"
                    name="isActive"
                    defaultChecked
                  />
                  <Label htmlFor="create-isActive">稼働中</Label>
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

        {/* 図書室編集ダイアログ */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>図書室編集</DialogTitle>
              <DialogDescription>
                図書室情報を編集します
              </DialogDescription>
            </DialogHeader>

            {selectedRoom && (
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateSubmit({
                  name: formData.get('name') as string,
                  capacity: parseInt(formData.get('capacity') as string),
                  description: formData.get('description') as string || undefined,
                  isActive: formData.get('isActive') === 'on',
                })
              }}>
                <div className="space-y-4">
                  <ValidationError errors={updateErrors} />

                  <div className="space-y-2">
                    <Label htmlFor="edit-name">図書室名</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedRoom.name}
                      placeholder="図書室A"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity">定員</Label>
                    <Input
                      id="edit-capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      max="10"
                      defaultValue={selectedRoom.capacity}
                      placeholder="4"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">説明（任意）</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      defaultValue={selectedRoom.description || ''}
                      placeholder="図書室の詳細説明..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isActive"
                      name="isActive"
                      defaultChecked={selectedRoom.isActive}
                    />
                    <Label htmlFor="edit-isActive">稼働中</Label>
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
                図書室削除
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedRoom && (
                  <>
                    <strong>「{selectedRoom.name}」</strong>を削除します。
                    この操作は取り消せません。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRoom}
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

- [Room Management Systems](https://en.wikipedia.org/wiki/Facility_management)
- [CRUD Interface Patterns](https://ui-patterns.com/patterns/CrudOperations)
- [Data Validation Best Practices](https://ux.stackexchange.com/questions/96970/best-practices-for-form-validation)

## Implementation Results

### Work Completed

- [ ] 図書室管理API実装
- [ ] 図書室管理ページ実装
- [ ] CRUD機能実装
- [ ] 検索・フィルタ機能実装
- [ ] 統計情報表示実装
- [ ] バリデーション・エラーハンドリング実装

### Testing Results

- [ ] CRUD操作確認
- [ ] バリデーション確認
- [ ] 使用状況表示確認
- [ ] エラーハンドリング確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #025: システム設定ページ実装
2. Issue #026: エラーページ実装
3. Issue #027: テストセットアップ
