# API Documentation

This directory contains comprehensive API documentation for the Tosho-in Wariate-kun backend services.

## API Overview

The Tosho-in Wariate-kun API provides RESTful endpoints for managing library committee member scheduling in Japanese elementary schools. The API is built with NestJS and follows OpenAPI 3.0 specifications.

## Documentation Structure

### API Specifications

- **[OpenAPI Specification](./openapi.yaml)** - Complete API specification in OpenAPI 3.0 format
- **[Postman Collection](./postman/tosho-api.json)** - Postman collection for API testing
- **[Insomnia Collection](./insomnia/tosho-api.json)** - Insomnia workspace for API testing

### Authentication & Authorization

- **[Authentication Guide](./auth/authentication.md)** - JWT-based authentication
- **[Authorization Guide](./auth/authorization.md)** - Role-based access control
- **[API Keys](./auth/api-keys.md)** - API key management (if applicable)

### Core API Modules

#### User Management

- **[User API](./endpoints/users.md)** - User CRUD operations
- **[Authentication API](./endpoints/auth.md)** - Login, logout, token refresh
- **[Profile API](./endpoints/profile.md)** - User profile management

#### Schedule Management

- **[Schedule API](./endpoints/schedules.md)** - Schedule CRUD operations
- **[Schedule Generation API](./endpoints/schedule-generation.md)** - Automated schedule creation
- **[Schedule Validation API](./endpoints/schedule-validation.md)** - Schedule conflict detection

#### Committee Management

- **[Members API](./endpoints/members.md)** - Committee member management
- **[Classes API](./endpoints/classes.md)** - Class information management
- **[Library Rooms API](./endpoints/library-rooms.md)** - Library room configuration

#### Administrative

- **[Reports API](./endpoints/reports.md)** - Schedule reporting and analytics
- **[System API](./endpoints/system.md)** - Health checks and system information
- **[Bulk Operations API](./endpoints/bulk-operations.md)** - Batch operations

### WebSocket Events

- **[WebSocket API](./websocket/events.md)** - Real-time events and subscriptions
- **[Schedule Updates](./websocket/schedule-updates.md)** - Real-time schedule change notifications
- **[System Notifications](./websocket/notifications.md)** - System-wide notifications

### Data Models

- **[Data Models](./models/README.md)** - Complete data model documentation
- **[Request/Response Schemas](./schemas/README.md)** - API request and response schemas
- **[Error Responses](./schemas/errors.md)** - Standard error response formats

### Examples & Tutorials

- **[Getting Started](./examples/getting-started.md)** - Basic API usage examples
- **[Common Workflows](./examples/workflows.md)** - Common API usage patterns
- **[Integration Examples](./examples/integration.md)** - Frontend integration examples
- **[Testing Examples](./examples/testing.md)** - API testing examples

## API Base Information

### Base URL

```
Production: https://api.tosho-wariate.example.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication

All API endpoints require authentication via JWT tokens, except for:

- `POST /auth/login`
- `POST /auth/register` (if public registration is enabled)
- `GET /system/health`

### Request/Response Format

- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

### Rate Limiting

- **Authenticated requests**: 1000 requests per hour per user
- **Unauthenticated requests**: 100 requests per hour per IP
- **Bulk operations**: 50 requests per hour per user

## Quick Start

### 1. Authentication

```bash
# Login to get access token
curl -X POST https://api.tosho-wariate.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.example.com",
    "password": "your_password"
  }'
```

### 2. Making Authenticated Requests

```bash
# Include JWT token in Authorization header
curl -X GET https://api.tosho-wariate.example.com/v1/schedules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Creating a Schedule

```bash
curl -X POST https://api.tosho-wariate.example.com/v1/schedules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-06-26T08:00:00.000Z",
    "timeSlot": "morning-prep",
    "libraryRoom": "main-library",
    "memberId": 123
  }'
```

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2025-06-26T08:00:00.000Z",
    "timeSlot": "morning-prep",
    "libraryRoom": "main-library",
    "member": {
      "id": 123,
      "name": "田中太郎",
      "class": "3年1組"
    }
  },
  "message": "Schedule created successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "date",
    "code": "INVALID_DATE",
    "message": "Date must be a valid ISO 8601 string"
  },
  "timestamp": "2025-06-26T10:30:00.000Z",
  "path": "/api/v1/schedules"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2025-06-26T08:00:00.000Z",
      "timeSlot": "morning-prep"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate schedule)
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Categories

- **VALIDATION_ERROR**: Input validation failed
- **AUTHENTICATION_ERROR**: Authentication failed
- **AUTHORIZATION_ERROR**: Insufficient permissions
- **NOT_FOUND_ERROR**: Resource not found
- **CONFLICT_ERROR**: Resource conflict
- **RATE_LIMIT_ERROR**: Rate limit exceeded
- **INTERNAL_ERROR**: Server error

## API Versioning

### Version Strategy

- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Current Version**: v1
- **Deprecation Policy**: 6 months notice before version deprecation
- **Migration Guide**: Provided for each major version change

### Backward Compatibility

- **Additive Changes**: New fields, endpoints added without version change
- **Breaking Changes**: Require new API version
- **Deprecation Warnings**: Included in response headers

## Development Tools

### API Documentation Tools

- **Swagger UI**: Available at `/api/docs` in development
- **ReDoc**: Available at `/api/redoc` in development
- **Postman Collection**: Import from `./postman/tosho-api.json`
- **OpenAPI Spec**: Available at `/api/docs-json`

### Testing Tools

- **API Testing**: Use Postman, Insomnia, or curl
- **Load Testing**: Example scripts in `./testing/load-tests/`
- **Integration Testing**: Example tests in `./testing/integration/`

### SDK and Libraries

- **JavaScript/TypeScript**: Auto-generated from OpenAPI spec
- **HTTP Clients**: Examples for popular HTTP libraries
- **Frontend Integration**: React hooks and utilities

## Monitoring and Analytics

### API Metrics

- **Response Times**: Average response time per endpoint
- **Error Rates**: Error rates by endpoint and status code
- **Usage Statistics**: Request volume by endpoint
- **User Analytics**: Usage patterns by user role

### Health Monitoring

- **Health Check Endpoint**: `GET /system/health`
- **Database Health**: Connection and query performance
- **External Dependencies**: Third-party service status
- **Resource Usage**: Memory, CPU, and disk usage

## Security Considerations

### Data Protection

- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Prevention**: Output encoding and CSP headers
- **CSRF Protection**: CSRF tokens for state-changing operations

### Authentication Security

- **JWT Security**: Secure token generation and validation
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Secure session handling
- **Account Lockout**: Protection against brute force attacks

### API Security

- **Rate Limiting**: Protection against abuse
- **Input Size Limits**: Request payload size restrictions
- **CORS Configuration**: Proper cross-origin resource sharing
- **Security Headers**: Comprehensive security header implementation

## Support and Maintenance

### Documentation Maintenance

- **Regular Updates**: Documentation updated with API changes
- **Example Validation**: Code examples tested with each release
- **User Feedback**: Documentation improvements based on developer feedback
- **Version Synchronization**: Documentation versioned with API

### Getting Help

- **API Issues**: Report issues in the project repository
- **Feature Requests**: Submit enhancement requests
- **Integration Support**: Contact development team
- **Security Issues**: Report security vulnerabilities privately

### Change Log

- **API Changes**: Documented in `CHANGELOG.md`
- **Breaking Changes**: Highlighted with migration guides
- **New Features**: Added to documentation with examples
- **Deprecations**: Advance notice with timelines
