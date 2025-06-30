import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  try {
    // 既存データのクリア（本番環境では注意）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Clearing existing data...')
      await clearDatabase()
    }

    // 基本マスターデータ
    await seedSettings()
    await seedRooms()
    await seedClasses()
    await seedStudents()

    console.log('✅ Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  // 外部キー制約の関係で削除順序に注意
  await prisma.assignment.deleteMany()
  await prisma.student.deleteMany()
  await prisma.class.deleteMany()
  await prisma.room.deleteMany()
  await prisma.setting.deleteMany()
  console.log('  ✓ Database cleared')
}

async function seedSettings() {
  console.log('⚙️ Creating system settings...')

  const settings = [
    {
      key: 'view_only_token',
      value: 'demo-token-replace-in-production',
      description: '表示専用URL用トークン',
    },
    {
      key: 'current_year',
      value: '2025',
      description: '現在の年度',
    },
    {
      key: 'school_name',
      value: '○○小学校',
      description: '学校名',
    },
    {
      key: 'term_start_date',
      value: '2025-04-01',
      description: '年度開始日',
    },
    {
      key: 'schedule_weeks',
      value: '40',
      description: 'スケジュール週数',
    },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
    console.log(`  ✓ Created setting: ${setting.key}`)
  }
}

async function seedRooms() {
  console.log('📚 Creating library rooms...')

  const rooms = [
    {
      name: '図書室A',
      capacity: 4,
    },
    {
      name: '図書室B',
      capacity: 3,
    },
    {
      name: '読み聞かせコーナー',
      capacity: 2,
    },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    })
    console.log(`  ✓ Created room: ${room.name} (capacity: ${room.capacity})`)
  }
}

async function seedClasses() {
  console.log('🏫 Creating classes...')

  const classes = [
    // 5年生
    { name: '5年1組', year: 5 },
    { name: '5年2組', year: 5 },
    { name: '5年3組', year: 5 },
    // 6年生
    { name: '6年1組', year: 6 },
    { name: '6年2組', year: 6 },
    { name: '6年3組', year: 6 },
  ]

  for (const classData of classes) {
    await prisma.class.upsert({
      where: { name_year: { name: classData.name, year: classData.year } },
      update: {},
      create: classData,
    })
    console.log(`  ✓ Created class: ${classData.name}`)
  }
}

async function seedStudents() {
  console.log('👥 Creating students...')

  // クラスデータを取得
  const classes = await prisma.class.findMany()

  const studentNames = [
    '田中太郎',
    '山田花子',
    '佐藤次郎',
    '鈴木美咲',
    '高橋健太',
    '伊藤涼子',
    '渡辺俊介',
    '中村千春',
    '小林大輔',
    '加藤結衣',
    '吉田翔太',
    '森本彩香',
    '清水拓海',
    '斎藤七海',
    '松本航平',
    '井上優奈',
    '藤田裕太',
    '木村さくら',
    '中島悠人',
    '橋本美優',
    '岡田拓也',
    '村田愛子',
    '石井翔太',
    '宮本結菜',
  ]

  let studentIndex = 0

  for (const classData of classes) {
    // 各クラスに4名の図書委員を作成
    const studentsInClass = studentNames.slice(studentIndex, studentIndex + 4)

    for (const name of studentsInClass) {
      await prisma.student.create({
        data: {
          name,
          grade: classData.year,
          classId: classData.id,
        },
      })
      console.log(`  ✓ Created student: ${name} (${classData.name})`)
    }

    studentIndex += 4
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