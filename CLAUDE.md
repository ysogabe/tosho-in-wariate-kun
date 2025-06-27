# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

図書委員当番くん (Tosho-in Wariate-kun) is a web application that automates the scheduling of library committee members in elementary schools. It ensures fair rotation among committee members while respecting complex scheduling rules.

## MVP Architecture (Updated 2025-06-26)

**IMPORTANT**: This project follows a **Next.js API Routes** architecture for MVP development, not a separate backend service.

### Architecture Decision

- **ADR 0005**: MVP向けアーキテクチャの決定 - Next.js統合アプローチを採用
- **Single Application**: フロントエンドとバックエンドを統合したNext.jsアプリケーション
- **Simplified Structure**: MVPに適したシンプルなアーキテクチャ

### Project Structure

```
tosho-in-wariate-kun/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # 管理者向けページ
│   │   ├── (public)/          # 表示専用ページ
│   │   └── api/               # API Routes (バックエンドロジック)
│   ├── components/            # UIコンポーネント
│   ├── lib/                   # ユーティリティ・サービス
│   │   ├── services/          # ビジネスロジック
│   │   ├── schedulers/        # スケジューリングエンジン
│   │   └── database/          # データベース接続
│   └── types/                 # 型定義
├── docs/                      # プロジェクトドキュメント
├── public/                    # 静的ファイル
└── frontend/                  # UI mockups and prototypes (READ-ONLY)
```

### Legacy Monorepo Structure (参考)

以下の構造は将来的なスケーリング時の参考として保持：

```
tosho-in-wariate-kun/
├── apps/
│   ├── frontend/          # Next.js application (future expansion)
│   └── backend/           # NestJS application (future expansion)
├── packages/
│   ├── shared/           # Shared types and interfaces
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utilities
```

## ⚠️ Important: Legacy Frontend Directory

**CRITICAL**: The `/frontend` directory at the project root contains UI mockups and prototypes for reference purposes only.

### Usage Guidelines:

- **READ-ONLY**: Do not modify, add, or delete any files in this directory
- **Reference Only**: Use as a UI/UX reference for component design and user flows
- **Sample Data**: Contains example implementations and design patterns
- **Prototype Status**: This is not the production frontend application

### Production Development:

- **Active Development**: Use `/apps/frontend/` for all new frontend development
- **Component Implementation**: Create production components in `/apps/frontend/src/components/`
- **Page Development**: Build actual pages in `/apps/frontend/src/app/`

### Why This Structure:

- **Design Reference**: Preserve original UI mockups for design consistency
- **Component Inspiration**: Reference existing component structures and patterns
- **User Flow Examples**: Study user interaction patterns from prototypes
- **Design System**: Extract design tokens and patterns for production implementation

## Technology Stack (MVP)

### Frontend + Backend: Next.js統合アプリケーション

- **Framework**: Next.js 15 with App Router + API Routes
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn-ui
- **Database**: Supabase PostgreSQL + Prisma ORM
- **Authentication**: Supabase Auth
- **State Management**: React Context API + SWR
- **Testing**: Jest + Testing Library + Playwright
- **Deployment**: Vercel

### Key Libraries

- **UI Components**: shadcn-ui (Radix UI + Tailwind CSS)
- **Database ORM**: Prisma
- **Form Handling**: React Hook Form + Zod validation
- **Data Fetching**: SWR (React Hooks for Data Fetching)
- **Date Handling**: date-fns
- **Scheduling Algorithm**: Custom implementation

### Future Expansion (Post-MVP)

- **Backend**: NestJS with modular architecture
- **Shared Packages**: @tosho/shared, @tosho/ui, @tosho/utils
- **Real-time**: WebSocket support with Socket.IO

## Package Manager: npm (MVP Simplified)

MVPでは標準のnpmを使用してシンプルな開発環境を構築

### Initial Setup

```bash
# Install all dependencies
npm install

# Set up Supabase
npx supabase init

# Generate Prisma client
npx prisma generate

# Set up shadcn-ui
npx shadcn-ui@latest init
```

### Development Workflow

