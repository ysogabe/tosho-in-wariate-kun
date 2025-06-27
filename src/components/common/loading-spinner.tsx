import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center p-4', className)}
    >
      <Loader2
        className={cn('animate-spin text-primary', sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p
          className="mt-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {text}
        </p>
      )}
      <span className="sr-only">読み込み中</span>
    </div>
  )
}

// Specialized loading components
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="読み込み中..." />
    </div>
  )
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  const skeletonRows = useMemo(
    () =>
      Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 w-[100px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[150px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[100px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[80px] bg-muted animate-pulse rounded" />
        </div>
      )),
    [rows]
  )

  return <div className="space-y-3">{skeletonRows}</div>
}

export function CardLoading() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-6 w-[200px] bg-muted animate-pulse rounded" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-[80%] bg-muted animate-pulse rounded" />
    </div>
  )
}
