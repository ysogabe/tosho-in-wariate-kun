import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
  confirmDestructiveOperation,
  getRequiredEnvVar,
  getBackupDir,
} from './db-helpers'

async function restoreDatabase() {
  const backupFile = process.argv[2]

  if (!backupFile) {
    console.error('❌ Backup file path is required')
    console.log('Usage: npm run db:restore <backup-file-path>')
    console.log(
      'Example: npm run db:restore backups/backup-2025-06-30T10-30-00-000Z.sql'
    )
    process.exit(1)
  }

  // 相対パスの場合は絶対パスに変換
  const absoluteBackupFile = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(process.cwd(), backupFile)

  if (!fs.existsSync(absoluteBackupFile)) {
    console.error(`❌ Backup file not found: ${absoluteBackupFile}`)

    // バックアップディレクトリ内のファイル一覧を表示
    const backupDir = getBackupDir()
    if (fs.existsSync(backupDir)) {
      console.log('\n📁 Available backup files:')
      const files = fs
        .readdirSync(backupDir)
        .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
        .sort()
        .reverse() // 新しいファイルから表示

      if (files.length > 0) {
        files.slice(0, 10).forEach((file) => {
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

  // バックアップファイルのバリデーション
  const validationResult = validateBackupFile(absoluteBackupFile)
  if (!validationResult.isValid) {
    console.error('❌ Invalid backup file:', validationResult.reason)
    process.exit(1)
  }

  try {
    const databaseUrl = getRequiredEnvVar('DATABASE_URL')

    // 破壊的操作の確認プロンプト
    const shouldProceed = await confirmDestructiveOperation(
      'Database Restore',
      `This will overwrite the current database with data from: ${path.basename(absoluteBackupFile)}`
    )

    if (!shouldProceed) {
      console.log('❌ Operation cancelled by user')
      process.exit(0)
    }

    // 本番環境での追加安全チェック
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.FORCE_RESTORE !== 'true'
    ) {
      console.log('')
      console.log('🛑 PRODUCTION ENVIRONMENT DETECTED!')
      console.log('   Run with FORCE_RESTORE=true to bypass this check.')
      process.exit(1)
    }

    console.log('🗄️  Starting database restore...')

    // データベースの安全な復元
    await safelyExecutePsqlRestore(databaseUrl, absoluteBackupFile)

    console.log('✅ Database restored successfully')

    // Prismaの同期
    console.log('🔄 Regenerating Prisma client...')
    await safelyExecuteNpmScript('db:generate')

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

/**
 * psqlを安全に実行してデータベースを復元
 */
function safelyExecutePsqlRestore(
  databaseUrl: string,
  backupFile: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', [databaseUrl], {
      stdio: ['pipe', 'inherit', 'inherit'],
    })

    const inputStream = fs.createReadStream(backupFile)
    inputStream.pipe(child.stdin)

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`psql exited with code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`psql failed to start: ${error.message}`))
    })
  })
}

/**
 * npmスクリプトを安全に実行
 */
function safelyExecuteNpmScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', script], {
      stdio: 'inherit',
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

// バックアップファイルのバリデーション
function validateBackupFile(filePath: string): {
  isValid: boolean
  reason?: string
} {
  try {
    const stats = fs.statSync(filePath)

    // ファイルサイズチェック（空ファイルや極端に小さいファイルを除外）
    if (stats.size < 100) {
      return {
        isValid: false,
        reason: 'File is too small to be a valid backup',
      }
    }

    // ファイル拡張子チェック
    if (!filePath.endsWith('.sql')) {
      return { isValid: false, reason: 'File must have .sql extension' }
    }

    // ファイル内容の基本チェック
    const content = fs.readFileSync(filePath, 'utf8', { flag: 'r' })
    const contentSample = content.substring(0, 1000) // 最初の1000文字をチェック

    // PostgreSQLダンプファイルの基本的なチェック
    const hasPostgreSQLHeader =
      contentSample.includes('PostgreSQL database dump') ||
      contentSample.includes('-- Dumped from database version')
    const hasSQLCommands =
      contentSample.includes('CREATE TABLE') ||
      contentSample.includes('INSERT INTO') ||
      contentSample.includes('COPY ')

    if (!hasPostgreSQLHeader && !hasSQLCommands) {
      return {
        isValid: false,
        reason: 'File does not appear to be a valid PostgreSQL dump',
      }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, reason: `Failed to validate file: ${error}` }
  }
}

// 利用可能なバックアップファイル一覧を表示
function listAvailableBackups(): void {
  const backupDir = getBackupDir()

  if (!fs.existsSync(backupDir)) {
    console.log('📁 No backup directory found')
    return
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.log('📁 No backup files found')
    return
  }

  console.log('📁 Available backup files:')
  files.forEach((file, index) => {
    const filePath = path.join(backupDir, file)
    try {
      const stats = fs.statSync(filePath)
      const size = (stats.size / 1024).toFixed(1) + ' KB'
      console.log(
        `  ${index + 1}. ${file} (${stats.mtime.toLocaleDateString()} ${stats.mtime.toLocaleTimeString()}, ${size})`
      )
    } catch (error) {
      console.log(`  ${index + 1}. ${file} (error reading file info)`)
    }
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
