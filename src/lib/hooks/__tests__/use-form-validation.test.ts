/**
 * フォームバリデーションフックのテスト
 * TDD implementation following t_wada methodology
 */

import { renderHook, act } from '@testing-library/react'
import { z } from 'zod'
import { useFormValidation } from '../use-form-validation'

// テスト用のスキーマ
const testSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  age: z
    .number()
    .int('年齢は整数で入力してください')
    .min(0, '年齢は0以上で入力してください'),
})

// モック関数
const mockOnSubmit = jest.fn()
const mockOnError = jest.fn()

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('初期状態', () => {
    it('初期値が正しく設定される', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      expect(result.current.errors).toEqual({})
      expect(result.current.isSubmitting).toBe(false)
      expect(typeof result.current.validate).toBe('function')
      expect(typeof result.current.handleSubmit).toBe('function')
      expect(typeof result.current.clearErrors).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
    })
  })

  describe('validate関数', () => {
    it('有効なデータで正常にバリデーションを通る', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      const validData = {
        name: '田中太郎',
        email: 'test@example.com',
        age: 25,
      }

      let isValid: boolean
      act(() => {
        isValid = result.current.validate(validData)
      })

      expect(isValid!).toBe(true)
      expect(result.current.errors).toEqual({})
    })

    it('無効なデータでバリデーションエラーが設定される', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
          onError: mockOnError,
        })
      )

      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -1,
      }

      let isValid: boolean
      act(() => {
        isValid = result.current.validate(invalidData)
      })

      expect(isValid!).toBe(false)
      expect(result.current.errors).toEqual({
        name: '名前は必須です',
        email: '有効なメールアドレスを入力してください',
        age: '年齢は0以上で入力してください',
      })
      expect(mockOnError).toHaveBeenCalledTimes(1)
      expect(mockOnError).toHaveBeenCalledWith(expect.any(z.ZodError))
    })

    it('部分的に無効なデータで対応するエラーが設定される', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      const partialInvalidData = {
        name: '田中太郎',
        email: 'invalid-email',
        age: 25,
      }

      let isValid: boolean
      act(() => {
        isValid = result.current.validate(partialInvalidData)
      })

      expect(isValid!).toBe(false)
      expect(result.current.errors).toEqual({
        email: '有効なメールアドレスを入力してください',
      })
    })

    it('ネストしたフィールドエラーが正しく処理される', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1, 'プロフィール名は必須です'),
          }),
        }),
      })

      const { result } = renderHook(() =>
        useFormValidation({
          schema: nestedSchema,
          onSubmit: mockOnSubmit,
        })
      )

      const invalidNestedData = {
        user: {
          profile: {
            name: '',
          },
        },
      }

      let isValid: boolean
      act(() => {
        isValid = result.current.validate(invalidNestedData)
      })

      expect(isValid!).toBe(false)
      expect(result.current.errors).toEqual({
        'user.profile.name': 'プロフィール名は必須です',
      })
    })
  })

  describe('handleSubmit関数', () => {
    it('有効なデータでonSubmitが呼ばれる', async () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      const validData = {
        name: '田中太郎',
        email: 'test@example.com',
        age: 25,
      }

      await act(async () => {
        await result.current.handleSubmit(validData)
      })

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      expect(mockOnSubmit).toHaveBeenCalledWith(validData)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('無効なデータでonSubmitが呼ばれない', async () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      const invalidData = {
        name: '',
        email: 'invalid',
        age: -1,
      }

      await act(async () => {
        await result.current.handleSubmit(invalidData)
      })

      expect(mockOnSubmit).not.toHaveBeenCalled()
      expect(result.current.isSubmitting).toBe(false)
    })

    it('submit中にisSubmittingがtrueになる', async () => {
      let resolveSubmit: (value?: any) => void
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve
      })

      const slowOnSubmit = jest.fn(() => submitPromise)

      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: slowOnSubmit,
        })
      )

      const validData = {
        name: '田中太郎',
        email: 'test@example.com',
        age: 25,
      }

      act(() => {
        result.current.handleSubmit(validData)
      })

      expect(result.current.isSubmitting).toBe(true)

      await act(async () => {
        resolveSubmit!()
        await submitPromise
      })

      expect(result.current.isSubmitting).toBe(false)
    })

    it('onSubmitでエラーが発生してもisSubmittingがfalseになる', async () => {
      const errorOnSubmit = jest
        .fn()
        .mockRejectedValue(new Error('Submit error'))

      // console.errorをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: errorOnSubmit,
        })
      )

      const validData = {
        name: '田中太郎',
        email: 'test@example.com',
        age: 25,
      }

      await act(async () => {
        await result.current.handleSubmit(validData)
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Form submission error:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('clearErrors関数', () => {
    it('すべてのエラーがクリアされる', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      // まずエラーを設定
      act(() => {
        result.current.validate({
          name: '',
          email: 'invalid',
          age: -1,
        })
      })

      expect(Object.keys(result.current.errors)).toHaveLength(3)

      // エラーをクリア
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors).toEqual({})
    })
  })

  describe('clearError関数', () => {
    it('指定したフィールドのエラーがクリアされる', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      // まずエラーを設定
      act(() => {
        result.current.validate({
          name: '',
          email: 'invalid',
          age: -1,
        })
      })

      expect(result.current.errors.name).toBe('名前は必須です')
      expect(result.current.errors.email).toBe(
        '有効なメールアドレスを入力してください'
      )

      // nameフィールドのエラーをクリア
      act(() => {
        result.current.clearError('name')
      })

      expect(result.current.errors.name).toBeUndefined()
      expect(result.current.errors.email).toBe(
        '有効なメールアドレスを入力してください'
      )
      expect(result.current.errors.age).toBe('年齢は0以上で入力してください')
    })

    it('存在しないフィールドをクリアしてもエラーにならない', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: mockOnSubmit,
        })
      )

      act(() => {
        result.current.clearError('nonexistent')
      })

      expect(result.current.errors).toEqual({})
    })
  })

  describe('型安全性の確認', () => {
    it('スキーマの型推論が正しく機能する', async () => {
      const { result } = renderHook(() =>
        useFormValidation({
          schema: testSchema,
          onSubmit: (data: z.infer<typeof testSchema>) => {
            // TypeScript型チェック: dataはtestSchemaの型
            expect(typeof data.name).toBe('string')
            expect(typeof data.email).toBe('string')
            expect(typeof data.age).toBe('number')
            return Promise.resolve()
          },
        })
      )

      const validData = {
        name: '田中太郎',
        email: 'test@example.com',
        age: 25,
      }

      await act(async () => {
        await result.current.handleSubmit(validData)
      })
    })
  })
})
