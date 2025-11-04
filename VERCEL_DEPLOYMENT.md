# 🚀 Vercel Deployment Guide for NestJS

## ⚠️ Important: Vercel vs Render

**Vercel** is designed for **serverless functions** (short-lived requests)
**Render** is designed for **long-running servers** (better for NestJS)

### Recommendation: Use Render for NestJS APIs

NestJS works better on **Render** because:
- ✅ Long-running server support
- ✅ WebSocket support
- ✅ Background jobs
- ✅ Database connections stay alive
- ✅ No cold starts

**Vercel limitations:**
- ❌ 10-second timeout per request
- ❌ Cold starts (slow first request)
- ❌ No WebSockets
- ❌ Database connections close after each request

## 🔧 If You Still Want to Use Vercel

### Step 1: Files Created

I've created:
- ✅ `vercel.json` - Vercel configuration
- ✅ `api/index.ts` - Serverless entry point

### Step 2: Install Dependencies

```bash
npm install @nestjs/platform-express express
```

### Step 3: Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```
DATABASE_URL=your_mysql_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket
NODE_ENV=production
```

### Step 4: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

## 🧪 Testing Your Deployed API

### 1. Check Deployment Status

In Vercel Dashboard:
- ✅ **Status**: Should show "Ready"
- ❌ **Error**: Check "Runtime Logs"

### 2. Test Endpoints

**A. Browser Test:**
```
https://pg-api-mobile.vercel.app/api/v1/health
```

**B. cURL Test:**
```bash
curl https://pg-api-mobile.vercel.app/api/v1/health
```

**C. Swagger Docs:**
```
https://pg-api-mobile.vercel.app/api/docs
```

### 3. Check Runtime Logs

1. Go to Vercel Dashboard
2. Click **"Runtime Logs"** tab
3. Look for errors:
   - `FUNCTION_INVOCATION_FAILED` - Code error
   - `FUNCTION_INVOCATION_TIMEOUT` - Request took > 10s
   - `MODULE_NOT_FOUND` - Missing dependency

## 🐛 Common Errors & Fixes

### Error: FUNCTION_INVOCATION_FAILED

**Cause:** Code is crashing

**Fix:**
1. Check Runtime Logs for error message
2. Common issues:
   - Database connection failed
   - Missing environment variables
   - Module not found

### Error: FUNCTION_INVOCATION_TIMEOUT

**Cause:** Request took longer than 10 seconds

**Fix:**
- ⚠️ Vercel has 10s timeout limit
- Use Render instead for long-running operations

### Error: MODULE_NOT_FOUND

**Cause:** Missing dependency

**Fix:**
```bash
npm install <missing-package>
git add .
git commit -m "Add missing dependency"
git push
```

### Error: Database Connection Failed

**Cause:** Database not accessible from Vercel

**Fix:**
1. Use **PlanetScale** or **Neon** (serverless-friendly)
2. Or use **connection pooling**:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
     relationMode = "prisma"
   }
   ```

## 📊 Vercel vs Render Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Best For** | Static sites, Next.js | APIs, NestJS |
| **Timeout** | 10 seconds | No limit |
| **Cold Start** | Yes (slow) | No |
| **WebSockets** | ❌ No | ✅ Yes |
| **Background Jobs** | ❌ No | ✅ Yes |
| **Database** | Needs serverless DB | Any database |
| **Pricing** | Free tier limited | Free tier generous |
| **Recommendation** | ⚠️ Not ideal for NestJS | ✅ **Best for NestJS** |

## ✅ Recommended: Switch to Render

### Why Render is Better for Your API

1. **No timeout limits** - Long operations work fine
2. **No cold starts** - Always fast
3. **Better for databases** - Persistent connections
4. **WebSocket support** - For real-time features
5. **Background jobs** - Cron jobs, queues, etc.

### Quick Switch to Render

1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Select **"Web Service"**
4. Configure:
   - **Build Command**: `npm run build:render`
   - **Start Command**: `npm run start:prod`
5. Add environment variables
6. Deploy!

See `RENDER_DEPLOYMENT.md` for complete guide.

## 🧪 Testing Checklist

After deployment, test these:

- [ ] Health endpoint: `/api/v1/health`
- [ ] Swagger docs: `/api/docs`
- [ ] Auth login: `POST /api/v1/auth/login`
- [ ] Protected route with JWT
- [ ] Database query
- [ ] File upload (if applicable)
- [ ] Response time < 1 second

## 📝 Current Error Fix

Your current error `FUNCTION_INVOCATION_FAILED` means:

1. **Check Runtime Logs** in Vercel Dashboard
2. Look for the actual error message
3. Common fixes:
   - Add missing environment variables
   - Fix database connection string
   - Install missing dependencies

## 🎯 Quick Test Commands

```bash
# Test health endpoint
curl https://pg-api-mobile.vercel.app/api/v1/health

# Test with verbose output
curl -v https://pg-api-mobile.vercel.app/api/v1/health

# Test POST request
curl -X POST https://pg-api-mobile.vercel.app/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_no": "9876543210"}'
```

---

**Recommendation**: 🚀 **Use Render instead of Vercel** for better NestJS support!

See `RENDER_DEPLOYMENT.md` for Render deployment guide.
