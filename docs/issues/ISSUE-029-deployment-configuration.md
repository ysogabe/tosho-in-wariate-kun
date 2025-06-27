# Issue #029: デプロイ設定

**Priority**: Medium  
**Difficulty**: Advanced  
**Estimated Time**: 6-8 hours  
**Type**: DevOps  
**Labels**: deployment, infrastructure, production, vercel

## Description

Next.js アプリケーションの本番環境デプロイ設定を行います。Vercel を使用したホスティング、Supabase との統合、環境変数設定、CI/CD パイプライン構築を含む包括的なデプロイメント環境を整備します。

## Background

本システムは学校で使用される重要なアプリケーションのため、安定性とセキュリティを重視したデプロイメント環境が必要です。継続的インテグレーション・デプロイメントによる品質保証と効率的な運用体制を構築します。

## Acceptance Criteria

- [ ] Vercel デプロイ設定が完了している
- [ ] 環境変数の適切な設定が完了している
- [ ] Supabase 本番環境との連携が完了している
- [ ] CI/CD パイプラインが構築されている
- [ ] セキュリティ設定が適切に行われている
- [ ] パフォーマンス最適化が実装されている
- [ ] モニタリング設定が完了している
- [ ] エラー追跡システムが設定されている

## Implementation Guidelines

### Getting Started

1. Issue #027（テストセットアップ）が完了していることを確認
2. Issue #028（E2Eテスト）が完了していることを確認
3. Vercel アカウントの準備と設定方法を確認
4. Supabase 本番環境のセットアップ方法を理解

### Main Implementation

#### 1. Vercel Configuration

##### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["nrt1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=0, max-age=0"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/",
      "destination": "/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/healthz",
      "destination": "/api/health"
    }
  ]
}
```

##### next.config.mjs

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境での最適化設定
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // 実験的機能の有効化
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // 画像最適化設定
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // バンドル分析（開発時のみ）
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        }
      }
      return config
    },
  }),
}

export default nextConfig
```

#### 2. Environment Configuration

##### .env.production

```env
# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tosho-in-wariate-kun.vercel.app

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Security
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://tosho-in-wariate-kun.vercel.app

# Admin
ADMIN_RESET_PASSWORD=your-admin-password

# Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# System
SYSTEM_VERSION=1.0.0
BUILD_DATE=2024-01-01T00:00:00.000Z
```

##### .env.local.example

```env
# Development Environment Variables
# Copy this file to .env.local and fill in your values

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Development)
NEXT_PUBLIC_SUPABASE_URL=your-local-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Database (Development)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:password@localhost:54322/postgres

# Security
NEXTAUTH_SECRET=your-local-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Admin
ADMIN_RESET_PASSWORD=reset123

# System
SYSTEM_VERSION=1.0.0-dev
BUILD_DATE=2024-01-01T00:00:00.000Z
```

#### 3. GitHub Actions Workflow

##### .github/workflows/deploy.yml

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # コード品質チェック
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Check formatting
        run: npm run format:check

  # テスト実行
  test:
    runs-on: ubuntu-latest
    needs: quality-check

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: tosho_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          cp .env.test.example .env.test.local
          npm run db:test:setup
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/tosho_test

      - name: Run unit tests
        run: npm run test:ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_BASE_URL: http://localhost:3000

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
            test-results/
          retention-days: 30

  # セキュリティスキャン
  security:
    runs-on: ubuntu-latest
    needs: quality-check
    steps:
      - uses: actions/checkout@v4

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # デプロイ (プレビュー)
  deploy-preview:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install --global vercel@canary

      - name: Pull Vercel environment information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build project artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
        env:
          SYSTEM_VERSION: ${{ github.sha }}
          BUILD_DATE: ${{ github.event.head_commit.timestamp }}

      - name: Deploy project artifacts to Vercel
        id: deploy
        run: echo "url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})" >> $GITHUB_OUTPUT

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready! [View deployment](${{ steps.deploy.outputs.url }})`
            })

  # 本番デプロイ
  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://tosho-in-wariate-kun.vercel.app
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install --global vercel@canary

      - name: Pull Vercel environment information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build project artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          SYSTEM_VERSION: ${{ github.sha }}
          BUILD_DATE: ${{ github.event.head_commit.timestamp }}

      - name: Deploy project artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run post-deployment health check
        run: |
          sleep 30
          curl -f https://tosho-in-wariate-kun.vercel.app/api/health || exit 1

      - name: Notify deployment success
        run: echo "✅ Production deployment successful!"
```

