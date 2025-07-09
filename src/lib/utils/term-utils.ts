/**
 * 学期判定ユーティリティ
 * 今日の当番APIと今週のスケジュールAPIで共通使用
 */

export type Term = 'FIRST_TERM' | 'SECOND_TERM'

/**
 * 現在の学期を判定する
 * @returns 現在の学期
 */
export function getCurrentTerm(): Term {
  // TODO: 実際のロジックで学期を判定
  // 現在は簡易版として FIRST_TERM を返す
  // 将来的には日付ベースの判定ロジックを実装
  return 'FIRST_TERM'
}

/**
 * 指定された日付が属する学期を判定する
 * @param date 判定対象の日付
 * @returns 該当する学期
 */
export function getTermForDate(_date: Date): Term {
  // TODO: 実際のロジックで学期を判定
  // 現在は簡易版として FIRST_TERM を返す
  // 将来的には学校の学期制度に基づく判定ロジックを実装
  return 'FIRST_TERM'
}

/**
 * 学期の日本語表示名を取得する
 * @param term 学期
 * @returns 日本語表示名
 */
export function getTermDisplayName(term: Term): string {
  switch (term) {
    case 'FIRST_TERM':
      return '前期'
    case 'SECOND_TERM':
      return '後期'
    default:
      return '不明'
  }
}
