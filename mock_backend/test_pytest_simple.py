import pytest
import sys
import os

# パスを設定
sys.path.insert(0, os.path.abspath('.'))

def test_simple():
    """シンプルなテスト"""
    assert True

def test_import():
    """インポートテスト"""
    from app import app
    assert app is not None

def test_schedule_generator_import():
    """schedule_generatorのインポートテスト"""
    from schedule_generator import generate_schedule_with_class
    assert generate_schedule_with_class is not None
