/**
 * クラス管理ビジネスロジック
 * APIルートから独立した、テスト可能な純粋な関数群
 */

import { type ClassResponse } from '@/lib/schemas/class-schemas'

/**
 * データベースから取得したクラスデータをレスポンス形式に変換
 */
export function transformClassesToResponse(
  classes: Array<{
    id: string
    name: string
    year: number
    createdAt: Date
    updatedAt: Date
    _count: { students: number }
  }>
): ClassResponse[] {
  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    studentCount: c._count.students,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

/**
 * 単一クラスデータをレスポンス形式に変換
 */
export function transformClassToResponse(classData: {
  id: string
  name: string
  year: number
  createdAt: Date
  updatedAt: Date
  _count: { students: number }
}): ClassResponse {
  return {
    id: classData.id,
    name: classData.name,
    year: classData.year,
    studentCount: classData._count.students,
    createdAt: classData.createdAt,
    updatedAt: classData.updatedAt,
  }
}

/**
 * クラス検索条件を構築
 */
export function buildClassSearchWhere(params: {
  year?: number
  search?: string
}) {
  return {
    ...(params.year && { year: params.year }),
    ...(params.search && {
      name: { contains: params.search, mode: 'insensitive' as const },
    }),
  }
}

/**
 * 重複チェック用の条件を生成
 */
export function buildDuplicateCheckWhere(name: string, year: number) {
  return { name, year }
}

/**
 * クラス作成成功メッセージを生成
 */
export function createClassSuccessMessage(name: string, year: number): string {
  return `${year}年${name}を作成しました`
}

/**
 * クラス重複エラーメッセージを生成
 */
export function createClassDuplicateMessage(
  name: string,
  year: number
): string {
  return `${year}年${name}は既に存在します`
}

/**
 * ページネーション計算のバリデーション
 */
export function validatePaginationParams(
  page: number,
  limit: number
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (page < 1) {
    errors.push('ページ番号は1以上である必要があります')
  }

  if (limit < 1) {
    errors.push('制限数は1以上である必要があります')
  }

  if (limit > 100) {
    errors.push('制限数は100以下である必要があります')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * オフセット計算
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * クラス名の正規化（前後の空白を除去）
 */
export function normalizeClassName(name: string): string {
  return name.trim()
}

/**
 * クラス名の有効性チェック
 */
export function isValidClassName(name: string): boolean {
  const normalized = normalizeClassName(name)
  return normalized.length > 0 && normalized.length <= 20
}

/**
 * 年度の有効性チェック
 */
export function isValidYear(year: number): boolean {
  return Number.isInteger(year) && year >= 5 && year <= 6
}
