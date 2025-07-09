# Issue #031: 図書室端末用公開スケジュール表示機能

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Frontend  
**Labels**: frontend, public, display, schedule, tablet

## Description

ログイン不要でスケジュールを表示できる公開ページを実装します。図書室のタブレットや端末での表示用として、管理機能を除いたスケジュール表示に特化した画面を提供します。

## Background

図書室に設置されたタブレットや端末から、委員や来館者がログインなしで当番スケジュールを確認できる機能が必要です。ISSUE-023で実装したダッシュボードのデザインテイストを踏襲しつつ、管理機能を除いた表示専用の画面として設計します。

## Acceptance Criteria

- [ ] ログイン不要でアクセス可能な公開ページが実装されている
- [ ] 今日の当番表示機能が実装されている
- [ ] 週間スケジュール表示機能が実装されている
- [ ] 統計情報・管理機能・クイックアクションは除外されている
- [ ] ISSUE-023のデザインテイストが踏襲されている
- [ ] タブレット・PC両方でレスポンシブ対応されている
- [ ] A4印刷に最適化されている
- [ ] 自動更新機能（日付変更時）が実装されている
- [ ] 土日・祝日の適切な表示が実装されている

## 🎯 画面設計（ISSUE-023ベース）

### 📋 画面レイアウト (ワイヤーフレーム)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 図書委員当番スケジュール - 閲覧専用                    最終更新: 7月8日 15:30 │
│                                                     [🖨️印刷] [🔄更新]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌟 今日の当番                                    📅 今日: 7月8日(月)       │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📚 図書室1                     📚 図書室2                              │ │
│ │ ┌─────────────────┐             ┌─────────────────┐                   │ │
│ │ │ 👤 田中 花子     │             │ 👤 佐藤 太郎     │                   │ │
│ │ │ 5年2組          │             │ 6年1組          │                   │ │
│ │ │ ⏰ 8:15-8:30   │             │ ⏰ 12:25-12:40 │                   │ │
│ │ └─────────────────┘             └─────────────────┘                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 今週のスケジュール                                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │      │ 月   │ 火   │ 水   │ 木   │ 金              │  [📊詳細表示]     │ │
│ │ ─────┼─────┼─────┼─────┼─────┼─────────────────┤                    │ │
│ │図書室1│田中★ │山田  │鈴木  │松本  │高橋            │  [🖨️印刷]       │ │
│ │      │5-2   │6-1   │5-1   │6-2   │5-3            │                    │ │
│ │ ─────┼─────┼─────┼─────┼─────┼─────────────────┤                    │ │
│ │図書室2│佐藤  │伊藤  │渡辺  │小林  │加藤            │                    │ │
│ │      │6-1   │5-2   │6-3   │5-1   │6-2            │                    │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ★印: 今日の当番                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📅 学期情報                             │ 🏫 学校情報                        │
│ ┌─────────────────────────────────┐    │ ┌─────────────────────────────────┐│
│ │ 現在: 前期                        │    │ │ 〇〇小学校 図書室               ││
│ │ 前期: 4月〜9月                   │    │ │ 当番時間: 8:15-8:30            ││
│ │ 後期: 10月〜3月                  │    │ │          12:25-12:40           ││
│ │                                 │    │ │ 図書室1: 4名定員               ││
│ │ 本日: 2024年7月8日(月)          │    │ │ 図書室2: 4名定員               ││
│ └─────────────────────────────────┘    │ └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Guidelines

### 1. ページ実装 (`/schedule/public`)

#### ルート設定
```typescript
// src/app/schedule/public/page.tsx
export default function PublicSchedulePage() {
  // ログイン不要の公開ページ
}
```

#### 認証除外設定
```typescript
// middleware.ts に認証除外パスを追加
const publicPaths = ['/schedule/public']
```

### 2. コンポーネント構成

#### 2.1 PublicTodayDuties Component
```typescript
// 今日の当番表示（ISSUE-023のTodayDutiesベース）
interface PublicTodayDutiesProps {
  hideActions?: boolean // 管理ボタンを非表示
}
```

#### 2.2 PublicWeeklySchedule Component
```typescript
// 週間スケジュール表示（ISSUE-023のWeeklyScheduleベース）
interface PublicWeeklyScheduleProps {
  hideActions?: boolean // 管理ボタンを非表示
  showPrintButton?: boolean // 印刷ボタン表示
}
```

