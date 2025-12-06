# Implementation Example - Using the New Error Handling System

This document shows how to update your existing controllers to use the new centralized error handling system.

## Before (Old Way)

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    try {
      const users = await this.userService.findAll();
      return {
        statusCode: 200,
        message: 'Users fetched successfully',
        data: users,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id);
      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found',
          timestamp: new Date().toISOString(),
        };
      }
      return {
        statusCode: 200,
        message: 'User fetched successfully',
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      // Manual validation
      if (!createUserDto.email) {
        return {
          statusCode: 400,
          message: 'Email is required',
          timestamp: new Date().toISOString(),
        };
      }

      // Check if user exists
      const existingUser = await this.userService.findByEmail(createUserDto.email);
      if (existingUser) {
        return {
          statusCode: 409,
          message: 'User already exists',
          timestamp: new Date().toISOString(),
        };
      }

      const user = await this.userService.create(createUserDto);
      return {
        statusCode: 201,
        message: 'User created successfully',
        data: user,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
```

## After (New Way - With Centralized Error Handling)

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { 
  NotFoundException, 
  ConflictException 
} from 'src/common/exceptions/api.exception';
import { ResponseUtil } from 'src/common/utils/response.util';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    const users = await this.userService.findAll();
    return ResponseUtil.success(users, 'Users fetched successfully');
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return ResponseUtil.success(user, 'User fetched successfully');
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Check if user exists
    const existingUser = await this.userService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userService.create(createUserDto);
    return ResponseUtil.created(user, 'User created successfully');
  }
}
```

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Error Handling** | Manual try-catch in each endpoint | Global exception filter |
| **Response Format** | Inconsistent across endpoints | Standardized everywhere |
| **Error Codes** | String messages only | Structured error codes + messages |
| **Validation** | Manual checks | Automatic + class-validator |
| **Response Wrapping** | Manual in each endpoint | Automatic interceptor |
| **Status Codes** | Manual assignment | Automatic based on error type |
| **Timestamp** | Manual in each endpoint | Automatic |
| **Code Duplication** | High (try-catch repeated) | Minimal |
| **Maintainability** | Low | High |

---

## Migration Checklist

When updating your existing controllers:

- [ ] Remove all `try-catch` blocks
- [ ] Replace manual error returns with exception throws
- [ ] Use `ResponseUtil` helpers for success responses
- [ ] Use specific exception classes (`NotFoundException`, `ConflictException`, etc.)
- [ ] Remove manual timestamp and statusCode assignments
- [ ] Remove manual response wrapping
- [ ] Test all endpoints to ensure they work correctly

---

## Example: Complex Service with Error Handling

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { 
  NotFoundException, 
  ConflictException,
  BusinessLogicException 
} from 'src/common/exceptions/api.exception';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Errors are automatically caught by GlobalExceptionFilter
    return await this.prisma.user.findMany();
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Prisma errors (like P2002 for unique constraint) are automatically handled
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async update(id: string, updateUserDto: any) {
    const user = await this.findById(id); // Throws NotFoundException if not found

    // Business logic validation
    if (user.status === 'deleted') {
      throw new BusinessLogicException(
        'Cannot update a deleted user',
        { userId: id, currentStatus: user.status }
      );
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async delete(id: string) {
    const user = await this.findById(id); // Throws NotFoundException if not found

    // Business logic validation
    if (user.role === 'admin' && user.isLastAdmin) {
      throw new BusinessLogicException(
        'Cannot delete the last admin user',
        { userId: id, role: user.role }
      );
    }

    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
```

---

## Response Examples

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "user-1",
      "email": "john@example.com",
      "name": "John Doe"
    }
  ],
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/v1/users"
}
```

### Error Response - Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": {
    "code": "RES_002",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/v1/users/invalid-id"
}
```

### Error Response - Conflict
```json
{
  "success": false,
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": {
    "code": "RES_003",
    "details": null
  },
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/v1/users"
}
```

### Error Response - Business Logic
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Cannot delete the last admin user",
  "error": {
    "code": "BIZ_001",
    "details": {
      "userId": "admin-1",
      "role": "admin"
    }
  },
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/v1/users/admin-1"
}
```

---

## Quick Reference

### Throwing Errors

```typescript
// Not found
throw new NotFoundException('User not found');

// Conflict/Already exists
throw new ConflictException('Email already registered');

// Validation error
throw new ValidationException('Invalid input', { field: 'email' });

// Unauthorized
throw new UnauthorizedException('Please login first');

// Forbidden
throw new ForbiddenException('You do not have permission');

// Business logic error
throw new BusinessLogicException('Cannot perform this action', { reason: '...' });

// Rate limit
throw new RateLimitException('Too many requests');

// Custom error with specific code
throw new ApiException(ErrorCode.BUSINESS_LOGIC_ERROR, 'Custom message', { details });
```

### Response Helpers

```typescript
// Success response
return ResponseUtil.success(data, 'Success message');

// Created response (201)
return ResponseUtil.created(data, 'Resource created');

// Paginated response
return ResponseUtil.paginated(data, total, page, limit, 'Success');

// No content response (204)
return ResponseUtil.noContent('Deleted successfully');

// Accepted response (202)
return ResponseUtil.accepted(data, 'Request accepted');
```

---

## Testing

```bash
# Test success
curl http://localhost:5000/api/v1/users

# Test not found
curl http://localhost:5000/api/v1/users/invalid-id

# Test conflict
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "existing@example.com", "name": "John"}'

# Test validation error
curl -X POST http://localhost:5000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

---

## Summary

The new error handling system provides:

✅ **Cleaner Code** - No more repetitive try-catch blocks  
✅ **Consistency** - All responses follow the same format  
✅ **Better Errors** - Structured error codes and messages  
✅ **Less Maintenance** - Changes in one place affect all endpoints  
✅ **Better Frontend Integration** - Predictable response structure  
✅ **Production Ready** - Handles all error types automatically  
