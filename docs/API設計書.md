# API設計書

バージョン: 1.0  
作成日: 2025年6月26日  
更新日: 2025年6月26日

## 1. 概要

### 1.1. ドキュメントの目的
本ドキュメントは、図書委員当番割り当てシステムのAPI設計を定義し、エンドポイント仕様、リクエスト・レスポンス形式、認証・認可フローを詳細に記述します。

### 1.2. API基盤
- **アーキテクチャ**: Next.js API Routes
- **認証**: Supabase Auth (JWT)
- **バリデーション**: Zod Schema
- **データベース**: Prisma ORM + Supabase PostgreSQL

### 1.3. API設計原則
1. **RESTful設計**: 標準的なHTTPメソッドとステータスコード
2. **型安全性**: TypeScriptによる厳密な型定義
3. **バリデーション**: 入力データの厳密な検証
4. **エラーハンドリング**: 一貫したエラーレスポンス形式
5. **セキュリティ**: 認証・認可の徹底

## 2. 認証・認可設計

### 2.1. 認証フロー

#### JWT Token認証
```typescript
// リクエストヘッダー
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

#### 認証ミドルウェア
```typescript
// src/lib/middleware/auth.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest } from 'next/server'

export async function authenticate(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
```

### 2.2. 認可レベル

| レベル | 説明 | 対象ユーザー |
|--------|------|-------------|
| **PUBLIC** | 認証不要 | 表示専用URL |
| **AUTHENTICATED** | 認証必須 | ログイン済みユーザー |
| **ADMIN** | 管理者権限 | 管理者・教員 |

### 2.3. 表示専用アクセス

#### トークンベース認証
```typescript
// 表示専用URL: /view?token=<view_token>
// リクエストヘッダー
{
  "X-View-Token": "<view_token>"
}
```

## 3. 共通仕様

### 3.1. レスポンス形式

#### 成功レスポンス
```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}
```

#### エラーレスポンス
```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}
```

### 3.2. HTTPステータスコード

| ステータス | 説明 | 用途 |
|-----------|------|------|
| 200 | OK | 成功 |
| 201 | Created | 作成成功 |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 認可エラー |
| 404 | Not Found | リソース未発見 |
| 500 | Internal Server Error | サーバーエラー |

### 3.3. 共通型定義

```typescript
// src/types/api.ts

// 共通レスポンス型
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// ページネーション
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// フィルター
export interface FilterParams {
  search?: string
  isActive?: boolean
  grade?: number
  classId?: string
}
```

## 4. エンドポイント詳細設計

### 4.1. 認証関連 `/api/auth`

#### POST `/api/auth/login`
ユーザーログイン

**Request:**
```typescript
interface LoginRequest {
  email: string
  password: string
}
```

**Response:**
```typescript
interface LoginResponse {
  user: {
    id: string
    email: string
    displayName: string
    role: 'ADMIN' | 'TEACHER'
  }
  session: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
}
```

**実装例:**
```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'ログインに失敗しました'
        }
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### POST `/api/auth/logout`
ユーザーログアウト

**Request:** なし

**Response:**
```typescript
interface LogoutResponse {
  message: string
}
```

### 4.2. クラス管理 `/api/classes`

#### GET `/api/classes`
クラス一覧取得

**認可レベル:** AUTHENTICATED

**Query Parameters:**
```typescript
interface ClassesQuery extends PaginationParams, FilterParams {
  year?: number
}
```

**Response:**
```typescript
interface ClassesResponse {
  classes: Array<{
    id: string
    name: string
    year: number
    studentCount: number
    createdAt: string
    updatedAt: string
  }>
  pagination?: PaginationInfo
}
```

