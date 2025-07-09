'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { PageLayout } from '@/components/layout/page-layout'
import { toast } from 'sonner'
import {
  Calendar,
  Play,
  RefreshCw,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  Download,
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
  // toast は sonner から import されているので不要

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
        toast.error('❌ スケジュール一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    },
    []
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

      toast.success(`✨ ${data.data.message}`)

      // 生成後にスケジュール一覧を再取得
      await fetchSchedules(term)
    } catch (error) {
      console.error('Failed to generate schedule:', error)
      toast.error(
        error instanceof Error
          ? `❌ ${error.message}`
          : '❌ スケジュール生成に失敗しました'
      )
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

  if (loading) {
    return (
      <PageLayout
        title="📅 スケジュール管理"
        description="図書委員の当番表を生成・管理します"
        schoolName="🏫 かがやき小学校 図書委員当番"
      >
        <LoadingSpinner text="スケジュール情報を読み込み中..." />
      </PageLayout>
    )
  }

  return (
    <div style={{ fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif' }}>
      <PageLayout
        title="📅 スケジュール管理"
        description="図書委員の当番表を生成・管理します"
        schoolName="🏫 かがやき小学校 図書委員当番"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchSchedules(currentTerm)}
              disabled={loading}
              style={{
                backgroundColor: 'hsl(120, 60%, 95%)',
                borderColor: 'hsl(120, 50%, 70%)',
                color: 'hsl(120, 80%, 30%)',
                borderRadius: '12px',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              📊 更新
            </Button>
          </div>
        }
      >

        {/* 学期選択 */}
        <Card
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid hsl(280, 80%, 90%)',
            borderRadius: '12px',
          }}
          className="mb-6"
        >
          <CardHeader>
            <CardTitle
              style={{
                color: 'hsl(340, 70%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              📗📘 学期選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={currentTerm === 'FIRST_TERM' ? 'default' : 'outline'}
                onClick={() => handleTermChange('FIRST_TERM')}
                disabled={loading}
                style={{
                  backgroundColor: currentTerm === 'FIRST_TERM' 
                    ? 'hsl(140, 70%, 85%)' 
                    : 'hsl(140, 100%, 95%)',
                  borderColor: 'hsl(140, 70%, 70%)',
                  color: currentTerm === 'FIRST_TERM' 
                    ? 'hsl(140, 80%, 30%)' 
                    : 'hsl(140, 80%, 40%)',
                  borderRadius: '12px',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                📗 前期
              </Button>
              <Button
                variant={currentTerm === 'SECOND_TERM' ? 'default' : 'outline'}
                onClick={() => handleTermChange('SECOND_TERM')}
                disabled={loading}
                style={{
                  backgroundColor: currentTerm === 'SECOND_TERM' 
                    ? 'hsl(200, 70%, 85%)' 
                    : 'hsl(200, 100%, 95%)',
                  borderColor: 'hsl(200, 70%, 70%)',
                  color: currentTerm === 'SECOND_TERM' 
                    ? 'hsl(200, 80%, 30%)' 
                    : 'hsl(200, 80%, 40%)',
                  borderRadius: '12px',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                📘 後期
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card
              style={{
                backgroundColor: 'hsl(200, 100%, 95%)',
                border: '2px dashed hsl(200, 70%, 70%)',
                borderRadius: '12px',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {stats.totalAssignments}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'hsl(340, 60%, 50%)' }}
                    >
                      📅 総割り当て数
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: 'hsl(140, 100%, 95%)',
                border: '2px dashed hsl(140, 70%, 70%)',
                borderRadius: '12px',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {stats.uniqueStudents}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'hsl(340, 60%, 50%)' }}
                    >
                      👥 参加図書委員数
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: 'hsl(280, 100%, 95%)',
                border: '2px dashed hsl(280, 70%, 70%)',
                borderRadius: '12px',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {stats.termBreakdown.FIRST_TERM}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'hsl(340, 60%, 50%)' }}
                    >
                      📗 前期割り当て
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: 'hsl(30, 100%, 95%)',
                border: '2px dashed hsl(30, 100%, 70%)',
                borderRadius: '12px',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {stats.termBreakdown.SECOND_TERM}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'hsl(340, 60%, 50%)' }}
                    >
                      📘 後期割り当て
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* スケジュール生成セクション */}
        <Card
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid hsl(350, 80%, 90%)',
            borderRadius: '12px',
          }}
          className="mb-6"
        >
          <CardHeader>
            <CardTitle
              style={{
                color: 'hsl(340, 70%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              🎯 {currentTerm === 'FIRST_TERM' ? '📗 前期' : '📘 後期'}スケジュール生成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-sm mb-4"
              style={{
                color: 'hsl(340, 60%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              {hasSchedules
                ? '✅ スケジュールが既に生成されています。再生成する場合は「強制再生成」を選択してください。'
                : '⏰ スケジュールがまだ生成されていません。「スケジュール生成」ボタンをクリックして作成してください。'}
            </p>
            <div className="flex gap-3">
              {hasSchedules && (
                <Button
                  variant="outline"
                  onClick={() => generateSchedule(currentTerm, true)}
                  disabled={generating}
                  style={{
                    backgroundColor: 'hsl(45, 100%, 95%)',
                    borderColor: 'hsl(45, 70%, 70%)',
                    color: 'hsl(45, 80%, 30%)',
                    borderRadius: '12px',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  {generating && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  🔄 強制再生成
                </Button>
              )}
              <Button
                onClick={() => generateSchedule(currentTerm, false)}
                disabled={generating || hasSchedules}
                style={{
                  backgroundColor: 'hsl(140, 70%, 85%)',
                  borderColor: 'hsl(140, 70%, 70%)',
                  color: 'hsl(140, 80%, 30%)',
                  borderRadius: '12px',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                ✨ スケジュール生成
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* スケジュール表示 */}
        {hasSchedules ? (
          <Card
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid hsl(260, 80%, 90%)',
              borderRadius: '12px',
            }}
            className="p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-semibold"
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                📊 {currentTerm === 'FIRST_TERM' ? '📗 前期' : '📘 後期'}当番表
              </h2>
              <Button
                variant="outline"
                size="sm"
                style={{
                  backgroundColor: 'hsl(240, 100%, 95%)',
                  borderColor: 'hsl(240, 70%, 70%)',
                  color: 'hsl(240, 80%, 30%)',
                  borderRadius: '12px',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                🖨️ 印刷用表示
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px dashed hsl(200, 70%, 70%)',
                    }}
                  >
                    <th
                      className="text-left p-3"
                      style={{
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      📅 曜日
                    </th>
                    <th
                      className="text-left p-3"
                      style={{
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      📚 図書室
                    </th>
                    <th
                      className="text-left p-3"
                      style={{
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      👤 図書委員
                    </th>
                    <th
                      className="text-left p-3"
                      style={{
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      🏫 学年・クラス
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {termSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="transition-all duration-200 hover:shadow-sm"
                      style={{
                        borderBottom: '1px dashed hsl(200, 50%, 80%)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(200, 100%, 98%)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: 'hsl(180, 100%, 95%)',
                            borderColor: 'hsl(180, 70%, 70%)',
                            color: 'hsl(180, 80%, 30%)',
                            borderRadius: '8px',
                            fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                          }}
                        >
                          {getDayName(schedule.dayOfWeek)}曜日
                        </Badge>
                      </td>
                      <td
                        className="p-3"
                        style={{
                          color: 'hsl(340, 60%, 50%)',
                          fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                        }}
                      >
                        {schedule.room.name}
                      </td>
                      <td
                        className="p-3 font-medium"
                        style={{
                          color: 'hsl(340, 80%, 45%)',
                          fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                        }}
                      >
                        {schedule.student.name}
                      </td>
                      <td
                        className="p-3"
                        style={{
                          color: 'hsl(340, 60%, 50%)',
                          fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                        }}
                      >
                        {schedule.student.grade}年{schedule.student.class.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '2px dashed hsl(30, 80%, 80%)',
              borderRadius: '12px',
            }}
            className="p-8 text-center"
          >
            <AlertCircle
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: 'hsl(30, 70%, 60%)' }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{
                color: 'hsl(340, 70%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              😔 {currentTerm === 'FIRST_TERM' ? '📗 前期' : '📘 後期'}
              のスケジュールがありません
            </h3>
            <p
              style={{
                color: 'hsl(340, 60%, 50%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              ✨ スケジュール生成ボタンをクリックして当番表を作成してください。
            </p>
          </Card>
        )}
      </PageLayout>
    </div>
  )
}
