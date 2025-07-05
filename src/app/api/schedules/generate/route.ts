/**
 * スケジュール生成APIエンドポイント
 * POST /api/schedules/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SchedulerService } from '@/lib/services/scheduler'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticateAdmin } from '@/lib/auth/helpers'

// リクエストスキーマ
const GenerateScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM'], {
    required_error: '学期は必須です',
    invalid_type_error:
      '学期は FIRST_TERM または SECOND_TERM を指定してください',
  }),
  forceRegenerate: z.boolean().optional().default(false),
})

/**
 * スケジュール生成
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 管理者認証
    await authenticateAdmin(request)

    // リクエストボディの解析と検証
    const body = await request.json()
    const { term, forceRegenerate } = GenerateScheduleSchema.parse(body)

    console.log(`スケジュール生成要求: ${term}, 強制再生成: ${forceRegenerate}`)

    // スケジューラーサービスを初期化
    const scheduler = new SchedulerService()

    // スケジュール生成実行
    const result = await scheduler.generateSchedule(term, forceRegenerate)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'SCHEDULE_GENERATION_FAILED',
          message: result.error || 'スケジュール生成に失敗しました',
        },
        { status: 400 }
      )
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        success: true,
        data: {
          term,
          assignments: result.assignments,
          stats: result.stats,
          message: `${term === 'FIRST_TERM' ? '前期' : '後期'}のスケジュールを生成しました`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Schedule generation API error:', error)
    return handleApiError(error)
  }
}
