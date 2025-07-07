import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/client'

export async function GET(_request: NextRequest) {
  try {
    // await authenticate(request) // Temporarily disabled for demo

    // 並列でデータを取得
    const [studentsData, classesData, schedulesData, roomsData] =
      await Promise.all([
        // 図書委員統計
        prisma.student
          .aggregate({
            _count: {
              id: true,
            },
            where: {},
          })
          .then(async (total) => {
            const [active, grade5, grade6] = await Promise.all([
              prisma.student.count({ where: { isActive: true } }),
              prisma.student.count({ where: { grade: 5 } }),
              prisma.student.count({ where: { grade: 6 } }),
            ])
            return {
              total: total._count.id,
              active,
              grade5,
              grade6,
            }
          }),

        // クラス統計
        prisma.class
          .aggregate({
            _count: {
              id: true,
            },
          })
          .then(async (total) => {
            const withStudents = await prisma.class.count({
              where: {
                students: {
                  some: {},
                },
              },
            })
            return {
              total: total._count.id,
              withStudents,
            }
          }),

        // スケジュール統計
        Promise.all([
          prisma.assignment.aggregate({
            _count: { id: true },
            where: { term: 'FIRST_TERM' },
          }),
          prisma.assignment.aggregate({
            _count: { id: true },
            where: { term: 'SECOND_TERM' },
          }),
          prisma.assignment.findFirst({
            where: { term: 'FIRST_TERM' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
          prisma.assignment.findFirst({
            where: { term: 'SECOND_TERM' },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ]).then(
          ([
            firstTermCount,
            secondTermCount,
            firstTermLatest,
            secondTermLatest,
          ]) => ({
            firstTerm: {
              exists: firstTermCount._count.id > 0,
              assignmentCount: firstTermCount._count.id,
              lastGenerated: firstTermLatest?.createdAt.toISOString() || null,
            },
            secondTerm: {
              exists: secondTermCount._count.id > 0,
              assignmentCount: secondTermCount._count.id,
              lastGenerated: secondTermLatest?.createdAt.toISOString() || null,
            },
          })
        ),

        // 図書室統計
        prisma.room
          .aggregate({
            _count: {
              id: true,
            },
          })
          .then(async (total) => {
            // 図書室はすべてアクティブとして扱う（isActiveフィールドがないため）
            return {
              total: total._count.id,
              active: total._count.id,
            }
          }),
      ])

    return NextResponse.json({
      success: true,
      data: {
        students: studentsData,
        classes: classesData,
        schedules: schedulesData,
        rooms: roomsData,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ダッシュボード統計の取得に失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
