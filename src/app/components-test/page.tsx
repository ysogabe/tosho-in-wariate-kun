'use client'

import React, { useState } from 'react'
import {
  LoadingSpinner,
  TableLoading,
  CardLoading,
} from '@/components/common/loading-spinner'
import { ComponentErrorBoundary } from '@/components/common/error-boundary'
import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  ResetConfirmationDialog,
} from '@/components/common/confirmation-dialog'
import { Pagination } from '@/components/common/pagination'
import { Icon, AppIcons } from '@/components/common/icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, Settings, Calendar } from 'lucide-react'

function ErrorComponent(): React.ReactElement {
  throw new Error('Test error from component')
}

export default function ComponentsTestPage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [showError, setShowError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Common Components Test</h1>
        <p className="text-muted-foreground">
          共通コンポーネントの動作確認ページ
        </p>
      </div>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
          <CardDescription>ローディング表示コンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <LoadingSpinner size="sm" text="Small" />
            <LoadingSpinner size="md" text="Medium" />
            <LoadingSpinner size="lg" text="Large" />
          </div>
          <div>
            <h4 className="font-medium mb-2">Table Loading</h4>
            <TableLoading rows={3} />
          </div>
          <div>
            <h4 className="font-medium mb-2">Card Loading</h4>
            <CardLoading />
          </div>
        </CardContent>
      </Card>

      {/* Error Boundary */}
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary</CardTitle>
          <CardDescription>エラーバウンダリーコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowError(!showError)}>
            {showError ? 'エラーを非表示' : 'エラーを表示'}
          </Button>
          {showError && (
            <ComponentErrorBoundary>
              <ErrorComponent />
            </ComponentErrorBoundary>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Dialogs</CardTitle>
          <CardDescription>確認ダイアログコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowConfirm(true)}>基本ダイアログ</Button>
            <Button onClick={() => setShowDelete(true)} variant="destructive">
              削除ダイアログ
            </Button>
            <Button onClick={() => setShowReset(true)} variant="outline">
              リセットダイアログ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Icons</CardTitle>
          <CardDescription>アイコンコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Different Sizes</h4>
            <div className="flex gap-4 items-center">
              <Icon icon={Users} size="sm" />
              <Icon icon={Settings} size="md" />
              <Icon icon={Calendar} size="lg" />
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">App Icons</h4>
            <div className="flex gap-4 items-center">
              <AppIcons.Dashboard />
              <AppIcons.Add />
              <AppIcons.Success />
              <AppIcons.Book />
              <AppIcons.School />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Pagination</CardTitle>
          <CardDescription>ページネーションコンポーネント</CardDescription>
        </CardHeader>
        <CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            pageSize={pageSize}
            totalItems={195}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Demo System State */}
      <Card>
        <CardHeader>
          <CardTitle>システム状態デモ</CardTitle>
          <CardDescription>実際の使用例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">データベース:</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <AppIcons.Success />
                正常
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">認証システム:</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <AppIcons.Success />
                正常
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">UIライブラリ:</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <AppIcons.Success />
                正常
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          console.log('Confirmed')
          setShowConfirm(false)
        }}
        title="確認"
        description="この操作を実行してもよろしいですか？"
      />

      <DeleteConfirmationDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => {
          console.log('Deleted')
          setShowDelete(false)
        }}
        itemName="田中花子"
      />

      <ResetConfirmationDialog
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={() => {
          console.log('Reset')
          setShowReset(false)
        }}
        description="すべての当番表がリセットされ、データは復元できません。"
      />
    </div>
  )
}
