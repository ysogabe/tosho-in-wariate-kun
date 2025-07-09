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
import { Textarea } from '@/components/ui/textarea'
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
import { roomsColumns, RoomData } from '@/components/table/rooms-columns'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { ValidationError } from '@/components/forms/validation-error'
import {
  Plus,
  Search,
  AlertTriangle,
  Building,
  Users,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  MapPin,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateRoomData, UpdateRoomData } from '@/lib/schemas/room-schemas'

interface BulkOperation {
  operation: 'activate' | 'deactivate' | 'delete'
  roomIds: string[]
}

export default function RoomManagementPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [minCapacity, setMinCapacity] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null)
  const [selectedRooms, setSelectedRooms] = useState<RoomData[]>([])
  const [bulkOperation, setBulkOperation] = useState<
    'activate' | 'deactivate' | 'delete'
  >('activate')

  // データフェッチング
  const {
    data: roomsData,
    error: roomsError,
    isLoading: roomsLoading,
    mutate: mutateRooms,
  } = useSWR('/api/rooms?page=1&limit=100', (url) =>
    fetch(url).then((res) => res.json())
  )

  // データの準備
  const rooms = useMemo(() => roomsData?.data?.rooms || [], [roomsData])

  // フィルタリングされた図書室一覧
  const filteredRooms = useMemo(() => {
    return rooms.filter((room: RoomData) => {
      const matchesSearch = room.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesMinCapacity =
        !minCapacity || room.capacity >= parseInt(minCapacity)
      const matchesMaxCapacity =
        !maxCapacity || room.capacity <= parseInt(maxCapacity)
      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && room.isActive) ||
        (selectedStatus === 'inactive' && !room.isActive)

      return (
        matchesSearch &&
        matchesMinCapacity &&
        matchesMaxCapacity &&
        matchesStatus
      )
    })
  }, [rooms, searchTerm, minCapacity, maxCapacity, selectedStatus])

  // 統計情報の計算
  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const activeRooms = rooms.filter((room: RoomData) => room.isActive).length
    const totalCapacity = rooms.reduce(
      (sum: number, room: RoomData) => sum + room.capacity,
      0
    )
    const averageUtilization =
      rooms.length > 0
        ? Math.round(
            rooms.reduce(
              (sum: number, room: RoomData) => sum + room.utilizationRate,
              0
            ) / rooms.length
          )
        : 0

    return {
      totalRooms,
      activeRooms,
      totalCapacity,
      averageUtilization,
    }
  }, [rooms])

  // 新規作成
  async function handleCreateSubmit(data: CreateRoomData) {
    setIsCreating(true)
    setCreateErrors({})
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '図書室の作成に失敗しました')
      }

      toast.success('図書室が正常に作成されました')
      setShowCreateDialog(false)
      await mutateRooms()
      setCreateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '図書室の作成に失敗しました'
      )
    } finally {
      setIsCreating(false)
    }
  }

  // 編集
  async function handleEditSubmit(data: UpdateRoomData) {
    if (!selectedRoom) return

    setIsUpdating(true)
    setUpdateErrors({})
    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '図書室の更新に失敗しました')
      }

      toast.success('図書室が正常に更新されました')
      setShowEditDialog(false)
      setSelectedRoom(null)
      await mutateRooms()
      setUpdateErrors({})
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '図書室の更新に失敗しました'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  // エラー状態管理
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 削除
  async function handleDelete() {
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || '図書室の削除に失敗しました')
      }

      toast.success('図書室が正常に削除されました')
      setShowDeleteDialog(false)
      setSelectedRoom(null)
      await mutateRooms()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '図書室の削除に失敗しました'
      )
    }
  }

  // 一括操作
  async function handleBulkOperation() {
    if (selectedRooms.length === 0) return

    try {
      const bulkData: BulkOperation = {
        operation: bulkOperation,
        roomIds: selectedRooms.map((room) => room.id),
      }

      const response = await fetch('/api/rooms/bulk', {
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
      setSelectedRooms([])
      await mutateRooms()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '一括操作に失敗しました'
      )
    }
  }

  // CSV出力
  const handleExportCSV = useCallback(() => {
    const csvData = filteredRooms.map((room: RoomData) => [
      room.name,
      room.capacity,
      room.classCount,
      room.utilizationRate + '%',
      room.isActive ? 'アクティブ' : '非アクティブ',
      room.description || '',
      new Date(room.createdAt).toLocaleDateString('ja-JP'),
    ])

    const csvContent = [
      [
        '図書室名',
        '収容人数',
        '利用クラス数',
        '利用率',
        'ステータス',
        '説明',
        '作成日',
      ],
      ...csvData,
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rooms_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }, [filteredRooms])

  // エラーハンドリング
  if (roomsError) {
    return (
      <PageLayout title="図書室管理" description="図書室の登録・管理を行います">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            図書室データの取得に失敗しました。ページを再読み込みしてください。
          </AlertDescription>
        </Alert>
      </PageLayout>
    )
  }

  // ローディング状態
  if (roomsLoading) {
    return (
      <PageLayout title="図書室管理" description="図書室の登録・管理を行います">
        <LoadingSpinner text="図書室情報を読み込み中..." />
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="図書室管理"
      description="図書室の登録・管理を行います"
      style={{
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      }}
      actions={
        <div className="flex gap-2">
          {selectedRooms.length > 0 && (
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
              一括操作 ({selectedRooms.length})
            </Button>
          )}
          <Button
            onClick={() => {
              setCreateErrors({})
              setShowCreateDialog(true)
            }}
            style={{
              backgroundColor: 'hsl(180, 100%, 85%)',
              borderColor: 'hsl(180, 70%, 70%)',
              color: 'hsl(180, 80%, 30%)',
              borderRadius: '12px',
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            新規図書室作成
          </Button>
        </div>
      }
    >
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card
          style={{
            backgroundColor: 'hsl(180, 100%, 95%)',
            border: '2px dashed hsl(180, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">🏢 総図書室数</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(180, 80%, 40%)' }}
            >
              {stats.totalRooms}
            </div>
            <p className="text-xs text-muted-foreground">利用可能な図書室</p>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'hsl(120, 60%, 90%)',
            border: '2px dashed hsl(120, 50%, 60%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ✅ アクティブ図書室
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(120, 80%, 30%)' }}
            >
              {stats.activeRooms}
            </div>
            <p className="text-xs text-muted-foreground">運用中の図書室</p>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'hsl(45, 100%, 90%)',
            border: '2px dashed hsl(45, 70%, 60%)',
            borderRadius: '12px',
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">👥 総収容人数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(45, 80%, 30%)' }}
            >
              {stats.totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">全図書室の収容人数</p>
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
            <CardTitle className="text-sm font-medium">📊 平均利用率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ color: 'hsl(280, 80%, 40%)' }}
            >
              {stats.averageUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">
              全図書室の平均利用率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルタエリア */}
      <Card className="mb-6" style={{ borderRadius: '12px' }}>
        <CardHeader>
          <CardTitle>🔍 検索・フィルタ</CardTitle>
          <CardDescription>図書室情報を絞り込んで表示できます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">検索</Label>
              <div className="relative">
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

            <div className="space-y-2">
              <Label htmlFor="min-capacity">最小収容人数</Label>
              <Input
                id="min-capacity"
                type="number"
                placeholder="例: 10"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-capacity">最大収容人数</Label>
              <Input
                id="max-capacity"
                type="number"
                placeholder="例: 50"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状態</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="状態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
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
        columns={roomsColumns}
        data={filteredRooms}
        searchKey="name"
        enableSelection={true}
        onSelectionChange={setSelectedRooms}
      />

      {/* 新規作成ダイアログ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent style={{ borderRadius: '12px' }}>
          <DialogHeader>
            <DialogTitle>🏢 新規図書室作成</DialogTitle>
            <DialogDescription>
              新しい図書室を作成します。必要な情報を入力してください。
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleCreateSubmit({
                name: formData.get('name') as string,
                capacity: parseInt(formData.get('capacity') as string),
                description:
                  (formData.get('description') as string) || undefined,
              })
            }}
            className="space-y-4"
          >
            <ValidationError errors={createErrors} />

            <div className="space-y-2">
              <Label htmlFor="create-name">図書室名 *</Label>
              <Input
                id="create-name"
                name="name"
                placeholder="例: 第1図書室"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-capacity">収容人数 *</Label>
              <Input
                id="create-capacity"
                name="capacity"
                type="number"
                placeholder="例: 30"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">説明</Label>
              <Textarea
                id="create-description"
                name="description"
                placeholder="図書室の特徴や用途を入力してください"
                style={{ borderRadius: '8px' }}
              />
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
                  backgroundColor: 'hsl(180, 100%, 85%)',
                  borderColor: 'hsl(180, 70%, 70%)',
                  color: 'hsl(180, 80%, 30%)',
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
            <DialogTitle>✏️ 図書室編集</DialogTitle>
            <DialogDescription>
              図書室情報を編集します。変更したい項目を修正してください。
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleEditSubmit({
                name: formData.get('name') as string,
                capacity: parseInt(formData.get('capacity') as string),
                description:
                  (formData.get('description') as string) || undefined,
              })
            }}
            className="space-y-4"
          >
            <ValidationError errors={updateErrors} />

            <div className="space-y-2">
              <Label htmlFor="edit-name">図書室名</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={selectedRoom?.name}
                placeholder="例: 第1図書室"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">収容人数</Label>
              <Input
                id="edit-capacity"
                name="capacity"
                type="number"
                defaultValue={selectedRoom?.capacity}
                placeholder="例: 30"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">説明</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={selectedRoom?.description || ''}
                placeholder="図書室の特徴や用途を入力してください"
                style={{ borderRadius: '8px' }}
              />
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
            <AlertDialogTitle>🗑️ 図書室削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{selectedRoom?.name}」を削除してもよろしいですか？
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
              選択した{selectedRooms.length}
              件の図書室に対して一括操作を実行します。
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
  )
}
