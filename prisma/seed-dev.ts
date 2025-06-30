import { PrismaClient } from '@prisma/client'
import { spawn } from 'child_process'
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
  seedData = {
    testStudentNames: ['テスト太郎', 'テスト花子'],
    developmentSettings: []
  }
}

async function main() {
  console.log('🌱 Seeding development database...')

  try {
    // 基本シードを安全に実行
    console.log('📄 Running base seed first...')
    await safelyExecuteNpmScript('db:seed')

    // 開発用追加データ
    await seedDevelopmentAssignments()
    await seedMoreTestData()
    await seedDevelopmentSettings()

    console.log('✅ Development seeding completed!')
  } catch (error) {
    console.error('❌ Error during development seeding:', error)
    throw error
  }
}

/**
 * npmスクリプトを安全に実行
 */
function safelyExecuteNpmScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', script], {
      stdio: 'inherit'
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm run ${script} exited with code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`npm run ${script} failed to start: ${error.message}`))
    })
  })
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

  // 両学期の割り当てをまとめてバッチ作成
  const allAssignments = [...firstTermAssignments, ...secondTermAssignments]
  
  if (allAssignments.length > 0) {
    try {
      const result = await prisma.assignment.createMany({
        data: allAssignments,
        skipDuplicates: true, // 重複データの防止
      })
      console.log(`  ✓ Created ${result.count} assignments in batch operation`)
      console.log(`    - First term: ${firstTermAssignments.length} assignments`)
      console.log(`    - Second term: ${secondTermAssignments.length} assignments`)
    } catch (error) {
      console.warn('  ⚠️ Warning: Batch assignment creation failed, falling back to individual creation')
      
      // フォールバック：一つずつ作成
      let createdAssignments = 0
      for (const assignment of allAssignments) {
        try {
          await prisma.assignment.create({
            data: assignment,
          })
          createdAssignments++
        } catch (error) {
          console.warn(`  ⚠️ Warning: Could not create assignment:`, error)
        }
      }
      console.log(`  ✓ Created ${createdAssignments} assignments individually`)
    }
  }
}

async function seedMoreTestData() {
  console.log('🧪 Creating additional test data...')

  try {
    // 追加のテストクラス
    const testClass = await prisma.class.upsert({
      where: { name_year: { name: 'テスト組', year: 5 } },
      update: {},
      create: {
        name: 'テスト組',
        year: 5,
      },
    })

    // テストクラス用の学生（設定ファイルから読み込み）
    const testStudentNames = seedData.testStudentNames || ['テスト太郎', 'テスト花子']

    // バッチで学生を作成
    const testStudentsData = testStudentNames.map(name => ({
      name,
      grade: 5,
      classId: testClass.id,
    }))

    try {
      const result = await prisma.student.createMany({
        data: testStudentsData,
        skipDuplicates: true, // 重複データの防止
      })
      console.log(`  ✓ Created test class and ${result.count} test students in batch operation`)
      
      // 作成された学生名をログ出力
      testStudentNames.forEach(name => {
        console.log(`    - ${name}`)
      })
    } catch (error) {
      console.warn('  ⚠️ Warning: Batch creation failed, falling back to individual creation')
      
      // フォールバック：一つずつ作成
      let createdStudents = 0
      for (const studentData of testStudentsData) {
        try {
          await prisma.student.create({
            data: studentData,
          })
          console.log(`    - ${studentData.name}`)
          createdStudents++
        } catch (error) {
          console.warn(`  ⚠️ Warning: Could not create test student ${studentData.name}:`, error)
        }
      }
      console.log(`  ✓ Created test class and ${createdStudents} test students individually`)
    }

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
  } catch (error) {
    console.error('  ❌ Error in seedMoreTestData:', error)
    throw error
  }
}

async function seedDevelopmentSettings() {
  console.log('⚙️ Creating development-specific settings...')

  try {
    const devSettings = seedData.developmentSettings || []

    let createdSettings = 0
    for (const setting of devSettings) {
      try {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting,
        })
        console.log(`  ✓ Created dev setting: ${setting.key}`)
        createdSettings++
      } catch (error) {
        console.warn(`  ⚠️ Warning: Could not create dev setting ${setting.key}:`, error)
      }
    }

    console.log(`  ✓ Created ${createdSettings} development settings`)
  } catch (error) {
    console.error('  ❌ Error in seedDevelopmentSettings:', error)
    throw error
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