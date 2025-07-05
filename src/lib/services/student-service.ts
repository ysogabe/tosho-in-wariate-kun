/**
 * 図書委員管理ビジネスロジック
 * APIルートから独立した、テスト可能な純粋な関数群
 */

import { type StudentResponse } from '@/lib/schemas/student-schemas'

/**
 * データベースから取得した図書委員データをレスポンス形式に変換
 */
export function transformStudentsToResponse(
  students: Array<{
    id: string
    name: string
    classId: string
    grade: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: { assignments: number }
    class?: {
      id: string
      name: string
      year: number
    }
  }>
): StudentResponse[] {
  return students.map((s) => ({
    id: s.id,
    name: s.name,
    classId: s.classId,
    grade: s.grade,
    isActive: s.isActive,
    assignmentCount: s._count.assignments,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    class: s.class,
  }))
}

/**
 * 単一図書委員データをレスポンス形式に変換
 */
export function transformStudentToResponse(studentData: {
  id: string
  name: string
  classId: string
  grade: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: { assignments: number }
  class?: {
    id: string
    name: string
    year: number
  }
}): StudentResponse {
  return {
    id: studentData.id,
    name: studentData.name,
    classId: studentData.classId,
    grade: studentData.grade,
    isActive: studentData.isActive,
    assignmentCount: studentData._count.assignments,
    createdAt: studentData.createdAt,
    updatedAt: studentData.updatedAt,
    class: studentData.class,
  }
}

/**
 * 図書委員検索条件を構築
 */
export function buildStudentSearchWhere(params: {
  search?: string
  classId?: string
  grade?: number
  isActive?: boolean
}) {
  return {
    ...(params.isActive !== undefined && { isActive: params.isActive }),
    ...(params.grade && { grade: params.grade }),
    ...(params.classId && { classId: params.classId }),
    ...(params.search && {
      name: { contains: params.search, mode: 'insensitive' as const },
    }),
  }
}

/**
 * 図書委員重複チェック用の条件を生成
 */
export function buildStudentDuplicateCheckWhere(name: string, classId: string) {
  return { name, classId }
}

/**
 * 図書委員作成成功メッセージを生成
 */
export function createStudentSuccessMessage(
  name: string,
  className: string,
  year: number
): string {
  return `${year}年${className}の${name}さんを図書委員として登録しました`
}

/**
 * 図書委員重複エラーメッセージを生成
 */
export function createStudentDuplicateMessage(
  name: string,
  className: string,
  year: number
): string {
  return `${year}年${className}には既に${name}さんが図書委員として登録されています`
}

/**
 * 図書委員更新成功メッセージを生成
 */
export function createStudentUpdateMessage(
  name: string,
  className: string,
  year: number
): string {
  return `${year}年${className}の${name}さんの情報を更新しました`
}

/**
 * 図書委員削除成功メッセージを生成
 */
export function createStudentDeleteMessage(
  name: string,
  className: string,
  year: number
): string {
  return `${year}年${className}の${name}さんを図書委員から削除しました`
}

/**
 * 図書委員名の正規化（前後の空白を除去）
 */
export function normalizeStudentName(name: string): string {
  return name.trim()
}

/**
 * 図書委員名の有効性チェック
 */
export function isValidStudentName(name: string): boolean {
  const normalized = normalizeStudentName(name)
  return normalized.length > 0 && normalized.length <= 50
}

/**
 * 学年の有効性チェック
 */
export function isValidGrade(grade: number): boolean {
  return Number.isInteger(grade) && grade >= 5 && grade <= 6
}

/**
 * 図書委員の削除可否をチェック
 */
export function canDeleteStudent(assignmentCount: number): {
  canDelete: boolean
  reason?: string
} {
  if (assignmentCount > 0) {
    return {
      canDelete: false,
      reason: `この図書委員には${assignmentCount}件の当番が割り当てられているため削除できません。先に当番表をリセットしてください。`,
    }
  }
  return { canDelete: true }
}

/**
 * ページネーション計算のバリデーション（class-serviceから再利用）
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
 * オフセット計算（class-serviceから再利用）
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}
