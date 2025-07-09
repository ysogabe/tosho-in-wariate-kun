/**
 * 今日の当番表示コンポーネント (実装版)
 */

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertCircle, Calendar } from 'lucide-react'

interface TodayDuty {
  roomId: string
  roomName: string
  student: {
    name: string
    class: {
      year: number
      name: string
    }
  }
}

interface TodayDutiesResponse {
  success: boolean
  data: {
    date: string
    dayOfWeek: string
    isWeekend: boolean
    duties: TodayDuty[]
  }
}

// 曜日の日本語マッピング
const dayOfWeekJapanese: Record<string, string> = {
  monday: '月',
  tuesday: '火',
  wednesday: '水',
  thursday: '木',
  friday: '金',
  saturday: '土',
  sunday: '日',
}

export function TodayDuties() {
  const [retryKey, setRetryKey] = useState(0)

  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR<TodayDutiesResponse>(
    `/api/dashboard/today-duties?retry=${retryKey}`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`)
      }
      return res.json()
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 300000, // 5分ごとに更新
    }
  )

  const handleRetry = () => {
    setRetryKey((prev) => prev + 1)
    mutate()
  }

  // 日付フォーマット
  const formatDate = (dateString: string, dayOfWeek: string): string => {
    try {
      const date = new Date(dateString)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const dayJp = dayOfWeekJapanese[dayOfWeek] || ''
      return `${month}月${day}日(${dayJp})`
    } catch {
      return '日付不明'
    }
  }

  // ローディング中
  if (isLoading) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌟 今日の当番
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">今日の当番を確認中...</h3>
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
          <CardTitle className="flex items-center gap-2">
            🌟 今日の当番
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>当番情報の取得に失敗しました</span>
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

  const { date, dayOfWeek, isWeekend, duties } = response.data
  const formattedDate = formatDate(date, dayOfWeek)

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">🌟 今日の当番</span>
          <span className="text-sm font-normal text-muted-foreground">
            📅 今日: {formattedDate}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isWeekend ? (
          // 土日の場合
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-medium mb-2">今日は当番がありません</h3>
            <p className="text-muted-foreground">
              土曜日・日曜日は図書委員の当番はお休みです
            </p>
          </div>
        ) : duties.length === 0 ? (
          // 平日だが当番なしの場合
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">
              今日の当番は設定されていません
            </h3>
            <p className="text-muted-foreground mb-4">
              スケジュール管理から当番表を確認してください
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/schedules">
                <Calendar className="mr-2 h-4 w-4" />
                スケジュール管理
              </Link>
            </Button>
          </div>
        ) : (
          // 当番ありの場合
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {duties.map((duty) => (
              <div
                key={duty.roomId + duty.student.name}
                className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📚</span>
                  <h3 className="font-medium text-gray-900">{duty.roomName}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👤</span>
                    <span className="font-medium">{duty.student.name}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    {duty.student.class.year}年{duty.student.class.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 説明文 */}
        {!isWeekend && duties.length > 0 && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            ⭐ 今日の図書委員の皆さん、よろしくお願いします！
          </div>
        )}
      </CardContent>
    </Card>
  )
}
