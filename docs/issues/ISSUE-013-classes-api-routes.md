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

- [ ] GET /api/classes 実装
- [ ] POST /api/classes 実装
- [ ] PUT /api/classes/[id] 実装
- [ ] DELETE /api/classes/[id] 実装
- [ ] バリデーション実装
- [ ] エラーハンドリング実装
- [ ] 認証・認可チェック実装

### Testing Results

- [ ] Postman/Thunder Clientでのテスト確認
- [ ] バリデーションエラーの確認
- [ ] 認証エラーの確認
- [ ] 正常系・異常系のテスト完了

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->
