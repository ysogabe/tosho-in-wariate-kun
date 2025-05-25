import requests
import json

def test_schedule_generation_api():
    """直接APIを呼び出してスケジュール生成機能をテストする"""
    base_url = "http://localhost:5001/api"
    
    print("=== スケジュール生成APIのテスト ===")
    
    # 前期のテスト
    first_half_data = {
        "academicYear": "2025",
        "isFirstHalf": True,
        "startDate": "2025-04-01",
        "endDate": "2025-09-30"
    }
    
    print("\n--- 前期のテスト ---")
    try:
        response = requests.post(f"{base_url}/generate-schedule", json=first_half_data)
        print(f"ステータスコード: {response.status_code}")
        result = response.json()
        print(f"レスポンス: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 201 and result.get('success'):
            print("✅ 前期のテスト成功")
            
            # 生成されたスケジュールを取得
            schedule_id = result.get('scheduleId')
            if schedule_id:
                schedule_response = requests.get(f"{base_url}/schedules/{schedule_id}")
                if schedule_response.status_code == 200:
                    schedule = schedule_response.json()
                    print(f"生成されたスケジュール名: {schedule.get('name')}")
                    print(f"説明: {schedule.get('description')}")
                    
                    # 名前と説明が正しいか確認
                    expected_name = "2025年度前期スケジュール"
                    expected_desc = "2025年度の前期の図書委員当番スケジュール"
                    
                    if schedule.get('name') == expected_name and schedule.get('description') == expected_desc:
                        print("✅ スケジュール名と説明が正しく生成されました")
                    else:
                        print("❌ スケジュール名または説明が期待値と異なります")
                        print(f"期待値: 名前={expected_name}, 説明={expected_desc}")
                        print(f"実際値: 名前={schedule.get('name')}, 説明={schedule.get('description')}")
        else:
            print("❌ 前期のテスト失敗")
    except Exception as e:
        print(f"エラー: {e}")
    
    # 後期のテスト
    second_half_data = {
        "academicYear": "2025",
        "isFirstHalf": False,
        "startDate": "2025-10-01",
        "endDate": "2026-03-31"
    }
    
    print("\n--- 後期のテスト ---")
    try:
        response = requests.post(f"{base_url}/generate-schedule", json=second_half_data)
        print(f"ステータスコード: {response.status_code}")
        result = response.json()
        print(f"レスポンス: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 201 and result.get('success'):
            print("✅ 後期のテスト成功")
            
            # 生成されたスケジュールを取得
            schedule_id = result.get('scheduleId')
            if schedule_id:
                schedule_response = requests.get(f"{base_url}/schedules/{schedule_id}")
                if schedule_response.status_code == 200:
                    schedule = schedule_response.json()
                    print(f"生成されたスケジュール名: {schedule.get('name')}")
                    print(f"説明: {schedule.get('description')}")
                    
                    # 名前と説明が正しいか確認
                    expected_name = "2025年度後期スケジュール"
                    expected_desc = "2025年度の後期の図書委員当番スケジュール"
                    
                    if schedule.get('name') == expected_name and schedule.get('description') == expected_desc:
                        print("✅ スケジュール名と説明が正しく生成されました")
                    else:
                        print("❌ スケジュール名または説明が期待値と異なります")
                        print(f"期待値: 名前={expected_name}, 説明={expected_desc}")
                        print(f"実際値: 名前={schedule.get('name')}, 説明={schedule.get('description')}")
        else:
            print("❌ 後期のテスト失敗")
    except Exception as e:
        print(f"エラー: {e}")

if __name__ == "__main__":
    test_schedule_generation_api()
