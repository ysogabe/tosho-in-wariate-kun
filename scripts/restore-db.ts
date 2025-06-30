import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function restoreDatabase() {
  const backupFile = process.argv[2]

  if (!backupFile) {
    console.error('❌ Backup file path is required')
    console.log('Usage: npm run db:restore <backup-file-path>')
    console.log('Example: npm run db:restore backups/backup-2025-06-30T10-30-00-000Z.sql')
    process.exit(1)
  }

  // 相対パスの場合は絶対パスに変換
  const absoluteBackupFile = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(process.cwd(), backupFile)

  if (!fs.existsSync(absoluteBackupFile)) {
    console.error(`❌ Backup file not found: ${absoluteBackupFile}`)
    
    // バックアップディレクトリ内のファイル一覧を表示
    const backupDir = path.join(process.cwd(), 'backups')
    if (fs.existsSync(backupDir)) {
      console.log('\n📁 Available backup files:')
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse() // 新しいファイルから表示
      
      if (files.length > 0) {
        files.slice(0, 10).forEach(file => {
          const filePath = path.join(backupDir, file)
          const stats = fs.statSync(filePath)
          console.log(`  - ${file} (${stats.mtime.toISOString()})`)
        })
        if (files.length > 10) {
          console.log(`  ... and ${files.length - 10} more files`)
        }
      } else {
        console.log('  No backup files found')
      }
    }
    
    process.exit(1)
  }

  console.log(`📥 Restoring database from: ${absoluteBackupFile}`)

  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    // 復元前の確認
    console.log('⚠️  WARNING: This will overwrite the current database!')
    console.log('   Make sure you have a backup of the current data if needed.')
    
    // 本番環境での安全チェック
    if (process.env.NODE_ENV === 'production') {
      console.log('')
      console.log('🛑 PRODUCTION ENVIRONMENT DETECTED!')
      console.log('   Please manually confirm the restore operation.')
      console.log('   Run with FORCE_RESTORE=true to bypass this check.')
      
      if (process.env.FORCE_RESTORE !== 'true') {
        process.exit(1)
      }
    }

    console.log('🗄️  Starting database restore...')

    // データベースの復元
    const command = `psql "${databaseUrl}" < "${absoluteBackupFile}"`
    execSync(command, { stdio: 'inherit' })

    console.log('✅ Database restored successfully')

    // Prismaの同期
    console.log('🔄 Regenerating Prisma client...')
    execSync('npm run db:generate', { stdio: 'inherit' })

    console.log('✅ Prisma client regenerated')
    console.log('')
    console.log('🎉 Database restore completed successfully!')
    console.log('   The database has been restored from the backup file.')
    
  } catch (error) {
    console.error('❌ Restore failed:', error)
    console.log('')
    console.log('💡 Troubleshooting tips:')
    console.log('   1. Make sure PostgreSQL is running')
    console.log('   2. Verify DATABASE_URL is correct')
    console.log('   3. Check if the backup file is valid')
    console.log('   4. Ensure you have sufficient database permissions')
    process.exit(1)
  }
}

// バックアップファイルのバリデーション
function validateBackupFile(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // PostgreSQLダンプファイルの基本的なチェック
    const hasPostgreSQLHeader = content.includes('PostgreSQL database dump')
    const hasSQLCommands = content.includes('CREATE TABLE') || content.includes('INSERT INTO')
    
    return hasPostgreSQLHeader || hasSQLCommands
  } catch (error) {
    return false
  }
}

// 利用可能なバックアップファイル一覧を表示
function listAvailableBackups(): void {
  const backupDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    console.log('📁 No backup directory found')
    return
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.log('📁 No backup files found')
    return
  }

  console.log('📁 Available backup files:')
  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file)
    const stats = fs.statSync(filePath)
    const size = (stats.size / 1024).toFixed(1) + ' KB'
    console.log(`  ${index + 1}. ${file} (${stats.mtime.toLocaleDateString()} ${stats.mtime.toLocaleTimeString()}, ${size})`)
  })
}

// CLI引数チェック
if (process.argv.includes('--list') || process.argv.includes('-l')) {
  listAvailableBackups()
  process.exit(0)
}

// スクリプトが直接実行された場合のみ復元を実行
if (require.main === module) {
  restoreDatabase()
}

export { restoreDatabase, validateBackupFile, listAvailableBackups }