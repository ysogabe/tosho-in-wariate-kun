# ADR 0004: 認証基盤としてのSupabase Authの採用

## ステータス

検討中 (2025-05-22)

## コンテキスト

図書委員当番割り当てシステム（通称：当番割り当てくん）の認証基盤において、以下の要件を満たす技術を選定する必要がある：

1. 安全で信頼性の高いユーザー認証
2. 異なるユーザーロール（教員、図書委員長、図書委員）の管理
3. アクセス制御と権限管理
4. 開発の容易さと保守性
5. フロントエンド（Next.js）との連携のしやすさ

当初計画ではNextAuth.jsを採用予定だったが、データベース基盤としてSupabaseを検討することに伴い、Supabase Authについても検討を行う。

## 決定事項

認証基盤として**Supabase Auth**を採用する。

## 根拠

### Supabase Authの特徴

#### メリット

1. **包括的な認証機能**
   - メール/パスワード認証
   - ソーシャルログイン（Google, GitHub, Microsoftなど）
   - マジックリンク認証
   - 電話番号認証（SMS）
   - カスタム認証フロー

2. **Supabaseデータベースとの緊密な統合**
   - 認証とデータベースのシームレスな連携
   - Row Level Security (RLS)との直接統合
   - JWTトークンに基づく権限管理

3. **セキュリティ**
   - 業界標準のセキュリティプラクティス
   - JWTベースの認証
   - パスワードハッシュ化と安全な保存
   - セッション管理

4. **開発者体験**
   - シンプルなAPIとSDK
   - 詳細なドキュメント
   - Next.jsとの容易な統合

5. **カスタマイズ性**
   - カスタムメール通知
   - カスタム認証フロー
   - フックスクリプト

6. **無料枠**
   - 開発やスモールプロジェクトに十分な無料枠

#### デメリット

1. **特定のフレームワークへの依存**
   - SupabaseクライアントSDKへの依存
   - 将来的な移行が複雑になる可能性

2. **カスタマイズの制限**
   - 高度なカスタム認証フローの一部に制限がある場合がある
   - UIカスタマイズは自前で実装が必要

3. **学習コスト**
   - Supabase特有の認証パターンの学習
   - RLSを使ったアクセス制御の理解

4. **サービス依存**
   - Supabaseサービスの可用性に依存
   - ベンダーロックインの懸念

## 影響

### ポジティブな影響

1. **開発時間の短縮**
   - 認証機能の実装時間の大幅削減
   - フロントエンドとバックエンドの認証連携の簡略化

2. **セキュリティの向上**
   - 専門チームによる認証基盤の管理
   - 継続的なセキュリティアップデート

3. **データアクセス制御の統合**
   - 認証とデータベースのアクセス制御が一体化
   - ロールベースのアクセス制御の実装が容易

4. **スケーラビリティ**
   - 認証システムのスケーリングが自動的に処理される

### ネガティブな影響

1. **サードパーティ依存**
   - 外部サービスへの依存によるリスク
   - 将来的なAPI変更の可能性

2. **移行の複雑さ**
   - 将来Supabaseから移行する場合の手間

3. **インターネット接続依存**
   - オフライン開発環境での制約

## 代替案

### 1. NextAuth.js

#### メリット
- Next.jsとの緊密な統合
- 多様な認証プロバイダー
- 柔軟なカスタマイズ
- データベース非依存

#### デメリット
- Supabaseデータベースとの統合に追加作業が必要
- RLSとの連携が複雑
- 認証とデータベースの同期維持が必要

### 2. Firebase Authentication

#### メリット
- 成熟した認証システム
- 広範なソーシャルログインオプション
- 電話認証のサポート

#### デメリット
- Supabaseデータベースとの連携が複雑
- Firebaseエコシステムへの依存
- 複数サービスにまたがる管理の複雑さ

### 3. カスタム認証システム

#### メリット
- 完全なカスタマイズ性
- 特定の要件に合わせた最適化
- 外部依存なし

#### デメリット
- 実装コストが非常に高い
- セキュリティリスク
- 保守コストの増大

## 実装詳細

### クライアント側の認証フロー

```typescript
// Supabase Auth初期化
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// サインアップ
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

// ログイン
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// ログアウト
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// ユーザーセッション管理
const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { data, error }
}
```

### ロールベースのアクセス制御

```typescript
// ユーザーロールの設定（サインアップ後）
const setUserRole = async (userId: string, role: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
  
  return { data, error }
}

// ロールに基づくUI表示の制御
const RoleBasedComponent = ({ requiredRole, children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        setUser({ ...data.user, role: userData?.role })
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  if (user.role !== requiredRole) return null

  return <>{children}</>
}
```

### Next.jsでのミドルウェアによる保護

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 認証されていない場合はログインページにリダイレクト
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // 特定のロールが必要なページの保護
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', session?.user?.id)
      .single()
    
    if (data?.role !== 'admin' && data?.role !== 'teacher') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/schedule/:path*',
  ],
}
```

## 注意点

1. **セキュリティベストプラクティス**
   - 認証情報の安全な管理
   - 環境変数によるAPIキー管理
   - CSRFトークン対策

2. **ユーザーエクスペリエンス**
   - わかりやすい認証フローの設計
   - エラーメッセージの明確な表示
   - 認証状態の適切な反映

3. **テスト**
   - 認証フローの徹底的なテスト
   - 異なるロールでのアクセス制御テスト
   - エッジケースの考慮

4. **フォールバック計画**
   - Supabase認証に問題が発生した場合の対策
   - オフライン認証の検討

## 参考資料

- [Supabase Auth公式ドキュメント](https://supabase.com/docs/guides/auth)
- [Next.jsとSupabaseの統合ガイド](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [JWTについての解説](https://jwt.io/introduction)
- [アクセス制御ベストプラクティス](https://supabase.com/docs/guides/auth/row-level-security)
