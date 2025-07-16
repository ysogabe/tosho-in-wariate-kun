/**
 * @jest-environment node
 */

/**
 * データベース制約バリデーションテスト
 * 
 * テスト対象: database/validation.ts
 * 目的: スケジューリング制約ロジックの動作を検証
 */

import { validateWeeklyAssignmentLimit, validateSameClassSameDay } from '../validation'
import { prisma } from '../client'

// Prismaクライアントをモック
jest.mock('../client', () => ({
  prisma: {
    assignment: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Database Validation Tests', () => {
  const mockPrisma = jest.mocked(prisma)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateWeeklyAssignmentLimit', () => {
    const studentId = 'student-1'
    const term = 'FIRST_TERM' as const

    it('週2回制限未満の場合はtrueを返す', async () => {
      // 現在の割り当て数: 1回（制限内）
      mockPrisma.assignment.count.mockResolvedValue(1)

      const result = await validateWeeklyAssignmentLimit(studentId, term)

      expect(result).toBe(true)
      expect(mockPrisma.assignment.count).toHaveBeenCalledWith({
        where: {
          studentId,
          term,
        },
      })
    })

    it('週2回制限に達している場合はfalseを返す', async () => {
      // 現在の割り当て数: 2回（制限達成）
      mockPrisma.assignment.count.mockResolvedValue(2)

      const result = await validateWeeklyAssignmentLimit(studentId, term)

      expect(result).toBe(false)
      expect(mockPrisma.assignment.count).toHaveBeenCalledWith({
        where: {
          studentId,
          term,
        },
      })
    })

    it('週2回制限を超過している場合はfalseを返す', async () => {
      // 現在の割り当て数: 3回（制限超過）
      mockPrisma.assignment.count.mockResolvedValue(3)

      const result = await validateWeeklyAssignmentLimit(studentId, term)

      expect(result).toBe(false)
    })

    it('割り当てが0回の場合はtrueを返す', async () => {
      // 現在の割り当て数: 0回
      mockPrisma.assignment.count.mockResolvedValue(0)

      const result = await validateWeeklyAssignmentLimit(studentId, term)

      expect(result).toBe(true)
    })

    it('SECOND_TERMでも正しく動作する', async () => {
      const secondTerm = 'SECOND_TERM' as const
      mockPrisma.assignment.count.mockResolvedValue(1)

      const result = await validateWeeklyAssignmentLimit(studentId, secondTerm)

      expect(result).toBe(true)
      expect(mockPrisma.assignment.count).toHaveBeenCalledWith({
        where: {
          studentId,
          term: secondTerm,
        },
      })
    })

    it('データベースエラーが発生した場合は例外を投げる', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.assignment.count.mockRejectedValue(dbError)

      await expect(validateWeeklyAssignmentLimit(studentId, term))
        .rejects.toThrow('Database connection failed')
    })
  })

  describe('validateSameClassSameDay', () => {
    const studentId = 'student-1'
    const classId = 'class-1'
    const dayOfWeek = 1 // 月曜日
    const term = 'FIRST_TERM' as const

    it('同クラス同日に既存の割り当てがない場合はtrueを返す', async () => {
      // 学生情報を取得
      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 同クラス同日の既存割り当てなし
      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const result = await validateSameClassSameDay(studentId, dayOfWeek, term)

      expect(result).toBe(true)
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: studentId },
        select: { classId: true },
      })
      expect(mockPrisma.assignment.findFirst).toHaveBeenCalledWith({
        where: {
          dayOfWeek,
          term,
          student: {
            classId,
          },
        },
      })
    })

    it('同クラス同日に既存の割り当てがある場合はfalseを返す', async () => {
      // 学生情報を取得
      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 同クラス同日の既存割り当てあり
      mockPrisma.assignment.findFirst.mockResolvedValue({
        id: 'assignment-1',
        studentId: 'other-student',
        roomId: 'room-1',
        dayOfWeek,
        term,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await validateSameClassSameDay(studentId, dayOfWeek, term)

      expect(result).toBe(false)
    })

    it('存在しない学生IDの場合はfalseを返す', async () => {
      // 学生が見つからない
      mockPrisma.student.findUnique.mockResolvedValue(null)

      const result = await validateSameClassSameDay('nonexistent-student', dayOfWeek, term)

      expect(result).toBe(false)
      expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-student' },
        select: { classId: true },
      })
      // 学生が見つからない場合は、assignment検索は実行されない
      expect(mockPrisma.assignment.findFirst).not.toHaveBeenCalled()
    })

    it('異なる曜日では制約に引っかからない', async () => {
      const differentDay = 2 // 火曜日

      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const result = await validateSameClassSameDay(studentId, differentDay, term)

      expect(result).toBe(true)
      expect(mockPrisma.assignment.findFirst).toHaveBeenCalledWith({
        where: {
          dayOfWeek: differentDay,
          term,
          student: {
            classId,
          },
        },
      })
    })

    it('異なる学期では制約に引っかからない', async () => {
      const differentTerm = 'SECOND_TERM' as const

      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const result = await validateSameClassSameDay(studentId, dayOfWeek, differentTerm)

      expect(result).toBe(true)
      expect(mockPrisma.assignment.findFirst).toHaveBeenCalledWith({
        where: {
          dayOfWeek,
          term: differentTerm,
          student: {
            classId,
          },
        },
      })
    })

    it('学生検索でデータベースエラーが発生した場合は例外を投げる', async () => {
      const dbError = new Error('Student query failed')
      mockPrisma.student.findUnique.mockRejectedValue(dbError)

      await expect(validateSameClassSameDay(studentId, dayOfWeek, term))
        .rejects.toThrow('Student query failed')
    })

    it('割り当て検索でデータベースエラーが発生した場合は例外を投げる', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const dbError = new Error('Assignment query failed')
      mockPrisma.assignment.findFirst.mockRejectedValue(dbError)

      await expect(validateSameClassSameDay(studentId, dayOfWeek, term))
        .rejects.toThrow('Assignment query failed')
    })
  })

  describe('境界値テスト', () => {
    it('曜日の境界値テスト（1-7）', async () => {
      const studentId = 'student-1'
      const classId = 'class-1'
      const term = 'FIRST_TERM' as const

      mockPrisma.student.findUnique.mockResolvedValue({
        id: studentId,
        classId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      // 最小値: 1 (月曜日)
      await validateSameClassSameDay(studentId, 1, term)
      expect(mockPrisma.assignment.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ dayOfWeek: 1 })
        })
      )

      // 最大値: 7 (日曜日) 
      await validateSameClassSameDay(studentId, 7, term)
      expect(mockPrisma.assignment.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ dayOfWeek: 7 })
        })
      )
    })

    it('長いID文字列での動作確認', async () => {
      const longStudentId = 'a'.repeat(100)
      const longClassId = 'b'.repeat(100)
      
      mockPrisma.student.findUnique.mockResolvedValue({
        id: longStudentId,
        classId: longClassId,
        name: 'テスト太郎',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      mockPrisma.assignment.findFirst.mockResolvedValue(null)

      const result = await validateSameClassSameDay(longStudentId, 1, 'FIRST_TERM')
      expect(result).toBe(true)
    })
  })
})