/**
 * 今日の当番取得APIエンドポイント (TDD - Green Phase)
 * GET /api/dashboard/today-duties
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'
import { authenticate } from '@/lib/auth/helpers'
import { getCurrentTerm } from '@/lib/utils/term-utils'
// エラーハンドリング用のヘルパー関数
function handleApiError(error: unknown, message: string) {
  console.error('API Error:', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    },
    { status: 500 }
  )
}

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
  date: string // YYYY-MM-DD
  dayOfWeek: string // 'monday' | 'tuesday' | ...
  isWeekend: boolean
  duties: TodayDuty[]
}

// 曜日のマッピング
const dayOfWeekMap: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

// 曜日をデータベースの dayOfWeek (1=月曜) に変換
const getDayOfWeekForDb = (jsDay: number): number => {
  if (jsDay === 0) return 7 // 日曜日は7
  return jsDay
}

// 学期判定ロジックは共通ユーティリティに移動済み

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    try {
      await authenticate(request)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        },
        { status: 401 }
      )
    }

    // 今日の日付を取得
    const today = new Date()
    const todayJSDay = today.getDay() // 0=日曜, 1=月曜, ...
    const todayDbDay = getDayOfWeekForDb(todayJSDay)
    const isWeekend = todayJSDay === 0 || todayJSDay === 6

    // 日付文字列を生成
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const dayOfWeekString = dayOfWeekMap[todayJSDay]

    // 土日の場合は当番なしで即座に返す
    if (isWeekend) {
      return NextResponse.json({
        success: true,
        data: {
          date: dateString,
          dayOfWeek: dayOfWeekString,
          isWeekend: true,
          duties: [],
        } as TodayDutiesResponse,
      })
    }

    // 平日の場合、今日の当番を取得（現在の学期のみ）
    const currentTerm = getCurrentTerm()
    const assignments = await prisma.assignment.findMany({
      where: {
        dayOfWeek: todayDbDay,
        term: currentTerm,
      },
      include: {
        student: {
          include: {
            class: {
              select: {
                year: true,
                name: true,
              },
            },
          },
        },
        room: true,
      },
      orderBy: [{ room: { name: 'asc' } }, { student: { name: 'asc' } }],
    })

    // アクティブな図書室のみフィルタリング（isActiveプロパティがない場合は全て含める）
    const activeAssignments = assignments

    // レスポンス用のデータに変換
    const duties: TodayDuty[] = activeAssignments.map((assignment) => ({
      roomId: assignment.room.id,
      roomName: assignment.room.name,
      student: {
        name: assignment.student.name,
        class: {
          year: assignment.student.class.year,
          name: assignment.student.class.name,
        },
      },
    }))

    return NextResponse.json({
      success: true,
      data: {
        date: dateString,
        dayOfWeek: dayOfWeekString,
        isWeekend: false,
        duties,
      } as TodayDutiesResponse,
    })
  } catch (error) {
    return handleApiError(error, '今日の当番情報の取得に失敗しました')
  }
}
