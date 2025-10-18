# Authentication Module - OTP Login

This module provides OTP-based authentication using SMS.

## Features

- ✅ Send OTP to registered phone numbers
- ✅ Verify OTP and login users
- ✅ Resend OTP functionality
- ✅ OTP expiry (5 minutes)
- ✅ Maximum 3 verification attempts
- ✅ SMS integration with Canny Infotech API

## API Endpoints

### 1. Send OTP
**POST** `/api/v1/auth/send-otp`

**Request Body:**
```json
{
  "phone": "918248449609"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "918248449609",
    "expiresIn": "5 minutes"
  }
}
```

### 2. Verify OTP
**POST** `/api/v1/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "918248449609",
  "otp": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "s_no": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "918248449609",
    "role_id": 2,
    "role_name": "Admin",
    "organization_id": 1,
    "organization_name": "Company Name",
    "status": "ACTIVE"
  }
}
```

### 3. Resend OTP
**POST** `/api/v1/auth/resend-otp`

**Request Body:**
```json
{
  "phone": "918248449609"
}
```

## SMS Configuration

The SMS service is configured in `sms.service.ts`:

- **API URL:** http://cannyinfotech.in/api/mt/SendSMS
- **User:** SATZTECHNOSOLUTIONS
- **Sender ID:** SATZTH
- **Channel:** Trans (Transactional)
- **Route:** 10

## Security Features

1. **OTP Expiry:** OTPs expire after 5 minutes
2. **Rate Limiting:** Maximum 3 verification attempts per OTP
3. **User Validation:** Only active, non-deleted users can login
4. **Phone Validation:** Indian mobile numbers only (91XXXXXXXXXX)

## Flow

1. User enters phone number
2. System checks if user exists and is active
3. Generate 4-digit OTP
4. Send OTP via SMS
5. Store OTP in memory with expiry time
6. User enters OTP
7. System verifies OTP
8. Return user details on successful verification

## Production Considerations

### Current Implementation (Development)
- OTPs stored in memory (Map)
- No JWT token generation
- No refresh token

### Recommended for Production
1. **Use Redis** for OTP storage
2. **Implement JWT** authentication
3. **Add refresh tokens**
4. **Rate limiting** on endpoints
5. **Logging** for security audits
6. **Environment variables** for SMS credentials

## Environment Variables

Add to `.env`:
```env
SMS_API_URL=http://cannyinfotech.in/api/mt/SendSMS
SMS_USER=SATZTECHNOSOLUTIONS
SMS_PASSWORD=demo1234
SMS_SENDER_ID=SATZTH
SMS_CHANNEL=Trans
SMS_ROUTE=10
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
```

## Testing

Use Swagger UI at `/api/docs` to test the endpoints.

### Test Flow:
1. Go to `/api/docs`
2. Find **auth** section
3. Test `POST /auth/send-otp` with a valid phone number
4. Check SMS for OTP
5. Test `POST /auth/verify-otp` with phone and OTP
6. Verify successful login response
