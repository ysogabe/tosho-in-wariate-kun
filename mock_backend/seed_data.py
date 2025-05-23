import sqlite3
import random

def seed_data():
    conn = sqlite3.connect('mock_backend/database.db')
    cursor = conn.cursor()

    # Seed Grades
    grades_data = []
    for i in range(1, 7):
        grades_data.append((f'{i}年生', f'{i}年生の説明'))
    cursor.executemany("INSERT INTO grades (name, description) VALUES (?, ?)", grades_data)
    conn.commit()
    print("Seeded grades")

    # Seed Classes
    classes_data = []
    grade_ids = [row[0] for row in cursor.execute("SELECT id FROM grades").fetchall()]
    for grade_id in grade_ids:
        for i in range(1, random.randint(2, 4)): # 2 or 3 classes per grade
            classes_data.append((f'{cursor.execute("SELECT name FROM grades WHERE id = ?", (grade_id,)).fetchone()[0]} {i}組', grade_id))
    cursor.executemany("INSERT INTO classes (name, grade_id) VALUES (?, ?)", classes_data)
    conn.commit()
    print("Seeded classes")

    # Seed Committee Members
    committee_members_data = []
    class_ids = [row[0] for row in cursor.execute("SELECT id FROM classes").fetchall()]
    roles = ['委員長', '副委員長', '書記', '会計', 'メンバー']
    first_names = ['太郎', '花子', '一郎', '二郎', '三郎', '桜', '桃子', '一郎', '次郎', '三郎']
    last_names = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤']

    member_count = 0
    while member_count < 25: # Aim for around 25 members
        class_id = random.choice(class_ids)
        name = f"{random.choice(last_names)} {random.choice(first_names)}"
        role = random.choice(roles)
        # Ensure unique name per class (simplified check)
        if not cursor.execute("SELECT 1 FROM committee_members WHERE name = ? AND class_id = ?", (name, class_id)).fetchone():
            committee_members_data.append((name, class_id, role))
            member_count +=1
    cursor.executemany("INSERT INTO committee_members (name, class_id, role) VALUES (?, ?, ?)", committee_members_data)
    conn.commit()
    print(f"Seeded {len(committee_members_data)} committee members")


    # Seed Libraries
    libraries_data = [
        ('中央図書館', '北区中央1-1-1', 100, True),
        ('南図書館', '南区南町2-2-2', 75, True)
    ]
    cursor.executemany("INSERT INTO libraries (name, location, capacity, is_active) VALUES (?, ?, ?, ?)", libraries_data)
    conn.commit()
    print("Seeded libraries")

    # Seed Library Availability
    library_availability_data = []
    library_ids = [row[0] for row in cursor.execute("SELECT id FROM libraries").fetchall()]
    days = list(range(1, 6)) # Monday to Friday
    for lib_id in library_ids:
        for day in days:
            # Randomly decide if open on a particular day
            if random.choice([True, True, False]): # Higher chance of being open
                open_time = f"{random.randint(9,10):02d}:00"
                close_time = f"{random.randint(16,18):02d}:00"
                library_availability_data.append((lib_id, day, open_time, close_time))
    cursor.executemany("INSERT INTO library_availability (library_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)", library_availability_data)
    conn.commit()
    print("Seeded library availability")

    # Seed Schedule Rules
    schedule_rules_data = [
        ('最低担当人数', '各時間帯には最低2名の委員が必要です。', 'min_members_per_slot', 1),
        ('最大連続勤務時間', '委員は最大2時間まで連続して勤務できます。', 'max_consecutive_hours', 2),
        ('週最大勤務時間', '委員は週に最大4時間まで勤務できます。', 'max_hours_per_week_per_member', 3),
        ('同クラスからの最低人数', '各時間帯には、同じクラスから最低1名の委員が必要です。', 'min_members_from_same_class_per_slot', 4)
    ]
    cursor.executemany("INSERT INTO schedule_rules (name, description, type, priority) VALUES (?, ?, ?, ?)", schedule_rules_data)
    conn.commit()
    print("Seeded schedule rules")

    # Seed Schedules
    schedules_data = [
        ('前期図書当番', '4月から9月までの図書当番表', '2024-04-01', '2024-09-30'),
        ('後期図書当番', '10月から3月までの図書当番表', '2024-10-01', '2025-03-31')
    ]
    cursor.executemany("INSERT INTO schedules (name, description, start_date, end_date) VALUES (?, ?, ?, ?)", schedules_data)
    conn.commit()
    print("Seeded schedules")

    # Seed Schedule Assignments (Simplified)
    schedule_assignments_data = []
    schedule_ids = [row[0] for row in cursor.execute("SELECT id FROM schedules").fetchall()]
    all_library_ids = [row[0] for row in cursor.execute("SELECT id FROM libraries").fetchall()]
    all_committee_member_ids = [row[0] for row in cursor.execute("SELECT id FROM committee_members").fetchall()]

    if not all_library_ids or not all_committee_member_ids:
        print("Skipping schedule assignments seeding as there are no libraries or committee members.")
    else:
        # Create some assignments for the first schedule
        schedule_id_to_seed = schedule_ids[0]
        dates_to_seed = ['2024-07-01', '2024-07-01', '2024-07-02', '2024-07-03', '2024-07-03', '2024-07-04', '2024-07-05'] # Example dates
        time_slots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00']

        for i in range(10): # Create 10 sample assignments
            library_id = random.choice(all_library_ids)
            # committee_member_id = random.choice(all_committee_member_ids) # Assign one member directly for now
            date_to_assign = random.choice(dates_to_seed)
            time_slot_to_assign = random.choice(time_slots)
            # For simplicity, assign one member directly. M:N can be handled by `assignment_members` table.
            schedule_assignments_data.append((schedule_id_to_seed, library_id, None, date_to_assign, time_slot_to_assign))

        cursor.executemany("INSERT INTO schedule_assignments (schedule_id, library_id, committee_member_id, date, time_slot) VALUES (?, ?, ?, ?, ?)", schedule_assignments_data)
        conn.commit()
        print(f"Seeded {len(schedule_assignments_data)} schedule assignments (direct single member assignment for now)")

        # Seed Assignment Members (Example for M:N)
        # This part assumes some assignments were created where committee_member_id was NULL
        # and we want to assign multiple members to them.
        assignment_members_data = []
        # Get assignments that were created with NULL committee_member_id (placeholder for multi-member assignments)
        assignments_for_multiple_members = cursor.execute(
            "SELECT id FROM schedule_assignments WHERE committee_member_id IS NULL LIMIT 5" # Take first 5 such assignments
        ).fetchall()

        if assignments_for_multiple_members and len(all_committee_member_ids) >=2 :
            for assignment_row in assignments_for_multiple_members:
                assignment_id = assignment_row[0]
                # Assign 2 random members to this assignment
                members_for_this_assignment = random.sample(all_committee_member_ids, k=min(2, len(all_committee_member_ids)))
                for member_id in members_for_this_assignment:
                    # Check if this combination already exists to prevent duplicates if script is run multiple times (though PK should handle it)
                    exists = cursor.execute("SELECT 1 FROM assignment_members WHERE assignment_id = ? AND committee_member_id = ?", (assignment_id, member_id)).fetchone()
                    if not exists:
                        assignment_members_data.append((assignment_id, member_id))
            if assignment_members_data:
                cursor.executemany("INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (?, ?)", assignment_members_data)
                conn.commit()
                print(f"Seeded {len(assignment_members_data)} assignment_members entries for M:N relationships.")
        else:
            print("Skipping seeding assignment_members: not enough assignments marked for multiple members or not enough committee members.")


    conn.close()
    print("Data seeding complete.")

if __name__ == '__main__':
    # It's good practice to ensure tables exist before seeding.
    # You could call setup_database() here if this script could be run independently,
    # but the prompt implies they are run sequentially.
    # from db_setup import setup_database
    # print("Ensuring database and tables exist...")
    # setup_database()
    print("Starting data seeding...")
    seed_data()