```bash
# Start development server
npm run dev

# Build application
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Future Migration to Monorepo

Post-MVP時のスケーリング時にpnpm + Turborepoへ移行予定：

```bash
# Future monorepo commands
pnpm dev                    # Start all services
pnpm --filter frontend dev  # Start frontend only
pnpm --filter backend dev   # Start backend only
```

## Development Structure (MVP)

### Single Application Development

- **Location**: Root directory (Next.js統合アプリケーション)
- **Frontend**: `src/app/` - Next.js App Router pages
- **Backend**: `src/app/api/` - API Routes
- **Components**: `src/components/` - React components with shadcn-ui
- **Services**: `src/lib/services/` - Business logic
- **Database**: `src/lib/database/` - Prisma client and utilities

### Key Development Areas

1. **UI Development**: Next.js App Router + shadcn-ui components
2. **API Development**: Next.js API Routes + Supabase integration
3. **Database**: Prisma ORM + Supabase PostgreSQL
4. **Authentication**: Supabase Auth integration
5. **Scheduling**: Custom algorithm implementation

## Future Expansion (Post-MVP)

### Application-Specific Guides (参考)

- **Frontend**: `apps/frontend/CLAUDE.md` - Next.js, React, TailwindCSS
- **Backend**: `apps/backend/CLAUDE.md` - NestJS, Prisma, PostgreSQL

### Shared Package Development (参考)

- **@tosho/shared**: Common types, interfaces, constants
- **@tosho/ui**: Reusable UI components built with shadcn-ui
- **@tosho/utils**: Common utility functions and helpers

## Development Guidelines

### TDD Implementation (t_wada Methodology)

- **Red-Green-Refactor Cycle**: Write failing tests first, make them pass, then refactor
- **Test First Philosophy**: No production code without corresponding tests
- **Incremental Development**: Build functionality step by step through tests

### Code Organization

- **Single Responsibility**: Each component, hook, and utility should have one clear purpose
- **Type Safety**: Use TypeScript across all packages with strict configuration
- **Performance**: React optimization, bundle optimization, database query optimization

### Testing Strategy

- **Unit Testing**: Jest + Testing Library for components and utilities
- **Integration Testing**: API and component interaction testing
- **E2E Testing**: Playwright for full user workflow testing

## Tools & Configuration

### Shared Configurations

- **ESLint**: `tools/eslint-config/` - Consistent linting across packages
- **TypeScript**: `tools/typescript-config/` - Shared TypeScript configurations
- **Build Scripts**: `tools/build-scripts/` - Custom build automation

### Package-Specific Settings

- **Frontend**: TailwindCSS, Next.js, shadcn-ui configurations
- **Backend**: NestJS, Prisma, database configurations

## Documentation Structure

### Development Documentation

- **Location**: `docs/development/`
- **Contents**: Setup guides, workflows, testing strategies, best practices

### API Documentation

- **Location**: `docs/api/`
- **Contents**: OpenAPI specs, endpoint documentation, examples

### Deployment Documentation

- **Location**: `docs/deployment/`
- **Contents**: Platform guides, CI/CD, monitoring, security

### Issue Management

- **Location**: `docs/issues/`
- **Contents**: Work instructions and issue templates for junior engineers
- **Purpose**: GitHub Issue creation templates with task definitions and result tracking

## Key Features

1. **Master Data Management**: Classes and library rooms
2. **Committee Member Management**: Registration and editing
3. **Automatic Schedule Generation**: Complex rule-based scheduling
4. **Schedule Display**: Optimized for A4 printing
5. **View-Only Mode**: Safe read-only access
6. **Annual Reset**: Clean slate for new school years

## Important Notes

- **Target Audience**: Japanese elementary schools
- **Language**: All UI text in Japanese
- **Printing**: A4 paper optimization crucial for schedule display
- **Data Lifecycle**: Annual reset, no historical data preservation
- **MVP Focus**: Core scheduling functionality

## Getting Started

1. **Read application-specific guides** in `apps/*/CLAUDE.md`
2. **Review shared package documentation** in `packages/*/README.md`
3. **Check development guides** in `docs/development/`
4. **Follow TDD methodology** with t_wada approach
5. **Use monorepo commands** for development workflow

## Import Examples (MVP)

```typescript
// Importing types
import { User, Schedule } from '@/types'

// Importing UI components (shadcn-ui)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Importing services
import { SchedulerService } from '@/lib/services/scheduler'
import { DatabaseService } from '@/lib/database/client'

// Importing utilities
import { formatJapaneseDate, isValidEmail } from '@/lib/utils'
```

## Future Import Examples (Post-MVP)

```typescript
// Future monorepo imports
import { User, Schedule } from '@tosho/shared'
import { Button, Card } from '@tosho/ui'
import { formatJapaneseDate, isValidEmail } from '@tosho/utils'
```

For detailed implementation guidance, refer to the design documents in the `/docs` directory.
