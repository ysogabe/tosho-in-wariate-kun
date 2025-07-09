import { renderHook, act } from '@testing-library/react'
import { jest } from '@jest/globals'
import { useScheduleGeneration } from '../use-schedule-generation'

// Mocks
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}
jest.mock('sonner', () => ({
  toast: mockToast,
}))

// Mock timers for progress simulation
jest.useFakeTimers()

describe('useScheduleGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('初期状態', () => {
    it('初期値が正しく設定されている', () => {
      const { result } = renderHook(() => useScheduleGeneration())

      expect(result.current.isGenerating).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(typeof result.current.generateSchedule).toBe('function')
    })
  })

  describe('スケジュール生成成功ケース', () => {
    it('成功時の処理が正しく動作する', async () => {
      const mockSuccessResponse = {
        success: true,
        data: {
          message: 'スケジュール生成が完了しました',
          assignmentsCreated: 10,
          term: 'FIRST_TERM'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      const mockOnSuccess = jest.fn()
      const mockOnError = jest.fn()

      const { result } = renderHook(() => useScheduleGeneration())

      act(() => {
        result.current.generateSchedule({
          term: 'FIRST_TERM',
          forceRegenerate: false,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      })

      // 生成開始時の状態確認
      expect(result.current.isGenerating).toBe(true)
      expect(result.current.progress).toBe(0)

      // プログレス進行をシミュレート
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.progress).toBe(10)

      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.progress).toBe(20)

      // API完了まで待機
      await act(async () => {
        jest.runAllTimers()
        await Promise.resolve()
      })

      // 最終状態確認
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.progress).toBe(0)

      // API呼び出し確認
      expect(mockFetch).toHaveBeenCalledWith('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: 'FIRST_TERM',
          forceRegenerate: false,
        }),
      })

      // コールバック確認
      expect(mockOnSuccess).toHaveBeenCalledWith(mockSuccessResponse.data)
      expect(mockOnError).not.toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('スケジュール生成が完了しました')
    })

    it('強制再生成オプションが正しく送信される', async () => {
      const mockSuccessResponse = {
        success: true,
        data: { message: '強制再生成完了' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useScheduleGeneration())

      await act(async () => {
        await result.current.generateSchedule({
          term: 'SECOND_TERM',
          forceRegenerate: true,
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/schedules/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          term: 'SECOND_TERM',
          forceRegenerate: true,
        }),
      })
    })
  })

  describe('スケジュール生成エラーケース', () => {
    it('APIエラーレスポンスを正しく処理する', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          message: '図書委員データが不足しています',
          code: 'INSUFFICIENT_STUDENTS'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response)

      const mockOnSuccess = jest.fn()
      const mockOnError = jest.fn()

      const { result } = renderHook(() => useScheduleGeneration())

      const response = await act(async () => {
        return await result.current.generateSchedule({
          term: 'FIRST_TERM',
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      })

      // 最終状態確認
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.progress).toBe(0)

      // コールバック確認
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith('図書委員データが不足しています')
      expect(mockToast.error).toHaveBeenCalledWith('図書委員データが不足しています')

      // 戻り値確認
      expect(response).toEqual(mockErrorResponse)
    })

    it('ネットワークエラーを正しく処理する', async () => {
      const networkError = new Error('Network connection failed')
      mockFetch.mockRejectedValueOnce(networkError)

      const mockOnSuccess = jest.fn()
      const mockOnError = jest.fn()

      const { result } = renderHook(() => useScheduleGeneration())

      const response = await act(async () => {
        return await result.current.generateSchedule({
          term: 'FIRST_TERM',
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      })

      // 最終状態確認
      expect(result.current.isGenerating).toBe(false)
      expect(result.current.progress).toBe(0)

      // コールバック確認
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith('スケジュール生成中にエラーが発生しました')
      expect(mockToast.error).toHaveBeenCalledWith('スケジュール生成中にエラーが発生しました')

      // 戻り値確認
      expect(response).toEqual({
        success: false,
        error: 'スケジュール生成中にエラーが発生しました'
      })
    })

    it('レスポンスエラーメッセージがない場合のデフォルトメッセージ', async () => {
      const mockErrorResponse = {
        success: false,
        error: {}
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response)

      const mockOnError = jest.fn()

      const { result } = renderHook(() => useScheduleGeneration())

      await act(async () => {
        await result.current.generateSchedule({
          term: 'FIRST_TERM',
          onError: mockOnError,
        })
      })

      expect(mockOnError).toHaveBeenCalledWith('スケジュール生成に失敗しました')
      expect(mockToast.error).toHaveBeenCalledWith('スケジュール生成に失敗しました')
    })
  })

  describe('進捗管理', () => {
    it('進捗が正しく更新される', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: { message: '完了' } }),
            } as Response)
          }, 1000)
        })
      )

      const { result } = renderHook(() => useScheduleGeneration())

      act(() => {
        result.current.generateSchedule({
          term: 'FIRST_TERM',
        })
      })

      // 初期状態
      expect(result.current.progress).toBe(0)

      // 500ms経過
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.progress).toBe(10)

      // 1000ms経過
      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.progress).toBe(20)

      // 2000ms経過
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(result.current.progress).toBe(40)

      // 最大90%まで
      act(() => {
        jest.advanceTimersByTime(3500)
      })
      expect(result.current.progress).toBe(90)

      // API完了後は100%になり、その後0にリセット
      await act(async () => {
        jest.advanceTimersByTime(1000)
        await Promise.resolve()
      })

      expect(result.current.progress).toBe(0)
    })

    it('進捗が90%を超えないことを確認', () => {
      mockFetch.mockImplementation(() => 
        new Promise(() => {}) // 永続的にペンディング
      )

      const { result } = renderHook(() => useScheduleGeneration())

      act(() => {
        result.current.generateSchedule({
          term: 'FIRST_TERM',
        })
      })

      // 長時間経過させても90%を超えない
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(result.current.progress).toBe(90)
    })
  })

  describe('コールバック機能', () => {
    it('onSuccessコールバックが呼ばれない場合もエラーにならない', async () => {
      const mockSuccessResponse = {
        success: true,
        data: { message: '成功' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      const { result } = renderHook(() => useScheduleGeneration())

      await act(async () => {
        await result.current.generateSchedule({
          term: 'FIRST_TERM',
          // コールバックなし
        })
      })

      expect(mockToast.success).toHaveBeenCalledWith('成功')
    })

    it('onErrorコールバックが呼ばれない場合もエラーにならない', async () => {
      const mockErrorResponse = {
        success: false,
        error: { message: 'エラー' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      } as Response)

      const { result } = renderHook(() => useScheduleGeneration())

      await act(async () => {
        await result.current.generateSchedule({
          term: 'FIRST_TERM',
          // コールバックなし
        })
      })

      expect(mockToast.error).toHaveBeenCalledWith('エラー')
    })
  })

  describe('同時実行制御', () => {
    it('生成中は重複実行されない', async () => {
      let resolveFirst: (value: Response) => void
      const firstPromise = new Promise<Response>((resolve) => {
        resolveFirst = resolve
      })

      mockFetch.mockImplementationOnce(() => firstPromise)

      const { result } = renderHook(() => useScheduleGeneration())

      // 1回目の実行
      act(() => {
        result.current.generateSchedule({ term: 'FIRST_TERM' })
      })

      expect(result.current.isGenerating).toBe(true)

      // 2回目の実行（無視されるはず）
      act(() => {
        result.current.generateSchedule({ term: 'SECOND_TERM' })
      })

      // 1回目のみが実行される
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // 1回目を完了
      await act(async () => {
        resolveFirst({
          ok: true,
          json: async () => ({ success: true, data: { message: '完了' } }),
        } as Response)
        await Promise.resolve()
      })

      expect(result.current.isGenerating).toBe(false)
    })
  })

  describe('タイプセーフティ', () => {
    it('TypeScriptの型チェックが正しく動作する', () => {
      const { result } = renderHook(() => useScheduleGeneration())

      // 正しい型のパラメータ
      expect(() => {
        result.current.generateSchedule({
          term: 'FIRST_TERM' as const,
          forceRegenerate: true,
          onSuccess: (data: any) => console.log(data),
          onError: (error: string) => console.error(error),
        })
      }).not.toThrow()

      // termは必須
      expect(() => {
        // @ts-expect-error - termが必須
        result.current.generateSchedule({})
      }).toBeDefined()
    })
  })
})