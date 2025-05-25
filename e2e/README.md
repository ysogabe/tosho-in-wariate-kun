# E2E テストディレクトリ

## ディレクトリ構造

```
e2e/
├── specs/                    # テストスペックファイル
│   ├── ui-changes.spec.js    # UI変更テスト
│   ├── schedule-generation.spec.js  # スケジュール生成テスト
│   └── weekly-schedule.spec.js      # 週間スケジュールテスト
├── helpers/                  # ヘルパー・ユーティリティ
│   ├── global-setup.js      # グローバルセットアップ
│   ├── global-teardown.js   # グローバルTeardown
│   └── setup.js             # データベースセットアップ
└── fixtures/                # テストデータ・フィクスチャ
```

## テスト実行方法

### 全テスト実行
```bash
npx playwright test
```

### 特定のテストファイル実行
```bash
# UI変更テスト
npx playwright test specs/ui-changes.spec.js

# スケジュール生成テスト  
npx playwright test specs/schedule-generation.spec.js

# 週間スケジュールテスト
npx playwright test specs/weekly-schedule.spec.js
```

### ブラウザ表示モード
```bash
npx playwright test --headed
```

### デバッグモード
```bash
npx playwright test --debug
```

## 前提条件

### 必要なサービス
1. **フロントエンド**: http://localhost:3000 で起動
2. **バックエンド**: http://localhost:3001 で起動
3. **データベース**: SQLiteデータベースが初期化済み

### セットアップコマンド
```bash
# フロントエンド起動
cd frontend && npm run dev

# バックエンド起動（別ターミナル）
cd mock_backend && python app.py
```

## テスト内容

### UI変更テスト（ui-changes.spec.js）
- 管理画面での学年管理機能の非表示確認
- 図書室管理機能の表示確認
- クラス一覧での学年カラム非表示確認

### スケジュール生成テスト（schedule-generation.spec.js）
- スケジュール生成ページの表示確認
- フォーム入力バリデーション
- スケジュール生成処理の動作確認

### 週間スケジュールテスト（weekly-schedule.spec.js）
- 週間カレンダー表示
- スケジュール詳細表示
- ナビゲーション機能

## 設定ファイル

- **playwright.config.ts**: Playwrightメイン設定
- **helpers/global-setup.js**: テスト開始前の初期化処理
- **helpers/global-teardown.js**: テスト終了後のクリーンアップ
- **helpers/setup.js**: データベースセットアップユーティリティ

## レポート

テスト実行後、以下の場所にレポートが生成されます：
- **HTML レポート**: `playwright-report/`
- **テスト結果**: `test-results/`

## 関連ドキュメント

- [E2Eテスト仕様書](../docs/e2e_test_specification.md)
- [Mock Backend テスト仕様書](../docs/mock_backend_test_specification.md)
