"""
pytest設定ファイル
"""
import pytest
import os
import sys
import logging

# テスト対象のパスを追加
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@pytest.fixture(scope="session")
def test_database():
    """テスト用データベースの設定"""
    # テスト用データベースのセットアップ
    from init_database import init_database
    
    # データベースの初期化
    result = init_database()
    assert result, "データベースの初期化に失敗しました"
    
    yield
    
    # クリーンアップ（必要に応じて）
    pass

@pytest.fixture(scope="function")
def client():
    """Flaskテストクライアントの提供"""
    from app import app
    
    app.config['TESTING'] = True
    app.config['DATABASE'] = 'tosho_in_wariate.db'
    
    with app.test_client() as client:
        with app.app_context():
            yield client

# テスト前の共通設定
def pytest_configure(config):
    """pytest設定"""
    # カスタムマーカーの登録
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "api: mark test as API test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