**実装例:**
```typescript
// src/app/api/classes/route.ts
export async function GET(request: Request) {
  try {
    await authenticate(request)
    
    const { searchParams } = new URL(request.url)
    const params = ClassesQuerySchema.parse(Object.fromEntries(searchParams))
    
    const classes = await prisma.class.findMany({
      where: {
        ...(params.year && { year: params.year }),
        ...(params.search && { 
          name: { contains: params.search, mode: 'insensitive' }
        })
      },
      include: {
        _count: {
          select: { students: { where: { isActive: true } } }
        }
      },
      orderBy: [{ year: 'asc' }, { name: 'asc' }]
    })
    
    return NextResponse.json({
      success: true,
      data: {
        classes: classes.map(c => ({
          ...c,
          studentCount: c._count.students
        }))
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### POST `/api/classes`
クラス作成

**認可レベル:** ADMIN

**Request:**
```typescript
interface CreateClassRequest {
  name: string
  year: number
}
```

**Response:**
```typescript
interface CreateClassResponse {
  class: {
    id: string
    name: string
    year: number
    createdAt: string
  }
}
```

#### PUT `/api/classes/[id]`
クラス更新

**認可レベル:** ADMIN

**Request:**
```typescript
interface UpdateClassRequest {
  name?: string
  year?: number
}
```

#### DELETE `/api/classes/[id]`
クラス削除

**認可レベル:** ADMIN

### 4.3. 図書委員管理 `/api/students`

#### GET `/api/students`
図書委員一覧取得

**認可レベル:** AUTHENTICATED

**Query Parameters:**
```typescript
interface StudentsQuery extends PaginationParams, FilterParams {
  classId?: string
  grade?: number
}
```

**Response:**
```typescript
interface StudentsResponse {
  students: Array<{
    id: string
    name: string
    grade: number
    isActive: boolean
    class: {
      id: string
      name: string
    }
    assignmentCount: number
    createdAt: string
    updatedAt: string
  }>
  pagination?: PaginationInfo
}
```

**実装例:**
```typescript
// src/app/api/students/route.ts
export async function GET(request: Request) {
  try {
    await authenticate(request)
    
    const { searchParams } = new URL(request.url)
    const params = StudentsQuerySchema.parse(Object.fromEntries(searchParams))
    
    const students = await prisma.student.findMany({
      where: {
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.grade && { grade: params.grade }),
        ...(params.classId && { classId: params.classId }),
        ...(params.search && { 
          name: { contains: params.search, mode: 'insensitive' }
        })
      },
      include: {
        class: {
          select: { id: true, name: true }
        },
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: [{ grade: 'asc' }, { class: { name: 'asc' } }, { name: 'asc' }]
    })
    
    return NextResponse.json({
      success: true,
      data: {
        students: students.map(s => ({
          ...s,
          assignmentCount: s._count.assignments
        }))
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### POST `/api/students`
図書委員作成

**認可レベル:** ADMIN

**Request:**
```typescript
interface CreateStudentRequest {
  name: string
  classId: string
  grade: number
}
```

**バリデーションスキーマ:**
```typescript
const CreateStudentSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  classId: z.string().uuid('有効なクラスIDを指定してください'),
  grade: z.number().int().min(5).max(6, '学年は5年または6年を指定してください')
})
```

#### PUT `/api/students/[id]`
図書委員更新

**認可レベル:** ADMIN

#### DELETE `/api/students/[id]`
図書委員削除

**認可レベル:** ADMIN

#### GET `/api/students/[id]/schedule`
図書委員個人のスケジュール取得

**認可レベル:** AUTHENTICATED

**Response:**
```typescript
interface StudentScheduleResponse {
  student: {
    id: string
    name: string
    class: { name: string }
  }
  assignments: Array<{
    id: string
    dayOfWeek: number
    term: 'FIRST_TERM' | 'SECOND_TERM'
    room: {
      id: string
      name: string
    }
  }>
}
```

### 4.4. 図書室管理 `/api/rooms`

#### GET `/api/rooms`
図書室一覧取得

**認可レベル:** AUTHENTICATED

**Response:**
```typescript
interface RoomsResponse {
  rooms: Array<{
    id: string
    name: string
    capacity: number
    assignmentCount: number
    createdAt: string
    updatedAt: string
  }>
}
```

#### POST `/api/rooms`
図書室作成

**認可レベル:** ADMIN

**Request:**
```typescript
interface CreateRoomRequest {
  name: string
  capacity?: number
}
```

### 4.5. 当番表管理 `/api/schedules`

#### GET `/api/schedules`
当番表取得

**認可レベル:** AUTHENTICATED（表示専用URLでもアクセス可能）

**Query Parameters:**
```typescript
interface SchedulesQuery {
  term?: 'FIRST_TERM' | 'SECOND_TERM'
  dayOfWeek?: number
  roomId?: string
}
```

**Response:**
```typescript
interface SchedulesResponse {
  schedules: {
    [dayOfWeek: number]: {
      [roomId: string]: Array<{
        id: string
        student: {
          id: string
          name: string
          grade: number
          class: { name: string }
        }
        room: {
          id: string
          name: string
        }
        term: 'FIRST_TERM' | 'SECOND_TERM'
      }>
    }
  }
  meta: {
    totalAssignments: number
    studentsCount: number
    roomsCount: number
  }
}
```

**実装例:**
```typescript
// src/app/api/schedules/route.ts
export async function GET(request: Request) {
  try {
    // 認証またはトークンチェック
    const { searchParams } = new URL(request.url)
    const viewToken = searchParams.get('token')
    
    if (viewToken) {
      await validateViewToken(viewToken)
    } else {
      await authenticate(request)
    }
    
    const params = SchedulesQuerySchema.parse(Object.fromEntries(searchParams))
    
    const assignments = await prisma.assignment.findMany({
      where: {
        ...(params.term && { term: params.term }),
        ...(params.dayOfWeek && { dayOfWeek: params.dayOfWeek }),
        ...(params.roomId && { roomId: params.roomId }),
        student: { isActive: true }
      },
      include: {
        student: {
          include: {
            class: { select: { name: true } }
          }
        },
        room: { select: { id: true, name: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { room: { name: 'asc' } },
        { student: { grade: 'asc' } },
        { student: { name: 'asc' } }
      ]
    })
    
    // データを曜日・図書室別にグループ化
    const schedules = assignments.reduce((acc, assignment) => {
      const day = assignment.dayOfWeek
      const roomId = assignment.roomId
      
      if (!acc[day]) acc[day] = {}
      if (!acc[day][roomId]) acc[day][roomId] = []
      
      acc[day][roomId].push(assignment)
      
      return acc
    }, {} as any)
    
    return NextResponse.json({
      success: true,
      data: {
        schedules,
        meta: {
          totalAssignments: assignments.length,
          studentsCount: new Set(assignments.map(a => a.studentId)).size,
          roomsCount: new Set(assignments.map(a => a.roomId)).size
        }
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### POST `/api/schedules/generate`
当番表自動生成

**認可レベル:** ADMIN

**Request:**
```typescript
interface GenerateScheduleRequest {
  term: 'FIRST_TERM' | 'SECOND_TERM'
  forceRegenerate?: boolean
}
```

**Response:**
```typescript
interface GenerateScheduleResponse {
  result: {
    totalAssignments: number
    studentsAssigned: number
    averageAssignmentsPerStudent: number
    assignmentsByDay: {
      [dayOfWeek: number]: number
    }
    assignmentsByRoom: {
      [roomId: string]: number
    }
  }
  message: string
}
```

**実装例:**
```typescript
// src/app/api/schedules/generate/route.ts
export async function POST(request: Request) {
  try {
    await authenticateAdmin(request)
    
    const body = await request.json()
    const { term, forceRegenerate } = GenerateScheduleSchema.parse(body)
    
    // 既存の割り当てチェック
    const existingAssignments = await prisma.assignment.count({
      where: { term }
    })
    
    if (existingAssignments > 0 && !forceRegenerate) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ASSIGNMENTS_EXIST',
          message: '既に当番表が作成されています。強制再生成を選択してください。'
        }
      }, { status: 400 })
    }
    
    // スケジューリングサービス呼び出し
    const schedulerService = new SchedulerService()
    const result = await schedulerService.generateSchedule(term, forceRegenerate)
    
    return NextResponse.json({
      success: true,
      data: {
        result,
        message: `${term === 'FIRST_TERM' ? '前期' : '後期'}の当番表を生成しました`
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### DELETE `/api/schedules`
当番表削除

**認可レベル:** ADMIN

**Query Parameters:**
```typescript
interface DeleteSchedulesQuery {
  term: 'FIRST_TERM' | 'SECOND_TERM'
}
```

### 4.6. 設定管理 `/api/settings`

#### GET `/api/settings`
設定一覧取得

**認可レベル:** ADMIN

**Response:**
```typescript
interface SettingsResponse {
  settings: Array<{
    id: string
    key: string
    value: string
    description?: string
  }>
}
```

#### PUT `/api/settings/[key]`
設定更新

**認可レベル:** ADMIN

**Request:**
```typescript
interface UpdateSettingRequest {
  value: string
}
```

#### POST `/api/settings/regenerate-view-token`
表示専用トークン再生成

**認可レベル:** ADMIN

**Response:**
```typescript
interface RegenerateTokenResponse {
  token: string
  url: string
  message: string
}
```

### 4.7. 統計・分析 `/api/analytics`

#### GET `/api/analytics/summary`
サマリー統計取得

**認可レベル:** AUTHENTICATED

**Response:**
```typescript
interface AnalyticsSummaryResponse {
  summary: {
    totalStudents: number
    activeStudents: number
    totalClasses: number
    totalRooms: number
    assignmentsByTerm: {
      FIRST_TERM: number
      SECOND_TERM: number
    }
    assignmentsByGrade: {
      [grade: number]: number
    }
  }
}
```

#### GET `/api/analytics/balance`
負荷バランス分析

**認可レベル:** AUTHENTICATED

**Query Parameters:**
```typescript
interface BalanceQuery {
  term?: 'FIRST_TERM' | 'SECOND_TERM'
}
```

**Response:**
```typescript
interface BalanceAnalysisResponse {
  balance: {
    byDay: Array<{
      dayOfWeek: number
      dayName: string
      assignmentCount: number
      studentCount: number
    }>
    byRoom: Array<{
      roomId: string
      roomName: string
      assignmentCount: number
      utilizationRate: number
    }>
    byStudent: Array<{
      studentId: string
      studentName: string
      className: string
      assignmentCount: number
      assignments: Array<{
        dayOfWeek: number
        roomName: string
      }>
    }>
  }
}
```

## 5. エラーハンドリング

### 5.1. エラーコード定義

```typescript
enum ApiErrorCode {
  // 認証エラー
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // ビジネスロジックエラー
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  ASSIGNMENTS_EXIST = 'ASSIGNMENTS_EXIST',
  SCHEDULING_FAILED = 'SCHEDULING_FAILED',
  
  // システムエラー
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

### 5.2. エラーハンドラー実装

```typescript
// src/lib/utils/error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  // Zodバリデーションエラー
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'バリデーションエラーが発生しました',
        details: error.errors
      }
    }, { status: 400 })
  }
  
  // Prismaエラー
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.RESOURCE_ALREADY_EXISTS,
          message: '既に存在するデータです'
        }
      }, { status: 409 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        error: {
          code: ApiErrorCode.RESOURCE_NOT_FOUND,
          message: 'データが見つかりません'
        }
      }, { status: 404 })
    }
  }
  
  // 認証エラー
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({
      success: false,
      error: {
        code: ApiErrorCode.AUTH_REQUIRED,
        message: '認証が必要です'
      }
    }, { status: 401 })
  }
  
  // デフォルトエラー
  return NextResponse.json({
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'サーバーエラーが発生しました'
    }
  }, { status: 500 })
}
```

## 6. バリデーション設計

### 6.1. Zodスキーマ定義

```typescript
// src/lib/schemas/api.ts
import { z } from 'zod'

