/**
 * Layout components index exports tests
 * TDD implementation following t_wada methodology
 */

import * as LayoutComponents from '../index'

describe('Layout Components Index', () => {
  describe('Exports', () => {
    it('Header componentがexportされている', () => {
      expect(LayoutComponents.Header).toBeDefined()
      expect(typeof LayoutComponents.Header).toBe('object') // React.memo component
    })

    it('PageLayout componentがexportされている', () => {
      expect(LayoutComponents.PageLayout).toBeDefined()
      expect(typeof LayoutComponents.PageLayout).toBe('function')
    })

    it('MainLayout componentがexportされている', () => {
      expect(LayoutComponents.MainLayout).toBeDefined()
      expect(typeof LayoutComponents.MainLayout).toBe('function')
    })

    it('すべての期待されるcomponentsがexportされている', () => {
      const exportedKeys = Object.keys(LayoutComponents)
      const expectedExports = ['Header', 'PageLayout', 'MainLayout']

      expectedExports.forEach((exportName) => {
        expect(exportedKeys).toContain(exportName)
      })
    })

    it('意図しないexportsが含まれていない', () => {
      const exportedKeys = Object.keys(LayoutComponents)
      const allowedExports = ['Header', 'PageLayout', 'MainLayout']

      exportedKeys.forEach((exportName) => {
        expect(allowedExports).toContain(exportName)
      })
    })
  })

  describe('Component Types', () => {
    it('Headerがmemoized componentである', () => {
      // React.memoでラップされたコンポーネントはobject型になる
      expect(typeof LayoutComponents.Header).toBe('object')
      expect(LayoutComponents.Header).toBeTruthy()
    })

    it('PageLayoutが関数コンポーネントである', () => {
      expect(typeof LayoutComponents.PageLayout).toBe('function')
    })

    it('MainLayoutが関数コンポーネントである', () => {
      expect(typeof LayoutComponents.MainLayout).toBe('function')
    })
  })
})
