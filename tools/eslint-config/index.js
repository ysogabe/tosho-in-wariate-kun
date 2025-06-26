/**
 * Shared ESLint configuration for Tosho-in Wariate-kun monorepo
 * 
 * This configuration provides consistent linting rules across all packages
 * including frontend (Next.js/React), backend (NestJS), and shared packages.
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in config files

    // Import/Export rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'off', // Handled by TypeScript
    'import/no-duplicates': 'error',

    // General code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    
    // Code style rules
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'indent': 'off', // Handled by Prettier
    'linebreak-style': 'off', // Handled by Prettier
  },
  overrides: [
    // Frontend-specific rules (React/Next.js)
    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      env: {
        browser: true,
        es2022: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'next/core-web-vitals',
        'plugin:react-hooks/recommended',
      ],
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'jsx-a11y',
      ],
      rules: {
        // React specific rules
        'react/react-in-jsx-scope': 'off', // Not needed in Next.js
        'react/prop-types': 'off', // Using TypeScript
        'react/no-unescaped-entities': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        
        // JSX accessibility rules
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
        
        // Next.js specific
        '@next/next/no-img-element': 'error',
        '@next/next/no-html-link-for-pages': 'error',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    
    // Backend-specific rules (NestJS)
    {
      files: ['apps/backend/**/*.ts'],
      env: {
        node: true,
        jest: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
      ],
      rules: {
        // NestJS specific rules
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/decorator-metadata': 'off',
        
        // Allow console in backend
        'no-console': 'off',
      },
    },
    
    // Test files
    {
      files: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**/*.{ts,tsx}',
      ],
      env: {
        jest: true,
        node: true,
      },
      extends: [
        'plugin:jest/recommended',
        'plugin:testing-library/react',
      ],
      plugins: ['jest', 'testing-library'],
      rules: {
        // Test-specific rules
        'jest/expect-expect': 'error',
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        
        // Testing Library rules
        'testing-library/await-async-query': 'error',
        'testing-library/no-await-sync-query': 'error',
        'testing-library/no-debug': 'warn',
        'testing-library/no-dom-import': 'error',
        
        // Allow any in tests
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    
    // Configuration files
    {
      files: [
        '*.config.{js,ts}',
        '*.setup.{js,ts}',
        'jest.config.{js,ts}',
        'next.config.{js,ts}',
        'tailwind.config.{js,ts}',
        'postcss.config.{js,ts}',
      ],
      env: {
        node: true,
      },
      rules: {
        // Allow require in config files
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    
    // Storybook files
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        // Allow default exports in stories
        'import/no-default-export': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    'test-results/',
    '*.d.ts',
  ],
}