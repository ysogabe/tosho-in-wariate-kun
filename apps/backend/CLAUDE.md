# Backend Application Guide

## Overview

NestJS application for 図書委員当番くん (Tosho-in Wariate-kun) - providing robust API services for library committee member scheduling automation.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with role-based access control
- **Real-time**: WebSocket support with Socket.IO
- **Testing**: Jest + @nestjs/testing

## Directory Structure

```
apps/backend/
├── src/
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.controller.spec.ts
│   │   ├── schedule/          # Schedule management
│   │   └── users/             # User management
│   ├── guards/                # Authentication guards
│   ├── dto/                   # Data transfer objects
│   ├── entities/              # Database entities
│   ├── prisma/                # Prisma schema and migrations
│   └── __tests__/             # Integration tests
├── test/                      # Test configuration
│   ├── setup.ts               # Test setup
│   ├── mocks/                 # Mock factories
│   └── e2e/                   # End-to-end tests
├── test-results/              # Test output directory
└── package.json               # Backend dependencies
```

## Development Commands

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start:prod

# Run tests
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
```

## NestJS Architecture

### Module Structure

**Feature-based modular design:**

```typescript
// auth/auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Service Layer Pattern

```typescript
// schedule/schedule.service.ts
@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async generateSchedule(params: GenerateScheduleDto): Promise<Schedule> {
    // Business logic implementation
  }
}
```

### Controller Design

```typescript
// schedule/schedule.controller.ts
@Controller('api/schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('generate')
  @UsePipes(new ValidationPipe())
  async generateSchedule(@Body() dto: GenerateScheduleDto) {
    return this.scheduleService.generateSchedule(dto);
  }
}
```

## Database Integration

### Prisma ORM Setup

**Schema Definition:**
```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(TEACHER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Schedule {
  id          Int      @id @default(autoincrement())
  date        DateTime
  timeSlot    String
  libraryRoom String
  memberId    Int
  member      User     @relation(fields: [memberId], references: [id])
}
```

**Migration Commands:**
```bash
# Create new migration
pnpm prisma migrate dev --name init

# Apply migrations to production
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Reset database (development only)
pnpm prisma migrate reset
```

### Database Service Pattern

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Authentication & Security

### JWT Authentication

```typescript
// auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Guards and Decorators

```typescript
// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
```

## Testing Guidelines (TDD with t_wada Methodology)

### Test Structure

```typescript
// auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // Red-Green-Refactor implementation
    });
  });
});
```

### E2E Testing

```typescript
// test/e2e/auth.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });
});
```

### Test Configuration

```typescript
// jest.config.js
module.exports = {
  displayName: 'backend',
  preset: '@nestjs/testing',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
  ],
  coverageDirectory: '<rootDir>/test-results/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  testResultsProcessor: 'jest-junit',
};
```

## WebSocket Integration

### Gateway Implementation

```typescript
// websocket/schedule.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ScheduleGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('schedule-update')
  handleScheduleUpdate(client: Socket, payload: any): void {
    this.server.emit('schedule-updated', payload);
  }
}
```

## API Documentation

### Swagger Integration

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Tosho-in Wariate-kun API')
  .setDescription('Library committee scheduling API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### DTO Validation

```typescript
// dto/create-schedule.dto.ts
export class CreateScheduleDto {
  @IsDateString()
  @ApiProperty({ description: 'Schedule date in ISO format' })
  date: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Time slot identifier' })
  timeSlot: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Library room identifier' })
  libraryRoom: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Member ID' })
  memberId: number;
}
```

## Error Handling & Logging

### Global Exception Filter

```typescript
// filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
```

## Environment Configuration

```typescript
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
```

## Performance & Monitoring

### Health Checks

```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

## Key Features

1. **Robust Authentication**: JWT-based with role management
2. **Schedule Generation**: Complex rule-based algorithm implementation
3. **Real-time Updates**: WebSocket support for live notifications
4. **Data Integrity**: Comprehensive validation and error handling
5. **Performance Monitoring**: Health checks and logging
6. **API Documentation**: Auto-generated Swagger documentation

## Important Notes

- Single-year operation focus (no cross-year data preservation)
- Comprehensive input validation for all endpoints
- Role-based access control for different user types
- Optimized for Japanese elementary school requirements
- Production-ready error handling and logging