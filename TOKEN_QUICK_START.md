# 🚀 Quick Start - JWT Token Table

## Copy & Run This SQL Query

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

## After Creating the Table

```bash
# Install JWT package
npm install @nestjs/jwt

# Sync Prisma
npx prisma db pull
npx prisma generate
```

## Add to .env

```env
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
```

## Table Features

✅ **user_id** - Links to users table (foreign key)
✅ **access_token** - JWT token for authentication
✅ **refresh_token** - For token renewal
✅ **expires_at** - Token expiration time
✅ **is_revoked** - Logout functionality
✅ **ip_address** - Track user location
✅ **user_agent** - Track device/browser
✅ **device_info** - Additional device details (JSON)
✅ **last_used_at** - Track token usage

## What's Next?

After running the SQL:
1. ✅ Table created with foreign key to users
2. ⬜ Install @nestjs/jwt package
3. ⬜ Update auth service to generate tokens
4. ⬜ Return token in login response
5. ⬜ Create auth guard for protected routes

That's it! 🎉
