'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface GenerateScheduleOptions {
  term: 'FIRST_TERM' | 'SECOND_TERM'
  forceRegenerate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useScheduleGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const generateSchedule = useCallback(
    async ({
      term,
      forceRegenerate = false,
      onSuccess,
      onError,
    }: GenerateScheduleOptions) => {
      // 既に生成中の場合は無視
      if (isGenerating) {
        return
      }

      setIsGenerating(true)
      setProgress(0)

      try {
        // 進捗シミュレーション
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90))
        }, 500)

        const response = await fetch('/api/schedules/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            term,
            forceRegenerate,
          }),
        })

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setProgress(100)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()

        if (result.success) {
          toast.success(result.data.message)
          onSuccess?.(result.data)
        } else {
          const errorMessage =
            result.error.message || 'スケジュール生成に失敗しました'
          toast.error(errorMessage)
          onError?.(errorMessage)
        }

        return result
      } catch (error) {
        const errorMessage = 'スケジュール生成中にエラーが発生しました'
        console.error('Schedule generation error:', error)
        toast.error(errorMessage)
        onError?.(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsGenerating(false)
        setProgress(0)
      }
    },
    [isGenerating]
  )

  return {
    generateSchedule,
    isGenerating,
    progress,
  }
}
