# PG Location CRUD API Documentation

## Overview
Complete CRUD (Create, Read, Update, Delete) API for managing PG locations in the system.

---

## Endpoints

### 1. Get All PG Locations
Get all PG locations for the user's organization.

**Endpoint:** `GET /api/v1/pg-locations`

**Headers:**
```
Authorization: Bearer {token}  // When JWT is implemented
```

**Response:**
```json
{
  "success": true,
  "message": "PG locations fetched successfully",
  "data": [
    {
      "s_no": 1,
      "user_id": 1,
      "location_name": "Green Valley PG",
      "address": "123 Main Street, Bangalore",
      "pincode": "560001",
      "status": "ACTIVE",
      "images": ["image1.jpg", "image2.jpg"],
      "city_id": 1,
      "state_id": 1,
      "organization_id": 1,
      "created_at": "2025-01-19T10:00:00.000Z",
      "updated_at": "2025-01-19T10:00:00.000Z",
      "city": {
        "s_no": 1,
        "name": "Bangalore",
        "state_code": "KA"
      },
      "state": {
        "s_no": 1,
        "name": "Karnataka",
        "iso_code": "KA"
      }
    }
  ]
}
```

---

### 2. Get Single PG Location
Get details of a specific PG location by ID.

**Endpoint:** `GET /api/v1/pg-locations/:id`

**Parameters:**
- `id` (path) - PG Location ID

**Response:**
```json
{
  "success": true,
  "message": "PG location fetched successfully",
  "data": {
    "s_no": 1,
    "user_id": 1,
    "location_name": "Green Valley PG",
    "address": "123 Main Street, Bangalore",
    "pincode": "560001",
    "status": "ACTIVE",
    "images": ["image1.jpg", "image2.jpg"],
    "city_id": 1,
    "state_id": 1,
    "organization_id": 1,
    "created_at": "2025-01-19T10:00:00.000Z",
    "updated_at": "2025-01-19T10:00:00.000Z",
    "city": {
      "s_no": 1,
      "name": "Bangalore",
      "state_code": "KA"
    },
    "state": {
      "s_no": 1,
      "name": "Karnataka",
      "iso_code": "KA"
    },
    "organization": {
      "s_no": 1,
      "name": "My PG Organization"
    }
  }
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "PG location not found",
  "error": "Not Found"
}
```

---

### 3. Create PG Location
Create a new PG location.

**Endpoint:** `POST /api/v1/pg-locations`

**Request Body:**
```json
{
  "locationName": "Green Valley PG",
  "address": "123 Main Street, Bangalore",
  "pincode": "560001",
  "stateId": 1,
  "cityId": 1,
  "images": ["image1.jpg", "image2.jpg"]
}
```

**Field Validations:**
- `locationName` (required) - String, not empty
- `address` (required) - String, not empty
- `pincode` (optional) - String, min 4 characters
- `stateId` (required) - Integer, positive
- `cityId` (required) - Integer, positive
- `images` (optional) - Array of strings

**Success Response (201):**
```json
{
  "success": true,
  "message": "PG location created successfully",
  "data": {
    "s_no": 1,
    "user_id": 1,
    "location_name": "Green Valley PG",
    "address": "123 Main Street, Bangalore",
    "pincode": "560001",
    "status": "ACTIVE",
    "images": ["image1.jpg", "image2.jpg"],
    "city_id": 1,
    "state_id": 1,
    "organization_id": 1,
    "is_deleted": false,
    "created_at": "2025-01-19T10:00:00.000Z",
    "updated_at": "2025-01-19T10:00:00.000Z",
    "city": {
      "s_no": 1,
      "name": "Bangalore"
    },
    "state": {
      "s_no": 1,
      "name": "Karnataka"
    }
  }
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": [
    "locationName should not be empty",
    "address should not be empty",
    "stateId must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

### 4. Update PG Location
Update an existing PG location.

**Endpoint:** `PUT /api/v1/pg-locations/:id`

**Parameters:**
- `id` (path) - PG Location ID

**Request Body (all fields optional):**
```json
{
  "locationName": "Updated PG Name",
  "address": "Updated Address",
  "pincode": "560002",
  "stateId": 2,
  "cityId": 2,
  "images": ["new_image1.jpg"],
  "status": "INACTIVE"
}
```

**Field Validations:**
- `locationName` (optional) - String
- `address` (optional) - String
- `pincode` (optional) - String, min 4 characters
- `stateId` (optional) - Integer
- `cityId` (optional) - Integer
- `images` (optional) - Array of strings
- `status` (optional) - Enum: 'ACTIVE' | 'INACTIVE'

**Success Response (200):**
```json
{
  "success": true,
  "message": "PG location updated successfully",
  "data": {
    "s_no": 1,
    "location_name": "Updated PG Name",
    "address": "Updated Address",
    "pincode": "560002",
    "status": "INACTIVE",
    "city": {
      "s_no": 2,
      "name": "Mumbai"
    },
    "state": {
      "s_no": 2,
      "name": "Maharashtra"
    }
  }
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "PG location not found",
  "error": "Not Found"
}
```

---

### 5. Delete PG Location
Soft delete a PG location (sets is_deleted = true).

**Endpoint:** `DELETE /api/v1/pg-locations/:id`

**Parameters:**
- `id` (path) - PG Location ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "PG location deleted successfully"
}
```

