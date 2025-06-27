import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tosho-in-wariate-kun.local',
      name: '管理者',
      role: 'admin',
      password: hashedPassword,
    },
  })

  console.log('管理者ユーザーを作成しました:', admin.email)
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
