# Frontend Application Guide

## Overview

Next.js 15 application with App Router for 図書委員当番くん (Tosho-in Wariate-kun) - a web application that automates the scheduling of library committee members in elementary schools.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn-ui
- **State Management**: React Context API
- **Testing**: Jest + Testing Library + Playwright

## Directory Structure

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── _components/        # Page-specific components
│   │   ├── (auth)/            # Authentication routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── management/        # Admin pages
│   │   └── schedule/          # Schedule pages
│   ├── components/            # Frontend-specific components
│   ├── lib/                   # Frontend utilities
│   ├── hooks/                 # Custom React hooks
│   └── __tests__/             # Global test utilities
├── public/                    # Static assets
├── test-results/              # Test output directory
└── package.json               # Frontend dependencies
```

## Development Commands

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

## TailwindCSS & Next.js Configuration Guidelines

### Configuration File Requirements

**Critical**: Always use CommonJS format for configuration files to ensure compatibility:

```javascript
// tailwind.config.js (✅ Correct)
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
}
```

### Package Dependencies

**Required packages for proper TailwindCSS setup:**

```json
{
  "devDependencies": {
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  },
  "dependencies": {
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

**Avoid these common mistakes:**
- ❌ `@tailwindcss/postcss` (does not exist)
- ❌ TailwindCSS v4.x (not stable for production)
- ❌ Mixing ES modules and CommonJS in config files

## shadcn-ui Implementation Guidelines

### Component Addition Workflow

1. **Add shadcn-ui components via CLI**:
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```

2. **Components are automatically placed in `src/components/ui/`**
3. **Customize components directly in `src/components/ui/` if needed**
4. **For major customizations, create new components in appropriate folders**

### Styling Guidelines

1. **Use Tailwind CSS utilities**: Primary styling method
2. **CSS variables for theming**: Leverage shadcn-ui's CSS variable system
3. **Conditional classes with cn()**:
   ```typescript
   import { cn } from "@/lib/utils"
   
   <div className={cn(
     "base-classes",
     isActive && "active-classes",
     variant === "primary" && "primary-classes"
   )} />
   ```

## Frontend Architecture & Best Practices

### Code Organization Principles

1. **Single Responsibility**: Each component, hook, and utility should have one clear purpose
2. **Separation of Concerns**: Separate business logic from UI components
3. **Reusability**: Design components and hooks for potential reuse
4. **Maintainability**: Write self-documenting code with clear naming

### Component Architecture Patterns

```typescript
// ✅ Recommended Component Structure
interface ComponentProps {
  // Props interface first
}

export const Component: React.FC<ComponentProps> = ({
  // Destructured props with defaults
}) => {
  // Hooks at the top
  // Event handlers
  // Derived state/computations
  // Early returns for loading/error states
  // Main render logic
}
```

### Performance Optimization Guidelines

1. **React Performance**:
   - Use `React.memo()` for components with expensive renders
   - Implement `useMemo()` for expensive calculations
   - Apply `useCallback()` for stable function references
   - Consider `React.lazy()` for code splitting

2. **Next.js Optimizations**:
   - Use `next/image` for optimized images
   - Implement proper loading states
   - Leverage Server Components where appropriate
   - Optimize font loading with `next/font`

## Testing Guidelines

### Test File Organization

```
src/
├── __tests__/              # Global test utilities
│   ├── setup.ts            # Test environment setup
│   ├── mocks/              # Shared mocks
│   └── fixtures/           # Test data fixtures
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx # Component unit tests
│   │   └── Button.stories.tsx # Storybook stories
│   └── __tests__/          # Component integration tests
└── lib/
    ├── utils.ts
    └── utils.test.ts       # Utility function tests
```

### TDD Implementation (t_wada Methodology)

Follow Red-Green-Refactor cycle:

1. **Red Phase**: Write a failing test
2. **Green Phase**: Write minimal code to make the test pass
3. **Refactor Phase**: Improve code quality while keeping tests green

### Test Categories

- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user workflow testing with Playwright

## Troubleshooting Common Issues

### Styles Not Applying

1. **Check TailwindCSS directives in globals.css**
2. **Verify content paths in tailwind.config.js**
3. **Restart development server**
4. **Clear Next.js cache**: `pnpm dev -- --clear`

### Build Errors

1. **CommonJS/ES Module conflicts**: Ensure all config files use CommonJS format
2. **TypeScript compilation errors**: Run `npx tsc --noEmit`
3. **Dependency version conflicts**: `rm -rf node_modules && pnpm install`

### Performance Issues

```bash
# Use Turbopack for faster development
pnpm dev -- --turbo

# Analyze bundle size
pnpm build && pnpm analyze
```

## Key Features

1. **Master Data Management**: Classes and library rooms
2. **Committee Member Management**: Registration and editing
3. **Automatic Schedule Generation**: Complex rule-based scheduling
4. **Schedule Display**: Optimized for A4 printing
5. **View-Only Mode**: Safe read-only access
6. **Annual Reset**: Clean slate for new school years

## Important Notes

- The application is designed for Japanese elementary schools
- All UI text is in Japanese
- A4 paper printing optimization is crucial for schedule display
- The system resets all data annually (no historical data preservation)
- MVP focuses on core scheduling functionality