import { createInterface } from 'readline'
import { execSync } from 'child_process'

/**
 * 安全な確認プロンプト
 */
export async function confirmDestructiveOperation(
  operation: string,
  details?: string
): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    console.log(`⚠️  WARNING: This is a destructive operation!`)
    console.log(`Operation: ${operation}`)
    if (details) {
      console.log(`Details: ${details}`)
    }
    console.log('')
    
    rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
      rl.close()
      const confirmed = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y'
      resolve(confirmed)
    })
  })
}

/**
 * 安全なコマンド実行（コマンドインジェクション対策）
 */
export function safeExecSync(
  command: string,
  args: string[] = [],
  options: { stdio?: 'inherit' | 'pipe'; cwd?: string } = {}
): void {
  try {
    // コマンドと引数を分離して実行
    const fullCommand = `${command} ${args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ')}`
    execSync(fullCommand, { stdio: 'inherit', ...options })
  } catch (error) {
    throw new Error(`Command execution failed: ${error}`)
  }
}

/**
 * 環境変数の安全な取得
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

/**
 * バックアップ保持日数の取得（環境変数または設定値）
 */
export function getBackupRetentionDays(): number {
  const envValue = process.env.BACKUP_RETENTION_DAYS
  if (envValue) {
    const days = parseInt(envValue, 10)
    if (isNaN(days) || days < 1) {
      console.warn(`Invalid BACKUP_RETENTION_DAYS value: ${envValue}. Using default: 7`)
      return 7
    }
    return days
  }
  return 7 // デフォルト値
}

/**
 * バックアップディレクトリパスの取得
 */
export function getBackupDir(): string {
  const customPath = process.env.BACKUP_DIR
  if (customPath) {
    return customPath
  }
  const path = require('path')
  return path.join(process.cwd(), 'backups')
}