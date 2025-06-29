import * as z from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスが長すぎます'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードには大文字、小文字、数字を含めてください'
    )
    .max(128, 'パスワードが長すぎます'),
})

export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスが長すぎます'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '現在のパスワードは必須です'),
    newPassword: z
      .string()
      .min(8, '新しいパスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードには大文字、小文字、数字を含めてください'
      )
      .max(128, 'パスワードが長すぎます'),
    confirmPassword: z.string().min(1, 'パスワード確認は必須です'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
