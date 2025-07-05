# Issue #013: クラス管理APIルートの作成

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Backend  
**Labels**: backend, api, crud, classes

## Description

クラス情報の管理を行うNext.js API Routesを実装します。クラスの作成、読み取り、更新、削除（CRUD）操作を提供し、適切なバリデーションとエラーハンドリングを実装します。

## Background

API設計書で定義されたクラス管理APIエンドポイントを実装し、フロントエンドからクラス情報を安全に管理できるAPIを提供します。

## Acceptance Criteria

- [ ] GET /api/classes エンドポイントが実装されている
- [ ] POST /api/classes エンドポイントが実装されている
- [ ] PUT /api/classes/[id] エンドポイントが実装されている
- [ ] DELETE /api/classes/[id] エンドポイントが実装されている
- [ ] Zodバリデーションが実装されている
- [ ] 認証・認可チェックが実装されている
- [ ] エラーハンドリングが適切に実装されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Technical Requirements

#### Dependencies

```bash
# 既にインストール済みのものを確認
npm list zod @prisma/client
```

### API Routes Implementation

#### 1. GET /api/classes

##### src/app/api/classes/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const ClassesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  year: z.coerce.number().int().min(5).max(6).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const params = ClassesQuerySchema.parse(Object.fromEntries(searchParams))

    const where = {
      ...(params.year && { year: params.year }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          _count: {
            select: { students: { where: { isActive: true } } },
          },
        },
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.class.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        classes: classes.map((c) => ({
          ...c,
          studentCount: c._count.students,
        })),
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const { name, year } = CreateClassSchema.parse(body)

    const existingClass = await prisma.class.findFirst({
      where: { name, year },
    })

    if (existingClass) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLASS_ALREADY_EXISTS',
            message: '同じ名前・学年のクラスが既に存在します',
          },
        },
        { status: 409 }
      )
    }

    const newClass = await prisma.class.create({
      data: { name, year },
      include: {
        _count: {
          select: { students: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          class: {
            ...newClass,
            studentCount: newClass._count.students,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateClassSchema = z.object({
  name: z
    .string()
    .min(1, 'クラス名は必須です')
    .max(20, 'クラス名は20文字以内で入力してください'),
  year: z.number().int().min(5).max(6, '学年は5年または6年を指定してください'),
})

function handleApiError(error: unknown): NextResponse {
  // エラーハンドリング実装
  console.error('API Error:', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラーが発生しました',
          details: error.errors,
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  )
}
```

#### 2. PUT/DELETE /api/classes/[id]

##### src/app/api/classes/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { z } from 'zod'

const UpdateClassSchema = z.object({
  name: z.string().min(1).max(20).optional(),
  year: z.number().int().min(5).max(6).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const updateData = UpdateClassSchema.parse(body)

    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
    })

    if (!existingClass) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLASS_NOT_FOUND',
            message: 'クラスが見つかりません',
          },
        },
        { status: 404 }
      )
    }

    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { students: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        class: {
          ...updatedClass,
          studentCount: updatedClass._count.students,
        },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request)

    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    })

    if (!existingClass) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLASS_NOT_FOUND',
            message: 'クラスが見つかりません',
          },
        },
        { status: 404 }
      )
    }

    if (existingClass._count.students > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLASS_HAS_STUDENTS',
            message: 'このクラスには図書委員が登録されているため削除できません',
          },
        },
        { status: 409 }
      )
    }

    await prisma.class.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'クラスが削除されました',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma CRUD Operations](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
- [Zod Validation](https://zod.dev/)

## Implementation Results

### Work Completed

- [x] GET /api/classes 実装 (`src/app/api/classes/route.ts`)
- [x] POST /api/classes 実装 (`src/app/api/classes/route.ts`)
- [x] PUT /api/classes/[id] 実装 (`src/app/api/classes/[id]/route.ts`)
- [x] DELETE /api/classes/[id] 実装 (`src/app/api/classes/[id]/route.ts`)
- [x] Zodバリデーション実装 (`src/lib/schemas/class-schemas.ts`)
- [x] 共通エラーハンドリング実装 (`src/lib/api/error-handler.ts`)
- [x] 認証・認可チェック実装 (既存helpers使用)
- [x] TypeScript型定義完了
- [x] Next.js 15 App Router対応

### Implementation Details

#### Files Created/Modified

- **src/lib/api/error-handler.ts**: 共通APIエラーハンドリング
- **src/lib/api/index.ts**: APIユーティリティエクスポート
- **src/lib/schemas/class-schemas.ts**: Zodバリデーションスキーマ
- **src/app/api/classes/route.ts**: GET/POSTエンドポイント
- **src/app/api/classes/[id]/route.ts**: PUT/DELETEエンドポイント

#### Technical Features Implemented

- ページネーション対応 (page, limit, total, totalPages)
- 検索機能 (name部分一致検索)
- フィルタリング機能 (year指定)
- 重複チェック (name + year unique constraint)
- 学生存在チェック (削除時の安全性確保)
- 包括的エラーハンドリング (Zod, 認証, Prisma制約エラー対応)
- TypeScript型安全性確保

### Testing Results

- [x] TypeScript型チェック確認 (`npm run type-check` 成功)
- [x] ESLint検証確認 (`npm run lint` 成功)
- [x] Next.js Build確認 (`npm run build` 成功)
- [x] API構造テスト作成 (`src/__tests__/api/classes.test.ts`)
- [x] 手動テストガイド作成 (`docs/api-test-classes.md`)

### Architecture Decisions

**エラーハンドリング**: 統一されたAPIレスポンス形式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}
```

**認証統合**: 既存のMVPクッキーベース認証システムを活用

- `authenticate()`: 一般ユーザー認証
- `authenticateAdmin()`: 管理者権限確認

**バリデーション**: Zodスキーマによる厳密なデータ検証

- 日本語エラーメッセージ
- Unicode文字対応 (ひらがな、カタカナ、漢字)
- 学年制限 (5-6年生のみ)

### Code Review Feedback

**Next.js 15対応**: パラメータ型を `Promise<{ id: string }>` に修正
**TypeScript**: 厳密な型定義とインターフェース整備
**セキュリティ**: 管理者権限チェックの適切な実装
**パフォーマンス**: Prisma関係性を使用した効率的なクエリ
