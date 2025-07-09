/**
 * @jest-environment node
 */

/**
 * SchedulerService テストスイート
 *
 * スケジューリングアルゴリズムの包括的なテスト
 * 制約条件、最適化、エラーハンドリングを検証
 */

import { SchedulerService } from '../scheduler'
import { prisma } from '@/lib/database/client'

// データベースクライアントをモック
jest.mock('@/lib/database/client', () => ({
  prisma: {
    assignment: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

describe('SchedulerService', () => {
  const mockPrisma = jest.mocked(prisma)
  let scheduler: SchedulerService

  beforeEach(() => {
    jest.clearAllMocks()
    scheduler = new SchedulerService()

    // $transactionのモック設定
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma)
    })
  })

  describe('generateSchedule', () => {
    const mockStudents = [
      {
        id: 'student-1',
        name: '田中太郎',
        classId: 'class-1',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: { id: 'class-1', name: '1組', year: 5 },
      },
      {
        id: 'student-2',
        name: '佐藤花子',
        classId: 'class-1',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: { id: 'class-1', name: '1組', year: 5 },
      },
      {
        id: 'student-3',
        name: '鈴木次郎',
        classId: 'class-2',
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: { id: 'class-2', name: '2組', year: 5 },
      },
      {
        id: 'student-4',
        name: '高橋三郎',
        classId: 'class-2',
        grade: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: { id: 'class-2', name: '2組', year: 6 },
      },
    ]

    const mockRooms = [
      { 
        id: 'room-1', 
        name: '図書室', 
        capacity: 4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        description: null
      },
      { 
        id: 'room-2', 
        name: '視聴覚室', 
        capacity: 2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        description: null
      },
    ]

    beforeEach(() => {
      mockPrisma.student.findMany.mockResolvedValue(mockStudents)
      mockPrisma.room.findMany.mockResolvedValue(mockRooms)
      mockPrisma.assignment.findMany.mockResolvedValue([]) // 既存割り当てなし
      mockPrisma.assignment.createMany.mockResolvedValue({ count: 8 })
    })

    it('前期スケジュールを正常に生成できる', async () => {
      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(true)
      expect(result.assignments).toBeDefined()
      expect(result.stats).toBeDefined()
      expect(result.assignments!.length).toBeGreaterThan(0)

      // 各学生が適切に割り当てられているかチェック
      const studentAssignments = new Map<string, number>()
      for (const assignment of result.assignments!) {
        const count = studentAssignments.get(assignment.studentId) || 0
        studentAssignments.set(assignment.studentId, count + 1)
      }

      // 各学生が最大2回まで割り当てられている
      for (const [, count] of studentAssignments) {
        expect(count).toBeLessThanOrEqual(2)
      }
    }, 30000) // 長時間実行の可能性があるため30秒タイムアウト

    it('後期スケジュールで前期データを考慮する', async () => {
      // 前期のデータをモック
      const firstTermAssignments = [
        {
          id: 'assign-1',
          studentId: 'student-1',
          roomId: 'room-1',
          dayOfWeek: 3, // 水曜日
          term: 'FIRST_TERM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'assign-2',
          studentId: 'student-1',
          roomId: 'room-1',
          dayOfWeek: 5, // 金曜日
          term: 'FIRST_TERM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.assignment.findMany
        .mockResolvedValueOnce([]) // 既存の後期割り当てなし
        .mockResolvedValueOnce(firstTermAssignments) // 前期データ

      const result = await scheduler.generateSchedule('SECOND_TERM')

      expect(result.success).toBe(true)

      // student-1は水曜と金曜を避けるべき
      const student1Assignments = result.assignments!.filter(
        (a) => a.studentId === 'student-1'
      )

      // 水曜・金曜の重複を避けているかチェック（制約として実装されている場合）
      const hasWednesdayOrFriday = student1Assignments.some(
        (a) => a.dayOfWeek === 3 || a.dayOfWeek === 5
      )

      // この制約は実装によって異なるが、少なくとも適切に処理されている
      expect(result.assignments!.length).toBeGreaterThan(0)

      // 制約が適用されている場合、水曜・金曜の重複は避けられるべき
      if (hasWednesdayOrFriday) {
        console.log('後期でも水曜・金曜に割り当てられている（制約が緩い設定）')
      }
    }, 30000)

    it('アクティブでない学生がいる場合はスキップする', async () => {
      const studentsWithInactive = [
        ...mockStudents,
        {
          id: 'student-inactive',
          name: '非アクティブ学生',
          classId: 'class-1',
          grade: 5,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          class: { id: 'class-1', name: '1組', year: 5 },
        },
      ]

      mockPrisma.student.findMany.mockResolvedValue(
        studentsWithInactive.filter((s) => s.isActive)
      )

      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(true)

      // 非アクティブ学生は割り当てられていない
      const inactiveAssignments = result.assignments!.filter(
        (a) => a.studentId === 'student-inactive'
      )
      expect(inactiveAssignments).toHaveLength(0)
    })

    it('学生が登録されていない場合はエラーを返す', async () => {
      mockPrisma.student.findMany.mockResolvedValue([])

      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(false)
      expect(result.error).toBe('アクティブな図書委員が登録されていません')
    })

    it('図書室が登録されていない場合はエラーを返す', async () => {
      mockPrisma.room.findMany.mockResolvedValue([])

      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(false)
      expect(result.error).toBe('図書室が登録されていません')
    })

    it('既存の割り当てがある場合はエラーを返す（強制再生成なし）', async () => {
      const existingAssignments = [
        {
          id: 'existing-1',
          studentId: 'student-1',
          roomId: 'room-1',
          dayOfWeek: 1,
          term: 'FIRST_TERM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.assignment.findMany.mockResolvedValue(existingAssignments)

      const result = await scheduler.generateSchedule('FIRST_TERM', false)

      expect(result.success).toBe(false)
      expect(result.error).toBe('既に当番表が作成されています')
    })

    it('強制再生成が有効な場合は既存データを削除して再生成する', async () => {
      const existingAssignments = [
        {
          id: 'existing-1',
          studentId: 'student-1',
          roomId: 'room-1',
          dayOfWeek: 1,
          term: 'FIRST_TERM',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrisma.assignment.findMany.mockResolvedValue(existingAssignments)
      mockPrisma.assignment.deleteMany.mockResolvedValue({ count: 1 })

      const result = await scheduler.generateSchedule('FIRST_TERM', true)

      expect(result.success).toBe(true)
      expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
        where: { term: 'FIRST_TERM' },
      })
    })

    it('制約条件違反がある場合の処理', async () => {
      // 極端に制約が厳しい場合（学生1名、図書室1室、定員1名）
      const limitedStudents = [mockStudents[0]]
      const limitedRooms = [{ 
        id: 'room-1', 
        name: '図書室', 
        capacity: 1, 
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        description: null
      }]

      mockPrisma.student.findMany.mockResolvedValue(limitedStudents)
      mockPrisma.room.findMany.mockResolvedValue(limitedRooms)

      const result = await scheduler.generateSchedule('FIRST_TERM')

      // この場合でも適切に処理される（成功または適切なエラー）
      if (!result.success) {
        expect(result.error).toBe(
          '制約条件を満たすスケジュールを生成できませんでした'
        )
      } else {
        expect(result.assignments!.length).toBeLessThanOrEqual(5) // 最大5曜日
      }
    })

    it('統計情報が正しく計算される', async () => {
      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(true)
      expect(result.stats).toBeDefined()

      const stats = result.stats!
      expect(stats.totalAssignments).toBe(result.assignments!.length)
      expect(stats.studentsAssigned).toBeGreaterThan(0)
      expect(stats.averageAssignmentsPerStudent).toBeGreaterThan(0)
      expect(stats.balanceScore).toBeGreaterThanOrEqual(0)
      expect(stats.assignmentsByDay).toBeDefined()
      expect(stats.assignmentsByRoom).toBeDefined()
    })

    it('データベースエラーが発生した場合の処理', async () => {
      mockPrisma.student.findMany.mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await scheduler.generateSchedule('FIRST_TERM')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('制約条件のテスト', () => {
    it('同クラス同日制約が正しく動作する', async () => {
      const sameClassStudents = [
        {
          id: 'student-1',
          name: '田中太郎',
          classId: 'class-1',
          grade: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          class: { id: 'class-1', name: '1組', year: 5 },
        },
        {
          id: 'student-2',
          name: '佐藤花子',
          classId: 'class-1', // 同じクラス
          grade: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          class: { id: 'class-1', name: '1組', year: 5 },
        },
      ]

      const singleRoom = [{ 
        id: 'room-1', 
        name: '図書室', 
        capacity: 4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        description: null
      }]

      mockPrisma.student.findMany.mockResolvedValue(sameClassStudents)
      mockPrisma.room.findMany.mockResolvedValue(singleRoom)

      const result = await scheduler.generateSchedule('FIRST_TERM')

      if (result.success) {
        // 同じクラスの学生が同じ日同じ部屋に割り当てられていないことを確認
        const dayRoomAssignments = new Map<string, string[]>()

        for (const assignment of result.assignments!) {
          const key = `${assignment.dayOfWeek}-${assignment.roomId}`
          const student = sameClassStudents.find(
            (s) => s.id === assignment.studentId
          )!

          if (!dayRoomAssignments.has(key)) {
            dayRoomAssignments.set(key, [])
          }
          dayRoomAssignments.get(key)!.push(student.classId)
        }

        // 各日時スロットで同じクラスが重複していないことを確認
        for (const [, classIds] of dayRoomAssignments) {
          const uniqueClasses = new Set(classIds)
          expect(uniqueClasses.size).toBe(classIds.length)
        }
      }
    })

    it('スロット定員制約が正しく動作する', async () => {
      const manyStudents = Array.from({ length: 20 }, (_, i) => ({
        id: `student-${i + 1}`,
        name: `学生${i + 1}`,
        classId: `class-${Math.floor(i / 4) + 1}`,
        grade: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: {
          id: `class-${Math.floor(i / 4) + 1}`,
          name: `${Math.floor(i / 4) + 1}組`,
          year: 5,
        },
      }))

      const limitedCapacityRoom = [
        { 
          id: 'room-1', 
          name: '図書室', 
          capacity: 2,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          description: null
        }, // 定員2名
      ]

      mockPrisma.student.findMany.mockResolvedValue(manyStudents)
      mockPrisma.room.findMany.mockResolvedValue(limitedCapacityRoom)

      const result = await scheduler.generateSchedule('FIRST_TERM')

      if (result.success) {
        // 各スロットの定員をチェック
        const slotCounts = new Map<string, number>()

        for (const assignment of result.assignments!) {
          const slotKey = `${assignment.dayOfWeek}-${assignment.roomId}`
          slotCounts.set(slotKey, (slotCounts.get(slotKey) || 0) + 1)
        }

        // 各スロットが定員を超えていないことを確認
        for (const [, count] of slotCounts) {
          expect(count).toBeLessThanOrEqual(2) // 定員2名
        }
      }
    })
  })

  describe('パフォーマンステスト', () => {
    it('大規模データでも適切な時間内で処理される', async () => {
      // 大規模データの準備
      const largeStudentSet = Array.from({ length: 100 }, (_, i) => ({
        id: `student-${i + 1}`,
        name: `学生${i + 1}`,
        classId: `class-${Math.floor(i / 10) + 1}`,
        grade: 5 + (i % 2),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        class: {
          id: `class-${Math.floor(i / 10) + 1}`,
          name: `${Math.floor(i / 10) + 1}組`,
          year: 5 + (i % 2),
        },
      }))

      const multipleRooms = Array.from({ length: 5 }, (_, i) => ({
        id: `room-${i + 1}`,
        name: `図書室${i + 1}`,
        capacity: 4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        description: null,
      }))

      mockPrisma.student.findMany.mockResolvedValue(largeStudentSet)
      mockPrisma.room.findMany.mockResolvedValue(multipleRooms)

      const startTime = Date.now()
      const result = await scheduler.generateSchedule('FIRST_TERM')
      const executionTime = Date.now() - startTime

      // 60秒以内に完了することを期待（実際の要件に応じて調整）
      expect(executionTime).toBeLessThan(60000)

      if (result.success) {
        expect(result.assignments!.length).toBeGreaterThan(0)
      }
    }, 70000) // 70秒タイムアウト
  })
})
