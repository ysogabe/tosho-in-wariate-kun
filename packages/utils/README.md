# @tosho/utils

Shared utility functions and helpers for the Tosho-in Wariate-kun monorepo.

## Overview

This package provides common utility functions, helper methods, and shared business logic that can be used across frontend, backend, and other packages in the monorepo.

## Directory Structure

```
packages/utils/
├── src/
│   ├── date/               # Date manipulation utilities
│   │   ├── format.ts       # Date formatting functions
│   │   ├── validation.ts   # Date validation utilities
│   │   ├── schedule.ts     # Schedule-specific date logic
│   │   └── index.ts        # Date utility exports
│   ├── validation/         # Common validation functions
│   │   ├── email.ts        # Email validation
│   │   ├── phone.ts        # Phone number validation
│   │   ├── japanese.ts     # Japanese text validation
│   │   └── index.ts        # Validation exports
│   ├── helpers/            # General helper functions
│   │   ├── array.ts        # Array manipulation utilities
│   │   ├── object.ts       # Object transformation utilities
│   │   ├── string.ts       # String processing utilities
│   │   └── index.ts        # Helper exports
│   ├── constants/          # Shared constants
│   │   ├── japanese.ts     # Japanese locale constants
│   │   ├── school.ts       # School-specific constants
│   │   └── index.ts        # Constant exports
│   └── index.ts           # Main package exports
├── test/
│   ├── date/              # Date utility tests
│   ├── validation/        # Validation tests
│   ├── helpers/           # Helper function tests
│   └── performance/       # Performance tests
└── package.json
```

## Installation & Usage

### Installing in Other Packages

```json
{
  "dependencies": {
    "@tosho/utils": "workspace:*"
  }
}
```

### Importing Utilities

```typescript
// Import specific utilities
import { formatJapaneseDate, isValidEmail, groupBy } from '@tosho/utils'

// Import by category
import { date, validation, helpers } from '@tosho/utils'
```

## Date Utilities

### Date Formatting

```typescript
// Date formatting for Japanese context
import { formatJapaneseDate, formatTimeSlot } from '@tosho/utils'

const date = new Date('2025-06-26')
formatJapaneseDate(date) // "令和7年6月26日"
formatJapaneseDate(date, 'short') // "R7.6.26"
formatJapaneseDate(date, 'weekday') // "令和7年6月26日 (木)"

// Time slot formatting
formatTimeSlot('08:00-08:15') // "朝の準備 (8:00-8:15)"
formatTimeSlot('12:25-13:10') // "昼休み (12:25-13:10)"
```

### Date Validation

```typescript
import { isSchoolDay, isWithinSchoolYear, getSchoolWeek } from '@tosho/utils'

// Check if date is a school day (excludes weekends and holidays)
isSchoolDay(new Date('2025-06-26')) // true (Thursday)
isSchoolDay(new Date('2025-06-28')) // false (Saturday)

// Check if date is within current school year
isWithinSchoolYear(new Date('2025-06-26')) // true
isWithinSchoolYear(new Date('2025-03-31')) // false (before new school year)

// Get school week number
getSchoolWeek(new Date('2025-06-26')) // 12 (12th week of school year)
```

### Schedule Date Logic

```typescript
import { 
  getNextSchoolDays, 
  calculateSchedulePeriod,
  isScheduleConflict 
} from '@tosho/utils'

// Get next N school days
const nextWeek = getNextSchoolDays(5) // Next 5 school days
// Returns: [Date, Date, Date, Date, Date] (excluding weekends)

// Calculate schedule period
const period = calculateSchedulePeriod(
  new Date('2025-06-01'), 
  new Date('2025-06-30')
)
// Returns: { startDate: Date, endDate: Date, schoolDays: 20, totalWeeks: 4 }

// Check for schedule conflicts
const conflict = isScheduleConflict(
  { date: '2025-06-26', timeSlot: '08:00-08:15', memberId: 1 },
  existingSchedules
)
```

