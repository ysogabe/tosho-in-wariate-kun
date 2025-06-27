# ADR 0002: バックエンド技術スタックの選定

## ステータス

承認済み (2025-05-22)

## コンテキスト

図書委員当番割り当てシステム（通称：当番割り当てくん）のバックエンド開発において、以下の要件を満たす技術スタックを選定する必要がある：

1. 安定性と信頼性の高いAPI提供
2. スケジュールアルゴリズムの効率的な実装
3. データベースとの円滑な連携
4. 将来的な拡張性と保守性
5. フロントエンド（Next.js）との連携のしやすさ
6. 開発効率の向上
7. 運用コストの削減

当初計画ではNode.js (Express) + TypeScript + SQLiteを採用予定だったが、以下の理由によりSupabaseを採用することに決定した。

## 決定

以下の技術スタックを採用する：

1. **Supabase**: バックエンド全体の基盤として
   - **PostgreSQL**: リレーショナルデータベース
   - **Supabase Auth**: 認証・認可
   - **Supabase Storage**: ファイルストレージ
   - **Supabase Realtime**: リアルタイム更新
2. **Next.js API Routes & Server Actions**: サーバーサイドロジック用
3. **TypeScript**: 開発言語として
4. **Prisma**: 型安全なデータベースアクセス（オプション）

## 根拠

### Supabase

#### メリット

- **オールインワンソリューション**: 認証、データベース、ストレージ、リアルタイム機能を一括提供
- **PostgreSQLベース**: リレーショナルデータベースの強力な機能をフル活用可能
- **リアルタイム機能**: WebSocketベースのリアルタイムアップデートを簡単に実装可能
- **組み込みの認証**: メール/パスワード、ソーシャルログイン、Magic Linkなどを標準サポート
- **行レベルセキュリティ**: データベースレベルできめ細かいアクセス制御が可能
- **無料枠が充実**: 小〜中規模アプリケーションでは無料で利用可能
- **ホスティング不要**: クラウドサービスとして提供されているため、自前でサーバー管理が不要
- **拡張性**: 必要に応じてスケールアップが可能

#### デメリット

- **ベンダーロックイン**: 特定のクラウドプロバイダーに依存
- **カスタマイズの制限**: 自前のバックエンドに比べてカスタマイズ性に限界がある場合がある
- **コスト**: 大規模な利用ではコストが高くなる可能性がある

### Next.js API Routes & Server Actions

#### メリット

- **統合開発**: フロントエンドとバックエンドを同一リポジトリ・プロジェクト内で開発可能
- **ファイルベースのAPI定義**: 直感的なAPI構造とエンドポイント定義
- **サーバーレス対応**: エッジランタイムでの実行やサーバーレスデプロイに対応
- **Server Actions**: フォーム処理などをサーバーサイドで直接処理可能
- **開発の一貫性**: フロントエンドとバックエンドで同じTypeScriptの型定義を共有可能
- **Supabase連携**: Supabaseクライアントと相性が良く、シームレスに統合可能

#### デメリット

- **複雑なビジネスロジック**: 非常に複雑なバックエンドロジックには向かない場合がある
- **スケーラビリティ**: 大規模アプリケーションでは独立したバックエンドが適切な場合もある
- **デプロイ制約**: フロントエンドとバックエンドが同じデプロイサイクルになる

### TypeScript

#### メリット

- **型安全性**: コンパイル時に型エラーを検出可能
- **開発者体験**: 優れたIDEサポートとコード補完
- **ドキュメンテーション**: 型定義がそのままドキュメントとして機能
- **大規模開発**: 大規模なチーム開発での効率向上
- **エコシステム**: 豊富な型定義ファイルが利用可能

## 影響

### ポジティブな影響

1. **開発効率の大幅な向上**: Supabaseのオールインワンソリューションにより、バックエンド開発の工数が大幅に削減
2. **インフラ管理の軽減**: データベース、認証、ストレージ、リアルタイム機能を一括管理
3. **リアルタイム機能の容易な実装**: WebSocketベースのリアルタイム更新を簡単に実装可能
4. **スケーラビリティ**: クラウドネイティブなアーキテクチャにより、必要に応じたスケーリングが可能
5. **コスト効率**: 小〜中規模では無料枠で運用可能
6. **セキュリティ**: 組み込みの認証・認可機能により、セキュリティリスクを低減