// 共通スキーマ
export const UuidSchema = z.string().uuid()
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

// 認証スキーマ
export const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください')
})

// クラススキーマ
export const CreateClassSchema = z.object({
  name: z.string().min(1, 'クラス名は必須です').max(20, 'クラス名は20文字以内で入力してください'),
  year: z.number().int().min(5).max(6, '学年は5年または6年を指定してください')
})

export const UpdateClassSchema = CreateClassSchema.partial()

export const ClassesQuerySchema = z.object({
  ...PaginationSchema.shape,
  search: z.string().optional(),
  year: z.coerce.number().int().min(5).max(6).optional()
})

// 図書委員スキーマ
export const CreateStudentSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  classId: UuidSchema,
  grade: z.number().int().min(5).max(6, '学年は5年または6年を指定してください')
})

export const UpdateStudentSchema = CreateStudentSchema.partial()

export const StudentsQuerySchema = z.object({
  ...PaginationSchema.shape,
  search: z.string().optional(),
  classId: UuidSchema.optional(),
  grade: z.coerce.number().int().min(5).max(6).optional(),
  isActive: z.coerce.boolean().optional()
})

// 図書室スキーマ
export const CreateRoomSchema = z.object({
  name: z.string().min(1, '図書室名は必須です').max(30, '図書室名は30文字以内で入力してください'),
  capacity: z.number().int().min(1).max(10).default(2)
})

