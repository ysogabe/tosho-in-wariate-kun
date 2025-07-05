# Issue #012: データベースマイグレーションとシード実装

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Backend  
**Labels**: backend, database, migrations, prisma

## Description

Prismaを使用してデータベーススキーマのマイグレーション機能とシードデータの投入機能を実装します。開発・テスト・本番環境で一貫性のあるデータベース管理を実現します。

## Background

データベース設計書で定義されたスキーマを実際のデータベースに適用し、初期データやテストデータを安全に管理するマイグレーション機能を構築します。

## Acceptance Criteria

- [ ] Prismaマイグレーション機能が実装されている
- [ ] シードデータ投入スクリプトが作成されている
- [ ] 開発用テストデータが準備されている
- [ ] マイグレーション管理スクリプトが作成されている
- [ ] データベースリセット機能が実装されている
- [ ] バックアップ・リストア機能が実装されている
- [ ] 環境別設定が実装されている
- [ ] エラーハンドリングが実装されている

## Implementation Guidelines

### Getting Started

1. Issue #004（Prismaスキーマ実装）が完了していることを確認
2. Issue #003（Supabase設定）が完了していることを確認
3. Prismaマイグレーションの動作原理を理解
4. 環境別データベース設定の確認

### Main Implementation

#### 1. Migration Scripts

##### package.json (scripts section)

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:migrate:reset": "prisma migrate reset",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:dev": "tsx prisma/seed-dev.ts",
    "db:reset": "prisma migrate reset --force && npm run db:seed",
    "db:reset:dev": "prisma migrate reset --force && npm run db:seed:dev",
    "db:studio": "prisma studio",
    "db:backup": "tsx scripts/backup-db.ts",
    "db:restore": "tsx scripts/restore-db.ts"
  }
}
```

#### 2. Seed Scripts

##### prisma/seed.ts

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  try {
    // 既存データのクリア（本番環境では注意）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Clearing existing data...')
      await clearDatabase()
    }

    // 基本マスターデータ
    await seedRooms()
    await seedClasses()
    await seedStudents()
    await seedAdminUser()

    console.log('✅ Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  // 外部キー制約の関係で削除順序に注意
  await prisma.assignment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.class.deleteMany()
  await prisma.room.deleteMany()
  await prisma.profile.deleteMany()
}

async function seedRooms() {
  console.log('📚 Creating library rooms...')

  const rooms = [
    {
      name: '図書室A',
      capacity: 4,
      description: 'メイン図書室',
      isActive: true,
    },
    {
      name: '図書室B',
      capacity: 3,
      description: 'サブ図書室',
      isActive: true,
    },
    {
      name: '読み聞かせコーナー',
      capacity: 2,
      description: '読み聞かせ専用スペース',
      isActive: true,
    },
  ]

  for (const room of rooms) {
    await prisma.room.create({
      data: room,
    })
    console.log(`  ✓ Created room: ${room.name}`)
  }
}

async function seedClasses() {
  console.log('🏫 Creating classes...')

  const classes = [
    // 5年生
    { name: 'A', year: 5 },
    { name: 'B', year: 5 },
    { name: 'C', year: 5 },
    // 6年生
    { name: 'A', year: 6 },
    { name: 'B', year: 6 },
    { name: 'C', year: 6 },
  ]

  for (const classData of classes) {
    await prisma.class.create({
      data: classData,
    })
    console.log(`  ✓ Created class: ${classData.year}年${classData.name}組`)
  }
}

async function seedStudents() {
  console.log('👥 Creating students...')

  // クラスデータを取得
  const classes = await prisma.class.findMany()

  const studentNames = [
    '田中太郎',
    '山田花子',
    '佐藤次郎',
    '鈴木美咲',
    '高橋健太',
    '伊藤涼子',
    '渡辺俊介',
    '中村千春',
    '小林大輔',
    '加藤結衣',
    '吉田翔太',
    '森本彩香',
    '清水拓海',
    '斎藤七海',
    '松本航平',
    '井上優奈',
  ]

  let studentIndex = 0

  for (const classData of classes) {
    // 各クラスに4名の図書委員を作成
    const studentsInClass = studentNames.slice(studentIndex, studentIndex + 4)

    for (const name of studentsInClass) {
      await prisma.student.create({
        data: {
          name,
          grade: classData.year,
          classId: classData.id,
          isActive: true,
        },
      })
      console.log(
        `  ✓ Created student: ${name} (${classData.year}年${classData.name}組)`
      )
    }

    studentIndex += 4
  }
}

async function seedAdminUser() {
  console.log('👤 Creating admin user...')

  // 管理者用のプロファイルを作成
  // 注意: 実際のユーザーはSupabase Authで作成される
  const adminProfile = {
    id: '00000000-0000-0000-0000-000000000000', // プレースホルダーID
    email: 'admin@school.jp',
    displayName: '管理者',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  try {
    await prisma.profile.create({
      data: adminProfile,
    })
    console.log(`  ✓ Created admin profile: ${adminProfile.email}`)
  } catch (error) {
    console.log(`  ⚠️ Admin profile may already exist`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

#### 3. Development Seed Script

##### prisma/seed-dev.ts

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding development database...')

  try {
    // 基本シードを実行
    const { execSync } = require('child_process')
    execSync('npm run db:seed', { stdio: 'inherit' })

    // 開発用追加データ
    await seedDevelopmentAssignments()
    await seedMoreTestData()

    console.log('✅ Development seeding completed!')
  } catch (error) {
    console.error('❌ Error during development seeding:', error)
    process.exit(1)
  }
}

async function seedDevelopmentAssignments() {
  console.log('📅 Creating sample assignments...')

  const students = await prisma.student.findMany({
    include: { class: true },
  })
  const rooms = await prisma.room.findMany()

  if (students.length === 0 || rooms.length === 0) {
    console.log('  ⚠️ No students or rooms found, skipping assignments')
    return
  }

  // 前期の割り当てサンプル
  const firstTermAssignments = []
  for (let i = 0; i < Math.min(12, students.length); i++) {
    const student = students[i]
    const room = rooms[i % rooms.length]
    const dayOfWeek = (i % 5) + 1 // 月-金

    firstTermAssignments.push({
      studentId: student.id,
      roomId: room.id,
      dayOfWeek,
      term: 'FIRST_TERM' as const,
    })
  }

  for (const assignment of firstTermAssignments) {
    await prisma.assignment.create({
      data: assignment,
    })
  }

  console.log(
    `  ✓ Created ${firstTermAssignments.length} first term assignments`
  )
}

async function seedMoreTestData() {
  console.log('🧪 Creating additional test data...')

  // 追加のテストクラス
  const testClass = await prisma.class.create({
    data: {
      name: 'D',
      year: 5,
    },
  })

  // テストクラス用の学生
  const testStudents = ['試験太郎', '試験花子', 'テスト次郎', 'テスト美咲']

  for (const name of testStudents) {
    await prisma.student.create({
      data: {
        name,
        grade: 5,
        classId: testClass.id,
        isActive: true,
      },
    })
  }

  console.log('  ✓ Created test class and students')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

#### 4. Database Management Scripts

##### scripts/backup-db.ts

```typescript
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

