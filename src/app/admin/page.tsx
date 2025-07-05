import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { School, Users, Calendar, BookOpen, TrendingUp } from 'lucide-react'

// TODO: 実際のデータ取得に置き換える
const dashboardStats = {
  totalClasses: 12,
  totalStudents: 156,
  activeCommitteeMembers: 24,
  totalRooms: 3,
  currentTerm: 'FIRST_TERM' as const,
  schedulesGenerated: 2,
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">
          図書委員当番割り当てシステムの管理画面
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総クラス数</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalClasses}
              </p>
            </div>
            <School className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">総生徒数</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalStudents}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">図書委員数</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.activeCommitteeMembers}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">図書室数</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalRooms}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* 現在の状態 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            現在の学期
          </h2>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-600" />
            <Badge variant="default" className="text-sm">
              {dashboardStats.currentTerm === 'FIRST_TERM' ? '前期' : '後期'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            現在は
            {dashboardStats.currentTerm === 'FIRST_TERM' ? '前期' : '後期'}
            です。
            {dashboardStats.schedulesGenerated > 0
              ? `スケジュールが${dashboardStats.schedulesGenerated}回生成されています。`
              : 'まだスケジュールが生成されていません。'}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            最近のアクティビティ
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">システム稼働中</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                {dashboardStats.schedulesGenerated}回のスケジュール生成
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">
                {dashboardStats.activeCommitteeMembers}名の図書委員が登録済み
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/classes"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <School className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">クラス管理</h3>
            <p className="text-sm text-gray-600">クラスの追加・編集・削除</p>
          </a>

          <a
            href="/admin/students"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">図書委員管理</h3>
            <p className="text-sm text-gray-600">図書委員の登録・管理</p>
          </a>

          <a
            href="/admin/schedules"
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">スケジュール生成</h3>
            <p className="text-sm text-gray-600">当番表の自動生成</p>
          </a>
        </div>
      </Card>
    </div>
  )
}
