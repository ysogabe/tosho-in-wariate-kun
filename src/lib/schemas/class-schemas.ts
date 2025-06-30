import { z } from 'zod'

/**
 * クラス作成スキーマ
 */
export const CreateClassSchema = z.object({
  name: z
    .string()
    .min(1, 'クラス名は必須です')
    .max(20, 'クラス名は20文字以内で入力してください')
    .regex(
      /^[A-Za-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      'クラス名は英数字、ひらがな、カタカナ、漢字のみ使用できます'
    ),
  year: z
    .number()
    .int('学年は整数で入力してください')
    .min(5, '学年は5年以上を指定してください')
    .max(6, '学年は6年以下を指定してください'),
})

/**
 * クラス更新スキーマ
 */
export const UpdateClassSchema = z.object({
  name: z
    .string()
    .min(1, 'クラス名は必須です')
    .max(20, 'クラス名は20文字以内で入力してください')
    .regex(
      /^[A-Za-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      'クラス名は英数字、ひらがな、カタカナ、漢字のみ使用できます'
    )
    .optional(),
  year: z
    .number()
    .int('学年は整数で入力してください')
    .min(5, '学年は5年以上を指定してください')
    .max(6, '学年は6年以下を指定してください')
    .optional(),
})

/**
 * クラス検索・一覧取得クエリスキーマ
 */
export const ClassesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('ページ番号は整数で入力してください')
    .min(1, 'ページ番号は1以上を指定してください')
    .default(1),
  limit: z.coerce
    .number()
    .int('件数は整数で入力してください')
    .min(1, '件数は1以上を指定してください')
    .max(100, '件数は100以下を指定してください')
    .default(20),
  search: z
    .string()
    .max(100, '検索文字列は100文字以内で入力してください')
    .optional(),
  year: z.coerce
    .number()
    .int('学年は整数で入力してください')
    .min(5, '学年は5年以上を指定してください')
    .max(6, '学年は6年以下を指定してください')
    .optional(),
})

/**
 * クラスIDパラメータスキーマ
 */
export const ClassIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'クラスIDは必須です')
    .regex(/^[a-zA-Z0-9_-]+$/, '無効なクラスIDです'),
})

/**
 * レスポンス用のクラス型定義
 */
export const ClassResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  studentCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * TypeScript型定義の生成
 */
export type CreateClassRequest = z.infer<typeof CreateClassSchema>
export type UpdateClassRequest = z.infer<typeof UpdateClassSchema>
export type ClassesQuery = z.infer<typeof ClassesQuerySchema>
export type ClassIdParam = z.infer<typeof ClassIdParamSchema>
export type ClassResponse = z.infer<typeof ClassResponseSchema>
