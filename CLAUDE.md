# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

図書委員当番くん (Tosho-in Wariate-kun) is a web application that automates the scheduling of library committee members in elementary schools. It ensures fair rotation among committee members while respecting complex scheduling rules.

## Monorepo Structure

This project is organized as a monorepo to maximize code sharing, maintain consistency, and streamline development workflows across frontend and backend applications.

```
tosho-in-wariate-kun/
├── apps/
│   ├── frontend/          # Next.js application (production development)
│   └── backend/           # NestJS application
├── packages/
│   ├── shared/           # Shared types and interfaces
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utilities
├── tools/
│   ├── eslint-config/    # Shared ESLint configuration
│   ├── typescript-config/ # Shared TypeScript configuration
│   └── build-scripts/    # Custom build scripts
├── docs/                 # Project documentation
│   ├── api/              # API documentation
│   ├── development/      # Development guides
│   ├── deployment/       # Deployment guides
│   └── issues/           # Issue templates and work instructions
├── test-results/         # Test output directory
└── frontend/             # UI mockups and prototypes (READ-ONLY)
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

## Technology Stack

### Backend: Node.js/TypeScript + NestJS
- **Framework**: NestJS with modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **Real-time**: WebSocket support with Socket.IO
- **Testing**: Jest + @nestjs/testing

### Frontend: Next.js + TypeScript
- **Framework**: Next.js 15 with App Router
- **Styling**: TailwindCSS + shadcn-ui
- **State Management**: React Context API
- **Testing**: Jest + Testing Library + Playwright

### Shared Packages
- **@tosho/shared**: Common types, constants, validation schemas
- **@tosho/ui**: Reusable UI components with shadcn-ui
- **@tosho/utils**: Common utility functions and helpers

## Package Manager: pnpm + Turborepo

- **Efficient Dependencies**: pnpm's symlink approach reduces disk usage
- **Build Caching**: Turborepo provides intelligent build caching
- **Task Orchestration**: Parallel execution across packages

## Common Development Commands

### Initial Setup
```bash
# Install pnpm globally
npm install -g pnpm

# Install all dependencies
pnpm install

# Generate Prisma client
pnpm --filter backend prisma:generate
```

### Development Workflow
```bash
# Start all development servers
pnpm dev

# Start specific application
pnpm --filter frontend dev
pnpm --filter backend dev

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## Application-Specific Guides

### Frontend Development
- **Location**: `apps/frontend/CLAUDE.md`
- **Topics**: Next.js, React, TailwindCSS, shadcn-ui, testing
- **Key Features**: Component development, styling, performance optimization

### Backend Development
- **Location**: `apps/backend/CLAUDE.md`
- **Topics**: NestJS, Prisma, PostgreSQL, authentication, WebSocket
- **Key Features**: API development, database management, real-time features

## Shared Package Development

### @tosho/shared
- **Location**: `packages/shared/README.md`
- **Purpose**: Common types, interfaces, constants, validation schemas
- **Usage**: Imported by both frontend and backend for type safety

### @tosho/ui
- **Location**: `packages/ui/README.md`
- **Purpose**: Reusable UI components built with shadcn-ui
- **Usage**: Frontend applications import components for consistent design

### @tosho/utils
- **Location**: `packages/utils/README.md`
- **Purpose**: Common utility functions and helpers
- **Usage**: Shared business logic and utility functions

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

## Package Import Examples

```typescript
// Importing shared types
import { User, Schedule } from '@tosho/shared'

// Importing UI components
import { Button, Card } from '@tosho/ui'

// Importing utilities
import { formatJapaneseDate, isValidEmail } from '@tosho/utils'
```

For detailed implementation guidance, refer to the specific documentation in each package and application directory.