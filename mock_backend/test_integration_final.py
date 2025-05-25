#!/usr/bin/env python3
"""
統合テストスイート
フロントエンドとバックエンドAPIの整合性とスケジュール生成機能のテスト
"""

import unittest
import json
import sys
import os

# パスを設定
sys.path.insert(0, os.path.abspath('.'))

from app import app

class TestScheduleGenerationIntegration(unittest.TestCase):
    """スケジュール生成の統合テスト"""

    def setUp(self):
        """テスト前の準備"""
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_committee_members_api(self):
        """図書委員APIのテスト"""
        response = self.client.get('/api/committee-members')
        self.assertEqual(response.status_code, 200)
        
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        
        # 図書委員データの構造確認
        if data:
            member = data[0]
            required_fields = ['id', 'name', 'grade_name', 'class_name', 'role']
            for field in required_fields:
                self.assertIn(field, member)

    def test_schedule_generation_first_half(self):
        """前期スケジュール生成のテスト"""
        test_data = {
            'name': '2025年度前期統合テストスケジュール',
            'description': '統合テスト用のスケジュール',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'selectedMembers': [1, 2, 3, 4, 5, 6],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        result = response.get_json()
        self.assertIsNotNone(result)
        self.assertTrue(result.get('success'))
        self.assertIsNotNone(result.get('scheduleId'))
        self.assertGreater(result.get('assignmentCount', 0), 0)

    def test_schedule_generation_second_half(self):
        """後期スケジュール生成のテスト"""
        test_data = {
            'name': '2025年度後期統合テストスケジュール',
            'description': '後期統合テスト用のスケジュール',
            'startDate': '2025-10-01',
            'endDate': '2026-03-31',
            'selectedMembers': [1, 2, 3, 4, 5, 6],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        result = response.get_json()
        self.assertIsNotNone(result)
        self.assertTrue(result.get('success'))
        self.assertIsNotNone(result.get('scheduleId'))
        self.assertGreater(result.get('assignmentCount', 0), 0)

    def test_schedule_generation_validation(self):
        """スケジュール生成のバリデーションテスト"""
        # 名前が空の場合
        test_data = {
            'name': '',
            'description': 'テスト',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        result = response.get_json()
        self.assertIn('error', result)

    def test_schedule_generation_insufficient_members(self):
        """図書委員数不足のテスト"""
        test_data = {
            'name': '不正なテストスケジュール',
            'description': 'テスト',
            'startDate': '2025-04-01',
            'endDate': '2025-09-30',
            'selectedMembers': [1],  # 1人だけ
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        
        result = response.get_json()
        self.assertIn('error', result)

    def test_academic_year_detection(self):
        """年度自動判定のテスト"""
        # 2024年4月（2024年度前期）
        test_data = {
            'name': '2024年度前期テストスケジュール',
            'description': 'テスト',
            'startDate': '2024-04-01',
            'endDate': '2024-09-30',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        # 2025年1月（2024年度後期）
        test_data = {
            'name': '2024年度後期テストスケジュール',
            'description': 'テスト',
            'startDate': '2025-01-01',
            'endDate': '2025-03-31',
            'selectedMembers': [1, 2, 3, 4],
            'excludedDates': []
        }
        
        response = self.client.post('/api/generate-schedule',
                                  data=json.dumps(test_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)


if __name__ == '__main__':
    print("=== スケジュール生成統合テスト開始 ===")
    unittest.main(verbosity=2)
