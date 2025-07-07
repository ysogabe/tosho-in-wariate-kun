/**
 * 図書室管理用バリデーションスキーマ
 * Room management validation schemas
 */

import { z } from 'zod'
import { capacitySchema } from './common'

// 図書室作成スキーマ
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, '図書室名は必須です')
    .max(50, '図書室名は50文字以内で入力してください'),
  capacity: capacitySchema,
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .optional(),
  isActive: z.boolean().default(true),
})

// 図書室更新スキーマ
export const updateRoomSchema = z.object({
  name: z
    .string()
    .min(1, '図書室名は必須です')
    .max(50, '図書室名は50文字以内で入力してください')
    .optional(),
  capacity: capacitySchema.optional(),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .optional(),
  isActive: z.boolean().optional(),
})

// 図書室検索スキーマ
export const roomSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  minCapacity: z.coerce.number().int().min(1).optional(),
  maxCapacity: z.coerce.number().int().min(1).optional(),
})

// 型定義のエクスポート
export type CreateRoomData = z.infer<typeof createRoomSchema>
export type UpdateRoomData = z.infer<typeof updateRoomSchema>
export type RoomSearchParams = z.infer<typeof roomSearchSchema>