// スケジュールスキーマ
export const GenerateScheduleSchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']),
  forceRegenerate: z.boolean().default(false)
})

export const SchedulesQuerySchema = z.object({
  term: z.enum(['FIRST_TERM', 'SECOND_TERM']).optional(),
  dayOfWeek: z.coerce.number().int().min(1).max(5).optional(),
  roomId: UuidSchema.optional()
})
```

### 6.2. バリデーションミドルウェア

```typescript
// src/lib/middleware/validation.ts
import { z } from 'zod'

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: Request): Promise<T> => {
    const body = await request.json()
    return schema.parse(body)
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (searchParams: URLSearchParams): T => {
    const params = Object.fromEntries(searchParams)
    return schema.parse(params)
  }
}
```

## 7. 認証・認可実装

### 7.1. 認証ヘルパー

```typescript
// src/lib/auth/helpers.ts
import { createClient } from '@supabase/supabase-js'

export async function authenticate(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }
  
  const token = authHeader.substring(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function authenticateAdmin(request: Request) {
  const user = await authenticate(request)
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!userData || !['ADMIN', 'TEACHER'].includes(userData.role)) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}

export async function validateViewToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'view_only_token')
    .single()
  
  if (!data || data.value !== token) {
    throw new Error('Invalid view token')
  }
}
```

## 8. テスト戦略

### 8.1. APIテスト実装

```typescript
// __tests__/api/classes.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/classes/route'

