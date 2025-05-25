// @ts-check
const { setupDatabase } = require('./setup');

/**
 * E2Eテスト実行前にデータベースを初期化する
 */
async function globalSetup() {
  console.log('E2Eテスト開始前にデータベースを初期化します...');
  await setupDatabase();
  console.log('データベース初期化完了');
}

module.exports = globalSetup;
