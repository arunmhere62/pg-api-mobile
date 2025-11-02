# Deploy NestJS API to Hostinger with Git Auto-Deploy

## 🚀 Complete Step-by-Step Guide

### Prerequisites
- Hostinger VPS or Business/Premium hosting plan (shared hosting won't work for Node.js)
- Git repository (GitHub/GitLab/Bitbucket)
- SSH access to Hostinger

---

## Part 1: Hostinger Setup

### Step 1: Enable SSH Access
1. Log in to **Hostinger hPanel**
2. Go to **Advanced → SSH Access**
3. Enable SSH and note your credentials:
   - **Host:** `ssh.hostinger.com` or your server IP
   - **Port:** Usually `65002` or `22`
   - **Username:** Your hosting username
   - **Password:** Your hosting password

### Step 2: Connect via SSH
```bash
ssh username@ssh.hostinger.com -p 65002
```

### Step 3: Install Node.js (if not installed)
```bash
# Check if Node.js is installed
node -v

# If not, install using NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Step 4: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

---

## Part 2: Git Auto-Deploy Setup

### Step 5: Generate SSH Key on Hostinger Server
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Press Enter for all prompts (use default location)

# Display the public key
cat ~/.ssh/id_ed25519.pub
```

### Step 6: Add SSH Key to GitHub
1. Copy the SSH key output from above
2. Go to **GitHub → Settings → SSH and GPG keys**
3. Click **New SSH key**
4. Paste the key and save

### Step 7: Clone Your Repository
```bash
# Navigate to your web directory
cd ~/public_html

# Clone your repository
git clone git@github.com:yourusername/pg-api-mobile.git api

# Navigate to the project
cd api
```

### Step 8: Setup Environment Variables
```bash
# Create .env file
nano .env
```

Add your production environment variables:
```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="mysql://user:password@localhost:3306/dbname"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket

# Firebase (if using)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email

# API
API_PREFIX=api/v1
CORS_ORIGIN=https://yourdomain.com
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Step 9: Install Dependencies and Build
```bash
# Install dependencies
npm install --production

# Generate Prisma client
npm run prisma:generate

# Build the application
npm run build

# Run database migrations
npm run prisma:migrate:deploy
```

### Step 10: Start Application with PM2
```bash
# Start the app
npm run start:pm2

# Save PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Copy and run the command it outputs
```

### Step 11: Verify Application is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs pg-api

# Test the API
curl http://localhost:3000/api/v1/health
```

---

## Part 3: Git Auto-Deploy with Webhooks

### Option A: Using GitHub Actions (Recommended)

#### Step 12: Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Hostinger
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USERNAME }}
        password: ${{ secrets.SSH_PASSWORD }}
        port: ${{ secrets.SSH_PORT }}
        script: |
          cd ~/public_html/api
          git pull origin main
          npm install --production
          npm run build
          npm run prisma:generate
          npm run prisma:migrate:deploy
          pm2 restart pg-api
```

#### Step 13: Add GitHub Secrets
1. Go to **GitHub → Repository → Settings → Secrets and variables → Actions**
2. Add these secrets:
   - `SSH_HOST`: Your Hostinger server IP or hostname
   - `SSH_USERNAME`: Your SSH username
   - `SSH_PASSWORD`: Your SSH password
   - `SSH_PORT`: SSH port (usually 65002)

---

### Option B: Using cPanel Git Version Control

#### Step 12: Setup Git in cPanel
1. Log in to **Hostinger cPanel**
2. Go to **Git Version Control**
3. Click **Create**
4. Fill in:
   - **Clone URL:** Your repository URL
   - **Repository Path:** `/home/username/public_html/api`
   - **Repository Name:** `api`
5. Click **Create**

#### Step 13: Configure Auto-Deploy
The `.cpanel.yml` file (already created) will handle auto-deployment.

Update it with your actual path:
```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/YOUR_USERNAME/public_html/api
    - /bin/cp -R * $DEPLOYPATH
    - cd $DEPLOYPATH
    - npm install --production
    - npm run build
    - npm run prisma:generate
    - npm run prisma:migrate:deploy
    - pm2 restart pg-api
```

---

## Part 4: Domain & SSL Setup

### Step 14: Point Domain to API
1. In **cPanel → Domains**
2. Create subdomain: `api.yourdomain.com`
3. Point to `/home/username/public_html/api`

### Step 15: Setup SSL Certificate
1. In **cPanel → SSL/TLS Status**
2. Enable AutoSSL for `api.yourdomain.com`

### Step 16: Configure Reverse Proxy
The `.htaccess` file (already created) handles this.

Verify it's in `/home/username/public_html/api/.htaccess`

---

## Part 5: Testing Auto-Deploy

### Step 17: Test the Deployment
```bash
# On your local machine
git add .
git commit -m "Test auto-deploy"
git push origin main
```

**What happens:**
1. Code pushed to GitHub
2. GitHub Actions triggers (or cPanel Git pulls)
3. Dependencies installed
4. App built
5. Database migrated
6. PM2 restarts app
7. Live in ~2-3 minutes! 🎉

---

## 🔧 Useful Commands

### On Hostinger Server (via SSH)

```bash
# Check app status
pm2 status

# View logs
pm2 logs pg-api

# Restart app
pm2 restart pg-api

# Stop app
pm2 stop pg-api

# Update from Git manually
cd ~/public_html/api
git pull origin main
npm install --production
npm run build
pm2 restart pg-api

# Check Node.js version
node -v

# Check database connection
npm run prisma:studio
```

---

## 🚨 Troubleshooting

### Issue: Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart PM2
pm2 restart pg-api
```

### Issue: Database connection failed
- Check `DATABASE_URL` in `.env`
- Verify MySQL is running
- Check database credentials in Hostinger cPanel

### Issue: Git pull fails
```bash
# Reset any local changes
git reset --hard origin/main
git pull origin main
```

### Issue: PM2 not starting on reboot
```bash
pm2 startup
pm2 save
```

---

## 📊 Monitoring

### Setup PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# View monitoring dashboard
pm2 monit
```

---

## 🎯 Quick Deploy Checklist

- [ ] SSH access enabled
- [ ] Node.js installed
- [ ] PM2 installed
- [ ] Repository cloned
- [ ] `.env` file created
- [ ] Dependencies installed
- [ ] App built
- [ ] Database migrated
- [ ] PM2 started
- [ ] GitHub Actions configured
- [ ] Domain pointed
- [ ] SSL enabled
- [ ] Test deployment works

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong JWT secret** - Generate with: `openssl rand -base64 32`
3. **Enable firewall** - Only allow necessary ports
4. **Regular updates** - Keep dependencies updated
5. **Monitor logs** - Check PM2 logs regularly
6. **Backup database** - Setup automated backups in cPanel

---

## 📝 Environment Variables Needed

Make sure these are in your `.env` on the server:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
JWT_SECRET=your-secret
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket
```

---

## 🎉 You're Done!

Your NestJS API is now:
- ✅ Deployed on Hostinger
- ✅ Auto-deploys on Git push
- ✅ Running with PM2
- ✅ SSL secured
- ✅ Production ready

**API URL:** `https://api.yourdomain.com/api/v1`

Test it: `https://api.yourdomain.com/api/v1/health`
