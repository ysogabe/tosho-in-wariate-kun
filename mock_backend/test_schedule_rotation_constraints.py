"""
前期・後期スケジュールローテーション制約のテスト
Issue #014: 前期・後期スケジュールのローテーション不具合
"""

import sqlite3
import os
import sys
from datetime import datetime

# パスを追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from schedule_generator import ScheduleGenerator, get_db_connection

def setup_test_data():
    """テストデータのセットアップ"""
    print("テストデータをセットアップしています...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 既存のテストデータをクリア
    cursor.execute("DELETE FROM schedule_assignments WHERE schedule_id IN (SELECT id FROM schedules WHERE academic_year = 2025)")
    cursor.execute("DELETE FROM schedules WHERE academic_year = 2025")
    conn.commit()
    
    print("テストデータのセットアップが完了しました")
    return conn

def test_rotation_constraint():
    """前期・後期のローテーション制約をテスト"""
    print("\n=== 前期・後期ローテーション制約テスト ===\n")
    
    # テストデータのセットアップ
    conn = setup_test_data()
    
    # 前期スケジュールを生成
    print("1. 前期スケジュールを生成中...")
    generator_first = ScheduleGenerator(school_id=1, academic_year=2025, is_first_half=True)
    result_first = generator_first.generate("2025年度前期スケジュール", "前期のテストスケジュール")
    
    if not result_first['success']:
        print(f"エラー: 前期スケジュール生成に失敗しました: {result_first['message']}")
        return
    
    first_schedule_id = result_first['schedule_id']
    print(f"前期スケジュールが生成されました (ID: {first_schedule_id})")
    
    # 前期の水曜・金曜担当者を取得
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT sa.committee_member_id, cm.name, sa.day_of_week
        FROM schedule_assignments sa
        JOIN committee_members cm ON sa.committee_member_id = cm.id
        WHERE sa.schedule_id = ? AND sa.day_of_week IN (3, 5)
        ORDER BY sa.committee_member_id, sa.day_of_week
    """, (first_schedule_id,))
    
    first_wed_fri = cursor.fetchall()
    print(f"\n前期の水曜・金曜担当者数: {len(set(row[0] for row in first_wed_fri))}人")
    
    # 担当者の詳細を表示
    wed_fri_members = {}
    for member_id, name, day in first_wed_fri:
        if member_id not in wed_fri_members:
            wed_fri_members[member_id] = {'name': name, 'days': []}
        wed_fri_members[member_id]['days'].append(day)
    
    print("\n前期の水曜・金曜担当者詳細:")
    for member_id, info in wed_fri_members.items():
        days_str = ', '.join(['水曜' if d == 3 else '金曜' for d in info['days']])
        print(f"  - {info['name']} (ID: {member_id}): {days_str}")
    
    # 後期スケジュールを生成
    print("\n2. 後期スケジュールを生成中...")
    generator_second = ScheduleGenerator(school_id=1, academic_year=2025, is_first_half=False)
    
    # 後期生成前にwed_fri_membersが正しく設定されているか確認
    generator_second.load_committee_members()
    print(f"\n後期ジェネレータのwed_fri_members: {generator_second.wed_fri_members}")
    
    result_second = generator_second.generate("2025年度後期スケジュール", "後期のテストスケジュール")
    
    if not result_second['success']:
        print(f"エラー: 後期スケジュール生成に失敗しました: {result_second['message']}")
        return
    
    second_schedule_id = result_second['schedule_id']
    print(f"後期スケジュールが生成されました (ID: {second_schedule_id})")
    
    # 後期の水曜・金曜担当者を取得
    cursor.execute("""
        SELECT DISTINCT sa.committee_member_id, cm.name, sa.day_of_week
        FROM schedule_assignments sa
        JOIN committee_members cm ON sa.committee_member_id = cm.id
        WHERE sa.schedule_id = ? AND sa.day_of_week IN (3, 5)
        ORDER BY sa.committee_member_id, sa.day_of_week
    """, (second_schedule_id,))
    
    second_wed_fri = cursor.fetchall()
    print(f"\n後期の水曜・金曜担当者数: {len(set(row[0] for row in second_wed_fri))}人")
    
    # 制約違反をチェック
    print("\n3. 制約違反チェック中...")
    
    first_wed_fri_ids = set(row[0] for row in first_wed_fri)
    second_wed_fri_ids = set(row[0] for row in second_wed_fri)
    
    violation_ids = first_wed_fri_ids & second_wed_fri_ids
    
    if violation_ids:
        print(f"\n⚠️ 制約違反が検出されました！")
        print(f"前期・後期の両方で水曜・金曜に割り当てられた委員: {len(violation_ids)}人")
        
        # 違反者の詳細を表示
        cursor.execute("""
            SELECT id, name FROM committee_members WHERE id IN ({})
        """.format(','.join('?' * len(violation_ids))), list(violation_ids))
        
        violators = cursor.fetchall()
        print("\n違反者リスト:")
        for member_id, name in violators:
            print(f"  - {name} (ID: {member_id})")
    else:
        print("\n✅ 制約違反は検出されませんでした！")
        print("前期の水曜・金曜担当者は、後期では水曜・金曜に割り当てられていません。")
    
    # 全体の統計を表示
    print("\n4. 統計情報")
    
    # 前期の全割り当て
    cursor.execute("""
        SELECT day_of_week, COUNT(DISTINCT committee_member_id) as member_count
        FROM schedule_assignments
        WHERE schedule_id = ?
        GROUP BY day_of_week
        ORDER BY day_of_week
    """, (first_schedule_id,))
    
    print("\n前期の曜日別割り当て人数:")
    weekday_names = {1: '月曜', 2: '火曜', 3: '水曜', 4: '木曜', 5: '金曜'}
    for day, count in cursor.fetchall():
        print(f"  {weekday_names[day]}: {count}人")
    
    # 後期の全割り当て
    cursor.execute("""
        SELECT day_of_week, COUNT(DISTINCT committee_member_id) as member_count
        FROM schedule_assignments
        WHERE schedule_id = ?
        GROUP BY day_of_week
        ORDER BY day_of_week
    """, (second_schedule_id,))
    
    print("\n後期の曜日別割り当て人数:")
    for day, count in cursor.fetchall():
        print(f"  {weekday_names[day]}: {count}人")
    
    # 前期と後期の割り当て比較
    print("\n5. 前期・後期の割り当て比較")
    
    # 各委員の前期・後期の割り当て曜日を取得
    cursor.execute("""
        SELECT 
            cm.id,
            cm.name,
            GROUP_CONCAT(CASE WHEN s.is_first_half = 1 THEN sa.day_of_week END) as first_days,
            GROUP_CONCAT(CASE WHEN s.is_first_half = 0 THEN sa.day_of_week END) as second_days
        FROM committee_members cm
        LEFT JOIN schedule_assignments sa ON cm.id = sa.committee_member_id
        LEFT JOIN schedules s ON sa.schedule_id = s.id
        WHERE s.academic_year = 2025
        GROUP BY cm.id, cm.name
        ORDER BY cm.name
    """)
    
    members_schedule = cursor.fetchall()
    
    same_schedule_count = 0
    different_schedule_count = 0
    
    print("\n各委員の前期・後期割り当て:")
    for member_id, name, first_days, second_days in members_schedule:
        if first_days and second_days:
            first_days_list = sorted([int(d) for d in first_days.split(',') if d])
            second_days_list = sorted([int(d) for d in second_days.split(',') if d])
            
            first_days_str = ', '.join([weekday_names[d] for d in first_days_list])
            second_days_str = ', '.join([weekday_names[d] for d in second_days_list])
            
            if first_days_list == second_days_list:
                same_schedule_count += 1
                status = "同じ"
            else:
                different_schedule_count += 1
                status = "異なる"
            
            print(f"  {name}: 前期[{first_days_str}] → 後期[{second_days_str}] ({status})")
    
    print(f"\n割り当てが同じ委員: {same_schedule_count}人")
    print(f"割り当てが異なる委員: {different_schedule_count}人")
    
    conn.close()

if __name__ == "__main__":
    test_rotation_constraint()