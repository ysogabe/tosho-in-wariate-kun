import sqlite3
import random
import datetime
from typing import List, Dict, Set
import logging
import os

# ロギングの設定
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ScheduleGenerator:
    """スケジュールジェネレータークラス（修正版）"""
    
    def __init__(self, academic_year: str, is_first_half: bool):
        """
        コンストラクタ
        
        Args:
            academic_year: 学年度 (例: "2025")
            is_first_half: 前期か後期かのフラグ (True: 前期, False: 後期)
        """
        logger.debug(f"ScheduleGenerator初期化: academic_year={academic_year}, is_first_half={is_first_half}")
        self.academic_year = academic_year
        self.is_first_half = is_first_half
        self.committee_members = []
        self.libraries = []
        self.wed_fri_members = set()  # 水曜・金曜担当の委員IDs
        self.schedule_id = None
        self.conn = None
    
    def get_db_connection(self):
        """データベース接続を取得"""
        logger.debug("データベース接続を取得します")
        if self.conn is None:
            logger.debug("新しい接続を作成します")
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
            self.conn = sqlite3.connect(db_path)
            self.conn.row_factory = sqlite3.Row
        else:
            logger.debug("既存の接続を使用します")
        return self.conn
    
    def close_db_connection(self):
        """データベース接続を閉じる"""
        if self.conn is not None:
            logger.debug("データベース接続を閉じます")
            self.conn.close()
            self.conn = None
    
    def load_committee_members(self) -> List[Dict]:
        """図書委員データの読み込み"""
        logger.debug("図書委員データの読み込みを開始します")
        conn = self.get_db_connection()
        
        # 5年、6年生の図書委員を取得
        query = """
        SELECT cm.id, cm.name, cm.role, c.id as class_id, c.name as class_name, 
               g.id as grade_id, g.name as grade_name
        FROM committee_members cm
        JOIN classes c ON cm.class_id = c.id
        JOIN grades g ON c.grade_id = g.id
        WHERE g.name LIKE '5%' OR g.name LIKE '6%'
        """
        
        cursor = conn.execute(query)
        self.committee_members = [dict(row) for row in cursor.fetchall()]
        logger.debug(f"図書委員データを {len(self.committee_members)} 件読み込みました")
        
        # 後期の場合、前期の水曜・金曜担当者を取得
        if not self.is_first_half:
            logger.debug("後期のため、前期の水曜・金曜担当者を取得します")
            # 前期のスケジュールを検索
            cursor = conn.execute(
                "SELECT id FROM schedules WHERE name LIKE ? AND name LIKE '%前期%' ORDER BY id DESC LIMIT 1",
                (f"%{self.academic_year}%",)
            )
            first_half_schedule = cursor.fetchone()
            
            if first_half_schedule:
                first_half_id = first_half_schedule['id']
                logger.debug(f"前期スケジュールID: {first_half_id}")
                # 水曜日と金曜日の割り当てを取得（簡易的に日付ベースで判定）
                cursor = conn.execute("""
                    SELECT DISTINCT committee_member_id
                    FROM schedule_assignments 
                    WHERE schedule_id = ? AND (
                        CAST(strftime('%w', date) AS INTEGER) = 3 OR 
                        CAST(strftime('%w', date) AS INTEGER) = 5
                    )
                """, (first_half_id,))
                
                self.wed_fri_members = {row['committee_member_id'] for row in cursor.fetchall()}
                logger.debug(f"前期の水曜・金曜担当者: {self.wed_fri_members}")
        
        return self.committee_members
    
    def load_libraries(self) -> List[Dict]:
        """図書室データの読み込み"""
        logger.debug("図書室データの読み込みを開始します")
        conn = self.get_db_connection()
        cursor = conn.execute('SELECT * FROM libraries WHERE is_active = 1')
        self.libraries = [dict(row) for row in cursor.fetchall()]
        logger.debug(f"図書室データを {len(self.libraries)} 件読み込みました")
        return self.libraries
    
    def create_schedule(self, name: str, description: str, start_date: str, end_date: str) -> int:
        """スケジュールの基本情報を作成"""
        logger.debug(f"スケジュール基本情報を作成します: {name}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO schedules (name, description, start_date, end_date) VALUES (?, ?, ?, ?)',
            (name, description, start_date, end_date)
        )
        self.schedule_id = cursor.lastrowid
        conn.commit()
        logger.debug(f"スケジュールを作成しました。ID: {self.schedule_id}")
        return self.schedule_id
    
    def assign_members_to_weekdays(self) -> Dict:
        """図書委員を曜日と図書室に割り当て"""
        logger.debug("図書委員の曜日・図書室割り当てを開始します")
        
        # 図書室ごと、曜日ごとの割り当てを初期化
        assignments = {}
        for library in self.libraries:
            library_id = library['id']
            assignments[library_id] = {
                1: [],  # 月曜日
                2: [],  # 火曜日
                3: [],  # 水曜日
                4: [],  # 木曜日
                5: []   # 金曜日
            }
        
        # 図書委員の割り当て回数を追跡
        member_assignments = {member['id']: 0 for member in self.committee_members}
        
        # 図書委員の曜日割り当てを追跡（同一委員が同じ曜日に複数回割り当てられることを防ぐ）
        member_weekdays = {member['id']: set() for member in self.committee_members}
        
        # クラスの曜日割り当てを追跡
        class_weekdays = {}
        for member in self.committee_members:
            class_id = member['class_id']
            if class_id not in class_weekdays:
                class_weekdays[class_id] = set()
        
        # 曜日ごとに図書委員を割り当て
        for weekday in range(1, 6):  # 月曜から金曜
            logger.debug(f"曜日 {weekday} の割り当てを処理します")
            is_wed_or_fri = weekday in [3, 5]  # 水曜日または金曜日
            
            # この曜日に既に割り当てられた委員を追跡
            assigned_members_today = set()
            
            # 各図書室に2人ずつ割り当て
            for library in self.libraries:
                library_id = library['id']
                logger.debug(f"図書室 {library['name']} の割り当てを処理します")
                
                # 図書委員をシャッフル
                members = list(self.committee_members)
                random.shuffle(members)
                
                # 2人の図書委員を割り当て
                assigned_count = 0
                for member in members:
                    if assigned_count >= 2:
                        break
                        
                    member_id = member['id']
                    class_id = member['class_id']
                    
                    # 既にこの日に割り当てられている場合はスキップ
                    if member_id in assigned_members_today:
                        continue
                    
                    # 割り当て条件のチェック
                    # 1. 既に週2回割り当てられていないか
                    if member_assignments[member_id] >= 2:
                        continue
                        
                    # 2. 既にこの曜日に割り当てられていないか
                    if weekday in member_weekdays[member_id]:
                        continue
                        
                    # 3. 同じクラスの他の図書委員がこの曜日に割り当てられていないか
                    if weekday in class_weekdays[class_id]:
                        continue
                        
                    # 4. 後期の場合、前期に水曜・金曜担当だった委員は水曜・金曜に割り当てない
                    if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
                        logger.debug(f"前期に水曜・金曜担当だった委員ID {member_id} を除外します")
                        continue
                        
                    # 条件を満たす場合、割り当てを行う
                    assignments[library_id][weekday].append(member)
                    member_assignments[member_id] += 1
                    member_weekdays[member_id].add(weekday)
                    class_weekdays[class_id].add(weekday)
                    assigned_members_today.add(member_id)
                    assigned_count += 1
                    logger.debug(f"委員ID {member_id} を曜日 {weekday}、図書室ID {library_id} に割り当てました")
        
        # 割り当て結果のログ
        for library_id in assignments:
            for weekday, members in assignments[library_id].items():
                logger.debug(f"図書室ID {library_id} 曜日 {weekday} の割り当て: {[m['id'] for m in members]}")
        
        return assignments
    
    def save_assignments(self, assignments: Dict, schedule_id: int) -> None:
        """割り当てをデータベースに保存"""
        logger.debug(f"割り当てをデータベースに保存します。スケジュールID: {schedule_id}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 各図書室と曜日の組み合わせに対して割り当てを保存
        for library_id, weekday_assignments in assignments.items():
            logger.debug(f"図書室ID {library_id} の割り当てを保存します")
            
            # 各曜日の割り当てを保存
            for weekday, members in weekday_assignments.items():
                if not members:
                    continue
                    
                # 各メンバーに対してスケジュール割り当てを作成
                for member in members:
                    # 曜日番号を実際の日付に変換（仮の実装）
                    base_date = datetime.datetime.strptime('2025-04-01', '%Y-%m-%d')
                    # 最初の該当曜日を見つける
                    days_ahead = weekday - base_date.isoweekday()
                    if days_ahead < 0:
                        days_ahead += 7
                    actual_date = base_date + datetime.timedelta(days=days_ahead)
                    
                    cursor.execute(
                        'INSERT INTO schedule_assignments (schedule_id, library_id, committee_member_id, date, time_slot) VALUES (?, ?, ?, ?, ?)',
                        (schedule_id, library_id, member['id'], actual_date.strftime('%Y-%m-%d'), '09:00-10:00')
                    )
                    logger.debug(f"委員ID {member['id']} の割り当てを作成しました: 図書館ID {library_id}, 曜日 {weekday}")
        
        conn.commit()
        logger.debug("割り当ての保存が完了しました")
    
    def generate(self, name: str, description: str, start_date: str, end_date: str) -> int:
        """スケジュール生成のメインメソッド"""
        logger.debug(f"スケジュール生成を開始します: {name}")
        try:
            # スケジュールの基本情報を作成
            schedule_id = self.create_schedule(name, description, start_date, end_date)
            
            # 図書委員を曜日に割り当て
            assignments = self.assign_members_to_weekdays()
            
            # 割り当てをデータベースに保存
            self.save_assignments(assignments, schedule_id)
            
            logger.debug(f"スケジュール生成が完了しました。ID: {schedule_id}")
            return schedule_id
        except Exception as e:
            logger.error(f"スケジュール生成中にエラーが発生しました: {e}", exc_info=True)
            raise
        finally:
            # 処理完了後にデータベース接続を閉じる
            self.close_db_connection()
    
    def get_schedule_assignments(self, schedule_id: int) -> List[Dict]:
        """スケジュール割り当ての取得"""
        logger.debug(f"スケジュール割り当てを取得します。スケジュールID: {schedule_id}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                sa.id,
                sa.schedule_id,
                sa.library_id,
                sa.date,
                sa.time_slot,
                l.name as library_name,
                sa.committee_member_id,
                cm.name as member_name
            FROM schedule_assignments sa
            LEFT JOIN libraries l ON sa.library_id = l.id
            LEFT JOIN committee_members cm ON sa.committee_member_id = cm.id
            WHERE sa.schedule_id = ?
            ORDER BY sa.date, sa.library_id, cm.name
        ''', (schedule_id,))
        
        assignments = []
        for row in cursor.fetchall():
            assignment = {
                'id': row[0],
                'schedule_id': row[1],
                'library_id': row[2],
                'date': row[3],
                'time_slot': row[4],
                'library_name': row[5],
                'committee_member_id': row[6],
                'member_name': row[7]
            }
            assignments.append(assignment)
        
        logger.debug(f"取得した割り当て数: {len(assignments)}")
        return assignments

    def generate_schedule_logic(self, name: str, description: str, start_date: str, end_date: str) -> dict:
        """スケジュール生成のロジック（フロントエンド連携用）"""
        logger.info(f"スケジュール生成ロジック開始: {name}")
        
        try:
            # 図書委員データを読み込み
            self.load_committee_members()
            
            # 図書室データを読み込み
            self.load_libraries()
            
            # スケジュールを生成
            schedule_id = self.generate(name, description, start_date, end_date)
            
            # 生成されたスケジュールの詳細を取得
            assignments = self.get_schedule_assignments(schedule_id)
            
            result = {
                "success": True,
                "message": "スケジュールが正常に生成されました",
                "scheduleId": schedule_id,
                "name": name,
                "description": description,
                "startDate": start_date,
                "endDate": end_date,
                "assignmentCount": len(assignments),
                "assignments": assignments
            }
            
            logger.info(f"スケジュール生成完了: ID={schedule_id}, 割り当て数={len(assignments)}")
            return result
            
        except Exception as e:
            logger.error(f"スケジュール生成エラー: {str(e)}")
            return {
                "success": False,
                "message": f"スケジュール生成に失敗しました: {str(e)}",
                "scheduleId": None
            }

# Helper functions for testing
def get_db_connection():
    """データベース接続を取得するヘルパー関数"""
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_committee_members(grade_ids=None):
    """図書委員のリストを取得
    
    Args:
        grade_ids (list, optional): 対象の学年IDリスト。Noneの場合は全学年
    
    Returns:
        list: 図書委員リスト
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # テーブル構造を確認
    cursor.execute("PRAGMA table_info(committee_members)")
    cm_columns = [row[1] for row in cursor.fetchall()]
    
    # テーブル構造に応じてクエリを調整
    if 'grade_id' in cm_columns:
        # 新しいスキーマ: committee_membersテーブルに直接grade_idがある
        if grade_ids is None:
            cursor.execute("""
                SELECT cm.*, g.name as grade_name, c.name as class_name 
                FROM committee_members cm
                LEFT JOIN grades g ON cm.grade_id = g.id
                LEFT JOIN classes c ON cm.class_id = c.id
                ORDER BY cm.grade_id, cm.class_id, cm.name
            """)
        else:
            placeholders = ','.join(['?' for _ in grade_ids])
            cursor.execute(f"""
                SELECT cm.*, g.name as grade_name, c.name as class_name 
                FROM committee_members cm
                LEFT JOIN grades g ON cm.grade_id = g.id
                LEFT JOIN classes c ON cm.class_id = c.id
                WHERE cm.grade_id IN ({placeholders})
                ORDER BY cm.grade_id, cm.class_id, cm.name
            """, grade_ids)
    else:
        # 古いスキーマ: classesテーブル経由でgrade_idを取得
        if grade_ids is None:
            cursor.execute("""
                SELECT cm.*, g.name as grade_name, c.name as class_name 
                FROM committee_members cm
                JOIN classes c ON cm.class_id = c.id
                JOIN grades g ON c.grade_id = g.id
                ORDER BY g.id, c.id, cm.name
            """)
        else:
            placeholders = ','.join(['?' for _ in grade_ids])
            cursor.execute(f"""
                SELECT cm.*, g.name as grade_name, c.name as class_name 
                FROM committee_members cm
                JOIN classes c ON cm.class_id = c.id
                JOIN grades g ON c.grade_id = g.id
                WHERE g.id IN ({placeholders})
                ORDER BY g.id, c.id, cm.name
            """, grade_ids)
        
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return members

def get_libraries():
    """図書室のリストを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM libraries ORDER BY id")
    libraries = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return libraries

def get_schedule_stats(schedule_id: int):
    """スケジュールの統計情報を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 総割り当て数
    cursor.execute("""
        SELECT COUNT(*) as total_assignments
        FROM schedule_assignments 
        WHERE schedule_id = ?
    """, (schedule_id,))
    total_assignments = cursor.fetchone()[0]
    
    # メンバー別の割り当て数
    cursor.execute("""
        SELECT cm.name, COUNT(*) as assignment_count
        FROM schedule_assignments sa
        JOIN committee_members cm ON sa.committee_member_id = cm.id
        WHERE sa.schedule_id = ?
        GROUP BY cm.id, cm.name
        ORDER BY assignment_count DESC
    """, (schedule_id,))
    member_stats = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    # 図書室別の割り当て数
    cursor.execute("""
        SELECT l.name, COUNT(*) as assignment_count
        FROM schedule_assignments sa
        JOIN libraries l ON sa.library_id = l.id
        WHERE sa.schedule_id = ?
        GROUP BY l.id, l.name
        ORDER BY assignment_count DESC
    """, (schedule_id,))
    library_stats = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_assignments": total_assignments,
        "member_stats": member_stats,
        "library_stats": library_stats
    }

def generate_schedule(academic_year: str, is_first_half: bool, name: str, 
                     description: str, start_date: str, end_date: str):
    """スケジュールを生成（レガシー関数）"""
    return generate_schedule_with_class(academic_year, is_first_half, name, description, start_date, end_date)

def generate_schedule_with_class(academic_year: str, is_first_half: bool, name: str = None, 
                                description: str = None, start_date: str = None, end_date: str = None):
    """スケジュールジェネレータークラスを使用してスケジュールを生成"""
    try:
        # デフォルト値の設定
        if name is None:
            semester = "前期" if is_first_half else "後期"
            name = f"{academic_year}年度{semester}スケジュール"
        
        if description is None:
            semester = "前期" if is_first_half else "後期"
            description = f"{academic_year}年度{semester}の図書当番スケジュール"
        
        # 年度に基づく期間の自動設定
        if start_date is None or end_date is None:
            year = int(academic_year)
            if is_first_half:
                # 前期: 4月1日 - 9月30日
                start_date = f"{year}-04-01"
                end_date = f"{year}-09-30"
            else:
                # 後期: 10月1日 - 3月31日（翌年）
                start_date = f"{year}-10-01"
                end_date = f"{year + 1}-03-31"
        
        logger.info(f"スケジュール生成開始: {name}")
        logger.info(f"期間: {start_date} - {end_date}")
        
        # ScheduleGeneratorのインスタンスを作成
        generator = ScheduleGenerator(academic_year, is_first_half)
        
        # スケジュールを生成
        result = generator.generate_schedule_logic(name, description, start_date, end_date)
        
        # データベース接続を閉じる
        generator.close_db_connection()
        
        return result
        
    except Exception as e:
        logger.error(f"スケジュール生成エラー: {str(e)}")
        raise e

def get_library_availability():
    """図書室の利用可能性を取得
    
    Returns:
        dict: 図書室IDをキーとし、各曜日の利用可能性を含む辞書
        例: {1: {1: ['09:00-10:00'], 2: ['09:00-10:00'], ...}, 2: {...}}
    """
    try:
        conn = get_db_connection()
        cursor = conn.execute("SELECT id, name FROM libraries")
        libraries = cursor.fetchall()
        
        # 各図書室について曜日別の利用可能時間を設定
        availability = {}
        for library in libraries:
            library_id = library['id']
            availability[library_id] = {}
            # 月曜日から金曜日まで
            for day in range(1, 6):
                availability[library_id][day] = ['09:00-10:00', '10:00-11:00']
            
        logger.debug(f"図書室利用可能性: {availability}")
        return availability
        
    except Exception as e:
        logger.error(f"図書室利用可能性の取得でエラー: {e}")
        return {}

def create_schedule(name, description, start_date, end_date, academic_year=2025, is_first_half=True):
    """新しいスケジュールを作成
    
    Args:
        name (str): スケジュール名
        description (str): 説明
        start_date (str): 開始日
        end_date (str): 終了日
        academic_year (int): 年度（デフォルト: 2025）
        is_first_half (bool): 前期かどうか（デフォルト: True）
    
    Returns:
        int: 作成されたスケジュールのID
    """
    try:
        conn = get_db_connection()
        # テーブル構造を確認して適切なINSERT文を使用
        cursor = conn.execute("PRAGMA table_info(schedules)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'academic_year' in columns and 'is_first_half' in columns:
            # 新しいスキーマの場合
            cursor = conn.execute(
                """INSERT INTO schedules (name, description, start_date, end_date, academic_year, is_first_half)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (name, description, start_date, end_date, academic_year, is_first_half)
            )
        else:
            # 古いスキーマの場合
            cursor = conn.execute(
                """INSERT INTO schedules (name, description, start_date, end_date)
                   VALUES (?, ?, ?, ?)""",
                (name, description, start_date, end_date)
            )
        
        conn.commit()
        schedule_id = cursor.lastrowid
        logger.info(f"新しいスケジュールを作成: ID={schedule_id}, 名前={name}")
        return schedule_id
        
    except Exception as e:
        logger.error(f"スケジュール作成でエラー: {e}")
        raise

def create_schedule_assignment(schedule_id, committee_member_id, library_id, date):
    """スケジュール割り当てを作成
    
    Args:
        schedule_id (int): スケジュールID
        committee_member_id (int): 図書委員ID
        library_id (int): 図書室ID
        date (str): 日付
    
    Returns:
        int: 作成された割り当てのID
    """
    try:
        conn = get_db_connection()
        cursor = conn.execute(
            """INSERT INTO schedule_assignments (schedule_id, committee_member_id, library_id, date)
               VALUES (?, ?, ?, ?)""",
            (schedule_id, committee_member_id, library_id, date)
        )
        conn.commit()
        assignment_id = cursor.lastrowid
        logger.debug(f"新しい割り当てを作成: ID={assignment_id}, スケジュール={schedule_id}, 委員={committee_member_id}, 図書室={library_id}, 日付={date}")
        return assignment_id
        
    except Exception as e:
        logger.error(f"スケジュール割り当て作成でエラー: {e}")
        raise

def generate_date_range(start_date, end_date):
    """日付範囲を生成
    
    Args:
        start_date (str): 開始日 (YYYY-MM-DD)
        end_date (str): 終了日 (YYYY-MM-DD)
    
    Returns:
        list: 日付のリスト
    """
    try:
        from datetime import datetime, timedelta
        
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        dates = []
        current = start
        while current <= end:
            dates.append(current.strftime('%Y-%m-%d'))
            current += timedelta(days=1)
            
        logger.debug(f"日付範囲を生成: {start_date} から {end_date} まで {len(dates)} 日")
        return dates
        
    except Exception as e:
        logger.error(f"日付範囲生成でエラー: {e}")
        return []
