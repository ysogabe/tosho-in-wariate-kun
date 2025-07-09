/**
 * ValidationErrorコンポーネントのテスト
 * t-wada提唱のTDDメソッドに従った包括的テスト
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ValidationError } from '../validation-error'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}))

describe('ValidationError', () => {
  describe('基本的なレンダリング', () => {
    it('エラーがない場合は何も表示されない', () => {
      const { container } = render(<ValidationError errors={{}} />)
      expect(container.firstChild).toBeNull()
    })

    it('エラーがundefinedの場合は何も表示されない', () => {
      const { container } = render(<ValidationError errors={undefined} />)
      expect(container.firstChild).toBeNull()
    })

    it('エラーがnullの場合は何も表示されない', () => {
      const { container } = render(<ValidationError errors={null} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('エラー表示機能', () => {
    it('単一のエラーが正しく表示される', () => {
      const errors = {
        name: '名前は必須です',
      }

      render(<ValidationError errors={errors} />)

      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
    })

    it('複数のエラーが正しく表示される', () => {
      const errors = {
        name: '名前は必須です',
        email: 'メールアドレスの形式が正しくありません',
        grade: '学年を選択してください',
      }

      render(<ValidationError errors={errors} />)

      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(
        screen.getByText('メールアドレスの形式が正しくありません')
      ).toBeInTheDocument()
      expect(screen.getByText('学年を選択してください')).toBeInTheDocument()
    })

    it('フィールド名に基づくエラー表示', () => {
      const errors = {
        password: 'パスワードは8文字以上で入力してください',
        confirmPassword: 'パスワードが一致しません',
      }

      render(<ValidationError errors={errors} />)

      expect(
        screen.getByText('パスワードは8文字以上で入力してください')
      ).toBeInTheDocument()
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })
  })

  describe('エラー形式のバリエーション', () => {
    it('配列形式のエラーが正しく表示される', () => {
      const errors = {
        name: ['名前は必須です', '名前は2文字以上で入力してください'],
        email: ['メールアドレスは必須です'],
      }

      render(<ValidationError errors={errors} />)

      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(
        screen.getByText('名前は2文字以上で入力してください')
      ).toBeInTheDocument()
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
    })

    it('文字列と配列が混在するエラーが正しく表示される', () => {
      const errors = {
        name: '名前は必須です',
        password: [
          'パスワードは必須です',
          'パスワードは8文字以上で入力してください',
        ],
        grade: '学年を選択してください',
      }

      render(<ValidationError errors={errors} />)

      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(screen.getByText('パスワードは必須です')).toBeInTheDocument()
      expect(
        screen.getByText('パスワードは8文字以上で入力してください')
      ).toBeInTheDocument()
      expect(screen.getByText('学年を選択してください')).toBeInTheDocument()
    })

    it('空の配列は表示されない', () => {
      const errors = {
        name: '名前は必須です',
        email: [],
        grade: '学年を選択してください',
      }

      render(<ValidationError errors={errors} />)

      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(screen.getByText('学年を選択してください')).toBeInTheDocument()
      // email エラーは空配列なので表示されない
      expect(screen.queryByText('メールアドレス')).not.toBeInTheDocument()
    })
  })

  describe('フロントエンドテイストのスタイル', () => {
    it('Comic Sans MSフォントが適用されている', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} />)

      const errorContainer = screen.getByText('エラーメッセージ').closest('div')
      expect(errorContainer).toHaveStyle({
        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
      })
    })

    it('パステルカラーが適用されている', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} />)

      const errorContainer = screen.getByText('エラーメッセージ').closest('div')
      expect(errorContainer).toHaveStyle({
        backgroundColor: 'hsl(0, 100%, 95%)',
        borderColor: 'hsl(0, 70%, 70%)',
      })
    })

    it('絵文字が適切に表示されている', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} />)

      // アイコンと絵文字の確認
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
      expect(screen.getByText('❌')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('エラーメッセージが適切にaria-live属性を持っている', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} />)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveAttribute('aria-live', 'polite')
    })

    it('エラーメッセージがリスト形式で構造化されている', () => {
      const errors = {
        name: '名前は必須です',
        email: 'メールアドレスが必要です',
      }

      render(<ValidationError errors={errors} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()

      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(2)
    })

    it('適切なARIA属性が設定されている', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} />)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveAttribute('aria-describedby')
    })
  })

  describe('レスポンシブ対応', () => {
    it('小画面でも適切に表示される', () => {
      const errors = {
        name: 'とても長いエラーメッセージが適切に表示されることを確認します',
        email: 'メールアドレスエラー',
      }

      render(<ValidationError errors={errors} />)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveClass('space-y-1')
    })
  })

  describe('エラーハンドリング', () => {
    it('無効なエラーオブジェクトでもクラッシュしない', () => {
      const invalidErrors = {
        field1: '',
        field2: '',
        field3: '',
        field4: 'エラー',
        field5: 'エラー',
      } as Record<string, string | string[]>

      expect(() => {
        render(<ValidationError errors={invalidErrors} />)
      }).not.toThrow()
    })

    it('循環参照があるオブジェクトでもクラッシュしない', () => {
      const circularRef: any = { name: 'エラー' }
      circularRef.self = circularRef

      expect(() => {
        render(<ValidationError errors={circularRef} />)
      }).not.toThrow()
    })
  })

  describe('パフォーマンス', () => {
    it('大量のエラーでも正常にレンダリングされる', () => {
      const manyErrors = Array.from({ length: 50 }, (_, i) => [
        `field${i}`,
        `エラー${i}`,
      ]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

      const startTime = performance.now()
      render(<ValidationError errors={manyErrors} />)
      const endTime = performance.now()

      // レンダリング時間が合理的な範囲内であることを確認
      expect(endTime - startTime).toBeLessThan(100) // 100ms以内
    })
  })

  describe('カスタムクラス名', () => {
    it('カスタムクラス名が正しく適用される', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} className="custom-error-class" />)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveClass('custom-error-class')
    })

    it('デフォルトクラスとカスタムクラスが両方適用される', () => {
      const errors = { name: 'エラーメッセージ' }

      render(<ValidationError errors={errors} className="custom-class" />)

      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toHaveClass('custom-class')
      // デフォルトスタイルも確認
      expect(errorContainer).toHaveClass('rounded-lg')
    })
  })
})
