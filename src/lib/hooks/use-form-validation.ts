/**
 * フォームバリデーション用React Hook
 * Form validation React Hook with Zod integration
 */

import { useState, useCallback } from 'react'
import { z } from 'zod'

// バリデーションエラーの型定義
export type ValidationErrors = Record<string, string>

// フックの設定オプション
export interface UseFormValidationOptions<T extends z.ZodSchema> {
  schema: T
  onSubmit: (data: z.infer<T>) => Promise<void> | void
  onError?: (error: z.ZodError) => void
}

// フックの戻り値の型定義
export interface UseFormValidationReturn {
  errors: ValidationErrors
  isSubmitting: boolean
  validate: (data: unknown) => boolean
  handleSubmit: (data: unknown) => Promise<void>
  clearErrors: () => void
  clearError: (field: string) => void
}

/**
 * フォームバリデーション用React Hook
 *
 * @param options - フックの設定オプション
 * @returns バリデーション機能を提供するオブジェクト
 */
export function useFormValidation<T extends z.ZodSchema>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn {
  const { schema, onSubmit, onError } = options

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ZodErrorからフラットなエラーオブジェクトを作成
  const flattenZodError = useCallback(
    (zodError: z.ZodError): ValidationErrors => {
      const flatErrors: ValidationErrors = {}

      zodError.errors.forEach((error) => {
        const path = error.path.join('.')
        flatErrors[path] = error.message
      })

      return flatErrors
    },
    []
  )

  // バリデーション関数
  const validate = useCallback(
    (data: unknown): boolean => {
      try {
        schema.parse(data)
        setErrors({})
        return true
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors = flattenZodError(error)
          setErrors(validationErrors)

          if (onError) {
            onError(error)
          }
        }
        return false
      }
    },
    [schema, flattenZodError, onError]
  )

  // フォーム送信処理
  const handleSubmit = useCallback(
    async (data: unknown): Promise<void> => {
      if (!validate(data)) {
        return
      }

      setIsSubmitting(true)

      try {
        // バリデーション済みのデータとしてonSubmitを呼び出し
        const validatedData = schema.parse(data)
        await onSubmit(validatedData)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validate, schema, onSubmit]
  )

  // 全エラーのクリア
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // 特定フィールドのエラークリア
  const clearError = useCallback((field: string) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  return {
    errors,
    isSubmitting,
    validate,
    handleSubmit,
    clearErrors,
    clearError,
  }
}
