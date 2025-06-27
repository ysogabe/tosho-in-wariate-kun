# 図書委員当番くん (Tosho-in Wariate-kun)

A web application that automates the scheduling of library committee members in elementary schools, ensuring fair rotation among committee members while respecting complex scheduling rules.

## 📚 Project Overview

This system replaces manual library committee scheduling with an intelligent automated solution designed specifically for Japanese elementary schools. It handles complex constraints such as grade distribution, time slot balancing, and fair rotation policies.

## 🏗️ Monorepo Architecture

```
tosho-in-wariate-kun/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # NestJS application
├── packages/
│   ├── shared/           # Shared types and interfaces
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utilities
├── tools/                # Development tools and configurations
├── docs/                 # Comprehensive documentation
└── test-results/         # Test output directory
```

## 🚀 Technology Stack

### Frontend

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **TailwindCSS + shadcn-ui** for styling
- **React Context API** for state management
- **Jest + Testing Library + Playwright** for testing

### Backend

- **NestJS** with modular architecture
- **PostgreSQL** with Prisma ORM
- **JWT** authentication with role-based access control
- **WebSocket** support with Socket.IO
- **Jest + @nestjs/testing** for testing

### DevOps & Tools

- **pnpm + Turborepo** for efficient monorepo management
- **TDD methodology** following t_wada approach
- **ESLint + TypeScript** shared configurations
- **GitHub Actions** for CI/CD

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js 20.x** LTS
- **pnpm 8.x** or higher
- **PostgreSQL 14.x** or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tosho-in-wariate-kun.git
cd tosho-in-wariate-kun

# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter backend prisma:generate

# Start development servers
pnpm dev
```

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs

## 📖 Documentation

### Getting Started

- **[Development Setup](./docs/development/README.md)** - Comprehensive development guide
- **[API Documentation](./docs/api/README.md)** - Complete API reference
- **[Deployment Guide](./docs/deployment/README.md)** - Production deployment instructions

### Application Guides

- **[Frontend Guide](./apps/frontend/CLAUDE.md)** - Next.js development guidelines
- **[Backend Guide](./apps/backend/CLAUDE.md)** - NestJS development guidelines

### Package Documentation

- **[@tosho/shared](./packages/shared/README.md)** - Shared types and validation
- **[@tosho/ui](./packages/ui/README.md)** - UI component library
- **[@tosho/utils](./packages/utils/README.md)** - Common utilities

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit          # Unit tests
pnpm test:integration   # Integration tests
pnpm test:e2e          # End-to-end tests

# Generate coverage reports
pnpm test:coverage
```

### TDD Methodology

This project follows **Test-Driven Development (TDD)** using **t_wada's methodology**:

- **Red-Green-Refactor cycle**: Write failing tests first, make them pass, then refactor
- **Test-first philosophy**: No production code without corresponding tests
- **Incremental development**: Build functionality step by step through tests

## 🏗️ Development Commands

```bash
# Development
pnpm dev                    # Start all development servers
pnpm --filter frontend dev  # Start frontend only
pnpm --filter backend dev   # Start backend only

# Building
pnpm build                  # Build all packages
pnpm --filter frontend build # Build frontend only
pnpm --filter backend build  # Build backend only

# Code Quality
pnpm lint                   # Run ESLint across all packages
pnpm type-check            # Run TypeScript checks
pnpm format                # Format code with Prettier
```

## 🎯 Key Features

### Core Functionality

- **Automated Schedule Generation**: Complex rule-based scheduling algorithm
- **Master Data Management**: Classes, library rooms, and member management
- **Conflict Detection**: Intelligent conflict resolution and prevention
- **Fair Rotation**: Ensures equitable distribution of responsibilities

### User Experience

- **Japanese UI**: Designed specifically for Japanese elementary schools
- **Print Optimization**: A4 paper-optimized schedule layouts
- **Responsive Design**: Works on tablets and desktop computers
- **Real-time Updates**: Live synchronization across user sessions

### Administrative Features

- **Role-based Access**: Different permissions for teachers, librarians, and administrators
- **Annual Reset**: Clean slate functionality for new school years
- **View-only Mode**: Safe read-only access for schedule viewing
- **Audit Trail**: Comprehensive logging of all changes

## 🔐 Security

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **CORS Protection**: Proper cross-origin resource sharing configuration
- **Rate Limiting**: Protection against abuse and denial-of-service attacks

## 🚀 Deployment

### Supported Platforms

- **Vercel** (Frontend)
- **Railway** (Full-stack)
- **DigitalOcean** (VPS)
- **AWS** / **Google Cloud** (Enterprise)

### Quick Deploy

```bash
# Deploy to Vercel (Frontend)
cd apps/frontend
npx vercel --prod

# Deploy to Railway (Full-stack)
npx @railway/cli up
```

See [Deployment Guide](./docs/deployment/README.md) for detailed instructions.

## 📊 Project Status

### Completed ✅

- ✅ Monorepo architecture setup
- ✅ Frontend foundation (Next.js + shadcn-ui)
- ✅ Backend foundation (NestJS + Prisma)
- ✅ Shared package system
- ✅ TDD testing framework
- ✅ Development tooling

### In Progress 🔄

- 🔄 Core scheduling algorithm implementation
- 🔄 Database schema and migrations
- 🔄 API endpoint development
- 🔄 Frontend component implementation

### Planned 📋

- 📋 Authentication system integration
- 📋 WebSocket real-time features
- 📋 Production deployment
- 📋 Mobile responsive optimization

## 🤝 Contributing

### Development Workflow

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Follow TDD methodology** for all new features
4. **Write comprehensive tests** before implementation
5. **Submit a pull request** with detailed description

### Code Standards

- **TypeScript**: Strict mode enabled across all packages
- **Testing**: Minimum 90% code coverage required
- **Linting**: ESLint rules enforced with pre-commit hooks
- **Documentation**: All public APIs must be documented

### Getting Help

- **Issues**: Report bugs and feature requests in GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the comprehensive docs in `/docs`

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Tosho-in Wariate-kun Development Team**

- Focus: Educational technology for Japanese elementary schools
- Mission: Simplifying administrative tasks for educators

---

**🏫 Built for Japanese Elementary Schools with ❤️**
