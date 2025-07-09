/**
 * 特定学期のスケジュール取得APIエンドポイント
 * GET /api/schedules/[term]
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/database/client'
import { handleApiError } from '@/lib/api/error-handler'
import { authenticate } from '@/lib/auth/helpers'

// パラメータスキーマ
const TermParamSchema = z.enum(['FIRST_TERM', 'SECOND_TERM'], {
  required_error: '学期パラメータは必須です',
  invalid_type_error: '学期は FIRST_TERM または SECOND_TERM を指定してください',
})

/**
 * 特定学期のスケジュール取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ term: string }> }
): Promise<NextResponse> {
  try {
    // 認証
    await authenticate(request)

    // パラメータ検証
    const resolvedParams = await params
    const term = TermParamSchema.parse(resolvedParams.term)

    // 指定学期のスケジュール取得
    const assignments = await prisma.assignment.findMany({
      where: { term },
      include: {
        student: {
          include: {
            class: {
              select: { id: true, name: true, year: true },
            },
          },
        },
        room: {
          select: { id: true, name: true, capacity: true },
        },
      },
      orderBy: [
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
            code: 'NO_SCHEDULE_FOUND',
            message: `${term === 'FIRST_TERM' ? '前期' : '後期'}のスケジュールが見つかりません`,
          },
        },
        { status: 404 }
      )
    }

    // 週ごとのスケジュール構造を作成
    const weeklySchedule = createWeeklySchedule(assignments)
    const statistics = calculateTermStatistics(assignments)

    return NextResponse.json({
      success: true,
      data: {
        term,
        termName: term === 'FIRST_TERM' ? '前期' : '後期',
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          dayOfWeek: assignment.dayOfWeek,
          dayName: getDayName(assignment.dayOfWeek),
          room: assignment.room,
          student: {
            id: assignment.student.id,
            name: assignment.student.name,
            grade: assignment.student.grade,
            class: {
              id: assignment.student.class.id,
              name: assignment.student.class.name,
              year: assignment.student.class.year,
              fullName: `${assignment.student.class.year}年${assignment.student.class.name}組`,
            },
          },
          createdAt: assignment.createdAt,
        })),
        weeklySchedule,
        statistics,
      },
    })
  } catch (error) {
    console.error('Term schedule fetch API error:', error)
    return handleApiError(error)
  }
}

/**
 * 週ごとのスケジュール構造を作成
 */
function createWeeklySchedule(assignments: any[]) {
  const schedule: Record<number, Record<string, any[]>> = {}

  // 曜日1-5（月-金）で初期化
  for (let day = 1; day <= 5; day++) {
    schedule[day] = {}
  }

  assignments.forEach((assignment) => {
    const { dayOfWeek, room } = assignment
    const roomName = room.name

    if (!schedule[dayOfWeek][roomName]) {
      schedule[dayOfWeek][roomName] = []
    }

    schedule[dayOfWeek][roomName].push({
      id: assignment.id,
      student: {
        id: assignment.student.id,
        name: assignment.student.name,
        grade: assignment.student.grade,
        className: `${assignment.student.class.year}年${assignment.student.class.name}組`,
      },
      room: {
        id: assignment.room.id,
        name: assignment.room.name,
        capacity: assignment.room.capacity,
      },
    })
  })

  return schedule
}

/**
 * 学期統計情報の計算
 */
function calculateTermStatistics(assignments: any[]) {
  const stats = {
    totalAssignments: assignments.length,
    studentsCount: new Set(assignments.map((a) => a.studentId)).size,
    roomsCount: new Set(assignments.map((a) => a.roomId)).size,
    averagePerDay: Math.round((assignments.length / 5) * 10) / 10,
    distributionByDay: {} as Record<number, number>,
    distributionByGrade: {} as Record<number, number>,
    distributionByClass: {} as Record<string, number>,
    distributionByRoom: {} as Record<string, { name: string; count: number }>,
  }

  // 曜日別分布
  for (let day = 1; day <= 5; day++) {
    stats.distributionByDay[day] = assignments.filter(
      (a) => a.dayOfWeek === day
    ).length
  }

  // 学年別分布
  assignments.forEach((assignment) => {
    const grade = assignment.student.grade
    stats.distributionByGrade[grade] =
      (stats.distributionByGrade[grade] || 0) + 1
  })

  // クラス別分布
  assignments.forEach((assignment) => {
    const className = `${assignment.student.class.year}年${assignment.student.class.name}組`
    stats.distributionByClass[className] =
      (stats.distributionByClass[className] || 0) + 1
  })

  // 図書室別分布
  assignments.forEach((assignment) => {
    const roomId = assignment.room.id
    if (!stats.distributionByRoom[roomId]) {
      stats.distributionByRoom[roomId] = {
        name: assignment.room.name,
        count: 0,
      }
    }
    stats.distributionByRoom[roomId].count++
  })

  return stats
}

/**
 * 曜日番号を日本語名に変換
 */
function getDayName(dayOfWeek: number): string {
  const dayNames = ['', '月', '火', '水', '木', '金', '土', '日']
  return dayNames[dayOfWeek] || '不明'
}
