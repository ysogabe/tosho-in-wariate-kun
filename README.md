# 図書委員当番くん (Tosho-in Wariate-kun)

図書委員当番くんは、学校の図書委員の当番管理をサポートするウェブアプリケーションです。

## 機能

- 図書委員の当番スケジュール管理
- ユーザー認証（ログイン・ログアウト）
- 管理者機能

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TailwindCSS
- **バックエンド**: Python Flask (Mock Backend)
- **データベース**: SQLite
- **言語**: TypeScript, Python
- **テスト**: Playwright (E2E), Pytest (Unit/Integration)

## 開発環境のセットアップ

### フロントエンド

```bash
# リポジトリをクローン
git clone https://github.com/ysogabe/tosho-in-wariate-kun.git
cd tosho-in-wariate-kun

# フロントエンドの依存関係をインストール
cd frontend
npm install

# 開発サーバーを起動
npm run dev
```

### バックエンド（Mock Backend）

```bash
# バックエンドディレクトリに移動
cd mock_backend

# Python仮想環境を作成・有効化
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# 依存関係をインストール
pip install -r requirements.txt

# データベースを初期化
python init_database.py

# サーバーを起動
python app.py
```

## テスト

### 単体・統合テスト

```bash
cd mock_backend
pytest --cov=. --cov-report=html
```

### E2Eテスト

```bash
# フロントエンド・バックエンドサーバーを起動後
npx playwright test
```

## ドキュメント

### 設計・仕様書
- [要件定義書](docs/requirements.md) - システム要件と機能仕様
- [システム設計書](docs/system_design.md) - アーキテクチャと技術設計
- [データベース設計書](docs/database_design.md) - DB構造と制約
- [画面設計書](docs/screen_design.md) - UI/UX設計仕様
- [実装計画書](docs/implementation_plan.md) - 3フェーズ実装計画

### テスト仕様書
- [テスト戦略書](docs/test_strategy.md) - 総合テスト戦略
- [Mock Backend テスト仕様書](docs/mock_backend_test_specification.md)
- [E2Eテスト仕様書](docs/e2e_test_specification.md)

### 技術仕様書
- [スケジュール生成エンジン設計書](docs/schedule_generator_design.md)
- [スケジュール管理仕様書](docs/schedule-management.md)
- [スケジュール生成テスト仕様書](docs/schedule_generator_test_spec.md)

### 開発ガイドライン
- [CSS/UIフレームワークガイドライン](docs/css_ui_framework_guidelines.yaml)
- [画面操作仕様](docs/screen_operations.yaml)

### アーキテクチャ決定記録 (ADR)
- [ADRディレクトリ](docs/adr/) - 技術選択の決定記録

## ライセンス

MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。
