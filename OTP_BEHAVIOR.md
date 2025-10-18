# OTP Behavior - How It Works

## 📋 Updated Logic

### 1. **Send OTP** (`POST /api/v1/auth/send-otp`)

**Behavior:**
- ✅ Checks if user exists and is active
- ✅ **NEW:** Checks if there's already an active (unverified & not expired) OTP
- ✅ **If active OTP exists:** Returns message without creating new OTP or sending SMS
- ✅ **If no active OTP:** Creates new OTP and sends SMS

**Example Responses:**

#### When OTP already exists:
```json
{
  "success": true,
  "message": "OTP already sent. Please check your SMS or wait 4 minute(s) to request a new one.",
  "data": {
    "phone": "918248449609",
    "expiresIn": "4 minute(s)",
    "canResendAfter": "2025-10-18T08:15:00.000Z"
  }
}
```

#### When new OTP is created:
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

---

### 2. **Resend OTP** (`POST /api/v1/auth/resend-otp`)

**Behavior:**
- ✅ **Forces invalidation** of ALL existing OTPs for the phone
- ✅ Creates a new OTP
- ✅ Sends SMS with new OTP

**Use this when:**
- User didn't receive the SMS
- User wants a new OTP immediately
- Previous OTP is still active but user needs a new one

---

### 3. **Verify OTP** (`POST /api/v1/auth/verify-otp`)

**Behavior:**
- ✅ Finds the latest unverified OTP for the phone
- ✅ Checks if OTP is expired
- ✅ Checks if max attempts (3) exceeded
- ✅ Verifies the OTP code
- ✅ Marks OTP as verified on success
- ✅ Returns user details on successful verification

---

## 🔄 Flow Diagram

### Scenario 1: First Time OTP Request
```
User requests OTP
    ↓
Check if user exists ✅
    ↓
Check for active OTP ❌ (None found)
    ↓
Create new OTP
    ↓
Send SMS ✅
    ↓
Return success
```

### Scenario 2: OTP Already Sent (Still Active)
```
User requests OTP again
    ↓
Check if user exists ✅
    ↓
Check for active OTP ✅ (Found, not expired)
    ↓
Return "OTP already sent" message
    ↓
NO new OTP created
    ↓
NO SMS sent
```

### Scenario 3: User Clicks "Resend OTP"
```
User clicks Resend
    ↓
Invalidate ALL existing OTPs
    ↓
Create new OTP
    ↓
Send SMS ✅
    ↓
Return success
```

---

## 📊 Database States

### Active OTP
```sql
SELECT * FROM otp_verifications 
WHERE phone = '918248449609' 
  AND is_verified = FALSE 
  AND expires_at > NOW();
```

### Expired OTP
```sql
SELECT * FROM otp_verifications 
WHERE phone = '918248449609' 
  AND is_verified = FALSE 
  AND expires_at <= NOW();
```

### Verified OTP
```sql
SELECT * FROM otp_verifications 
WHERE phone = '918248449609' 
  AND is_verified = TRUE;
```

---

## 🎯 Benefits

### 1. **Prevents SMS Spam**
- Won't send multiple OTPs if one is already active
- Saves SMS costs
- Better user experience

### 2. **Clear User Feedback**
- User knows if OTP was already sent
- Shows remaining time before they can request new one
- Reduces confusion

### 3. **Resend Option**
- Dedicated resend endpoint for when user needs new OTP
- Forces creation of new OTP even if old one is active
- Useful when SMS is delayed or not received

---

## 🧪 Testing Scenarios

### Test 1: Normal Flow
```bash
# 1. Send OTP (should create new OTP)
POST /api/v1/auth/send-otp
Body: { "phone": "918248449609" }
Response: "OTP sent successfully"

# 2. Send OTP again immediately (should return "already sent")
POST /api/v1/auth/send-otp
Body: { "phone": "918248449609" }
Response: "OTP already sent. Please check your SMS..."

# 3. Verify OTP
POST /api/v1/auth/verify-otp
Body: { "phone": "918248449609", "otp": "1234" }
Response: "Login successful"

# 4. Send OTP again (should create new OTP since previous was verified)
POST /api/v1/auth/send-otp
Body: { "phone": "918248449609" }
Response: "OTP sent successfully"
```

### Test 2: Resend Flow
```bash
# 1. Send OTP
POST /api/v1/auth/send-otp
Response: "OTP sent successfully"

# 2. Resend OTP (forces new OTP)
POST /api/v1/auth/resend-otp
Body: { "phone": "918248449609" }
Response: "OTP sent successfully"

# 3. Old OTP won't work, only new OTP works
POST /api/v1/auth/verify-otp
Body: { "phone": "918248449609", "otp": "old_otp" }
Response: "Invalid OTP"

POST /api/v1/auth/verify-otp
Body: { "phone": "918248449609", "otp": "new_otp" }
Response: "Login successful"
```

### Test 3: Expiry Flow
```bash
# 1. Send OTP
POST /api/v1/auth/send-otp
Response: "OTP sent successfully"

# 2. Wait 5+ minutes

# 3. Send OTP again (should create new OTP since old one expired)
POST /api/v1/auth/send-otp
Response: "OTP sent successfully"
```

---

## 💡 Configuration

Current settings in `auth-db.service.ts`:

```typescript
private readonly OTP_EXPIRY_MINUTES = 5;  // OTP valid for 5 minutes
private readonly MAX_ATTEMPTS = 3;         // Max 3 verification attempts
```

You can adjust these values as needed.

---

## 🔐 Security Features

1. **No Duplicate Active OTPs** - Only one active OTP per phone at a time
2. **Time-based Expiry** - OTPs expire after 5 minutes
3. **Attempt Limiting** - Max 3 verification attempts per OTP
4. **Auto Invalidation** - Old OTPs marked as verified when new one created
5. **User Validation** - Only active, non-deleted users can request OTP

---

## 📝 Summary

| Endpoint | Creates New OTP? | Sends SMS? | Invalidates Old OTP? |
|----------|------------------|------------|----------------------|
| `send-otp` | Only if no active OTP exists | Only if creating new OTP | Only expired ones |
| `resend-otp` | Always | Always | ALL (including active) |
| `verify-otp` | No | No | Marks current as verified |

---

## ✅ Checklist

- [x] Check for existing active OTP before creating new one
- [x] Return appropriate message when OTP already exists
- [x] Resend endpoint forces new OTP creation
- [x] Expired OTPs are invalidated automatically
- [x] User gets clear feedback about OTP status
- [x] SMS costs reduced by preventing duplicate sends
