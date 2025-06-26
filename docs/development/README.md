# Development Guide

This directory contains comprehensive development documentation for the Tosho-in Wariate-kun project.

## Documentation Structure

### Setup & Getting Started
- **[Quick Start Guide](./quick-start.md)** - Fast setup for new developers
- **[Environment Setup](./environment-setup.md)** - Detailed development environment configuration
- **[Monorepo Guide](./monorepo-guide.md)** - Working with the monorepo structure

### Development Workflows
- **[TDD Guidelines](./tdd-guidelines.md)** - Test-Driven Development with t_wada methodology
- **[Git Workflow](./git-workflow.md)** - Branching strategy and commit conventions
- **[Code Review Process](./code-review.md)** - Pull request and review guidelines

### Frontend Development
- **[Next.js Development](./frontend/nextjs-guide.md)** - Next.js specific guidelines
- **[Component Development](./frontend/component-guide.md)** - React component best practices
- **[Styling Guide](./frontend/styling-guide.md)** - TailwindCSS and shadcn-ui usage
- **[Testing Frontend](./frontend/testing-guide.md)** - Frontend testing strategies

### Backend Development
- **[NestJS Development](./backend/nestjs-guide.md)** - NestJS specific guidelines
- **[Database Guide](./backend/database-guide.md)** - Prisma and PostgreSQL usage
- **[API Development](./backend/api-guide.md)** - RESTful API design and implementation
- **[Testing Backend](./backend/testing-guide.md)** - Backend testing strategies

### Shared Packages
- **[Package Development](./packages/package-guide.md)** - Creating and maintaining shared packages
- **[Type Safety](./packages/type-safety.md)** - TypeScript usage across packages
- **[Utilities Guide](./packages/utilities-guide.md)** - Common utility development

### Tools & Configuration
- **[ESLint Configuration](./tools/eslint-guide.md)** - Linting setup and rules
- **[TypeScript Configuration](./tools/typescript-guide.md)** - TypeScript configurations
- **[Build Process](./tools/build-guide.md)** - Turborepo and build optimization

### Testing & Quality
- **[Testing Strategy](./testing/testing-strategy.md)** - Overall testing approach
- **[Unit Testing](./testing/unit-testing.md)** - Unit test guidelines and examples
- **[Integration Testing](./testing/integration-testing.md)** - Integration test strategies
- **[E2E Testing](./testing/e2e-testing.md)** - End-to-end testing with Playwright
- **[Test Management](./testing/test-management.md)** - Test result management and reporting

### Performance & Optimization
- **[Frontend Performance](./performance/frontend-optimization.md)** - Next.js and React optimization
- **[Backend Performance](./performance/backend-optimization.md)** - NestJS and database optimization
- **[Bundle Optimization](./performance/bundle-optimization.md)** - Build size and loading optimization

### Troubleshooting
- **[Common Issues](./troubleshooting/common-issues.md)** - Frequently encountered problems
- **[Debug Guide](./troubleshooting/debugging.md)** - Debugging techniques and tools
- **[FAQ](./troubleshooting/faq.md)** - Frequently asked questions

### Issue Management
- **[Issue Guidelines](../issues/CLAUDE.md)** - Work instructions for junior engineers
- **[Task Templates](../issues/)** - Standardized issue templates for GitHub

### Best Practices
- **[Code Standards](./best-practices/code-standards.md)** - Coding conventions and standards
- **[Security Guidelines](./best-practices/security.md)** - Security best practices
- **[Accessibility Guide](./best-practices/accessibility.md)** - Accessibility implementation
- **[Performance Guidelines](./best-practices/performance.md)** - Performance best practices

## Quick Navigation

### For New Developers
1. Start with [Quick Start Guide](./quick-start.md)
2. Set up your environment using [Environment Setup](./environment-setup.md)
3. Read [Monorepo Guide](./monorepo-guide.md) to understand the project structure
4. Review [TDD Guidelines](./tdd-guidelines.md) for development methodology

### For Frontend Developers
1. [Next.js Development](./frontend/nextjs-guide.md) - Framework-specific guidelines
2. [Component Development](./frontend/component-guide.md) - React best practices
3. [Styling Guide](./frontend/styling-guide.md) - UI implementation
4. [Testing Frontend](./frontend/testing-guide.md) - Frontend testing

### For Backend Developers
1. [NestJS Development](./backend/nestjs-guide.md) - Framework guidelines
2. [Database Guide](./backend/database-guide.md) - Data layer implementation
3. [API Development](./backend/api-guide.md) - API design and development
4. [Testing Backend](./backend/testing-guide.md) - Backend testing

### For Package Maintainers
1. [Package Development](./packages/package-guide.md) - Shared package creation
2. [Type Safety](./packages/type-safety.md) - TypeScript across packages
3. [Utilities Guide](./packages/utilities-guide.md) - Utility function development

## Contributing to Documentation

### Adding New Documentation
1. **Create markdown files** in appropriate subdirectories
2. **Follow naming conventions**: Use kebab-case for file names
3. **Update this README** with links to new documentation
4. **Include code examples** where applicable
5. **Keep documentation current** with code changes

### Documentation Standards
- **Clear headings**: Use descriptive section headings
- **Code examples**: Include practical, working examples
- **Links**: Cross-reference related documentation
- **Formatting**: Use consistent markdown formatting
- **Language**: Write in clear, concise English

### Maintenance
- **Regular reviews**: Update documentation with code changes
- **Validation**: Ensure code examples work with current codebase
- **Feedback**: Incorporate developer feedback and suggestions
- **Versioning**: Track documentation changes with code versions

## Development Resources

### External Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn-ui Documentation](https://ui.shadcn.com/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/motivation)

### Community Resources
- [t_wada TDD Resources](https://github.com/testdouble/contributing-tests/wiki)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Tools and Utilities
- [VS Code Extensions](./tools/vscode-setup.md) - Recommended development extensions
- [Git Hooks](./tools/git-hooks.md) - Pre-commit and pre-push hooks
- [Development Scripts](./tools/dev-scripts.md) - Useful development automation

## Support and Communication

### Getting Help
- **Documentation Issues**: Create issues in the repository
- **Development Questions**: Use team communication channels
- **Code Review**: Follow the code review process
- **Bug Reports**: Use the issue template for bug reports

### Team Communication
- **Daily Updates**: Share progress and blockers
- **Code Reviews**: Provide constructive feedback
- **Documentation**: Keep documentation updated
- **Knowledge Sharing**: Share learnings and best practices