### ネガティブな影響

1. **ベンダーロックイン**: Supabaseに依存するため、将来的な移行コストが発生する可能性
2. **学習コスト**: Supabaseの概念やAPIに習熟する必要がある
3. **カスタマイズの制限**: 自前のバックエンドに比べて柔軟性に欠ける部分がある
4. **オフライン対応**: オフラインでの動作に制限がある可能性

## 代替案

1. **Node.js (Express) + TypeScript + SQLite**:
   - 当初の計画
   - フロントエンドとバックエンドが分離するため、開発効率が下がる可能性がある
   - SQLiteは同時接続数に制限があるため、将来的なスケーラビリティに課題

2. **NestJS + TypeORM + PostgreSQL**:
   - 大規模なバックエンド開発に適している
   - 学習曲線が急で、小規模プロジェクトには過剰な機能がある
   - フロントエンドとの分離が必要

3. **Supabase/Firebase**:
   - BaaSでバックエンド開発の労力を大幅に削減できる
   - カスタムロジック（特にスケジューリングアルゴリズム）の実装が難しい
   - ベンダーロックインのリスク

## 実装詳細

### プロジェクト構成

```
tosho-in-wariate-kun/
├── src/
│   ├── app/              # Next.js App Router
│   │   └── api/          # API Routes
│   ├── db/               # データベース関連
│   │   ├── schema.prisma # Prismaスキーマ
│   │   └── migrations/   # マイグレーションファイル
│   ├── lib/              # ユーティリティ関数
│   │   └── scheduler/    # スケジューリングエンジン
│   ├── services/         # ビジネスロジック
│   ├── types/            # 型定義
│   └── auth.ts           # NextAuth設定
├── prisma/               # Prisma設定
├── next.config.js        # Next.js設定
└── package.json          # 依存関係
```

### データベーススキーマ設計

Prismaを使用した主要なデータモデル定義例：

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(COMMITTEE_MEMBER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  committeeMember CommitteeMember?
  accounts      Account[]
  sessions      Session[]
}

enum Role {
  ADMIN
  TEACHER
  COMMITTEE_CHAIR
  COMMITTEE_MEMBER
}

model Grade {
  id        String   @id @default(cuid())
  name      String
  year      Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  classes   Class[]
}

model Class {
  id              String   @id @default(cuid())
  name            String
  gradeId         String
  grade           Grade    @relation(fields: [gradeId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  committeeMembers CommitteeMember[]
}

model CommitteeMember {
  id        String   @id @default(cuid())
  name      String
  userId    String?  @unique
  user      User?    @relation(fields: [userId], references: [id])
  classId   String
  class     Class    @relation(fields: [classId], references: [id])
  positionId String
  position  Position @relation(fields: [positionId], references: [id])
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  assignments ScheduleAssignment[]
}

// 他のモデル定義...
```

### 環境構築ステップ

1. Prismaのセットアップ

```bash
npm install prisma @prisma/client
npx prisma init
```

2. NextAuth.jsのセットアップ

```bash
npm install next-auth
```

3. データベースマイグレーション

```bash
npx prisma migrate dev --name init
```

## 注意点

1. **データベース移行**: 開発初期はSQLiteを使用し、本番環境前にPostgreSQLに移行することも検討
2. **環境変数管理**: データベース接続情報などの機密情報は環境変数で管理
3. **バックアップ戦略**: 定期的なデータバックアップ体制の構築
4. **スケジューリングアルゴリズムの分離**: コアロジックはフレームワークから独立した形で実装し、テスト容易性を確保

## 参考資料

- [Next.js API Routes公式ドキュメント](https://nextjs.org/docs/api-routes/introduction)
- [Prisma公式ドキュメント](https://www.prisma.io/docs/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [NextAuth.js公式ドキュメント](https://next-auth.js.org/)
