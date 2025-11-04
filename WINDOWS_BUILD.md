# 🪟 Windows Build Commands

## ⚠️ PowerShell doesn't support `&&`

On Windows PowerShell, you need to run commands separately or use `;` with proper syntax.

## ✅ Solution 1: Use npm script (EASIEST)

Just run:
```powershell
npm run build:windows
```

This will run all commands in sequence.

## ✅ Solution 2: Run commands separately

```powershell
# Step 1: Install dependencies
npm install --legacy-peer-deps --no-audit

# Step 2: Generate Prisma client
npx prisma generate

# Step 3: Build
npm run build
```

## ✅ Solution 3: PowerShell one-liner

```powershell
npm install --legacy-peer-deps --no-audit; npx prisma generate; npm run build
```

## 🚀 For Render Deployment

**Don't worry about Windows syntax!**

Render uses **Linux**, so the original command works fine:

```bash
npm run build:render
```

This command in `package.json` will work on Render:
```json
"build:render": "npm install --legacy-peer-deps && prisma generate && nest build"
```

## 📋 Quick Reference

| Environment | Command |
|-------------|---------|
| **Windows (Local)** | `npm run build:windows` |
| **Render (Deploy)** | `npm run build:render` |
| **Linux/Mac** | `npm run build:render` |

## 🔧 Testing Locally on Windows

```powershell
# Clean install and build
npm run build:windows

# Start development server
npm run start:dev

# Start production server
npm run start:prod
```

---

**For Render deployment**: Use `npm run build:render` in the dashboard - it will work fine!
