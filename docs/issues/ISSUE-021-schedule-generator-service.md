# Issue #021: スケジュール生成サービスの実装

**Priority**: High  
**Difficulty**: Advanced  
**Estimated Time**: 8-12 hours  
**Type**: Backend  
**Labels**: backend, algorithm, scheduling, core-feature

## Description

図書委員当番システムの核となるスケジュール自動生成機能を実装します。複雑な制約条件を満たしながら、公平で最適な当番表を生成するアルゴリズムを開発します。

## Background

概要設計書で定義された制約最適化問題として、週2回の割り当て、同クラス同日回避、前後期バランスなどの条件を満たすスケジューリングアルゴリズムを実装します。

## Acceptance Criteria

- [ ] スケジューリングサービスクラスが実装されている
- [ ] 制約条件チェック機能が実装されている
- [ ] 最適化アルゴリズムが実装されている
- [ ] 前期・後期スケジュール生成が可能
- [ ] バランス評価機能が実装されている
- [ ] エラーハンドリングと再試行機能が実装されている
- [ ] パフォーマンス最適化が実装されている
- [ ] 十分なテストケースが作成されている

## Implementation Guidelines

### Technical Requirements

#### Core Algorithm Implementation

##### src/lib/services/scheduler.ts

```typescript
import { prisma } from '@/lib/database'
import { Prisma } from '@prisma/client'

interface ScheduleConstraints {
  maxAssignmentsPerStudent: number // 2
  maxStudentsPerSlot: number // 3-4名程度
  avoidSameClassSameDay: boolean // true
  considerPreviousTerm: boolean // 後期の場合true
}

interface ScheduleSlot {
  dayOfWeek: number // 1-5 (月-金)
  roomId: string
  capacity: number
}

interface StudentInfo {
  id: string
  name: string
  classId: string
  grade: number
  previousAssignments?: number[] // 前期の曜日リスト
}

interface AssignmentResult {
  studentId: string
  roomId: string
  dayOfWeek: number
  term: 'FIRST_TERM' | 'SECOND_TERM'
}

export class SchedulerService {
  private constraints: ScheduleConstraints = {
    maxAssignmentsPerStudent: 2,
    maxStudentsPerSlot: 4,
    avoidSameClassSameDay: true,
    considerPreviousTerm: true,
  }

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
      // 既存割り当てチェック
      const existingAssignments = await this.checkExistingAssignments(term)
      if (existingAssignments.length > 0 && !forceRegenerate) {
        throw new Error('既に当番表が作成されています')
      }

      // データ取得
      const students = await this.getActiveStudents()
      const rooms = await this.getRooms()
      const slots = this.generateSlots(rooms)

      if (students.length === 0) {
        throw new Error('アクティブな図書委員が登録されていません')
      }

      // 前期データの取得（後期の場合）
      if (term === 'SECOND_TERM') {
        await this.loadPreviousTermData(students)
      }

      // スケジュール生成実行
      const assignments = await this.executeScheduling(students, slots, term)

      if (!assignments) {
        throw new Error('制約条件を満たすスケジュールを生成できませんでした')
      }

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

  private async executeScheduling(
    students: StudentInfo[],
    slots: ScheduleSlot[],
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): Promise<AssignmentResult[] | null> {
    // バックトラッキングアルゴリズムで最適解を探索
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
          if (score > 0.95) break
        }
      }

      // 進捗ログ（長時間の処理対策）
      if (attempt % 100 === 0) {
        console.log(
          `Scheduling attempt ${attempt}/${maxAttempts}, best score: ${bestScore}`
        )
      }
    }

    return bestAssignment
  }

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

      // 割り当て実行
      for (let i = currentCount; i < requiredAssignments && selectedSlot; i++) {
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

  private findAvailableSlots(
    student: StudentInfo,
    slots: ScheduleSlot[],
    currentAssignments: AssignmentResult[],
    dayClassMap: Map<string, Set<string>>,
    term: 'FIRST_TERM' | 'SECOND_TERM'
  ): ScheduleSlot[] {
    return slots.filter((slot) => {
      // 同クラス同日制約チェック
      const dayRoomKey = `${slot.dayOfWeek}-${slot.roomId}`
      const classesInSlot = dayClassMap.get(dayRoomKey) || new Set()

      if (classesInSlot.has(student.classId)) {
        return false
      }

      // スロット定員チェック
      const assignmentsInSlot = currentAssignments.filter(
        (a) => a.dayOfWeek === slot.dayOfWeek && a.roomId === slot.roomId
      )

      if (assignmentsInSlot.length >= slot.capacity) {
        return false
      }

      // 後期の水・金制約チェック
      if (
        term === 'SECOND_TERM' &&
        student.previousAssignments?.includes(slot.dayOfWeek) &&
        (slot.dayOfWeek === 3 || slot.dayOfWeek === 5)
      ) {
        return false
      }

      return true
    })
  }

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
  }

  // ... その他のヘルパーメソッド
}

interface ScheduleStats {
  totalAssignments: number
  studentsAssigned: number
  averageAssignmentsPerStudent: number
  balanceScore: number
  assignmentsByDay: Record<number, number>
  assignmentsByRoom: Record<string, number>
}
```

### Resources

- [Constraint Satisfaction Problem](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem)
- [Backtracking Algorithm](https://en.wikipedia.org/wiki/Backtracking)
- [概要設計書 - アルゴリズム仕様](../図書委員当番割り当て自動化システム%20概要設計書.md)

## Implementation Results

### Work Completed

- [ ] SchedulerServiceクラス実装
- [ ] 制約条件チェック機能実装
- [ ] バックトラッキングアルゴリズム実装
- [ ] バランス評価機能実装
- [ ] データベース保存機能実装
- [ ] エラーハンドリング実装
- [ ] パフォーマンス最適化実装

### Testing Results

- [ ] 小規模データでの動作確認
- [ ] 制約条件違反のテスト
- [ ] 最適化アルゴリズムの効果確認
- [ ] パフォーマンステスト実行

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->
