# 🚀 Jenkins Deployment Guide for NestJS API

## Prerequisites

Before setting up Jenkins deployment, ensure you have:
- ✅ Jenkins server with admin access
- ✅ NodeJS plugin installed in Jenkins
- ✅ SSH Agent plugin installed in Jenkins
- ✅ Git plugin installed in Jenkins
- ✅ Pipeline plugin installed in Jenkins
- ✅ SSH access to Hostinger server

---

## Part 1: Jenkins Configuration (One-time Setup)

### Step 1: Install Required Jenkins Plugins

1. Go to **Jenkins Dashboard → Manage Jenkins → Plugins**
2. Click **Available plugins** tab
3. Search and install:
   - ✅ **NodeJS Plugin**
   - ✅ **SSH Agent Plugin**
   - ✅ **Git Plugin**
   - ✅ **Pipeline Plugin**
   - ✅ **GitHub Integration Plugin** (if using GitHub)
   - ✅ **Email Extension Plugin** (optional, for notifications)

4. Click **Install** and restart Jenkins if needed

### Step 2: Configure NodeJS in Jenkins

1. Go to **Manage Jenkins → Tools**
2. Scroll to **NodeJS installations**
3. Click **Add NodeJS**
4. Configure:
   - **Name:** `NodeJS-20` (must match the name in Jenkinsfile)
   - **Version:** Select `NodeJS 20.x` or latest LTS
   - Check **Install automatically**
5. Click **Save**

### Step 3: Add SSH Credentials for Hostinger

1. Go to **Manage Jenkins → Credentials**
2. Click on **(global)** domain
3. Click **Add Credentials**
4. Configure:
   - **Kind:** `SSH Username with private key`
   - **ID:** `hostinger-ssh-credentials` (must match Jenkinsfile)
   - **Description:** `Hostinger SSH Access`
   - **Username:** Your Hostinger SSH username
   - **Private Key:** 
     - Select **Enter directly**
     - Click **Add**
     - Paste your SSH private key (from `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`)
5. Click **Create**

#### How to Get Your SSH Private Key:

**On Windows (PowerShell):**
```powershell
# View your private key
cat ~\.ssh\id_rsa
# or
cat ~\.ssh\id_ed25519
```

**On Linux/Mac:**
```bash
# View your private key
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```

Copy the entire key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Add Git Credentials (if private repository)

1. Go to **Manage Jenkins → Credentials**
2. Click **Add Credentials**
3. Configure:
   - **Kind:** `Username with password` (for HTTPS) or `SSH Username with private key` (for SSH)
   - **ID:** `git-credentials`
   - **Username:** Your Git username
   - **Password/Key:** Your Git password or SSH key
4. Click **Create**

---

## Part 2: Create Jenkins Pipeline Job

### Step 5: Create New Pipeline Job

1. Go to **Jenkins Dashboard**
2. Click **New Item**
3. Enter name: `Deploy-NestJS-API` (or any name you prefer)
4. Select **Pipeline**
5. Click **OK**

### Step 6: Configure Pipeline Job

#### General Settings:
- **Description:** `Automated deployment for NestJS API to Hostinger`
- Check **Discard old builds**
  - Days to keep builds: `30`
  - Max # of builds to keep: `10`

#### Build Triggers:
Choose one or more:

**Option A: GitHub Webhook (Recommended)**
- Check **GitHub hook trigger for GITScm polling**
- This will trigger build automatically when you push to GitHub

**Option B: Poll SCM**
- Check **Poll SCM**
- Schedule: `H/5 * * * *` (checks every 5 minutes)

**Option C: Manual Trigger**
- Leave unchecked, build manually when needed

#### Pipeline Configuration:

1. **Definition:** Select `Pipeline script from SCM`
2. **SCM:** Select `Git`
3. **Repository URL:** 
   - For SSH: `git@github.com:yourusername/your-repo.git`
   - For HTTPS: `https://github.com/yourusername/your-repo.git`
4. **Credentials:** Select your Git credentials (if private repo)
5. **Branch Specifier:** `*/main` (or your branch name)
6. **Script Path:** `Jenkinsfile`
7. Click **Save**

---

## Part 3: Update Jenkinsfile Configuration

### Step 7: Update Environment Variables

Edit the `Jenkinsfile` in your repository and update these values:

```groovy
environment {
    // Update these with your actual values
    SSH_HOST = 'ssh.hostinger.com'           // Your Hostinger SSH host
    SSH_PORT = '65002'                       // Your SSH port
    SSH_USER = 'u123456789'                  // Your actual Hostinger username
    DEPLOY_PATH = '/home/u123456789/public_html/api'  // Your actual path
    
    APP_NAME = 'pg-api'                      // Your PM2 app name
    GIT_BRANCH = 'main'                      // Your deployment branch
}
```

**How to find your values:**

1. **SSH_HOST:** Check Hostinger hPanel → SSH Access
2. **SSH_PORT:** Usually `65002` for Hostinger
3. **SSH_USER:** Your Hostinger username (usually starts with `u`)
4. **DEPLOY_PATH:** Where your API is deployed on server
5. **APP_NAME:** Check `ecosystem.config.js` → `name` field

### Step 8: Commit and Push Jenkinsfile

```bash
git add Jenkinsfile
git commit -m "Add Jenkins deployment pipeline"
git push origin main
```

---

## Part 4: Setup GitHub Webhook (Optional but Recommended)

### Step 9: Configure GitHub Webhook

1. Go to your **GitHub repository**
2. Navigate to **Settings → Webhooks → Add webhook**
3. Configure:
   - **Payload URL:** `http://your-jenkins-url:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Which events:** Select `Just the push event`
   - **Active:** Check this box
4. Click **Add webhook**

**Note:** Replace `your-jenkins-url` with your actual Jenkins server URL

---

## Part 5: First Deployment

### Step 10: Run First Build

1. Go to your Jenkins job: **Deploy-NestJS-API**
2. Click **Build Now**
3. Watch the build progress in **Console Output**
4. Monitor each stage:
   - ✅ Checkout
   - ✅ Environment Info
   - ✅ Install Dependencies
   - ✅ Lint
   - ✅ Build
   - ✅ Test
   - ✅ Generate Prisma Client
   - ✅ Deploy to Hostinger
   - ✅ Health Check

### Step 11: Verify Deployment

After successful build:

1. **Check Jenkins Console Output** - Should show "✅ DEPLOYMENT SUCCESSFUL!"
2. **SSH into Hostinger:**
   ```bash
   ssh your-username@ssh.hostinger.com -p 65002
   pm2 status
   pm2 logs pg-api
   ```
3. **Test API:**
   ```bash
   curl http://localhost:3000/api/v1/health
   # or
   curl https://api.yourdomain.com/api/v1/health
   ```

---

## Part 6: Automated Deployments

### How It Works Now:

```
Developer pushes code to GitHub
         ↓
GitHub webhook triggers Jenkins
         ↓
Jenkins pulls latest code
         ↓
Jenkins runs build pipeline
         ↓
Jenkins deploys to Hostinger
         ↓
PM2 restarts application
         ↓
Deployment complete! 🎉
```

### To Deploy:

```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Jenkins will automatically:
# 1. Detect the push
# 2. Run the pipeline
# 3. Deploy to Hostinger
# 4. Notify you of success/failure
```

---

## 🔧 Customization Options

### Enable Email Notifications

Uncomment the email sections in `Jenkinsfile`:

```groovy
post {
    success {
        emailext (
            subject: "✅ Jenkins: Deployment Successful - ${APP_NAME}",
            body: "Deployment completed successfully!",
            to: 'your-email@example.com'
        )
    }
    failure {
        emailext (
            subject: "❌ Jenkins: Deployment Failed - ${APP_NAME}",
            body: "Deployment failed! Check Jenkins logs.",
            to: 'your-email@example.com'
        )
    }
}
```

### Add Slack Notifications

1. Install **Slack Notification Plugin** in Jenkins
2. Configure Slack integration in Jenkins
3. Add to Jenkinsfile:

```groovy
post {
    success {
        slackSend (
            color: 'good',
            message: "✅ Deployment Successful: ${APP_NAME} #${BUILD_NUMBER}"
        )
    }
}
```

### Deploy to Multiple Environments

Add stages for different environments:

```groovy
stage('Deploy to Staging') {
    when { branch 'develop' }
    steps {
        // Deploy to staging server
    }
}

