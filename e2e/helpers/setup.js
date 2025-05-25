// @ts-check
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

/**
 * E2Eテスト実行前にデータベースを初期化するスクリプト
 */
async function setupDatabase() {
  console.log('データベースを初期化しています...');
  
  const mockBackendPath = path.resolve(__dirname, '../mock_backend');
  
  try {
    // データベースファイルを削除
    await execAsync(`cd ${mockBackendPath} && rm -f database.db`);
    console.log('既存のデータベースファイルを削除しました');
    
    // データベースのセットアップを実行（venv環境を使用）
    await execAsync(`cd ${mockBackendPath} && source venv/bin/activate && python db_setup.py`);
    console.log('データベーステーブルを作成しました');
    
    // シードデータを投入
    await execAsync(`cd ${mockBackendPath} && source venv/bin/activate && python seed_data.py`);
    console.log('シードデータを投入しました');
    
    console.log('データベースの初期化が完了しました');
    return true;
  } catch (error) {
    console.error('データベース初期化中にエラーが発生しました:', error);
    return false;
  }
}

module.exports = { setupDatabase };
