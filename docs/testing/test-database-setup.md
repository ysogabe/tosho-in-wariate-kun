# テストデータベースセットアップガイド

## 概要

単体テストとE2Eテストの実行には、適切にセットアップされたテストデータベースが必要です。

## テスト用データベース構造

### 基本エンティティ

#### 1. User（ユーザー）
```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  createdAt: Date
  updatedAt: Date
}
```

#### 2. Class（クラス）
```typescript
interface Class {
  id: string
  name: string          // "1組", "2組" など
  grade: number         // 1-6年生
  year: number          // 年度（2024など）
  createdAt: Date
  updatedAt: Date
  students: Student[]
}
```

#### 3. Student（生徒）
```typescript
interface Student {
  id: string
  name: string
  studentNumber: string
  classId: string
  isActive: boolean     // アクティブ状態
  createdAt: Date
  updatedAt: Date
  class: Class
  assignments: Assignment[]
}
```

#### 4. Room（図書室）
```typescript
interface Room {
  id: string
  name: string          // "図書室A", "図書室B" など
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  assignments: Assignment[]
}
```

#### 5. Assignment（当番割り当て）
```typescript
interface Assignment {
  id: string
  studentId: string
  roomId: string
  date: Date
  term: 'FIRST' | 'SECOND'
  year: number
  createdAt: Date
  updatedAt: Date
  student: Student
  room: Room
}
```

## テストデータ初期化

### 自動セットアップ

```bash
# 単体テスト実行時（自動的にDB初期化）
npm test

# E2Eテスト実行時（自動的にDB初期化）
npm run test:e2e

# 手動でDB初期化のみ
npm run test:setup
```

### テストデータの内容

`prisma/seed-dev.ts`によって以下のデータが作成されます：

#### ユーザー
- 管理者ユーザー（admin@example.com）
- 一般ユーザー（user@example.com）

#### クラス
- 1年1組〜6年3組（18クラス）
- 各クラス25名の生徒

#### 図書室
- 図書室A、図書室B、図書室C（3室）

#### 当番割り当て
- 1学期・2学期分のサンプル割り当て
- 全生徒に公平に配分

## テスト作成時の注意点

### 1. データベース状態の前提

```typescript
describe('Student API', () => {
  // テストデータベースは各テスト前に初期化済み
  // 以下のデータが利用可能：
  // - 18クラス（1-1〜6-3）
  // - 各クラス25名の生徒
  // - 3つの図書室
  
  it('should get all students', async () => {
    const response = await fetch('/api/students')
    const data = await response.json()
    
    // 期待値: 18クラス × 25名 = 450名
    expect(data.students).toHaveLength(450)
  })
})
```

### 2. テストデータの参照方法

```typescript
// 特定のクラスを参照
const class1A = await prisma.class.findFirst({
  where: { name: '1組', grade: 1 }
})

// 特定の生徒を参照
const student = await prisma.student.findFirst({
  where: { 
    studentNumber: '101001',  // 1年1組1番
    class: { name: '1組', grade: 1 }
  }
})

// アクティブな図書室を参照
const activeRooms = await prisma.room.findMany({
  where: { isActive: true }
})
```

### 3. データ一貫性の保証

- 各テスト実行前にDBは完全にリセット
- シードデータは一貫した状態で作成
- 外部キー制約は適切に設定済み

## 環境変数設定

### ローカル開発用（.env.local）

```env
# テスト用データベース
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/tosho_test"

# または SQLite を使用する場合
TEST_DATABASE_URL="file:./test.db"
```

### CI環境

GitHub Actions では `TEST_DATABASE_URL` シークレットまたは環境変数を設定

## トラブルシューティング

### よくある問題

1. **DBアクセスエラー**
   ```bash
   # Prisma クライアントを再生成
   npm run db:generate
   ```

2. **マイグレーションエラー**
   ```bash
   # テストDBをリセット
   npm run db:migrate:reset
   npm run test:setup
   ```

3. **シードデータの不整合**
   ```bash
   # 手動でシードを再実行
   npm run db:seed:dev
   ```

### デバッグ用コマンド

```bash
# テストDBの内容確認
npm run db:studio

# テストDBのバックアップ
npm run db:backup

# テストDBの復元
npm run db:restore
```

## ベストプラクティス

### 1. テストの独立性

```typescript
// ❌ 他のテストに依存するテスト
it('should update student after creation', () => {
  // 前のテストで作成された生徒に依存
})

// ✅ 独立したテスト
it('should update student', async () => {
  // テスト内で必要なデータを作成
  const student = await createTestStudent()
  // テスト実行
})
```

### 2. データクリーンアップ

```typescript
// 通常はDBリセットで十分だが、特別な場合
afterEach(async () => {
  // 特定のテストファイルを削除
  await cleanupTestFiles()
})
```

### 3. モックデータの活用

```typescript
// APIテストではモックデータを使用
jest.mock('@/lib/database/client', () => ({
  prisma: {
    student: {
      findMany: jest.fn().mockResolvedValue(mockStudents),
    },
  },
}))
```

## 参照

- [Prisma スキーマ定義](../../prisma/schema.prisma)
- [シードデータファイル](../../prisma/seed-dev.ts)
- [テスト設定ファイル](../../jest.config.js)