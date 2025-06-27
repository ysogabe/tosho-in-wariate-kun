import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function testDatabaseConnection() {
  try {
    // データベース接続テスト
    await prisma.$connect()

    // 簡単なクエリテスト
    const userCount = await prisma.user.count()

    console.log('SQLite database connection successful')
    console.log(`Current user count: ${userCount}`)

    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