describe('/api/classes', () => {
  it('should return classes list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid_token'
      }
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.classes)).toBe(true)
  })
  
  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(401)
  })
})
```

### 8.2. 統合テスト

```typescript
// __tests__/integration/schedule-generation.test.ts
describe('Schedule Generation Flow', () => {
  beforeEach(async () => {
    // テストデータセットアップ
    await setupTestData()
  })
  
  it('should generate valid schedule', async () => {
    // 1. クラス作成
    const classResponse = await createClass({
      name: '5年1組',
      year: 5
    })
    
    // 2. 図書委員登録
    const student1 = await createStudent({
      name: '山田太郎',
      classId: classResponse.data.id,
      grade: 5
    })
    
    // 3. スケジュール生成
    const scheduleResponse = await generateSchedule({
      term: 'FIRST_TERM'
    })
    
    expect(scheduleResponse.success).toBe(true)
    expect(scheduleResponse.data.result.totalAssignments).toBeGreaterThan(0)
  })
})
```

## 9. パフォーマンス最適化

### 9.1. キャッシュ戦略

```typescript
// src/lib/cache/redis.ts (将来的に導入予定)
interface CacheConfig {
  ttl: number // Time to live (seconds)
  key: string
}

export async function withCache<T>(
  config: CacheConfig,
  fetcher: () => Promise<T>
): Promise<T> {
  // Redis実装（現在はメモリキャッシュで代替）
  const cached = memoryCache.get(config.key)
  if (cached) {
    return cached as T
  }
  
  const result = await fetcher()
  memoryCache.set(config.key, result, config.ttl)
  
  return result
}
```

### 9.2. データベースクエリ最適化

```typescript
// N+1問題対策のためのインクルード最適化
export async function getStudentsWithDetails() {
  return prisma.student.findMany({
    include: {
      class: {
        select: { id: true, name: true, year: true }
      },
      assignments: {
        include: {
          room: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })
}
```

## 10. 監視・ログ

### 10.1. APIログ

```typescript
// src/lib/logger/api.ts
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number
) {
  console.log({
    type: 'api_request',
    method,
    path,
    userId,
    duration,
    timestamp: new Date().toISOString()
  })
}

export function logApiError(
  method: string,
  path: string,
  error: Error,
  userId?: string
) {
  console.error({
    type: 'api_error',
    method,
    path,
    error: error.message,
    stack: error.stack,
    userId,
    timestamp: new Date().toISOString()
  })
}
```

### 10.2. メトリクス収集

```typescript
// src/lib/metrics/collector.ts
interface ApiMetrics {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
}

export function collectApiMetrics(metrics: ApiMetrics) {
  // Vercel Analytics or external monitoring service
  console.log('API_METRICS:', metrics)
}
```

## 11. まとめ

### 11.1. API設計の特徴
1. **RESTful設計**: 標準的なHTTPメソッドとリソース指向
2. **型安全性**: TypeScriptとZodによる厳密な型定義
3. **セキュリティ**: 適切な認証・認可とバリデーション
4. **エラーハンドリング**: 一貫したエラーレスポンス形式
5. **拡張性**: 将来的な機能追加に対応可能な設計

### 11.2. 運用上の注意点
1. **認証トークン**: 適切な有効期限管理
2. **レート制限**: DoS攻撃対策の検討
3. **ログ監視**: エラー率・レスポンス時間の監視
4. **バックアップ**: 重要なAPI操作前のデータバックアップ

### 11.3. 今後の拡張計画
1. **GraphQL対応**: 複雑なクエリニーズに対応
2. **WebSocket**: リアルタイム更新機能
3. **OpenAPI仕様**: 自動ドキュメント生成
4. **マイクロサービス**: 大規模化時のサービス分離

本API設計は、MVPの要件を満たしつつ、拡張性と保守性を考慮した実用的な設計となっています。