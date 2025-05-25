import unittest
import sys
import os
import sqlite3
import datetime

# テスト対象のモジュールをインポートするためにパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# テスト用のデータベースパスを設定
TEST_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_database.db')

# schedule_generator.pyのインポート前にデータベースパスを設定するためにモンキーパッチを適用
import schedule_generator
from schedule_generator import ScheduleGenerator

def test_get_db_connection():
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

schedule_generator.get_db_connection = test_get_db_connection

from schedule_generator import (
    get_committee_members,
    get_libraries,
    get_library_availability,
    create_schedule,
    create_schedule_assignment,
    generate_date_range,
    generate_schedule
)

from db_setup import setup_database
from seed_data import seed_data

class TestScheduleGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # テスト用のデータベースパスを設定
        cls.test_db_path = TEST_DB_PATH
        
        # テストDBをセットアップ
        if os.path.exists(cls.test_db_path):
            os.remove(cls.test_db_path)
        
        # データベースのセットアップとシードデータの投入
        # 更新された関数を使用してカスタムデータベースパスを渡す
        setup_database(cls.test_db_path)
        seed_data(cls.test_db_path)
    
    @classmethod
    def tearDownClass(cls):
        # テスト後にテストDBを削除
        if os.path.exists(cls.test_db_path):
            os.remove(cls.test_db_path)
    
    def test_get_committee_members(self):
        # 5年生と6年生の図書委員を取得
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT id FROM grades WHERE name LIKE '5%' OR name LIKE '6%'")
        grade_ids = [row['id'] for row in cursor.fetchall()]
        conn.close()
        
        members = get_committee_members(grade_ids)
        
        # 結果の検証
        self.assertIsInstance(members, list)
        if members:  # データが存在する場合
            self.assertIn('id', members[0])
            self.assertIn('name', members[0])
            self.assertIn('grade_id', members[0])
            self.assertIn('grade_name', members[0])
    
    def test_get_libraries(self):
        libraries = get_libraries()
        
        # 結果の検証
        self.assertIsInstance(libraries, list)
        if libraries:  # データが存在する場合
            self.assertIn('id', libraries[0])
            self.assertIn('name', libraries[0])
            self.assertIn('capacity', libraries[0])
    
    def test_get_library_availability(self):
        availability = get_library_availability()
        
        # 結果の検証
        self.assertIsInstance(availability, dict)
        # 少なくとも1つの図書室の利用可能時間が存在するか
        if availability:
            library_id = next(iter(availability))
            self.assertIsInstance(library_id, int)
            
            # 少なくとも1つの曜日の利用可能時間が存在するか
            if availability[library_id]:
                day = next(iter(availability[library_id]))
                self.assertIsInstance(day, int)
                self.assertIsInstance(availability[library_id][day], list)
    
    def test_create_schedule(self):
        name = "テストスケジュール"
        description = "テスト用のスケジュール"
        start_date = "2025-04-01"
        end_date = "2025-04-30"
        
        schedule_id = create_schedule(name, description, start_date, end_date)
        
        # 結果の検証
        self.assertIsInstance(schedule_id, int)
        self.assertGreater(schedule_id, 0)
        
        # データベースに正しく保存されたか確認
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
        schedule = cursor.fetchone()
        conn.close()
        
        self.assertIsNotNone(schedule)
        self.assertEqual(schedule['name'], name)
        self.assertEqual(schedule['description'], description)
        self.assertEqual(schedule['start_date'], start_date)
        self.assertEqual(schedule['end_date'], end_date)
    
    def test_create_schedule_assignment(self):
        # 事前にスケジュールを作成
        schedule_id = create_schedule("テストスケジュール", "テスト用", "2025-04-01", "2025-04-30")
        
        # 図書室を取得
        libraries = get_libraries()
        if not libraries:
            self.skipTest("図書室データがありません")
        
        library_id = libraries[0]['id']
        date = "2025-04-01"
        time_slot = "10:00-11:00"
        
        # 図書委員を取得
        members = get_committee_members()
        if not members or len(members) < 2:
            self.skipTest("十分な図書委員データがありません")
        
        committee_member_ids = [members[0]['id'], members[1]['id']]
        
        assignment_id = create_schedule_assignment(
            schedule_id, library_id, date, time_slot, committee_member_ids
        )
        
        # 結果の検証
        self.assertIsInstance(assignment_id, int)
        self.assertGreater(assignment_id, 0)
        
        # データベースに正しく保存されたか確認
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        
        # スケジュール割り当ての確認
        cursor = conn.execute("SELECT * FROM schedule_assignments WHERE id = ?", (assignment_id,))
        assignment = cursor.fetchone()
        
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment['schedule_id'], schedule_id)
        self.assertEqual(assignment['library_id'], library_id)
        self.assertEqual(assignment['date'], date)
        self.assertEqual(assignment['time_slot'], time_slot)
        
        # 割り当てメンバーの確認
        cursor = conn.execute(
            "SELECT committee_member_id FROM assignment_members WHERE assignment_id = ?",
            (assignment_id,)
        )
        assigned_member_ids = [row['committee_member_id'] for row in cursor.fetchall()]
        
        self.assertEqual(len(assigned_member_ids), len(committee_member_ids))
        for member_id in committee_member_ids:
            self.assertIn(member_id, assigned_member_ids)
        
        conn.close()
    
    def test_generate_date_range(self):
        start_date = "2025-04-01"  # 火曜日
        end_date = "2025-04-10"    # 木曜日
        
        date_range = generate_date_range(start_date, end_date)
        
        # 結果の検証
        self.assertIsInstance(date_range, list)
        
        # 平日のみが含まれているか確認
        for date_str, weekday in date_range:
            date = datetime.datetime.strptime(date_str, '%Y-%m-%d')
            # 1=月曜日, 5=金曜日
            self.assertGreaterEqual(weekday, 1)
            self.assertLessEqual(weekday, 5)
    
    def test_generate_schedule(self):
        # テスト用のパラメータ
        name = "テスト生成スケジュール"
        description = "テスト用の生成スケジュール"
        start_date = "2025-04-01"
        end_date = "2025-04-30"
        
        # 5年生と6年生の図書委員を取得
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT id FROM grades WHERE name LIKE '5%' OR name LIKE '6%'")
        grade_ids = [row['id'] for row in cursor.fetchall()]
        conn.close()
        
        members = get_committee_members(grade_ids)
        if not members or len(members) < 4:
            self.skipTest("十分な図書委員データがありません")
        
        selected_member_ids = [member['id'] for member in members[:4]]
        excluded_dates = {}  # 除外日なし
        
        try:
            schedule_id = generate_schedule(
                name, description, start_date, end_date, selected_member_ids, excluded_dates
            )
            
            # 結果の検証
            self.assertIsInstance(schedule_id, int)
            self.assertGreater(schedule_id, 0)
            
            # スケジュールが正しく生成されたか確認
            conn = sqlite3.connect(self.test_db_path)
            conn.row_factory = sqlite3.Row
            
            # スケジュールの確認
            cursor = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
            schedule = cursor.fetchone()
            
            self.assertIsNotNone(schedule)
            self.assertEqual(schedule['name'], name)
            
            # 割り当ての確認
            cursor = conn.execute(
                "SELECT COUNT(*) as count FROM schedule_assignments WHERE schedule_id = ?",
                (schedule_id,)
            )
            assignment_count = cursor.fetchone()['count']
            
            # 少なくとも1つの割り当てが生成されているか
            self.assertGreater(assignment_count, 0)
            
            conn.close()
        except Exception as e:
            self.fail(f"スケジュール生成中に例外が発生しました: {str(e)}")

if __name__ == '__main__':
    unittest.main()
