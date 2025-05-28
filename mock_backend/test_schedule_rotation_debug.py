"""
デバッグ用テスト: 前期・後期のローテーション問題を詳細に確認
Issue #014: スケジュール回転バグのデバッグ
"""

import sqlite3
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schedule_generator import ScheduleGenerator
import logging

# ロギング設定を最大レベルに
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


def test_rotation_with_detailed_logging():
    """詳細なログ出力で回転制約の動作を確認"""
    
    # テスト用データベース接続
    db_path = 'test_rotation_debug.db'
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # テスト用のテーブルとデータを作成
    setup_test_data(conn)
    
    try:
        print("=" * 80)
        print("前期スケジュール生成開始")
        print("=" * 80)
        
        # 前期スケジュール生成
        generator_first = ScheduleGenerator(school_id=1, academic_year=2025, is_first_half=True)
        # 実際のデータベースパスを使用するように修正
        generator_first.conn = None  # generate内でget_db_connectionが正しく動作するように
        
        # データベースファイルを一時的にコピー
        import shutil
        shutil.copy(db_path, 'database.db')
        
        first_result = generator_first.generate('前期テスト', '前期のテストスケジュール')
        
        assert first_result['success'], f"前期スケジュール生成に失敗: {first_result}"
        
        # 前期の水曜・金曜担当者を確認
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cm.id, cm.name, sa.day_of_week, lr.room_name
            FROM schedule_assignments sa
            JOIN committee_members cm ON sa.committee_member_id = cm.id
            JOIN library_rooms lr ON sa.library_room_id = lr.id
            WHERE sa.schedule_id = ?
            ORDER BY sa.day_of_week, cm.name
        """, (first_result['schedule_id'],))
        
        print("\n前期スケジュール割り当て:")
        assignments = cursor.fetchall()
        for row in assignments:
            weekday_names = ['', '月', '火', '水', '木', '金']
            print(f"  {row['name']} (ID:{row['id']}) - {weekday_names[row['day_of_week']]}曜日 - {row['room_name']}")
        
        # 前期の水曜・金曜担当者を抽出
        cursor.execute("""
            SELECT DISTINCT committee_member_id, cm.name 
            FROM schedule_assignments sa
            JOIN committee_members cm ON sa.committee_member_id = cm.id
            WHERE sa.schedule_id = ? AND sa.day_of_week IN (3, 5)
        """, (first_result['schedule_id'],))
        
        first_wed_fri = cursor.fetchall()
        first_wed_fri_ids = {row['committee_member_id'] for row in first_wed_fri}
        
        print(f"\n前期の水曜・金曜担当者: {[f'{row["name"]}(ID:{row["committee_member_id"]})' for row in first_wed_fri]}")
        
        print("\n" + "=" * 80)
        print("後期スケジュール生成開始")
        print("=" * 80)
        
        # 後期スケジュール生成
        generator_second = ScheduleGenerator(school_id=1, academic_year=2025, is_first_half=False)
        generator_second.conn = None
        
        # データベースを再コピー（前期のデータを含む）
        shutil.copy(db_path, 'database.db')
        
        second_result = generator_second.generate('後期テスト', '後期のテストスケジュール')
        
        assert second_result['success'], f"後期スケジュール生成に失敗: {second_result}"
        
        # 後期の割り当てを確認
        cursor.execute("""
            SELECT cm.id, cm.name, sa.day_of_week, lr.room_name
            FROM schedule_assignments sa
            JOIN committee_members cm ON sa.committee_member_id = cm.id
            JOIN library_rooms lr ON sa.library_room_id = lr.id
            WHERE sa.schedule_id = ?
            ORDER BY sa.day_of_week, cm.name
        """, (second_result['schedule_id'],))
        
        print("\n後期スケジュール割り当て:")
        assignments = cursor.fetchall()
        for row in assignments:
            weekday_names = ['', '月', '火', '水', '木', '金']
            print(f"  {row['name']} (ID:{row['id']}) - {weekday_names[row['day_of_week']]}曜日 - {row['room_name']}")
        
        # 後期の水曜・金曜担当者を確認
        cursor.execute("""
            SELECT DISTINCT committee_member_id, cm.name 
            FROM schedule_assignments sa
            JOIN committee_members cm ON sa.committee_member_id = cm.id
            WHERE sa.schedule_id = ? AND sa.day_of_week IN (3, 5)
        """, (second_result['schedule_id'],))
        
        second_wed_fri = cursor.fetchall()
        second_wed_fri_ids = {row['committee_member_id'] for row in second_wed_fri}
        
        print(f"\n後期の水曜・金曜担当者: {[f'{row["name"]}(ID:{row["committee_member_id"]})' for row in second_wed_fri]}")
        
        # 制約違反をチェック
        violation = first_wed_fri_ids.intersection(second_wed_fri_ids)
        
        print("\n" + "=" * 80)
        print("制約チェック結果:")
        print("=" * 80)
        
        if violation:
            print(f"❌ 制約違反検出: 以下の委員が前期・後期両方で水曜・金曜に割り当てられています:")
            for member_id in violation:
                cursor.execute("SELECT name FROM committee_members WHERE id = ?", (member_id,))
                name = cursor.fetchone()['name']
                print(f"  - {name} (ID:{member_id})")
        else:
            print("✅ 制約違反なし: 前期の水曜・金曜担当者は後期では別の曜日に割り当てられています")
        
        # データベースファイルをクリーンアップ
        if os.path.exists('database.db'):
            os.remove('database.db')
        
        return len(violation) == 0
        
    finally:
        conn.close()
        if os.path.exists(db_path):
            os.remove(db_path)


def setup_test_data(conn):
    """テスト用のデータベーススキーマとテストデータを設定"""
    cursor = conn.cursor()
    
    # スキーマ作成
    cursor.execute("""
        CREATE TABLE schools (
            id INTEGER PRIMARY KEY,
            school_name TEXT NOT NULL,
            address TEXT,
            phone_number TEXT,
            principal_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE classes (
            id INTEGER PRIMARY KEY,
            school_id INTEGER,
            class_name TEXT,
            grade INTEGER,
            class_number INTEGER,
            homeroom_teacher TEXT,
            active BOOLEAN DEFAULT 1,
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE positions (
            id INTEGER PRIMARY KEY,
            school_id INTEGER,
            position_name TEXT NOT NULL,
            description TEXT,
            active BOOLEAN DEFAULT 1,
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE committee_members (
            id INTEGER PRIMARY KEY,
            school_id INTEGER,
            student_id TEXT,
            name TEXT,
            class_id INTEGER,
            position_id INTEGER,
            academic_year INTEGER,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id),
            FOREIGN KEY (class_id) REFERENCES classes(id),
            FOREIGN KEY (position_id) REFERENCES positions(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE library_rooms (
            id INTEGER PRIMARY KEY,
            school_id INTEGER,
            room_id TEXT,
            room_name TEXT,
            capacity INTEGER DEFAULT 1,
            description TEXT,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            location TEXT DEFAULT '',
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE schedules (
            id INTEGER PRIMARY KEY,
            school_id INTEGER,
            schedule_name TEXT,
            description TEXT,
            academic_year INTEGER,
            is_first_half BOOLEAN,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE schedule_assignments (
            id INTEGER PRIMARY KEY,
            schedule_id INTEGER,
            day_of_week INTEGER,
            library_room_id INTEGER,
            committee_member_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES schedules(id),
            FOREIGN KEY (library_room_id) REFERENCES library_rooms(id),
            FOREIGN KEY (committee_member_id) REFERENCES committee_members(id)
        )
    """)
    
    # テストデータ挿入
    cursor.execute("INSERT INTO schools (id, school_name) VALUES (1, 'テスト小学校')")
    
    # 5年生、6年生のクラスを作成（schedule_generatorが5,6年生のみを対象にするため）
    cursor.execute("INSERT INTO classes (id, school_id, class_name, grade, class_number) VALUES (1, 1, '5-1', 5, 1)")
    cursor.execute("INSERT INTO classes (id, school_id, class_name, grade, class_number) VALUES (2, 1, '5-2', 5, 2)")
    cursor.execute("INSERT INTO classes (id, school_id, class_name, grade, class_number) VALUES (3, 1, '6-1', 6, 1)")
    cursor.execute("INSERT INTO classes (id, school_id, class_name, grade, class_number) VALUES (4, 1, '6-2', 6, 2)")
    
    # 役職データ
    cursor.execute("INSERT INTO positions (id, school_id, position_name) VALUES (1, 1, '委員長')")
    cursor.execute("INSERT INTO positions (id, school_id, position_name) VALUES (2, 1, '副委員長')")
    cursor.execute("INSERT INTO positions (id, school_id, position_name) VALUES (3, 1, '書記')")
    
    # 図書委員データ（10人、5年生と6年生のみ）
    members = [
        (1, 1, 'S001', '田中太郎', 1, 1, 2025),    # 5-1 委員長
        (2, 1, 'S002', '佐藤花子', 1, None, 2025),  # 5-1
        (3, 1, 'S003', '山田次郎', 2, 2, 2025),    # 5-2 副委員長
        (4, 1, 'S004', '鈴木美咲', 2, None, 2025),  # 5-2
        (5, 1, 'S005', '高橋健太', 3, 3, 2025),    # 6-1 書記
        (6, 1, 'S006', '伊藤美香', 3, None, 2025),  # 6-1
        (7, 1, 'S007', '渡辺大輔', 4, None, 2025),  # 6-2
        (8, 1, 'S008', '中村綾乃', 4, None, 2025),  # 6-2
        (9, 1, 'S009', '山本優', 1, None, 2025),    # 5-1
        (10, 1, 'S010', '木村真理', 3, None, 2025)  # 6-1
    ]
    
    for member in members:
        cursor.execute("""
            INSERT INTO committee_members 
            (id, school_id, student_id, name, class_id, position_id, academic_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, member)
    
    # 図書室データ（2つの図書室）
    cursor.execute("""
        INSERT INTO library_rooms 
        (id, school_id, room_id, room_name, capacity, description, location) 
        VALUES (1, 1, 'LR001', '第一図書室', 10, '主要図書室', '1階')
    """)
    cursor.execute("""
        INSERT INTO library_rooms 
        (id, school_id, room_id, room_name, capacity, description, location) 
        VALUES (2, 1, 'LR002', '第二図書室', 10, '副図書室', '2階')
    """)
    
    conn.commit()


if __name__ == "__main__":
    success = test_rotation_with_detailed_logging()
    if success:
        print("\n✅ テスト成功: ローテーション制約が正しく動作しています")
    else:
        print("\n❌ テスト失敗: ローテーション制約に問題があります")