/**
 * スケジュール管理用バリデーションスキーマ
 * Schedule management validation schemas
 */

import { z } from 'zod'
import { termSchema, dayOfWeekSchema, uuidSchema } from './common'

// スケジュール生成スキーマ
export const generateScheduleSchema = z.object({
  term: termSchema,
  forceRegenerate: z.boolean().default(false),
  constraints: z
    .object({
      maxAssignmentsPerStudent: z.number().int().min(1).max(5).default(2),
      maxStudentsPerSlot: z.number().int().min(1).max(10).default(4),
      avoidSameClassSameDay: z.boolean().default(true),
      considerPreviousTerm: z.boolean().default(true),
    })
    .optional(),
})

// 個別割り当て作成スキーマ
export const createAssignmentSchema = z.object({
  studentId: uuidSchema,
  roomId: uuidSchema,
  dayOfWeek: dayOfWeekSchema,
  term: termSchema,
})

// 個別割り当て更新スキーマ
export const updateAssignmentSchema = z.object({
  studentId: uuidSchema.optional(),
  roomId: uuidSchema.optional(),
  dayOfWeek: dayOfWeekSchema.optional(),
  term: termSchema.optional(),
})

// スケジュール検索スキーマ
export const scheduleSearchSchema = z.object({
  term: termSchema.optional(),
  format: z.enum(['grid', 'list', 'calendar']).default('grid'),
  includeStudents: z.coerce.boolean().default(true),
  includeRooms: z.coerce.boolean().default(true),
})

// スケジュールエクスポートスキーマ
export const exportScheduleSchema = z.object({
  term: termSchema.optional(),
  format: z.enum(['csv', 'json', 'pdf']).default('csv'),
  includeStatistics: z.boolean().default(true),
})

// スケジュールリセットスキーマ
export const resetScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM', 'ALL']),
  confirmDelete: z.boolean().refine((val) => val === true, {
    message: '削除を実行するには確認が必要です',
  }),
})

// 一括割り当て変更スキーマ
export const bulkAssignmentChangeSchema = z.object({
  assignmentIds: z
    .array(uuidSchema)
    .min(1, '少なくとも1つの割り当てを選択してください'),
  changes: z.object({
    roomId: uuidSchema.optional(),
    dayOfWeek: dayOfWeekSchema.optional(),
  }),
  confirm: z.boolean().refine((val) => val === true, {
    message: '操作を実行するには確認が必要です',
  }),
})

// 型定義のエクスポート
export type GenerateScheduleData = z.infer<typeof generateScheduleSchema>
export type CreateAssignmentData = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentData = z.infer<typeof updateAssignmentSchema>
export type ScheduleSearchParams = z.infer<typeof scheduleSearchSchema>
export type ExportScheduleParams = z.infer<typeof exportScheduleSchema>
export type ResetScheduleData = z.infer<typeof resetScheduleSchema>
export type BulkAssignmentChange = z.infer<typeof bulkAssignmentChangeSchema>
