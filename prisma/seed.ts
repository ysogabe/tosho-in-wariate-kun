import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 設定データ
  await prisma.setting.upsert({
    where: { key: 'view_only_token' },
    update: {},
    create: {
      key: 'view_only_token',
      value: 'demo-token-replace-in-production',
      description: '表示専用URL用トークン',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'current_year' },
    update: {},
    create: {
      key: 'current_year',
      value: '2025',
      description: '現在の年度',
    },
  })

  await prisma.setting.upsert({
    where: { key: 'school_name' },
    update: {},
    create: {
      key: 'school_name',
      value: '○○小学校',
      description: '学校名',
    },
  })

  // 図書室データ
  const roomA = await prisma.room.upsert({
    where: { name: '図書室A' },
    update: {},
    create: {
      name: '図書室A',
      capacity: 2,
    },
  })

  const roomB = await prisma.room.upsert({
    where: { name: '図書室B' },
    update: {},
    create: {
      name: '図書室B',
      capacity: 2,
    },
  })

  // クラスデータ
  const class5_1 = await prisma.class.upsert({
    where: { name_year: { name: '5年1組', year: 5 } },
    update: {},
    create: {
      name: '5年1組',
      year: 5,
    },
  })

  const class5_2 = await prisma.class.upsert({
    where: { name_year: { name: '5年2組', year: 5 } },
    update: {},
    create: {
      name: '5年2組',
      year: 5,
    },
  })

  // 図書委員データ
  const student1 = await prisma.student.create({
    data: {
      name: '田中花子',
      classId: class5_1.id,
      grade: 5,
    },
  })

  const student2 = await prisma.student.create({
    data: {
      name: '佐藤次郎',
      classId: class5_2.id,
      grade: 5,
    },
  })

  console.log('Seed data created successfully')
  console.log('図書室:', roomA.name, roomB.name)
  console.log('クラス:', class5_1.name, class5_2.name)
  console.log('図書委員:', student1.name, student2.name)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
