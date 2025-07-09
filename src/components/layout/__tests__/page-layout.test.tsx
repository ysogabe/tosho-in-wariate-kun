/**
 * PageLayout component tests
 * TDD implementation following t_wada methodology
 */

import { render, screen } from '@testing-library/react'
import { PageLayout } from '../page-layout'

describe('PageLayout Component', () => {
  const defaultProps = {
    title: 'テストページ',
    children: <div>テストコンテンツ</div>,
  }

  describe('Basic Rendering', () => {
    it('基本的なレイアウトが正常にレンダリングされる', () => {
      render(<PageLayout {...defaultProps} />)

      // タイトルとコンテンツの存在確認
      expect(screen.getByText('テストページ')).toBeInTheDocument()
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument()
    })

    it('デフォルトでh1要素がレンダリングされる', () => {
      render(<PageLayout {...defaultProps} />)

      const heading = screen.getByText('テストページ')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
    })

    it('mainタグでコンテンツがラップされる', () => {
      render(<PageLayout {...defaultProps} />)

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toContainElement(screen.getByText('テストコンテンツ'))
    })
  })

  describe('Title Prop', () => {
    it('titleプロパティが正しく表示される', () => {
      render(
        <PageLayout title="カスタムタイトル">
          <div>content</div>
        </PageLayout>
      )

      expect(screen.getByText('カスタムタイトル')).toBeInTheDocument()
    })

    it('空のtitleでもエラーが発生しない', () => {
      render(
        <PageLayout title="">
          <div>content</div>
        </PageLayout>
      )

      const headings = screen.getAllByRole('heading', { level: 1 })
      const pageHeading = headings.find((h) => h.textContent === '')
      expect(pageHeading).toBeInTheDocument()
      expect(pageHeading).toHaveTextContent('')
    })
  })

  describe('Description Prop', () => {
    it('descriptionが提供された場合に表示される', () => {
      render(
        <PageLayout
          {...defaultProps}
          description="これはテスト用の説明文です"
        />
      )

      expect(screen.getByText('これはテスト用の説明文です')).toBeInTheDocument()
    })

    it('descriptionが未提供の場合は表示されない', () => {
      render(<PageLayout {...defaultProps} />)

      // description用のp要素が存在しないことを確認
      const paragraphs = screen.queryAllByText(/説明/)
      expect(paragraphs).toHaveLength(0)
    })

    it('空のdescriptionの場合は表示されない', () => {
      render(<PageLayout {...defaultProps} description="" />)

      // muted-foregroundクラスを持つp要素が存在しないことを確認
      const container = screen.getByText('テストページ').closest('div')
      const descriptions = container?.querySelectorAll(
        'p.text-muted-foreground'
      )
      expect(descriptions).toHaveLength(0)
    })
  })

  describe('Actions Prop', () => {
    it('actionsが提供された場合に表示される', () => {
      const actions = (
        <div>
          <button>アクション1</button>
          <button>アクション2</button>
        </div>
      )

      render(<PageLayout {...defaultProps} actions={actions} />)

      expect(screen.getByText('アクション1')).toBeInTheDocument()
      expect(screen.getByText('アクション2')).toBeInTheDocument()
    })

    it('actionsが未提供の場合は表示されない', () => {
      render(<PageLayout {...defaultProps} />)

      // アクション用のdiv要素が存在しないことを確認
      expect(screen.queryByText('アクション')).not.toBeInTheDocument()
    })
  })

  describe('Heading Level Configuration', () => {
    it('headingLevel="h2"でh2要素がレンダリングされる', () => {
      render(<PageLayout {...defaultProps} headingLevel="h2" />)

      const heading = screen.getByText('テストページ')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H2')
    })

    it('headingLevel="h3"でh3要素がレンダリングされる', () => {
      render(<PageLayout {...defaultProps} headingLevel="h3" />)

      const heading = screen.getByText('テストページ')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H3')
    })

    it('headingLevel="h6"でh6要素がレンダリングされる', () => {
      render(<PageLayout {...defaultProps} headingLevel="h6" />)

      const heading = screen.getByText('テストページ')
      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H6')
    })

    it('見出しレベルが変更されてもCSSクラスは同じ', () => {
      const { rerender } = render(
        <PageLayout {...defaultProps} headingLevel="h1" />
      )

      const h1 = screen.getByText('テストページ')
      const h1Classes = h1.className

      rerender(<PageLayout {...defaultProps} headingLevel="h3" />)

      const h3 = screen.getByText('テストページ')
      expect(h3.className).toBe(h1Classes)
    })
  })

  describe('ClassName Prop', () => {
    it('カスタムclassNameが適用される', () => {
      render(<PageLayout {...defaultProps} className="custom-layout-class" />)

      // メインコンテンツ要素にカスタムクラスが適用されることを確認
      const container = screen.getByText('テストページ').closest('.space-y-6')
      expect(container).toHaveClass('custom-layout-class')
    })

    it('デフォルトクラスとカスタムクラスが併用される', () => {
      render(<PageLayout {...defaultProps} className="custom-class" />)

      const container = screen.getByText('テストページ').closest('.space-y-6')
      expect(container).toHaveClass(
        'space-y-6',
        'animate-fadeIn',
        'custom-class'
      )
    })
  })

  describe('Children Rendering', () => {
    it('複数の子要素が正しくレンダリングされる', () => {
      const children = (
        <div>
          <p>段落1</p>
          <p>段落2</p>
          <ul>
            <li>リスト項目</li>
          </ul>
        </div>
      )

      render(<PageLayout {...defaultProps}>{children}</PageLayout>)

      expect(screen.getByText('段落1')).toBeInTheDocument()
      expect(screen.getByText('段落2')).toBeInTheDocument()
      expect(screen.getByText('リスト項目')).toBeInTheDocument()
    })

    it('Reactコンポーネントの子要素が正しくレンダリングされる', () => {
      const CustomComponent = () => <div>カスタムコンポーネント</div>

      render(
        <PageLayout {...defaultProps}>
          <CustomComponent />
        </PageLayout>
      )

      expect(screen.getByText('カスタムコンポーネント')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('正しいHTML構造でレンダリングされる', () => {
      render(
        <PageLayout
          {...defaultProps}
          description="説明文"
          actions={<button>アクション</button>}
        />
      )

      // コンテナ構造の確認
      const container = screen.getByText('テストページ').closest('.space-y-6')
      expect(container).toHaveClass('space-y-6', 'animate-fadeIn')

      // ヘッダー部分の確認
      const heading = screen.getByText('テストページ')
      const description = screen.getByText('説明文')
      const action = screen.getByText('アクション')

      expect(heading).toBeInTheDocument()
      expect(heading.tagName).toBe('H1')
      expect(description).toBeInTheDocument()
      expect(action).toBeInTheDocument()

      // メイン部分の確認
      const main = screen.getByRole('main')
      expect(main).toContainElement(screen.getByText('テストコンテンツ'))
    })
  })

  describe('Responsive Design', () => {
    it('レスポンシブクラスが適用されている', () => {
      render(<PageLayout {...defaultProps} />)

      const heading = screen.getByText('テストページ')
      expect(heading).toHaveClass(
        'text-2xl',
        'sm:text-3xl',
        'font-bold',
        'tracking-tight'
      )
    })
  })
})