## Validation Utilities

### Email Validation

```typescript
import { isValidEmail, normalizeEmail } from '@tosho/utils'

isValidEmail('test@example.com') // true
isValidEmail('invalid-email') // false

// Normalize email address
normalizeEmail('  Test@EXAMPLE.COM  ') // "test@example.com"
```

### Japanese Text Validation

```typescript
import { 
  isValidJapaneseName,
  isValidKanji,
  isValidHiragana,
  normalizeJapaneseText 
} from '@tosho/utils'

// Validate Japanese names
isValidJapaneseName('田中太郎') // true
isValidJapaneseName('John Smith') // false

// Validate character types
isValidKanji('田中') // true
isValidHiragana('たなか') // true

// Normalize Japanese text
normalizeJapaneseText('　田中　太郎　') // "田中太郎" (trim full-width spaces)
```

### Phone Number Validation

```typescript
import { isValidJapanesePhone, formatPhoneNumber } from '@tosho/utils'

// Validate Japanese phone numbers
isValidJapanesePhone('090-1234-5678') // true
isValidJapanesePhone('03-1234-5678') // true
isValidJapanesePhone('1234567890') // false

// Format phone numbers
formatPhoneNumber('09012345678') // "090-1234-5678"
```

## Helper Functions

### Array Utilities

```typescript
import { groupBy, chunk, unique, shuffle } from '@tosho/utils'

// Group array by property
const students = [
  { name: '田中', grade: '3', class: '1' },
  { name: '佐藤', grade: '3', class: '2' },
  { name: '鈴木', grade: '4', class: '1' },
]

const byGrade = groupBy(students, 'grade')
// { '3': [田中, 佐藤], '4': [鈴木] }

// Split array into chunks
chunk([1, 2, 3, 4, 5, 6], 2) // [[1, 2], [3, 4], [5, 6]]

// Get unique values
unique([1, 2, 2, 3, 3, 3]) // [1, 2, 3]

// Shuffle array randomly
shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4] (random order)
```

### Object Utilities

```typescript
import { omit, pick, deepMerge, isEmpty } from '@tosho/utils'

const user = { id: 1, name: '田中', email: 'tanaka@example.com', password: 'secret' }

// Omit properties
omit(user, ['password']) // { id: 1, name: '田中', email: 'tanaka@example.com' }

// Pick specific properties
pick(user, ['id', 'name']) // { id: 1, name: '田中' }

// Deep merge objects
deepMerge(
  { user: { name: '田中', age: 10 } },
  { user: { grade: '3' } }
) // { user: { name: '田中', age: 10, grade: '3' } }

// Check if object is empty
isEmpty({}) // true
isEmpty({ name: '田中' }) // false
```

### String Utilities

```typescript
import { 
  capitalize, 
  kebabCase, 
  camelCase,
  truncate,
  slugify 
} from '@tosho/utils'

// Capitalize first letter
capitalize('hello world') // "Hello world"

// Convert to kebab-case
kebabCase('Hello World') // "hello-world"

// Convert to camelCase
camelCase('hello-world') // "helloWorld"

// Truncate with ellipsis
truncate('This is a very long text', 10) // "This is a..."

// Create URL-friendly slug
slugify('図書委員当番くん') // "tosho-iin-toban-kun"
```

## Constants

### Japanese Locale Constants

```typescript
import { JAPANESE_DAYS, JAPANESE_MONTHS, ERA_INFO } from '@tosho/utils'

JAPANESE_DAYS
// ['日', '月', '火', '水', '木', '金', '土']

JAPANESE_MONTHS  
// ['1月', '2月', '3月', ..., '12月']

ERA_INFO.REIWA
// { name: '令和', startYear: 2019, symbol: 'R' }
```

### School-Specific Constants

