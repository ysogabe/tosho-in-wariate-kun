import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export async function GET(_request: NextRequest) {
  try {
    // await authenticate(request) // Temporarily disabled for demo

    // 最近の活動を取得（実際の実装では activity ログテーブルを作成）
    // ここでは簡易的に最近作成されたデータから活動を生成
    const [recentStudents, recentClasses, recentAssignments] =
      await Promise.all([
        prisma.student.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            class: {
              select: { name: true, year: true },
            },
          },
        }),
        prisma.class.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.assignment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: { name: true },
            },
          },
        }),
      ])

    const activities = [
      ...recentStudents.map((student) => ({
        id: `student-${student.id}`,
        type: 'student_created' as const,
        description: `図書委員「${student.name}」が${student.class.year}年${student.class.name}組に登録されました`,
        timestamp: student.createdAt.toISOString(),
      })),
      ...recentClasses.map((cls) => ({
        id: `class-${cls.id}`,
        type: 'class_created' as const,
        description: `クラス「${cls.year}年${cls.name}組」が作成されました`,
        timestamp: cls.createdAt.toISOString(),
      })),
      ...recentAssignments.map((assignment) => ({
        id: `assignment-${assignment.id}`,
        type: 'schedule_generated' as const,
        description: `「${assignment.student.name}」の当番が割り当てられました`,
        timestamp: assignment.createdAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        activities: activities.slice(0, 20),
      },
    })
  } catch (error) {
    console.error('Dashboard activities error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'アクティビティの取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
