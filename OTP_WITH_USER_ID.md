# OTP Table with User ID Foreign Key

## ✅ Updated Table Structure

The `otp_verifications` table now includes a **`user_id`** foreign key that links to the `users` table.

### Key Benefits

1. **Data Integrity** - Ensures OTP records are linked to valid users
2. **Cascade Delete** - When a user is deleted, their OTP records are automatically removed
3. **Better Queries** - Can easily fetch all OTP attempts for a specific user
4. **Audit Trail** - Track which user requested which OTP
5. **Analytics** - Analyze OTP usage patterns per user

---

## 📊 Table Relationships

```
users (s_no) ←──── otp_verifications (user_id)
     1                      Many
```

- One user can have many OTP verification records
- Each OTP record belongs to one user
- When user is deleted, all their OTP records are deleted (CASCADE)

---

## 🔍 Example Queries

### Get all OTP attempts for a user
```sql
SELECT * FROM otp_verifications 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Get user details with their latest OTP
```sql
SELECT u.*, o.otp, o.created_at, o.is_verified
FROM users u
LEFT JOIN otp_verifications o ON u.s_no = o.user_id
WHERE u.s_no = 1
ORDER BY o.created_at DESC
LIMIT 1;
```

### Count OTP requests per user (last 24 hours)
```sql
SELECT u.name, u.phone, COUNT(o.s_no) as otp_count
FROM users u
LEFT JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY u.s_no, u.name, u.phone
ORDER BY otp_count DESC;
```

### Find users with failed OTP attempts
```sql
SELECT u.name, u.phone, o.attempts, o.created_at
FROM users u
INNER JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.is_verified = FALSE AND o.attempts >= 3
ORDER BY o.created_at DESC;
```

---

## 🔧 Prisma Usage

### Create OTP with user relation
```typescript
await prisma.otp_verifications.create({
  data: {
    user_id: user.s_no,
    phone: '918248449609',
    otp: '1234',
    expires_at: new Date(Date.now() + 5 * 60 * 1000),
  },
});
```

### Query OTP with user details
```typescript
const otpRecord = await prisma.otp_verifications.findFirst({
  where: {
    phone: '918248449609',
    is_verified: false,
  },
  include: {
    user: {
      select: {
        s_no: true,
        name: true,
        email: true,
        role_id: true,
      },
    },
  },
});
```

### Get user with all OTP attempts
```typescript
const user = await prisma.user.findUnique({
  where: { s_no: 1 },
  include: {
    otp_verifications: {
      orderBy: { created_at: 'desc' },
      take: 10,
    },
  },
});
```

---

## 🎯 Use Cases

### 1. Security Monitoring
Track suspicious OTP activity per user:
```typescript
async getUserOtpStats(userId: number) {
  const stats = await prisma.otp_verifications.groupBy({
    by: ['is_verified'],
    where: {
      user_id: userId,
      created_at: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    _count: true,
  });
  return stats;
}
```

### 2. Rate Limiting
Prevent OTP spam per user:
```typescript
async checkOtpRateLimit(userId: number): Promise<boolean> {
  const count = await prisma.otp_verifications.count({
    where: {
      user_id: userId,
      created_at: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });
  
  return count < 5; // Max 5 OTPs per hour
}
```

### 3. User OTP History
```typescript
async getUserOtpHistory(userId: number) {
  return await prisma.otp_verifications.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 20,
    select: {
      s_no: true,
      phone: true,
      is_verified: true,
      attempts: true,
      created_at: true,
      verified_at: true,
      ip_address: true,
    },
  });
}
```

---

## 🔐 Enhanced Security Features

With `user_id`, you can implement:

1. **Per-User Rate Limiting** - Limit OTP requests per user
2. **Suspicious Activity Detection** - Flag users with too many failed attempts
3. **Account Lockout** - Temporarily lock accounts after multiple failures
4. **Audit Logging** - Track all OTP activity per user
5. **User Behavior Analysis** - Identify patterns and anomalies

---

## 📈 Analytics Queries

### Daily OTP statistics
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_otps,
  SUM(is_verified) as verified,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(attempts) as avg_attempts
FROM otp_verifications
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top users by OTP requests
```sql
SELECT 
  u.name,
  u.phone,
  COUNT(o.s_no) as total_requests,
  SUM(o.is_verified) as successful,
  AVG(o.attempts) as avg_attempts
FROM users u
INNER JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.s_no, u.name, u.phone
ORDER BY total_requests DESC
LIMIT 10;
```

---

## 🚀 Migration from Old Schema

If you already have an `otp_verifications` table without `user_id`:

```sql
-- Add user_id column
ALTER TABLE otp_verifications 
ADD COLUMN user_id INT NULL AFTER s_no;

-- Add index
ALTER TABLE otp_verifications 
ADD INDEX idx_user_id (user_id);

-- Add foreign key constraint
ALTER TABLE otp_verifications 
ADD CONSTRAINT fk_otp_user 
FOREIGN KEY (user_id) REFERENCES users (s_no) 
ON DELETE CASCADE ON UPDATE RESTRICT;

-- Update existing records (match by phone)
UPDATE otp_verifications o
INNER JOIN users u ON o.phone = u.phone
SET o.user_id = u.s_no
WHERE o.user_id IS NULL;
```

---

## ✅ Checklist

- [x] SQL table includes `user_id` column
- [x] Foreign key constraint added
- [x] Prisma schema updated with relation
- [x] Auth service updated to store `user_id`
- [x] Indexes created for performance
- [ ] Run SQL to create table
- [ ] Run `npx prisma db pull`
- [ ] Run `npx prisma generate`
- [ ] Test OTP creation with user_id
- [ ] Verify cascade delete works

---

## 🎉 Summary

Adding `user_id` to the OTP table provides:
- ✅ Better data integrity
- ✅ Enhanced security tracking
- ✅ Powerful analytics capabilities
- ✅ Easier debugging and monitoring
- ✅ Production-ready architecture
