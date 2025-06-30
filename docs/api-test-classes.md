# Classes API Testing Guide

This document provides manual testing instructions for the Classes API endpoints implemented in ISSUE-013.

## Prerequisites

1. Start the development server: `npm run dev`
2. Ensure database is seeded with test data: `npm run db:seed:dev`
3. Use a REST client (Postman, Thunder Client, curl, etc.)

## Authentication

All endpoints require authentication. For testing, ensure you have valid authentication cookies set.

## API Endpoints

### 1. GET /api/classes - List Classes

**URL**: `http://localhost:3000/api/classes`  
**Method**: `GET`  
**Auth**: Required (any authenticated user)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by class name
- `year` (optional): Filter by year (5 or 6)

**Example Requests**:
```bash
# Get all classes
GET /api/classes

# Get page 1 with 10 items
GET /api/classes?page=1&limit=10

# Search for classes containing "A"
GET /api/classes?search=A

# Get only 5th grade classes
GET /api/classes?year=5
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "class_id",
        "name": "A",
        "year": 5,
        "studentCount": 4,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 6,
      "totalPages": 1
    }
  }
}
```

### 2. POST /api/classes - Create Class

**URL**: `http://localhost:3000/api/classes`  
**Method**: `POST`  
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "D",
  "year": 5
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/classes \
  -H "Content-Type: application/json" \
  -d '{"name": "D", "year": 5}'
```

**Expected Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "class": {
      "id": "new_class_id",
      "name": "D",
      "year": 5,
      "studentCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "5年D組を作成しました"
  }
}
```

### 3. PUT /api/classes/[id] - Update Class

**URL**: `http://localhost:3000/api/classes/{class_id}`  
**Method**: `PUT`  
**Auth**: Admin required

**Request Body**:
```json
{
  "name": "E",
  "year": 6
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "class": {
      "id": "class_id",
      "name": "E",
      "year": 6,
      "studentCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z"
    },
    "message": "6年E組を更新しました"
  }
}
```

### 4. DELETE /api/classes/[id] - Delete Class

**URL**: `http://localhost:3000/api/classes/{class_id}`  
**Method**: `DELETE`  
**Auth**: Admin required

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "message": "5年D組を削除しました",
    "deletedClass": {
      "id": "class_id",
      "name": "D",
      "year": 5
    }
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラーが発生しました",
    "details": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": ["year"],
        "message": "Expected number, received string"
      }
    ]
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

### Permission Error (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "管理者権限が必要です"
  }
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": {
    "code": "CLASS_NOT_FOUND",
    "message": "クラスが見つかりません"
  }
}
```

### Duplicate Error (409)
```json
{
  "success": false,
  "error": {
    "code": "CLASS_ALREADY_EXISTS",
    "message": "5年A組は既に存在します"
  }
}
```

### Class with Students Error (409)
```json
{
  "success": false,
  "error": {
    "code": "CLASS_HAS_STUDENTS",
    "message": "このクラスには4名の図書委員が登録されているため削除できません"
  }
}
```

## Test Scenarios

### Positive Tests
1. ✅ List all classes successfully
2. ✅ Create a new class with valid data
3. ✅ Update an existing class
4. ✅ Delete a class without students
5. ✅ Pagination works correctly
6. ✅ Search functionality works
7. ✅ Year filtering works

### Negative Tests
1. ✅ Reject unauthenticated requests
2. ✅ Reject non-admin requests for write operations
3. ✅ Reject invalid class names (empty, too long, special characters)
4. ✅ Reject invalid years (< 5 or > 6)
5. ✅ Reject duplicate class creation
6. ✅ Reject deletion of classes with students
7. ✅ Handle non-existent class IDs gracefully

## Implementation Status

- ✅ All CRUD endpoints implemented
- ✅ Authentication and authorization integrated
- ✅ Zod validation schemas implemented
- ✅ Comprehensive error handling
- ✅ Pagination support
- ✅ Search and filtering
- ✅ TypeScript types and interfaces
- ✅ Build validation successful