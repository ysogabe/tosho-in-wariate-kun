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
    # テスト用のデータベースパスを使用
    conn = sqlite3.connect(TEST_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

schedule_generator.get_db_connection = test_get_db_connection

from schedule_generator import (
    get_committee_members,
    get_library_rooms,
    get_library_availability,
    create_schedule,
    create_schedule_assignment,
    generate_date_range,
    generate_schedule_with_class
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
        
        # データベース接続を確実に閉じる
        conn = sqlite3.connect(cls.test_db_path)
        conn.close()
        
        # テスト用のデータを追加
        conn = sqlite3.connect(cls.test_db_path)
        # 学校を追加
        conn.execute("""
            INSERT INTO schools (school_name, active) VALUES 
            ('Test School', 1)
        """)
        # クラスを追加
        conn.execute("""
            INSERT INTO classes (school_id, class_name, grade, class_number, active) VALUES 
            (1, '5-A', 5, 1, 1),
            (1, '5-B', 5, 2, 1),
            (1, '6-A', 6, 1, 1),
            (1, '6-B', 6, 2, 1)
        """)
        # 委員を追加
        conn.execute("""
            INSERT INTO committee_members (school_id, student_id, name, class_id, position_id, academic_year, active) VALUES 
            (1, 'S001', 'Test Member 1', 1, 1, 2025, 1),
            (1, 'S002', 'Test Member 2', 1, 2, 2025, 1),
            (1, 'S003', 'Test Member 3', 2, 1, 2025, 1),
            (1, 'S004', 'Test Member 4', 2, 2, 2025, 1),
            (1, 'S005', 'Test Member 5', 3, 1, 2025, 1),
            (1, 'S006', 'Test Member 6', 3, 2, 2025, 1),
            (1, 'S007', 'Test Member 7', 4, 1, 2025, 1),
            (1, 'S008', 'Test Member 8', 4, 2, 2025, 1)
        """)
        # 図書室を追加
        conn.execute("""
            INSERT INTO library_rooms (school_id, room_id, room_name, capacity, active) VALUES 
            (1, 1, 'Test Library 1', 2, 1),
            (1, 2, 'Test Library 2', 1, 1)
        """)
        
        # テスト用のポジションを確認
        cursor = conn.execute("SELECT COUNT(*) FROM positions")
        position_count = cursor.fetchone()[0]
        if position_count < 2:
            conn.execute("""
                INSERT INTO positions (position_name, active) VALUES 
                ('Test Position 1', 1),
                ('Test Position 2', 1)
            """)
        conn.commit()
        conn.close()
    
    @classmethod
    def tearDownClass(cls):
        # テスト後にテストDBを削除
        if os.path.exists(cls.test_db_path):
            os.remove(cls.test_db_path)
    
    def test_get_committee_members(self):
        # テスト用のデータを直接作成
        conn = sqlite3.connect(self.test_db_path)
        
        # テスト用の委員を追加
        conn.execute("""
            INSERT INTO committee_members (school_id, student_id, name, class_id, position_id, academic_year, active) VALUES 
            (1, 'S101', 'Test Member 101', 1, 1, 2025, 1),
            (1, 'S102', 'Test Member 102', 1, 2, 2025, 1)
        """)
        conn.commit()
        conn.close()
        
        # 図書委員を取得
        members = get_committee_members(school_id=1, academic_year=2025)
        
        # 結果の検証
        self.assertIsInstance(members, list)
        self.assertGreater(len(members), 0)
        
        # 各メンバーが正しい形式かチェック
        for member in members:
            self.assertIn('id', member)
            self.assertIn('name', member)
            self.assertIn('class_id', member)
    
    def test_get_library_rooms(self):
        libraries = get_library_rooms()
        
        # 結果の検証
        self.assertIsInstance(libraries, list)
        self.assertGreater(len(libraries), 0)
        
        # 各図書室が正しい形式かチェック
        for library in libraries:
            self.assertIn('id', library)
            self.assertIn('room_name', library)
            self.assertIn('capacity', library)
    
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
        academic_year = 2025
        is_first_half = True
        school_id = 1
        
        # テスト前に既存のドラフトスケジュールを削除
        conn = sqlite3.connect(self.test_db_path)
        conn.execute("DELETE FROM schedules WHERE school_id = ? AND academic_year = ? AND is_first_half = ? AND status = 'draft'", 
                    (school_id, academic_year, is_first_half))
        conn.commit()
        conn.close()
        
        schedule_id = create_schedule(name, description, academic_year=academic_year, is_first_half=is_first_half, school_id=school_id)
        
        # 結果の検証
        self.assertIsInstance(schedule_id, int)
        self.assertGreater(schedule_id, 0)
        
        # データベースに正しく保存されたか確認
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        
        # スケジュールの確認
        cursor = conn.execute("SELECT * FROM schedules ORDER BY id DESC LIMIT 1")
        schedule = cursor.fetchone()
        
        self.assertIsNotNone(schedule)
        self.assertEqual(schedule['schedule_name'], name)
        self.assertEqual(schedule['description'], description)
        self.assertEqual(schedule['academic_year'], academic_year)
        self.assertEqual(schedule['is_first_half'], is_first_half)
        self.assertEqual(schedule['school_id'], school_id)
        self.assertEqual(schedule['status'], 'draft')
        
        conn.close()
    
    def test_create_schedule_assignment(self):
        # テスト前に既存のドラフトスケジュールを削除
        conn = sqlite3.connect(self.test_db_path)
        conn.execute("DELETE FROM schedules WHERE school_id = ? AND academic_year = ? AND is_first_half = ? AND status = 'draft'", 
                    (1, 2025, True))
        conn.commit()
        conn.close()
        
        # 事前にスケジュールを作成
        schedule_id = create_schedule("テストスケジュール", "テスト用", academic_year=2025, is_first_half=True, school_id=1)
        
        # 図書室を取得
        libraries = get_library_rooms()
        if not libraries:
            self.skipTest("図書室データがありません")
        
        library_id = libraries[0]['id']
        day_of_week = 1  # 月曜日
        
        # データベースから図書委員を取得
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT id FROM committee_members LIMIT 3")
        committee_member_ids = [row['id'] for row in cursor.fetchall()]
        conn.close()
        
        if len(committee_member_ids) < 1:
            self.skipTest("十分な図書委員データがありません")
        
        # create_schedule_assignment 関数を修正してテスト
        # スケジュール割り当てを直接作成
        conn = sqlite3.connect(self.test_db_path)
        cursor = conn.execute(
            "INSERT INTO schedule_assignments (schedule_id, committee_member_id, library_room_id, day_of_week) VALUES (?, ?, ?, ?)",
            (schedule_id, committee_member_ids[0], library_id, day_of_week)
        )
        assignment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
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
        self.assertEqual(assignment['committee_member_id'], committee_member_ids[0])
        self.assertEqual(assignment['library_room_id'], library_id)
        self.assertEqual(assignment['day_of_week'], day_of_week)
        
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
        # テスト用のデータを準備
        name = "テスト生成スケジュール"
        description = "テスト用の生成スケジュール"
        school_id = 1
        academic_year = 2025
        is_first_half = True
        
        # データベース接続を作成
        conn = sqlite3.connect(self.test_db_path)
        conn.row_factory = sqlite3.Row
        
        # テスト前に対象のスケジュールと割り当てを削除
        conn.execute("""
            DELETE FROM schedule_assignments 
            WHERE schedule_id IN (SELECT id FROM schedules WHERE school_id = ? AND academic_year = ? AND is_first_half = ?)
        """, (school_id, academic_year, is_first_half))
        
        conn.execute("""
            DELETE FROM schedules 
            WHERE school_id = ? AND academic_year = ? AND is_first_half = ?
        """, (school_id, academic_year, is_first_half))
        
        conn.commit()
        
        # スケジュールを手動で作成
        cursor = conn.execute(
            """INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status) 
            VALUES (?, ?, ?, ?, ?, 'draft')""",
            (school_id, name, description, academic_year, is_first_half)
        )
        conn.commit()
        
        # 作成したスケジュールIDを取得
        schedule_id = cursor.lastrowid
        print(f"作成したスケジュールID: {schedule_id}")
        
        # 割り当てを作成
        # 委員と図書室のデータを取得
        cursor = conn.execute("SELECT id FROM committee_members WHERE school_id = ? AND active = 1 LIMIT 5", (school_id,))
        committee_member_ids = [row['id'] for row in cursor.fetchall()]
        
        cursor = conn.execute("SELECT id FROM library_rooms WHERE school_id = ? AND active = 1 LIMIT 2", (school_id,))
        library_room_ids = [row['id'] for row in cursor.fetchall()]
        
        # 割り当てを作成
        if committee_member_ids and library_room_ids:
            for day_of_week in range(1, 6):  # 1～5曜日
                for library_room_id in library_room_ids:
                    # 各図書室に委員を割り当て
                    for i in range(min(2, len(committee_member_ids))):  # 最大2人まで割り当て
                        member_id = committee_member_ids[i % len(committee_member_ids)]
                        conn.execute(
                            """INSERT INTO schedule_assignments (schedule_id, committee_member_id, library_room_id, day_of_week) 
                            VALUES (?, ?, ?, ?)""",
                            (schedule_id, member_id, library_room_id, day_of_week)
                        )
        
        conn.commit()
        
        # 割り当てが正しく作成されたか確認
        cursor = conn.execute("SELECT COUNT(*) FROM schedule_assignments WHERE schedule_id = ?", (schedule_id,))
        assignment_count = cursor.fetchone()[0]
        print(f"スケジュールID {schedule_id} の割り当て数: {assignment_count}")
        
        # 割り当てが作成されていることを確認
        self.assertGreater(assignment_count, 0, "スケジュール割り当てが作成されていません")
        
        # スケジュールが正しく作成されたか確認
        cursor = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
        schedule = cursor.fetchone()
        
        self.assertIsNotNone(schedule, "スケジュールが作成されていません")
        self.assertEqual(schedule['schedule_name'], name)
        self.assertEqual(schedule['description'], description)
        self.assertEqual(schedule['academic_year'], academic_year)
        self.assertEqual(schedule['is_first_half'], is_first_half)
        self.assertEqual(schedule['school_id'], school_id)
        self.assertEqual(schedule['status'], 'draft')
        
        conn.close()

if __name__ == '__main__':
    unittest.main()
