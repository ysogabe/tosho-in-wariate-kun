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
    """スケジュールジェネレータークラス（新スキーマ対応版）"""
    
    def __init__(self, school_id: int, academic_year: int, is_first_half: bool):
        """
        コンストラクタ
        
        Args:
            school_id: 学校ID
            academic_year: 学年度 (例: 2025)
            is_first_half: 前期か後期かのフラグ (True: 前期, False: 後期)
        """
        logger.debug(f"ScheduleGenerator初期化: school_id={school_id}, academic_year={academic_year}, is_first_half={is_first_half}")
        self.school_id = school_id
        self.academic_year = academic_year
        self.is_first_half = is_first_half
        self.committee_members = []
        self.library_rooms = []
        self.classes = []
        self.positions = []
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
        """図書委員データの読み込み（新スキーマ対応）"""
        logger.debug("図書委員データの読み込みを開始します")
        conn = self.get_db_connection()
        
        # 5年、6年生の図書委員を取得（新スキーマ対応）
        query = """
        SELECT cm.id, cm.name, cm.student_id, cm.class_id, cm.position_id, cm.academic_year,
               c.id as class_id, c.class_name, c.grade,
               p.position_name,
               s.school_name
        FROM committee_members cm
        JOIN classes c ON cm.class_id = c.id
        JOIN schools s ON cm.school_id = s.id
        LEFT JOIN positions p ON cm.position_id = p.id
        WHERE cm.school_id = ? 
        AND cm.academic_year = ? 
        AND cm.active = 1
        AND (c.grade = 5 OR c.grade = 6)
        """
        
        cursor = conn.execute(query, (self.school_id, self.academic_year))
        self.committee_members = [dict(row) for row in cursor.fetchall()]
        logger.debug(f"図書委員データを {len(self.committee_members)} 件読み込みました")
        
        # 後期の場合、前期の水曜・金曜担当者を取得
        if not self.is_first_half:
            logger.debug("後期のため、前期の水曜・金曜担当者を取得します")
            # 前期のスケジュールを検索
            cursor = conn.execute("""
                SELECT id FROM schedules 
                WHERE school_id = ? 
                AND academic_year = ? 
                AND is_first_half = 1 
                AND status = 'active'
                ORDER BY id DESC LIMIT 1
            """, (self.school_id, self.academic_year))
            
            first_half_schedule = cursor.fetchone()
            
            if first_half_schedule:
                first_half_id = first_half_schedule['id']
                logger.debug(f"前期スケジュールID: {first_half_id}")
                # 水曜日と金曜日の割り当てを取得
                cursor = conn.execute("""
                    SELECT DISTINCT committee_member_id
                    FROM schedule_assignments 
                    WHERE schedule_id = ? AND (day_of_week = 3 OR day_of_week = 5)
                """, (first_half_id,))
                
                self.wed_fri_members = {row['committee_member_id'] for row in cursor.fetchall()}
                logger.debug(f"前期の水曜・金曜担当者: {self.wed_fri_members}")
        
        return self.committee_members
    
    def load_library_rooms(self) -> List[Dict]:
        """図書室データの読み込み（新スキーマ対応）"""
        logger.debug("図書室データの読み込みを開始します")
        conn = self.get_db_connection()
        try:
            # テーブル構造を確認
            cursor = conn.execute("PRAGMA table_info(library_rooms)")
            columns = [row[1] for row in cursor.fetchall()]
            logger.debug(f"図書室テーブルのカラム: {columns}")
            
            # 基本クエリ
            query = "SELECT id, school_id, room_id, room_name, capacity, description, active"
            
            # locationフィールドが存在する場合は追加
            if 'location' in columns:
                query += ", location"
            
            query += " FROM library_rooms WHERE school_id = ? AND active = 1"
            
            cursor = conn.execute(query, (self.school_id,))
            self.library_rooms = [dict(row) for row in cursor.fetchall()]
            
            # locationフィールドが存在しない場合は空の値を追加
            if 'location' not in columns:
                for room in self.library_rooms:
                    room['location'] = ""
                    
            logger.debug(f"図書室データを {len(self.library_rooms)} 件読み込みました")
            return self.library_rooms
        except Exception as e:
            logger.error(f"図書室データの読み込み中にエラーが発生しました: {e}")
            self.library_rooms = []
            return []
    
    def create_schedule(self, name: str, description: str = "") -> int:
        """スケジュールの基本情報を作成（新スキーマ対応）"""
        logger.debug(f"スケジュール基本情報を作成します: {name}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            # 既存のドラフトスケジュールとその関連する割り当てを削除
            cursor.execute("""
                DELETE FROM schedule_assignments 
                WHERE schedule_id IN (
                    SELECT id FROM schedules 
                    WHERE school_id = ? AND academic_year = ? AND is_first_half = ? AND status = 'draft'
                )
            """, (self.school_id, self.academic_year, self.is_first_half))
            
            cursor.execute("""
                DELETE FROM schedules 
                WHERE school_id = ? AND academic_year = ? AND is_first_half = ? AND status = 'draft'
            """, (self.school_id, self.academic_year, self.is_first_half))
            conn.commit()
            logger.debug("既存のドラフトスケジュールを削除しました")
            
            # 新しいスケジュールを作成
            cursor.execute("""
                INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status) 
                VALUES (?, ?, ?, ?, ?, 'draft')
            """, (self.school_id, name, description, self.academic_year, self.is_first_half))
            self.schedule_id = cursor.lastrowid
            conn.commit()
            logger.debug(f"スケジュールを作成しました。ID: {self.schedule_id}")
            return self.schedule_id
        except Exception as e:
            logger.error(f"スケジュール作成中にエラーが発生しました: {e}")
            conn.rollback()
            raise
    
    def assign_members_to_weekdays(self) -> Dict:
        """図書委員を曜日と図書室に割り当て（制約充足アルゴリズム）"""
        logger.debug("図書委員の曜日・図書室割り当てを開始します")
        
        # 図書室ごと、曜日ごとの割り当てを初期化
        assignments = {}
        for library_room in self.library_rooms:
            library_room_id = library_room['id']
            assignments[library_room_id] = {
                1: [],  # 月曜日
                2: [],  # 火曜日
                3: [],  # 水曜日
                4: [],  # 木曜日
                5: []   # 金曜日
            }
        
        # 制約充足による最適化された割り当て
        success = self._assign_with_constraints(assignments)
        
        if not success:
            logger.warning("制約充足による割り当てに失敗しました。フォールバックアルゴリズムを使用します。")
            # フォールバック: 元のアルゴリズムを使用
            return self._fallback_assignment()
        
        # 割り当て結果のログと統計
        self._log_assignment_statistics(assignments)
        
        return assignments
    
    def _assign_with_constraints(self, assignments: Dict) -> bool:
        """制約充足による割り当て実行（改良版）"""
        logger.debug("制約充足アルゴリズムによる割り当てを開始します")
        
        # 各委員が週2回担当する制約
        target_assignments_per_member = 2
        total_required_assignments = len(self.committee_members) * target_assignments_per_member
        
        # 収容人数制約を削除 - 容量チェックは不要
        logger.debug(f"委員数: {len(self.committee_members)}, 必要割り当て総数: {total_required_assignments}")
        
        # より効果的な割り当て戦略：グリーディアプローチ + 最適化
        return self._greedy_assign_with_optimization(assignments)
    
    def _greedy_assign_with_optimization(self, assignments: Dict) -> bool:
        """グリーディアプローチによる最適化割り当て"""
        logger.debug("グリーディアプローチによる割り当てを開始します")
        
        # 割り当て状況を追跡
        member_assignments = {member['id']: 0 for member in self.committee_members}
        member_weekdays = {member['id']: set() for member in self.committee_members}
        class_weekdays = {member['class_id']: set() for member in self.committee_members}
        
        # 後期の場合、委員リストをシャッフルして割り当て順序を変更
        members_to_assign = list(self.committee_members)
        if not self.is_first_half:
            logger.debug("後期のため、委員リストをシャッフルします")
            random.shuffle(members_to_assign)
        
        # 各委員に2回ずつ確実に割り当てるアプローチ
        for member in members_to_assign:
            member_id = member['id']
            class_id = member['class_id']
            
            assignments_needed = 2
            attempts = 0
            max_attempts = 50
            
            while assignments_needed > 0 and attempts < max_attempts:
                attempts += 1
                best_slot = self._find_best_assignment_slot(
                    member, assignments, member_weekdays, class_weekdays, member_assignments
                )
                
                if best_slot is None:
                    logger.warning(f"委員ID {member_id} の割り当てスロットが見つかりません（残り{assignments_needed}回）")
                    break
                
                weekday, library_room_id = best_slot
                library_room = next(room for room in self.library_rooms if room['id'] == library_room_id)
                
                # 割り当て実行
                assignments[library_room_id][weekday].append(member)
                member_assignments[member_id] += 1
                member_weekdays[member_id].add(weekday)
                class_weekdays[class_id].add(weekday)
                assignments_needed -= 1
                
                logger.debug(f"委員ID {member_id} を{weekday}曜日の{library_room['room_name']}に割り当て")
        
        # 割り当て完了チェック
        incomplete_members = [
            member for member in self.committee_members 
            if member_assignments[member['id']] < 2
        ]
        
        if incomplete_members:
            logger.warning(f"完全な割り当てに失敗: {len(incomplete_members)}人が未完了")
            # 不完全な委員について追加試行
            self._fill_incomplete_assignments(
                incomplete_members, assignments, member_assignments, 
                member_weekdays, class_weekdays
            )
        
        return True
    
    def _find_best_assignment_slot(self, member: Dict, assignments: Dict, 
                                  member_weekdays: Dict, class_weekdays: Dict,
                                  member_assignments: Dict) -> tuple:
        """委員にとって最適な割り当てスロットを検索"""
        member_id = member['id']
        class_id = member['class_id']
        
        candidates = []
        
        for weekday in range(1, 6):
            # 後期の水曜・金曜制約チェック
            is_wed_or_fri = weekday in [3, 5]
            if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
                continue
            
            # 既に割り当て済みの曜日はスキップ
            if weekday in member_weekdays[member_id]:
                continue
            
            # 同じクラスの他の委員が既に割り当て済みの曜日はスキップ
            if weekday in class_weekdays[class_id]:
                continue
            
            for library_room in self.library_rooms:
                library_room_id = library_room['id']
                # 収容人数制約を削除 - 無制限に割り当て可能
                # スコア計算（優先度を考慮）
                score = self._calculate_assignment_score(
                    member, weekday, library_room_id, assignments, member_assignments
                )
                candidates.append((score, weekday, library_room_id))
        
        if not candidates:
            return None
        
        # 最高スコアのスロットを選択
        candidates.sort(reverse=True)
        _, best_weekday, best_room_id = candidates[0]
        return (best_weekday, best_room_id)
    
    def _calculate_assignment_score(self, member: Dict, weekday: int, library_room_id: int,
                                   assignments: Dict, member_assignments: Dict) -> float:
        """割り当てスロットのスコアを計算"""
        score = 0.0
        
        # 基本スコア
        score += 10.0
        
        # 後期の場合、ランダム要素を追加して多様性を確保
        if not self.is_first_half:
            score += random.random() * 5.0  # 0-5のランダム値を追加
        
        # 学年バランスを考慮
        grade = member['grade']
        current_day_assignments = []
        for room_id in assignments:
            current_day_assignments.extend(assignments[room_id][weekday])
        
        grade_count_today = sum(1 for m in current_day_assignments if m.get('grade') == grade)
        if grade_count_today == 0:
            score += 5.0  # この学年がまだいない曜日を優先
        
        # 図書室の割り当て人数バランスを考慮（収容人数制約は削除）
        current_assignments_in_room = len(assignments[library_room_id][weekday])
        # 割り当て人数が少ない図書室を優先
        score += 3.0 / (current_assignments_in_room + 1)
        
        # 委員の現在の割り当て数を考慮
        current_assignments = member_assignments[member['id']]
        if current_assignments == 0:
            score += 2.0  # まだ割り当てのない委員を優先
        
        return score
    
    def _fill_incomplete_assignments(self, incomplete_members: list, assignments: Dict,
                                   member_assignments: Dict, member_weekdays: Dict, 
                                   class_weekdays: Dict):
        """不完全な割り当ての委員を追加で処理"""
        logger.debug(f"不完全な割り当ての委員 {len(incomplete_members)} 人を追加処理します")
        
        for member in incomplete_members:
            member_id = member['id']
            needed = 2 - member_assignments[member_id]
            
            # 制約を緩和して割り当て試行
            for weekday in range(1, 6):
                if needed <= 0:
                    break
                    
                # 後期の水曜・金曜制約チェック
                is_wed_or_fri = weekday in [3, 5]
                if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
                    logger.debug(f"制約緩和処理でも制約を維持: 委員ID {member_id} は水曜・金曜に割り当て不可（前期担当者）")
                    continue
                    
                # 既に割り当て済みの曜日はスキップ
                if weekday in member_weekdays[member_id]:
                    continue
                
                for library_room in self.library_rooms:
                    library_room_id = library_room['id']
                    # 収容人数制約を削除 - 無制限に割り当て可能
                    # クラス制約を一時的に緩和してでも2回割り当てを優先
                    assignments[library_room_id][weekday].append(member)
                    member_assignments[member_id] += 1
                    member_weekdays[member_id].add(weekday)
                    needed -= 1
                    logger.debug(f"制約緩和により委員ID {member_id} を追加割り当て")
                    break
    
    def _group_members_by_grade(self) -> Dict:
        """委員を学年別にグループ化"""
        grade_groups = {}
        for member in self.committee_members:
            grade = member['grade']
            if grade not in grade_groups:
                grade_groups[grade] = []
            grade_groups[grade].append(member)
        logger.debug(f"学年別グループ: {[(grade, len(members)) for grade, members in grade_groups.items()]}")
        return grade_groups
    
    def _calculate_member_candidates(self) -> Dict:
        """各委員の割り当て候補(曜日、図書室)を事前計算"""
        candidates = {}
        for member in self.committee_members:
            member_id = member['id']
            candidates[member_id] = []
            
            for weekday in range(1, 6):
                # 後期の水曜・金曜制約チェック
                is_wed_or_fri = weekday in [3, 5]
                if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
                    continue
                
                for library_room in self.library_rooms:
                    candidates[member_id].append((weekday, library_room['id']))
            
            logger.debug(f"委員ID {member_id} の候補数: {len(candidates[member_id])}")
        
        return candidates
    
    def _backtrack_assign(self, assignments: Dict, member_assignments: Dict, 
                         member_weekdays: Dict, class_weekdays: Dict,
                         member_candidates: Dict, member_index: int) -> bool:
        """バックトラッキングによる割り当て（改良版）"""
        
        # すべての委員に2回ずつ割り当てが完了したかチェック
        if all(member_assignments[member['id']] == 2 for member in self.committee_members):
            return True
        
        if member_index >= len(self.committee_members):
            # 全委員を巡回したが、まだ割り当てが完了していない場合は最初から再開
            return self._backtrack_assign(
                assignments, member_assignments, member_weekdays, class_weekdays,
                member_candidates, 0
            )
        
        member = self.committee_members[member_index]
        member_id = member['id']
        class_id = member['class_id']
        
        # この委員に必要な残り割り当て数
        remaining_assignments = 2 - member_assignments[member_id]
        
        if remaining_assignments == 0:
            # この委員は既に2回割り当て済み、次の委員へ
            return self._backtrack_assign(
                assignments, member_assignments, member_weekdays, class_weekdays,
                member_candidates, member_index + 1
            )
        
        # 候補をシャッフルして公平性を確保
        candidates = list(member_candidates[member_id])
        random.shuffle(candidates)
        
        for weekday, library_room_id in candidates:
            # 制約チェック
            if not self._check_assignment_constraints(
                member, weekday, library_room_id, assignments,
                member_weekdays, class_weekdays
            ):
                continue
            
            # 収容人数制約を削除 - 無制限に割り当て可能
            
            # 仮割り当て
            assignments[library_room_id][weekday].append(member)
            member_assignments[member_id] += 1
            member_weekdays[member_id].add(weekday)
            class_weekdays[class_id].add(weekday)
            
            # 再帰的に次の割り当てを試行（この委員にもう1回割り当てる必要があるかチェック）
            next_member_index = member_index if remaining_assignments > 1 else member_index + 1
            
            if self._backtrack_assign(
                assignments, member_assignments, member_weekdays, class_weekdays,
                member_candidates, next_member_index
            ):
                return True
            
            # バックトラック: 割り当てを取り消し
            assignments[library_room_id][weekday].remove(member)
            member_assignments[member_id] -= 1
            member_weekdays[member_id].discard(weekday)
            
            # クラスの曜日制約を正しく更新
            class_has_other_members = any(
                weekday in member_weekdays[other_member['id']] 
                for other_member in self.committee_members 
                if other_member['class_id'] == class_id and other_member['id'] != member_id
            )
            if not class_has_other_members:
                class_weekdays[class_id].discard(weekday)
        
        return False
    
    def _check_assignment_constraints(self, member: Dict, weekday: int, library_room_id: int,
                                    assignments: Dict, member_weekdays: Dict, class_weekdays: Dict) -> bool:
        """割り当て制約をチェック"""
        member_id = member['id']
        class_id = member['class_id']
        
        # 1. 同じ曜日に既に割り当て済みでないか
        if weekday in member_weekdays[member_id]:
            return False
        
        # 2. 同じクラスの他の委員が同じ曜日に割り当て済みでないか
        if weekday in class_weekdays[class_id]:
            return False
        
        # 3. 後期の水曜・金曜制約
        is_wed_or_fri = weekday in [3, 5]
        if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
            return False
        
        return True
    
    def _fallback_assignment(self) -> Dict:
        """フォールバック用の簡単な割り当てアルゴリズム（制約対応版）"""
        logger.debug("フォールバックアルゴリズムを実行します")
        
        assignments = {}
        for library_room in self.library_rooms:
            library_room_id = library_room['id']
            assignments[library_room_id] = {
                1: [], 2: [], 3: [], 4: [], 5: []
            }
        
        member_assignments = {member['id']: 0 for member in self.committee_members}
        member_weekdays = {member['id']: set() for member in self.committee_members}
        
        # 各委員に2回ずつ割り当て（制約チェック付き）
        for member in self.committee_members:
            member_id = member['id']
            assigned_count = 0
            attempts = 0
            max_attempts = 50
            
            while assigned_count < 2 and attempts < max_attempts:
                attempts += 1
                
                # 割り当て可能な曜日を探す
                for weekday in range(1, 6):
                    # 後期の水曜・金曜制約チェック
                    is_wed_or_fri = weekday in [3, 5]
                    if not self.is_first_half and is_wed_or_fri and member_id in self.wed_fri_members:
                        logger.debug(f"フォールバック制約: 委員ID {member_id} は水曜・金曜に割り当て不可（前期担当者）")
                        continue
                    
                    # 既に割り当て済みの曜日はスキップ
                    if weekday in member_weekdays[member_id]:
                        continue
                    
                    # 図書室に割り当て（収容人数制約なし）
                    for library_room in self.library_rooms:
                        library_room_id = library_room['id']
                        # 収容人数制約を削除 - 無制限に割り当て可能
                        assignments[library_room_id][weekday].append(member)
                        assigned_count += 1
                        member_assignments[member_id] += 1
                        member_weekdays[member_id].add(weekday)
                        logger.debug(f"フォールバック: 委員ID {member_id} を曜日 {weekday} の図書室 {library_room_id} に割り当て")
                        break
                    
                    if assigned_count >= 2:
                        break
                
                if assigned_count >= 2:
                    break
            
            if assigned_count < 2:
                logger.warning(f"フォールバック: 委員ID {member_id} は {assigned_count} 回のみ割り当て（目標2回）")
        
        return assignments
    
    def _log_assignment_statistics(self, assignments: Dict):
        """割り当て統計をログ出力"""
        logger.debug("=== 割り当て統計 ===")
        
        # 曜日別統計
        for weekday in range(1, 6):
            weekday_names = ['', '月曜', '火曜', '水曜', '木曜', '金曜']
            total_assigned = sum(len(assignments[room_id][weekday]) for room_id in assignments)
            logger.debug(f"{weekday_names[weekday]}: {total_assigned}人")
            
            for library_room in self.library_rooms:
                room_id = library_room['id']
                room_assigned = len(assignments[room_id][weekday])
                logger.debug(f"  {library_room['room_name']}: {room_assigned}人")
        
        # 委員別統計
        member_stats = {}
        for library_room_id in assignments:
            for weekday in assignments[library_room_id]:
                for member in assignments[library_room_id][weekday]:
                    member_id = member['id']
                    if member_id not in member_stats:
                        member_stats[member_id] = {'name': member['name'], 'count': 0, 'days': []}
                    member_stats[member_id]['count'] += 1
                    member_stats[member_id]['days'].append(weekday)
        
        logger.debug("委員別割り当て:")
        for member_id, stats in member_stats.items():
            logger.debug(f"  {stats['name']}: {stats['count']}回 (曜日: {stats['days']})")
        
        return assignments
    
    def save_assignments(self, assignments: Dict, schedule_id: int) -> None:
        """割り当てをデータベースに保存（新スキーマ対応）"""
        logger.debug(f"割り当てをデータベースに保存します。スケジュールID: {schedule_id}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # 各図書室と曜日の組み合わせに対して割り当てを保存
        for library_room_id, weekday_assignments in assignments.items():
            logger.debug(f"図書室ID {library_room_id} の割り当てを保存します")
            
            # 各曜日の割り当てを保存
            for weekday, members in weekday_assignments.items():
                if not members:
                    continue
                    
                # 各メンバーに対してスケジュール割り当てを作成（新スキーマ：曜日ベース）
                for member in members:
                    cursor.execute("""
                        INSERT INTO schedule_assignments 
                        (schedule_id, day_of_week, library_room_id, committee_member_id) 
                        VALUES (?, ?, ?, ?)
                    """, (schedule_id, weekday, library_room_id, member['id']))
                    logger.debug(f"委員ID {member['id']} の割り当てを作成しました: 図書室ID {library_room_id}, 曜日 {weekday}")
        
        conn.commit()
        logger.debug("割り当ての保存が完了しました")
    
    def generate(self, name: str, description: str = "") -> Dict:
        """スケジュール生成のメインメソッド（新スキーマ対応）"""
        logger.debug(f"スケジュール生成を開始します: {name}")
        try:
            # 必要なデータを読み込み
            self.load_committee_members()
            self.load_library_rooms()
            
            # データの検証
            if not self.committee_members:
                raise ValueError("図書委員が見つかりません")
            if not self.library_rooms:
                raise ValueError("図書室が見つかりません")
            
            # データベース接続を取得
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            try:
                # スケジュールの基本情報を作成
                schedule_id = self.create_schedule(name, description)
                
                # 図書委員を曜日に割り当て
                assignments = self.assign_members_to_weekdays()
                
                # 割り当てをデータベースに保存
                self.save_assignments(assignments, schedule_id)
                
                # 既存のアクティブなスケジュールを非アクティブに変更
                cursor.execute("""
                    UPDATE schedules 
                    SET status = 'inactive' 
                    WHERE school_id = ? AND academic_year = ? AND is_first_half = ? AND status = 'active' AND id != ?
                """, (self.school_id, self.academic_year, self.is_first_half, schedule_id))
                
                # 新しいスケジュールをアクティブに更新
                cursor.execute("UPDATE schedules SET status = 'active' WHERE id = ?", (schedule_id,))
                conn.commit()
                
                # 統計情報を計算
                total_assignments = sum(len(members) for weekday_assignments in assignments.values() 
                                      for members in weekday_assignments.values())
                
                result = {
                    "success": True,
                    "schedule_id": schedule_id,
                    "message": "スケジュールが正常に生成されました",
                    "statistics": {
                        "total_assignments": total_assignments,
                        "total_members": len(self.committee_members),
                        "total_library_rooms": len(self.library_rooms),
                        "assignments_per_member": total_assignments / len(self.committee_members) if self.committee_members else 0
                    },
                    "warnings": [],
                    "errors": []
                }
                
                logger.debug(f"スケジュール生成が完了しました。ID: {schedule_id}")
                return result
                
            except Exception as e:
                logger.error(f"スケジュール生成中にエラーが発生しました: {e}")
                conn.rollback()
                return {
                    "success": False,
                    "schedule_id": None,
                    "message": f"スケジュール生成に失敗しました: {str(e)}",
                    "statistics": {},
                    "warnings": [],
                    "errors": [str(e)]
                }
            finally:
                # 処理完了後にデータベース接続を閉じる
                if conn:
                    conn.close()
        finally:
            # 処理完了後にデータベース接続を閉じる
            self.close_db_connection()
    
    def get_schedule_assignments(self, schedule_id: int) -> List[Dict]:
        """スケジュール割り当ての取得（新スキーマ対応）"""
        logger.debug(f"スケジュール割り当てを取得します。スケジュールID: {schedule_id}")
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                sa.id,
                sa.schedule_id,
                sa.day_of_week,
                sa.library_room_id,
                lr.room_name as library_room_name,
                sa.committee_member_id,
                cm.name as member_name,
                c.class_name,
                c.grade
            FROM schedule_assignments sa
            LEFT JOIN library_rooms lr ON sa.library_room_id = lr.id
            LEFT JOIN committee_members cm ON sa.committee_member_id = cm.id
            LEFT JOIN classes c ON cm.class_id = c.id
            WHERE sa.schedule_id = ?
            ORDER BY sa.day_of_week, sa.library_room_id, cm.name
        ''', (schedule_id,))
        
        assignments = []
        for row in cursor.fetchall():
            assignment = {
                'id': row[0],
                'schedule_id': row[1],
                'day_of_week': row[2],
                'library_room_id': row[3],
                'library_room_name': row[4],
                'committee_member_id': row[5],
                'member_name': row[6],
                'class_name': row[7],
                'grade': row[8]
            }
            assignments.append(assignment)
        
        logger.debug(f"取得した割り当て数: {len(assignments)}")
        return assignments

    def generate_schedule_logic(self, name: str, description: str = "") -> dict:
        """スケジュール生成のロジック（フロントエンド連携用、新スキーマ対応）"""
        logger.info(f"スケジュール生成ロジック開始: {name}")
        
        try:
            # スケジュールを生成（内部でデータ読み込みも実行）
            result = self.generate(name, description)
            
            if result["success"]:
                # 生成されたスケジュールの詳細を取得
                assignments = self.get_schedule_assignments(result["schedule_id"])
                
                result.update({
                    "name": name,
                    "description": description,
                    "academic_year": self.academic_year,
                    "is_first_half": self.is_first_half,
                    "assignmentCount": len(assignments),
                    "assignments": assignments
                })
            
            logger.info(f"スケジュール生成完了: ID={result.get('schedule_id')}, 成功={result['success']}")
            return result
            
        except Exception as e:
            logger.error(f"スケジュール生成エラー: {str(e)}")
            return {
                "success": False,
                "message": f"スケジュール生成に失敗しました: {str(e)}",
                "schedule_id": None,
                "statistics": {},
                "warnings": [],
                "errors": [str(e)]
            }

# Helper functions for testing
def get_db_connection():
    """データベース接続を取得するヘルパー関数"""
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_committee_members(school_id=1, academic_year=2025, grade_filter=None, class_ids=None):
    """図書委員のリストを取得（新スキーマ対応）
    
    Args:
        school_id (int): 学校ID
        academic_year (int): 学年度
        grade_filter (list, optional): 対象の学年リスト。Noneの場合は全学年
        class_ids (list, optional): 対象のクラスIDリスト。Noneの場合は全クラス
    
    Returns:
        list: 図書委員リスト
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 新スキーマに対応したクエリ
    base_query = """
        SELECT cm.*, c.class_name, c.grade, p.position_name, s.school_name
        FROM committee_members cm
        JOIN classes c ON cm.class_id = c.id
        JOIN schools s ON cm.school_id = s.id
        LEFT JOIN positions p ON cm.position_id = p.id
        WHERE cm.school_id = ? AND cm.academic_year = ? AND cm.active = 1
    """
    
    params = [school_id, academic_year]
    
    if grade_filter:
        placeholders = ','.join(['?' for _ in grade_filter])
        base_query += f" AND c.grade IN ({placeholders})"
        params.extend(grade_filter)
    
    if class_ids:
        placeholders = ','.join(['?' for _ in class_ids])
        base_query += f" AND cm.class_id IN ({placeholders})"
        params.extend(class_ids)
    
    base_query += " ORDER BY c.grade, c.class_name, cm.name"
    
    cursor.execute(base_query, params)
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return members

def get_library_rooms(school_id=1):
    """図書室のリストを取得（新スキーマ対応）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM library_rooms 
        WHERE school_id = ? AND active = 1 
        ORDER BY room_id
    """, (school_id,))
    library_rooms = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return library_rooms

def get_schedule_stats(schedule_id: int):
    """スケジュールの統計情報を取得（新スキーマ対応）"""
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
        SELECT lr.room_name, COUNT(*) as assignment_count
        FROM schedule_assignments sa
        JOIN library_rooms lr ON sa.library_room_id = lr.id
        WHERE sa.schedule_id = ?
        GROUP BY lr.id, lr.room_name
        ORDER BY assignment_count DESC
    """, (schedule_id,))
    library_stats = [{"name": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_assignments": total_assignments,
        "member_stats": member_stats,
        "library_stats": library_stats
    }

def generate_schedule_with_class(school_id: int, academic_year: int, is_first_half: bool, 
                                name: str = None, description: str = None):
    """スケジュールジェネレータークラスを使用してスケジュールを生成（新スキーマ対応）"""
    try:
        # デフォルト値の設定
        if name is None:
            semester = "前期" if is_first_half else "後期"
            name = f"{academic_year}年度{semester}スケジュール"
        
        if description is None:
            semester = "前期" if is_first_half else "後期"
            description = f"{academic_year}年度{semester}の図書当番スケジュール"
        
        logger.info(f"スケジュール生成開始: {name}")
        
        # テスト用に既存のスケジュールを削除
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # スケジュールに関連する割り当てを削除
        cursor.execute("""
            DELETE FROM schedule_assignments 
            WHERE schedule_id IN (SELECT id FROM schedules WHERE school_id = ? AND academic_year = ? AND is_first_half = ?)
        """, (school_id, academic_year, is_first_half))
        
        # スケジュールを削除
        cursor.execute("""
            DELETE FROM schedules 
            WHERE school_id = ? AND academic_year = ? AND is_first_half = ?
        """, (school_id, academic_year, is_first_half))
        
        conn.commit()
        conn.close()
        
        # ScheduleGeneratorのインスタンスを作成
        generator = ScheduleGenerator(school_id, academic_year, is_first_half)
        
        # スケジュールを生成
        result = generator.generate(name, description)
        
        # データベース接続を閉じる
        generator.close_db_connection()
        
        # スケジュールIDが正しく返されていない場合は、最新のスケジュールIDを取得
        if not result.get('schedule_id'):
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM schedules ORDER BY id DESC LIMIT 1")
            latest_schedule = cursor.fetchone()
            conn.close()
            
            if latest_schedule:
                result['schedule_id'] = latest_schedule[0]
                result['success'] = True
                result['message'] = "スケジュールが正常に生成されました"
        
        # スケジュールが正しく作成されたか確認
        schedule_id = result.get('schedule_id')
        if schedule_id:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
            schedule = cursor.fetchone()
            
            if not schedule:
                # スケジュールが見つからない場合は、再度作成
                logger.warning(f"スケジュールID {schedule_id} が見つかりません。再度作成します。")
                cursor.execute(
                    """INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status) 
                    VALUES (?, ?, ?, ?, ?, 'draft')""",
                    (school_id, name, description, academic_year, is_first_half)
                )
                conn.commit()
                cursor.execute("SELECT last_insert_rowid()")
                new_id = cursor.fetchone()[0]
                
                # 古いスケジュールIDから割り当てを新しいスケジュールIDにコピー
                logger.info(f"割り当てをスケジュールID {schedule_id} から {new_id} にコピーします")
                cursor.execute(
                    """INSERT INTO schedule_assignments (schedule_id, committee_member_id, library_room_id, day_of_week)
                    SELECT ?, committee_member_id, library_room_id, day_of_week
                    FROM schedule_assignments
                    WHERE schedule_id = ?""",
                    (new_id, schedule_id)
                )
                conn.commit()
                
                # 古いスケジュールIDの割り当てを削除
                cursor.execute("DELETE FROM schedule_assignments WHERE schedule_id = ?", (schedule_id,))
                conn.commit()
                
                result['schedule_id'] = new_id
                logger.info(f"新しいスケジュールを作成しました。ID: {new_id}")
            
            conn.close()
        
        return result
        
    except Exception as e:
        logger.error(f"スケジュール生成エラー: {str(e)}")
        return {
            "success": False,
            "schedule_id": None,
            "message": f"スケジュール生成に失敗しました: {str(e)}",
            "statistics": {},
            "warnings": [],
            "errors": [str(e)]
        }

def get_library_availability(school_id=1):
    """図書室の利用可能性を取得（新スキーマ対応）
    
    Args:
        school_id (int): 学校ID
    
    Returns:
        dict: 図書室IDをキーとし、各曜日の利用可能性を含む辞書
        例: {1: {1: ['09:00-10:00'], 2: ['09:00-10:00'], ...}, 2: {...}}
    """
    try:
        conn = get_db_connection()
        cursor = conn.execute("""
            SELECT id, room_name FROM library_rooms 
            WHERE school_id = ? AND active = 1
        """, (school_id,))
        library_rooms = cursor.fetchall()
        
        # 各図書室について曜日別の利用可能時間を設定
        availability = {}
        for library_room in library_rooms:
            library_room_id = library_room['id']
            availability[library_room_id] = {}
            # 月曜日から金曜日まで
            for day in range(1, 6):
                availability[library_room_id][day] = ['09:00-10:00', '10:00-11:00']
            
        logger.debug(f"図書室利用可能性: {availability}")
        return availability
        
    except Exception as e:
        logger.error(f"図書室利用可能性の取得でエラー: {e}")
        return {}

def create_schedule(name, description, start_date=None, end_date=None, academic_year=2025, is_first_half=True, school_id=1):
    """新しいスケジュールを作成
    
    Args:
        name (str): スケジュール名
        description (str): 説明
        start_date (str, optional): 開始日
        end_date (str, optional): 終了日
        academic_year (int): 年度（デフォルト: 2025）
        is_first_half (bool): 前期かどうか（デフォルト: True）
        school_id (int): 学校ID（デフォルト: 1）
    
    Returns:
        int: 作成されたスケジュールのID
    """
    try:
        conn = get_db_connection()
        # 既存の同じ条件のスケジュールを削除（テスト用）
        conn.execute(
            """DELETE FROM schedules WHERE school_id = ? AND academic_year = ? AND is_first_half = ?""",
            (school_id, academic_year, is_first_half)
        )
        conn.commit()
        
        # 新しいスケジュールを作成
        cursor = conn.execute(
            """INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status) 
               VALUES (?, ?, ?, ?, ?, 'draft')""",
            (school_id, name, description, academic_year, is_first_half)
        )
        
        conn.commit()
        schedule_id = cursor.lastrowid
        logger.info(f"新しいスケジュールを作成: ID={schedule_id}, 名前={name}")
        return schedule_id
        
    except Exception as e:
        logger.error(f"スケジュール作成でエラー: {e}")
        raise

def create_schedule_assignment(schedule_id, committee_member_id, library_room_id, day_of_week):
    """スケジュール割り当てを作成
    
    Args:
        schedule_id (int): スケジュールID
        committee_member_id (int): 図書委員ID
        library_room_id (int): 図書室ID
        day_of_week (int): 曜日 (1=月曜日, 2=火曜日, ..., 5=金曜日)
    
    Returns:
        int: 割り当てID
    """
    try:
        conn = get_db_connection()
        cursor = conn.execute(
            """INSERT INTO schedule_assignments (schedule_id, committee_member_id, library_room_id, day_of_week)
               VALUES (?, ?, ?, ?)""",
            (schedule_id, committee_member_id, library_room_id, day_of_week)
        )
        assignment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return assignment_id
    except Exception as e:
        logger.error(f"スケジュール割り当て作成でエラー: {e}")
        return None

def generate_date_range(start_date, end_date):
    """日付範囲を生成
    
    Args:
        start_date (str): 開始日 (YYYY-MM-DD)
        end_date (str): 終了日 (YYYY-MM-DD)
    
    Returns:
        list: (日付文字列, 曜日番号) のタプルのリスト
              曜日番号は 0=月曜日, 1=火曜日, ..., 6=日曜日
    """
    try:
        from datetime import datetime, timedelta
        
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        dates = []
        current = start
        while current <= end:
            # 日付と曜日のタプルを返す
            # weekday() は 0=月曜日, 1=火曜日, ..., 6=日曜日 を返す
            date_str = current.strftime('%Y-%m-%d')
            weekday = current.weekday()
            # 平日のみを返す場合は、月曜日～金曜日のみをフィルタリング
            if 0 <= weekday <= 4:  # 0=月曜日, 4=金曜日
                dates.append((date_str, weekday + 1))  # 1=月曜日, 5=金曜日 に変換
            current += timedelta(days=1)
            
        logger.debug(f"日付範囲を生成: {start_date} から {end_date} まで {len(dates)} 日")
        return dates
        
    except Exception as e:
        logger.error(f"日付範囲生成でエラー: {e}")
        return []
