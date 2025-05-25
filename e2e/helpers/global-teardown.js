// @ts-check

/**
 * E2Eテスト実行後のクリーンアップ
 */
async function globalTeardown() {
  console.log('E2Eテスト完了');
}

module.exports = globalTeardown;
