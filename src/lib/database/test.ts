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

    const classCount = await prisma.class.count()
    console.log(`🏫 Classes in database: ${classCount}`)

    const studentCount = await prisma.student.count()
    console.log(`👨‍🎓 Students in database: ${studentCount}`)

    const roomCount = await prisma.room.count()
    console.log(`📚 Rooms in database: ${roomCount}`)

    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
