# ⚡ Jenkins Quick Start - 5 Minutes Setup

## 🎯 Quick Setup (Already Have Jenkins)

### 1️⃣ Update Jenkinsfile (2 minutes)

Edit `Jenkinsfile` and update these lines:

```groovy
environment {
    SSH_HOST = 'ssh.hostinger.com'           // ← Your Hostinger host
    SSH_PORT = '65002'                       // ← Your SSH port
    SSH_USER = 'u123456789'                  // ← Your username
    DEPLOY_PATH = '/home/u123456789/public_html/api'  // ← Your path
}
```

### 2️⃣ Add SSH Credentials in Jenkins (1 minute)

1. **Manage Jenkins → Credentials → Add Credentials**
2. Select: **SSH Username with private key**
3. Fill in:
   - **ID:** `hostinger-ssh-credentials`
   - **Username:** Your Hostinger SSH username
   - **Private Key:** Paste your SSH private key
4. **Create**

### 3️⃣ Create Pipeline Job (1 minute)

1. **New Item** → Enter name: `Deploy-NestJS-API`
2. Select **Pipeline** → **OK**
3. Configure:
   - **Pipeline → Definition:** `Pipeline script from SCM`
   - **SCM:** `Git`
   - **Repository URL:** Your Git repo URL
   - **Branch:** `*/main`
   - **Script Path:** `Jenkinsfile`
4. **Save**

### 4️⃣ Deploy! (1 minute)

```bash
# Commit Jenkinsfile
git add Jenkinsfile
git commit -m "Add Jenkins pipeline"
git push origin main

# In Jenkins, click "Build Now"
```

---

## 🔑 Where to Find Your Values

### SSH_HOST & SSH_PORT
- Hostinger hPanel → **Advanced → SSH Access**
- Usually: `ssh.hostinger.com` port `65002`

### SSH_USER
- Your Hostinger username (starts with `u` like `u123456789`)
- Found in: hPanel → **SSH Access**

### DEPLOY_PATH
- Where your API is deployed
- Usually: `/home/YOUR_USERNAME/public_html/api`

### SSH Private Key
**Windows PowerShell:**
```powershell
cat ~\.ssh\id_rsa
```

**Linux/Mac:**
```bash
cat ~/.ssh/id_rsa
```

Copy everything including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

---

## ✅ Verification

After first build:

```bash
# 1. Check Jenkins console - should show "✅ DEPLOYMENT SUCCESSFUL!"

# 2. SSH into server
ssh your-username@ssh.hostinger.com -p 65002

# 3. Check PM2
pm2 status

# 4. Test API
curl http://localhost:3000/api/v1/health
```

---

## 🚀 Daily Usage

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Jenkins auto-deploys (if webhook configured)
# Or click "Build Now" in Jenkins
```

---

## 🚨 Quick Troubleshooting

### Build fails?
- Check **Console Output** in Jenkins
- Verify environment variables in Jenkinsfile
- Test SSH connection manually

### SSH fails?
- Verify SSH credentials in Jenkins
- Check username and host are correct
- Ensure private key is complete

### PM2 not found?
```bash
ssh your-username@ssh.hostinger.com -p 65002
npm install -g pm2
```

---

## 📚 Need More Details?

See full guide: **JENKINS_DEPLOYMENT_GUIDE.md**

---

## 🎉 That's It!

Your Jenkins pipeline is ready. Push to deploy! 🚀
