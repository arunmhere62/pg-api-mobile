# OTP Strategy Pattern - Development Bypass

## 🎯 Overview

Implemented a **Strategy Pattern** for OTP verification that allows:
- **Production**: Real SMS sending only
- **Development**: Bypass OTP `12345` for easy testing

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│     OtpStrategyFactory              │
│  (Selects strategy based on env)    │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ Production   │  │  Development     │
│ Strategy     │  │  Strategy        │
│              │  │                  │
│ - Real SMS   │  │ - Bypass: 12345  │
│ - Strict     │  │ - Real SMS too   │
└──────────────┘  └──────────────────┘
```

## 📁 Files Created

```
src/modules/auth/strategies/
├── otp-strategy.interface.ts          # Interface definition
├── production-otp.strategy.ts         # Production strategy
├── development-otp.strategy.ts        # Development strategy (bypass)
└── otp-strategy.factory.ts            # Factory to select strategy
```

## 🔧 Configuration

### Environment Variable

The strategy is selected based on `NODE_ENV`:

```env
# .env file
NODE_ENV=development  # Uses DevelopmentOtpStrategy (bypass enabled)
NODE_ENV=production   # Uses ProductionOtpStrategy (strict)
```

## 🚀 Usage

### Development Mode (NODE_ENV=development)

**Bypass OTP: `12345`**

1. **Request OTP:**
   ```bash
   POST /api/v1/auth/send-otp
   {
     "phone": "8248449609"
   }
   ```

2. **Login with Bypass OTP:**
   ```bash
   POST /api/v1/auth/verify-otp
   {
     "phone": "8248449609",
     "otp": "12345"  # ← Bypass OTP (always works)
   }
   ```

3. **Or use the real OTP** (if SMS was sent successfully)

### Production Mode (NODE_ENV=production)

Only the real OTP sent via SMS will work. Bypass OTP `12345` will NOT work.

## 📊 Console Logs

### Development Mode

```
[OtpStrategyFactory] ⚠️  Using DEVELOPMENT OTP Strategy - Bypass OTP: 12345
[OtpStrategyFactory] OTP Strategy: Development

[DevelopmentOtpStrategy] [DEVELOPMENT] Sending OTP to 8248449609
[DevelopmentOtpStrategy] [DEVELOPMENT] Generated OTP: 4567
[DevelopmentOtpStrategy] [DEVELOPMENT] Bypass OTP: 12345

[DevelopmentOtpStrategy] [DEVELOPMENT] Verifying OTP for 8248449609
[DevelopmentOtpStrategy] [DEVELOPMENT] Provided OTP: 12345
[DevelopmentOtpStrategy] [DEVELOPMENT] Stored OTP: 4567
[DevelopmentOtpStrategy] [DEVELOPMENT] Bypass OTP: 12345
[DevelopmentOtpStrategy] [DEVELOPMENT] ✅ Bypass OTP used - Login allowed
```

### Production Mode

```
[OtpStrategyFactory] 🔒 Using PRODUCTION OTP Strategy - Real SMS only
[OtpStrategyFactory] OTP Strategy: Production

