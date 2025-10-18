# OTP Table Setup Guide

## 📋 Table Structure

The `otp_verifications` table stores OTP records for user authentication.

### Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `s_no` | INT (PK) | Auto-increment primary key |
| `user_id` | INT (FK) | Foreign key to users table |
| `phone` | VARCHAR(15) | User's phone number |
| `otp` | VARCHAR(6) | Generated OTP code |
| `is_verified` | BOOLEAN | Whether OTP has been verified |
| `attempts` | INT | Number of verification attempts |
| `expires_at` | DATETIME | OTP expiration time |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `verified_at` | DATETIME | When OTP was verified |
| `ip_address` | VARCHAR(45) | User's IP address |
| `user_agent` | VARCHAR(255) | User's browser/device info |

### Indexes

- `idx_phone` - Fast lookup by phone number
- `idx_phone_otp` - Fast verification lookup
- `idx_expires_at` - Efficient cleanup of expired OTPs
- `idx_is_verified` - Filter verified/unverified OTPs

---

## 🚀 Setup Instructions

### Step 1: Run the SQL Query

Execute the SQL file to create the table in your database:

```sql
-- Run this in your MySQL database
SOURCE d:/pg-mobile-app/api/prisma/otp_table.sql;
```

**OR** Copy and paste this query directly:

```sql
CREATE TABLE `otp_verifications` (
  `s_no` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `attempts` INT DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verified_at` DATETIME NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  PRIMARY KEY (`s_no`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_phone_otp` (`phone`, `otp`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_is_verified` (`is_verified`),
  INDEX `idx_user_id` (`user_id`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`s_no`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 2: Generate Prisma Client

After creating the table, regenerate the Prisma client:

```bash
npx prisma db pull
npx prisma generate
```

### Step 3: Update Auth Module (Optional)

To use the database version instead of in-memory storage:

1. Open `src/modules/auth/auth.module.ts`
2. Replace `AuthService` with `AuthDbService`:

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthDbService } from './auth-db.service';  // Changed
import { SmsService } from './sms.service';

@Module({
  controllers: [AuthController],
  providers: [AuthDbService, SmsService],  // Changed
  exports: [AuthDbService, SmsService],    // Changed
})
export class AuthModule {}
```

3. Update `auth.controller.ts` to use `AuthDbService`:

```typescript
constructor(private readonly authService: AuthDbService) {}
```

---

## 🔍 How It Works

### 1. **Send OTP Flow**
```
User requests OTP
  ↓
Check if user exists
  ↓
Invalidate old OTPs (mark as verified)
  ↓
Generate new 4-digit OTP
  ↓
Save to database with expiry time
  ↓
Send SMS
  ↓
Return success
```

### 2. **Verify OTP Flow**
```
User submits OTP
  ↓
Find latest unverified OTP
  ↓
Check if expired
  ↓
Check attempts (max 3)
  ↓
Verify OTP matches
  ↓
Mark as verified
  ↓
Return user details
```

### 3. **Auto Cleanup**
Expired OTPs can be cleaned up with:
```typescript
await authDbService.cleanupExpiredOtps();
```

---

## 📊 Database vs In-Memory Comparison

| Feature | In-Memory (Current) | Database (New) |
|---------|-------------------|----------------|
| **Persistence** | Lost on restart | Permanent |
| **Scalability** | Single server only | Multi-server ready |
| **Audit Trail** | No history | Full history |
| **IP Tracking** | Not available | Available |
| **Statistics** | Not available | Available |
| **Production Ready** | ❌ No | ✅ Yes |

---

## 🛠️ Maintenance

### Clean up old OTP records

Run periodically (e.g., daily cron job):

```sql
DELETE FROM otp_verifications 
WHERE expires_at < NOW() 
OR (is_verified = TRUE AND verified_at < DATE_SUB(NOW(), INTERVAL 7 DAY));
```

### View OTP statistics

```sql
-- Total OTPs sent today
SELECT COUNT(*) as total_otps_today
FROM otp_verifications
WHERE DATE(created_at) = CURDATE();

-- Success rate
SELECT 
  COUNT(*) as total,
  SUM(is_verified) as verified,
  ROUND(SUM(is_verified) / COUNT(*) * 100, 2) as success_rate
FROM otp_verifications
WHERE DATE(created_at) = CURDATE();

-- Failed attempts
SELECT phone, COUNT(*) as failed_attempts
FROM otp_verifications
WHERE is_verified = FALSE AND attempts >= 3
GROUP BY phone;
```

---

## 🔐 Security Features

1. **OTP Expiry**: 5 minutes
2. **Max Attempts**: 3 per OTP
3. **Auto Invalidation**: Old OTPs marked as verified
4. **IP Tracking**: Track suspicious activity
5. **Audit Trail**: Complete history of all OTP requests

---

## 📝 Testing

### Test the database version:

1. **Send OTP:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "918248449609"}'
```

2. **Check database:**
```sql
SELECT * FROM otp_verifications WHERE phone = '918248449609' ORDER BY created_at DESC LIMIT 1;
```

3. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "918248449609", "otp": "1234"}'
```

4. **Check verification:**
```sql
SELECT * FROM otp_verifications WHERE phone = '918248449609' AND is_verified = TRUE;
```

---

## 🎯 Next Steps

1. ✅ Create the table in your database
2. ✅ Run `npx prisma db pull` to sync schema
3. ✅ Run `npx prisma generate` to update client
4. ⬜ Switch to `AuthDbService` in auth module
5. ⬜ Test the endpoints
6. ⬜ Set up cron job for cleanup
7. ⬜ Add JWT token generation

---

## 💡 Tips

- **Development**: Use in-memory version for faster testing
- **Production**: Always use database version
- **Monitoring**: Set up alerts for failed OTP attempts
- **Rate Limiting**: Add rate limiting to prevent abuse
- **Logging**: Log all OTP requests for security audits
