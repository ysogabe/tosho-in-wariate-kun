# Issue #014: 図書委員管理APIルートの作成

**Priority**: Medium  
**Difficulty**: Intermediate  
**Estimated Time**: 4-6 hours  
**Type**: Backend  
**Labels**: backend, api, crud, students

## Description

図書委員情報の管理を行うNext.js API Routesを実装します。図書委員の登録、一覧取得、更新、削除機能とクラスとの関連付けを適切に処理するAPIを提供します。

## Background

API設計書で定義された図書委員管理APIエンドポイントを実装し、クラス情報との整合性を保ちながら図書委員データを安全に管理できるAPIを提供します。

## Acceptance Criteria

- [ ] GET /api/students エンドポイントが実装されている
- [ ] POST /api/students エンドポイントが実装されている
- [ ] PUT /api/students/[id] エンドポイントが実装されている
- [ ] DELETE /api/students/[id] エンドポイントが実装されている
- [ ] GET /api/students/[id]/schedule エンドポイントが実装されている
- [ ] クラスとの関連付けが正しく実装されている
- [ ] フィルタ・検索機能が実装されている
- [ ] 適切なバリデーションとエラーハンドリングが実装されている

## Implementation Guidelines

### API Routes Implementation

#### 1. GET /api/students

##### src/app/api/students/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const StudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
  grade: z.coerce.number().int().min(5).max(6).optional(),
  isActive: z.coerce.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const params = StudentsQuerySchema.parse(Object.fromEntries(searchParams))

    const where = {
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.grade && { grade: params.grade }),
      ...(params.classId && { classId: params.classId }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: {
            select: { id: true, name: true, year: true },
          },
          _count: {
            select: { assignments: true },
          },
        },
        orderBy: [
          { grade: 'asc' },
          { class: { name: 'asc' } },
          { name: 'asc' },
        ],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        students: students.map((s) => ({
          ...s,
          assignmentCount: s._count.assignments,
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
    const { name, classId, grade } = CreateStudentSchema.parse(body)

    // クラスの存在確認
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CLASS_NOT_FOUND',
            message: '指定されたクラスが見つかりません',
          },
        },
        { status: 400 }
      )
    }

    // 同名・同クラスチェック
    const existingStudent = await prisma.student.findFirst({
      where: { name, classId },
    })

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_ALREADY_EXISTS',
            message: '同じ名前の図書委員が同じクラスに既に存在します',
          },
        },
        { status: 409 }
      )
    }

    const newStudent = await prisma.student.create({
      data: { name, classId, grade },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          student: {
            ...newStudent,
            assignmentCount: newStudent._count.assignments,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

const CreateStudentSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
  classId: z.string().uuid('有効なクラスIDを指定してください'),
  grade: z.number().int().min(5).max(6, '学年は5年または6年を指定してください'),
})
```

#### 2. Student Detail and Schedule API

##### src/app/api/students/[id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticateAdmin } from '@/lib/auth/helpers'
import { z } from 'zod'

const UpdateStudentSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  classId: z.string().uuid().optional(),
  grade: z.number().int().min(5).max(6).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticate(request)

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        assignments: {
          include: {
            room: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ term: 'asc' }, { dayOfWeek: 'asc' }],
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: '図書委員が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { student },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAdmin(request)

    const body = await request.json()
    const updateData = UpdateStudentSchema.parse(body)

    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
    })

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: '図書委員が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // クラス変更時の確認
    if (updateData.classId && updateData.classId !== existingStudent.classId) {
      const classExists = await prisma.class.findUnique({
        where: { id: updateData.classId },
      })

      if (!classExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CLASS_NOT_FOUND',
              message: '指定されたクラスが見つかりません',
            },
          },
          { status: 400 }
        )
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: updateData,
      include: {
        class: {
          select: { id: true, name: true, year: true },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        student: {
          ...updatedStudent,
          assignmentCount: updatedStudent._count.assignments,
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

    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    })

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: '図書委員が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    // 割り当てがある場合の警告
    if (existingStudent._count.assignments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_HAS_ASSIGNMENTS',
            message:
              'この図書委員には当番が割り当てられているため削除できません。先に当番表をリセットしてください。',
          },
        },
        { status: 409 }
      )
    }

    await prisma.student.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: '図書委員が削除されました',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 3. Student Schedule API

##### src/app/api/students/[id]/schedule/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { authenticate } from '@/lib/auth/helpers'
import { z } from 'zod'

const ScheduleQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticate(request)

    const { searchParams } = new URL(request.url)
    const { term } = ScheduleQuerySchema.parse(Object.fromEntries(searchParams))

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: { name: true },
        },
        assignments: {
          where: term ? { term } : undefined,
          include: {
            room: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ term: 'asc' }, { dayOfWeek: 'asc' }],
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: '図書委員が見つかりません',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          class: student.class,
        },
        assignments: student.assignments,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Resources

- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

## Implementation Results

### Work Completed

- [ ] GET /api/students 実装
- [ ] POST /api/students 実装
- [ ] PUT /api/students/[id] 実装
- [ ] DELETE /api/students/[id] 実装
- [ ] GET /api/students/[id]/schedule 実装
- [ ] クラス関連付け実装
- [ ] バリデーション・エラーハンドリング実装

### Testing Results

- [ ] CRUD操作の確認
- [ ] フィルタ・検索機能の確認
- [ ] クラス関連付けの確認
- [ ] 制約チェックの確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->
