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

from schedule_generator import ScheduleGenerator

class TestDatabaseConnection(unittest.TestCase):
    """データベース接続のテスト"""
    
    def setUp(self):
        """テスト前の準備"""
        logger.debug("テストのセットアップを開始します")
        
        # テスト用のインメモリデータベースを作成
        self.conn = sqlite3.connect(':memory:')
        self.conn.row_factory = sqlite3.Row
        logger.debug("インメモリデータベースを作成しました")
        
        # 必要なテーブルを作成
        self._create_test_tables()
        logger.debug("テスト用のテーブルを作成しました")
        
        # テストデータを挿入
        self._insert_test_data()
        logger.debug("テストデータを挿入しました")
    
    def tearDown(self):
        """テスト後のクリーンアップ"""
        logger.debug("テストのクリーンアップを開始します")
        self.conn.close()
        logger.debug("テストのクリーンアップが完了しました")
    
    def _create_test_tables(self):
        """テスト用のテーブルを作成"""
        cursor = self.conn.cursor()
        
        # grades テーブル
        cursor.execute('''
        CREATE TABLE grades (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT
        )
        ''')
        
        # classes テーブル
        cursor.execute('''
        CREATE TABLE classes (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            grade_id INTEGER NOT NULL,
            FOREIGN KEY (grade_id) REFERENCES grades (id)
        )
        ''')
        
        # committee_members テーブル
        cursor.execute('''
        CREATE TABLE committee_members (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT,
            class_id INTEGER NOT NULL,
            FOREIGN KEY (class_id) REFERENCES classes (id)
        )
        ''')
        
        # libraries テーブル
        cursor.execute('''
        CREATE TABLE libraries (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT,
            capacity INTEGER,
            is_active INTEGER DEFAULT 1
        )
        ''')
        
        # schedules テーブル
        cursor.execute('''
        CREATE TABLE schedules (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            start_date TEXT,
            end_date TEXT
        )
        ''')
        
        # schedule_assignments テーブル
        cursor.execute('''
        CREATE TABLE schedule_assignments (
            id INTEGER PRIMARY KEY,
            schedule_id INTEGER NOT NULL,
            library_id INTEGER NOT NULL,
            day_of_week INTEGER,
            date TEXT,
            time_slot TEXT,
            FOREIGN KEY (schedule_id) REFERENCES schedules (id),
            FOREIGN KEY (library_id) REFERENCES libraries (id)
        )
        ''')
        
        # assignment_members テーブル
        cursor.execute('''
        CREATE TABLE assignment_members (
            id INTEGER PRIMARY KEY,
            assignment_id INTEGER NOT NULL,
            committee_member_id INTEGER NOT NULL,
            FOREIGN KEY (assignment_id) REFERENCES schedule_assignments (id),
            FOREIGN KEY (committee_member_id) REFERENCES committee_members (id)
        )
        ''')
    
    def _insert_test_data(self):
        """テスト用のデータを挿入"""
        cursor = self.conn.cursor()
        
        # grades
        cursor.execute("INSERT INTO grades (id, name, description) VALUES (1, '5年', '5年生')")
        cursor.execute("INSERT INTO grades (id, name, description) VALUES (2, '6年', '6年生')")
        
        # classes
        cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (1, '5年1組', 1)")
        cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (2, '5年2組', 1)")
        cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (3, '6年1組', 2)")
        cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (4, '6年2組', 2)")
        
        # committee_members
        for i in range(1, 4):  # 5年1組に3人
            cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '5年1組生徒{i}', 1)")
        
        for i in range(4, 7):  # 5年2組に3人
            cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '5年2組生徒{i-3}', 2)")
        
        for i in range(7, 10):  # 6年1組に3人
            cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '6年1組生徒{i-6}', 3)")
        
        for i in range(10, 13):  # 6年2組に3人
            cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '6年2組生徒{i-9}', 4)")
        
        # libraries
        cursor.execute("INSERT INTO libraries (id, name, is_active) VALUES (1, '図書室A', 1)")
        cursor.execute("INSERT INTO libraries (id, name, is_active) VALUES (2, '図書室B', 1)")
        
        # 前期スケジュール（後期テスト用）
        cursor.execute("""
        INSERT INTO schedules (id, name, description, start_date, end_date) 
        VALUES (1, '2025年度前期図書委員スケジュール', '前期スケジュール', '2025-04-01', '2025-09-30')
        """)
        
        # 前期の水曜・金曜割り当て
        cursor.execute("INSERT INTO schedule_assignments (id, schedule_id, library_id, day_of_week) VALUES (1, 1, 1, 3)")  # 水曜日
        cursor.execute("INSERT INTO schedule_assignments (id, schedule_id, library_id, day_of_week) VALUES (2, 1, 1, 5)")  # 金曜日
        
        # 水曜日の担当者
        cursor.execute("INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (1, 1)")
        cursor.execute("INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (1, 7)")
        
        # 金曜日の担当者
        cursor.execute("INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (2, 4)")
        cursor.execute("INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (2, 10)")
        
        self.conn.commit()
    
    def test_database_connection(self):
        """データベース接続テスト"""
        logger.debug("test_database_connection テストを開始します")
        
        # 接続が有効かどうか確認
        try:
            cursor = self.conn.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)
            logger.debug("接続が有効であることを確認しました")
        except sqlite3.ProgrammingError:
            self.fail("接続が無効です")
        
        # 複数のクエリを実行しても接続が維持されることを確認
        cursor = self.conn.execute("SELECT COUNT(*) as count FROM committee_members")
        count1 = cursor.fetchone()['count']
        logger.debug(f"図書委員数: {count1}")
        
        cursor = self.conn.execute("SELECT COUNT(*) as count FROM libraries")
        count2 = cursor.fetchone()['count']
        logger.debug(f"図書室数: {count2}")
        
        # 接続がまだ有効かどうか確認
        try:
            cursor = self.conn.execute("SELECT 1")
            result = cursor.fetchone()
            self.assertEqual(result[0], 1)
            logger.debug("複数のクエリ実行後も接続が有効であることを確認しました")
        except sqlite3.ProgrammingError:
            self.fail("接続が無効になっています")
    
    def test_multiple_connections(self):
        """複数のデータベース接続テスト"""
        logger.debug("test_multiple_connections テストを開始します")
        
        # 複数の接続を作成
        conn1 = sqlite3.connect(':memory:')
        conn2 = sqlite3.connect(':memory:')
        
        # 両方の接続が有効かどうか確認
        try:
            cursor1 = conn1.execute("SELECT 1")
            result1 = cursor1.fetchone()
            self.assertEqual(result1[0], 1)
            
            cursor2 = conn2.execute("SELECT 1")
            result2 = cursor2.fetchone()
            self.assertEqual(result2[0], 1)
            
            logger.debug("複数の接続が有効であることを確認しました")
        except sqlite3.ProgrammingError as e:
            self.fail(f"接続が無効です: {e}")
        
        # 一方の接続を閉じても他方は影響を受けないことを確認
        conn1.close()
        
        # conn1が無効になっていることを確認
        with self.assertRaises(sqlite3.ProgrammingError):
            conn1.execute("SELECT 1")
        
        # conn2がまだ有効であることを確認
        try:
            cursor2 = conn2.execute("SELECT 1")
            result2 = cursor2.fetchone()
            self.assertEqual(result2[0], 1)
            logger.debug("一方の接続を閉じても他方は影響を受けないことを確認しました")
        except sqlite3.ProgrammingError as e:
            self.fail(f"conn2が無効になっています: {e}")
        
        # 残りの接続も閉じる
        conn2.close()
        
        # conn2が無効になっていることを確認
        with self.assertRaises(sqlite3.ProgrammingError):
            conn2.execute("SELECT 1")
            
        logger.debug("残りの接続も閉じました")


if __name__ == '__main__':
    unittest.main()
