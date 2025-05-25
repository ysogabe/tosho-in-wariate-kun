import unittest
import os
import sys
import logging

# ロギングの設定
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# テスト対象のモジュールへのパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schedule_generator import ScheduleGenerator, generate_schedule_with_class
from init_database import init_database

class TestScheduleGeneratorFixed(unittest.TestCase):
    """修正版スケジュールジェネレータークラスのテスト"""
    
    @classmethod
    def setUpClass(cls):
        """テストクラス実行前の準備"""
        logger.debug("テストクラスのセットアップを開始します")
        # データベースを初期化
        cls.db_initialized = init_database()
        logger.debug(f"データベースの初期化結果: {cls.db_initialized}")
    
    def setUp(self):
        """各テスト実行前の準備"""
        logger.debug("テストのセットアップを開始します")
        if not self.db_initialized:
            self.skipTest("データベースの初期化に失敗したためスキップします")
    
    def test_load_committee_members(self):
        """図書委員データ読み込みテスト"""
        logger.debug("test_load_committee_members テストを開始します")
        generator = ScheduleGenerator("2025", True)
        
        try:
            members = generator.load_committee_members()
            logger.debug(f"読み込まれた図書委員の数: {len(members)}")
            
            # 図書委員が12人読み込まれていることを確認
            self.assertEqual(len(members), 12)
            
            # 各図書委員のデータ構造を確認
            for member in members:
                self.assertIn('id', member)
                self.assertIn('name', member)
                self.assertIn('class_id', member)
                self.assertIn('class_name', member)
                self.assertIn('grade_id', member)
                self.assertIn('grade_name', member)
            
            logger.debug("test_load_committee_members テストが成功しました")
        finally:
            generator.close_db_connection()
    
    def test_load_libraries(self):
        """図書室データ読み込みテスト"""
        logger.debug("test_load_libraries テストを開始します")
        generator = ScheduleGenerator("2025", True)
        
        try:
            libraries = generator.load_libraries()
            logger.debug(f"読み込まれた図書室の数: {len(libraries)}")
            
            # 図書室が2つ読み込まれていることを確認
            self.assertEqual(len(libraries), 2)
            
            # 各図書室のデータ構造を確認
            for library in libraries:
                self.assertIn('id', library)
                self.assertIn('name', library)
                self.assertIn('is_active', library)
            
            logger.debug("test_load_libraries テストが成功しました")
        finally:
            generator.close_db_connection()
    
    def test_generate_schedule(self):
        """スケジュール生成テスト"""
        logger.debug("test_generate_schedule テストを開始します")
        
        try:
            # スケジュール生成
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=True,
                name="テストスケジュール",
                description="テスト用",
                start_date="2025-04-01",
                end_date="2025-09-30"
            )
            
            logger.debug(f"生成されたスケジュールID: {schedule_id}")
            
            # スケジュールIDが返されることを確認
            self.assertIsNotNone(schedule_id)
            
            # 生成されたスケジュールの検証
            generator = ScheduleGenerator("2025", True)
            conn = generator.get_db_connection()
            
            try:
                # スケジュールが作成されていることを確認
                cursor = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,))
                schedule = cursor.fetchone()
                self.assertIsNotNone(schedule)
                logger.debug(f"スケジュール情報: {dict(schedule)}")
                
                # 割り当てが作成されていることを確認
                cursor = conn.execute("""
                    SELECT COUNT(*) as count FROM schedule_assignments WHERE schedule_id = ?
                """, (schedule_id,))
                assignment_count = cursor.fetchone()['count']
                logger.debug(f"割り当て数: {assignment_count}")
                self.assertGreater(assignment_count, 0)
                
                # 割り当てメンバーが追加されていることを確認
                cursor = conn.execute("""
                    SELECT COUNT(*) as count 
                    FROM schedule_assignments 
                    WHERE schedule_id = ? AND committee_member_id IS NOT NULL
                """, (schedule_id,))
                member_count = cursor.fetchone()['count']
                logger.debug(f"割り当てメンバー数: {member_count}")
                self.assertGreater(member_count, 0)
                
                logger.debug("test_generate_schedule テストが成功しました")
            finally:
                generator.close_db_connection()
        except Exception as e:
            logger.error(f"テスト中にエラーが発生しました: {e}", exc_info=True)
            raise
    
    def test_first_half_second_half_rule(self):
        """前期・後期ルールのテスト"""
        logger.debug("test_first_half_second_half_rule テストを開始します")
        
        try:
            # 後期のスケジュール生成
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=False,
                name="2025年度後期図書委員スケジュール",
                description="後期スケジュール",
                start_date="2025-10-01",
                end_date="2026-03-31"
            )
            
            logger.debug(f"生成された後期スケジュールID: {schedule_id}")
            
            # 前期に水曜・金曜担当だった委員が後期に水曜・金曜に割り当てられていないことを確認
            generator = ScheduleGenerator("2025", True)
            conn = generator.get_db_connection()
            
            try:
                cursor = conn.execute("""
                    SELECT sa.date, sa.committee_member_id,
                           CASE CAST(strftime('%w', sa.date) AS INTEGER)
                               WHEN 0 THEN 7  -- Sunday = 7
                               ELSE CAST(strftime('%w', sa.date) AS INTEGER)
                           END as day_of_week
                    FROM schedule_assignments sa
                    WHERE sa.schedule_id = ? AND 
                          CASE CAST(strftime('%w', sa.date) AS INTEGER)
                              WHEN 0 THEN 7
                              ELSE CAST(strftime('%w', sa.date) AS INTEGER)
                          END IN (3, 5)
                """, (schedule_id,))
                
                wed_fri_members = [row['committee_member_id'] for row in cursor.fetchall()]
                logger.debug(f"後期の水曜・金曜担当者: {wed_fri_members}")
                
                # 前期の水曜・金曜担当者を取得
                cursor = conn.execute("""
                    SELECT DISTINCT sa.committee_member_id
                    FROM schedule_assignments sa
                    JOIN schedules s ON sa.schedule_id = s.id
                    WHERE s.name LIKE '%前期%' AND 
                          CASE CAST(strftime('%w', sa.date) AS INTEGER)
                              WHEN 0 THEN 7
                              ELSE CAST(strftime('%w', sa.date) AS INTEGER)
                          END IN (3, 5)
                """)
                
                first_half_wed_fri_members = [row['committee_member_id'] for row in cursor.fetchall()]
                logger.debug(f"前期の水曜・金曜担当者: {first_half_wed_fri_members}")
                
                # 前期の担当者が後期の水曜・金曜に含まれていないことを確認
                for member_id in first_half_wed_fri_members:
                    self.assertNotIn(member_id, wed_fri_members, 
                                   f"前期に水曜・金曜担当だった図書委員ID {member_id} が後期にも水曜・金曜に割り当てられています")
                
                logger.debug("test_first_half_second_half_rule テストが成功しました")
            finally:
                generator.close_db_connection()
        except Exception as e:
            logger.error(f"テスト中にエラーが発生しました: {e}", exc_info=True)
            raise


if __name__ == '__main__':
    unittest.main()
