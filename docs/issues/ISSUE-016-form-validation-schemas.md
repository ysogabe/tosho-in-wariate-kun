# Issue #016: フォームバリデーションスキーマの実装

**Priority**: Medium  
**Difficulty**: Beginner  
**Estimated Time**: 3-4 hours  
**Type**: Frontend  
**Labels**: frontend, validation, forms, zod

## Description

アプリケーション全体で使用するフォームバリデーションスキーマをZodライブラリを使用して実装します。一貫性のあるバリデーションルールと適切な日本語エラーメッセージを提供します。

## Background

フロントエンド設計書で定義されたフォーム要件に基づき、クラス登録、図書委員登録、スケジュール設定など、各種フォームで使用する統一されたバリデーションスキーマを作成します。

## Acceptance Criteria

- [ ] クラス管理用バリデーションスキーマが作成されている
- [ ] 図書委員管理用バリデーションスキーマが作成されている
- [ ] 図書室管理用バリデーションスキーマが作成されている
- [ ] スケジュール設定用バリデーションスキーマが作成されている
- [ ] 共通バリデーションヘルパーが実装されている
- [ ] 日本語エラーメッセージが適切に設定されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Getting Started

1. Issue #010（ログインフォーム）が完了していることを確認
2. Zodライブラリの基本的な使用方法を確認
3. 日本語バリデーションメッセージの設計
4. 再利用可能なスキーマ設計の理解

### Main Implementation

#### 1. Common Validation Helpers

##### src/lib/schemas/common.ts

```typescript
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
```

#### 2. Class Management Schemas

##### src/lib/schemas/class-schemas.ts

```typescript
import { z } from 'zod'
import { gradeSchema, classNameSchema } from './common'

// クラス作成スキーマ
export const createClassSchema = z.object({
  name: classNameSchema,
  year: gradeSchema,
})

// クラス更新スキーマ
export const updateClassSchema = z.object({
  name: classNameSchema.optional(),
  year: gradeSchema.optional(),
})

// クラス検索スキーマ
export const classSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  year: gradeSchema.optional(),
})

// クラス一括操作スキーマ
export const bulkClassOperationSchema = z.object({
  classIds: z
    .array(z.string().uuid())
    .min(1, '少なくとも1つのクラスを選択してください'),
  operation: z.enum(['delete', 'archive'], {
    errorMap: () => ({ message: '有効な操作を選択してください' }),
  }),
  confirm: z.boolean().refine((val) => val === true, {
    message: '操作を実行するには確認が必要です',
  }),
})

// 型定義のエクスポート
export type CreateClassData = z.infer<typeof createClassSchema>
export type UpdateClassData = z.infer<typeof updateClassSchema>
export type ClassSearchParams = z.infer<typeof classSearchSchema>
export type BulkClassOperation = z.infer<typeof bulkClassOperationSchema>
```

#### 3. Student Management Schemas

##### src/lib/schemas/student-schemas.ts

```typescript
import { z } from 'zod'
import { japaneseNameSchema, gradeSchema, uuidSchema } from './common'

// 図書委員作成スキーマ
export const createStudentSchema = z.object({
  name: japaneseNameSchema,
  grade: gradeSchema,
  classId: uuidSchema,
})

// 図書委員更新スキーマ
export const updateStudentSchema = z.object({
  name: japaneseNameSchema.optional(),
  grade: gradeSchema.optional(),
  classId: uuidSchema.optional(),
  isActive: z.boolean().optional(),
})

// 図書委員検索スキーマ
export const studentSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  classId: uuidSchema.optional(),
  grade: gradeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
})

// 図書委員一括操作スキーマ
export const bulkStudentOperationSchema = z
  .object({
    studentIds: z
      .array(uuidSchema)
      .min(1, '少なくとも1人の図書委員を選択してください'),
    operation: z.enum(['activate', 'deactivate', 'delete', 'changeClass'], {
      errorMap: () => ({ message: '有効な操作を選択してください' }),
    }),
    newClassId: uuidSchema.optional(),
    confirm: z.boolean().refine((val) => val === true, {
      message: '操作を実行するには確認が必要です',
    }),
  })
  .refine(
    (data) => {
      if (data.operation === 'changeClass' && !data.newClassId) {
        return false
      }
      return true
    },
    {
      message: 'クラス変更操作には新しいクラスの選択が必要です',
      path: ['newClassId'],
    }
  )

// 図書委員インポートスキーマ
export const importStudentsSchema = z.object({
  students: z
    .array(
      z.object({
        name: japaneseNameSchema,
        grade: gradeSchema,
        className: z.string().min(1, 'クラス名は必須です'),
      })
    )
    .min(1, '少なくとも1人の図書委員データが必要です'),
  overwriteExisting: z.boolean().default(false),
})

// 型定義のエクスポート
export type CreateStudentData = z.infer<typeof createStudentSchema>
export type UpdateStudentData = z.infer<typeof updateStudentSchema>
export type StudentSearchParams = z.infer<typeof studentSearchSchema>
export type BulkStudentOperation = z.infer<typeof bulkStudentOperationSchema>
export type ImportStudentsData = z.infer<typeof importStudentsSchema>
```

#### 4. Room Management Schemas

##### src/lib/schemas/room-schemas.ts

```typescript
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
```

#### 5. Schedule Management Schemas

##### src/lib/schemas/schedule-schemas.ts

```typescript
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
```

#### 6. Form Hook Utilities

##### src/lib/hooks/use-form-validation.ts

```typescript
'use client'

import { useState } from 'react'
import { z } from 'zod'

interface UseFormValidationOptions<T extends z.ZodType> {
  schema: T
  onSubmit: (data: z.infer<T>) => Promise<void> | void
  onError?: (error: z.ZodError) => void
}

export function useFormValidation<T extends z.ZodType>({
  schema,
  onSubmit,
  onError,
}: UseFormValidationOptions<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (data: unknown): data is z.infer<T> => {
    try {
      schema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setErrors(fieldErrors)
        onError?.(error)
      }
      return false
    }
  }

  const handleSubmit = async (data: unknown) => {
    if (!validate(data)) return

    setIsSubmitting(true)
    try {
      await onSubmit(data as z.infer<T>)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearErrors = () => setErrors({})
  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  return {
    errors,
    isSubmitting,
    validate,
    handleSubmit,
    clearErrors,
    clearError,
  }
}
```

#### 7. Validation Error Display Component

##### src/components/forms/validation-error.tsx

```typescript
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ValidationErrorProps {
  errors: Record<string, string>
  className?: string
}

export function ValidationError({ errors, className }: ValidationErrorProps) {
  const errorMessages = Object.values(errors)

  if (errorMessages.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {errorMessages.length === 1 ? (
          errorMessages[0]
        ) : (
          <ul className="list-disc list-inside space-y-1">
            {errorMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  )
}
```

### Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)

## Implementation Results

### Work Completed

- [ ] 共通バリデーションヘルパー実装
- [ ] クラス管理スキーマ実装
- [ ] 図書委員管理スキーマ実装
- [ ] 図書室管理スキーマ実装
- [ ] スケジュール管理スキーマ実装
- [ ] フォームバリデーションフック実装
- [ ] バリデーションエラー表示コンポーネント実装
- [ ] TypeScript型定義作成

### Challenges Faced

<!-- 実装中に直面した課題を記録 -->

### Testing Results

- [ ] バリデーションルール確認
- [ ] エラーメッセージ確認
- [ ] 型安全性確認
- [ ] 再利用性確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #017: スケジュール表示コンポーネント作成
2. Issue #018: スケジュール管理ページ実装
3. Issue #019: クラス管理ページ実装
