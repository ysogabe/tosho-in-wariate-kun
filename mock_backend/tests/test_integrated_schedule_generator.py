"""
統合テスト: スケジュール生成機能の包括的テスト
"""
import pytest
import sys
import os
import logging
from datetime import datetime, date

# テスト対象のモジュールへのパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schedule_generator import ScheduleGenerator, generate_schedule_with_class
from init_database import init_database

logger = logging.getLogger(__name__)

class TestIntegratedScheduleGenerator:
    """統合スケジュール生成テスト"""
    
    @classmethod
    def setup_class(cls):
        """テストクラス実行前の準備"""
        logger.info("統合テストクラスのセットアップを開始します")
        # データベースを初期化
        cls.db_initialized = init_database()
        assert cls.db_initialized, "データベースの初期化に失敗しました"
        logger.info(f"データベースの初期化結果: {cls.db_initialized}")
    
    def setup_method(self):
        """各テスト実行前の準備"""
        logger.info("テストメソッドのセットアップを開始します")
        if not self.db_initialized:
            pytest.skip("データベースの初期化に失敗したためスキップします")
    
    @pytest.mark.unit
    def test_schedule_generator_initialization(self):
        """スケジュールジェネレーターの初期化テスト"""
        logger.info("test_schedule_generator_initialization テストを開始します")
        
        # 正常なパラメータでの初期化
        generator = ScheduleGenerator("2025", True)
        assert generator.academic_year == "2025"
        assert generator.is_first_half == True
        assert generator.committee_members == []
        assert generator.libraries == []
        assert generator.schedule_id is None
        
        generator.close_db_connection()
        logger.info("test_schedule_generator_initialization テストが成功しました")
    
    @pytest.mark.unit
    def test_committee_members_loading(self):
        """図書委員データ読み込みテスト"""
        logger.info("test_committee_members_loading テストを開始します")
        generator = ScheduleGenerator("2025", True)
        
        try:
            members = generator.load_committee_members()
            logger.info(f"読み込まれた図書委員の数: {len(members)}")
            
            # データベースのシードデータに基づく検証
            assert len(members) == 12, f"期待される図書委員数は12名ですが、{len(members)}名でした"
            
            # 各図書委員のデータ構造を確認
            for member in members:
                assert 'id' in member, "図書委員データにidが含まれていません"
                assert 'name' in member, "図書委員データにnameが含まれていません"
                assert 'class_id' in member, "図書委員データにclass_idが含まれていません"
                assert 'class_name' in member, "図書委員データにclass_nameが含まれていません"
                assert 'grade_id' in member, "図書委員データにgrade_idが含まれていません"
                assert 'grade_name' in member, "図書委員データにgrade_nameが含まれていません"
                
                # データ型の確認
                assert isinstance(member['id'], int), "図書委員のidは整数である必要があります"
                assert isinstance(member['name'], str), "図書委員のnameは文字列である必要があります"
            
            logger.info("test_committee_members_loading テストが成功しました")
        finally:
            generator.close_db_connection()
    
    @pytest.mark.unit
    def test_libraries_loading(self):
        """図書室データ読み込みテスト"""
        logger.info("test_libraries_loading テストを開始します")
        generator = ScheduleGenerator("2025", True)
        
        try:
            libraries = generator.load_libraries()
            logger.info(f"読み込まれた図書室の数: {len(libraries)}")
            
            # データベースのシードデータに基づく検証
            assert len(libraries) == 2, f"期待される図書室数は2室ですが、{len(libraries)}室でした"
            
            # 各図書室のデータ構造を確認
            for library in libraries:
                assert 'id' in library, "図書室データにidが含まれていません"
                assert 'name' in library, "図書室データにnameが含まれていません"
                assert 'is_active' in library, "図書室データにis_activeが含まれていません"
                
                # データ型の確認
                assert isinstance(library['id'], int), "図書室のidは整数である必要があります"
                assert isinstance(library['name'], str), "図書室のnameは文字列である必要があります"
                assert isinstance(library['is_active'], (bool, int)), "図書室のis_activeはブール値または整数である必要があります"
            
            logger.info("test_libraries_loading テストが成功しました")
        finally:
            generator.close_db_connection()
    
    @pytest.mark.integration
    def test_schedule_generation_first_half(self):
        """前期スケジュール生成の統合テスト"""
        logger.info("test_schedule_generation_first_half テストを開始します")
        
        try:
            # スケジュール生成の実行
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=True,
                name="前期統合テストスケジュール",
                description="統合テスト用の前期スケジュール",
                start_date="2025-04-01",
                end_date="2025-09-30"
            )
            
            logger.info(f"生成されたスケジュールID: {schedule_id}")
            assert schedule_id is not None, "スケジュールIDが返されませんでした"
            assert isinstance(schedule_id, int), "スケジュールIDは整数である必要があります"
            
            # 生成されたスケジュールの検証
            generator = ScheduleGenerator("2025", True)
            try:
                assignments = generator.get_schedule_assignments(schedule_id)
                logger.info(f"生成された割り当て数: {len(assignments)}")
                
                # 基本的な制約の確認
                assert len(assignments) > 0, "スケジュール割り当てが生成されていません"
                
                # 各割り当ての構造確認
                for assignment in assignments:
                    assert 'date' in assignment, "割り当てデータにdateが含まれていません"
                    assert 'library_id' in assignment, "割り当てデータにlibrary_idが含まれていません"
                    assert 'committee_member_id' in assignment, "割り当てデータにcommittee_member_idが含まれていません"
                
                logger.info("test_schedule_generation_first_half テストが成功しました")
            finally:
                generator.close_db_connection()
                
        except Exception as e:
            logger.error(f"前期スケジュール生成でエラーが発生しました: {e}")
            raise
    
    @pytest.mark.integration
    def test_schedule_generation_second_half(self):
        """後期スケジュール生成の統合テスト"""
        logger.info("test_schedule_generation_second_half テストを開始します")
        
        try:
            # スケジュール生成の実行
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=False,
                name="後期統合テストスケジュール",
                description="統合テスト用の後期スケジュール",
                start_date="2025-10-01",
                end_date="2026-03-31"
            )
            
            logger.info(f"生成されたスケジュールID: {schedule_id}")
            assert schedule_id is not None, "スケジュールIDが返されませんでした"
            assert isinstance(schedule_id, int), "スケジュールIDは整数である必要があります"
            
            logger.info("test_schedule_generation_second_half テストが成功しました")
                
        except Exception as e:
            logger.error(f"後期スケジュール生成でエラーが発生しました: {e}")
            raise
    
    @pytest.mark.integration
    def test_schedule_fairness_validation(self):
        """スケジュール公平性検証テスト"""
        logger.info("test_schedule_fairness_validation テストを開始します")
        
        try:
            # スケジュール生成
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=True,
                name="公平性検証テストスケジュール",
                description="公平性検証用のテストスケジュール",
                start_date="2025-04-01",
                end_date="2025-06-30"  # 短期間でテスト
            )
            
            generator = ScheduleGenerator("2025", True)
            try:
                assignments = generator.get_schedule_assignments(schedule_id)
                
                # 各委員の当番回数を集計
                member_counts = {}
                for assignment in assignments:
                    member_id = assignment['committee_member_id']
                    member_counts[member_id] = member_counts.get(member_id, 0) + 1
                
                logger.info(f"委員別当番回数: {member_counts}")
                
                # 公平性の確認（最大と最小の差が大きすぎないこと）
                if member_counts:
                    max_count = max(member_counts.values())
                    min_count = min(member_counts.values())
                    difference = max_count - min_count
                    
                    logger.info(f"最大当番回数: {max_count}, 最小当番回数: {min_count}, 差: {difference}")
                    
                    # 差が3回以下であることを確認（許容範囲）
                    assert difference <= 3, f"当番回数の差が大きすぎます（差: {difference}回）"
                
                logger.info("test_schedule_fairness_validation テストが成功しました")
            finally:
                generator.close_db_connection()
                
        except Exception as e:
            logger.error(f"公平性検証でエラーが発生しました: {e}")
            raise
    
    @pytest.mark.integration
    def test_schedule_constraint_validation(self):
        """スケジュール制約検証テスト"""
        logger.info("test_schedule_constraint_validation テストを開始します")
        
        try:
            # スケジュール生成
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=True,
                name="制約検証テストスケジュール",
                description="制約検証用のテストスケジュール",
                start_date="2025-04-01",
                end_date="2025-04-30"  # 1ヶ月でテスト
            )
            
            generator = ScheduleGenerator("2025", True)
            try:
                assignments = generator.get_schedule_assignments(schedule_id)
                
                # 同一日の重複チェック
                date_member_pairs = set()
                for assignment in assignments:
                    pair = (assignment['date'], assignment['committee_member_id'])
                    assert pair not in date_member_pairs, f"同一日に同じ委員が複数回割り当てられています: {pair}"
                    date_member_pairs.add(pair)
                
                # 水曜・金曜日の2名体制チェック（もし実装されている場合）
                wednesday_friday_dates = {}
                for assignment in assignments:
                    assignment_date = datetime.strptime(assignment['date'], '%Y-%m-%d').date()
                    weekday = assignment_date.weekday()
                    
                    # 水曜日(2)または金曜日(4)の場合
                    if weekday in [2, 4]:
                        date_str = assignment['date']
                        if date_str not in wednesday_friday_dates:
                            wednesday_friday_dates[date_str] = []
                        wednesday_friday_dates[date_str].append(assignment['committee_member_id'])
                
                # 水曜・金曜日に2名割り当てられているかチェック
                for date_str, members in wednesday_friday_dates.items():
                    if len(members) == 2:
                        logger.info(f"{date_str}（水曜または金曜）に2名が割り当てられています: {members}")
                
                logger.info("test_schedule_constraint_validation テストが成功しました")
            finally:
                generator.close_db_connection()
                
        except Exception as e:
            logger.error(f"制約検証でエラーが発生しました: {e}")
            raise
    
    @pytest.mark.slow
    def test_performance_large_schedule(self):
        """大規模スケジュール生成のパフォーマンステスト"""
        logger.info("test_performance_large_schedule テストを開始します")
        
        start_time = datetime.now()
        
        try:
            # 1年間のスケジュール生成
            schedule_id = generate_schedule_with_class(
                academic_year="2025",
                is_first_half=True,
                name="パフォーマンステストスケジュール",
                description="パフォーマンステスト用の大規模スケジュール",
                start_date="2025-04-01",
                end_date="2025-09-30"
            )
            
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            logger.info(f"スケジュール生成時間: {execution_time:.2f}秒")
            
            # パフォーマンス基準（30秒以内）
            assert execution_time < 30, f"スケジュール生成が遅すぎます（{execution_time:.2f}秒）"
            
            assert schedule_id is not None, "スケジュールIDが返されませんでした"
            
            logger.info("test_performance_large_schedule テストが成功しました")
                
        except Exception as e:
            logger.error(f"パフォーマンステストでエラーが発生しました: {e}")
            raise
