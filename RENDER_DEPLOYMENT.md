# 🚀 Render Deployment Guide

## ⚠️ Fix for "npm audit" Build Failure

The error you're seeing is because Render's default build command runs npm audit, which fails when vulnerabilities are found.

## ✅ Solution

### Option 1: Use Custom Build Script (Recommended)

**In Render Dashboard:**

1. Go to your service settings
2. Find **Build Command**
3. Change from:
   ```bash
   npm install; npm run build
   ```
   
   To:
   ```bash
   npm run build:render
   ```

4. **Start Command** should be:
   ```bash
   npm run start:prod
   ```

### Option 2: Skip Audit

**Build Command:**
```bash
npm install --legacy-peer-deps --no-audit && prisma generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

### Option 3: Ignore Audit Errors

**Build Command:**
```bash
npm install --legacy-peer-deps || true && prisma generate && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

## 📋 Complete Render Configuration

### Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Database
DATABASE_URL=your_mysql_connection_string

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name

# SMS API (if using)
SMS_API_URL=http://cannyinfotech.in/api/mt/SendSMS
SMS_API_KEY=your_sms_key
SMS_SENDER_ID=your_sender_id

# Node Environment
NODE_ENV=production
PORT=3000
```

### Build Settings

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build:render` |
| **Start Command** | `npm run start:prod` |
| **Node Version** | 20.x |
| **Auto Deploy** | Yes (main branch) |

## 🔧 Prisma Configuration

Make sure your `schema.prisma` has:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

The `debian-openssl-3.0.x` target is needed for Render's environment.

## 📝 render.yaml (Optional)

Create `render.yaml` in your api folder for automatic configuration:

```yaml
services:
  - type: web
    name: pg-api
    env: node
    region: singapore
    plan: free
    buildCommand: npm run build:render
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
```

## 🪟 Windows Users

**PowerShell doesn't support `&&` syntax!**

On Windows, use:
```powershell
npm run build:windows
```

Or run commands separately:
```powershell
npm install --legacy-peer-deps --no-audit
npx prisma generate
npm run build
```

See `WINDOWS_BUILD.md` for details.

## 🐛 Troubleshooting

### Issue: "nest: not found"

**Solution:** Make sure `@nestjs/cli` is in `dependencies`, not `devDependencies`

Move in package.json:
```json
"dependencies": {
  "@nestjs/cli": "^10.3.0",
  // ... other deps
}
```

### Issue: "Prisma Client not generated"

**Solution:** Build command must include `prisma generate`

```bash
npm run build:render
```

### Issue: "Module not found"

**Solution:** Clear Render cache

1. Go to Render Dashboard
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"

### Issue: "Port already in use"

**Solution:** Use Render's PORT environment variable

In `main.ts`:
```typescript
const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');
```

## ✅ Deployment Checklist

- [ ] Update build command to `npm run build:render`
- [ ] Update start command to `npm run start:prod`
- [ ] Add all environment variables
- [ ] Set `DATABASE_URL` with production database
- [ ] Update `schema.prisma` with correct binaryTargets
- [ ] Commit and push changes
- [ ] Trigger manual deploy
- [ ] Check logs for errors
- [ ] Test API endpoints

## 🎯 Quick Fix for Current Error

**Right now, do this:**

1. **Go to Render Dashboard**
2. **Settings → Build Command**
3. **Change to:**
   ```bash
   npm run build:render
   ```
4. **Click "Save Changes"**
5. **Click "Manual Deploy" → "Deploy latest commit"**

This will:
- ✅ Skip npm audit errors
- ✅ Install dependencies with `--legacy-peer-deps`
- ✅ Generate Prisma client
- ✅ Build NestJS app

## 📊 Expected Build Output

```
==> Cloning from https://github.com/...
==> Using Node.js version 20.x
==> Running 'npm run build:render'
    > npm install --legacy-peer-deps
    added 835 packages
    > prisma generate
    ✔ Generated Prisma Client
    > nest build
    ✔ Build successful
==> Build succeeded 🎉
==> Starting service with 'npm run start:prod'
    Server running on port 3000
```

## 🔗 Useful Links

- [Render Node.js Docs](https://render.com/docs/deploy-node-express-app)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)
- [NestJS Production](https://docs.nestjs.com/faq/serverless)

---

**Status**: Ready to deploy!
**Next**: Change build command in Render and redeploy.