async function backupDatabase() {
  console.log('💾 Starting database backup...')

  try {
    // バックアップディレクトリの作成
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`)

    // 環境変数からデータベース情報を取得
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // pg_dump を使用してバックアップ
    const command = `pg_dump "${databaseUrl}" > "${backupFile}"`
    execSync(command, { stdio: 'inherit' })

    console.log(`✅ Backup completed: ${backupFile}`)

    // 古いバックアップファイルの削除（7日以上古いファイル）
    cleanOldBackups()
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

function cleanOldBackups() {
  console.log('🧹 Cleaning old backups...')

  const files = fs.readdirSync(BACKUP_DIR)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)

  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file)
    const stats = fs.statSync(filePath)

    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath)
      console.log(`  ✓ Deleted old backup: ${file}`)
    }
  })
}

backupDatabase()
```

##### scripts/restore-db.ts

```typescript
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function restoreDatabase() {
  const backupFile = process.argv[2]

  if (!backupFile) {
    console.error('❌ Backup file path is required')
    console.log('Usage: npm run db:restore <backup-file-path>')
    process.exit(1)
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`)
    process.exit(1)
  }

  console.log(`📥 Restoring database from: ${backupFile}`)

  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // データベースの復元
    const command = `psql "${databaseUrl}" < "${backupFile}"`
    execSync(command, { stdio: 'inherit' })

    console.log('✅ Database restored successfully')

    // Prismaの同期
    console.log('🔄 Regenerating Prisma client...')
    execSync('npm run db:generate', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  }
}

restoreDatabase()
```

#### 5. Environment Configuration

##### .env.example

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tosho_dev?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/tosho_dev?schema=public"

# Test Database
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/tosho_test?schema=public"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Environment
NODE_ENV="development"
```

### Dependencies

#### package.json additions

```json
{
  "devDependencies": {
    "tsx": "^4.7.0"
  }
}
```

### Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)

## Implementation Results

### Work Completed

- [x] Prismaマイグレーション設定
- [x] シードスクリプト実装 (prisma/seed.ts)
- [x] 開発用シードスクリプト実装 (prisma/seed-dev.ts)
- [x] バックアップスクリプト実装 (scripts/backup-db.ts)
- [x] リストアスクリプト実装 (scripts/restore-db.ts)
- [x] 環境別設定実装 (.env.example, .env.local.example更新)
- [x] NPMスクリプト設定 (package.json更新)
- [x] エラーハンドリング実装

### Challenges Faced

**Import Style Configuration**: TypeScript import style を調整してCommonJSとESモジュールの互換性を確保しました。
**Environment Configuration**: 既存のSQLite設定からPostgreSQL/Supabase設定への移行準備を完了しました。
**Backup File Management**: 自動的な古いバックアップファイルの削除機能を実装しました。

### Testing Results

- [x] Prisma client生成確認 (db:generate実行成功)
- [x] TypeScript型チェック確認 (type-check実行成功)
- [x] スクリプト構文確認 (tsx依存関係追加済み)
- [x] 環境設定ファイル作成確認 (.env.example作成)
- [x] パッケージスクリプト設定確認 (npm run scriptsすべて追加)

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #015: スケジュール管理APIルート作成
2. Issue #016: フォームバリデーションスキーマ実装
3. Issue #017: スケジュール表示コンポーネント作成
