import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

async function backupDatabase() {
  console.log('💾 Starting database backup...')

  try {
    // バックアップディレクトリの作成
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
      console.log(`📁 Created backup directory: ${BACKUP_DIR}`)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`)

    // 環境変数からデータベース情報を取得
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    console.log(`📥 Creating backup file: backup-${timestamp}.sql`)

    // pg_dump を使用してバックアップ
    const command = `pg_dump "${databaseUrl}" > "${backupFile}"`
    execSync(command, { stdio: 'inherit' })

    console.log(`✅ Backup completed: ${backupFile}`)

    // 古いバックアップファイルの削除（7日以上古いファイル）
    cleanOldBackups()
    
    return backupFile
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

function cleanOldBackups() {
  console.log('🧹 Cleaning old backups...')

  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    let deletedCount = 0

    files.forEach((file) => {
      if (!file.startsWith('backup-') || !file.endsWith('.sql')) {
        return // バックアップファイル以外はスキップ
      }

      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        console.log(`  ✓ Deleted old backup: ${file}`)
        deletedCount++
      }
    })

    if (deletedCount === 0) {
      console.log('  ✓ No old backups to delete')
    } else {
      console.log(`  ✓ Deleted ${deletedCount} old backup(s)`)
    }
  } catch (error) {
    console.warn('⚠️ Warning: Failed to clean old backups:', error)
    // バックアップの削除に失敗しても、メインのバックアップ処理は成功とする
  }
}

// スクリプトが直接実行された場合のみバックアップを実行
if (require.main === module) {
  backupDatabase()
}

export { backupDatabase, cleanOldBackups }