**Error Response (404):**
```json
{
  "statusCode": 404,
  "message": "PG location not found",
  "error": "Not Found"
}
```

---

### 6. Get PG Location Statistics
Get statistics about PG locations for the organization.

**Endpoint:** `GET /api/v1/pg-locations/stats`

**Response:**
```json
{
  "success": true,
  "message": "PG location stats fetched successfully",
  "data": {
    "total": 5,
    "active": 4,
    "inactive": 1
  }
}
```

---

## Usage Examples

### cURL

#### Get All PG Locations
```bash
curl -X GET http://localhost:3000/api/v1/pg-locations \
  -H "Authorization: Bearer {token}"
```

#### Create PG Location
```bash
curl -X POST http://localhost:3000/api/v1/pg-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "locationName": "Green Valley PG",
    "address": "123 Main Street, Bangalore",
    "pincode": "560001",
    "stateId": 1,
    "cityId": 1,
    "images": ["image1.jpg", "image2.jpg"]
  }'
```

#### Update PG Location
```bash
curl -X PUT http://localhost:3000/api/v1/pg-locations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "locationName": "Updated PG Name",
    "status": "INACTIVE"
  }'
```

#### Delete PG Location
```bash
curl -X DELETE http://localhost:3000/api/v1/pg-locations/1 \
  -H "Authorization: Bearer {token}"
```

---

### JavaScript (Axios)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const token = 'your_jwt_token';

// Get all PG locations
const getPgLocations = async () => {
  const response = await axios.get(`${API_BASE_URL}/pg-locations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Create PG location
const createPgLocation = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/pg-locations`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Update PG location
const updatePgLocation = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/pg-locations/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Delete PG location
const deletePgLocation = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/pg-locations/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get stats
const getPgStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/pg-locations/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

## Security & Authorization

### Organization-Based Access Control
- Users can only access PG locations belonging to their organization
- `organizationId` is extracted from the authenticated user's token
- All queries filter by `organization_id`

### Soft Delete
- Deleted PG locations are not permanently removed
- `is_deleted` flag is set to `true`
- Deleted locations are excluded from all queries

### Future Authentication
- Currently using mock user data (userId: 1, organizationId: 1)
- TODO: Implement JWT authentication
- Uncomment `@ApiBearerAuth()` decorator when ready

---

## Database Schema

```prisma
model pg_locations {
  s_no             Int                  @id @default(autoincrement())
  user_id          Int
  location_name    String               @db.VarChar(100)
  address          String               @db.VarChar(255)
  pincode          String?              @db.VarChar(10)
  created_at       DateTime?            @default(now())
  updated_at       DateTime?            @default(now())
  status           pg_locations_status? @default(ACTIVE)
  images           Json?
  city_id          Int?
  state_id         Int?
  organization_id  Int
  is_deleted       Boolean              @default(false)
  
  // Relations
  city             city?
  state            state?
  organization     organization
}
```

---

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (access denied)
- `404` - Not Found (PG location doesn't exist)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```

---

## Features

✅ **Complete CRUD Operations**
- Create, Read, Update, Delete PG locations

✅ **Organization Isolation**
- Users only see their organization's data

✅ **Soft Delete**
- Deleted records are preserved

✅ **Validation**
- Request body validation using class-validator

✅ **Relations**
- Includes city and state information

✅ **Statistics**
- Get counts of total, active, and inactive locations

✅ **Swagger Documentation**
- Auto-generated API docs at `/api/docs`

---

## Files Created

1. **`api/src/modules/pg-location/pg-location.module.ts`**
   - Module definition

2. **`api/src/modules/pg-location/pg-location.controller.ts`**
   - REST API endpoints

3. **`api/src/modules/pg-location/pg-location.service.ts`**
   - Business logic and database operations

4. **`api/src/modules/pg-location/dto/create-pg-location.dto.ts`**
   - Create DTO with validation

5. **`api/src/modules/pg-location/dto/update-pg-location.dto.ts`**
   - Update DTO with validation

6. **`api/src/app.module.ts`** (Modified)
   - Added PgLocationModule

---

## Testing Checklist

- [ ] Get all PG locations
- [ ] Get single PG location by ID
- [ ] Create new PG location
- [ ] Update PG location
- [ ] Delete PG location (soft delete)
- [ ] Get statistics
- [ ] Validation errors display correctly
- [ ] Organization isolation works
- [ ] Soft deleted locations are excluded
- [ ] Relations (city, state) load correctly

---

## Future Enhancements

- [ ] Add JWT authentication middleware
- [ ] Add pagination for list endpoint
- [ ] Add filtering (by status, city, state)
- [ ] Add sorting options
- [ ] Add search functionality
- [ ] Add image upload endpoint
- [ ] Add bulk operations
- [ ] Add audit logs
- [ ] Add role-based permissions
- [ ] Add caching for better performance
