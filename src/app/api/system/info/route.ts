import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    // システム統計を取得
    const [
      totalStudents,
      totalClasses,
      totalRooms,
      totalAssignments,
      activeStudents,
      firstTermAssignments,
      secondTermAssignments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.class.count(),
      prisma.room.count(),
      prisma.assignment.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.assignment.count({ where: { term: 'FIRST_TERM' } }),
      prisma.assignment.count({ where: { term: 'SECOND_TERM' } }),
    ])

    // 最新のデータベース更新日時
    const latestStudent = await prisma.student.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })

    const latestAssignment = await prisma.assignment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    const systemInfo = {
      version: process.env.SYSTEM_VERSION || '1.0.0',
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        provider: 'PostgreSQL',
        lastDataUpdate: latestStudent?.updatedAt || null,
        lastScheduleGeneration: latestAssignment?.createdAt || null,
      },
      statistics: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },
        classes: {
          total: totalClasses,
        },
        rooms: {
          total: totalRooms,
        },
        assignments: {
          total: totalAssignments,
          firstTerm: firstTermAssignments,
          secondTerm: secondTermAssignments,
        },
      },
    }

    return NextResponse.json({
      success: true,
      data: systemInfo,
    })
  } catch (error) {
    console.error('System info error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'システム情報の取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
