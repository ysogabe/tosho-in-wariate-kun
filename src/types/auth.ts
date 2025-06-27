import { User as PrismaUser } from '@prisma/client'

export interface AuthUser extends PrismaUser {
  role: 'admin' | 'teacher' | 'student'
}

export interface SessionUser {
  id: string
  email: string
  name?: string
  role: string
}
