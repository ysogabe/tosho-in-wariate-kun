# ADR 0003: データベース基盤としてのSupabaseの採用

## ステータス

承認済み (2025-05-22)

## 決定事項

データベース基盤として**Supabase**を採用する。

## コンテキスト

図書委員当番割り当てシステム（通称：当番割り当てくん）のデータベース基盤において、以下の要件を満たす技術を選定する必要がある：

1. データの安全な保存と効率的な取得
2. スケジューリングデータの管理
3. シンプルかつ高速な開発サイクル
4. 将来的な拡張性と保守性
5. データアクセス制御と権限管理

当初計画ではPostgreSQLをセルフホスティングまたは従来のDBaaSで採用予定だったが、Supabaseという選択肢も考慮し、比較検討を行う。

## 根拠

### Supabaseのデータベース機能

#### メリット

1. **PostgreSQL基盤**
   - 強力なリレーショナルデータベースエンジンとして実績のあるPostgreSQLを使用
   - JSON対応、高度なインデックス、トランザクションなどの機能をそのまま利用可能

2. **管理の容易さ**
   - インフラストラクチャの管理が不要
   - バックアップ、スケーリング、セキュリティパッチなどが自動化

3. **開発効率**
   - ダッシュボードでのスキーマ管理が可能
   - APIの自動生成（RESTful & GraphQL）
   - 行レベルのセキュリティポリシー（RLS）による細かいアクセス制御

4. **リアルタイム機能**
   - WebSocketsを通じたリアルタイム更新
   - データ変更のリアルタイム購読（スケジュール変更の即時反映に有用）

5. **拡張機能**
   - PostgreSQLの拡張機能を活用（全文検索、地理空間データなど）
   - カスタムストアドプロシージャやトリガーのサポート

6. **コスト効率**
   - 無料枠が開発に十分
   - 利用量ベースの料金体系

#### デメリット

1. **ベンダーロックイン**
   - Supabaseに依存したアプリケーションロジックが発生する可能性
   - 移行コストが発生する場合がある

2. **カスタマイズの制限**
   - 非常に特殊なデータベース設定が必要な場合は制約がある
   - ホスティング環境の完全なコントロールができない

3. **コスト予測**
   - 利用量が増えるとコストが予測しづらくなる場合がある
   - 高トラフィック時のコスト管理が必要

4. **複雑なクエリの最適化**
   - 自動生成APIでは最適化が難しい複雑なクエリがある場合がある
   - パフォーマンスチューニングの選択肢が制限される

## 影響

### ポジティブな影響

1. **開発速度の向上**
   - データベース設計から実装までの時間短縮
   - フロントエンドとの統合が容易

2. **運用負荷の軽減**
   - インフラ管理からの解放
   - スケーリングやバックアップの自動化

3. **セキュリティ強化**
   - RLSによる堅牢なアクセス制御
   - 専門チームによるセキュリティ管理

4. **リアルタイム機能の実現**
   - 当番スケジュールの変更がリアルタイムで反映
   - ユーザーエクスペリエンスの向上

### ネガティブな影響

1. **外部サービス依存**
   - サービス障害時の影響
   - 将来的な料金体系変更のリスク

2. **学習コスト**
   - Supabase特有のパターンやRLSの学習
   - 従来のORMとは異なるアプローチへの適応

3. **特殊要件への対応**
   - スケジューリングアルゴリズムなど計算集約型処理の実装方法検討が必要

## 代替案

### 1. セルフホスティングのPostgreSQL + Prisma

#### メリット

- 完全なコントロール
- ベンダーロックインなし
- 従来型の開発パターン

#### デメリット

- インフラ管理コスト
- 開発工数増加
- リアルタイム機能の自前実装が必要

### 2. Firebase

#### メリット

- Googleの強力なインフラ
- 豊富な統合サービス
- スケーラビリティ

#### デメリット

