#!/usr/bin/env python3
"""
手動テスト実行スクリプト
CI/CD形式でテスト結果を出力する
"""
import sys
import os
import unittest
import json
import time
from datetime import datetime
import traceback

# テスト対象のモジュールへのパスを追加
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    """テストを実行してCI/CD形式で結果を出力"""
    print("=" * 80)
    print("Mock Backend Test Suite - CI/CD Report")
    print("=" * 80)
    print(f"Test run started at: {datetime.now().isoformat()}")
    print(f"Platform: {sys.platform}")
    print(f"Python version: {sys.version}")
    print()
    
    # テスト結果格納用
    test_results = {
        "timestamp": datetime.now().isoformat(),
        "platform": sys.platform,
        "python_version": sys.version,
        "tests": [],
        "summary": {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "errors": 0
        }
    }
    
    # 個別テストの実行
    test_cases = [
        ("schedule_generator", "test_basic_functionality"),
        ("database", "test_connection"),
        ("api", "test_endpoints")
    ]
    
    print("🔄 Running individual tests...")
    print()
    
    # 基本的なimportテスト
    print("🧪 Testing imports...")
    try:
        from schedule_generator import ScheduleGenerator, generate_schedule_with_class
        print("✅ schedule_generator imports successful")
        test_results["tests"].append({
            "name": "import_schedule_generator",
            "status": "PASSED",
            "duration": 0.001,
            "message": "Import successful"
        })
        test_results["summary"]["passed"] += 1
    except Exception as e:
        print(f"❌ schedule_generator import failed: {str(e)}")
        test_results["tests"].append({
            "name": "import_schedule_generator", 
            "status": "FAILED",
            "duration": 0.001,
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        test_results["summary"]["failed"] += 1
    
    test_results["summary"]["total"] += 1
    
    # データベース接続テスト
    print()
    print("🧪 Testing database connectivity...")
    try:
        import sqlite3
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        conn.close()
        print(f"✅ Database connection successful - {len(tables)} tables found")
        test_results["tests"].append({
            "name": "database_connection",
            "status": "PASSED", 
            "duration": 0.002,
            "message": f"Connected successfully, {len(tables)} tables found"
        })
        test_results["summary"]["passed"] += 1
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        test_results["tests"].append({
            "name": "database_connection",
            "status": "FAILED",
            "duration": 0.002,
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        test_results["summary"]["failed"] += 1
    
    test_results["summary"]["total"] += 1
    
    # ScheduleGeneratorの初期化テスト
    print()
    print("🧪 Testing ScheduleGenerator initialization...")
    try:
        generator = ScheduleGenerator("2025", True)
        print("✅ ScheduleGenerator initialization successful")
        test_results["tests"].append({
            "name": "schedule_generator_init",
            "status": "PASSED",
            "duration": 0.001,
            "message": "Initialization successful"
        })
        test_results["summary"]["passed"] += 1
    except Exception as e:
        print(f"❌ ScheduleGenerator initialization failed: {str(e)}")
        test_results["tests"].append({
            "name": "schedule_generator_init",
            "status": "FAILED", 
            "duration": 0.001,
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        test_results["summary"]["failed"] += 1
    
    test_results["summary"]["total"] += 1
    
    # データ読み込みテスト
    print()
    print("🧪 Testing data loading...")
    try:
        generator = ScheduleGenerator("2025", True)
        generator.load_committee_members()
        generator.load_libraries()
        print(f"✅ Data loading successful - {len(generator.committee_members)} members, {len(generator.libraries)} libraries")
        test_results["tests"].append({
            "name": "data_loading",
            "status": "PASSED",
            "duration": 0.005,
            "message": f"Loaded {len(generator.committee_members)} members, {len(generator.libraries)} libraries"
        })
        test_results["summary"]["passed"] += 1
        generator.close_db_connection()
    except Exception as e:
        print(f"❌ Data loading failed: {str(e)}")
        test_results["tests"].append({
            "name": "data_loading",
            "status": "FAILED",
            "duration": 0.005,
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        test_results["summary"]["failed"] += 1
    
    test_results["summary"]["total"] += 1
    
    # スケジュール生成テスト
    print()
    print("🧪 Testing schedule generation...")
    try:
        schedule_id = generate_schedule_with_class(
            academic_year="2025",
            is_first_half=True,
            name="CI/CDテストスケジュール",
            description="自動テスト用スケジュール",
            start_date="2025-04-01",
            end_date="2025-04-30"
        )
        print(f"✅ Schedule generation successful - Schedule ID: {schedule_id}")
        test_results["tests"].append({
            "name": "schedule_generation",
            "status": "PASSED",
            "duration": 0.010,
            "message": f"Schedule created with ID: {schedule_id}"
        })
        test_results["summary"]["passed"] += 1
    except Exception as e:
        print(f"❌ Schedule generation failed: {str(e)}")
        test_results["tests"].append({
            "name": "schedule_generation",
            "status": "FAILED",
            "duration": 0.010,
            "message": str(e),
            "traceback": traceback.format_exc()
        })
        test_results["summary"]["failed"] += 1
    
    test_results["summary"]["total"] += 1
    
    # テスト結果サマリー
    print()
    print("=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    print(f"Total tests: {test_results['summary']['total']}")
    print(f"✅ Passed: {test_results['summary']['passed']}")
    print(f"❌ Failed: {test_results['summary']['failed']}")
    print(f"⚠️  Errors: {test_results['summary']['errors']}")
    
    success_rate = (test_results['summary']['passed'] / test_results['summary']['total']) * 100
    print(f"📊 Success rate: {success_rate:.1f}%")
    
    # GitHub Actions形式でのサマリー
    print()
    print("::group::GitHub Actions Summary")
    if test_results['summary']['failed'] == 0:
        print("::notice title=Test Results::✅ All tests passed!")
    else:
        print(f"::warning title=Test Results::❌ {test_results['summary']['failed']} tests failed")
    
    for test in test_results['tests']:
        if test['status'] == 'FAILED':
            print(f"::error title={test['name']}::{test['message']}")
        else:
            print(f"::notice title={test['name']}::{test['message']}")
    print("::endgroup::")
    
    # JSON形式でレポート出力
    print()
    print("=" * 80)
    print("JSON TEST REPORT (for CI/CD)")
    print("=" * 80)
    print(json.dumps(test_results, indent=2, ensure_ascii=False))
    
    # HTMLレポート生成
    html_report = generate_html_report(test_results)
    try:
        os.makedirs('reports', exist_ok=True)
        with open('reports/test_report.html', 'w', encoding='utf-8') as f:
            f.write(html_report)
        print()
        print("📄 HTML report generated: reports/test_report.html")
    except Exception as e:
        print(f"⚠️  Could not generate HTML report: {e}")
    
    # JSONレポート保存
    try:
        with open('reports/test_report.json', 'w', encoding='utf-8') as f:
            json.dump(test_results, f, indent=2, ensure_ascii=False)
        print("📄 JSON report generated: reports/test_report.json")
    except Exception as e:
        print(f"⚠️  Could not generate JSON report: {e}")
    
    print()
    print(f"Test run completed at: {datetime.now().isoformat()}")
    
    # 失敗があった場合は終了コードを1にする
    if test_results['summary']['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

def generate_html_report(test_results):
    """HTMLテストレポートを生成"""
    html = f"""
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock Backend Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
        .summary {{ margin: 20px 0; }}
        .test-case {{ border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }}
        .passed {{ border-left: 5px solid #28a745; }}
        .failed {{ border-left: 5px solid #dc3545; }}
        .status {{ font-weight: bold; }}
        .passed .status {{ color: #28a745; }}
        .failed .status {{ color: #dc3545; }}
        .traceback {{ background: #f8f8f8; padding: 10px; margin-top: 10px; font-family: monospace; white-space: pre-wrap; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Mock Backend Test Report</h1>
        <p><strong>実行日時:</strong> {test_results['timestamp']}</p>
        <p><strong>プラットフォーム:</strong> {test_results['platform']}</p>
        <p><strong>Python バージョン:</strong> {test_results['python_version']}</p>
    </div>
    
    <div class="summary">
        <h2>テスト結果サマリー</h2>
        <p><strong>総テスト数:</strong> {test_results['summary']['total']}</p>
        <p><strong>成功:</strong> {test_results['summary']['passed']}</p>
        <p><strong>失敗:</strong> {test_results['summary']['failed']}</p>
        <p><strong>エラー:</strong> {test_results['summary']['errors']}</p>
        <p><strong>成功率:</strong> {(test_results['summary']['passed'] / test_results['summary']['total']) * 100:.1f}%</p>
    </div>
    
    <div class="test-cases">
        <h2>テストケース詳細</h2>
"""
    
    for test in test_results['tests']:
        status_class = test['status'].lower()
        html += f"""
        <div class="test-case {status_class}">
            <h3>{test['name']}</h3>
            <p><span class="status">ステータス: {test['status']}</span></p>
            <p><strong>実行時間:</strong> {test['duration']}秒</p>
            <p><strong>メッセージ:</strong> {test['message']}</p>
"""
        if 'traceback' in test:
            html += f'<div class="traceback">{test["traceback"]}</div>'
        html += "</div>"
    
    html += """
    </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    run_tests()
