# ADR 0005: MVP向けアーキテクチャの決定

## ステータス

承認済み (2025-06-26)

## コンテキスト

図書委員当番割り当てシステムのMVP開発において、バックエンドアーキテクチャの選択について再検討が必要となった。

### 当初の検討

- ADR 0002では独立したNestJS APIの採用を検討
- しかし、MVPの規模と要件を詳細に分析した結果、より適切なアーキテクチャの検討が必要

### MVP要件の再分析

1. **データ規模**: 小学校1校分（クラス数個、図書委員20-30名程度）
2. **同時接続数**: 教員数名 + 表示専用アクセス（最大10-20接続）
3. **機能複雑度**: CRUD操作 + スケジューリングアルゴリズム
4. **開発期間**: 迅速なMVP開発が最優先
5. **運用コスト**: 低コストでの運用が重要
6. **チーム規模**: 小規模開発チーム

## 決定

MVPフェーズでは **Next.js API Routes** を採用し、独立したバックエンドAPIは構築しない。

### 技術スタック

1. **フロントエンド**: Next.js 15 + TypeScript + shadcn/ui
2. **バックエンド**: Next.js API Routes + Server Actions
3. **データベース**: Supabase PostgreSQL + Prisma ORM
4. **認証**: Supabase Auth
5. **デプロイ**: Vercel（統合デプロイメント）

## 根拠

### Next.js API Routes採用の理由

#### メリット

1. **開発効率の最大化**
   - フロントエンド・バックエンドの統合開発
   - 共通の型定義とバリデーション
   - 単一のビルド・デプロイプロセス

2. **MVPに最適な規模感**
   - 小〜中規模アプリケーションに最適
   - 過剰設計を避けた適切な技術選択

3. **運用コストの最小化**
   - 単一アプリケーションでのホスティング
   - インフラ管理の簡素化
   - Vercelの無料枠で十分な範囲

4. **スケーラビリティ**
   - 将来的な分離が必要になった場合の移行計画あり
   - サーバーレス対応で自動スケーリング

#### デメリットと対策

1. **複雑なビジネスロジックの懸念**
   - **対策**: スケジューリングアルゴリズムは独立したServiceクラスとして実装
   - **対策**: テスト容易性を確保した設計

2. **将来的なスケーラビリティ**
   - **対策**: Post-MVP での分離移行を想定した設計
   - **対策**: APIインターフェースの明確な定義

### 独立したNestJS APIを採用しない理由

1. **過剰設計のリスク**
   - MVPの規模に対して複雑すぎる
   - 開発工数の増大

2. **運用コストの増大**
   - 複数サービスの管理
   - インフラコストの増加

3. **開発効率の低下**
   - フロントエンド・バックエンドの分離による開発速度低下
   - API仕様の同期コスト

## 影響

### ポジティブな影響

1. **MVP開発速度の向上**: 統合開発による効率化
2. **運用コストの削減**: 単一デプロイメント
3. **学習コストの軽減**: Next.jsエコシステム統一
4. **初期リリースの早期化**: シンプルなアーキテクチャ

### ネガティブな影響と緩和策

1. **将来の分離コスト**
   - **緩和策**: 明確なレイヤー分離設計
   - **緩和策**: APIファーストの開発アプローチ

2. **複雑なロジックの実装制約**
   - **緩和策**: Service層の適切な設計
   - **緩和策**: 外部ライブラリの活用

## Post-MVP移行計画

MVPの成功後、以下の条件が満たされた場合にNestJS分離を検討：

1. **同時接続数**: 100+接続の常時負荷
2. **データ規模**: 複数校対応が必要
3. **機能複雑度**: 高度な分析・レポート機能の追加
4. **チーム規模**: フロントエンド・バックエンドチームの分離

### 移行アプローチ

1. **段階的分離**: 重要機能から順次移行
2. **APIインターフェース維持**: 既存APIとの互換性確保
3. **データベース共有**: Supabaseは継続利用

## 実装詳細

### プロジェクト構造

```
tosho-in-wariate-kun/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # 管理者向けページ
│   │   ├── (public)/          # 表示専用ページ
│   │   └── api/               # API Routes
│   ├── components/            # UIコンポーネント
│   ├── lib/                   # ユーティリティ
│   │   ├── services/          # ビジネスロジック
│   │   ├── schedulers/        # スケジューリングエンジン
│   │   └── database/          # データベース接続
│   └── types/                 # 型定義
```

### API Routes設計

```typescript
// app/api/classes/route.ts - クラス管理
// app/api/students/route.ts - 図書委員管理
// app/api/schedules/route.ts - 当番表管理
// app/api/schedules/generate/route.ts - 自動生成
// app/api/auth/[...nextauth]/route.ts - 認証
```

## 参考資料

- [Next.js API Routes公式ドキュメント](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel デプロイメントガイド](https://vercel.com/docs)
- [MVP開発のベストプラクティス](https://lean-startup.com/)
