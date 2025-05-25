import unittest
import sqlite3
import os
import sys
import logging

# ロギングの設定
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# テスト対象のモジュールへのパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestActualDatabase(unittest.TestCase):
    """実際のデータベースファイルのテスト"""
    
    def setUp(self):
        """テスト前の準備"""
        logger.debug("テストのセットアップを開始します")
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tosho_in_wariate.db')
        logger.debug(f"データベースパス: {self.db_path}")
        
        # データベースファイルが存在するか確認
        self.db_exists = os.path.exists(self.db_path)
        logger.debug(f"データベースファイルの存在: {self.db_exists}")
    
    def test_database_exists(self):
        """データベースファイルの存在確認"""
        logger.debug("test_database_exists テストを開始します")
        self.assertTrue(self.db_exists, "データベースファイルが存在しません")
        logger.debug("データベースファイルが存在することを確認しました")
    
    def test_database_tables(self):
        """データベーステーブルの確認"""
        if not self.db_exists:
            self.skipTest("データベースファイルが存在しないためスキップします")
        
        logger.debug("test_database_tables テストを開始します")
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            # テーブルの存在確認
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row['name'] for row in cursor.fetchall()]
            logger.debug(f"データベースのテーブル: {tables}")
            
            # 必要なテーブルが存在するか確認
            required_tables = [
                'grades', 'classes', 'committee_members', 'libraries',
                'schedules', 'schedule_assignments'
            ]
            
            for table in required_tables:
                self.assertIn(table, tables, f"テーブル '{table}' が存在しません")
            
            logger.debug("必要なテーブルが存在することを確認しました")
            
            # 各テーブルのレコード数を確認
            for table in tables:
                cursor = conn.execute(f"SELECT COUNT(*) as count FROM {table}")
                count = cursor.fetchone()['count']
                logger.debug(f"テーブル {table} のレコード数: {count}")
        finally:
            conn.close()
    
    def test_database_connection_management(self):
        """データベース接続管理のテスト"""
        if not self.db_exists:
            self.skipTest("データベースファイルが存在しないためスキップします")
        
        logger.debug("test_database_connection_management テストを開始します")
        
        # 複数の接続を作成して操作
        conn1 = sqlite3.connect(self.db_path)
        conn1.row_factory = sqlite3.Row
        
        conn2 = sqlite3.connect(self.db_path)
        conn2.row_factory = sqlite3.Row
        
        try:
            # 両方の接続が有効かどうか確認
            cursor1 = conn1.execute("SELECT 1")
            result1 = cursor1.fetchone()
            self.assertEqual(result1[0], 1)
            
            cursor2 = conn2.execute("SELECT 1")
            result2 = cursor2.fetchone()
            self.assertEqual(result2[0], 1)
            
            logger.debug("複数の接続が有効であることを確認しました")
            
            # conn1でテーブル一覧を取得
            cursor1 = conn1.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables1 = [row['name'] for row in cursor1.fetchall()]
            
            # conn2でテーブル一覧を取得
            cursor2 = conn2.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables2 = [row['name'] for row in cursor2.fetchall()]
            
            # 両方の接続で同じテーブル一覧が取得できることを確認
            self.assertEqual(tables1, tables2)
            logger.debug("複数の接続で同じテーブル一覧が取得できることを確認しました")
            
            # conn1を閉じてもconn2は使用可能なことを確認
            conn1.close()
            
            # conn2でクエリを実行
            cursor2 = conn2.execute("SELECT 1")
            result2 = cursor2.fetchone()
            self.assertEqual(result2[0], 1)
            logger.debug("一方の接続を閉じても他方は使用可能であることを確認しました")
            
        finally:
            # 念のため両方の接続を閉じる
            try:
                conn1.close()
            except:
                pass
            
            try:
                conn2.close()
            except:
                pass


if __name__ == '__main__':
    unittest.main()
