import { spawn } from 'child_process'
import { confirmDestructiveOperation } from './db-helpers'

async function safeReset() {
  const isDev = process.argv.includes('--dev')
  const operation = isDev ? 'Development Database Reset' : 'Database Reset'
  const details = isDev
    ? 'This will reset the database and populate it with development test data'
    : 'This will reset the database and populate it with production master data'

  try {
    // 破壊的操作の確認プロンプト
    const shouldProceed = await confirmDestructiveOperation(operation, details)

    if (!shouldProceed) {
      console.log('❌ Operation cancelled by user')
      process.exit(0)
    }

    console.log('🗄️  Starting database reset...')

    // データベースリセットを実行
    await safelyExecuteCommand('npm', ['run', 'db:migrate:reset', '--force'])

    // 適切なシードスクリプトを実行
    if (isDev) {
      await safelyExecuteCommand('npm', ['run', 'db:seed:dev'])
    } else {
      await safelyExecuteCommand('npm', ['run', 'db:seed'])
    }

    console.log('✅ Database reset completed successfully!')
  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

/**
 * コマンドを安全に実行
 */
function safelyExecuteCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`)
        )
      }
    })

    child.on('error', (error) => {
      reject(new Error(`${command} failed to start: ${error.message}`))
    })
  })
}

// スクリプトが直接実行された場合のみリセットを実行
if (require.main === module) {
  safeReset()
}

export { safeReset }
