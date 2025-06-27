# Issue #004: Prismaスキーマ実装とデータベースマイグレーション

**Priority**: High  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Backend  
**Labels**: database, prisma, schema, migration, backend

## Description

データベース設計書に基づいて、Prismaスキーマファイルを実装し、Supabase PostgreSQLデータベースのテーブル構造を構築します。ユーザー、クラス、図書委員、図書室、当番割り当て、システム設定の各テーブルとそのリレーションを定義します。

## Background

データベース設計書で定義された6つのエンティティ（users, classes, rooms, students, assignments, settings）を実装し、図書委員当番システムのデータ基盤を構築します。Prisma ORMを使用することで、型安全なデータベースアクセスと自動マイグレーション機能を実現します。

## Acceptance Criteria

- [ ] Prismaがセットアップされている
- [ ] 全テーブルのスキーマが定義されている
- [ ] テーブル間のリレーションが正しく設定されている
- [ ] 適切なインデックスが設定されている
- [ ] バリデーション制約が実装されている
- [ ] Prismaクライアントが生成されている
- [ ] マイグレーションが正常に実行される
- [ ] シードデータが準備されている（オプション）

## Implementation Guidelines

### Getting Started

1. Issue #003（Supabase設定）が完了していることを確認
2. データベース設計書を詳細に確認
3. Prismaの基本概念を理解

### Technical Requirements

#### Prisma Dependencies

```bash
# Prisma ORM
npm install prisma @prisma/client

# 開発用ツール
npm install -D prisma
```

#### Project Structure

```
prisma/
├── schema.prisma          # メインスキーマファイル
├── migrations/            # マイグレーションファイル
└── seed.ts               # シードデータ（オプション）
```

### Schema Implementation

#### prisma/schema.prisma

```prisma
// Prisma設定
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ユーザーテーブル（Supabase Authと連携）
model User {
  id          String   @id @db.Uuid
  email       String?  @unique
  displayName String?  @map("display_name")
  role        UserRole @default(ADMIN)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("users")
}

enum UserRole {
  ADMIN
  TEACHER
}

// クラステーブル
model Class {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  year      Int      @db.Integer
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // リレーション
  students Student[]

  // インデックス
  @@unique([name, year])
  @@index([year])
  @@map("classes")
}

// 図書室テーブル
model Room {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique
  capacity  Int      @default(2)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // リレーション
  assignments Assignment[]

  // インデックス
  @@index([name])
  @@map("rooms")
}

// 図書委員テーブル
model Student {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  classId   String   @map("class_id") @db.Uuid
  grade     Int      @db.Integer
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // リレーション
  class       Class        @relation(fields: [classId], references: [id], onDelete: Cascade)
  assignments Assignment[]

  // インデックス
  @@index([classId])
  @@index([grade])
  @@index([isActive])
  @@index([classId, isActive])
  @@map("students")
}

// 当番割り当てテーブル
model Assignment {
  id        String   @id @default(uuid()) @db.Uuid
  studentId String   @map("student_id") @db.Uuid
  roomId    String   @map("room_id") @db.Uuid
  dayOfWeek Int      @map("day_of_week") @db.Integer
  term      Term
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // リレーション
  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  room    Room    @relation(fields: [roomId], references: [id], onDelete: Cascade)

  // 制約: 同一学期で同一学生が同一曜日に重複割り当て不可
  @@unique([studentId, dayOfWeek, term])

  // インデックス
  @@index([studentId])
  @@index([roomId])
  @@index([dayOfWeek, term])
  @@index([term])
  @@map("assignments")
}

enum Term {
  FIRST_TERM  @map("first_term")
  SECOND_TERM @map("second_term")
}

// システム設定テーブル
model Setting {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // インデックス
  @@index([key])
  @@map("settings")
}
```

### Database Client Setup

#### lib/database/client.ts

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### lib/database/index.ts

```typescript
export { prisma } from './client'
export * from '@prisma/client'
```

### Migration Commands

#### Package.json Scripts追加

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

#### Development Workflow

```bash
# 1. Prismaクライアント生成
npm run db:generate

# 2. 開発環境へのスキーマ適用
npm run db:push

# 3. マイグレーション作成（本番用）
npm run db:migrate --name init

# 4. Prisma Studio起動（データベースGUI）
npm run db:studio
```

### Seed Data (Optional)

#### prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 設定データ
  await prisma.setting.upsert({
    where: { key: 'view_only_token' },
    update: {},
    create: {
      key: 'view_only_token',
      value: 'demo-token-replace-in-production',
      description: '表示専用URL用トークン',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'current_year' },
    update: {},
    create: {
      key: 'current_year',
      value: '2025',
      description: '現在の年度',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'school_name' },
    update: {},
    create: {
      key: 'school_name',
      value: '○○小学校',
      description: '学校名',
    },
  })

  // 図書室データ
  const roomA = await prisma.room.upsert({
    where: { name: '図書室A' },
    update: {},
    create: {
      name: '図書室A',
      capacity: 2,
    },
  })

  const roomB = await prisma.room.upsert({
    where: { name: '図書室B' },
    update: {},
    create: {
      name: '図書室B',
      capacity: 2,
    },
  })

  // クラスデータ
  const class5_1 = await prisma.class.upsert({
    where: { name_year: { name: '5年1組', year: 5 } },
    update: {},
    create: {
      name: '5年1組',
      year: 5,
    },
  })

  const class5_2 = await prisma.class.upsert({
    where: { name_year: { name: '5年2組', year: 5 } },
    update: {},
    create: {
      name: '5年2組',
      year: 5,
    },
  })

  console.log('Seed data created successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

### Validation Functions

#### lib/database/validation.ts

```typescript
import { prisma } from './client'

// 週2回制約チェック
export async function validateWeeklyAssignmentLimit(
  studentId: string,
  term: 'FIRST_TERM' | 'SECOND_TERM'
): Promise<boolean> {
  const count = await prisma.assignment.count({
    where: {
      studentId,
      term,
    },
  })

  return count < 2
}

// 同クラス同日制約チェック
export async function validateSameClassSameDay(
  studentId: string,
  dayOfWeek: number,
  term: 'FIRST_TERM' | 'SECOND_TERM'
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  })

  if (!student) return false

  const existingAssignment = await prisma.assignment.findFirst({
    where: {
      dayOfWeek,
      term,
      student: {
        classId: student.classId,
      },
    },
  })

  return !existingAssignment
}
```

### Testing Database Connection

#### lib/database/test.ts

```typescript
import { prisma } from './client'

export async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // 基本的なクエリテスト
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)

    const settingsCount = await prisma.setting.count()
    console.log(`⚙️ Settings in database: ${settingsCount}`)

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
```

### Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [データベース設計書](../データベース設計書.md)

## Implementation Results

### Work Completed

- [x] Prismaセットアップ
- [x] スキーマファイル作成（SQLite向けに調整）
- [x] 全テーブル定義（User, Class, Room, Student, Assignment, Setting）
- [x] リレーション設定（NextAuth.js + ビジネスモデル）
- [x] インデックス設定（unique制約、カスケード削除）
- [x] Prismaクライアント生成
- [x] データベースマイグレーション実行（db:push）
- [x] シードデータ作成（図書室、クラス、図書委員サンプル）
- [x] 接続テスト実装（拡張版）

### Challenges Faced

1. **SQLite向けスキーマ調整**: 元のPostgreSQL向けスキーマをSQLite用に調整。データ型の簡素化（@db.Timestamptz除去等）とEnum型をString型に変更。
2. **NextAuth.jsとの統合**: 既存のNextAuth.js用テーブル（User, Account, Session, VerificationToken）と図書委員システム用テーブルの共存を実現。
3. **シードデータ設計**: 開発・テスト用の適切なサンプルデータを作成し、クラス、図書室、図書委員の関連性を保持。

### Testing Results

- [x] `npm run db:generate` が正常に完了（Prisma Client v6.10.1生成）
- [x] `npm run db:push` でテーブル作成成功（SQLiteファイル更新完了）
- [x] シードデータ投入成功（図書室2つ、クラス2つ、図書委員2名作成）
- [x] データベース接続テスト成功（全テーブルのカウント取得確認）
- [x] 型定義生成確認（TypeScript補完動作確認）

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Schema Design Details

### Key Design Decisions

#### Cascade Deletes

- `Student` → `Assignment`: 図書委員削除時に割り当ても削除
- `Class` → `Student`: クラス削除時に所属学生も削除
- `Room` → `Assignment`: 図書室削除時に割り当ても削除

#### Unique Constraints

- `classes`: name + year の組み合わせ
- `rooms`: name の重複不可
- `assignments`: studentId + dayOfWeek + term の重複不可

#### Indexes

- 検索頻度の高いフィールドにインデックス作成
- 複合インデックスでクエリ最適化

### Data Integrity

#### Business Rules Implementation

- 週2回制約: アプリケーションレベルで実装
- 同クラス同日制約: アプリケーションレベルで実装
- 学年制約: ENUMまたは CHECK制約で実装

#### Audit Trail

- 全テーブルに createdAt, updatedAt フィールド
- 変更履歴は別途検討（Post-MVP）

## Next Steps

このIssue完了後の次のタスク：

1. Issue #013: クラス管理APIルート作成
2. Issue #014: 図書委員管理APIルート作成
3. Issue #021: スケジュール生成サービス

## Notes

- 本番環境では必ずマイグレーションを使用
- スキーマ変更時は慎重にバックアップを取る
- Row Level Security（RLS）は後続Issueで実装
- パフォーマンスチューニングは使用状況を見てから検討
