/**
 * 図書委員当番スケジュール自動生成サービス
 *
 * 制約最適化問題として当番表を生成し、
 * 公平で最適なスケジューリングを実現します。
 */

import { prisma } from '@/lib/database'

// スケジューリング制約条件
interface ScheduleConstraints {
  maxAssignmentsPerStudent: number // 1名あたりの最大当番回数
  maxStudentsPerSlot: number // 1スロットあたりの最大人数
  avoidSameClassSameDay: boolean // 同クラス同日回避
  considerPreviousTerm: boolean // 前期データ考慮（後期の場合）
}

// スケジュールスロット（時間枠）
interface ScheduleSlot {
  dayOfWeek: number // 1-5 (月-金)
  roomId: string
  capacity: number
}

// 学生情報（スケジューリング用）
interface StudentInfo {
  id: string
  name: string
  classId: string
  grade: number
  previousAssignments?: number[] // 前期の曜日リスト
}

// 割り当て結果
interface AssignmentResult {
  studentId: string
  roomId: string
  dayOfWeek: number
  term: 'FIRST_TERM' | 'SECOND_TERM'
}

// スケジュール統計情報
interface ScheduleStats {
  totalAssignments: number
  studentsAssigned: number
  averageAssignmentsPerStudent: number
  balanceScore: number
  assignmentsByDay: Record<number, number>
  assignmentsByRoom: Record<string, number>
}

/**
 * スケジューリングサービス
 * バックトラッキングアルゴリズムによる制約満足問題として解決
 */
export class SchedulerService {
  private constraints: ScheduleConstraints = {
    maxAssignmentsPerStudent: 2,
    maxStudentsPerSlot: 4,
    avoidSameClassSameDay: true,
    considerPreviousTerm: true,
  }

  /**
   * スケジュール生成のメインエントリーポイント
   */
  async generateSchedule(
    term: 'FIRST_TERM' | 'SECOND_TERM',
    forceRegenerate: boolean = false
  ): Promise<{
    success: boolean
    assignments?: AssignmentResult[]
    stats?: ScheduleStats
    error?: string
  }> {
    try {
      console.log(`スケジュール生成開始: ${term}`)

      // 既存割り当てチェック
      const existingAssignments = await this.checkExistingAssignments(term)
      if (existingAssignments.length > 0 && !forceRegenerate) {
        throw new Error('既に当番表が作成されています')
      }

      // データ取得と検証
      const students = await this.getActiveStudents()
      const rooms = await this.getRooms()
      const slots = this.generateSlots(rooms)

      if (students.length === 0) {
        throw new Error('アクティブな図書委員が登録されていません')
      }

      if (rooms.length === 0) {
        throw new Error('図書室が登録されていません')
      }

      console.log(
        `データ確認: 学生${students.length}名, 図書室${rooms.length}室`
      )

      // 前期データの取得（後期の場合）
      if (term === 'SECOND_TERM') {
        await this.loadPreviousTermData(students)
      }

      // スケジュール生成実行
      const assignments = await this.executeScheduling(students, slots, term)

      if (!assignments) {
        throw new Error('制約条件を満たすスケジュールを生成できませんでした')
      }

      console.log(`スケジュール生成成功: ${assignments.length}件の割り当て`)

      // データベース保存
      await this.saveAssignments(assignments, term, forceRegenerate)

      // 統計計算
      const stats = this.calculateStats(assignments, students)

      return {
        success: true,
        assignments,
        stats,
      }
    } catch (error) {
      console.error('Schedule generation failed:', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '不明なエラーが発生しました',
      }
    }
  }

  /**
   * 既存の割り当てをチェック
   */
  private async checkExistingAssignments(
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): Promise<AssignmentResult[]> {
    const assignments = await prisma.assignment.findMany({
      where: { term },
    })

    return assignments.map((a) => ({
      studentId: a.studentId,
      roomId: a.roomId,
      dayOfWeek: a.dayOfWeek,
      term: a.term as 'FIRST_TERM' | 'SECOND_TERM',
    }))
  }

