/**
 * 図書委員管理API用のZodスキーマ定義
 */

import { z } from 'zod'

/**
 * 図書委員レスポンス型
 */
export interface StudentResponse {
  id: string
  name: string
  classId: string
  grade: number
  isActive: boolean
  assignmentCount: number
  createdAt: string
  updatedAt: string
  class?: {
    id: string
    name: string
    year: number
  }
}

/**
 * 図書委員一覧取得クエリパラメータスキーマ
 */
export const StudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
  grade: z.coerce.number().int().min(5).max(6).optional(),
  isActive: z.coerce.boolean().optional(),
})

/**
 * 図書委員作成データスキーマ
 */
export const CreateStudentSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
  classId: z.string().uuid('有効なクラスIDを指定してください'),
  grade: z.number().int().min(5).max(6, '学年は5年または6年を指定してください'),
  isActive: z.boolean(),
})

/**
 * 図書委員更新データスキーマ
 */
export const UpdateStudentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  classId: z.string().uuid().optional(),
  grade: z.number().int().min(5).max(6).optional(),
  isActive: z.boolean().optional(),
})

/**
 * 図書委員IDパラメータスキーマ
 */
export const StudentIdParamSchema = z.object({
  id: z.string().uuid('有効な図書委員IDを指定してください'),
})

/**
 * スケジュール取得クエリパラメータスキーマ
 */
export const ScheduleQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
})

/**
 * 型エクスポート
 */
export type StudentsQueryInput = z.infer<typeof StudentsQuerySchema>
export type CreateStudentRequest = z.infer<typeof CreateStudentSchema>
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>
export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>
export type StudentIdParamInput = z.infer<typeof StudentIdParamSchema>
export type ScheduleQueryInput = z.infer<typeof ScheduleQuerySchema>
