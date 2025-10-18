# JWT Token Table Setup Guide

## 📋 Table Structure

The `tokens` table stores JWT authentication tokens for users.

### Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `s_no` | INT (PK) | Auto-increment primary key |
| `user_id` | INT (FK) | Foreign key to users table |
| `access_token` | TEXT | JWT access token |
| `refresh_token` | TEXT | JWT refresh token (optional) |
| `token_type` | VARCHAR(20) | Token type (default: "Bearer") |
| `expires_at` | DATETIME | Access token expiration time |
| `refresh_expires_at` | DATETIME | Refresh token expiration time |
| `is_revoked` | BOOLEAN | Whether token is revoked |
| `revoked_at` | DATETIME | When token was revoked |
| `ip_address` | VARCHAR(45) | User's IP address |
| `user_agent` | VARCHAR(255) | User's browser/device info |
| `device_info` | JSON | Additional device information |
| `created_at` | TIMESTAMP | Token creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `last_used_at` | DATETIME | Last time token was used |

### Indexes

- `idx_user_id` - Fast lookup by user
- `idx_access_token` - Fast token verification
- `idx_refresh_token` - Fast refresh token lookup
- `idx_is_revoked` - Filter active/revoked tokens
- `idx_expires_at` - Efficient cleanup of expired tokens

---

## 🚀 Setup Instructions

### Step 1: Run the SQL Query

Execute the SQL file to create the table in your database:

