'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  School,
  Users,
  Calendar,
  Settings,
  Home,
  BookOpen,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const sidebarItems = [
  {
    title: 'ダッシュボード',
    href: '/admin',
    icon: Home,
  },
  {
    title: 'クラス管理',
    href: '/admin/classes',
    icon: School,
  },
  {
    title: '図書委員管理',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: '図書室管理',
    href: '/admin/rooms',
    icon: BookOpen,
  },
  {
    title: 'スケジュール',
    href: '/admin/schedules',
    icon: Calendar,
  },
  {
    title: '設定',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const handleSignOut = () => {
    // TODO: Implement proper logout
    window.location.href = '/auth/login'
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">図書委員当番くん</h1>
        <p className="text-sm text-gray-600 mt-1">管理画面</p>
      </div>

      <nav className="px-3">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          ログアウト
        </Button>
      </div>
    </div>
  )
}
