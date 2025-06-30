import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// シードデータを設定ファイルから読み込み
const seedDataPath = path.join(__dirname, 'seed-data.json')
let seedData: any = {}

try {
  const seedDataContent = fs.readFileSync(seedDataPath, 'utf8')
  seedData = JSON.parse(seedDataContent)
} catch (error) {
  console.error('⚠️ Warning: Could not load seed-data.json, using default values')
  // フォールバック用のデフォルトデータ
  seedData = {
    studentNames: ['田中太郎', '山田花子', '佐藤次郎', '鈴木美咲'],
    rooms: [{ name: '図書室A', capacity: 4 }],
    classes: [{ name: '5年1組', year: 5 }],
    settings: []
  }
}

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

  const settings = seedData.settings || []

  for (const setting of settings) {
    try {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      })
      console.log(`  ✓ Created setting: ${setting.key}`)
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not create setting ${setting.key}:`, error)
    }
  }
}

async function seedRooms() {
  console.log('📚 Creating library rooms...')

  const rooms = seedData.rooms || []

  for (const room of rooms) {
    try {
      await prisma.room.upsert({
        where: { name: room.name },
        update: {},
        create: room,
      })
      console.log(`  ✓ Created room: ${room.name} (capacity: ${room.capacity})`)
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not create room ${room.name}:`, error)
    }
  }
}

async function seedClasses() {
  console.log('🏫 Creating classes...')

  const classes = seedData.classes || []

  for (const classData of classes) {
    try {
      await prisma.class.upsert({
        where: { name_year: { name: classData.name, year: classData.year } },
        update: {},
        create: classData,
      })
      console.log(`  ✓ Created class: ${classData.name}`)
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not create class ${classData.name}:`, error)
    }
  }
}

async function seedStudents() {
  console.log('👥 Creating students...')

  try {
    // クラスデータを取得
    const classes = await prisma.class.findMany()
    const studentNames = seedData.studentNames || []

    if (classes.length === 0) {
      console.warn('  ⚠️ Warning: No classes found, skipping student creation')
      return
    }

    if (studentNames.length === 0) {
      console.warn('  ⚠️ Warning: No student names found in configuration')
      return
    }

    let studentIndex = 0
    const studentsPerClass = 4

    // すべての学生データを準備してからバッチで作成
    const studentsToCreate: Array<{
      name: string
      grade: number
      classId: string
    }> = []

    for (const classData of classes) {
      // 境界チェック：利用可能な学生名があるかチェック
      if (studentIndex >= studentNames.length) {
        console.warn(`  ⚠️ Warning: Not enough student names for class ${classData.name}`)
        break
      }

      // 各クラスに4名の図書委員を準備（利用可能な名前の範囲内で）
      const availableNames = Math.min(studentsPerClass, studentNames.length - studentIndex)
      const studentsInClass = studentNames.slice(studentIndex, studentIndex + availableNames)

      for (const name of studentsInClass) {
        studentsToCreate.push({
          name,
          grade: classData.year,
          classId: classData.id,
        })
      }

      studentIndex += availableNames
    }

    // バッチで学生を作成（パフォーマンス向上）
    if (studentsToCreate.length > 0) {
      try {
        const result = await prisma.student.createMany({
          data: studentsToCreate,
          skipDuplicates: true, // 重複データの防止
        })
        console.log(`  ✓ Created ${result.count} students in batch operation`)
        
        // 作成された学生の詳細をログ出力
        studentsToCreate.forEach((student, index) => {
          const classData = classes.find(c => c.id === student.classId)
          console.log(`    - ${student.name} (${classData?.name || 'Unknown class'})`)
        })
      } catch (error) {
        console.error('  ❌ Error creating students in batch:', error)
        // フォールバック：一つずつ作成
        console.log('  🔄 Falling back to individual creation...')
        await createStudentsIndividually(studentsToCreate, classes)
      }
    }

    console.log(`  ✓ Created students for ${classes.length} classes using ${Math.min(studentIndex, studentNames.length)} names`)
  } catch (error) {
    console.error('  ❌ Error in seedStudents:', error)
    throw error
  }
}

/**
 * フォールバック：学生を一つずつ作成
 */
async function createStudentsIndividually(
  studentsToCreate: Array<{
    name: string
    grade: number
    classId: string
  }>,
  classes: Array<{ id: string; name: string }>
): Promise<void> {
  let createdCount = 0
  
  for (const student of studentsToCreate) {
    try {
      await prisma.student.create({
        data: student,
      })
      const classData = classes.find(c => c.id === student.classId)
      console.log(`    - ${student.name} (${classData?.name || 'Unknown class'})`)
      createdCount++
    } catch (error) {
      console.warn(`  ⚠️ Warning: Could not create student ${student.name}:`, error)
    }
  }
  
  console.log(`  ✓ Created ${createdCount} students individually`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })