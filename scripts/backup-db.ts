import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getRequiredEnvVar, getBackupRetentionDays, getBackupDir } from './db-helpers'

async function backupDatabase() {
  console.log('💾 Starting database backup...')

  try {
    const BACKUP_DIR = getBackupDir()
    
    // バックアップディレクトリの作成
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
      console.log(`📁 Created backup directory: ${BACKUP_DIR}`)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`)

    // 環境変数からデータベース情報を安全に取得
    const databaseUrl = getRequiredEnvVar('DATABASE_URL')

    console.log(`📥 Creating backup file: backup-${timestamp}.sql`)

    // pg_dump を安全に実行（コマンドインジェクション対策）
    await safelyExecutePgDump(databaseUrl, backupFile)

    console.log(`✅ Backup completed: ${backupFile}`)

    // 古いバックアップファイルの削除
    cleanOldBackups(BACKUP_DIR)
    
    return backupFile
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

/**
 * pg_dumpを安全に実行（コマンドインジェクション対策）
 */
function safelyExecutePgDump(databaseUrl: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // pg_dumpコマンドを安全に実行
    const child = spawn('pg_dump', [databaseUrl], {
      stdio: ['inherit', 'pipe', 'inherit']
    })

    // 出力ファイルストリームの作成
    const outputStream = fs.createWriteStream(outputFile)
    
    child.stdout.pipe(outputStream)

    child.on('close', (code) => {
      outputStream.end()
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`pg_dump exited with code ${code}`))
      }
    })

    child.on('error', (error) => {
      outputStream.end()
      reject(new Error(`pg_dump failed to start: ${error.message}`))
    })
  })
}

function cleanOldBackups(backupDir: string) {
  console.log('🧹 Cleaning old backups...')

  try {
    const retentionDays = getBackupRetentionDays()
    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    let deletedCount = 0

    files.forEach((file) => {
      if (!file.startsWith('backup-') || !file.endsWith('.sql')) {
        return // バックアップファイル以外はスキップ
      }

      const filePath = path.join(backupDir, file)
      
      try {
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          console.log(`  ✓ Deleted old backup: ${file}`)
          deletedCount++
        }
      } catch (fileError) {
        console.warn(`  ⚠️ Warning: Could not process backup file ${file}:`, fileError)
      }
    })

    if (deletedCount === 0) {
      console.log('  ✓ No old backups to delete')
    } else {
      console.log(`  ✓ Deleted ${deletedCount} old backup(s) (retention: ${retentionDays} days)`)
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