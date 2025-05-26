import sqlite3
import random
import os

# デフォルトのデータベースパス
db_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(db_dir, 'database.db')

def seed_data(custom_db_path=None):
    # カスタムパスが指定されていればそれを使用
    conn_path = custom_db_path if custom_db_path else db_path
    conn = sqlite3.connect(conn_path)
    cursor = conn.cursor()

    # Clear existing data (for re-seeding)
    print("Clearing existing data...")
    cursor.execute("DELETE FROM schedule_assignments")
    cursor.execute("DELETE FROM schedules")
    cursor.execute("DELETE FROM committee_members")
    cursor.execute("DELETE FROM library_rooms")
    cursor.execute("DELETE FROM classes")
    cursor.execute("DELETE FROM positions")
    cursor.execute("DELETE FROM schools")
    conn.commit()

    # Seed Schools
    print("Seeding schools...")
    schools_data = [
        ('中央小学校', '2025-04-01', '2025-09-30', '2025-10-01', '2026-03-31'),
        ('さくら小学校', '2025-04-01', '2025-09-30', '2025-10-01', '2026-03-31')
    ]
    cursor.executemany("INSERT INTO schools (school_name, first_term_start, first_term_end, second_term_start, second_term_end) VALUES (?, ?, ?, ?, ?)", schools_data)
    conn.commit()
    print(f"Seeded {len(schools_data)} schools")

    # Get school IDs
    school_ids = [row[0] for row in cursor.execute("SELECT id FROM schools").fetchall()]
    main_school_id = school_ids[0]  # Use first school for most data

    # Seed Positions
    print("Seeding positions...")
    positions_data = [
        ('委員長', '図書委員会の代表者'),
        ('副委員長', '委員長の補佐'),
        ('書記', '会議の記録を取る'),
        ('会計', '図書委員会の会計を担当'),
        ('一般委員', '一般的な図書委員')
    ]
    cursor.executemany("INSERT INTO positions (position_name, description) VALUES (?, ?)", positions_data)
    conn.commit()
    print(f"Seeded {len(positions_data)} positions")

    # Get position IDs
    position_ids = {row[1]: row[0] for row in cursor.execute("SELECT id, position_name FROM positions").fetchall()}

    # Seed Classes
    print("Seeding classes...")
    classes_data = []
    # 5年生と6年生のクラスを作成
    for grade in [5, 6]:
        class_count = 3 if grade == 5 else 2  # 5年生は3クラス、6年生は2クラス
        for class_num in range(1, class_count + 1):
            class_name = f'{grade}{chr(64 + class_num)}'  # 5A, 5B, 5C, 6A, 6B
            homeroom_teacher = f'{class_name}担任先生'
            classes_data.append((main_school_id, grade, class_num, class_name, homeroom_teacher))
    
    cursor.executemany("INSERT INTO classes (school_id, grade, class_number, class_name, homeroom_teacher) VALUES (?, ?, ?, ?, ?)", classes_data)
    conn.commit()
    print(f"Seeded {len(classes_data)} classes")

    # Get class IDs
    class_ids = [row[0] for row in cursor.execute("SELECT id FROM classes WHERE school_id = ?", (main_school_id,)).fetchall()]

    # Seed Committee Members
    print("Seeding committee members...")
    committee_members_data = []
    first_names = ['太郎', '花子', '一郎', '二郎', '三郎', '桜', '桃子', '健太', '美香', '大輔', '綾乃', '翔太', '美咲', '陽介', '麻美']
    last_names = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村']
    
    student_id_counter = 1
    member_count = 0
    
    # 各クラスに2-3名の委員を配置
    for class_id in class_ids:
        # クラス情報を取得
        class_info = cursor.execute("SELECT grade FROM classes WHERE id = ?", (class_id,)).fetchone()
        grade = class_info[0]
        
        # クラスあたりの委員数を決定（2-3名）
        members_per_class = random.choice([2, 3])
        
        for _ in range(members_per_class):
            name = f"{random.choice(last_names)} {random.choice(first_names)}"
            student_id = f"S{student_id_counter:03d}"
            
            # 役職を決定（最初の数人は特別な役職、残りは一般委員）
            if member_count == 0:
                position_id = position_ids['委員長']
            elif member_count == 1:
                position_id = position_ids['副委員長']
            elif member_count == 2:
                position_id = position_ids['書記']
            elif member_count == 3:
                position_id = position_ids['会計']
            else:
                position_id = position_ids['一般委員']
            
            committee_members_data.append((main_school_id, student_id, name, class_id, position_id, 2025))
            student_id_counter += 1
            member_count += 1
    
    cursor.executemany("INSERT INTO committee_members (school_id, student_id, name, class_id, position_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)", committee_members_data)
    conn.commit()
    print(f"Seeded {len(committee_members_data)} committee members")

    # Seed Library Rooms
    print("Seeding library rooms...")
    library_rooms_data = [
        (main_school_id, 1, '第一図書室', 2, 'メイン図書室、広いスペース'),
        (main_school_id, 2, '第二図書室', 1, '小さな図書室、静かな環境')
    ]
    cursor.executemany("INSERT INTO library_rooms (school_id, room_id, room_name, capacity, description) VALUES (?, ?, ?, ?, ?)", library_rooms_data)
    conn.commit()
    print(f"Seeded {len(library_rooms_data)} library rooms")

    # Seed Schedules
    print("Seeding schedules...")
    schedules_data = [
        (main_school_id, '2025年度前期図書委員当番表', '2025年度前期の図書委員当番割り当て', 2025, True, 'active'),
        (main_school_id, '2025年度後期図書委員当番表', '2025年度後期の図書委員当番割り当て', 2025, False, 'draft')
    ]
    cursor.executemany("INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status) VALUES (?, ?, ?, ?, ?, ?)", schedules_data)
    conn.commit()
    print(f"Seeded {len(schedules_data)} schedules")

    # Get schedule and other IDs for assignments
    schedule_data = cursor.execute("SELECT id, is_first_half, schedule_name FROM schedules WHERE school_id = ?", (main_school_id,)).fetchall()
    schedule_ids = {row[2]: row[0] for row in schedule_data}
    first_term_schedule_id = [row[0] for row in schedule_data if '前期' in row[2]][0]
    
    library_room_ids = [row[0] for row in cursor.execute("SELECT id FROM library_rooms WHERE school_id = ?", (main_school_id,)).fetchall()]
    committee_member_ids = [row[0] for row in cursor.execute("SELECT id FROM committee_members WHERE school_id = ? AND academic_year = ?", (main_school_id, 2025)).fetchall()]

    # Seed Schedule Assignments (for first term)
    print("Seeding schedule assignments...")
    schedule_assignments_data = []
    
    if library_room_ids and committee_member_ids:
        # 簡単な割り当てパターンを作成（月曜日から金曜日）
        weekdays = [1, 2, 3, 4, 5]  # Monday to Friday
        
        # 各曜日に各図書室に1名ずつ割り当て
        member_index = 0
        for day in weekdays:
            for room_id in library_room_ids:
                if member_index < len(committee_member_ids):
                    schedule_assignments_data.append((first_term_schedule_id, day, room_id, committee_member_ids[member_index]))
                    member_index = (member_index + 1) % len(committee_member_ids)
        
        cursor.executemany("INSERT INTO schedule_assignments (schedule_id, day_of_week, library_room_id, committee_member_id) VALUES (?, ?, ?, ?)", schedule_assignments_data)
        conn.commit()
        print(f"Seeded {len(schedule_assignments_data)} schedule assignments")
    else:
        print("Skipping schedule assignments: missing library rooms or committee members")

    conn.close()
    print("Data seeding complete.")

if __name__ == '__main__':
    print("Starting data seeding...")
    seed_data()