- NoSQLモデル（スケジュールデータの関係モデリングに不向き）
- クエリの柔軟性に制限
- コスト構造がSupabaseより複雑な場合がある

### 3. Planet Scale (MySQL) + Prisma

#### メリット

- 高いスケーラビリティ
- ブランチング機能
- MySQLの親和性

#### デメリット

- リアルタイム機能の欠如
- PostgreSQLの高度な機能がない
- RLSのような細かい権限制御の実装が複雑

## 代替案

### 1. セルフホスティングのPostgreSQL + Prisma

#### メリット

- 完全なコントロール
- ベンダーロックインなし
- 従来型の開発パターン

#### デメリット

- インフラ管理コスト
- 開発工数増加
- リアルタイム機能の自前実装が必要

### 2. Firebase

#### メリット

- Googleの強力なインフラ
- 豊富な統合サービス
- スケーラビリティ

#### デメリット

- NoSQLモデル（スケジュールデータの関係モデリングに不向き）
- クエリの柔軟性に制限
- コスト構造がSupabaseより複雑な場合がある

### 3. Planet Scale (MySQL) + Prisma

#### メリット

- 高いスケーラビリティ
- ブランチング機能
- MySQLの親和性

#### デメリット

- リアルタイム機能の欠如
- PostgreSQLの高度な機能がない
- RLSのような細かい権限制御の実装が複雑

## 実装詳細

### データモデル設計

Supabaseのスキーマ設計例：

```sql
-- ユーザーテーブル (Supabase Authと連携)
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  role TEXT DEFAULT 'committee_member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 学年テーブル
CREATE TABLE grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- クラステーブル
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  grade_id UUID REFERENCES grades NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 図書委員テーブル
CREATE TABLE committee_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES users,
  class_id UUID REFERENCES classes NOT NULL,
  position TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- その他必要なテーブル...
```

### Row Level Security (RLS) ポリシー

アクセス制御のためのRLSポリシー例：

```sql
-- ユーザーテーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分自身のデータのみ読み取り可能
CREATE POLICY "ユーザーは自分のデータのみ表示可能" ON users
  FOR SELECT USING (auth.uid() = id);

-- 管理者は全ユーザーデータを読み取り可能
CREATE POLICY "管理者は全ユーザーデータを表示可能" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- スケジュールテーブルのRLS
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;

-- 委員は自分のスケジュールのみ表示可能
CREATE POLICY "委員は自分のスケジュールのみ表示可能" ON schedule_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM committee_members cm
      WHERE cm.id = schedule_assignments.member_id
      AND cm.user_id = auth.uid()
    )
  );

-- 教員と委員長は全スケジュールを表示可能
CREATE POLICY "教員と委員長は全スケジュールを表示可能" ON schedule_assignments
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'teacher', 'committee_chair')
  );
```

### リアルタイム購読設定

```typescript
// クライアント側でのリアルタイム購読の例
const scheduleSubscription = supabase
  .from('schedule_assignments')
  .on('*', (payload) => {
    // スケジュール変更をUIに反映
    updateScheduleDisplay(payload.new)
  })
  .subscribe()
```

## 注意点

1. **RLSポリシーの設計**
   - すべてのテーブルに適切なRLSポリシーを設定し、データセキュリティを確保
   - デフォルトは「拒否」とし、明示的に許可ポリシーを設定する原則を徹底

2. **複雑なクエリとロジック**
   - スケジューリングアルゴリズムなど複雑なロジックは、APIエンドポイント（Supabase Edge Functions）で実装
   - パフォーマンスクリティカルな操作はストアドプロシージャとして実装を検討

3. **バックアップと災害復旧**
   - 定期的なデータエクスポート
   - 重要な運用イベント前の手動バックアップ

4. **コスト管理**
   - リソース使用量のモニタリング
   - 不要なリアルタイム購読の最適化

## 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Row Level Security (RLS)の解説](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase料金ページ](https://supabase.com/pricing)