#### 4. Health Check Endpoint

##### src/app/api/health/route.ts

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    // データベース接続チェック
    await prisma.$queryRaw`SELECT 1`

    // システム情報
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.SYSTEM_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: 'healthy',
        environment: 'healthy',
      },
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
        checks: {
          database: 'unhealthy',
          environment: 'unknown',
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }
}

export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new Response(null, { status: 200 })
  } catch (error) {
    return new Response(null, { status: 503 })
  }
}
```

#### 5. Performance Optimization

##### src/lib/performance/analytics.ts

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function PerformanceAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
```

##### src/app/layout.tsx (analytics integration)

```typescript
import { PerformanceAnalytics } from '@/lib/performance/analytics'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* 既存のコンテンツ */}
        {children}

        {/* パフォーマンス分析 */}
        <PerformanceAnalytics />
      </body>
    </html>
  )
}
```

#### 6. Error Monitoring

##### src/lib/monitoring/error-tracking.ts

```typescript
interface ErrorEvent {
  message: string
  stack?: string
  url: string
  line?: number
  column?: number
  timestamp: number
  userAgent: string
  userId?: string
}

export function setupErrorTracking() {
  if (typeof window === 'undefined') return

  // グローバルエラーハンドリング
  window.addEventListener('error', (event) => {
    const errorEvent: ErrorEvent = {
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    }

    logError('javascript_error', errorEvent)
  })

  // 未処理のPromiseリジェクション
  window.addEventListener('unhandledrejection', (event) => {
    const errorEvent: ErrorEvent = {
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    }

    logError('unhandled_rejection', errorEvent)
  })
}

async function logError(type: string, error: ErrorEvent) {
  try {
    await fetch('/api/monitoring/error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, error }),
    })
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}
```

##### src/app/api/monitoring/error/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, error } = await request.json()

    // 本番環境では外部モニタリングサービスに送信
    if (process.env.NODE_ENV === 'production') {
      console.error(`[${type}]`, {
        message: error.message,
        stack: error.stack,
        url: error.url,
        timestamp: new Date(error.timestamp).toISOString(),
        userAgent: error.userAgent,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging failed:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

#### 7. Database Migration for Production

##### scripts/deploy-migrate.js

```javascript
const { execSync } = require('child_process')

async function deployMigration() {
  try {
    console.log('🚀 Starting production migration...')

    // Prisma generate
    console.log('📝 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // Database push (本番環境での安全な更新)
    console.log('🗄️ Pushing database schema...')
    execSync('npx prisma db push', { stdio: 'inherit' })

    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

deployMigration()
```

#### 8. Package.json Scripts Update

##### package.json (additional scripts)

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "deploy:migrate": "node scripts/deploy-migrate.js",
    "deploy:health": "curl -f $VERCEL_URL/api/health",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx}\"",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

### Resources

- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Best Practices](https://supabase.com/docs/guides/platform/production-checklist)
- [Web Security Headers](https://securityheaders.com/)

## Implementation Results

### Work Completed

- [ ] Vercel設定ファイル作成
- [ ] 環境変数設定
- [ ] CI/CDパイプライン構築
- [ ] ヘルスチェックエンドポイント実装
- [ ] セキュリティヘッダー設定
- [ ] パフォーマンス最適化設定
- [ ] エラーモニタリング実装
- [ ] 本番用データベースマイグレーション

### Testing Results

- [ ] デプロイメント動作確認
- [ ] ヘルスチェック確認
- [ ] セキュリティヘッダー確認
- [ ] パフォーマンス測定
- [ ] エラー追跡機能確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #030: ドキュメント整備
2. 本番環境での動作確認
3. 運用監視体制の構築
