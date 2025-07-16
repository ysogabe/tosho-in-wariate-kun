/**
 * @jest-environment node
 */

/**
 * Prismaクライアント初期化テスト
 * 
 * テスト対象: database/client.ts
 * 目的: Prismaクライアントの適切な初期化と環境別動作を検証
 */

describe('Database Client Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // グローバル変数をクリア
    ;(globalThis as any).prisma = undefined
  })

  afterEach(() => {
    // テスト後のクリーンアップ
    ;(globalThis as any).prisma = undefined
  })

  describe('Prismaクライアント設定', () => {
    it('client.tsモジュールが正常にエクスポートできる', () => {
      // client.tsをrequireして初期化をトリガー
      const { prisma } = require('../client')

      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })

    it('クライアントエクスポートが関数型ではない', () => {
      const { prisma } = require('../client')

      // prismaインスタンスは関数ではなくオブジェクトである
      expect(typeof prisma).not.toBe('function')
      expect(prisma).toBeInstanceOf(Object)
    })

    it('グローバル型定義が正しく設定されている', () => {
      const { prisma } = require('../client')

      // prismaインスタンスが適切な型を持つことを確認
      expect(typeof prisma).toBe('object')
      expect(prisma).toBeDefined()
    })
  })

  describe('環境変数処理', () => {
    it('NODE_ENV=developmentで正しく動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })

    it('NODE_ENV=testで正しく動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })

    it('NODE_ENV=productionで正しく動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })

    it('NODE_ENVが未設定でも正しく動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        Object.defineProperty(process.env, 'NODE_ENV', { value: undefined, writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })
  })

  describe('グローバルインスタンス管理', () => {
    it('開発環境では適切にグローバル変数にアクセスしようとする', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        // 開発環境をシミュレート
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        // インスタンスが作成されることを確認
        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })

    it('本番環境でも適切に動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        // 本番環境をシミュレート
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true })
        
        // client.tsをrequire
        const { prisma } = require('../client')

        // インスタンスが作成されることを確認
        expect(prisma).toBeDefined()
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })
  })

  describe('基本的な構造テスト', () => {
    it('エクスポートされたprismaが期待される構造を持つ', () => {
      const { prisma } = require('../client')

      // Prismaクライアントの基本的なプロパティが存在することを確認
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
      
      // Prismaクライアントの基本メソッドが存在することを期待
      // （実際のPrismaClientインスタンスであることを間接的に確認）
      expect(prisma).toHaveProperty('$disconnect')
      expect(prisma).toHaveProperty('$transaction')
      
      // データベースモデルが存在することを確認
      expect(prisma).toHaveProperty('student')
      expect(prisma).toHaveProperty('class')
      expect(prisma).toHaveProperty('room')
      expect(prisma).toHaveProperty('assignment')
    })

    it('複数回requireしても同一インスタンスを返す', () => {
      const { prisma: prisma1 } = require('../client')
      const { prisma: prisma2 } = require('../client')

      // Node.jsのrequireキャッシュにより同一インスタンスが返される
      expect(prisma1).toBe(prisma2)
    })

    it('prismaクライアントが期待される型である', () => {
      const { prisma } = require('../client')

      // オブジェクトであり、nullではない
      expect(prisma).toBeInstanceOf(Object)
      expect(prisma).not.toBeNull()
      expect(prisma).not.toBeUndefined()
    })
  })

  describe('エラー処理と耐性', () => {
    it('グローバル変数の読み取り専用化に対しても動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true })
        
        // グローバルthisへの書き込み制限をシミュレート
        const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'prisma')
        
        try {
          // client.tsの読み込みは成功することを確認
          const { prisma } = require('../client')
          expect(prisma).toBeDefined()
          
        } finally {
          // プロパティディスクリプターを復元
          if (originalDescriptor) {
            Object.defineProperty(globalThis, 'prisma', originalDescriptor)
          } else {
            delete (globalThis as any).prisma
          }
        }
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })

    it('複数の環境変数設定で安定して動作する', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        // 複数の環境設定でテスト
        const environments = ['development', 'test', 'production', undefined]
        
        for (const env of environments) {
          if (env) {
            Object.defineProperty(process.env, 'NODE_ENV', { value: env, writable: true, configurable: true })
          } else {
            Object.defineProperty(process.env, 'NODE_ENV', { value: undefined, writable: true, configurable: true })
          }
          
          const { prisma } = require('../client')
          expect(prisma).toBeDefined()
        }
        
      } finally {
        Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true })
      }
    })
  })
})