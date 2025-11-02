# 🚀 Quick Deploy Guide - Hostinger Git Auto-Deploy

## TL;DR - 3 Steps to Auto-Deploy

### 1️⃣ Setup Hostinger (One-time)
```bash
# SSH into Hostinger
ssh username@ssh.hostinger.com -p 65002

# Clone repo
cd ~/public_html
git clone git@github.com:yourusername/pg-api-mobile.git api
cd api

# Run setup script
chmod +x setup-hostinger.sh
./setup-hostinger.sh

# Create .env file
nano .env
# (Add your environment variables)
```

### 2️⃣ Setup GitHub Actions (One-time)
1. Go to **GitHub → Settings → Secrets → Actions**
2. Add these secrets:
   - `SSH_HOST` = Your Hostinger IP/hostname
   - `SSH_USERNAME` = Your SSH username
   - `SSH_PASSWORD` = Your SSH password
   - `SSH_PORT` = `65002` (or your SSH port)

### 3️⃣ Deploy (Every time)
```bash
git add .
git commit -m "Your changes"
git push origin main
```

**That's it!** ✨ Auto-deploys in 2-3 minutes.

---

## 📋 What You Need

### Before Starting
- [ ] Hostinger VPS/Business plan (Node.js support)
- [ ] GitHub repository
- [ ] SSH access enabled in Hostinger
- [ ] Domain/subdomain (optional but recommended)

### Files Already Created
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ✅ `.cpanel.yml` - cPanel auto-deploy config
- ✅ `ecosystem.config.js` - PM2 configuration
- ✅ `.htaccess` - Reverse proxy setup
- ✅ `setup-hostinger.sh` - Initial setup script

---

## 🔑 Environment Variables

Create `.env` on Hostinger server:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/dbname
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket
```

---

## 🛠️ Common Commands

### On Hostinger (via SSH)
```bash
# Check app status
pm2 status

# View logs
pm2 logs pg-api

# Restart app
pm2 restart pg-api

# Manual deploy
cd ~/public_html/api
git pull origin main
npm install --production
npm run build
pm2 restart pg-api
```

### On Local Machine
```bash
# Deploy to production
git push origin main

# Check deployment status
# Go to GitHub → Actions tab
```

---

## 🎯 Two Auto-Deploy Options

### Option A: GitHub Actions (Recommended)
**Pros:**
- Works from any Git provider
- More control over deployment process
- Can run tests before deploy
- Better logging

**Setup:** Already done! Just add GitHub secrets.

### Option B: cPanel Git Version Control
**Pros:**
- Built into cPanel
- No external dependencies
- Simple setup

**Setup:**
1. cPanel → Git Version Control
2. Create repository
3. `.cpanel.yml` handles the rest

---

## 🚨 Troubleshooting

### Deployment fails?
```bash
# SSH into server
ssh username@ssh.hostinger.com -p 65002

# Check logs
cd ~/public_html/api
pm2 logs pg-api --lines 50
```

### App not starting?
```bash
# Check if port is in use
lsof -i :3000

# Restart PM2
pm2 restart pg-api

# Or rebuild
npm run build
pm2 restart pg-api
```

### Database errors?
```bash
# Check connection
npm run prisma:studio

# Re-run migrations
npm run prisma:migrate:deploy
```

---

## 📊 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Check memory/CPU usage
pm2 status

# View logs
pm2 logs pg-api
```

---

## 🔒 Security Checklist

- [ ] `.env` file created on server (not in Git)
- [ ] Strong JWT secret generated
- [ ] Database password is strong
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Only necessary ports open

---

## 🎉 Success!

Your API is now:
- ✅ Auto-deploying on every push
- ✅ Running with PM2 (auto-restart)
- ✅ Production optimized
- ✅ SSL secured

**Test it:**
```bash
curl https://api.yourdomain.com/api/v1/health
```

---

## 📞 Need Help?

1. Check full guide: `HOSTINGER_DEPLOYMENT.md`
2. Check PM2 logs: `pm2 logs pg-api`
3. Check GitHub Actions: Repository → Actions tab
4. SSH into server and debug manually

---

**Happy Deploying! 🚀**