stage('Deploy to Production') {
    when { branch 'main' }
    steps {
        // Deploy to production server
    }
}
```

### Add Manual Approval for Production

```groovy
stage('Approve Production Deploy') {
    when { branch 'main' }
    steps {
        input message: 'Deploy to production?', ok: 'Deploy'
    }
}
```

---

## 🚨 Troubleshooting

### Issue: "NodeJS-20 not found"

**Solution:**
1. Go to **Manage Jenkins → Tools**
2. Check NodeJS installation name matches Jenkinsfile
3. Update Jenkinsfile if needed:
   ```groovy
   tools {
       nodejs 'Your-NodeJS-Name'
   }
   ```

### Issue: "SSH credentials not found"

**Solution:**
1. Go to **Manage Jenkins → Credentials**
2. Verify credential ID is `hostinger-ssh-credentials`
3. Update Jenkinsfile if using different ID:
   ```groovy
   sshagent(credentials: ['your-credential-id']) {
   ```

### Issue: "Permission denied (publickey)"

**Solution:**
1. Verify SSH key is correct in Jenkins credentials
2. Test SSH connection manually:
   ```bash
   ssh -p 65002 your-username@ssh.hostinger.com
   ```
3. Ensure public key is added to Hostinger server:
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```

### Issue: "pm2 command not found"

**Solution:**
SSH into Hostinger and install PM2:
```bash
npm install -g pm2
```

### Issue: Build fails at "npm run build"

**Solution:**
1. Check console output for specific error
2. Verify dependencies are correct
3. Test build locally:
   ```bash
   npm install
   npm run build
   ```

### Issue: Database migration fails

**Solution:**
1. Verify `DATABASE_URL` in `.env` on server
2. Check database credentials
3. Run migration manually:
   ```bash
   ssh your-username@ssh.hostinger.com -p 65002
   cd ~/public_html/api
   npm run prisma:migrate:deploy
   ```

---

## 📊 Monitoring & Maintenance

### View Build History
1. Go to your Jenkins job
2. Click on any build number
3. View **Console Output** for detailed logs

### Monitor Application on Server
```bash
# SSH into server
ssh your-username@ssh.hostinger.com -p 65002

# Check PM2 status
pm2 status

# View logs
pm2 logs pg-api

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart pg-api
```

### Jenkins Job Management
```bash
# View all jobs
# Jenkins Dashboard shows all jobs

# Disable job temporarily
# Job → Configure → Disable this project

# Delete old builds
# Job → Configure → Discard old builds
```

---

## 🎯 Best Practices

1. **Always test locally before pushing**
   ```bash
   npm install
   npm run build
   npm test
   ```

2. **Use feature branches for development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR, then merge to main
   ```

3. **Monitor Jenkins builds**
   - Check build status after each push
   - Review console output for errors
   - Fix issues immediately

4. **Keep Jenkins updated**
   - Update plugins regularly
   - Update Jenkins core version
   - Backup Jenkins configuration

5. **Secure your Jenkins**
   - Use strong passwords
   - Enable CSRF protection
   - Limit user permissions
   - Use HTTPS for Jenkins

---

## 📋 Deployment Checklist

Before first deployment:
- [ ] Jenkins plugins installed
- [ ] NodeJS configured in Jenkins
- [ ] SSH credentials added to Jenkins
- [ ] Git credentials added (if private repo)
- [ ] Pipeline job created
- [ ] Jenkinsfile updated with correct values
- [ ] GitHub webhook configured (optional)
- [ ] `.env` file exists on Hostinger server
- [ ] PM2 is running on Hostinger
- [ ] First manual build successful

For each deployment:
- [ ] Code tested locally
- [ ] Changes committed to Git
- [ ] Pushed to main branch
- [ ] Jenkins build triggered
- [ ] Build completed successfully
- [ ] Application restarted on server
- [ ] API responding correctly

---

## 🎉 You're All Set!

Your Jenkins deployment pipeline is now configured!

**To deploy:**
```bash
git push origin main
```

**To monitor:**
- Jenkins: `http://your-jenkins-url:8080/job/Deploy-NestJS-API/`
- Server: `ssh your-username@ssh.hostinger.com -p 65002`

**Need help?**
- Check Jenkins console output
- Review this guide
- Check PM2 logs on server

---

## 📞 Quick Reference

### Jenkins URLs
- Dashboard: `http://your-jenkins-url:8080/`
- Your Job: `http://your-jenkins-url:8080/job/Deploy-NestJS-API/`
- Credentials: `http://your-jenkins-url:8080/credentials/`

### Important Commands
```bash
# Local
git push origin main

# Jenkins (via UI)
Build Now → Console Output

# Hostinger Server
ssh your-username@ssh.hostinger.com -p 65002
pm2 status
pm2 logs pg-api
pm2 restart pg-api
```

---

**Happy Deploying with Jenkins! 🚀**
