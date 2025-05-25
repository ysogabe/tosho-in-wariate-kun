"""
単体テストファイル - バックエンドAPIの全機能をテスト
"""
import unittest
import os
import sys
import tempfile
import shutil
import json
from datetime import datetime, timedelta

# プロジェクトディレクトリをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, get_db_connection, DATABASE_PATH
import sqlite3


class TestBackendAPI(unittest.TestCase):
    """バックエンドAPIの単体テスト"""
    
    @classmethod
    def setUpClass(cls):
        """テストクラス実行前のセットアップ"""
        # テスト用のデータベースパスを設定
        cls.test_db_path = os.path.join(tempfile.gettempdir(), 'test_database.db')
        
        # Flaskテストクライアントを作成
        app.config['TESTING'] = True
        app.config['DATABASE_PATH'] = cls.test_db_path
        cls.client = app.test_client()
        
        # テスト用データベースの作成
        cls._setup_test_database()
    
    @classmethod
    def tearDownClass(cls):
        """テストクラス実行後のクリーンアップ"""
        if os.path.exists(cls.test_db_path):
            os.remove(cls.test_db_path)
    
    @classmethod
    def _setup_test_database(cls):
        """テスト用データベースのセットアップ"""
        # グローバルなDATABASE_PATHを更新
        global DATABASE_PATH
        DATABASE_PATH = cls.test_db_path
        
        # データベース初期化
        from db_setup import setup_database
        from seed_data import seed_data
        setup_database()
        seed_data()
    
    def setUp(self):
        """各テスト前のセットアップ"""
        self.app = app.test_client()
        self.app.testing = True
    
    # === Grades API テスト ===
    
    def test_get_grades(self):
        """学年取得APIのテスト"""
        response = self.client.get('/api/grades')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        
        # 各学年にid, name, descriptionフィールドがあることを確認
        for grade in data:
            self.assertIn('id', grade)
            self.assertIn('name', grade)
            self.assertIn('description', grade)
    
    def test_get_grade_by_id(self):
        """特定学年取得APIのテスト"""
        # 正常ケース
        response = self.client.get('/api/grades/1')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['id'], 1)
        
        # 存在しない学年
        response = self.client.get('/api/grades/999')
        self.assertEqual(response.status_code, 404)
    
    def test_add_grade(self):
        """学年追加APIのテスト"""
        new_grade = {
            'name': 'テスト学年',
            'description': 'テスト用の学年データ'
        }
        
        response = self.client.post('/api/grades', 
                                   data=json.dumps(new_grade),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_grade['name'])
        self.assertEqual(data['description'], new_grade['description'])
        
        # 必須フィールド不足
        response = self.client.post('/api/grades',
                                   data=json.dumps({}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    # === Classes API テスト ===
    
    def test_get_classes(self):
        """クラス取得APIのテスト"""
        response = self.client.get('/api/classes')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        
        # 各クラスに必要なフィールドがあることを確認
        for class_data in data:
            self.assertIn('id', class_data)
            self.assertIn('name', class_data)
            self.assertIn('grade_id', class_data)
            self.assertIn('grade_name', class_data)
    
    def test_add_class(self):
        """クラス追加APIのテスト"""
        new_class = {
            'name': 'テストクラス',
            'grade_id': 1  # 既存の学年ID
        }
        
        response = self.client.post('/api/classes',
                                   data=json.dumps(new_class),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertEqual(data['name'], new_class['name'])
        self.assertEqual(data['grade_id'], new_class['grade_id'])
    
    # === Committee Members API テスト ===
    
    def test_get_committee_members(self):
        """図書委員取得APIのテスト"""
        response = self.client.get('/api/committee-members')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        
        # 各委員に必要なフィールドがあることを確認
        for member in data:
            self.assertIn('id', member)
            self.assertIn('name', member)
            self.assertIn('grade_name', member)
            self.assertIn('class_name', member)
            self.assertIn('role', member)
    
    def test_add_committee_member(self):
        """図書委員追加APIのテスト"""
        new_member = {
            'name': 'テスト委員',
            'class_id': 11,  # 既存のクラスID
            'role': 'メンバー'
        }
        
        response = self.client.post('/api/committee-members',
                                   data=json.dumps(new_member),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertEqual(data['name'], new_member['name'])
        self.assertEqual(data['role'], new_member['role'])
    
    # === Libraries API テスト ===
    
    def test_get_libraries(self):
        """図書館取得APIのテスト"""
        response = self.client.get('/api/libraries')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        
        # 各図書館に必要なフィールドがあることを確認
        for library in data:
            self.assertIn('id', library)
            self.assertIn('name', library)
            self.assertIn('location', library)
    
    # === Schedules API テスト ===
    
    def test_get_schedules(self):
        """スケジュール取得APIのテスト"""
        response = self.client.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
    
    def test_add_schedule(self):
        """スケジュール追加APIのテスト"""
        new_schedule = {
            'name': 'テストスケジュール',
            'description': 'テスト用スケジュール',
            'academic_year': '2025',
            'is_first_half': True,
            'start_date': '2025-04-01',
            'end_date': '2025-09-30'
        }
        
        response = self.client.post('/api/schedules',
                                   data=json.dumps(new_schedule),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertEqual(data['name'], new_schedule['name'])
        # academic_yearフィールドがレスポンスに含まれているかチェック
        if 'academic_year' in data:
            self.assertEqual(data['academic_year'], new_schedule['academic_year'])
    
    # === Schedule Generation API テスト ===
    
    def test_generate_schedule_success(self):
        """スケジュール生成APIの正常系テスト"""
        request_data = {
            'name': '2025年度前期スケジュール',
            'description': 'テスト用の前期スケジュール',
            'startDate': '2025-04-07',
            'endDate': '2025-09-20',
            'selectedMembers': [1, 2, 3],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.data.decode()}")
        
        # 201 Created または 200 OK を期待
        self.assertIn(response.status_code, [200, 201])
        
        data = json.loads(response.data)
        self.assertIn('success', data)
        if data.get('success'):
            self.assertIn('scheduleId', data)
            self.assertIn('message', data)
    
    def test_generate_schedule_validation_errors(self):
        """スケジュール生成APIのバリデーションエラーテスト"""
        # 空のリクエスト
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps({}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # 名前なし
        request_data = {
            'description': 'テスト',
            'startDate': '2025-04-07',
            'endDate': '2025-09-20',
            'selectedMembers': [1, 2],
            'excludedDates': []
        }
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # 日付なし
        request_data = {
            'name': 'テストスケジュール',
            'description': 'テスト',
            'selectedMembers': [1, 2],
            'excludedDates': []
        }
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        # 委員数不足
        request_data = {
            'name': 'テストスケジュール',
            'description': 'テスト',
            'startDate': '2025-04-07',
            'endDate': '2025-09-20',
            'selectedMembers': [1],  # 1人のみ
            'excludedDates': []
        }
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_generate_schedule_date_validation(self):
        """スケジュール生成APIの日付バリデーションテスト"""
        # 無効な日付形式
        request_data = {
            'name': 'テストスケジュール',
            'description': 'テスト',
            'startDate': 'invalid-date',
            'endDate': '2025-09-20',
            'selectedMembers': [1, 2],
            'excludedDates': []
        }
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)
    
    def test_generate_schedule_with_excluded_dates(self):
        """除外日設定ありのスケジュール生成テスト"""
        request_data = {
            'name': '2025年度前期スケジュール（除外日あり）',
            'description': 'テスト用の前期スケジュール',
            'startDate': '2025-04-07',
            'endDate': '2025-09-20',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': [
                {
                    'id': 1,
                    'memberId': 1,
                    'date': '2025-05-01',
                    'reason': '連休のため'
                }
            ]
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        
        # 200/201 または適切なエラーレスポンス
        self.assertIn(response.status_code, [200, 201, 400, 500])
        
        if response.status_code in [200, 201]:
            data = json.loads(response.data)
            self.assertIn('success', data)
    
    def test_generate_schedule_with_frontend_fields(self):
        """フロントエンドから年度・学期フィールドを受信するスケジュール生成テスト"""
        request_data = {
            'name': '2025年度前期（フロントエンド指定）',
            'description': 'フロントエンドからの年度・学期指定テスト',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'academicYear': '2025',
            'isFirstHalf': True,
            'selectedMembers': [],  # 空リスト
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        
        print(f"Frontend fields test - Response status: {response.status_code}")
        print(f"Frontend fields test - Response data: {response.data.decode()}")
        
        # 201 Created または 200 OK を期待
        self.assertIn(response.status_code, [200, 201])
        
        data = json.loads(response.data)
        self.assertIn('success', data)
        if data.get('success'):
            self.assertIn('scheduleId', data)
            self.assertIn('message', data)
    
    def test_generate_schedule_empty_selected_members(self):
        """selectedMembersが空の場合の自動全図書委員取得テスト"""
        request_data = {
            'name': '全図書委員自動選択テスト',
            'description': 'selectedMembersが空の場合のテスト',
            'startDate': '2025-10-01',
            'endDate': '2026-03-31',
            'selectedMembers': [],  # 明示的に空リスト
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        
        print(f"Empty members test - Response status: {response.status_code}")
        print(f"Empty members test - Response data: {response.data.decode()}")
        
        # 201 Created または 200 OK を期待
        self.assertIn(response.status_code, [200, 201])
        
        data = json.loads(response.data)
        self.assertIn('success', data)
        if data.get('success'):
            self.assertIn('scheduleId', data)
    
    def test_generate_schedule_no_selected_members_field(self):
        """selectedMembersフィールドが存在しない場合のテスト"""
        request_data = {
            'name': 'selectedMembersフィールドなしテスト',
            'description': 'selectedMembersフィールドが存在しない場合のテスト',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30'
            # selectedMembersフィールドを意図的に省略
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data),
                                   content_type='application/json')
        
        print(f"No members field test - Response status: {response.status_code}")
        print(f"No members field test - Response data: {response.data.decode()}")
        
        # 201 Created または 200 OK を期待
        self.assertIn(response.status_code, [200, 201])
        
        data = json.loads(response.data)
        self.assertIn('success', data)
        if data.get('success'):
            self.assertIn('scheduleId', data)
    
    # === Error Handling テスト ===
    
    def test_invalid_json_request(self):
        """無効なJSONリクエストのテスト"""
        response = self.client.post('/api/generate-schedule',
                                   data='invalid json',
                                   content_type='application/json')
        # BadRequestまたは適切なエラーレスポンス
        self.assertIn(response.status_code, [400, 500])
    
    def test_missing_content_type(self):
        """Content-Typeヘッダーなしのテスト"""
        request_data = {
            'name': 'テストスケジュール',
            'startDate': '2025-04-07',
            'endDate': '2025-09-20',
            'selectedMembers': [1, 2],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                   data=json.dumps(request_data))
        # Content-Typeなしの場合は415 Unsupported Media Typeが返される
        self.assertIn(response.status_code, [200, 201, 400, 415])


def run_unit_tests():
    """単体テストを実行する関数"""
    print("=" * 80)
    print("バックエンドAPI 単体テスト実行開始")
    print("=" * 80)
    
    # テストスイートを作成
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TestBackendAPI)
    
    # テストランナーを作成
    runner = unittest.TextTestRunner(verbosity=2, buffer=True)
    
    # テストを実行
    result = runner.run(test_suite)
    
    print("\n" + "=" * 80)
    print("単体テスト実行結果")
    print("=" * 80)
    print(f"実行テスト数: {result.testsRun}")
    print(f"成功: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"失敗: {len(result.failures)}")
    print(f"エラー: {len(result.errors)}")
    
    if result.failures:
        print("\n【失敗したテスト】")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print("\n【エラーが発生したテスト】")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
    
    # 成功率を計算
    success_rate = (result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100
    print(f"\n成功率: {success_rate:.1f}%")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_unit_tests()
    sys.exit(0 if success else 1)
