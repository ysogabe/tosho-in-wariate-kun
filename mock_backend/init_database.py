import sqlite3
import os
import logging

# ロギングの設定
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def init_database(db_path='tosho_in_wariate.db'):
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
    
    # grades テーブル
    cursor.execute('''
    CREATE TABLE grades (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
    )
    ''')
    
    # classes テーブル
    cursor.execute('''
    CREATE TABLE classes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        grade_id INTEGER NOT NULL,
        FOREIGN KEY (grade_id) REFERENCES grades (id)
    )
    ''')
    
    # committee_members テーブル
    cursor.execute('''
    CREATE TABLE committee_members (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        class_id INTEGER NOT NULL,
        FOREIGN KEY (class_id) REFERENCES classes (id)
    )
    ''')
    
    # libraries テーブル
    cursor.execute('''
    CREATE TABLE libraries (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        capacity INTEGER,
        is_active INTEGER DEFAULT 1
    )
    ''')
    
    # schedules テーブル
    cursor.execute('''
    CREATE TABLE schedules (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_date TEXT,
        end_date TEXT
    )
    ''')
    
    # schedule_assignments テーブル
    cursor.execute('''
    CREATE TABLE schedule_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER,
        library_id INTEGER,
        committee_member_id INTEGER, -- This can be NULL if assignment_members is used
        date TEXT, -- YYYY-MM-DD
        time_slot TEXT, -- e.g., '09:00-10:00'
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),
        FOREIGN KEY (library_id) REFERENCES libraries(id),
        FOREIGN KEY (committee_member_id) REFERENCES committee_members(id)
    )
    ''')
    
    # assignment_members テーブル（現在は使用しない）
    # cursor.execute('''
    # CREATE TABLE assignment_members (
    #     id INTEGER PRIMARY KEY,
    #     assignment_id INTEGER NOT NULL,
    #     committee_member_id INTEGER NOT NULL,
    #     FOREIGN KEY (assignment_id) REFERENCES schedule_assignments (id),
    #     FOREIGN KEY (committee_member_id) REFERENCES committee_members (id)
    # )
    # ''')
    
    logger.debug("テーブルの作成が完了しました")
    
    # サンプルデータの挿入
    logger.debug("サンプルデータを挿入します")
    
    # grades
    cursor.execute("INSERT INTO grades (id, name, description) VALUES (1, '5年', '5年生')")
    cursor.execute("INSERT INTO grades (id, name, description) VALUES (2, '6年', '6年生')")
    
    # classes
    cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (1, '5年1組', 1)")
    cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (2, '5年2組', 1)")
    cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (3, '6年1組', 2)")
    cursor.execute("INSERT INTO classes (id, name, grade_id) VALUES (4, '6年2組', 2)")
    
    # committee_members
    for i in range(1, 4):  # 5年1組に3人
        cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '5年1組生徒{i}', 1)")
    
    for i in range(4, 7):  # 5年2組に3人
        cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '5年2組生徒{i-3}', 2)")
    
    for i in range(7, 10):  # 6年1組に3人
        cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '6年1組生徒{i-6}', 3)")
    
    for i in range(10, 13):  # 6年2組に3人
        cursor.execute(f"INSERT INTO committee_members (id, name, class_id) VALUES ({i}, '6年2組生徒{i-9}', 4)")
    
    # libraries
    cursor.execute("INSERT INTO libraries (id, name, is_active) VALUES (1, '図書室A', 1)")
    cursor.execute("INSERT INTO libraries (id, name, is_active) VALUES (2, '図書室B', 1)")
    
    # 前期スケジュール（後期テスト用）
    cursor.execute("""
    INSERT INTO schedules (id, name, description, start_date, end_date) 
    VALUES (1, '2025年度前期図書委員スケジュール', '前期スケジュール', '2025-04-01', '2025-09-30')
    """)
    
    # 前期の水曜・金曜割り当て
    cursor.execute("""INSERT INTO schedule_assignments (id, schedule_id, library_id, committee_member_id, date, time_slot) 
                      VALUES (1, 1, 1, 1, '2025-04-02', '09:00-10:00')""")  # 水曜日
    cursor.execute("""INSERT INTO schedule_assignments (id, schedule_id, library_id, committee_member_id, date, time_slot) 
                      VALUES (2, 1, 1, 4, '2025-04-04', '09:00-10:00')""")  # 金曜日
    
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