  /**
   * アクティブな学生を取得
   */
  private async getActiveStudents(): Promise<StudentInfo[]> {
    const students = await prisma.student.findMany({
      where: { isActive: true },
      include: { class: true },
      orderBy: { name: 'asc' },
    })

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      classId: s.classId,
      grade: s.grade,
    }))
  }

  /**
   * 図書室情報を取得
   */
  private async getRooms(): Promise<
    Array<{ id: string; name: string; capacity: number }>
  > {
    return await prisma.room.findMany({
      orderBy: { name: 'asc' },
    })
  }

  /**
   * スケジュールスロットを生成
   */
  private generateSlots(
    rooms: Array<{ id: string; name: string; capacity: number }>
  ): ScheduleSlot[] {
    const slots: ScheduleSlot[] = []

    // 月曜日から金曜日（1-5）
    for (let day = 1; day <= 5; day++) {
      for (const room of rooms) {
        slots.push({
          dayOfWeek: day,
          roomId: room.id,
          capacity: room.capacity,
        })
      }
    }

    return slots
  }

  /**
   * 前期のデータを読み込み（後期生成時）
   */
  private async loadPreviousTermData(students: StudentInfo[]): Promise<void> {
    const previousAssignments = await prisma.assignment.findMany({
      where: { term: 'FIRST_TERM' },
    })

    // 学生ごとに前期の曜日リストを設定
    for (const student of students) {
      const studentAssignments = previousAssignments.filter(
        (a) => a.studentId === student.id
      )
      student.previousAssignments = studentAssignments.map((a) => a.dayOfWeek)
    }
  }

  /**
   * スケジューリング実行（バックトラッキングアルゴリズム）
   */
  private async executeScheduling(
    students: StudentInfo[],
    slots: ScheduleSlot[],
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): Promise<AssignmentResult[] | null> {
    console.log('バックトラッキングアルゴリズム開始')

    const maxAttempts = 1000
    let bestAssignment: AssignmentResult[] | null = null
    let bestScore = -1

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const assignment = this.tryGenerateAssignment(students, slots, term)

      if (assignment && this.validateAssignment(assignment, students)) {
        const score = this.evaluateAssignment(assignment, students, slots)

        if (score > bestScore) {
          bestScore = score
          bestAssignment = assignment

          // 十分に良いスコアの場合は早期終了
          if (score > 0.95) {
            console.log(`最適解発見 (attempt ${attempt}, score: ${score})`)
            break
          }
        }
      }

      // 進捗ログ（長時間の処理対策）
      if (attempt % 100 === 0) {
        console.log(
          `試行 ${attempt}/${maxAttempts}, 最高スコア: ${bestScore.toFixed(3)}`
        )
      }
    }

    console.log(`最終結果: スコア ${bestScore.toFixed(3)}`)
    return bestAssignment
  }

  /**
   * 単一の割り当て試行
   */
  private tryGenerateAssignment(
    students: StudentInfo[],
    slots: ScheduleSlot[],
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): AssignmentResult[] | null {
    const assignments: AssignmentResult[] = []
    const studentAssignmentCounts = new Map<string, number>()
    const dayClassMap = new Map<string, Set<string>>() // day-room -> classIds

    // 学生をランダムにシャッフル（公平性確保）
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5)

    for (const student of shuffledStudents) {
      const requiredAssignments = this.constraints.maxAssignmentsPerStudent
      const currentCount = studentAssignmentCounts.get(student.id) || 0

      if (currentCount >= requiredAssignments) continue

      // 必要な回数分を割り当て
      for (let i = currentCount; i < requiredAssignments; i++) {
        // 割り当て可能なスロットを探索
        const availableSlots = this.findAvailableSlots(
          student,
          slots,
          assignments,
          dayClassMap,
          term
        )

        if (availableSlots.length === 0) {
          return null // 制約違反
        }

        // 最適なスロットを選択
        const selectedSlot = this.selectBestSlot(
          student,
          availableSlots,
          assignments
        )

        if (!selectedSlot) {
          return null
        }

        // 割り当て実行
        const assignment: AssignmentResult = {
          studentId: student.id,
          roomId: selectedSlot.roomId,
          dayOfWeek: selectedSlot.dayOfWeek,
          term,
        }

        assignments.push(assignment)
        studentAssignmentCounts.set(
          student.id,
          (studentAssignmentCounts.get(student.id) || 0) + 1
        )

        // 同クラス同日制約の更新
        const dayRoomKey = `${selectedSlot.dayOfWeek}-${selectedSlot.roomId}`
        if (!dayClassMap.has(dayRoomKey)) {
          dayClassMap.set(dayRoomKey, new Set())
        }
        dayClassMap.get(dayRoomKey)!.add(student.classId)
      }
    }

    return assignments
  }

  /**
   * 利用可能なスロットを検索
   */
  private findAvailableSlots(
    student: StudentInfo,
    slots: ScheduleSlot[],
    currentAssignments: AssignmentResult[],
    dayClassMap: Map<string, Set<string>>,
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): ScheduleSlot[] {
    return slots.filter((slot) => {
      // 同クラス同日制約チェック
      if (this.constraints.avoidSameClassSameDay) {
        const dayRoomKey = `${slot.dayOfWeek}-${slot.roomId}`
        const classesInSlot = dayClassMap.get(dayRoomKey) || new Set()

        if (classesInSlot.has(student.classId)) {
          return false
        }
      }

      // スロット定員チェック
      const assignmentsInSlot = currentAssignments.filter(
        (a) => a.dayOfWeek === slot.dayOfWeek && a.roomId === slot.roomId
      )

      if (assignmentsInSlot.length >= slot.capacity) {
        return false
      }

      // 学生の重複チェック（同一曜日）
      const studentDayAssignments = currentAssignments.filter(
        (a) => a.studentId === student.id && a.dayOfWeek === slot.dayOfWeek
      )

      if (studentDayAssignments.length > 0) {
        return false
      }

      // 後期の水・金制約チェック（前期で水・金の場合は避ける）
      if (
        term === 'SECOND_TERM' &&
        this.constraints.considerPreviousTerm &&
        student.previousAssignments?.includes(slot.dayOfWeek) &&
        (slot.dayOfWeek === 3 || slot.dayOfWeek === 5) // 水曜・金曜
      ) {
        return false
      }

      return true
    })
  }

  /**
   * 最適なスロットを選択
   */
  private selectBestSlot(
    student: StudentInfo,
    availableSlots: ScheduleSlot[],
    currentAssignments: AssignmentResult[]
  ): ScheduleSlot | null {
    if (availableSlots.length === 0) return null

    // より負荷の少ない曜日を優先
    const dayLoadMap = new Map<number, number>()
    for (const assignment of currentAssignments) {
      dayLoadMap.set(
        assignment.dayOfWeek,
        (dayLoadMap.get(assignment.dayOfWeek) || 0) + 1
      )
    }

    return availableSlots.reduce((best, slot) => {
      const currentDayLoad = dayLoadMap.get(slot.dayOfWeek) || 0
      const bestDayLoad = dayLoadMap.get(best.dayOfWeek) || 0

      return currentDayLoad < bestDayLoad ? slot : best
    })
  }

  /**
   * 割り当て結果の検証
   */
  private validateAssignment(
    assignments: AssignmentResult[],
    students: StudentInfo[]
  ): boolean {
    // 1. 学生ごとの割り当て数チェック
    const assignmentCounts = new Map<string, number>()
    for (const assignment of assignments) {
      assignmentCounts.set(
        assignment.studentId,
        (assignmentCounts.get(assignment.studentId) || 0) + 1
      )
    }

    for (const student of students) {
      const count = assignmentCounts.get(student.id) || 0
      if (count > this.constraints.maxAssignmentsPerStudent) {
        return false
      }
    }

    // 2. スロット定員チェック
    const slotCounts = new Map<string, number>()
    for (const assignment of assignments) {
      const slotKey = `${assignment.dayOfWeek}-${assignment.roomId}`
      slotCounts.set(slotKey, (slotCounts.get(slotKey) || 0) + 1)
    }

    for (const [, count] of slotCounts) {
      if (count > this.constraints.maxStudentsPerSlot) {
        return false
      }
    }

    return true
  }

  /**
   * 割り当て結果の評価（0-1のスコア）
   */
  private evaluateAssignment(
    assignments: AssignmentResult[],
    students: StudentInfo[],
    slots: ScheduleSlot[]
  ): number {
    let score = 0
    const maxScore = 100

    // 1. 学生割り当て数のバランス (30点)
    const assignmentCounts = new Map<string, number>()
    assignments.forEach((a) => {
      assignmentCounts.set(
        a.studentId,
        (assignmentCounts.get(a.studentId) || 0) + 1
      )
    })

    const targetCount = this.constraints.maxAssignmentsPerStudent
    const balanceScore =
      Array.from(assignmentCounts.values()).reduce((sum, count) => {
        return sum + (count === targetCount ? 10 : 0)
      }, 0) / students.length
    score += Math.min(balanceScore, 30)

    // 2. 曜日別負荷平準化 (25点)
    const dayDistribution = new Map<number, number>()
    assignments.forEach((a) => {
      dayDistribution.set(
        a.dayOfWeek,
        (dayDistribution.get(a.dayOfWeek) || 0) + 1
      )
    })

    const avgPerDay = assignments.length / 5
    const dayBalance = Array.from(dayDistribution.values()).reduce(
      (sum, count) => {
        return sum + Math.abs(count - avgPerDay)
      },
      0
    )
    score += Math.max(0, 25 - dayBalance)

    // 3. 図書室別負荷平準化 (25点)
    const roomDistribution = new Map<string, number>()
    assignments.forEach((a) => {
      roomDistribution.set(a.roomId, (roomDistribution.get(a.roomId) || 0) + 1)
    })

    const avgPerRoom = assignments.length / slots.length
    const roomBalance = Array.from(roomDistribution.values()).reduce(
      (sum, count) => {
        return sum + Math.abs(count - avgPerRoom)
      },
      0
    )
    score += Math.max(0, 25 - roomBalance)

    // 4. 学年バランス (20点)
    const gradeBalance = this.evaluateGradeBalance(assignments, students)
    score += gradeBalance

    return score / maxScore
  }

  /**
   * 学年バランスの評価
   */
  private evaluateGradeBalance(
    assignments: AssignmentResult[],
    students: StudentInfo[]
  ): number {
    const gradeDistribution = new Map<number, number>()
    const studentGradeMap = new Map<string, number>()

    // 学生の学年マップを作成
    students.forEach((s) => {
      studentGradeMap.set(s.id, s.grade)
    })

    // 割り当てごとの学年分布を計算
    assignments.forEach((a) => {
      const grade = studentGradeMap.get(a.studentId) || 0
      gradeDistribution.set(grade, (gradeDistribution.get(grade) || 0) + 1)
    })

    // 理想的な分布からの偏差を計算
    const totalAssignments = assignments.length
    const gradeVariance = Array.from(gradeDistribution.values()).reduce(
      (sum, count) => {
        const expected = totalAssignments / gradeDistribution.size
        return sum + Math.abs(count - expected)
      },
      0
    )

    return Math.max(0, 20 - gradeVariance)
  }

  /**
   * 割り当て結果をデータベースに保存
   */
  private async saveAssignments(
    assignments: AssignmentResult[],
    term: 'FIRST_TERM' | 'SECOND_TERM',
    forceRegenerate: boolean
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 既存データの削除（再生成時）
      if (forceRegenerate) {
        await tx.assignment.deleteMany({
          where: { term },
        })
      }

      // 新しい割り当てを保存
      await tx.assignment.createMany({
        data: assignments,
      })
    })

    console.log(`${assignments.length}件の割り当てを保存しました`)
  }

  /**
   * 統計情報の計算
   */
  private calculateStats(
    assignments: AssignmentResult[],
    students: StudentInfo[]
  ): ScheduleStats {
    const assignmentsByDay: Record<number, number> = {}
    const assignmentsByRoom: Record<string, number> = {}
    const studentAssignmentCounts = new Map<string, number>()

    // 集計
    assignments.forEach((a) => {
      assignmentsByDay[a.dayOfWeek] = (assignmentsByDay[a.dayOfWeek] || 0) + 1
      assignmentsByRoom[a.roomId] = (assignmentsByRoom[a.roomId] || 0) + 1
      studentAssignmentCounts.set(
        a.studentId,
        (studentAssignmentCounts.get(a.studentId) || 0) + 1
      )
    })

    const studentsAssigned = studentAssignmentCounts.size
    const averageAssignmentsPerStudent = assignments.length / studentsAssigned

    // バランススコア計算（簡易版）
    const balanceScore = this.evaluateAssignment(assignments, students, [])

    return {
      totalAssignments: assignments.length,
      studentsAssigned,
      averageAssignmentsPerStudent,
      balanceScore,
      assignmentsByDay,
      assignmentsByRoom,
    }
  }
}
