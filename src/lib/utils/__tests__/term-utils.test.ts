/**
 * 学期判定ユーティリティのテスト
 */

import {
  getCurrentTerm,
  getTermForDate,
  getTermDisplayName,
  type Term,
} from '../term-utils'

describe('学期判定ユーティリティ', () => {
  describe('getCurrentTerm', () => {
    it('現在の学期を返す', () => {
      const result = getCurrentTerm()
      expect(result).toBe('FIRST_TERM')
    })

    it('戻り値が有効な学期タイプである', () => {
      const result = getCurrentTerm()
      expect(['FIRST_TERM', 'SECOND_TERM']).toContain(result)
    })
  })

  describe('getTermForDate', () => {
    it('指定された日付の学期を返す', () => {
      const testDate = new Date('2025-07-09')
      const result = getTermForDate(testDate)
      expect(result).toBe('FIRST_TERM')
    })

    it('戻り値が有効な学期タイプである', () => {
      const testDate = new Date('2025-07-09')
      const result = getTermForDate(testDate)
      expect(['FIRST_TERM', 'SECOND_TERM']).toContain(result)
    })
  })

  describe('getTermDisplayName', () => {
    it('FIRST_TERMの表示名を返す', () => {
      const result = getTermDisplayName('FIRST_TERM')
      expect(result).toBe('前期')
    })

    it('SECOND_TERMの表示名を返す', () => {
      const result = getTermDisplayName('SECOND_TERM')
      expect(result).toBe('後期')
    })

    it('無効な学期タイプの場合は不明を返す', () => {
      const result = getTermDisplayName('INVALID_TERM' as Term)
      expect(result).toBe('不明')
    })
  })
})
