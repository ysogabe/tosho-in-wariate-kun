import unittest
import json
import os
import sys
from app import app
from datetime import datetime

class TestScheduleGeneratorAPI(unittest.TestCase):
    """スケジュール生成APIのテストクラス"""

    def setUp(self):
        """テスト前の準備"""
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_generate_schedule_api_first_half(self):
        """前期のスケジュール生成APIのレスポンスをテスト"""
        # テストデータ
        test_data = {
            "academicYear": "2025",
            "isFirstHalf": True,
            "startDate": "2025-04-01",
            "endDate": "2025-09-30"
        }
        
        # APIリクエスト
        response = self.client.post(
            '/api/generate-schedule',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('scheduleId', data)
        self.assertIn('stats', data)
        
        # ログを確認して正しいスケジュール名と説明が生成されているか確認
        # ログにはパラメータが出力されているはず
        # 実際のデータベースの確認は別途テストで行う
        
    def test_generate_schedule_api_second_half(self):
        """後期のスケジュール生成APIのレスポンスをテスト"""
        # テストデータ
        test_data = {
            "academicYear": "2025",
            "isFirstHalf": False,
            "startDate": "2025-10-01",
            "endDate": "2026-03-31"
        }
        
        # APIリクエスト
        response = self.client.post(
            '/api/generate-schedule',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        # レスポンスの検証
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('scheduleId', data)
        self.assertIn('stats', data)
        
    def test_missing_required_fields(self):
        """必須フィールドが欠けている場合のエラー処理をテスト"""
        # 学年度が欠けている
        test_data = {
            "isFirstHalf": True,
            "startDate": "2025-04-01",
            "endDate": "2025-09-30"
        }
        
        response = self.client.post(
            '/api/generate-schedule',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn('academicYear', data['error'])

if __name__ == '__main__':
    unittest.main()
