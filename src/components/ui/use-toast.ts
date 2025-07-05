'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = (++toastCount).toString()
      const newToast: Toast = { id, title, description, variant }

      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }))

      // Auto-remove toast after 3 seconds
      setTimeout(() => {
        setState((prev) => ({
          toasts: prev.toasts.filter((t) => t.id !== id),
        }))
      }, 3000)

      return id
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    setState((prev) => ({
      toasts: prev.toasts.filter((t) => t.id !== toastId),
    }))
  }, [])

  const dismissAll = useCallback(() => {
    setState({ toasts: [] })
  }, [])

  return {
    toast,
    dismiss,
    dismissAll,
    toasts: state.toasts,
  }
}
