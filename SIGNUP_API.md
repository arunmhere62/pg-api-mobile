# User Signup API Documentation

## Endpoint
`POST /api/v1/auth/signup`

## Description
Register a new user account with organization and PG location. This endpoint creates:
1. A new organization
2. An admin role for the organization
3. A user account (status: INACTIVE - requires admin approval)
4. A PG location linked to the user

## Request Body

```json
{
  "organizationName": "My PG Organization",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "9876543210",
  "pgName": "Green Valley PG",
  "pgAddress": "123 Main Street, City",
  "stateId": 1,
  "cityId": 1,
  "pgPincode": "560001"
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `organizationName` | string | Yes | Name of the organization |
| `name` | string | Yes | Full name of the user |
| `email` | string | Yes | Email address (must be unique) |
| `password` | string | Yes | Password (minimum 6 characters) |
| `phone` | string | No | Phone number (must be unique if provided) |
| `pgName` | string | Yes | Name of the PG location |
| `pgAddress` | string | Yes | Address of the PG location |
| `stateId` | number | Yes | State ID from the states table |
| `cityId` | number | Yes | City ID from the cities table |
| `pgPincode` | string | No | Pincode of the PG location |

## Success Response

**Status Code:** `201 Created`

```json
{
  "success": true,
  "message": "Account created successfully. Please wait for admin approval.",
  "data": {
    "userId": 1,
    "pgId": 1,
    "organizationId": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## Error Responses

### Email Already Registered
**Status Code:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Email already registered",
  "error": "Bad Request"
}
```

### Phone Already Registered
**Status Code:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": "Phone number already registered",
  "error": "Bad Request"
}
```

### Validation Error
**Status Code:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### Server Error
**Status Code:** `500 Internal Server Error`

```json
{
  "statusCode": 500,
  "message": "Failed to create account. Please try again.",
  "error": "Internal Server Error"
}
```

## Example Usage

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "My PG Organization",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "9876543210",
    "pgName": "Green Valley PG",
    "pgAddress": "123 Main Street, City",
    "stateId": 1,
    "cityId": 1,
    "pgPincode": "560001"
  }'
```

### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organizationName: 'My PG Organization',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    phone: '9876543210',
    pgName: 'Green Valley PG',
    pgAddress: '123 Main Street, City',
    stateId: 1,
    cityId: 1,
    pgPincode: '560001',
  }),
});

const data = await response.json();
console.log(data);
```

### Axios
```javascript
import axios from 'axios';

try {
  const response = await axios.post('http://localhost:3000/api/v1/auth/signup', {
    organizationName: 'My PG Organization',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    phone: '9876543210',
    pgName: 'Green Valley PG',
    pgAddress: '123 Main Street, City',
    stateId: 1,
    cityId: 1,
    pgPincode: '560001',
  });
  
  console.log(response.data);
} catch (error) {
  console.error(error.response.data);
}
```

## Notes

1. **Password Security**: In production, passwords should be hashed using bcrypt before storing. Currently, the password is stored as plain text (this should be fixed).

2. **User Status**: New users are created with `INACTIVE` status and require admin approval before they can log in.

3. **Transaction Safety**: All database operations are wrapped in a transaction, ensuring data consistency. If any step fails, all changes are rolled back.

4. **Unique Constraints**: 
   - Email must be unique across all users
   - Phone number must be unique if provided
   - Role names are made unique per organization using the pattern `ADMIN_{organizationId}`

5. **Swagger Documentation**: The endpoint is documented in Swagger UI at `/api/docs`

## Database Tables Affected

- `organization` - New organization record
- `roles` - New admin role for the organization
- `users` - New user account
- `pg_locations` - New PG location record

## Related Endpoints

- `POST /api/v1/auth/send-otp` - Send OTP for login
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/resend-otp` - Resend OTP
