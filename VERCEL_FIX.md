# 🔧 Vercel Path Alias Fix

## ❌ Error
```
Cannot find module '@/prisma/prisma.service'
```

## ✅ Solution

### Step 1: Install Dependencies

```bash
npm install --save-dev tsc-alias
```

### Step 2: Update Vercel Settings

Go to **Vercel Dashboard → Settings → General**

**Build Command:**
```bash
npm run build:vercel
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install --legacy-peer-deps
```

### Step 3: Redeploy

1. Commit changes:
```bash
git add .
git commit -m "Fix Vercel path aliases"
git push
```

2. Vercel will auto-deploy

Or click **"Redeploy"** in Vercel Dashboard

## 📋 What Changed

1. ✅ Added `tsc-alias` to resolve `@/` paths
2. ✅ Created `build:vercel` script
3. ✅ Updated `package.json`

## 🧪 Test After Deploy

```bash
curl https://pg-api-mobile.vercel.app/api/v1/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## ⚠️ Still Recommended: Use Render

Even after this fix, Vercel has limitations:
- ❌ 10-second timeout
- ❌ Cold starts
- ❌ Not ideal for databases

**Render is better for NestJS!**

See `RENDER_DEPLOYMENT.md` for setup.

---

**Next**: Update build command in Vercel and redeploy!