```sql
CREATE TABLE `tokens` (
  `s_no` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT NULL,
  `token_type` VARCHAR(20) DEFAULT 'Bearer',
  `expires_at` DATETIME NOT NULL,
  `refresh_expires_at` DATETIME NULL,
  `is_revoked` BOOLEAN DEFAULT FALSE,
  `revoked_at` DATETIME NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `device_info` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_used_at` DATETIME NULL,
  PRIMARY KEY (`s_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_access_token` (`access_token`(255)),
  INDEX `idx_refresh_token` (`refresh_token`(255)),
  INDEX `idx_is_revoked` (`is_revoked`),
  INDEX `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`s_no`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 2: Install JWT Package

```bash
npm install @nestjs/jwt
npm install @types/jsonwebtoken --save-dev
```

### Step 3: Generate Prisma Client

```bash
npx prisma db pull
npx prisma generate
```

---

## 🔐 JWT Configuration

### Add to `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🎯 Token Flow

### 1. **User Login (OTP Verification)**
```
User verifies OTP
    ↓
Generate JWT access token
    ↓
Generate JWT refresh token
    ↓
Save tokens to database
    ↓
Return tokens to user
```

### 2. **Access Protected Routes**
```
User sends request with access token
    ↓
Verify token signature
    ↓
Check if token is revoked
    ↓
Check if token is expired
    ↓
Allow/Deny access
```

### 3. **Refresh Token**
```
Access token expired
    ↓
User sends refresh token
    ↓
Verify refresh token
    ↓
Generate new access token
    ↓
Update token in database
    ↓
Return new access token
```

### 4. **Logout**
```
User logs out
    ↓
Mark token as revoked
    ↓
Set revoked_at timestamp
    ↓
Token becomes invalid
```

---

## 📊 Database Relationships

```
users (s_no) ←──── tokens (user_id)
     1                    Many
```

- One user can have many tokens (multiple devices/sessions)
- Each token belongs to one user
- When user is deleted, all their tokens are deleted (CASCADE)

---

## 🔍 Example Queries

### Get all active tokens for a user
```sql
SELECT * FROM tokens 
WHERE user_id = 1 
  AND is_revoked = FALSE 
  AND expires_at > NOW();
```

### Revoke all tokens for a user (force logout)
```sql
UPDATE tokens 
SET is_revoked = TRUE, 
    revoked_at = NOW() 
WHERE user_id = 1 
  AND is_revoked = FALSE;
```

### Get user's active sessions
```sql
SELECT 
  t.s_no,
  t.ip_address,
  t.user_agent,
  t.created_at,
  t.last_used_at
FROM tokens t
WHERE t.user_id = 1 
  AND t.is_revoked = FALSE 
  AND t.expires_at > NOW()
ORDER BY t.last_used_at DESC;
```

### Clean up expired tokens
```sql
DELETE FROM tokens 
WHERE expires_at < NOW() 
  OR (is_revoked = TRUE AND revoked_at < DATE_SUB(NOW(), INTERVAL 30 DAY));
```

### Count active sessions per user
```sql
SELECT 
  u.name,
  u.phone,
  COUNT(t.s_no) as active_sessions
FROM users u
LEFT JOIN tokens t ON u.s_no = t.user_id 
  AND t.is_revoked = FALSE 
  AND t.expires_at > NOW()
GROUP BY u.s_no, u.name, u.phone
HAVING active_sessions > 0
ORDER BY active_sessions DESC;
```

---

## 💡 Token Strategy Options

### Option 1: One Token Per User (Recommended for Mobile)
- Only one active token at a time
- New login revokes old token
- User logged out from other devices

### Option 2: Multiple Tokens Per User (Recommended for Web + Mobile)
- Multiple active tokens allowed
- User can be logged in on multiple devices
- Each device has its own token

### Option 3: Hybrid Approach
- Limit to N active tokens per user (e.g., 5)
- Oldest token gets revoked when limit reached
- Balance between security and convenience

---

## 🔐 Security Features

1. **Token Revocation** - Ability to invalidate tokens
2. **Expiration Tracking** - Automatic token expiry
3. **Device Tracking** - Know which device uses which token
4. **IP Logging** - Track suspicious activity
5. **Last Used Tracking** - Monitor token usage
6. **Cascade Delete** - Auto cleanup when user deleted
7. **Refresh Tokens** - Secure token renewal

---

## 🧪 Testing Scenarios

### Test 1: Login and Get Token
```bash
# Verify OTP
POST /api/v1/auth/verify-otp
Body: { "phone": "918248449609", "otp": "1234" }

# Response should include:
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}

# Check database
SELECT * FROM tokens WHERE user_id = 1;
```

### Test 2: Use Token to Access Protected Route
```bash
GET /api/v1/protected-route
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 3: Refresh Token
```bash
POST /api/v1/auth/refresh
Body: { "refresh_token": "..." }

# Should return new access token
```

### Test 4: Logout (Revoke Token)
```bash
POST /api/v1/auth/logout
Headers: {
  "Authorization": "Bearer ..."
}

# Check database - token should be revoked
SELECT is_revoked, revoked_at FROM tokens WHERE user_id = 1;
```

---

## 📝 Implementation Checklist

- [ ] Create tokens table in database
- [ ] Run `npx prisma db pull`
- [ ] Run `npx prisma generate`
- [ ] Install `@nestjs/jwt` package
- [ ] Add JWT secrets to `.env`
- [ ] Create JWT service for token generation
- [ ] Update auth service to generate tokens on login
- [ ] Create JWT guard for protected routes
- [ ] Implement token verification middleware
- [ ] Add refresh token endpoint
- [ ] Add logout endpoint (revoke token)
- [ ] Add cleanup job for expired tokens

---

## 🎉 Benefits

1. **Stateless Authentication** - No session storage needed
2. **Scalable** - Works across multiple servers
3. **Secure** - Tokens can be revoked
4. **Trackable** - Know who's logged in from where
5. **Flexible** - Support multiple devices
6. **Auditable** - Complete token history

---

## 🚀 Next Steps

After creating the table:

1. **Install JWT package:**
   ```bash
   npm install @nestjs/jwt
   ```

2. **Create JWT module and service**
3. **Update auth service to generate tokens**
4. **Create auth guard for protected routes**
5. **Test token generation and verification**

The SQL file is ready at: **`d:/pg-mobile-app/api/prisma/tokens_table.sql`**
