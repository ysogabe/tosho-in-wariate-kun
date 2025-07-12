import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BookOpen, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createElement } from 'react'

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface PageLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  headingLevel?: HeadingLevel
  userName?: string
  schoolName?: string
  style?: React.CSSProperties
}

export function PageLayout({
  children,
  title,
  description,
  actions,
  className,
  headingLevel = 'h1',
  userName = '管理者',
  schoolName = '図書委員管理システム',
  style,
}: PageLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'hsl(50, 100%, 97%)',
        backgroundImage:
          'linear-gradient(135deg, rgba(255, 230, 240, 0.4) 0%, rgba(255, 240, 245, 0.3) 100%)',
        ...style,
      }}
    >
      {/* Header */}
      <header
        className="shadow-sm border-b-2 border-dashed"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottomColor: 'hsl(350, 80%, 90%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 relative mr-3 animate-float">
                <BookOpen
                  className="w-12 h-12 object-contain"
                  style={{ color: 'hsl(180, 70%, 75%)' }}
                />
              </div>
              <h1
                className="text-2xl font-bold"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  textShadow: '1px 1px 0 rgba(255, 255, 255, 0.8)',
                }}
              >
                {schoolName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="mr-4 hidden sm:inline"
              style={{ color: 'hsl(340, 70%, 40%)' }}
            >
              {userName}さん
            </span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300"
            >
              <Link href="/admin/settings">
                <Settings
                  className="h-5 w-5"
                  style={{ color: 'hsl(340, 60%, 65%)' }}
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="inline-flex items-center h-8 px-4 bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-300 text-sm font-medium"
              style={{ color: 'hsl(340, 60%, 65%)' }}
            >
              <Link href="/auth/login">
                <LogOut className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={cn('space-y-6 animate-fadeIn', className)}>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              {createElement(
                headingLevel,
                {
                  className: 'text-2xl sm:text-3xl font-bold tracking-tight',
                  style: { color: 'hsl(340, 80%, 45%)' },
                },
                title
              )}
              {description && description.trim() && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-wrap">{actions}</div>
            )}
          </div>

          {/* Page Content */}
          <div className="space-y-6">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t-2 border-dashed mt-16"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderTopColor: 'hsl(350, 80%, 90%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
              © {new Date().getFullYear()} 図書委員当番くん -
              小学校図書委員の当番表自動生成システム
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
