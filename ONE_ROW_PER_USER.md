# One Row Per User - OTP Table Design

## 🎯 Concept

**One user = One row in `otp_verifications` table**

Instead of creating multiple OTP records for the same user, we **UPDATE** the existing row each time a new OTP is requested.

---

## 📊 How It Works

### First Time User Requests OTP
```sql
-- No record exists for user_id = 1
INSERT INTO otp_verifications (user_id, phone, otp, expires_at, ...)
VALUES (1, '918248449609', '1234', '2025-10-18 13:55:00', ...);
```
✅ **Creates new row**

---

### User Requests OTP Again
```sql
-- Record exists for user_id = 1
UPDATE otp_verifications 
SET otp = '5678',
    is_verified = FALSE,
    attempts = 0,
    expires_at = '2025-10-18 14:00:00',
    verified_at = NULL,
    updated_at = NOW()
WHERE user_id = 1;
```
✅ **Updates existing row**  
✅ **Resets verification status**  
✅ **Resets attempts counter**  
✅ **New expiry time**

---

## 🔄 Complete Flow

### Scenario 1: New User
```
User (ID: 1) requests OTP
    ↓
Check if record exists for user_id = 1 ❌
    ↓
CREATE new record
    ↓
Send SMS with OTP
```

**Database:**
```
s_no | user_id | phone        | otp  | is_verified | attempts | expires_at
-----|---------|--------------|------|-------------|----------|-------------------
1    | 1       | 918248449609 | 1234 | false       | 0        | 2025-10-18 13:55
```

---

### Scenario 2: Existing User Requests OTP Again
```
User (ID: 1) requests OTP again
    ↓
Check if record exists for user_id = 1 ✅
    ↓
UPDATE existing record
    ↓
Send SMS with new OTP
```

**Database (same row updated):**
```
s_no | user_id | phone        | otp  | is_verified | attempts | expires_at
-----|---------|--------------|------|-------------|----------|-------------------
1    | 1       | 918248449609 | 5678 | false       | 0        | 2025-10-18 14:00
```

---

### Scenario 3: User Verifies OTP
```
User submits OTP
    ↓
Verify OTP matches
    ↓
UPDATE is_verified = TRUE
    ↓
Set verified_at timestamp
```

**Database:**
```
s_no | user_id | phone        | otp  | is_verified | attempts | verified_at
-----|---------|--------------|------|-------------|----------|-------------------
1    | 1       | 918248449609 | 5678 | true        | 0        | 2025-10-18 13:52
```

---

## 💡 Benefits

### 1. **Clean Database**
- No duplicate records per user
- Easy to track user's OTP history
- One row = one user's current OTP status

### 2. **Simple Queries**
```sql
-- Get user's current OTP
SELECT * FROM otp_verifications WHERE user_id = 1;

-- Check if user has verified OTP
SELECT is_verified FROM otp_verifications WHERE user_id = 1;
```

### 3. **No Cleanup Needed**
- No need to delete old OTP records
- Always just one record per user
- Database stays small

### 4. **Easy Tracking**
- See user's last OTP request time (`updated_at`)
- Track verification status
- Monitor failed attempts

---

## 📋 What Gets Updated

When user requests new OTP, these fields are updated:

| Field | Updated To |
|-------|------------|
| `otp` | New 4-digit code |
| `is_verified` | `false` |
| `attempts` | `0` (reset) |
| `expires_at` | Current time + 5 minutes |
| `verified_at` | `null` |
| `ip_address` | Current request IP |
| `user_agent` | Current device info |
| `updated_at` | Current timestamp |

---

## 🔍 Query Examples

### Check if user has active OTP
```sql
SELECT * FROM otp_verifications 
WHERE user_id = 1 
  AND is_verified = FALSE 
  AND expires_at > NOW();
```

### Get all users with unverified OTPs
```sql
SELECT u.name, u.phone, o.otp, o.expires_at
FROM users u
INNER JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.is_verified = FALSE
  AND o.expires_at > NOW();
```

### Find users who verified OTP today
```sql
SELECT u.name, u.phone, o.verified_at
FROM users u
INNER JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.is_verified = TRUE
  AND DATE(o.verified_at) = CURDATE();
```

### Users with failed attempts
```sql
SELECT u.name, u.phone, o.attempts
FROM users u
INNER JOIN otp_verifications o ON u.s_no = o.user_id
WHERE o.attempts >= 3;
```

---

## 🎯 Code Logic

```typescript
// Check if user already has an OTP record
const existingOtp = await prisma.otp_verifications.findFirst({
  where: { user_id: user.s_no }
});

if (existingOtp) {
  // UPDATE existing record
  await prisma.otp_verifications.update({
    where: { s_no: existingOtp.s_no },
    data: {
      otp: newOtp,
      is_verified: false,
      attempts: 0,
      expires_at: newExpiryTime,
      verified_at: null,
      // ... other fields
    }
  });
} else {
  // CREATE new record (first time)
  await prisma.otp_verifications.create({
    data: {
      user_id: user.s_no,
      phone: user.phone,
      otp: newOtp,
      expires_at: newExpiryTime,
      // ... other fields
    }
  });
}
```

---

## 📊 Database Size Comparison

### Multiple Rows Per User (Old Approach)
```
100 users × 10 OTP requests each = 1,000 rows
1,000 users × 10 OTP requests each = 10,000 rows
```

### One Row Per User (New Approach)
```
100 users × 1 row each = 100 rows
1,000 users × 1 row each = 1,000 rows
```

**Result:** 90% smaller database! 🎉

---

## ✅ Summary

| Aspect | Behavior |
|--------|----------|
| **First OTP Request** | Creates new row |
| **Subsequent Requests** | Updates same row |
| **Verification** | Updates `is_verified = true` |
| **Resend OTP** | Updates same row with new OTP |
| **Database Growth** | Linear (1 row per user) |
| **Cleanup Required** | No |

---

## 🚀 Testing

### Test 1: First Time User
```bash
POST /api/v1/auth/send-otp
Body: { "phone": "918248449609" }

# Check database
SELECT * FROM otp_verifications WHERE user_id = 1;
# Should see 1 row
```

### Test 2: Same User Requests Again
```bash
POST /api/v1/auth/send-otp
Body: { "phone": "918248449609" }

# Check database
SELECT * FROM otp_verifications WHERE user_id = 1;
# Should still see 1 row (updated)
# Check updated_at timestamp - should be recent
```

### Test 3: Multiple Requests
```bash
# Request OTP 5 times
POST /api/v1/auth/send-otp (5 times)

# Check database
SELECT COUNT(*) FROM otp_verifications WHERE user_id = 1;
# Should return: 1 (not 5!)
```

---

## 🎉 Result

- ✅ One row per user
- ✅ Clean database
- ✅ Easy to query
- ✅ No duplicate records
- ✅ Automatic updates
- ✅ Scalable design
