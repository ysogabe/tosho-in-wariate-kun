/**
 * 共通バリデーションヘルパー
 * 再利用可能なZodスキーマとエラーメッセージ
 */

import { z } from 'zod'

// 共通エラーメッセージ
export const commonMessages = {
  required: (field: string) => `${field}は必須です`,
  invalid: (field: string) => `有効な${field}を入力してください`,
  tooShort: (field: string, min: number) =>
    `${field}は${min}文字以上で入力してください`,
  tooLong: (field: string, max: number) =>
    `${field}は${max}文字以内で入力してください`,
  invalidFormat: (field: string) => `${field}の形式が正しくありません`,
}

// 日本語名バリデーション
export const japaneseNameSchema = z
  .string()
  .min(1, commonMessages.required('名前'))
  .max(50, commonMessages.tooLong('名前', 50))
  .regex(/^[ぁ-んァ-ヶー一-龯\s]+$/, '名前は日本語で入力してください')

// メールアドレスバリデーション
export const emailSchema = z
  .string()
  .min(1, commonMessages.required('メールアドレス'))
  .email(commonMessages.invalid('メールアドレス'))
  .max(255, commonMessages.tooLong('メールアドレス', 255))

// パスワードバリデーション
export const passwordSchema = z
  .string()
  .min(1, commonMessages.required('パスワード'))
  .min(6, commonMessages.tooShort('パスワード', 6))
  .max(128, commonMessages.tooLong('パスワード', 128))

// UUIDバリデーション
export const uuidSchema = z.string().uuid('無効なIDです')

// 学年バリデーション
export const gradeSchema = z
  .number()
  .int('学年は整数で入力してください')
  .min(5, '学年は5年または6年を選択してください')
  .max(6, '学年は5年または6年を選択してください')

// クラス名バリデーション
export const classNameSchema = z
  .string()
  .min(1, commonMessages.required('クラス名'))
  .max(20, commonMessages.tooLong('クラス名', 20))
  .regex(/^[A-Z]+$/, 'クラス名は大文字のアルファベットで入力してください')

// 曜日バリデーション
export const dayOfWeekSchema = z
  .number()
  .int('曜日は整数で入力してください')
  .min(1, '曜日は1（月曜日）から5（金曜日）の範囲で入力してください')
  .max(5, '曜日は1（月曜日）から5（金曜日）の範囲で入力してください')

// 期間バリデーション
export const termSchema = z.enum(['FIRST_TERM', 'SECOND_TERM'], {
  errorMap: () => ({ message: '期間は前期または後期を選択してください' }),
})

// 容量バリデーション
export const capacitySchema = z
  .number()
  .int('定員は整数で入力してください')
  .min(1, '定員は1以上で入力してください')
  .max(10, '定員は10以下で入力してください')
