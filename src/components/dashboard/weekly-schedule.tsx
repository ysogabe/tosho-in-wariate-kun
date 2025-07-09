/**
 * 週間スケジュール表示コンポーネント (TDD - Green Phase)
 */

'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import {
  RefreshCw,
  AlertCircle,
  BarChart3,
  Printer,
  Calendar,
} from 'lucide-react'

interface Assignment {
  id: string
  dayOfWeek: number
  room: {
    id: string
    name: string
  }
  student: {
    name: string
    class: {
      year: number
      name: string
    }
  }
}

interface WeeklyScheduleData {
  assignments: Assignment[]
}

interface WeeklyScheduleResponse {
  success: boolean
  data: WeeklyScheduleData
  error?: string
}

// 曜日のマッピング
const dayNames = ['', '月', '火', '水', '木', '金']
const weekdays = [1, 2, 3, 4, 5] // 月曜～金曜

// 現在の曜日を取得（月曜=1）
const getCurrentDayOfWeek = (): number => {
  const today = new Date()
  const jsDay = today.getDay() // 0=日曜, 1=月曜, ...
  return jsDay === 0 ? 7 : jsDay // 日曜日は7に変換
}

export function WeeklySchedule() {
  const [retryKey, setRetryKey] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)
  const currentDayOfWeek = getCurrentDayOfWeek()

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR<WeeklyScheduleResponse>(
    `/api/schedules?retry=${retryKey}`, // 既存のスケジュールAPIを利用
    async (url: string) => {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      } catch (err) {
        console.error('Weekly schedule fetch error:', err)
        throw err
      }
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 600000, // 10分ごとに更新
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  const handleRetry = () => {
    try {
      setRetryKey((prev) => prev + 1)
      mutate()
    } catch (err) {
      console.error('Weekly schedule retry error:', err)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: '今週のスケジュール',
  })

  // ローディング中
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 今週のスケジュール
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div data-testid="loading-spinner">
              <LoadingSpinner size="lg" text="スケジュールを読み込み中..." />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // エラー時
  if (error || !response?.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 今週のスケジュール
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>スケジュールの取得に失敗しました</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { assignments } = response.data || { assignments: [] }

  // スケジュールが空の場合
  if (!assignments || assignments.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 今週のスケジュール
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">
              今週のスケジュールはまだ作成されていません
            </h3>
            <p className="text-muted-foreground mb-4">
              スケジュール管理から当番表を作成してください
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/schedules">
                <Calendar className="mr-2 h-4 w-4" />
                スケジュール管理
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 図書室別・曜日別にグループ化
  const scheduleMatrix: Record<string, Record<number, Assignment[]>> = {}
  const rooms = new Set<string>()

  assignments.forEach((assignment) => {
    const roomId = assignment.room.id
    const dayOfWeek = assignment.dayOfWeek

    rooms.add(roomId)

    if (!scheduleMatrix[roomId]) {
      scheduleMatrix[roomId] = {}
    }
    if (!scheduleMatrix[roomId][dayOfWeek]) {
      scheduleMatrix[roomId][dayOfWeek] = []
    }

    scheduleMatrix[roomId][dayOfWeek].push(assignment)
  })

  const roomList = Array.from(rooms).sort()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">📋 今週のスケジュール</span>
          <div className="flex gap-2" data-testid="schedule-actions">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/schedules?format=grid">
                <BarChart3 className="mr-2 h-4 w-4" />
                📊詳細表示
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              🖨️印刷
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={printRef}
          className="print:bg-white"
          data-testid="printable-weekly-schedule"
        >
          <div className="overflow-x-auto" data-testid="weekly-schedule-table">
            <table
              className="w-full min-w-[600px] border-collapse border border-gray-300"
              role="table"
              aria-label="今週のスケジュール表"
            >
              <thead>
                <tr className="bg-gray-50">
                  <th
                    className="border border-gray-300 p-3 text-left font-medium"
                    role="columnheader"
                  >
                    図書室
                  </th>
                  {weekdays.map((dayOfWeek) => (
                    <th
                      key={dayOfWeek}
                      className={`border border-gray-300 p-3 text-center font-medium ${
                        dayOfWeek === currentDayOfWeek
                          ? 'bg-blue-100 text-blue-800'
                          : ''
                      }`}
                      role="columnheader"
                      data-testid={`day-header-${dayOfWeek}`}
                    >
                      {dayNames[dayOfWeek]}
                      {dayOfWeek === currentDayOfWeek && (
                        <div
                          className="text-xs text-blue-600 mt-1"
                          aria-label="今日の当番"
                        >
                          今日
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomList.map((roomId) => {
                  const roomName =
                    assignments.find((a) => a.room.id === roomId)?.room.name ||
                    roomId

                  return (
                    <tr key={roomId} data-testid={`room-row-${roomId}`}>
                      <th
                        className="border border-gray-300 p-3 text-left font-medium bg-gray-50"
                        role="rowheader"
                      >
                        {roomName}
                      </th>
                      {weekdays.map((dayOfWeek) => (
                        <td
                          key={dayOfWeek}
                          className={`border border-gray-300 p-3 text-center ${
                            dayOfWeek === currentDayOfWeek ? 'bg-blue-50' : ''
                          }`}
                          data-testid={`day-column-${dayOfWeek}`}
                        >
                          {scheduleMatrix[roomId]?.[dayOfWeek]?.map(
                            (assignment, index) => (
                              <div key={assignment.id} className="mb-1">
                                <div className="font-medium">
                                  {assignment.student.name}
                                  {dayOfWeek === currentDayOfWeek && '★'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {assignment.student.class.year}-
                                  {assignment.student.class.name}
                                </div>
                              </div>
                            )
                          ) || <div className="text-gray-400 text-sm">-</div>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            ★印: 今日の当番
          </div>
        </div>

        {/* 印刷時に非表示のアクション */}
        <div className="mt-4 print:hidden text-center">
          <p className="text-sm text-muted-foreground">
            詳細な管理や編集は「詳細表示」から行えます
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
