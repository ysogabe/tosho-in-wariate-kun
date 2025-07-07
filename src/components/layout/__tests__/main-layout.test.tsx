/**
 * MainLayout component tests
 * TDD implementation following t_wada methodology
 */

import { render, screen } from '@testing-library/react'
import { MainLayout } from '../main-layout'

// Mock Header component
jest.mock('../header', () => ({
  Header: () => <header data-testid="header">Mocked Header</header>,
}))

describe('MainLayout Component', () => {
  describe('Basic Rendering', () => {
    it('基本的なレイアウトが正常にレンダリングされる', () => {
      render(
        <MainLayout>
          <div>テストコンテンツ</div>
        </MainLayout>
      )

      // Headerとコンテンツの存在確認
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument()
    })

    it('Headerコンポーネントが正しく配置される', () => {
      render(
        <MainLayout>
          <div>コンテンツ</div>
        </MainLayout>
      )

      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveTextContent('Mocked Header')
    })
  })

  describe('Children Rendering', () => {
    it('単一の子要素が正しくレンダリングされる', () => {
      render(
        <MainLayout>
          <div>単一のコンテンツ</div>
        </MainLayout>
      )

      expect(screen.getByText('単一のコンテンツ')).toBeInTheDocument()
    })

    it('複数の子要素が正しくレンダリングされる', () => {
      render(
        <MainLayout>
          <div>コンテンツ1</div>
          <div>コンテンツ2</div>
          <p>段落</p>
        </MainLayout>
      )

      expect(screen.getByText('コンテンツ1')).toBeInTheDocument()
      expect(screen.getByText('コンテンツ2')).toBeInTheDocument()
      expect(screen.getByText('段落')).toBeInTheDocument()
    })

    it('Reactコンポーネントの子要素が正しくレンダリングされる', () => {
      const CustomComponent = () => (
        <div>
          <h2>カスタムコンポーネント</h2>
          <p>カスタムコンテンツ</p>
        </div>
      )

      render(
        <MainLayout>
          <CustomComponent />
        </MainLayout>
      )

      expect(screen.getByText('カスタムコンポーネント')).toBeInTheDocument()
      expect(screen.getByText('カスタムコンテンツ')).toBeInTheDocument()
    })

    it('空の子要素でもエラーが発生しない', () => {
      render(<MainLayout>{null}</MainLayout>)

      // Headerは存在するが、コンテンツは空
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('文字列の子要素が正しくレンダリングされる', () => {
      render(<MainLayout>テキストコンテンツ</MainLayout>)

      expect(screen.getByText('テキストコンテンツ')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('正しいHTML構造でレンダリングされる', () => {
      render(
        <MainLayout>
          <main>メインコンテンツ</main>
        </MainLayout>
      )

      // div要素でラップされていることを確認
      const container = screen.getByTestId('header').parentElement
      expect(container?.tagName.toLowerCase()).toBe('div')

      // HeaderとmainがContainerの子要素として存在
      expect(container).toContainElement(screen.getByTestId('header'))
      expect(container).toContainElement(screen.getByText('メインコンテンツ'))
    })

    it('Headerが最初に配置される', () => {
      render(
        <MainLayout>
          <div>後のコンテンツ</div>
        </MainLayout>
      )

      const container = screen.getByTestId('header').parentElement
      const children = Array.from(container?.children || [])

      // 最初の子要素がHeaderであることを確認
      expect(children[0]).toEqual(screen.getByTestId('header'))
    })
  })

  describe('Integration', () => {
    it('PageLayoutと組み合わせて使用できる', () => {
      // PageLayoutコンポーネントのモック
      const MockPageLayout = ({ children, title }: any) => (
        <div>
          <h1>{title}</h1>
          {children}
        </div>
      )

      render(
        <MainLayout>
          <MockPageLayout title="テストページ">
            <div>ページコンテンツ</div>
          </MockPageLayout>
        </MainLayout>
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByText('テストページ')).toBeInTheDocument()
      expect(screen.getByText('ページコンテンツ')).toBeInTheDocument()
    })

    it('複雑なレイアウト構造をサポートする', () => {
      render(
        <MainLayout>
          <nav>ナビゲーション</nav>
          <main>
            <section>
              <h2>セクション1</h2>
              <p>内容1</p>
            </section>
            <section>
              <h2>セクション2</h2>
              <p>内容2</p>
            </section>
          </main>
          <footer>フッター</footer>
        </MainLayout>
      )

      // すべての要素が正しくレンダリングされることを確認
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByText('ナビゲーション')).toBeInTheDocument()
      expect(screen.getByText('セクション1')).toBeInTheDocument()
      expect(screen.getByText('内容1')).toBeInTheDocument()
      expect(screen.getByText('セクション2')).toBeInTheDocument()
      expect(screen.getByText('内容2')).toBeInTheDocument()
      expect(screen.getByText('フッター')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('再レンダリング時に正しく動作する', () => {
      const { rerender } = render(
        <MainLayout>
          <div>初期コンテンツ</div>
        </MainLayout>
      )

      expect(screen.getByText('初期コンテンツ')).toBeInTheDocument()

      rerender(
        <MainLayout>
          <div>更新されたコンテンツ</div>
        </MainLayout>
      )

      expect(screen.getByText('更新されたコンテンツ')).toBeInTheDocument()
      expect(screen.queryByText('初期コンテンツ')).not.toBeInTheDocument()
    })
  })
})
