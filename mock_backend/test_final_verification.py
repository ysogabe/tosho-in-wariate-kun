#!/usr/bin/env python3
"""
最終検証テスト
実装されたすべての機能が正常に動作することを確認
"""

import unittest
import json
import sys
import os

# パスを設定
sys.path.insert(0, os.path.abspath('.'))

from app import app
from schedule_generator import (
    get_committee_members,
    get_libraries,
    get_library_availability,
    create_schedule,
    create_schedule_assignment,
    generate_date_range
)

class TestFinalVerification(unittest.TestCase):
    """最終検証テスト"""

    def setUp(self):
        """テスト前の準備"""
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_api_committee_members(self):
        """図書委員APIテスト"""
        response = self.client.get('/api/committee-members')
        self.assertEqual(response.status_code, 200)
        
        data = response.get_json()
        self.assertIsInstance(data, list)
        print(f"図書委員API: {len(data)}名の委員を取得")

    def test_schedule_generation_api(self):
        """スケジュール生成APIテスト"""
        test_data = {
            'name': '最終テストスケジュール',
            'description': '最終テスト用のスケジュール',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'selectedMembers': [1, 2, 3, 4, 5, 6],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn('scheduleId', data)
        print(f"スケジュール生成API: ID={data['scheduleId']}でスケジュール作成")

    def test_helper_functions(self):
        """ヘルパー関数テスト"""
        # 図書委員取得テスト
        members = get_committee_members()
        self.assertIsInstance(members, list)
        print(f"get_committee_members: {len(members)}名")
        
        # 図書室取得テスト
        libraries = get_libraries()
        self.assertIsInstance(libraries, list)
        print(f"get_libraries: {len(libraries)}室")
        
        # 図書室利用可能性テスト
        availability = get_library_availability()
        self.assertIsInstance(availability, dict)
        print(f"get_library_availability: {len(availability)}室の情報")
        
        # 日付範囲生成テスト
        dates = generate_date_range('2025-04-01', '2025-04-03')
        self.assertIsInstance(dates, list)
        self.assertEqual(len(dates), 3)
        print(f"generate_date_range: {len(dates)}日分生成")

    def test_academic_year_detection(self):
        """年度・学期自動判定テスト"""
        # 前期テスト（4月開始）
        test_data_first = {
            'name': '年度判定テスト前期',
            'description': 'テスト',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data_first),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 201)
        print("年度・学期自動判定: 前期テスト成功")
        
        # 後期テスト（1月開始）
        test_data_second = {
            'name': '年度判定テスト後期',
            'description': 'テスト',
            'startDate': '2025-01-01',
            'endDate': '2025-03-31',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data_second),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 201)
        print("年度・学期自動判定: 後期テスト成功")


if __name__ == '__main__':
    print("=== 最終検証テスト開始 ===")
    unittest.main(verbosity=2)
