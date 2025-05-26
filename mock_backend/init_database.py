import sqlite3
import os
import logging

# ロギングの設定
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def init_database(db_path='database.db'):
    """データベースの初期化"""
    logger.debug(f"データベースの初期化を開始します: {db_path}")
    
    # データベースファイルが既に存在する場合は削除
    if os.path.exists(db_path):
        logger.debug(f"既存のデータベースファイルを削除します: {db_path}")
        os.remove(db_path)
    
    # 新しいデータベース接続を作成
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    logger.debug("テーブルを作成します")
    
    # schools テーブル
    cursor.execute('''
    CREATE TABLE schools (
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
    
    # positions テーブル
    cursor.execute('''
    CREATE TABLE positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        position_name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # classes テーブル
    cursor.execute('''
    CREATE TABLE classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        grade INTEGER NOT NULL,
        class_number INTEGER NOT NULL,
        class_name TEXT NOT NULL,
        homeroom_teacher TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE RESTRICT
    )
    ''')
    
    # committee_members テーブル
    cursor.execute('''
    CREATE TABLE committee_members (
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
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE RESTRICT,
        FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE RESTRICT,
        FOREIGN KEY (position_id) REFERENCES positions (id) ON DELETE RESTRICT
    )
    ''')
    
    # library_rooms テーブル
    cursor.execute('''
    CREATE TABLE library_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        room_name TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE RESTRICT
    )
    ''')
    
    # schedules テーブル
    cursor.execute('''
    CREATE TABLE schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL,
        schedule_name TEXT NOT NULL,
        description TEXT,
        academic_year INTEGER NOT NULL,
        is_first_half BOOLEAN NOT NULL DEFAULT TRUE,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE RESTRICT
    )
    ''')
    
    # schedule_assignments テーブル
    cursor.execute('''
    CREATE TABLE schedule_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        library_room_id INTEGER NOT NULL,
        committee_member_id INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE,
        FOREIGN KEY (library_room_id) REFERENCES library_rooms (id) ON DELETE RESTRICT,
        FOREIGN KEY (committee_member_id) REFERENCES committee_members (id) ON DELETE RESTRICT
    )
    ''')
    
    logger.debug("インデックスを作成します")
    
    # インデックスの作成
    cursor.execute('CREATE UNIQUE INDEX idx_schools_name ON schools (school_name)')
    cursor.execute('CREATE UNIQUE INDEX idx_positions_name ON positions (position_name)')
    cursor.execute('CREATE UNIQUE INDEX idx_classes_school_grade_class_number ON classes (school_id, grade, class_number)')
    cursor.execute('CREATE UNIQUE INDEX idx_classes_school_class_name ON classes (school_id, class_name)')
    cursor.execute('CREATE UNIQUE INDEX idx_committee_members_student_id_year ON committee_members (school_id, student_id, academic_year)')
    cursor.execute('CREATE INDEX idx_committee_members_class_id ON committee_members (class_id)')
    cursor.execute('CREATE INDEX idx_committee_members_position_id ON committee_members (position_id)')
    cursor.execute('CREATE INDEX idx_committee_members_academic_year ON committee_members (academic_year)')
    cursor.execute('CREATE UNIQUE INDEX idx_library_rooms_school_room_id ON library_rooms (school_id, room_id)')
    cursor.execute('CREATE UNIQUE INDEX idx_library_rooms_school_name ON library_rooms (school_id, room_name)')
    cursor.execute('CREATE UNIQUE INDEX idx_schedules_school_year_term_active ON schedules (school_id, academic_year, is_first_half, status)')
    cursor.execute('CREATE INDEX idx_schedules_academic_year ON schedules (academic_year)')
    cursor.execute('CREATE INDEX idx_schedules_status ON schedules (status)')
    cursor.execute('CREATE UNIQUE INDEX idx_assignments_unique ON schedule_assignments (schedule_id, day_of_week, library_room_id, committee_member_id)')
    cursor.execute('CREATE INDEX idx_assignments_schedule_id ON schedule_assignments (schedule_id)')
    cursor.execute('CREATE INDEX idx_assignments_day_of_week ON schedule_assignments (day_of_week)')
    cursor.execute('CREATE INDEX idx_assignments_library_room_id ON schedule_assignments (library_room_id)')
    cursor.execute('CREATE INDEX idx_assignments_committee_member_id ON schedule_assignments (committee_member_id)')
    
    logger.debug("テーブルの作成が完了しました")
    
    # サンプルデータの挿入
    logger.debug("サンプルデータを挿入します")
    
    # schools
    cursor.execute("""
        INSERT INTO schools (school_name, first_term_start, first_term_end, second_term_start, second_term_end)
        VALUES ('中央小学校', '2025-04-01', '2025-09-30', '2025-10-01', '2026-03-31')
    """)
    school_id = cursor.lastrowid
    
    # positions
    positions_data = [
        ('委員長', '図書委員会の代表者'),
        ('副委員長', '委員長の補佐'),
        ('書記', '書記')
    ]
    cursor.executemany("INSERT INTO positions (position_name, description) VALUES (?, ?)", positions_data)
    
    # classes
    classes_data = [
        (school_id, 5, 1, '5A', '田中先生'),
        (school_id, 5, 2, '5B', '佐藤先生'),
        (school_id, 6, 1, '6A', '山田先生'),
        (school_id, 6, 2, '6B', '鈴木先生')
    ]
    cursor.executemany("INSERT INTO classes (school_id, grade, class_number, class_name, homeroom_teacher) VALUES (?, ?, ?, ?, ?)", classes_data)
    
    # library_rooms
    library_rooms_data = [
        (school_id, 1, '第一図書室', 2, 'メイン図書室'),
        (school_id, 2, '第二図書室', 1, 'サブ図書室')
    ]
    cursor.executemany("INSERT INTO library_rooms (school_id, room_id, room_name, capacity, description) VALUES (?, ?, ?, ?, ?)", library_rooms_data)
    
    # committee_members
    committee_members_data = [
        (school_id, 'S001', '田中太郎', 1, 1, 2025),  # 5A, 委員長
        (school_id, 'S002', '佐藤花子', 1, 2, 2025),  # 5A, 副委員長
        (school_id, 'S003', '山田次郎', 2, 3, 2025),  # 5B, 書記
        (school_id, 'S004', '鈴木美咲', 2, None, 2025),  # 5B, 一般委員
        (school_id, 'S005', '高橋健太', 3, None, 2025),  # 6A, 一般委員
        (school_id, 'S006', '伊藤美香', 3, None, 2025),  # 6A, 一般委員
        (school_id, 'S007', '渡辺大輔', 4, None, 2025),  # 6B, 一般委員
        (school_id, 'S008', '中村綾乃', 4, None, 2025)   # 6B, 一般委員
    ]
    cursor.executemany("INSERT INTO committee_members (school_id, student_id, name, class_id, position_id, academic_year) VALUES (?, ?, ?, ?, ?, ?)", committee_members_data)
    
    # schedules
    cursor.execute("""
        INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status)
        VALUES (?, '2025年度前期当番表', '2025年度前期の図書委員当番割り当て', 2025, TRUE, 'active')
    """, (school_id,))
    schedule_id = cursor.lastrowid
    
    # schedule_assignments (前期サンプル)
    schedule_assignments_data = [
        (schedule_id, 1, 1, 1),  # 月曜日・第一図書室・田中太郎
        (schedule_id, 1, 2, 2),  # 月曜日・第二図書室・佐藤花子
        (schedule_id, 2, 1, 3),  # 火曜日・第一図書室・山田次郎
        (schedule_id, 2, 2, 4),  # 火曜日・第二図書室・鈴木美咲
        (schedule_id, 3, 1, 5),  # 水曜日・第一図書室・高橋健太
        (schedule_id, 3, 2, 6),  # 水曜日・第二図書室・伊藤美香
        (schedule_id, 4, 1, 7),  # 木曜日・第一図書室・渡辺大輔
        (schedule_id, 4, 2, 8),  # 木曜日・第二図書室・中村綾乃
        (schedule_id, 5, 1, 1),  # 金曜日・第一図書室・田中太郎
        (schedule_id, 5, 2, 2)   # 金曜日・第二図書室・佐藤花子
    ]
    cursor.executemany("INSERT INTO schedule_assignments (schedule_id, day_of_week, library_room_id, committee_member_id) VALUES (?, ?, ?, ?)", schedule_assignments_data)
    
    conn.commit()
    logger.debug("サンプルデータの挿入が完了しました")
    
    # データベースの検証
    logger.debug("データベースの検証を行います")
    
    # テーブルの存在確認
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row['name'] for row in cursor.fetchall()]
    logger.debug(f"データベースのテーブル: {tables}")
    
    # 各テーブルのレコード数を確認
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
        count = cursor.fetchone()['count']
        logger.debug(f"テーブル {table} のレコード数: {count}")
    
    conn.close()
    logger.debug(f"データベースの初期化が完了しました: {db_path}")
    return True

if __name__ == "__main__":
    init_database()