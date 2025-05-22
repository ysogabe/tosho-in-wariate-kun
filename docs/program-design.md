# 図書委員当番割り当てシステム - プログラム設計書

## 1. プロジェクト構成

### 1.1 ディレクトリ構造
```
/frontend
  /src
    /app                  # Next.js App Router
      /dashboard          # ダッシュボード画面
      /management         # 管理画面
        /grades           # 学年管理
        /classes          # クラス管理
        /committee-members # 図書委員管理
        /libraries        # 図書室管理
        /schedule-rules   # スケジュールルール管理
        /generate-schedule # スケジュール生成
        /validate-schedule # スケジュール検証
    /components           # 共通コンポーネント
    /contexts             # Contextプロバイダー
    /hooks                # カスタムフック
    /types                # 型定義
    /utils                # ユーティリティ関数
```

### 1.2 技術スタック
- **フレームワーク**: Next.js 14
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API + useState
- **アイコン**: React Icons

## 2. 主要コンポーネント設計

### 2.1 ダッシュボード画面 (`/app/dashboard/page.tsx`)

#### 機能
- 現在の曜日に基づく当番表示
- 週間スケジュール表示（月〜金）

#### 主要コンポーネント
- `TodayDuties`: 本日の当番表示コンポーネント
- `WeeklySchedule`: 週間スケジュール表示コンポーネント

#### データフロー
1. 現在の曜日を取得
2. スケジュールデータから該当曜日の当番情報を抽出
3. 週間スケジュールを表示

#### コード概要
```typescript
// 現在の曜日を取得する関数
const getDayOfWeek = () => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[new Date().getDay()];
};

// 本日の当番を取得
const currentDay = getDayOfWeek();
const todaySchedule = weeklySchedule.find(schedule => schedule.day === currentDay);
```

### 2.2 スケジュール生成画面 (`/app/management/generate-schedule/page.tsx`)

#### 機能
- 年度・学期選択
- スケジュール生成
- 生成結果表示

#### 主要コンポーネント
- `YearSelector`: 年度選択コンポーネント
- `SemesterSelector`: 学期選択コンポーネント
- `GenerateButton`: スケジュール生成ボタン

#### データフロー
1. 年度・学期を選択
2. 生成ボタンクリックでスケジュール生成処理
3. 生成結果を表示し、検証画面へのリンクを提供

#### コード概要
```typescript
const [semester, setSemester] = useState('first'); // 前期・後期
const [year, setYear] = useState(new Date().getFullYear().toString());

// スケジュールを生成
const generateSchedule = () => {
  // 実際のアプリケーションではAPIを呼び出してスケジュールを生成
  // ここではシミュレーションとして3秒後に完了する
  setIsGenerating(true);
  setTimeout(() => {
    setIsGenerating(false);
    setGeneratedSchedule({
      success: true,
      message: `${year}年度${semester === 'first' ? '前期' : '後期'}のスケジュールが正常に生成されました。`
    });
  }, 3000);
};
```

### 2.3 スケジュール検証画面 (`/app/management/validate-schedule/page.tsx`)

#### 機能
- スケジュール一覧表示
- フィルタリング
- 承認・非承認
- 担当者編集

#### 主要コンポーネント
- `ScheduleTable`: スケジュール一覧表示コンポーネント
- `FilterButtons`: フィルタリングボタン
- `EditModal`: 担当者編集モーダル

#### データフロー
1. スケジュールデータを取得・表示
2. フィルタリングによる表示制御
3. 編集モーダルでの担当者情報更新
4. 承認・非承認処理

#### コード概要
```typescript
// フィルタリングされたスケジュール
const filteredSchedule = useMemo(() => {
  let filtered = [...schedule];
  
  // 承認状態でフィルタリング
  if (filter === 'approved') {
    filtered = filtered.filter(item => item.approved);
  } else if (filter === 'pending') {
    filtered = filtered.filter(item => !item.approved);
  }
  
  // 曜日順にソート
  const dayOrder = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6 };
  filtered.sort((a, b) => {
    // まず年度でソート
    if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
    
    // 次に学期でソート（前期→後期）
    if (a.semester !== b.semester) {
      return a.semester === '前期' ? -1 : 1;
    }
    
    // 最後に曜日でソート
    return dayOrder[a.day as keyof typeof dayOrder] - dayOrder[b.day as keyof typeof dayOrder];
  });
  
  return filtered;
}, [schedule, filter]);
```

## 3. データモデルの実装

### 3.1 型定義 (`/src/types/index.ts`)

