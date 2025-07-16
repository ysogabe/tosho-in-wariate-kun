/**
 * @jest-environment jsdom
 */

/**
 * SWR用共通fetcher関数のテスト
 * 
 * テスト対象: utils/fetcher.ts
 * 目的: SWRフェッチャー関数と認証付きフェッチ関数の動作を検証
 */

import { fetcher, authenticatedFetch } from '../fetcher'

// fetch APIをモック
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Fetcher Utils Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 環境変数をリセット
    delete process.env.NEXT_PUBLIC_DEV_MODE
  })

  afterEach(() => {
    // 環境変数をクリア
    delete process.env.NEXT_PUBLIC_DEV_MODE
  })

  describe('fetcher 関数テスト', () => {
    const testUrl = 'https://api.example.com/data'
    const mockResponseData = { id: 1, name: 'Test Data' }

    it('デフォルト（開発環境未設定）でcredentials付きリクエストを送信する', async () => {
      // 開発環境が未設定の場合（デフォルト動作）
      // NEXT_PUBLIC_DEV_MODEが'true'でない場合は本番環境扱い

      // 正常なレスポンスをモック
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponseData),
      })

      const result = await fetcher(testUrl)

      expect(result).toEqual(mockResponseData)
      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('本番環境でcredentials付きリクエストを送信する', async () => {
      // 本番環境を設定（NEXT_PUBLIC_DEV_MODE未設定）
      delete process.env.NEXT_PUBLIC_DEV_MODE

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponseData),
      })

      const result = await fetcher(testUrl)

      expect(result).toEqual(mockResponseData)
      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('本番環境でNEXT_PUBLIC_DEV_MODE=falseの場合credentialsを含む', async () => {
      // 明示的にfalseを設定
      process.env.NEXT_PUBLIC_DEV_MODE = 'false'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponseData),
      })

      await fetcher(testUrl)

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('空文字列がNEXT_PUBLIC_DEV_MODEに設定された場合は本番環境として動作する', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = ''

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponseData),
      })

      await fetcher(testUrl)

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })
  })

  describe('fetcher エラーハンドリング', () => {
    const testUrl = 'https://api.example.com/data'

    it('404エラーの場合は適切なエラーを投げる', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(fetcher(testUrl)).rejects.toThrow('API request failed: 404')
    })

    it('500エラーの場合は適切なエラーを投げる', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(fetcher(testUrl)).rejects.toThrow('API request failed: 500')
    })

    it('401認証エラーの場合は適切なエラーを投げる', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(fetcher(testUrl)).rejects.toThrow('API request failed: 401')
    })

    it('ネットワークエラーの場合は例外を投げる', async () => {
      const networkError = new Error('Network connection failed')
      mockFetch.mockRejectedValue(networkError)

      await expect(fetcher(testUrl)).rejects.toThrow('Network connection failed')
    })

    it('JSON解析エラーの場合は例外を投げる', async () => {
      const jsonError = new Error('Invalid JSON')
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(jsonError),
      })

      await expect(fetcher(testUrl)).rejects.toThrow('Invalid JSON')
    })
  })

  describe('authenticatedFetch 関数テスト', () => {
    const testUrl = 'https://api.example.com/posts'

    it('デフォルト環境でcredentials付きPOSTリクエストを送信する', async () => {
      // デフォルト（NEXT_PUBLIC_DEV_MODEが'true'でない）環境

      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      const postData = { title: 'Test Post', content: 'Test Content' }
      const result = await authenticatedFetch(testUrl, {
        method: 'POST',
        body: JSON.stringify(postData),
      })

      expect(result).toBe(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('本番環境でcredentials付きPOSTリクエストを送信する', async () => {
      delete process.env.NEXT_PUBLIC_DEV_MODE

      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 1 }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await authenticatedFetch(testUrl, {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      })

      expect(result).toBe(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('カスタムヘッダーを正しくマージする', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      })

      await authenticatedFetch(testUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
        credentials: 'include',
      })
    })

    it('Content-Typeヘッダーが上書きされる場合でも動作する', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      })

      await authenticatedFetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data', // カスタム値が保持される
        },
        credentials: 'include',
      })
    })

    it('オプション未指定でも正常に動作する（デフォルト値）', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      })

      const result = await authenticatedFetch(testUrl)

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })
  })

  describe('authenticatedFetch HTTPメソッド別テスト', () => {
    const testUrl = 'https://api.example.com/resource'

    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      })
    })

    it('GETリクエストを正しく送信する', async () => {
      await authenticatedFetch(testUrl, { method: 'GET' })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('PUTリクエストを正しく送信する', async () => {
      const updateData = { name: 'Updated Name' }

      await authenticatedFetch(testUrl, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('DELETEリクエストを正しく送信する', async () => {
      await authenticatedFetch(testUrl, { method: 'DELETE' })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })

    it('PATCHリクエストを正しく送信する', async () => {
      const patchData = { status: 'updated' }

      await authenticatedFetch(testUrl, {
        method: 'PATCH',
        body: JSON.stringify(patchData),
      })

      expect(mockFetch).toHaveBeenCalledWith(testUrl, {
        method: 'PATCH',
        body: JSON.stringify(patchData),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
    })
  })

  describe('エッジケースとエラー処理', () => {
    it('非常に長いURLでも正常に動作する', async () => {
      const longUrl = 'https://api.example.com/' + 'a'.repeat(1000)
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      })

      await expect(fetcher(longUrl)).resolves.toEqual({})
      expect(mockFetch).toHaveBeenCalledWith(longUrl, expect.any(Object))
    })

    it('特殊文字を含むURLでも正常に動作する', async () => {
      const specialUrl = 'https://api.example.com/データ?param=値&other=テスト'
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      })

      await expect(fetcher(specialUrl)).resolves.toEqual({})
    })

    it('空のレスポンスボディでも正常に動作する', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 204, // No Content
        json: jest.fn().mockResolvedValue(null),
      })

      const result = await fetcher('https://api.example.com/empty')
      expect(result).toBeNull()
    })

    it('大きなJSONレスポンスを処理できる', async () => {
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'x'.repeat(100),
        })),
      }

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(largeData),
      })

      const result = await fetcher('https://api.example.com/large')
      expect(result).toEqual(largeData)
      expect(result.items).toHaveLength(1000)
    })
  })

  describe('環境変数の動的変更テスト', () => {
    it('モジュール読み込み時の環境変数が固定されることを確認', async () => {
      const testUrl = 'https://api.example.com/dynamic'

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      })

      // モジュール読み込み時の環境変数設定に基づく動作を確認
      // NEXT_PUBLIC_DEV_MODE='true'でない場合は本番環境として動作
      await fetcher(testUrl)
      expect(mockFetch).toHaveBeenLastCalledWith(testUrl, expect.objectContaining({
        credentials: 'include'
      }))

      // 実行時の環境変数変更は既に読み込まれたモジュールには影響しない
      process.env.NEXT_PUBLIC_DEV_MODE = 'true'
      await fetcher(testUrl)
      // isDev値はモジュール読み込み時に固定されているため変更されない
      expect(mockFetch).toHaveBeenLastCalledWith(testUrl, expect.objectContaining({
        credentials: 'include'
      }))
    })
  })
})