```typescript
import { 
  SCHOOL_TERMS, 
  TIME_SLOTS_JP, 
  GRADE_LEVELS,
  LIBRARY_AREAS 
} from '@tosho/utils'

SCHOOL_TERMS
// { FIRST: '1学期', SECOND: '2学期', THIRD: '3学期' }

TIME_SLOTS_JP
// { 
//   MORNING_PREP: '朝の準備',
//   BREAK_1: '1時間目休み',
//   LUNCH: '昼休み',
//   BREAK_2: '2時間目休み',
//   AFTER_SCHOOL: '放課後'
// }

GRADE_LEVELS
// ['1年', '2年', '3年', '4年', '5年', '6年']
```

## Performance Utilities

### Memoization and Caching

```typescript
import { memoize, debounce, throttle } from '@tosho/utils'

// Memoize expensive calculations
const expensiveCalculation = memoize((input: number) => {
  // Complex calculation
  return input * input * input
})

// Debounce function calls
const debouncedSave = debounce((data: any) => {
  // Save to server
}, 500)

// Throttle function calls
const throttledUpdate = throttle((data: any) => {
  // Update UI
}, 100)
```

## Development

### Building the Package

```bash
# Build utilities
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run performance tests
pnpm test:performance

# Generate coverage report
pnpm test:coverage
```

### TDD Development (t_wada Methodology)

```typescript
// Example: Date utility development with TDD
describe('formatJapaneseDate', () => {
  // Red: Write failing test first
  test('should format basic date in Japanese', () => {
    const date = new Date('2025-06-26')
    expect(formatJapaneseDate(date)).toBe('令和7年6月26日')
  })

  // Green: Implement minimal functionality
  // Refactor: Improve implementation
})
```

## Best Practices

### Function Design

- **Pure functions**: Avoid side effects when possible
- **Single responsibility**: Each function should do one thing well
- **Type safety**: Use TypeScript for all functions
- **Error handling**: Handle edge cases gracefully

### Performance Considerations

- **Lazy evaluation**: Use lazy loading for expensive operations
- **Memoization**: Cache results of expensive calculations
- **Tree shaking**: Export functions individually for better tree shaking

### Documentation

- **JSDoc comments**: Document all public functions
- **Usage examples**: Provide clear examples in documentation
- **Type definitions**: Comprehensive TypeScript definitions

## Integration Examples

### Frontend Usage

```typescript
// React component using date utilities
import { formatJapaneseDate, isSchoolDay } from '@tosho/utils'

const ScheduleDate: React.FC<{ date: Date }> = ({ date }) => {
  const isAvailable = isSchoolDay(date)
  
  return (
    <div className={`date ${isAvailable ? 'available' : 'unavailable'}`}>
      {formatJapaneseDate(date, 'weekday')}
    </div>
  )
}
```

### Backend Usage

```typescript
// NestJS service using validation utilities
import { isValidEmail, normalizeJapaneseText } from '@tosho/utils'

@Injectable()
export class UserService {
  async createUser(userData: CreateUserDto) {
    if (!isValidEmail(userData.email)) {
      throw new BadRequestException('Invalid email format')
    }
    
    const normalizedName = normalizeJapaneseText(userData.name)
    
    return this.prisma.user.create({
      data: {
        ...userData,
        name: normalizedName,
      }
    })
  }
}
```

## Contributing

### Adding New Utilities

1. **Identify common patterns** across applications
2. **Write tests first** following TDD methodology
3. **Implement pure functions** when possible
4. **Add comprehensive documentation**
5. **Consider performance implications**
6. **Update package exports**

### Function Categories

- **date/**: Date and time related utilities
- **validation/**: Input validation and sanitization
- **helpers/**: General utility functions
- **constants/**: Shared constant definitions

### Testing Requirements

- **Unit tests**: Test individual functions
- **Integration tests**: Test function combinations
- **Performance tests**: Ensure acceptable performance
- **Edge case testing**: Handle boundary conditions