import { Header } from './header'
import { ErrorBoundary } from '@/components/common/error-boundary'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  )
}
