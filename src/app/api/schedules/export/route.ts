/**
 * スケジュールエクスポートAPIエンドポイント
 * GET /api/schedules/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticate } from '@/lib/auth/helpers'

// クエリパラメータスキーマ
const ExportQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
  format: z.enum(['csv', 'json', 'pdf']).optional().default('csv'),
})

/**
 * スケジュールエクスポート
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証（一般ユーザーも閲覧可能）
    await authenticate(request)

    // クエリパラメータの解析
    const { searchParams } = new URL(request.url)
    const queryParams = {
      term: searchParams.get('term'),
      format: searchParams.get('format') || 'csv',
    }

    // パラメータ検証
    const { term, format } = ExportQuerySchema.parse(queryParams)

    // 基本的なWHERE条件
    const whereCondition = term ? { term } : {}

    // スケジュール取得
    const assignments = await prisma.assignment.findMany({
      where: whereCondition,
      include: {
        student: {
          include: {
            class: {
              select: { name: true, year: true },
            },
          },
        },
        room: {
          select: { name: true },
        },
      },
      orderBy: [
        { term: 'asc' },
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
        { student: { name: 'asc' } },
      ],
    })

    if (assignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_DATA_TO_EXPORT',
            message: 'エクスポートするデータがありません',
          },
        },
        { status: 404 }
      )
    }

    console.log(
      `スケジュールエクスポート要求: ${format}形式, ${assignments.length}件`
    )

    // フォーマット別エクスポート
    switch (format) {
      case 'csv':
        return exportAsCsv(assignments)
      case 'json':
        return exportAsJson(assignments)
      case 'pdf':
        return exportAsPdf(assignments)
      default:
        return exportAsCsv(assignments)
    }
  } catch (error) {
    console.error('Schedule export API error:', error)
    return handleApiError(error)
  }
}

/**
 * CSV形式でエクスポート
 */
function exportAsCsv(assignments: any[]): NextResponse {
  const dayNames = ['', '月', '火', '水', '木', '金']
  const termNames = { FIRST_TERM: '前期', SECOND_TERM: '後期' }

  let csv = '期,曜日,図書室,学年,クラス,氏名,作成日\n'

  assignments.forEach((assignment) => {
    const termName = termNames[assignment.term as keyof typeof termNames]
    const dayName = dayNames[assignment.dayOfWeek]
    const roomName = assignment.room.name
    const grade = assignment.student.grade
    const className = assignment.student.class.name
    const studentName = assignment.student.name
    const createdAt = new Date(assignment.createdAt).toLocaleDateString('ja-JP')

    csv += `${termName},${dayName},${roomName},${grade}年,${className}組,${studentName},${createdAt}\n`
  })

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `library-schedule-${timestamp}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/**
 * JSON形式でエクスポート
 */
function exportAsJson(assignments: any[]): NextResponse {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalAssignments: assignments.length,
    summary: generateExportSummary(assignments),
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      term: assignment.term,
      termName: assignment.term === 'FIRST_TERM' ? '前期' : '後期',
      dayOfWeek: assignment.dayOfWeek,
      dayName: getDayName(assignment.dayOfWeek),
      room: {
        name: assignment.room.name,
      },
      student: {
        name: assignment.student.name,
        grade: assignment.student.grade,
        class: `${assignment.student.class.year}年${assignment.student.class.name}組`,
      },
      createdAt: assignment.createdAt,
    })),
  }

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `library-schedule-${timestamp}.json`

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

/**
 * PDF形式でエクスポート（現在は未実装）
 */
function exportAsPdf(_assignments: any[]): NextResponse {
  // PDF生成は将来的に実装（jsPDFやPuppeteerを使用）
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PDF_NOT_IMPLEMENTED',
        message: 'PDF出力は現在準備中です',
      },
    },
    { status: 501 }
  )
}

/**
 * エクスポート用統計情報の生成
 */
function generateExportSummary(assignments: any[]) {
  const summary = {
    totalAssignments: assignments.length,
    termBreakdown: {
      FIRST_TERM: assignments.filter((a) => a.term === 'FIRST_TERM').length,
      SECOND_TERM: assignments.filter((a) => a.term === 'SECOND_TERM').length,
    },
    dayBreakdown: {} as Record<number, number>,
    roomBreakdown: {} as Record<string, number>,
    gradeBreakdown: {} as Record<number, number>,
    uniqueStudents: new Set<string>(),
  }

  // 曜日別統計
  for (let day = 1; day <= 5; day++) {
    summary.dayBreakdown[day] = assignments.filter(
      (a) => a.dayOfWeek === day
    ).length
  }

  // 図書室別・学年別統計
  assignments.forEach((assignment) => {
    const roomName = assignment.room.name
    summary.roomBreakdown[roomName] = (summary.roomBreakdown[roomName] || 0) + 1

    const grade = assignment.student.grade
    summary.gradeBreakdown[grade] = (summary.gradeBreakdown[grade] || 0) + 1

    summary.uniqueStudents.add(assignment.student.id)
  })

  return {
    totalAssignments: summary.totalAssignments,
    uniqueStudents: summary.uniqueStudents.size,
    termBreakdown: summary.termBreakdown,
    dayBreakdown: summary.dayBreakdown,
    roomBreakdown: summary.roomBreakdown,
    gradeBreakdown: summary.gradeBreakdown,
  }
}

/**
 * 曜日番号を日本語名に変換
 */
function getDayName(dayOfWeek: number): string {
  const dayNames = ['', '月', '火', '水', '木', '金', '土', '日']
  return dayNames[dayOfWeek] || '不明'
}
