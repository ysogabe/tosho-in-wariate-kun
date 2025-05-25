import sqlite3
import os

# デフォルトのデータベースパス
db_dir = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(db_dir, 'database.db')

def setup_database(custom_db_path=None):
    # カスタムパスが指定されていればそれを使用
    db_path = custom_db_path if custom_db_path else DATABASE_PATH
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade_id INTEGER,
        FOREIGN KEY (grade_id) REFERENCES grades(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS committee_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        class_id INTEGER,
        role TEXT,
        FOREIGN KEY (class_id) REFERENCES classes(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS libraries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        capacity INTEGER,
        is_active BOOLEAN
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS library_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        library_id INTEGER,
        day_of_week INTEGER, -- 0 for Sunday, 1 for Monday, etc.
        open_time TEXT,
        close_time TEXT,
        FOREIGN KEY (library_id) REFERENCES libraries(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT, -- e.g., 'min_members', 'max_hours_per_week'
        priority INTEGER
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT, -- YYYY-MM-DD
        end_date TEXT -- YYYY-MM-DD
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        library_id INTEGER,
        committee_member_id INTEGER, -- This can be NULL if assignment_members is used
        date TEXT, -- YYYY-MM-DD
        time_slot TEXT, -- e.g., '09:00-10:00'
        day_of_week INTEGER, -- 1 for Monday, 2 for Tuesday, etc.
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),
        FOREIGN KEY (library_id) REFERENCES libraries(id),
        FOREIGN KEY (committee_member_id) REFERENCES committee_members(id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS assignment_members (
        assignment_id INTEGER,
        committee_member_id INTEGER,
        PRIMARY KEY (assignment_id, committee_member_id),
        FOREIGN KEY (assignment_id) REFERENCES schedule_assignments(id),
        FOREIGN KEY (committee_member_id) REFERENCES committee_members(id)
    )
    ''')

    conn.commit()
    conn.close()

if __name__ == '__main__':
    setup_database()
    print("Database tables created successfully in mock_backend/database.db")
