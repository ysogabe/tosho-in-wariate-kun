import { prisma } from './client'

// 週2回制約チェック
export async function validateWeeklyAssignmentLimit(
  studentId: string,
  term: 'FIRST_TERM' | 'SECOND_TERM'
): Promise<boolean> {
  const count = await prisma.assignment.count({
    where: {
      studentId,
      term,
    },
  })

  return count < 2
}

// 同クラス同日制約チェック
export async function validateSameClassSameDay(
  studentId: string,
  dayOfWeek: number,
  term: 'FIRST_TERM' | 'SECOND_TERM'
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  })

  if (!student) return false

  const existingAssignment = await prisma.assignment.findFirst({
    where: {
      dayOfWeek,
      term,
      student: {
        classId: student.classId,
      },
    },
  })

  return !existingAssignment
}
