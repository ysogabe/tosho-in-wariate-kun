'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValidationErrorProps {
  errors?: Record<string, string | string[]> | null | undefined
  className?: string
}

export function ValidationError({ errors, className }: ValidationErrorProps) {
  // エラーがない場合は何も表示しない
  if (!errors || Object.keys(errors).length === 0) {
    return null
  }

  // エラーメッセージを配列に変換
  const errorMessages: string[] = []

  Object.entries(errors).forEach(([, error]) => {
    if (!error) return

    if (Array.isArray(error)) {
      error.forEach((msg) => {
        if (msg && typeof msg === 'string') {
          errorMessages.push(msg)
        }
      })
    } else if (typeof error === 'string') {
      errorMessages.push(error)
    }
  })

  // 表示するエラーがない場合は何も表示しない
  if (errorMessages.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-describedby="validation-errors"
      className={cn('rounded-lg border p-4 space-y-1', className)}
      style={{
        backgroundColor: 'hsl(0, 100%, 95%)',
        borderColor: 'hsl(0, 70%, 70%)',
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
        color: 'hsl(340, 80%, 45%)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle
          className="h-4 w-4 animate-pulse"
          style={{ color: 'hsl(0, 70%, 50%)' }}
        />
        <span className="text-sm font-medium">❌ 入力エラーがあります</span>
      </div>

      <ul id="validation-errors" role="list" className="space-y-1 ml-6">
        {errorMessages.map((message, index) => (
          <li
            key={index}
            role="listitem"
            className="text-sm"
            style={{
              color: 'hsl(340, 60%, 50%)',
              listStyleType: 'disc',
            }}
          >
            {message}
          </li>
        ))}
      </ul>
    </div>
  )
}
