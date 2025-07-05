/**
 * 図書委員管理API用Zodスキーマのテスト
 */

import {
  StudentsQuerySchema,
  CreateStudentSchema,
  UpdateStudentSchema,
  StudentIdParamSchema,
  ScheduleQuerySchema,
} from '../student-schemas'

describe('student-schemas', () => {
  describe('StudentsQuerySchema', () => {
    it('有効なクエリパラメータを正しく解析する', () => {
      const validQueries = [
        { page: '1', limit: '20' },
        { page: '2', limit: '10', search: '田中' },
        { page: '1', limit: '50', classId: '123e4567-e89b-12d3-a456-426614174000', grade: '5' },
        { page: '1', limit: '20', isActive: 'true' },
        { page: '3', limit: '25', search: '太郎', grade: '6', isActive: 'false' },
      ]

      validQueries.forEach((query) => {
        expect(() => StudentsQuerySchema.parse(query)).not.toThrow()
      })
    })

    it('デフォルト値が正しく適用される', () => {
      const result = StudentsQuerySchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('数値の文字列を正しく変換する', () => {
      const result = StudentsQuerySchema.parse({
        page: '3',
        limit: '15',
        grade: '5',
        isActive: 'true',
      })
      expect(result.page).toBe(3)
      expect(result.limit).toBe(15)
      expect(result.grade).toBe(5)
      expect(result.isActive).toBe(true)
    })

    it('無効なページ番号は拒否される', () => {
      expect(() => StudentsQuerySchema.parse({ page: '0' })).toThrow()
      expect(() => StudentsQuerySchema.parse({ page: '-1' })).toThrow()
    })

    it('無効な制限数は拒否される', () => {
      expect(() => StudentsQuerySchema.parse({ limit: '0' })).toThrow()
      expect(() => StudentsQuerySchema.parse({ limit: '101' })).toThrow()
    })

    it('無効なUUIDは拒否される', () => {
      expect(() => StudentsQuerySchema.parse({ classId: 'invalid-uuid' })).toThrow()
    })

    it('無効な学年は拒否される', () => {
      expect(() => StudentsQuerySchema.parse({ grade: '4' })).toThrow()
      expect(() => StudentsQuerySchema.parse({ grade: '7' })).toThrow()
    })
  })

  describe('CreateStudentSchema', () => {
    it('有効な図書委員作成データを正しく解析する', () => {
      const validData = {
        name: '田中太郎',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 5,
      }

      expect(() => CreateStudentSchema.parse(validData)).not.toThrow()
    })

    it('名前が必須であることを検証する', () => {
      const invalidData = {
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 5,
      }

      expect(() => CreateStudentSchema.parse(invalidData)).toThrow()
    })

    it('空の名前は拒否される', () => {
      const invalidData = {
        name: '',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 5,
      }

      expect(() => CreateStudentSchema.parse(invalidData)).toThrow()
    })

    it('長すぎる名前は拒否される', () => {
      const invalidData = {
        name: 'a'.repeat(51),
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 5,
      }

      expect(() => CreateStudentSchema.parse(invalidData)).toThrow()
    })

    it('無効なクラスIDは拒否される', () => {
      const invalidData = {
        name: '田中太郎',
        classId: 'invalid-uuid',
        grade: 5,
      }

      expect(() => CreateStudentSchema.parse(invalidData)).toThrow()
    })

    it('無効な学年は拒否される', () => {
      const invalidData = {
        name: '田中太郎',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 4,
      }

      expect(() => CreateStudentSchema.parse(invalidData)).toThrow()
    })
  })

  describe('UpdateStudentSchema', () => {
    it('有効な更新データを正しく解析する', () => {
      const validUpdates = [
        { name: '田中次郎' },
        { classId: '123e4567-e89b-12d3-a456-426614174000' },
        { grade: 6 },
        { isActive: false },
        {
          name: '佐藤花子',
          classId: '987fcdeb-51d2-3ba4-a456-426614174000',
          grade: 5,
          isActive: true,
        },
      ]

      validUpdates.forEach((update) => {
        expect(() => UpdateStudentSchema.parse(update)).not.toThrow()
      })
    })

    it('空のオブジェクトも有効', () => {
      expect(() => UpdateStudentSchema.parse({})).not.toThrow()
    })

    it('無効な名前は拒否される', () => {
      expect(() => UpdateStudentSchema.parse({ name: '' })).toThrow()
      expect(() => UpdateStudentSchema.parse({ name: 'a'.repeat(51) })).toThrow()
    })

    it('無効なクラスIDは拒否される', () => {
      expect(() => UpdateStudentSchema.parse({ classId: 'invalid-uuid' })).toThrow()
    })

    it('無効な学年は拒否される', () => {
      expect(() => UpdateStudentSchema.parse({ grade: 4 })).toThrow()
      expect(() => UpdateStudentSchema.parse({ grade: 7 })).toThrow()
    })
  })

  describe('StudentIdParamSchema', () => {
    it('有効なUUIDを正しく解析する', () => {
      const validId = { id: '123e4567-e89b-12d3-a456-426614174000' }
      expect(() => StudentIdParamSchema.parse(validId)).not.toThrow()
    })

    it('無効なUUIDは拒否される', () => {
      const invalidIds = [
        { id: 'invalid-uuid' },
        { id: '123' },
        { id: '' },
        {},
      ]

      invalidIds.forEach((invalidId) => {
        expect(() => StudentIdParamSchema.parse(invalidId)).toThrow()
      })
    })
  })

  describe('ScheduleQuerySchema', () => {
    it('有効な学期パラメータを正しく解析する', () => {
      const validTerms = [
        { term: 'FIRST_TERM' },
        { term: 'SECOND_TERM' },
        {},
      ]

      validTerms.forEach((term) => {
        expect(() => ScheduleQuerySchema.parse(term)).not.toThrow()
      })
    })

    it('無効な学期パラメータは拒否される', () => {
      const invalidTerms = [
        { term: 'INVALID_TERM' },
        { term: 'THIRD_TERM' },
        { term: '' },
        { term: 'first_term' },
      ]

      invalidTerms.forEach((invalidTerm) => {
        expect(() => ScheduleQuerySchema.parse(invalidTerm)).toThrow()
      })
    })

    it('学期パラメータは省略可能', () => {
      const result = ScheduleQuerySchema.parse({})
      expect(result.term).toBeUndefined()
    })
  })

  describe('型推論の動作確認', () => {
    it('StudentsQueryInput型が正しく推論される', () => {
      const query = StudentsQuerySchema.parse({
        page: '2',
        limit: '15',
        search: '田中',
      })

      // TypeScriptの型チェックを確認
      expect(typeof query.page).toBe('number')
      expect(typeof query.limit).toBe('number')
      expect(typeof query.search).toBe('string')
    })

    it('CreateStudentInput型が正しく推論される', () => {
      const data = CreateStudentSchema.parse({
        name: '田中太郎',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        grade: 5,
      })

      expect(typeof data.name).toBe('string')
      expect(typeof data.classId).toBe('string')
      expect(typeof data.grade).toBe('number')
    })

    it('UpdateStudentInput型が正しく推論される', () => {
      const data = UpdateStudentSchema.parse({
        name: '田中次郎',
        isActive: false,
      })

      expect(typeof data.name).toBe('string')
      expect(typeof data.isActive).toBe('boolean')
      expect(data.classId).toBeUndefined()
      expect(data.grade).toBeUndefined()
    })
  })
})