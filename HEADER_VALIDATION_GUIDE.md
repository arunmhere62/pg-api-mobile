# Header Validation System

## Overview
A comprehensive header validation system for NestJS API that validates and enforces required headers across all endpoints.

---

## Features

✅ **Automatic Validation**: Headers are validated using class-validator  
✅ **Type Safety**: TypeScript interfaces ensure type safety  
✅ **Flexible Requirements**: Specify which headers are required per endpoint  
✅ **Clear Error Messages**: Detailed error messages for missing/invalid headers  
✅ **Centralized Logic**: Single guard handles all validation  
✅ **Easy to Use**: Simple decorators for controllers  

---

## Architecture

### Files Created

1. **`src/common/dto/common-headers.dto.ts`**
   - DTO for header validation with class-validator decorators

2. **`src/common/guards/headers-validation.guard.ts`**
   - Guard that validates headers and enforces requirements

3. **`src/common/decorators/require-headers.decorator.ts`**
   - Decorator to specify required headers per endpoint

4. **`src/common/decorators/validated-headers.decorator.ts`**
   - Decorator to extract validated headers in controller methods

---

## Usage

### 1. Apply Guard to Controller

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';

@Controller('rooms')
@UseGuards(HeadersValidationGuard)
export class RoomController {
  // ...
}
```

### 2. Specify Required Headers

```typescript
import { RequireHeaders } from '../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

// Require all headers
@Post()
@RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
async create(
  @ValidatedHeaders() headers: ValidatedHeaders,
  @Body() createDto: CreateDto,
) {
  // headers.pg_id, headers.organization_id, headers.user_id are guaranteed to exist
}

// Require only pg_id
@Get()
@RequireHeaders({ pg_id: true })
async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
  // headers.pg_id is guaranteed to exist
  // headers.organization_id and headers.user_id may be undefined
}

// No required headers (but still validates format if provided)
@Get(':id')
@RequireHeaders()
async findOne(@ValidatedHeaders() headers: ValidatedHeaders) {
  // All headers are optional
}
```

---

## Header Mapping

The system automatically maps HTTP headers to validated properties:

| HTTP Header           | Property Name     | Type     | Validation                |
|-----------------------|-------------------|----------|---------------------------|
| `X-PG-Location-Id`    | `pg_id`          | number   | Positive integer          |
| `X-Organization-Id`   | `organization_id`| number   | Positive integer          |
| `X-User-Id`           | `user_id`        | number   | Positive integer          |

---

## Validation Rules

### Automatic Validations (Applied to all headers)

- Must be a valid integer
- Must be a positive number (> 0)
- Automatically parsed from string to number

### Required Header Validation

- If specified as required, header must be present
- Missing required headers return `400 Bad Request`
- Clear error message indicates which headers are missing

---

## Error Responses

### Missing Required Headers

**Request:**
```bash
GET /api/v1/rooms
# Missing X-PG-Location-Id header
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Missing required headers: X-PG-Location-Id",
  "error": "Bad Request"
}
```

### Invalid Header Format

**Request:**
```bash
GET /api/v1/rooms
X-PG-Location-Id: invalid
```

**Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid headers: pg_id must be a positive number, pg_id must be an integer",
  "error": "Bad Request"
}
```

---

## Examples

### Example 1: Create Endpoint (All Headers Required)

```typescript
@Post()
@RequireHeaders({ pg_id: true, organization_id: true, user_id: true })
async create(
  @ValidatedHeaders() headers: ValidatedHeaders,
  @Body() createRoomDto: CreateRoomDto,
) {
  // All headers are guaranteed to exist
  console.log(headers.pg_id);          // number
  console.log(headers.organization_id); // number
  console.log(headers.user_id);        // number
  
  return this.roomService.create(createRoomDto);
}
```

### Example 2: List Endpoint (Only PG ID Required)

```typescript
@Get()
@RequireHeaders({ pg_id: true })
async findAll(
  @ValidatedHeaders() headers: ValidatedHeaders,
  @Query('page') page?: string,
) {
  // pg_id is guaranteed to exist, others are optional
  return this.roomService.findAll({
    pg_id: headers.pg_id!,  // Non-null assertion safe here
    organization_id: headers.organization_id,  // May be undefined
  });
}
```

### Example 3: Get by ID (No Required Headers)

```typescript
@Get(':id')
@RequireHeaders()
async findOne(
  @ValidatedHeaders() headers: ValidatedHeaders,
  @Param('id') id: string,
) {
  // All headers are optional but validated if provided
  return this.roomService.findOne(+id, headers.pg_id);
}
```

---

## Migration Guide

### Before (Old System)

```typescript
import { CommonHeaders, CommonHeadersDecorator } from '../../common/decorators/common-headers.decorator';

@Controller('rooms')
export class RoomController {
  @Get()
  async findAll(@CommonHeadersDecorator() headers: CommonHeaders) {
    // No validation, headers may be invalid
    return this.roomService.findAll({ pg_id: headers.pg_id });
  }
}
```

