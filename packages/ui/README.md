# @tosho/ui

Shared UI component library for the Tosho-in Wariate-kun monorepo, built with shadcn-ui, TailwindCSS, and React.

## Overview

This package provides a consistent design system and reusable UI components across all frontend applications in the monorepo.

## Directory Structure

```
packages/ui/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── button/         # Button component variants
│   │   ├── card/           # Card layout components
│   │   ├── form/           # Form input components
│   │   ├── navigation/     # Navigation components
│   │   ├── layout/         # Layout components
│   │   └── index.ts        # Component exports
│   ├── styles/            # Shared styles and themes
│   │   ├── globals.css     # Global CSS variables
│   │   ├── components.css  # Component-specific styles
│   │   └── themes/         # Theme definitions
│   │       ├── default.css # Default theme
│   │       └── school.css  # School-friendly theme
│   ├── utils/             # UI-related utilities
│   │   ├── cn.ts          # Class name merging utility
│   │   └── variants.ts    # Component variant configurations
│   └── index.ts           # Main package exports
├── test/
│   ├── components/        # Component tests
│   └── utils.test.ts      # Utility tests
└── package.json
```

## Installation & Usage

### Installing in Other Packages

```json
{
  "dependencies": {
    "@tosho/ui": "workspace:*",
    "react": "^19.0.0",
    "tailwindcss": "^3.3.6"
  }
}
```

### Importing Components

```typescript
// Import individual components
import { Button, Card, Input } from '@tosho/ui'

// Import utilities
import { cn } from '@tosho/ui/utils'
```

### TailwindCSS Integration

```javascript
// tailwind.config.js (in consuming apps)
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tosho/ui/src/**/*.{js,ts,jsx,tsx}', // Include UI package
  ],
  presets: [require('@tosho/ui/tailwind.preset')], // Use shared preset
  // ... rest of config
}
```

## Components

### Button Component

```typescript
// Usage
import { Button } from '@tosho/ui'

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

// Available variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

// Props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

### Card Components

```typescript
// Usage
import { Card, CardHeader, CardContent, CardFooter } from '@tosho/ui'

<Card>
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form Components

```typescript
// Usage
import { Input, Label, FormField, FormMessage } from '@tosho/ui'

<FormField>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter your email"
    error={!!errors.email}
  />
  {errors.email && <FormMessage error>{errors.email}</FormMessage>}
</FormField>
```

### Navigation Components

```typescript
// Usage
import { NavBar, NavItem, Breadcrumbs } from '@tosho/ui'

<NavBar>
  <NavItem href="/dashboard" active>Dashboard</NavItem>
  <NavItem href="/schedule">Schedule</NavItem>
  <NavItem href="/management">Management</NavItem>
</NavBar>

<Breadcrumbs 
  items={[
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Schedule', href: '/schedule', current: true }
  ]} 
/>
```

## Theming System

### CSS Variables

```css
/* styles/themes/default.css */
:root {
  /* Color palette */
  --color-primary: 180 70% 75%;        /* Mint green */
  --color-secondary: 350 80% 85%;      /* Light pink */
  --color-accent: 50 100% 50%;         /* Bright yellow */
  --color-background: 50 100% 97%;     /* Light yellow background */
  
  /* Typography */
  --font-family-base: 'Comic Sans MS', 'Noto Sans JP', sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.6;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}
```

### Theme Configuration

```typescript
// utils/variants.ts
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)
```

## Development

### Building the Package

```bash
# Build UI components
pnpm build

# Watch mode for development
pnpm dev

# Build styles
pnpm build:styles
```

### Testing Components

```bash
# Run component tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run visual regression tests
pnpm test:visual
```

### Storybook Development

```bash
# Start Storybook server
pnpm storybook

# Build Storybook for deployment
pnpm build-storybook
```

## Component Development Guidelines

### Component Structure

```typescript
// components/button/Button.tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const buttonVariants = cva(/* variant definitions */)

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
          VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### Testing Components

```typescript
// test/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../src/components/button/Button'

describe('Button', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Test Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('shows loading state correctly', () => {
    render(<Button isLoading>Loading Button</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })
})
```

### Storybook Stories

```typescript
// components/button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading...',
    isLoading: true,
  },
}
```

## Design System Guidelines

### Child-Friendly Design Principles

1. **Color Palette**: Warm, inviting colors suitable for elementary school environment
2. **Typography**: Friendly, readable fonts (Comic Sans MS for child appeal)
3. **Spacing**: Generous spacing for easy interaction
4. **Feedback**: Clear visual feedback for interactions
5. **Accessibility**: High contrast ratios and keyboard navigation

### Component Naming

- Use descriptive, self-documenting names
- Follow consistent naming patterns
- Include size and variant descriptors
- Maintain compatibility with HTML semantic elements

### Accessibility Standards

```typescript
// Example: Accessible button component
<Button
  variant="primary"
  aria-label="Save schedule changes"
  aria-describedby="save-help-text"
>
  Save
</Button>
```

## Integration with Apps

### Frontend Application Integration

```typescript
// apps/frontend/src/components/ScheduleCard.tsx
import { Card, CardHeader, CardContent, Button } from '@tosho/ui'
import { Schedule } from '@tosho/shared'

interface ScheduleCardProps {
  schedule: Schedule
  onEdit: (id: number) => void
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ 
  schedule, 
  onEdit 
}) => {
  return (
    <Card>
      <CardHeader>
        <h3>{schedule.timeSlot}</h3>
        <p>{schedule.libraryRoom}</p>
      </CardHeader>
      <CardContent>
        <p>担当: {schedule.member.name}</p>
        <p>クラス: {schedule.member.class}</p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => onEdit(schedule.id)}
        >
          編集
        </Button>
      </CardFooter>
    </Card>
  )
}
```

## Contributing

### Adding New Components

1. **Create component directory** under `src/components/`
2. **Implement component** following established patterns
3. **Add variant configurations** using class-variance-authority
4. **Write comprehensive tests** including accessibility tests
5. **Create Storybook stories** with all variants
6. **Update package exports** in `index.ts`
7. **Document usage examples** in this README

### Updating Existing Components

1. **Maintain backward compatibility** when possible
2. **Update tests** to cover new functionality
3. **Update Storybook stories** with new variants
4. **Version appropriately** following semantic versioning
5. **Coordinate with consuming applications** for breaking changes

### Design System Evolution

- Collaborate with design team on new components
- Ensure consistency across all components
- Gather feedback from development teams
- Maintain comprehensive documentation
- Regular design system audits and improvements