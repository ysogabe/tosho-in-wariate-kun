/**
 * クラス管理ビジネスロジックのテスト
 * 外部依存のない純粋な関数のテストに焦点を当てる
 */

import {
  transformClassesToResponse,
  transformClassToResponse,
  buildClassSearchWhere,
  buildDuplicateCheckWhere,
  createClassSuccessMessage,
  createClassDuplicateMessage,
  validatePaginationParams,
  calculateOffset,
  normalizeClassName,
  isValidClassName,
  isValidYear,
} from '@/lib/services/class-service'

describe('Class Service Business Logic', () => {
  describe('データ変換関数', () => {
    describe('transformClassesToResponse', () => {
      it('複数クラスデータを正しくレスポンス形式に変換する', () => {
        const input = [
          {
            id: 'class-1',
            name: '5年1組',
            year: 5,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-02'),
            _count: { students: 25 },
          },
          {
            id: 'class-2',
            name: '6年A組',
            year: 6,
            createdAt: new Date('2024-01-03'),
            updatedAt: new Date('2024-01-04'),
            _count: { students: 28 },
          },
        ]

        const result = transformClassesToResponse(input)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
          id: 'class-1',
          name: '5年1組',
          year: 5,
          studentCount: 25,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        })
        expect(result[1]).toEqual({
          id: 'class-2',
          name: '6年A組',
          year: 6,
          studentCount: 28,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-04'),
        })
      })

      it('空の配列を正しく処理する', () => {
        const result = transformClassesToResponse([])
        expect(result).toEqual([])
      })

      it('学生数が0のクラスも正しく処理する', () => {
        const input = [
          {
            id: 'class-empty',
            name: '5年2組',
            year: 5,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            _count: { students: 0 },
          },
        ]

        const result = transformClassesToResponse(input)

        expect(result[0].studentCount).toBe(0)
      })
    })

    describe('transformClassToResponse', () => {
      it('単一クラスデータを正しく変換する', () => {
        const input = {
          id: 'class-1',
          name: '5年1組',
          year: 5,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          _count: { students: 25 },
        }

        const result = transformClassToResponse(input)

        expect(result).toEqual({
          id: 'class-1',
          name: '5年1組',
          year: 5,
          studentCount: 25,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
        })
      })
    })
  })

  describe('検索条件構築関数', () => {
    describe('buildClassSearchWhere', () => {
      it('年度のみ指定された場合', () => {
        const result = buildClassSearchWhere({ year: 5 })
        expect(result).toEqual({ year: 5 })
      })

      it('検索文字列のみ指定された場合', () => {
        const result = buildClassSearchWhere({ search: '1組' })
        expect(result).toEqual({
          name: { contains: '1組', mode: 'insensitive' },
        })
      })

      it('年度と検索文字列の両方が指定された場合', () => {
        const result = buildClassSearchWhere({ year: 6, search: 'A組' })
        expect(result).toEqual({
          year: 6,
          name: { contains: 'A組', mode: 'insensitive' },
        })
      })

      it('何も指定されない場合は空のオブジェクトを返す', () => {
        const result = buildClassSearchWhere({})
        expect(result).toEqual({})
      })

      it('undefined値を適切に無視する', () => {
        const result = buildClassSearchWhere({
          year: undefined,
          search: undefined,
        })
        expect(result).toEqual({})
      })
    })

    describe('buildDuplicateCheckWhere', () => {
      it('重複チェック条件を正しく生成する', () => {
        const result = buildDuplicateCheckWhere('1組', 5)
        expect(result).toEqual({ name: '1組', year: 5 })
      })
    })
  })

  describe('メッセージ生成関数', () => {
    describe('createClassSuccessMessage', () => {
      it('成功メッセージを正しく生成する', () => {
        const result = createClassSuccessMessage('1組', 5)
        expect(result).toBe('5年1組を作成しました')
      })

      it('異なる年度とクラス名でも正しく生成する', () => {
        const result = createClassSuccessMessage('A組', 6)
        expect(result).toBe('6年A組を作成しました')
      })
    })

    describe('createClassDuplicateMessage', () => {
      it('重複エラーメッセージを正しく生成する', () => {
        const result = createClassDuplicateMessage('1組', 5)
        expect(result).toBe('5年1組は既に存在します')
      })
    })
  })

  describe('バリデーション関数', () => {
    describe('validatePaginationParams', () => {
      it('有効なパラメータの場合、バリデーションが通る', () => {
        const result = validatePaginationParams(1, 20)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('ページ番号が0以下の場合、エラーになる', () => {
        const result = validatePaginationParams(0, 20)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('ページ番号は1以上である必要があります')
      })

      it('制限数が0以下の場合、エラーになる', () => {
        const result = validatePaginationParams(1, 0)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('制限数は1以上である必要があります')
      })

      it('制限数が100を超える場合、エラーになる', () => {
        const result = validatePaginationParams(1, 101)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('制限数は100以下である必要があります')
      })

      it('複数のエラーがある場合、すべて報告する', () => {
        const result = validatePaginationParams(-1, 150)
        expect(result.isValid).toBe(false)
        expect(result.errors).toHaveLength(2)
        expect(result.errors).toContain('ページ番号は1以上である必要があります')
        expect(result.errors).toContain('制限数は100以下である必要があります')
      })

      it('境界値テスト: page=1, limit=1', () => {
        const result = validatePaginationParams(1, 1)
        expect(result.isValid).toBe(true)
      })

      it('境界値テスト: page=1000, limit=100', () => {
        const result = validatePaginationParams(1000, 100)
        expect(result.isValid).toBe(true)
      })
    })

    describe('calculateOffset', () => {
      it('オフセットを正しく計算する', () => {
        expect(calculateOffset(1, 20)).toBe(0)
        expect(calculateOffset(2, 20)).toBe(20)
        expect(calculateOffset(3, 10)).toBe(20)
        expect(calculateOffset(5, 25)).toBe(100)
      })

      it('境界値でも正しく動作する', () => {
        expect(calculateOffset(1, 1)).toBe(0)
        expect(calculateOffset(100, 1)).toBe(99)
      })
    })

    describe('normalizeClassName', () => {
      it('前後の空白を除去する', () => {
        expect(normalizeClassName('  1組  ')).toBe('1組')
        expect(normalizeClassName('\t2組\n')).toBe('2組')
      })

      it('中央の空白は保持する', () => {
        expect(normalizeClassName('5年 A組')).toBe('5年 A組')
      })

      it('空白のみの文字列は空文字になる', () => {
        expect(normalizeClassName('   ')).toBe('')
        expect(normalizeClassName('\t\n')).toBe('')
      })

      it('通常の文字列はそのまま返す', () => {
        expect(normalizeClassName('1組')).toBe('1組')
      })
    })

    describe('isValidClassName', () => {
      it('有効なクラス名を認識する', () => {
        expect(isValidClassName('1組')).toBe(true)
        expect(isValidClassName('A組')).toBe(true)
        expect(isValidClassName('5年 特別クラス')).toBe(true)
      })

      it('空文字や空白のみは無効', () => {
        expect(isValidClassName('')).toBe(false)
        expect(isValidClassName('   ')).toBe(false)
        expect(isValidClassName('\t\n')).toBe(false)
      })

      it('20文字を超える名前は無効', () => {
        const longName = '非常に長いクラス名でテスト用に作成したものです'
        expect(longName.length).toBeGreaterThan(20)
        expect(isValidClassName(longName)).toBe(false)
      })

      it('境界値テスト: 20文字ちょうど', () => {
        const exactName = '12345678901234567890' // 20文字
        expect(exactName.length).toBe(20)
        expect(isValidClassName(exactName)).toBe(true)
      })

      it('前後の空白を考慮した判定', () => {
        expect(isValidClassName('  1組  ')).toBe(true) // トリム後は有効
        expect(isValidClassName('  ')).toBe(false) // トリム後は空文字
      })
    })

    describe('isValidYear', () => {
      it('有効な年度を認識する', () => {
        expect(isValidYear(5)).toBe(true)
        expect(isValidYear(6)).toBe(true)
      })

      it('無効な年度を拒否する', () => {
        expect(isValidYear(4)).toBe(false)
        expect(isValidYear(7)).toBe(false)
        expect(isValidYear(0)).toBe(false)
        expect(isValidYear(-1)).toBe(false)
      })

      it('非整数は無効', () => {
        expect(isValidYear(5.5)).toBe(false)
        expect(isValidYear(5.1)).toBe(false)
      })

      it('特殊値の処理', () => {
        expect(isValidYear(NaN)).toBe(false)
        expect(isValidYear(Infinity)).toBe(false)
        expect(isValidYear(-Infinity)).toBe(false)
      })
    })
  })

  describe('統合シナリオテスト', () => {
    it('完全なクラス作成フローのデータ変換', () => {
      // 1. 入力の正規化
      const rawName = '  1組  '
      const normalizedName = normalizeClassName(rawName)
      expect(normalizedName).toBe('1組')

      // 2. バリデーション
      expect(isValidClassName(normalizedName)).toBe(true)
      expect(isValidYear(5)).toBe(true)

      // 3. 重複チェック条件生成
      const duplicateWhere = buildDuplicateCheckWhere(normalizedName, 5)
      expect(duplicateWhere).toEqual({ name: '1組', year: 5 })

      // 4. 成功メッセージ生成
      const successMessage = createClassSuccessMessage(normalizedName, 5)
      expect(successMessage).toBe('5年1組を作成しました')
    })

    it('クラス検索フローの条件構築', () => {
      // 1. ページネーションバリデーション
      const paginationResult = validatePaginationParams(2, 10)
      expect(paginationResult.isValid).toBe(true)

      // 2. オフセット計算
      const offset = calculateOffset(2, 10)
      expect(offset).toBe(10)

      // 3. 検索条件構築
      const searchWhere = buildClassSearchWhere({ year: 5, search: '1組' })
      expect(searchWhere).toEqual({
        year: 5,
        name: { contains: '1組', mode: 'insensitive' },
      })
    })
  })
})
