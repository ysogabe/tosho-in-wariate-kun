import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/helpers'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export const metadata: Metadata = {
  title: '管理画面 | 図書委員当番くん',
  description: '図書委員当番割り当て管理画面',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // 管理者権限チェック
    await requireAdmin()
  } catch {
    // 認証失敗時はログインページにリダイレクト
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </div>
    </div>
  )
}
