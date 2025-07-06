import { cn } from '@/lib/utils'
import { createElement } from 'react'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  headingLevel?: HeadingLevel
}

export function PageLayout({
  children,
  title,
  description,
  actions,
  className,
  headingLevel = 'h1',
}: PageLayoutProps) {
  return (
    <div className={cn('container mx-auto py-6 space-y-6', className)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {createElement(
            headingLevel,
            {
              className: 'text-2xl sm:text-3xl font-bold tracking-tight',
            },
            title
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  )
}
