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

    # Create schools table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_name TEXT NOT NULL,
        first_term_start DATE,
        first_term_end DATE,
        second_term_start DATE,
        second_term_end DATE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create positions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        position_name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create classes table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        grade INTEGER NOT NULL,
        class_number INTEGER NOT NULL,
        class_name TEXT NOT NULL,
        homeroom_teacher TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT
    )
    ''')

    # Create committee_members table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS committee_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        name TEXT NOT NULL,
        class_id INTEGER NOT NULL,
        position_id INTEGER,
        academic_year INTEGER NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
        FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT
    )
    ''')

    # Create library_rooms table (renamed from libraries)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS library_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        room_name TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        location TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT,
        UNIQUE(school_id, room_id)
    )
    ''')

    # Create schedules table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        schedule_name TEXT NOT NULL,
        description TEXT,
        academic_year INTEGER NOT NULL,
        is_first_half BOOLEAN NOT NULL DEFAULT TRUE,
        status TEXT NOT NULL DEFAULT 'draft',
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT
    )
    ''')

    # Create schedule_assignments table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS schedule_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        library_room_id INTEGER NOT NULL,
        committee_member_id INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (library_room_id) REFERENCES library_rooms(id) ON DELETE RESTRICT,
        FOREIGN KEY (committee_member_id) REFERENCES committee_members(id) ON DELETE RESTRICT
    )
    ''')

    # Create indexes for performance and constraints
    try:
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_name ON schools (school_name)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_name ON positions (position_name)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_school_grade_class_number ON classes (school_id, grade, class_number)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_school_class_name ON classes (school_id, class_name)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_committee_members_student_id_year ON committee_members (school_id, student_id, academic_year)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_committee_members_class_id ON committee_members (class_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_committee_members_position_id ON committee_members (position_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_committee_members_academic_year ON committee_members (academic_year)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_library_rooms_school_room_id ON library_rooms (school_id, room_id)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_library_rooms_school_name ON library_rooms (school_id, room_name)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_school_year_term_active ON schedules (school_id, academic_year, is_first_half, status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_schedules_academic_year ON schedules (academic_year)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules (status)')
        cursor.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_unique ON schedule_assignments (schedule_id, day_of_week, library_room_id, committee_member_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_assignments_schedule_id ON schedule_assignments (schedule_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_assignments_day_of_week ON schedule_assignments (day_of_week)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_assignments_library_room_id ON schedule_assignments (library_room_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_assignments_committee_member_id ON schedule_assignments (committee_member_id)')
    except sqlite3.Error as e:
        print(f"Warning: Failed to create some indexes: {e}")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    setup_database()
    print("Database tables created successfully in mock_backend/database.db")