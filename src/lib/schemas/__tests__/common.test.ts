/**
 * 共通バリデーションヘルパーのテスト
 * TDD implementation following t_wada methodology
 */

import {
  commonMessages,
  japaneseNameSchema,
  emailSchema,
  passwordSchema,
  uuidSchema,
  gradeSchema,
  classNameSchema,
  dayOfWeekSchema,
  termSchema,
  capacitySchema,
} from '../common'

describe('common validation schemas', () => {
  describe('commonMessages', () => {
    it('適切な日本語エラーメッセージを生成する', () => {
      expect(commonMessages.required('名前')).toBe('名前は必須です')
      expect(commonMessages.invalid('メールアドレス')).toBe(
        '有効なメールアドレスを入力してください'
      )
      expect(commonMessages.tooShort('パスワード', 8)).toBe(
        'パスワードは8文字以上で入力してください'
      )
      expect(commonMessages.tooLong('名前', 50)).toBe(
        '名前は50文字以内で入力してください'
      )
      expect(commonMessages.invalidFormat('電話番号')).toBe(
        '電話番号の形式が正しくありません'
      )
    })
  })

  describe('japaneseNameSchema', () => {
    it('有効な日本語名を受け入れる', () => {
      const validNames = [
        '田中太郎',
        '佐藤花子',
        '山田　次郎', // 全角スペース
        'やまだ　たろう',
        'ヤマダ　タロウ',
        '田中　花　子',
      ]

      validNames.forEach((name) => {
        expect(() => japaneseNameSchema.parse(name)).not.toThrow()
      })
    })

    it('無効な文字を含む名前を拒否する', () => {
      const invalidNames = [
        'John Smith', // 英語
        '田中123', // 数字
        '田中@太郎', // 記号
        'tanaka', // ローマ字
      ]

      invalidNames.forEach((name) => {
        expect(() => japaneseNameSchema.parse(name)).toThrow(
          '名前は日本語で入力してください'
        )
      })
    })

    it('空の名前を拒否する', () => {
      expect(() => japaneseNameSchema.parse('')).toThrow('名前は必須です')
    })

    it('長すぎる名前を拒否する', () => {
      const longName = 'あ'.repeat(51)
      expect(() => japaneseNameSchema.parse(longName)).toThrow(
        '名前は50文字以内で入力してください'
      )
    })
  })

  describe('emailSchema', () => {
    it('有効なメールアドレスを受け入れる', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.jp',
        'teacher@school.edu',
        'admin@library.system.jp',
      ]

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('無効なメールアドレスを拒否する', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test..test@example.com',
      ]

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow(
          '有効なメールアドレスを入力してください'
        )
      })
    })

    it('空のメールアドレスを拒否する', () => {
      expect(() => emailSchema.parse('')).toThrow('メールアドレスは必須です')
    })

    it('長すぎるメールアドレスを拒否する', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(() => emailSchema.parse(longEmail)).toThrow(
        'メールアドレスは255文字以内で入力してください'
      )
    })
  })

  describe('passwordSchema', () => {
    it('有効なパスワードを受け入れる', () => {
      const validPasswords = ['Password123', 'MySecure123', 'LibrarySystem2024']

      validPasswords.forEach((password) => {
        expect(() => passwordSchema.parse(password)).not.toThrow()
      })
    })

    it('短すぎるパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('12345')).toThrow(
        'パスワードは6文字以上で入力してください'
      )
    })

    it('長すぎるパスワードを拒否する', () => {
      const longPassword = 'a'.repeat(129)
      expect(() => passwordSchema.parse(longPassword)).toThrow(
        'パスワードは128文字以内で入力してください'
      )
    })

    it('空のパスワードを拒否する', () => {
      expect(() => passwordSchema.parse('')).toThrow('パスワードは必須です')
    })
  })

  describe('uuidSchema', () => {
    it('有効なUUIDを受け入れる', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ]

      validUuids.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).not.toThrow()
      })
    })

    it('無効なUUIDを拒否する', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        '',
      ]

      invalidUuids.forEach((uuid) => {
        expect(() => uuidSchema.parse(uuid)).toThrow('無効なIDです')
      })
    })
  })

  describe('gradeSchema', () => {
    it('有効な学年を受け入れる', () => {
      const validGrades = [5, 6]

      validGrades.forEach((grade) => {
        expect(() => gradeSchema.parse(grade)).not.toThrow()
      })
    })

    it('無効な学年を拒否する', () => {
      const invalidGrades = [1, 2, 3, 4, 7, 8, 0, -1]

      invalidGrades.forEach((grade) => {
        expect(() => gradeSchema.parse(grade)).toThrow(
          '学年は5年または6年を選択してください'
        )
      })
    })

    it('整数以外を拒否する', () => {
      expect(() => gradeSchema.parse(5.5)).toThrow(
        '学年は整数で入力してください'
      )
    })
  })

  describe('classNameSchema', () => {
    it('有効なクラス名を受け入れる', () => {
      const validClassNames = ['A', 'B', 'C', 'AB', 'ABC']

      validClassNames.forEach((className) => {
        expect(() => classNameSchema.parse(className)).not.toThrow()
      })
    })

    it('小文字のクラス名を拒否する', () => {
      const invalidClassNames = ['a', 'b', 'ab', 'Aa']

      invalidClassNames.forEach((className) => {
        expect(() => classNameSchema.parse(className)).toThrow(
          'クラス名は大文字のアルファベットで入力してください'
        )
      })
    })

    it('数字や記号を含むクラス名を拒否する', () => {
      const invalidClassNames = ['A1', 'A-B', 'A B', 'A組']

      invalidClassNames.forEach((className) => {
        expect(() => classNameSchema.parse(className)).toThrow(
          'クラス名は大文字のアルファベットで入力してください'
        )
      })
    })

    it('空のクラス名を拒否する', () => {
      expect(() => classNameSchema.parse('')).toThrow('クラス名は必須です')
    })

    it('長すぎるクラス名を拒否する', () => {
      const longClassName = 'A'.repeat(21)
      expect(() => classNameSchema.parse(longClassName)).toThrow(
        'クラス名は20文字以内で入力してください'
      )
    })
  })

  describe('dayOfWeekSchema', () => {
    it('有効な曜日を受け入れる', () => {
      const validDays = [1, 2, 3, 4, 5] // 月曜日から金曜日

      validDays.forEach((day) => {
        expect(() => dayOfWeekSchema.parse(day)).not.toThrow()
      })
    })

    it('無効な曜日を拒否する', () => {
      const invalidDays = [0, 6, 7, -1, 10]

      invalidDays.forEach((day) => {
        expect(() => dayOfWeekSchema.parse(day)).toThrow(
          '曜日は1（月曜日）から5（金曜日）の範囲で入力してください'
        )
      })
    })

    it('整数以外を拒否する', () => {
      expect(() => dayOfWeekSchema.parse(1.5)).toThrow(
        '曜日は整数で入力してください'
      )
    })
  })

  describe('termSchema', () => {
    it('有効な期間を受け入れる', () => {
      const validTerms = ['FIRST_TERM', 'SECOND_TERM']

      validTerms.forEach((term) => {
        expect(() => termSchema.parse(term)).not.toThrow()
      })
    })

    it('無効な期間を拒否する', () => {
      const invalidTerms = ['THIRD_TERM', 'first_term', 'INVALID', '']

      invalidTerms.forEach((term) => {
        expect(() => termSchema.parse(term)).toThrow(
          '期間は前期または後期を選択してください'
        )
      })
    })
  })

  describe('capacitySchema', () => {
    it('有効な定員を受け入れる', () => {
      const validCapacities = [1, 5, 10, 50, 100]

      validCapacities.forEach((capacity) => {
        expect(() => capacitySchema.parse(capacity)).not.toThrow()
      })
    })

    it('無効な定員を拒否する', () => {
      const invalidCapacities = [0, -1, 101, 500]

      invalidCapacities.forEach((capacity) => {
        expect(() => capacitySchema.parse(capacity)).toThrow()
      })
    })

    it('0以下の定員を拒否する', () => {
      expect(() => capacitySchema.parse(0)).toThrow(
        '収容人数は1以上で入力してください'
      )
    })

    it('100より大きい定員を拒否する', () => {
      expect(() => capacitySchema.parse(101)).toThrow(
        '収容人数は100以下で入力してください'
      )
    })

    it('整数以外を拒否する', () => {
      expect(() => capacitySchema.parse(5.5)).toThrow(
        '収容人数は整数で入力してください'
      )
    })
  })
})