```typescript
// 図書委員の型
export type Member = {
  name: string;
  icon: string;
};

// 図書室ごとの当番情報
export type Duty = {
  location: string;
  members: Member[];
};

// スケジュールアイテム
export type ScheduleItem = {
  id: number;
  semester: string; // 前期・後期
  year: string;     // 年度
  day: string;      // 曜日（月、火、水、木、金）
  duties: Duty[];   // 図書室ごとの担当者情報
  approved: boolean; // 承認状態
};

// 編集中のスケジュール
export type EditingSchedule = {
  id: number;
  duties: Duty[];
};
```

### 3.2 コンテキスト実装 (`/src/contexts/SchoolContext.tsx`)

```typescript
import React, { createContext, useState, useContext, ReactNode } from 'react';

type SchoolContextType = {
  schoolName: string;
  setSchoolName: (name: string) => void;
};

const SchoolContext = createContext<SchoolContextType>({
  schoolName: 'XX小学校',
  setSchoolName: () => {},
});

export const SchoolProvider = ({ children }: { children: ReactNode }) => {
  const [schoolName, setSchoolName] = useState('XX小学校');

  return (
    <SchoolContext.Provider value={{ schoolName, setSchoolName }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
```

## 4. 主要機能の実装詳細

### 4.1 曜日単位のスケジュール表示

#### 実装方針
- 曜日情報をキーとしてスケジュールを管理
- 現在の曜日を取得して該当する当番を表示
- 週間スケジュールは曜日順に表示

#### コード実装
```typescript
// ダッシュボードでの実装例
const [weeklySchedule] = useState([
  { 
    day: '月', 
    duties: [
      { 
        location: '図書室A', 
        members: [
          { name: '山田花子', icon: '🌸' },
          { name: '佐藤太郎', icon: '🚀' }
        ] 
      },
      { 
        location: '図書室B', 
        members: [
          { name: '鈴木一郎', icon: '📚' }
        ] 
      },
    ]
  },
  // 火〜金曜日も同様に定義
]);

// 現在の曜日を取得
const getDayOfWeek = () => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[new Date().getDay()];
};

const currentDay = getDayOfWeek();
const todaySchedule = weeklySchedule.find(schedule => schedule.day === currentDay);
```

### 4.2 年2回の修正に対応したスケジュール生成

#### 実装方針
- 年度と学期（前期/後期）を指定してスケジュール生成
- 学期ごとに別々のスケジュールを管理
- 生成されたスケジュールは検証画面で確認・編集

#### コード実装
```typescript
// スケジュール生成画面での実装例
const [semester, setSemester] = useState('first'); // 前期・後期
const [year, setYear] = useState(new Date().getFullYear().toString());

// 年度選択オプション
const yearOptions = Array.from(
  { length: 5 }, 
  (_, i) => new Date().getFullYear() - 2 + i
);

// 学期選択オプション
const semesterOptions = [
  { value: 'first', label: '前期（4月〜9月）' },
  { value: 'second', label: '後期（10月〜3月）' }
];
```

### 4.3 担当者編集機能

#### 実装方針
- モーダルウィンドウで担当者編集
- 図書室ごとに担当者を管理
- アイコンと名前の編集機能
- 担当者の追加・削除機能

#### コード実装
```typescript
// 編集中のスケジュール状態
const [editingSchedule, setEditingSchedule] = useState<EditingSchedule | null>(null);

// 編集を開始
const startEditing = (id: number) => {
  const scheduleToEdit = schedule.find(item => item.id === id);
  if (scheduleToEdit) {
    // ディープコピーを作成
    setEditingSchedule({ 
      id, 
      duties: JSON.parse(JSON.stringify(scheduleToEdit.duties)) 
    });
    setShowForm(true);
  }
};

// 担当者を更新
const updateMember = (dutyIndex: number, memberIndex: number, name: string, icon: string) => {
  if (editingSchedule) {
    const newDuties = [...editingSchedule.duties];
    newDuties[dutyIndex].members[memberIndex] = { name, icon };
    setEditingSchedule({ ...editingSchedule, duties: newDuties });
  }
};

// 担当者を追加
const addMember = (dutyIndex: number) => {
  if (editingSchedule) {
    const newDuties = [...editingSchedule.duties];
    newDuties[dutyIndex].members.push({ name: '', icon: '📚' });
    setEditingSchedule({ ...editingSchedule, duties: newDuties });
  }
};

// 担当者を削除
const removeMember = (dutyIndex: number, memberIndex: number) => {
  if (editingSchedule) {
    const newDuties = [...editingSchedule.duties];
    newDuties[dutyIndex].members.splice(memberIndex, 1);
    setEditingSchedule({ ...editingSchedule, duties: newDuties });
  }
};
```