#### 2.3 PublicScheduleInfo Component
```typescript
// 学期情報・学校情報表示
interface PublicScheduleInfoProps {
  currentTerm: string
  schoolInfo: SchoolInfo
}
```

### 3. API実装

#### 3.1 既存APIの活用
- `/api/dashboard/today-duties` - 今日の当番取得
- `/api/schedules?format=calendar` - 週間スケジュール取得

#### 3.2 新規API（オプション）
```typescript
// /api/public/schedule-info - 公開情報専用API
interface PublicScheduleInfo {
  currentTerm: 'FIRST_TERM' | 'SECOND_TERM'
  schoolInfo: {
    name: string
    rooms: Array<{
      id: string
      name: string
      capacity: number
    }>
    dutyTimes: string[]
  }
  lastUpdated: string
}
```

### 4. 機能要件

#### 4.1 表示機能
- 現在日時の自動表示・更新
- 今日の当番一覧（図書室別）
- 週間スケジュール（カレンダー形式）
- 学期情報・学校情報

#### 4.2 ユーザビリティ機能
- 印刷最適化（A4サイズ）
- レスポンシブデザイン（タブレット・PC対応）
- 自動更新（日付変更時、定期的な更新）
- 土日・祝日の適切な表示

#### 4.3 除外機能（管理機能）
- 統計カード
- クイックアクション
- 編集・削除ボタン
- 管理者専用機能

### 5. 技術要件

#### 5.1 認証・セキュリティ
```typescript
// 認証不要だが、読み取り専用API使用
// レート制限・DoS対策の実装
```

#### 5.2 パフォーマンス
```typescript
// SWRでのデータキャッシュ
// 自動更新（30秒〜1分間隔）
// 軽量な実装（タブレット対応）
```

#### 5.3 アクセシビリティ
```typescript
// 大きなフォント・読みやすい表示
// 色覚障害対応
// タッチ操作対応
```

## Testing Requirements

### Unit Tests
```typescript
// コンポーネントのレンダリングテスト
describe('PublicTodayDuties', () => {
  it('管理ボタンが非表示になる', () => {})
  it('今日の当番が正しく表示される', () => {})
})
```

### Integration Tests
```typescript
// 公開ページのアクセステスト
describe('/schedule/public', () => {
  it('認証なしでアクセスできる', () => {})
  it('スケジュールが正しく表示される', () => {})
})
```

### E2E Tests
```typescript
// Playwrightでの表示テスト
test('公開スケジュール表示', async ({ page }) => {
  await page.goto('/schedule/public')
  // 管理機能が表示されないことを確認
})
```

## Resources

### Design Reference
- [ISSUE-023 ダッシュボードページ](./ISSUE-023-dashboard-page.md) - デザインテイスト参考
- [shadcn-ui Card Component](https://ui.shadcn.com/docs/components/card)
- [Next.js Public Routes](https://nextjs.org/docs/app/building-your-application/routing)

### Implementation Reference
```typescript
// 既存コンポーネント参考
// src/components/dashboard/TodayDuties.tsx
// src/components/dashboard/WeeklySchedule.tsx
// src/app/dashboard/page.tsx
```

## Implementation Results

### Work Completed

- [ ] 認証除外ルート設定 (`/schedule/public`)
- [ ] PublicTodayDuties コンポーネント作成
- [ ] PublicWeeklySchedule コンポーネント作成
- [ ] PublicScheduleInfo コンポーネント作成
- [ ] 公開ページレイアウト実装
- [ ] 印刷最適化CSS実装
- [ ] レスポンシブデザイン対応
- [ ] 自動更新機能実装
- [ ] 単体テスト作成
- [ ] 統合テスト作成

### Challenges Faced

[実装中に記録]

### Testing Results

[テスト実行後に記録]

### Code Review Feedback

[レビュー後に記録]

## 📋 実装優先度

### Phase 1: 基本表示機能 (2-3時間)
1. 公開ページルート作成
2. 既存コンポーネントの公開版作成
3. 基本レイアウト実装

### Phase 2: 機能完成 (1-2時間)
4. 印刷機能・レスポンシブ対応
5. 自動更新機能
6. 学期・学校情報表示

### Phase 3: 品質向上 (1時間)
7. テスト作成
8. アクセシビリティ対応
9. パフォーマンス最適化

この実装により、図書室のタブレットや端末でログイン不要でスケジュールを確認できる、使いやすい公開表示機能が完成します。