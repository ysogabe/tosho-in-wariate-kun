'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Calendar,
  Play,
  RefreshCw,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

type Term = 'FIRST_TERM' | 'SECOND_TERM'

interface ScheduleStats {
  totalAssignments: number
  uniqueStudents: number
  termBreakdown: {
    FIRST_TERM: number
    SECOND_TERM: number
  }
  dayBreakdown: Record<number, number>
  roomBreakdown: Record<string, { name: string; count: number }>
  gradeBreakdown: Record<number, number>
}

interface ScheduleData {
  id: string
  term: string
  dayOfWeek: number
  dayName: string
  room: {
    id: string
    name: string
    capacity: number
  }
  student: {
    id: string
    name: string
    grade: number
    class: {
      id: string
      name: string
      year: number
    }
  }
  createdAt: string
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleData[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentTerm, setCurrentTerm] = useState<Term>('FIRST_TERM')
  const { toast } = useToast()

  // スケジュール一覧を取得
  const fetchSchedules = useCallback(
    async (term?: Term) => {
      try {
        setLoading(true)
        const url = term ? `/api/schedules?term=${term}` : '/api/schedules'
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('スケジュール一覧の取得に失敗しました')
        }

        const data = await response.json()
        setSchedules(data.data.schedules)
        setStats(data.data.stats)
      } catch (error) {
        console.error('Failed to fetch schedules:', error)
        toast({
          title: 'エラー',
          description: 'スケジュール一覧の取得に失敗しました',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  // スケジュール生成
  const generateSchedule = async (term: Term, forceRegenerate = false) => {
    try {
      setGenerating(true)

      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term,
          forceRegenerate,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'スケジュール生成に失敗しました')
      }

      const data = await response.json()

      toast({
        title: '成功',
        description: data.data.message,
      })

      // 生成後にスケジュール一覧を再取得
      await fetchSchedules(term)
    } catch (error) {
      console.error('Failed to generate schedule:', error)
      toast({
        title: 'エラー',
        description:
          error instanceof Error
            ? error.message
            : 'スケジュール生成に失敗しました',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // 学期切り替え
  const handleTermChange = (term: Term) => {
    setCurrentTerm(term)
    fetchSchedules(term)
  }

  // 初期データ読み込み
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // 曜日名を取得
  const getDayName = (dayOfWeek: number): string => {
    const dayNames = ['', '月', '火', '水', '木', '金', '土', '日']
    return dayNames[dayOfWeek] || '不明'
  }

  // 学期のスケジュールをフィルタリング
  const termSchedules = schedules.filter((s) => s.term === currentTerm)
  const hasSchedules = termSchedules.length > 0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
          <p className="text-gray-600 mt-1">
            図書委員の当番表を生成・管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchSchedules(currentTerm)}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            更新
          </Button>
        </div>
      </div>

      {/* 学期選択 */}
      <div className="flex gap-2">
        <Button
          variant={currentTerm === 'FIRST_TERM' ? 'default' : 'outline'}
          onClick={() => handleTermChange('FIRST_TERM')}
          disabled={loading}
        >
          前期
        </Button>
        <Button
          variant={currentTerm === 'SECOND_TERM' ? 'default' : 'outline'}
          onClick={() => handleTermChange('SECOND_TERM')}
          disabled={loading}
        >
          後期
        </Button>
      </div>

      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  総割り当て数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAssignments}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  参加図書委員数
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.uniqueStudents}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  前期割り当て
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.termBreakdown.FIRST_TERM}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  後期割り当て
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.termBreakdown.SECOND_TERM}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* スケジュール生成セクション */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentTerm === 'FIRST_TERM' ? '前期' : '後期'}スケジュール生成
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {hasSchedules
                ? 'スケジュールが既に生成されています。再生成する場合は「強制再生成」を選択してください。'
                : 'スケジュールがまだ生成されていません。「スケジュール生成」ボタンをクリックして作成してください。'}
            </p>
          </div>
          <div className="flex gap-2">
            {hasSchedules && (
              <Button
                variant="outline"
                onClick={() => generateSchedule(currentTerm, true)}
                disabled={generating}
              >
                {generating && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                強制再生成
              </Button>
            )}
            <Button
              onClick={() => generateSchedule(currentTerm, false)}
              disabled={generating || hasSchedules}
            >
              {generating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              スケジュール生成
            </Button>
          </div>
        </div>
      </Card>

      {/* スケジュール表示 */}
      {hasSchedules ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentTerm === 'FIRST_TERM' ? '前期' : '後期'}当番表
            </h2>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              印刷用表示
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">曜日</th>
                  <th className="text-left p-2">図書室</th>
                  <th className="text-left p-2">図書委員</th>
                  <th className="text-left p-2">学年・クラス</th>
                </tr>
              </thead>
              <tbody>
                {termSchedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Badge variant="outline">
                        {getDayName(schedule.dayOfWeek)}曜日
                      </Badge>
                    </td>
                    <td className="p-2">{schedule.room.name}</td>
                    <td className="p-2 font-medium">{schedule.student.name}</td>
                    <td className="p-2">
                      {schedule.student.grade}年{schedule.student.class.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentTerm === 'FIRST_TERM' ? '前期' : '後期'}
            のスケジュールがありません
          </h3>
          <p className="text-gray-600">
            スケジュール生成ボタンをクリックして当番表を作成してください。
          </p>
        </Card>
      )}
    </div>
  )
}
