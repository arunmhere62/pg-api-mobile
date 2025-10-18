# 🚀 Quick Start - OTP Table Setup

## Copy & Run This SQL Query

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

## After Creating the Table

Run these commands:

```bash
# Pull the new table into Prisma schema
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Start the server
npm run start:dev
```

## Test the API

### 1. Send OTP
```
POST http://localhost:3000/api/v1/auth/send-otp
Body: { "phone": "918248449609" }
```

### 2. Verify OTP
```
POST http://localhost:3000/api/v1/auth/verify-otp
Body: { "phone": "918248449609", "otp": "1234" }
```

## Files Created

✅ `prisma/otp_table.sql` - SQL file to create table
✅ `prisma/schema.prisma` - Updated with otp_verifications model
✅ `src/modules/auth/auth-db.service.ts` - Database version of auth service
✅ `OTP_SETUP_GUIDE.md` - Complete documentation

## Current Status

- ✅ In-memory OTP service (working)
- ✅ Database OTP service (ready to use)
- ✅ SQL table schema (ready to execute)
- ✅ Prisma schema updated

## Choose Your Version

### Option 1: Keep In-Memory (Current - Simple)
- No database changes needed
- Works immediately
- Lost on server restart

### Option 2: Switch to Database (Recommended)
1. Run the SQL query above
2. Run `npx prisma db pull`
3. Run `npx prisma generate`
4. Update `auth.module.ts` to use `AuthDbService`

That's it! 🎉
