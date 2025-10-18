# 🎯 Environment-Based Configuration (Strategy Pattern)

## 📋 Overview

The application uses the **Strategy Pattern** to automatically configure different settings based on the environment (development/production).

---

## 🏗️ Architecture

```
src/config/
├── app.config.ts       # Main app configuration with environment strategies
├── jwt.config.ts       # JWT secrets configuration
└── index.ts            # Configuration loader
```

---

## ⚙️ Configuration Strategy

### Development Mode (`NODE_ENV=development`)
```typescript
{
  otpExpiryMinutes: 60,        // 1 hour
  otpMaxAttempts: 5,           // 5 attempts
  jwtAccessTokenExpiry: '2d',  // 2 days
  jwtRefreshTokenExpiry: '30d' // 30 days
}
```

### Production Mode (`NODE_ENV=production`)
```typescript
{
  otpExpiryMinutes: 5,         // 5 minutes
  otpMaxAttempts: 3,           // 3 attempts
  jwtAccessTokenExpiry: '1h',  // 1 hour
  jwtRefreshTokenExpiry: '7d'  // 7 days
}
```

---

## 🎨 Design Pattern: Strategy Pattern

### Why Strategy Pattern?

The Strategy Pattern allows us to:
1. **Encapsulate** different behaviors (dev vs prod)
2. **Switch** strategies at runtime based on environment
3. **Extend** easily by adding new environments (staging, testing, etc.)
4. **Maintain** centralized configuration

### Implementation

```typescript
// Strategy Interface (implicitly defined by AuthConfig)
interface AuthConfig {
  otpExpiryMinutes: number;
  otpMaxAttempts: number;
  jwtAccessTokenExpiry: string;
  jwtRefreshTokenExpiry: string;
}

// Strategy Selection
const getAuthConfig = (): AuthConfig => {
  if (isDevelopment) {
    return developmentStrategy();
  } else {
    return productionStrategy();
  }
};
```

---

## 📁 File Structure

### 1. **app.config.ts** (Main Configuration)
```typescript
export default registerAs('app', (): AppConfiguration => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  
  // Strategy Pattern: Select config based on environment
  const getAuthConfig = (): AuthConfig => {
    if (isDevelopment) {
      return {
        otpExpiryMinutes: 60,
        otpMaxAttempts: 5,
        jwtAccessTokenExpiry: '2d',
        jwtRefreshTokenExpiry: '30d',
      };
    } else {
      return {
        otpExpiryMinutes: 5,
        otpMaxAttempts: 3,
        jwtAccessTokenExpiry: '1h',
        jwtRefreshTokenExpiry: '7d',
      };
    }
  };

  return {
    nodeEnv,
    isDevelopment,
    isProduction,
    auth: getAuthConfig(),
  };
});
```

### 2. **jwt.config.ts** (JWT Secrets)
```typescript
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
}));
```

### 3. **Usage in Services**
```typescript
@Injectable()
export class AuthDbService {
  private readonly OTP_EXPIRY_MINUTES: number;
  private readonly MAX_ATTEMPTS: number;

  constructor(private configService: ConfigService) {
    // Automatically gets correct values based on environment
    this.OTP_EXPIRY_MINUTES = this.configService.get<number>('app.auth.otpExpiryMinutes');
    this.MAX_ATTEMPTS = this.configService.get<number>('app.auth.otpMaxAttempts');
  }
}
```

---

## 🚀 How to Use

### Set Environment in `.env`

```env
# For Development (longer expiry, easier testing)
NODE_ENV=development

# For Production (shorter expiry, more secure)
NODE_ENV=production

# JWT Secrets (same for both environments)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### Automatic Configuration

The app automatically selects the right configuration:

```bash
# Development Mode
NODE_ENV=development npm run start:dev
# → OTP expires in 1 hour
# → JWT expires in 2 days

# Production Mode
NODE_ENV=production npm start
# → OTP expires in 5 minutes
# → JWT expires in 1 hour
```

---

## 📊 Configuration Access

### In Services

```typescript
// Get OTP expiry
const otpExpiry = this.configService.get<number>('app.auth.otpExpiryMinutes');

// Get JWT expiry
const jwtExpiry = this.configService.get<string>('app.auth.jwtAccessTokenExpiry');

// Get JWT secret
const secret = this.configService.get<string>('jwt.secret');

// Check environment
const isDev = this.configService.get<boolean>('app.isDevelopment');
```

---

## 🎯 Benefits

### 1. **Centralized Configuration**
- All settings in one place
- Easy to modify
- No hardcoded values

### 2. **Environment-Aware**
- Automatic switching based on NODE_ENV
- No manual configuration changes
- Consistent across deployments

### 3. **Developer-Friendly**
- Longer expiry in development
- More attempts for testing
- Easier debugging

### 4. **Production-Ready**
- Shorter expiry for security
- Limited attempts to prevent abuse
- Best practices enforced

### 5. **Extensible**
- Easy to add new environments (staging, testing)
- Easy to add new configuration options
- Follows SOLID principles

---

## 🔧 Adding New Environments

To add a staging environment:

```typescript
const getAuthConfig = (): AuthConfig => {
  if (isDevelopment) {
    return { /* dev config */ };
  } else if (isStaging) {
    return {
      otpExpiryMinutes: 10,
      otpMaxAttempts: 4,
      jwtAccessTokenExpiry: '12h',
      jwtRefreshTokenExpiry: '14d',
    };
  } else {
    return { /* prod config */ };
  }
};
```

---

## 📝 Current Settings

| Setting | Development | Production |
|---------|-------------|------------|
| **OTP Expiry** | 60 minutes | 5 minutes |
| **OTP Max Attempts** | 5 | 3 |
| **JWT Access Token** | 2 days | 1 hour |
| **JWT Refresh Token** | 30 days | 7 days |

---

## 🧪 Testing

### Test Development Mode
```bash
# Set in .env
NODE_ENV=development

# Restart server
npm run start:dev

# Request OTP - expires in 1 hour
# Login - token expires in 2 days
```

### Test Production Mode
```bash
# Set in .env
NODE_ENV=production

# Restart server
npm start

# Request OTP - expires in 5 minutes
# Login - token expires in 1 hour
```

---

## ✅ Implementation Checklist

- [x] Created `src/config/app.config.ts`
- [x] Created `src/config/jwt.config.ts`
- [x] Created `src/config/index.ts`
- [x] Updated `app.module.ts` to load configurations
- [x] Updated `auth-db.service.ts` to use config
- [x] Updated `jwt.service.ts` to use config
- [x] Updated `auth.module.ts` to use config
- [x] Implemented Strategy Pattern for environment-based config
- [ ] Set `NODE_ENV=development` in `.env`
- [ ] Test with development settings
- [ ] Test with production settings

---

## 🎉 Summary

✅ **Strategy Pattern** implemented for environment-based configuration
✅ **Development Mode**: OTP = 1 hour, JWT = 2 days
✅ **Production Mode**: OTP = 5 minutes, JWT = 1 hour
✅ **Centralized** configuration in `src/config/`
✅ **Automatic** switching based on `NODE_ENV`
✅ **Extensible** for future environments