## 5. 共通コンポーネント

### 5.1 ページヘッダー

```tsx
type PageHeaderProps = {
  title: string;
  backLink: string;
};

const PageHeader = ({ title, backLink }: PageHeaderProps) => (
  <div className="flex items-center mb-6">
    <Link href={backLink} className="mr-4 text-primary hover:text-primary-dark transition-colors">
      <FaArrowLeft className="text-2xl" />
    </Link>
    <h1 className="text-3xl font-bold text-text">{title}</h1>
  </div>
);
```

### 5.2 カード

```tsx
type CardProps = {
  title: string;
  children: ReactNode;
};

const Card = ({ title, children }: CardProps) => (
  <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
    <h2 className="text-2xl font-bold text-text mb-6">{title}</h2>
    {children}
  </div>
);
```

### 5.3 アクションボタン

```tsx
type ActionButtonProps = {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

const ActionButton = ({ onClick, icon, label, variant = 'primary', disabled = false }: ActionButtonProps) => {
  const baseClasses = "px-4 py-2 rounded-lg flex items-center justify-center";
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-secondary text-white hover:bg-secondary-dark",
    danger: "bg-red-500 text-white hover:bg-red-600"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
};
```

## 6. ユーティリティ関数

### 6.1 曜日関連

```typescript
// 曜日の取得
export const getDayOfWeek = (date = new Date()) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

// 曜日の並び替え用
export const dayOrder = { '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6 };

// 曜日でソート
export const sortByDay = (a: string, b: string) => {
  return dayOrder[a as keyof typeof dayOrder] - dayOrder[b as keyof typeof dayOrder];
};
```

### 6.2 スケジュール関連

```typescript
// スケジュールのフィルタリング
export const filterSchedule = (schedule: ScheduleItem[], filter: 'all' | 'approved' | 'pending') => {
  if (filter === 'all') return schedule;
  if (filter === 'approved') return schedule.filter(item => item.approved);
  if (filter === 'pending') return schedule.filter(item => !item.approved);
  return schedule;
};

// スケジュールのソート
export const sortSchedule = (schedule: ScheduleItem[]) => {
  return [...schedule].sort((a, b) => {
    // まず年度でソート
    if (a.year !== b.year) return parseInt(a.year) - parseInt(b.year);
    
    // 次に学期でソート（前期→後期）
    if (a.semester !== b.semester) {
      return a.semester === '前期' ? -1 : 1;
    }
    
    // 最後に曜日でソート
    return dayOrder[a.day as keyof typeof dayOrder] - dayOrder[b.day as keyof typeof dayOrder];
  });
};
```

## 7. 将来的な拡張ポイント

### 7.1 バックエンド連携

```typescript
// APIクライアント
export const api = {
  // スケジュール取得
  getSchedule: async (year: string, semester: string) => {
    const response = await fetch(`/api/schedule?year=${year}&semester=${semester}`);
    return response.json();
  },
  
  // スケジュール保存
  saveSchedule: async (schedule: ScheduleItem) => {
    const response = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    });
    return response.json();
  },
  
  // スケジュール承認
  approveSchedule: async (id: number) => {
    const response = await fetch(`/api/schedule/${id}/approve`, {
      method: 'PUT'
    });
    return response.json();
  }
};
```

### 7.2 通知機能

```typescript
// 通知サービス
export const notificationService = {
  // 当番通知
  notifyDuty: async (memberId: number, date: string) => {
    const response = await fetch('/api/notifications/duty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, date })
    });
    return response.json();
  },
  
  // スケジュール変更通知
  notifyScheduleChange: async (scheduleId: number) => {
    const response = await fetch(`/api/notifications/schedule-change/${scheduleId}`, {
      method: 'POST'
    });
    return response.json();
  }
};
```

### 7.3 統計情報

```typescript
// 統計情報サービス
export const statisticsService = {
  // 担当回数集計
  getDutyCount: async (year: string, semester: string) => {
    const response = await fetch(`/api/statistics/duty-count?year=${year}&semester=${semester}`);
    return response.json();
  },
  
  // 図書室利用状況
  getLibraryUsage: async (year: string, semester: string) => {
    const response = await fetch(`/api/statistics/library-usage?year=${year}&semester=${semester}`);
    return response.json();
  }
};
```
