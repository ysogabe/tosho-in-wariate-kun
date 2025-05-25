#!/usr/bin/env python3
import sys
import os
import json

# パスを設定
sys.path.insert(0, os.path.abspath('.'))

def test_api():
    try:
        from app import app
        
        # Flaskアプリのテストクライアントを作成
        with app.test_client() as client:
            # テストデータ
            test_data = {
                'name': '2025年度前期テストスケジュール',
                'description': '単体テスト用のスケジュール',
                'startDate': '2025-04-01',
                'endDate': '2025-09-30',
                'selectedMembers': [1, 2, 3, 4],
                'excludedDates': []
            }
            
            print("スケジュール生成APIをテスト中...")
            response = client.post('/api/generate-schedule', 
                                 data=json.dumps(test_data),
                                 content_type='application/json')
            
            print(f'ステータスコード: {response.status_code}')
            result = response.get_json()
            print(f'レスポンス: {result}')
            
            if response.status_code == 201 and result and result.get('success'):
                print('✅ スケジュール生成APIテスト成功')
                return True
            else:
                print('❌ スケジュール生成APIテスト失敗')
                return False
                
    except Exception as e:
        print(f'エラー: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_api()