[ProductionOtpStrategy] [PRODUCTION] Sending real SMS to 8248449609
[ProductionOtpStrategy] [PRODUCTION] Verifying OTP for 8248449609
```

## 🔐 Security Features

### Development Strategy
- ✅ Bypass OTP `12345` always works
- ✅ Real OTP also works (if SMS sent)
- ✅ SMS sending failure doesn't block login
- ⚠️  Logs show bypass OTP in console

### Production Strategy
- ✅ Only real OTP works
- ✅ No bypass OTP
- ✅ SMS must be sent successfully
- ✅ Strict validation

## 🧪 Testing

### Test Bypass OTP (Development)

1. **Set environment:**
   ```env
   NODE_ENV=development
   ```

2. **Restart backend:**
   ```bash
   npm run start:dev
   ```

3. **Check console for:**
   ```
   ⚠️  Using DEVELOPMENT OTP Strategy - Bypass OTP: 12345
   ```

4. **Request OTP for any phone number**

5. **Login with `12345`** - Should work!

### Test Production Mode

1. **Set environment:**
   ```env
   NODE_ENV=production
   ```

2. **Restart backend**

3. **Check console for:**
   ```
   🔒 Using PRODUCTION OTP Strategy - Real SMS only
   ```

4. **Try bypass OTP `12345`** - Should fail!

5. **Only real OTP works**

## 📝 Code Examples

### Strategy Interface

```typescript
export interface OtpStrategy {
  sendOtp(phoneNumber: string, otp: string): Promise<boolean>;
  verifyOtp(phoneNumber: string, otp: string, storedOtp: string): boolean;
  getStrategyName(): string;
}
```

### Development Strategy (Bypass)

```typescript
verifyOtp(phoneNumber: string, otp: string, storedOtp: string): boolean {
  // Accept bypass OTP (12345) OR the actual generated OTP
  if (otp === '12345') {
    this.logger.warn(`[DEVELOPMENT] ✅ Bypass OTP used - Login allowed`);
    return true;
  }

  if (otp === storedOtp) {
    this.logger.warn(`[DEVELOPMENT] ✅ Correct OTP provided`);
    return true;
  }

  return false;
}
```

### Production Strategy (Strict)

```typescript
verifyOtp(phoneNumber: string, otp: string, storedOtp: string): boolean {
  // Only accept the actual OTP
  return otp === storedOtp;
}
```

## 🎯 Benefits

1. **Easy Testing** - No need to wait for SMS in development
2. **Fast Development** - Login instantly with `12345`
3. **Production Safe** - Bypass disabled in production
4. **Flexible** - Can still test real SMS in development
5. **Clean Code** - Strategy pattern keeps code organized

## ⚠️ Important Notes

1. **Never use in production** with `NODE_ENV=development`
2. **Bypass OTP is logged** - visible in console
3. **Change bypass OTP** if needed in `development-otp.strategy.ts`
4. **SMS still sent** in development (for testing real flow)

## 🔄 How It Works

### Send OTP Flow

```
1. User requests OTP
   ↓
2. Generate random 4-digit OTP (e.g., 4567)
   ↓
3. Save to database
   ↓
4. OtpStrategyFactory selects strategy
   ↓
5a. Development: Try to send SMS (don't fail if error)
5b. Production: Must send SMS successfully
   ↓
6. Return success
```

### Verify OTP Flow

```
1. User submits OTP
   ↓
2. Fetch stored OTP from database
   ↓
3. OtpStrategyFactory selects strategy
   ↓
4a. Development: Check if OTP is "12345" OR matches stored OTP
4b. Production: Check if OTP matches stored OTP exactly
   ↓
5. If valid: Generate JWT token and login
6. If invalid: Increment attempts and reject
```

## 🚀 Quick Start

### For Development

```bash
# 1. Set environment
echo "NODE_ENV=development" >> .env

# 2. Restart backend
npm run start:dev

# 3. Login with any phone number using OTP: 12345
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "8248449609", "otp": "12345"}'
```

### For Production

```bash
# 1. Set environment
echo "NODE_ENV=production" >> .env

# 2. Restart backend
npm run start:dev

# 3. Must use real OTP sent via SMS
```

## 📊 Summary

| Feature | Development | Production |
|---------|-------------|------------|
| Bypass OTP | ✅ `12345` | ❌ Disabled |
| Real OTP | ✅ Works | ✅ Required |
| SMS Failure | ⚠️ Continues | ❌ Blocks |
| Logging | 🔊 Verbose | 🔇 Minimal |
| Security | ⚠️ Relaxed | 🔒 Strict |

---

**Status**: ✅ OTP Strategy Pattern implemented
**Bypass OTP**: `12345` (development only)
**Environment**: Controlled by `NODE_ENV`
