"""
統合テストスイート
Mock Backendの全機能をテストするためのテストスイート
"""
import unittest
import sys
import os
import logging

# ロギングの設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# テスト対象のモジュールへのパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# テストモジュールのインポート
from test_schedule_generator_fixed_class import TestScheduleGeneratorFixed
from test_integrated_schedule_generator import TestIntegratedScheduleGenerator

class MockBackendTestSuite:
    """統合テストスイートクラス"""
    
    def __init__(self):
        self.suite = unittest.TestSuite()
        self.setup_test_suite()
    
    def setup_test_suite(self):
        """テストスイートのセットアップ"""
        logger.info("テストスイートをセットアップしています...")
        
        # スケジュール生成エンジンテスト
        self.suite.addTest(unittest.makeSuite(TestScheduleGeneratorFixed))
        self.suite.addTest(unittest.makeSuite(TestIntegratedScheduleGenerator))
        
        logger.info("テストスイートのセットアップが完了しました")
    
    def run_tests(self, verbosity=2):
        """テストの実行"""
        logger.info("統合テストを開始します...")
        
        runner = unittest.TextTestRunner(
            verbosity=verbosity,
            stream=sys.stdout,
            descriptions=True,
            failfast=False
        )
        
        result = runner.run(self.suite)
        
        # 結果のサマリー
        logger.info(f"テスト実行結果:")
        logger.info(f"  実行回数: {result.testsRun}")
        logger.info(f"  失敗: {len(result.failures)}")
        logger.info(f"  エラー: {len(result.errors)}")
        logger.info(f"  スキップ: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
        
        success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100) if result.testsRun > 0 else 0
        logger.info(f"  成功率: {success_rate:.1f}%")
        
        return result

def main():
    """メイン関数"""
    test_suite = MockBackendTestSuite()
    result = test_suite.run_tests()
    
    # 終了コードの設定
    if result.failures or result.errors:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
