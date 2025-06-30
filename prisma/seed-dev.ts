import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding development database...')

  try {
    // 基本シードを実行
    console.log('📄 Running base seed first...')
    execSync('npm run db:seed', { stdio: 'inherit' })

    // 開発用追加データ
    await seedDevelopmentAssignments()
    await seedMoreTestData()
    await seedDevelopmentSettings()

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
  for (let i = 0; i < Math.min(15, students.length); i++) {
    const student = students[i]
    const room = rooms[i % rooms.length]
    const dayOfWeek = (i % 5) + 1 // 月-金 (1-5)

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

  // 後期の割り当てサンプル
  const secondTermAssignments = []
  for (let i = 15; i < Math.min(30, students.length); i++) {
    const student = students[i]
    const room = rooms[i % rooms.length]
    const dayOfWeek = (i % 5) + 1 // 月-金 (1-5)

    secondTermAssignments.push({
      studentId: student.id,
      roomId: room.id,
      dayOfWeek,
      term: 'SECOND_TERM' as const,
    })
  }

  for (const assignment of secondTermAssignments) {
    await prisma.assignment.create({
      data: assignment,
    })
  }

  console.log(
    `  ✓ Created ${secondTermAssignments.length} second term assignments`
  )
}

async function seedMoreTestData() {
  console.log('🧪 Creating additional test data...')

  // 追加のテストクラス
  const testClass = await prisma.class.upsert({
    where: { name_year: { name: 'テスト組', year: 5 } },
    update: {},
    create: {
      name: 'テスト組',
      year: 5,
    },
  })

  // テストクラス用の学生
  const testStudents = [
    'テスト太郎',
    'テスト花子',
    'サンプル次郎',
    'サンプル美咲',
    'デモ健太',
    'デモ涼子',
  ]

  for (const name of testStudents) {
    await prisma.student.create({
      data: {
        name,
        grade: 5,
        classId: testClass.id,
      },
    })
  }

  console.log(`  ✓ Created test class and ${testStudents.length} test students`)

  // 追加のテスト図書室
  const testRoom = await prisma.room.upsert({
    where: { name: 'テスト図書室' },
    update: {},
    create: {
      name: 'テスト図書室',
      capacity: 1,
    },
  })

  console.log(`  ✓ Created test room: ${testRoom.name}`)
}

async function seedDevelopmentSettings() {
  console.log('⚙️ Creating development-specific settings...')

  const devSettings = [
    {
      key: 'dev_mode',
      value: 'true',
      description: '開発モードフラグ',
    },
    {
      key: 'debug_logs',
      value: 'true',
      description: 'デバッグログの有効化',
    },
    {
      key: 'test_data_visible',
      value: 'true',
      description: 'テストデータの表示',
    },
    {
      key: 'auto_assign_enabled',
      value: 'true',
      description: '自動割り当て機能',
    },
  ]

  for (const setting of devSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
    console.log(`  ✓ Created dev setting: ${setting.key}`)
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