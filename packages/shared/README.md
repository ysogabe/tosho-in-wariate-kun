# @tosho/shared

Shared types, interfaces, constants, and validation schemas for the Tosho-in Wariate-kun monorepo.

## Overview

This package contains common TypeScript definitions and utilities that are used across both frontend and backend applications to ensure type safety and consistency.

## Directory Structure

```
packages/shared/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   ├── user.ts         # User-related types
│   │   ├── schedule.ts     # Schedule-related types
│   │   ├── api.ts          # API request/response types
│   │   └── index.ts        # Type exports
│   ├── constants/          # Shared constants
│   │   ├── roles.ts        # User roles and permissions
│   │   ├── time-slots.ts   # Schedule time slot definitions
│   │   └── index.ts        # Constant exports
│   ├── validation/         # Shared validation schemas
│   │   ├── user.schema.ts  # User validation rules
│   │   ├── schedule.schema.ts # Schedule validation rules
│   │   └── index.ts        # Schema exports
│   └── index.ts           # Main package exports
├── test/
│   ├── types.test.ts      # Type validation tests
│   └── validation.test.ts # Schema validation tests
└── package.json
```

## Usage

### Installing in Other Packages

```json
{
  "dependencies": {
    "@tosho/shared": "workspace:*"
  }
}
```

### Importing Types

```typescript
// In frontend or backend code
import { User, Schedule, CreateScheduleRequest } from '@tosho/shared'
import { USER_ROLES, TIME_SLOTS } from '@tosho/shared'
import { validateUser, validateSchedule } from '@tosho/shared'
```

## Type Definitions

### User Types

```typescript
export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  grade?: string
  class?: string
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  LIBRARIAN = 'librarian',
  STUDENT = 'student',
}
```

### Schedule Types

```typescript
export interface Schedule {
  id: number
  date: Date
  timeSlot: TimeSlot
  libraryRoom: string
  memberId: number
  member: User
  createdAt: Date
  updatedAt: Date
}

export interface ScheduleGenerationParams {
  startDate: Date
  endDate: Date
  timeSlots: TimeSlot[]
  libraryRooms: string[]
  memberIds: number[]
  constraints: ScheduleConstraints
}
```

### API Types

```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

## Constants

### User Roles and Permissions

```typescript
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  LIBRARIAN: 'librarian',
  STUDENT: 'student',
} as const

export const PERMISSIONS = {
  CREATE_SCHEDULE: ['admin', 'teacher'],
  EDIT_SCHEDULE: ['admin', 'teacher'],
  VIEW_SCHEDULE: ['admin', 'teacher', 'librarian', 'student'],
  MANAGE_USERS: ['admin'],
} as const
```

### Time Slots and Library Configuration

```typescript
export const TIME_SLOTS = {
  MORNING_PREP: '08:00-08:15',
  BREAK_1: '10:25-10:40',
  LUNCH: '12:25-13:10',
  BREAK_2: '14:30-14:45',
  AFTER_SCHOOL: '15:30-16:00',
} as const

export const LIBRARY_ROOMS = {
  MAIN: 'main-library',
  READING: 'reading-room',
  COMPUTER: 'computer-room',
} as const
```

## Validation Schemas

### User Validation

```typescript
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'teacher', 'librarian', 'student']),
  grade: z.string().optional(),
  class: z.string().optional(),
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserRequest = z.infer<typeof createUserSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
```

### Schedule Validation

```typescript
export const createScheduleSchema = z.object({
  date: z.string().datetime(),
  timeSlot: z.enum([
    '08:00-08:15',
    '10:25-10:40',
    '12:25-13:10',
    '14:30-14:45',
    '15:30-16:00',
  ]),
  libraryRoom: z.enum(['main-library', 'reading-room', 'computer-room']),
  memberId: z.number().positive(),
})

export type CreateScheduleRequest = z.infer<typeof createScheduleSchema>
```

## Development

### Building the Package

```bash
# Build shared types
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Adding New Types

1. **Create the type definition** in appropriate file under `src/types/`
2. **Add validation schema** if needed under `src/validation/`
3. **Export from index.ts** to make it available
4. **Write tests** to ensure type safety
5. **Update documentation** with usage examples

## Best Practices

### Type Safety

- Always use strict TypeScript configurations
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Implement runtime validation with Zod schemas

### Validation

- Create corresponding Zod schemas for all API request types
- Use schema validation in both frontend and backend
- Keep validation rules DRY by centralizing them here
- Include comprehensive error messages

### Versioning

- Follow semantic versioning for breaking changes
- Document migration guides for major version updates
- Use TypeScript's strict mode to catch breaking changes
- Coordinate updates across all dependent packages

## Integration Examples

### Frontend Usage

```typescript
// React component
import { User, USER_ROLES } from '@tosho/shared'

interface UserCardProps {
  user: User
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const isAdmin = user.role === USER_ROLES.ADMIN
  
  return (
    <div>
      <h3>{user.name}</h3>
      <span>{user.role}</span>
      {isAdmin && <AdminBadge />}
    </div>
  )
}
```

### Backend Usage

```typescript
// NestJS service
import { 
  CreateScheduleRequest, 
  createScheduleSchema,
  Schedule 
} from '@tosho/shared'

@Injectable()
export class ScheduleService {
  async createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
    // Validate input with shared schema
    const validatedData = createScheduleSchema.parse(data)
    
    // Business logic implementation
    return this.prisma.schedule.create({
      data: validatedData,
      include: { member: true }
    })
  }
}
```

## Contributing

1. **Add new types** following existing patterns
2. **Include corresponding validation schemas**
3. **Write comprehensive tests**
4. **Update this README** with new exports
5. **Coordinate with frontend/backend teams** for integration