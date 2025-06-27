'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // エラーは上位コンポーネントで処理することを想定
    } finally {
      setIsConfirming(false)
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
          >
            {isConfirming ? '処理中...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Specialized confirmation dialogs
export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading = false,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  itemName: string
  isLoading?: boolean
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="削除の確認"
      description={`「${itemName}」を削除してもよろしいですか？この操作は取り消せません。`}
      confirmText="削除"
      variant="destructive"
      isLoading={isLoading}
    />
  )
}

export function ResetConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  description,
  isLoading = false,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  description: string
  isLoading?: boolean
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="リセットの確認"
      description={description}
      confirmText="リセット"
      variant="warning"
      isLoading={isLoading}
    />
  )
}
