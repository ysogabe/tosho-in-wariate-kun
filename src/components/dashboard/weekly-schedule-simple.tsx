/**
 * 週間スケジュール表示コンポーネント (実装版)
 */

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { BarChart3, RefreshCw, AlertCircle, Calendar } from 'lucide-react'
import { getCurrentTerm, getTermDisplayName } from '@/lib/utils/term-utils'

interface ScheduleStudent {
  id: string
  name: string
  grade: number
  className: string
}

interface ScheduleRoom {
  id: string
  name: string
}

interface ScheduleAssignment {
  id: string
  room: ScheduleRoom
  student: ScheduleStudent
}

interface ScheduleData {
  FIRST_TERM: {
    [dayOfWeek: string]: ScheduleAssignment[]
  }
  SECOND_TERM: {
    [dayOfWeek: string]: ScheduleAssignment[]
  }
}

interface WeeklyScheduleResponse {
  success: boolean
  data: {
    schedules: ScheduleData
  }
}

export function WeeklySchedule() {
  const [retryKey, setRetryKey] = useState(0)
  const weekdays = ['月', '火', '水', '木', '金']
  const dayNumbers = ['1', '2', '3', '4', '5'] // 曜日番号

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR<WeeklyScheduleResponse>(
    `/api/schedules?format=calendar&retry=${retryKey}`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`)
      }
      return res.json()
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 600000, // 10分ごとに更新
    }
  )

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1)
    mutate()
  }

  // 現在の学期を判定
  const currentTerm = getCurrentTerm()

  // 図書室リストを取得
  const getRooms = (): string[] => {
    if (!response?.success || !response.data.schedules) return []

    const schedules = response.data.schedules[currentTerm]
    const rooms = new Set<string>()

    Object.values(schedules).forEach((assignments) => {
      assignments.forEach((assignment) => {
        rooms.add(assignment.room.name)
      })
    })

    return Array.from(rooms).sort()
  }

  const rooms = getRooms()

  // 特定の日・図書室の当番を取得
  const getAssignmentForDayAndRoom = (
    dayNumber: string,
    roomName: string
  ): ScheduleAssignment | null => {
    if (!response?.success || !response.data.schedules) return null

    const schedules = response.data.schedules[currentTerm]
    const assignments = schedules[dayNumber] || []

    return (
      assignments.find((assignment) => assignment.room.name === roomName) ||
      null
    )
  }

  // ローディング中
  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 今週のスケジュール
            </span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/schedules?format=grid">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  📊詳細表示
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">
              スケジュールを読み込み中...
            </h3>
            <p className="text-muted-foreground">少々お待ちください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // エラー時
  if (error || !response?.success) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 今週のスケジュール
            </span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/schedules?format=grid">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  📊詳細表示
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>スケジュール情報の取得に失敗しました</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // 図書室がない場合
  if (rooms.length === 0) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              📋 今週のスケジュール
            </span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/schedules?format=grid">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  📊詳細表示
                </Link>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">
              スケジュールが設定されていません
            </h3>
            <p className="text-muted-foreground mb-4">
              スケジュール管理から当番表を生成してください
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

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">📋 今週のスケジュール</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/schedules?format=grid">
                <BarChart3 className="mr-2 h-4 w-4" />
                📊詳細表示
              </Link>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-medium">
                  図書室
                </th>
                {weekdays.map((day) => (
                  <th
                    key={day}
                    className="border border-gray-300 p-3 text-center font-medium"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((roomName) => (
                <tr key={roomName}>
                  <th className="border border-gray-300 p-3 text-left font-medium bg-gray-50">
                    {roomName}
                  </th>
                  {dayNumbers.map((dayNumber) => {
                    const assignment = getAssignmentForDayAndRoom(
                      dayNumber,
                      roomName
                    )
                    return (
                      <td
                        key={dayNumber}
                        className="border border-gray-300 p-3 text-center"
                      >
                        {assignment ? (
                          <div className="text-sm">
                            <div className="font-medium text-blue-700">
                              {assignment.student.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignment.student.className}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">-</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            📚 {getTermDisplayName(currentTerm)}のスケジュール表示中 | ⏰
            10分ごとに自動更新
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
