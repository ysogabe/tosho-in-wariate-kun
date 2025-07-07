/**
 * スケジュール管理スキーマのテスト
 * TDD implementation following t_wada methodology
 */

import {
  generateScheduleSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  scheduleSearchSchema,
  exportScheduleSchema,
  resetScheduleSchema,
  bulkAssignmentChangeSchema,
} from '../schedule-schemas'

describe('schedule-schemas', () => {
  describe('generateScheduleSchema', () => {
    it('有効なスケジュール生成データを受け入れる', () => {
      const validData = {
        term: 'FIRST_TERM' as const,
        forceRegenerate: true,
        constraints: {
          maxAssignmentsPerStudent: 3,
          maxStudentsPerSlot: 5,
          avoidSameClassSameDay: true,
          considerPreviousTerm: false,
        },
      }

      expect(() => generateScheduleSchema.parse(validData)).not.toThrow()
    })

    it('constraintsは省略可能', () => {
      const minimalData = {
        term: 'SECOND_TERM' as const,
      }

      const result = generateScheduleSchema.parse(minimalData)
      expect(result.forceRegenerate).toBe(false) // デフォルト値
      expect(result.constraints).toBeUndefined()
    })

    it('無効な期間を拒否する', () => {
      const invalidData = {
        term: 'INVALID_TERM',
      }

      expect(() => generateScheduleSchema.parse(invalidData)).toThrow(
        '期間は前期または後期を選択してください'
      )
    })

    it('constraintsの各値を検証する', () => {
      const invalidConstraints = [
        { maxAssignmentsPerStudent: 0 },
        { maxAssignmentsPerStudent: 6 },
        { maxStudentsPerSlot: 0 },
        { maxStudentsPerSlot: 11 },
      ]

      invalidConstraints.forEach((constraints) => {
        const data = {
          term: 'FIRST_TERM' as const,
          constraints,
        }
        expect(() => generateScheduleSchema.parse(data)).toThrow()
      })
    })
  })

  describe('createAssignmentSchema', () => {
    it('有効な割り当て作成データを受け入れる', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
        dayOfWeek: 1,
        term: 'FIRST_TERM' as const,
      }

      expect(() => createAssignmentSchema.parse(validData)).not.toThrow()
    })

    it('無効なUUIDを拒否する', () => {
      const invalidData = {
        studentId: 'invalid-uuid',
        roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
        dayOfWeek: 1,
        term: 'FIRST_TERM' as const,
      }

      expect(() => createAssignmentSchema.parse(invalidData)).toThrow(
        '無効なIDです'
      )
    })

    it('無効な曜日を拒否する', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
        dayOfWeek: 6,
        term: 'FIRST_TERM' as const,
      }

      expect(() => createAssignmentSchema.parse(invalidData)).toThrow(
        '曜日は1（月曜日）から5（金曜日）の範囲で入力してください'
      )
    })

    it('無効な期間を拒否する', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
        dayOfWeek: 1,
        term: 'INVALID_TERM',
      }

      expect(() => createAssignmentSchema.parse(invalidData)).toThrow(
        '期間は前期または後期を選択してください'
      )
    })
  })

  describe('updateAssignmentSchema', () => {
    it('有効な更新データを受け入れる', () => {
      const validUpdates = [
        { studentId: '123e4567-e89b-12d3-a456-426614174000' },
        { roomId: '987fcdeb-51d2-3ba4-a456-426614174000' },
        { dayOfWeek: 3 },
        { term: 'SECOND_TERM' as const },
        {
          studentId: '123e4567-e89b-12d3-a456-426614174000',
          roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
          dayOfWeek: 5,
          term: 'FIRST_TERM' as const,
        },
      ]

      validUpdates.forEach((update) => {
        expect(() => updateAssignmentSchema.parse(update)).not.toThrow()
      })
    })

    it('空のオブジェクトも有効', () => {
      expect(() => updateAssignmentSchema.parse({})).not.toThrow()
    })

    it('無効なUUIDを拒否する', () => {
      expect(() =>
        updateAssignmentSchema.parse({ studentId: 'invalid-uuid' })
      ).toThrow('無効なIDです')
      expect(() =>
        updateAssignmentSchema.parse({ roomId: 'invalid-uuid' })
      ).toThrow('無効なIDです')
    })

    it('無効な曜日を拒否する', () => {
      expect(() => updateAssignmentSchema.parse({ dayOfWeek: 0 })).toThrow(
        '曜日は1（月曜日）から5（金曜日）の範囲で入力してください'
      )
      expect(() => updateAssignmentSchema.parse({ dayOfWeek: 6 })).toThrow(
        '曜日は1（月曜日）から5（金曜日）の範囲で入力してください'
      )
    })

    it('無効な期間を拒否する', () => {
      expect(() =>
        updateAssignmentSchema.parse({ term: 'INVALID_TERM' })
      ).toThrow('期間は前期または後期を選択してください')
    })
  })

  describe('scheduleSearchSchema', () => {
    it('有効な検索パラメータを受け入れる', () => {
      const validQueries = [
        {},
        { term: 'FIRST_TERM' },
        { format: 'list' },
        { includeStudents: 'false', includeRooms: 'true' },
        {
          term: 'SECOND_TERM',
          format: 'calendar',
          includeStudents: 'true',
          includeRooms: 'false',
        },
      ]

      validQueries.forEach((query) => {
        expect(() => scheduleSearchSchema.parse(query)).not.toThrow()
      })
    })

    it('デフォルト値が正しく適用される', () => {
      const result = scheduleSearchSchema.parse({})
      expect(result.format).toBe('grid')
      expect(result.includeStudents).toBe(true)
      expect(result.includeRooms).toBe(true)
    })

    it('無効なフォーマットを拒否する', () => {
      expect(() => scheduleSearchSchema.parse({ format: 'invalid' })).toThrow()
    })

    it('無効な期間を拒否する', () => {
      expect(() =>
        scheduleSearchSchema.parse({ term: 'INVALID_TERM' })
      ).toThrow()
    })
  })

  describe('exportScheduleSchema', () => {
    it('有効なエクスポートパラメータを受け入れる', () => {
      const validParams = [
        {},
        { term: 'FIRST_TERM' },
        { format: 'json' },
        { includeStatistics: false },
        {
          term: 'SECOND_TERM',
          format: 'pdf',
          includeStatistics: true,
        },
      ]

      validParams.forEach((param) => {
        expect(() => exportScheduleSchema.parse(param)).not.toThrow()
      })
    })

    it('デフォルト値が正しく適用される', () => {
      const result = exportScheduleSchema.parse({})
      expect(result.format).toBe('csv')
      expect(result.includeStatistics).toBe(true)
    })

    it('無効なフォーマットを拒否する', () => {
      expect(() => exportScheduleSchema.parse({ format: 'xml' })).toThrow()
    })
  })

  describe('resetScheduleSchema', () => {
    it('有効なリセットデータを受け入れる', () => {
      const validData = [
        { term: 'FIRST_TERM', confirmDelete: true },
        { term: 'SECOND_TERM', confirmDelete: true },
        { term: 'ALL', confirmDelete: true },
      ]

      validData.forEach((data) => {
        expect(() => resetScheduleSchema.parse(data)).not.toThrow()
      })
    })

    it('確認なしでのリセットを拒否する', () => {
      const invalidData = {
        term: 'FIRST_TERM',
        confirmDelete: false,
      }

      expect(() => resetScheduleSchema.parse(invalidData)).toThrow(
        '削除を実行するには確認が必要です'
      )
    })

    it('無効な期間を拒否する', () => {
      const invalidData = {
        term: 'INVALID_TERM',
        confirmDelete: true,
      }

      expect(() => resetScheduleSchema.parse(invalidData)).toThrow()
    })
  })

  describe('bulkAssignmentChangeSchema', () => {
    it('有効な一括変更データを受け入れる', () => {
      const validData = {
        assignmentIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '987fcdeb-51d2-3ba4-a456-426614174000',
        ],
        changes: {
          roomId: 'abcdef01-2345-6789-abcd-123456789012',
          dayOfWeek: 3,
        },
        confirm: true,
      }

      expect(() => bulkAssignmentChangeSchema.parse(validData)).not.toThrow()
    })

    it('assignmentIdsが空の場合を拒否する', () => {
      const invalidData = {
        assignmentIds: [],
        changes: { roomId: 'abcdef01-2345-6789-abcd-123456789012' },
        confirm: true,
      }

      expect(() => bulkAssignmentChangeSchema.parse(invalidData)).toThrow(
        '少なくとも1つの割り当てを選択してください'
      )
    })

    it('確認なしでの変更を拒否する', () => {
      const invalidData = {
        assignmentIds: ['123e4567-e89b-12d3-a456-426614174000'],
        changes: { roomId: 'abcdef01-2345-6789-abcd-123456789012' },
        confirm: false,
      }

      expect(() => bulkAssignmentChangeSchema.parse(invalidData)).toThrow(
        '操作を実行するには確認が必要です'
      )
    })

    it('無効なUUIDを拒否する', () => {
      const invalidData = {
        assignmentIds: ['invalid-uuid'],
        changes: { roomId: 'abcdef01-2345-6789-abcd-123456789012' },
        confirm: true,
      }

      expect(() => bulkAssignmentChangeSchema.parse(invalidData)).toThrow(
        '無効なIDです'
      )
    })
  })

  describe('型推論の動作確認', () => {
    it('GenerateScheduleData型が正しく推論される', () => {
      const data = generateScheduleSchema.parse({
        term: 'FIRST_TERM',
        forceRegenerate: true,
      })

      expect(typeof data.term).toBe('string')
      expect(typeof data.forceRegenerate).toBe('boolean')
    })

    it('CreateAssignmentData型が正しく推論される', () => {
      const data = createAssignmentSchema.parse({
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        roomId: '987fcdeb-51d2-3ba4-a456-426614174000',
        dayOfWeek: 1,
        term: 'FIRST_TERM',
      })

      expect(typeof data.studentId).toBe('string')
      expect(typeof data.roomId).toBe('string')
      expect(typeof data.dayOfWeek).toBe('number')
      expect(typeof data.term).toBe('string')
    })

    it('ScheduleSearchParams型が正しく推論される', () => {
      const data = scheduleSearchSchema.parse({
        term: 'SECOND_TERM',
        format: 'list',
        includeStudents: 'false',
      })

      expect(typeof data.term).toBe('string')
      expect(typeof data.format).toBe('string')
      expect(typeof data.includeStudents).toBe('boolean')
    })
  })
})