### After (New System)

```typescript
import { HeadersValidationGuard } from '../../common/guards/headers-validation.guard';
import { RequireHeaders } from '../../common/decorators/require-headers.decorator';
import { ValidatedHeaders } from '../../common/decorators/validated-headers.decorator';

@Controller('rooms')
@UseGuards(HeadersValidationGuard)
export class RoomController {
  @Get()
  @RequireHeaders({ pg_id: true })
  async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
    // Headers are validated, pg_id is guaranteed to exist
    return this.roomService.findAll({ pg_id: headers.pg_id! });
  }
}
```

---

## Best Practices

### 1. Apply Guard at Controller Level

```typescript
@Controller('rooms')
@UseGuards(HeadersValidationGuard)  // ✅ Apply to entire controller
export class RoomController {}
```

### 2. Specify Requirements Per Endpoint

```typescript
// Create/Update/Delete: Require all headers
@Post()
@RequireHeaders({ pg_id: true, organization_id: true, user_id: true })

// List: Require only filtering headers
@Get()
@RequireHeaders({ pg_id: true })

// Get by ID: No required headers
@Get(':id')
@RequireHeaders()
```

### 3. Use Non-null Assertions Safely

```typescript
@RequireHeaders({ pg_id: true })
async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
  // Safe to use ! because pg_id is required
  const pgId = headers.pg_id!;
}
```

### 4. Handle Optional Headers

```typescript
@RequireHeaders()
async findAll(@ValidatedHeaders() headers: ValidatedHeaders) {
  // Check if optional header exists
  if (headers.pg_id) {
    // Use header
  }
}
```

---

## Testing

### Test with cURL

```bash
# Valid request
curl -X GET http://localhost:3000/api/v1/rooms \
  -H "X-PG-Location-Id: 1" \
  -H "X-Organization-Id: 1" \
  -H "X-User-Id: 1"

# Missing required header
curl -X GET http://localhost:3000/api/v1/rooms
# Returns: 400 Bad Request - Missing required headers: X-PG-Location-Id

# Invalid header format
curl -X GET http://localhost:3000/api/v1/rooms \
  -H "X-PG-Location-Id: abc"
# Returns: 400 Bad Request - Invalid headers: pg_id must be a positive number
```

### Test with Postman

1. Create a new request
2. Add headers:
   - `X-PG-Location-Id`: `1`
   - `X-Organization-Id`: `1`
   - `X-User-Id`: `1`
3. Send request
4. Verify validation works by removing/modifying headers

---

## Controllers Updated

The following controllers have been updated to use the new validation system:

- ✅ **RoomController** (`src/modules/room/room.controller.ts`)
- ✅ **BedController** (`src/modules/bed/bed.controller.ts`)
- ✅ **TenantController** (`src/modules/tenant/tenant.controller.ts`)
- ✅ **PgLocationController** (`src/modules/pg-location/pg-location.controller.ts`)

---

## Extending the System

### Add New Header

1. Update DTO:
```typescript
// src/common/dto/common-headers.dto.ts
export class CommonHeadersDto {
  // ... existing headers
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  new_header?: number;
}
```

2. Update Guard:
```typescript
// src/common/guards/headers-validation.guard.ts
const headerData = {
  // ... existing headers
  new_header: headers['x-new-header']
    ? parseInt(headers['x-new-header'], 10)
    : undefined,
};
```

3. Update Interface:
```typescript
// src/common/decorators/validated-headers.decorator.ts
export interface ValidatedHeaders {
  // ... existing headers
  new_header?: number;
}
```

4. Update Options:
```typescript
// src/common/guards/headers-validation.guard.ts
export interface RequiredHeadersOptions {
  // ... existing headers
  new_header?: boolean;
}
```

---

## Troubleshooting

### Issue: Headers not being validated

**Solution:** Ensure `@UseGuards(HeadersValidationGuard)` is applied to the controller

### Issue: TypeScript errors about undefined headers

**Solution:** Use non-null assertion (`!`) for required headers or check for undefined

### Issue: Headers are case-sensitive

**Solution:** The guard automatically handles case-insensitive header names (converts to lowercase)

---

## Performance Considerations

- **Minimal Overhead**: Validation happens once per request
- **Efficient Parsing**: Headers are parsed only once and cached in request
- **No Database Calls**: Pure validation logic, no external dependencies

---

## Security Benefits

1. **Input Validation**: Prevents invalid data from reaching business logic
2. **Type Safety**: Ensures headers are correct type before processing
3. **Clear Errors**: Helps identify misconfigured clients quickly
4. **Consistent Validation**: Same rules applied across all endpoints

---

## Future Enhancements

- [ ] Add support for string headers (not just numbers)
- [ ] Add custom validation rules per header
- [ ] Add header transformation options
- [ ] Add support for header arrays
- [ ] Add caching for repeated validations
- [ ] Add metrics/logging for validation failures

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code examples
3. Test with cURL/Postman
4. Check error messages for details
