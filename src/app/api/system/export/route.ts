import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    // 全データを取得
    const [classes, students, rooms, assignments] = await Promise.all([
      prisma.class.findMany({
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
      }),
      prisma.student.findMany({
        include: {
          class: {
            select: { name: true, year: true },
          },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
      prisma.room.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.assignment.findMany({
        include: {
          student: {
            select: { name: true, grade: true },
          },
          room: {
            select: { name: true },
          },
        },
        orderBy: [{ term: 'asc' }, { dayOfWeek: 'asc' }],
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          year: c.year,
          createdAt: c.createdAt.toISOString(),
        })),
        students: students.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          class: `${s.class.year}年${s.class.name}`,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
        })),
        rooms: rooms.map((r) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
        })),
        assignments: assignments.map((a) => ({
          id: a.id,
          studentName: a.student.name,
          roomName: a.room.name,
          dayOfWeek: a.dayOfWeek,
          term: a.term,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="tosho-system-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('System export error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'データエクスポートに失敗しました',
        },
      },
      { status: 500 }
    )
  }
}
