/**
 * 図書委員管理ビジネスロジックのテスト
 * 純粋関数のみをテストし、高いカバレッジを目指す
 */

import {
  transformStudentsToResponse,
  transformStudentToResponse,
  buildStudentSearchWhere,
  buildStudentDuplicateCheckWhere,
  createStudentSuccessMessage,
  createStudentDuplicateMessage,
  createStudentUpdateMessage,
  createStudentDeleteMessage,
  normalizeStudentName,
  isValidStudentName,
  isValidGrade,
  canDeleteStudent,
  validatePaginationParams,
  calculateOffset,
} from '@/lib/services/student-service'

describe('student-service', () => {
  describe('transformStudentsToResponse', () => {
    it('図書委員リストを正しくレスポンス形式に変換する', () => {
      const students = [
        {
          id: 'student-1',
          name: '田中太郎',
          classId: 'class-1',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { assignments: 3 },
          class: {
            id: 'class-1',
            name: '1組',
            year: 5,
          },
        },
        {
          id: 'student-2',
          name: '佐藤花子',
          classId: 'class-2',
          grade: 6,
          isActive: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { assignments: 0 },
          class: {
            id: 'class-2',
            name: '2組',
            year: 6,
          },
        },
      ]

      const result = transformStudentsToResponse(students)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'student-1',
        name: '田中太郎',
        classId: 'class-1',
        grade: 5,
        isActive: true,
        assignmentCount: 3,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        class: {
          id: 'class-1',
          name: '1組',
          year: 5,
        },
      })
      expect(result[1]).toEqual({
        id: 'student-2',
        name: '佐藤花子',
        classId: 'class-2',
        grade: 6,
        isActive: false,
        assignmentCount: 0,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
        class: {
          id: 'class-2',
          name: '2組',
          year: 6,
        },
      })
    })

    it('空の配列を正しく処理する', () => {
      const result = transformStudentsToResponse([])
      expect(result).toEqual([])
    })

    it('classが存在しない場合も正しく処理する', () => {
      const students = [
        {
          id: 'student-1',
          name: '田中太郎',
          classId: 'class-1',
          grade: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { assignments: 0 },
        },
      ]

      const result = transformStudentsToResponse(students)

      expect(result[0].class).toBeUndefined()
    })
  })

  describe('transformStudentToResponse', () => {
    it('単一図書委員データを正しくレスポンス形式に変換する', () => {
      const student = {
        id: 'student-1',
        name: '田中太郎',
        classId: 'class-1',
        grade: 5,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: { assignments: 2 },
        class: {
          id: 'class-1',
          name: '1組',
          year: 5,
        },
      }

      const result = transformStudentToResponse(student)

      expect(result).toEqual({
        id: 'student-1',
        name: '田中太郎',
        classId: 'class-1',
        grade: 5,
        isActive: true,
        assignmentCount: 2,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        class: {
          id: 'class-1',
          name: '1組',
          year: 5,
        },
      })
    })
  })

  describe('buildStudentSearchWhere', () => {
    it('全パラメータが指定された場合の検索条件を構築する', () => {
      const params = {
        search: '田中',
        classId: 'class-1',
        grade: 5,
        isActive: true,
      }

      const result = buildStudentSearchWhere(params)

      expect(result).toEqual({
        isActive: true,
        grade: 5,
        classId: 'class-1',
        name: { contains: '田中', mode: 'insensitive' },
      })
    })

    it('一部パラメータのみ指定された場合の検索条件を構築する', () => {
      const params = {
        search: '太郎',
        grade: 6,
      }

      const result = buildStudentSearchWhere(params)

      expect(result).toEqual({
        grade: 6,
        name: { contains: '太郎', mode: 'insensitive' },
      })
    })

    it('パラメータが指定されない場合は空のオブジェクトを返す', () => {
      const result = buildStudentSearchWhere({})
      expect(result).toEqual({})
    })

    it('isActiveがfalseの場合も正しく処理する', () => {
      const params = { isActive: false }
      const result = buildStudentSearchWhere(params)
      expect(result).toEqual({ isActive: false })
    })
  })

  describe('buildStudentDuplicateCheckWhere', () => {
    it('重複チェック用の条件を正しく生成する', () => {
      const result = buildStudentDuplicateCheckWhere('田中太郎', 'class-1')
      expect(result).toEqual({
        name: '田中太郎',
        classId: 'class-1',
      })
    })
  })

  describe('メッセージ生成関数', () => {
    describe('createStudentSuccessMessage', () => {
      it('図書委員登録成功メッセージを正しく生成する', () => {
        const result = createStudentSuccessMessage('田中太郎', '1組', 5)
        expect(result).toBe('5年1組の田中太郎さんを図書委員として登録しました')
      })

      it('6年生の場合も正しく生成する', () => {
        const result = createStudentSuccessMessage('佐藤花子', 'A組', 6)
        expect(result).toBe('6年A組の佐藤花子さんを図書委員として登録しました')
      })
    })

    describe('createStudentDuplicateMessage', () => {
      it('図書委員重複エラーメッセージを正しく生成する', () => {
        const result = createStudentDuplicateMessage('田中太郎', '1組', 5)
        expect(result).toBe(
          '5年1組には既に田中太郎さんが図書委員として登録されています'
        )
      })
    })

    describe('createStudentUpdateMessage', () => {
      it('図書委員更新成功メッセージを正しく生成する', () => {
        const result = createStudentUpdateMessage('田中太郎', '2組', 5)
        expect(result).toBe('5年2組の田中太郎さんの情報を更新しました')
      })
    })

    describe('createStudentDeleteMessage', () => {
      it('図書委員削除成功メッセージを正しく生成する', () => {
        const result = createStudentDeleteMessage('田中太郎', '1組', 5)
        expect(result).toBe('5年1組の田中太郎さんを図書委員から削除しました')
      })
    })
  })

  describe('normalizeStudentName', () => {
    it('前後の空白を除去する', () => {
      expect(normalizeStudentName('  田中太郎  ')).toBe('田中太郎')
      expect(normalizeStudentName('田中太郎')).toBe('田中太郎')
      expect(normalizeStudentName(' 田中 太郎 ')).toBe('田中 太郎')
    })

    it('空文字や空白のみの文字列を処理する', () => {
      expect(normalizeStudentName('')).toBe('')
      expect(normalizeStudentName('   ')).toBe('')
      expect(normalizeStudentName('\t\n')).toBe('')
    })
  })

  describe('isValidStudentName', () => {
    it('有効な名前を正しく判定する', () => {
      expect(isValidStudentName('田中太郎')).toBe(true)
      expect(isValidStudentName('佐藤')).toBe(true)
      expect(isValidStudentName('a')).toBe(true) // 1文字
      expect(isValidStudentName('あ'.repeat(50))).toBe(true) // 50文字
    })

    it('無効な名前を正しく判定する', () => {
      expect(isValidStudentName('')).toBe(false) // 空文字
      expect(isValidStudentName('   ')).toBe(false) // 空白のみ
      expect(isValidStudentName('あ'.repeat(51))).toBe(false) // 51文字
    })

    it('前後の空白がある場合は正規化してから判定する', () => {
      expect(isValidStudentName('  田中太郎  ')).toBe(true)
      expect(isValidStudentName('  ')).toBe(false)
    })
  })

  describe('isValidGrade', () => {
    it('有効な学年を正しく判定する', () => {
      expect(isValidGrade(5)).toBe(true)
      expect(isValidGrade(6)).toBe(true)
    })

    it('無効な学年を正しく判定する', () => {
      expect(isValidGrade(4)).toBe(false)
      expect(isValidGrade(7)).toBe(false)
      expect(isValidGrade(0)).toBe(false)
      expect(isValidGrade(-1)).toBe(false)
    })

    it('小数や非数値を正しく判定する', () => {
      expect(isValidGrade(5.5)).toBe(false)
      expect(isValidGrade(NaN)).toBe(false)
      expect(isValidGrade(Infinity)).toBe(false)
    })
  })

  describe('canDeleteStudent', () => {
    it('当番が割り当てられていない場合は削除可能', () => {
      const result = canDeleteStudent(0)
      expect(result).toEqual({ canDelete: true })
    })

    it('当番が割り当てられている場合は削除不可', () => {
      const result = canDeleteStudent(3)
      expect(result).toEqual({
        canDelete: false,
        reason:
          'この図書委員には3件の当番が割り当てられているため削除できません。先に当番表をリセットしてください。',
      })
    })

    it('1件の当番がある場合のメッセージ', () => {
      const result = canDeleteStudent(1)
      expect(result).toEqual({
        canDelete: false,
        reason:
          'この図書委員には1件の当番が割り当てられているため削除できません。先に当番表をリセットしてください。',
      })
    })
  })

  describe('validatePaginationParams', () => {
    it('有効なページネーションパラメータを正しく検証する', () => {
      const result = validatePaginationParams(1, 20)
      expect(result).toEqual({ isValid: true, errors: [] })
    })

    it('ページ番号が0以下の場合はエラー', () => {
      const result = validatePaginationParams(0, 20)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ページ番号は1以上である必要があります')
    })

    it('制限数が0以下の場合はエラー', () => {
      const result = validatePaginationParams(1, 0)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('制限数は1以上である必要があります')
    })

    it('制限数が100を超える場合はエラー', () => {
      const result = validatePaginationParams(1, 101)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('制限数は100以下である必要があります')
    })

    it('複数のエラーがある場合は全て返す', () => {
      const result = validatePaginationParams(-1, 200)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('ページ番号は1以上である必要があります')
      expect(result.errors).toContain('制限数は100以下である必要があります')
    })

    it('境界値のテスト', () => {
      expect(validatePaginationParams(1, 1).isValid).toBe(true)
      expect(validatePaginationParams(1, 100).isValid).toBe(true)
      expect(validatePaginationParams(1000, 50).isValid).toBe(true)
    })
  })

  describe('calculateOffset', () => {
    it('オフセットを正しく計算する', () => {
      expect(calculateOffset(1, 20)).toBe(0)
      expect(calculateOffset(2, 20)).toBe(20)
      expect(calculateOffset(3, 10)).toBe(20)
      expect(calculateOffset(5, 25)).toBe(100)
    })

    it('境界値のテスト', () => {
      expect(calculateOffset(1, 1)).toBe(0)
      expect(calculateOffset(100, 1)).toBe(99)
    })
  })
})
