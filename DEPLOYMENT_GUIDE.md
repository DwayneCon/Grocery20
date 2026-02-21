# 🚀 GROCERY20 - GODADDY DEPLOYMENT GUIDE

**Last Updated:** 2025-11-26
**Target Platform:** GoDaddy Shared/VPS Hosting
**Domain:** grocery.dwaynecon.com

---

## 🚨 CRITICAL: PRE-DEPLOYMENT SECURITY

### ⚠️ **IMMEDIATE ACTIONS REQUIRED**

Before deploying, you MUST complete these security steps:

1. **Change cPanel Password**
   - Go to: https://grocery.dwaynecon.com:2083
   - Current username: `nq00klkavtq6`
   - **Change password immediately** (was shared publicly)

2. **Rotate OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Delete the compromised key
   - Generate a new key
   - Save it securely for .env configuration

---

## 📋 DEPLOYMENT CHECKLIST

### Phase 1: Pre-Deployment (Local)

- [x] ✅ Build client and server
- [x] ✅ Generate secure JWT/session secrets
- [x] ✅ Create database schema
- [x] ✅ Install nodemailer package
- [x] ✅ Create production .env template
- [x] ✅ Create deployment script

### Phase 2: GoDaddy Setup (cPanel)

- [ ] ❌ **Change cPanel password**
- [ ] ❌ **Rotate OpenAI API key**
- [ ] ⚠️  Create MySQL database
- [ ] ⚠️  Import database schema
- [ ] ⚠️  Enable SSH access (if not enabled)
- [ ] ⚠️  Install Node.js (if not available)

### Phase 3: Deployment

- [ ] ⚠️  Run deployment script
- [ ] ⚠️  Configure .env file on server
- [ ] ⚠️  Start Node.js server with PM2
- [ ] ⚠️  Configure .htaccess
- [ ] ⚠️  Test API endpoints
- [ ] ⚠️  Test frontend functionality

### Phase 4: Post-Deployment

- [ ] ⚠️  Setup SSL certificate (Let's Encrypt)
- [ ] ⚠️  Configure monitoring
- [ ] ⚠️  Setup automated backups
- [ ] ⚠️  Test password reset email
- [ ] ⚠️  Performance testing
- [ ] ⚠️  Security audit

---

## 🛠️ DEPLOYMENT METHODS

### Method 1: Automated Script (Recommended)

The easiest way to deploy is using the provided deployment script:

```bash
# Make sure you're in the Grocery20 root directory
cd /Users/dwayneconcepcion/Grocery20

# Run the deployment script
./deploy-godaddy.sh production
```

**The script will:**
- ✓ Verify all prerequisites
- ✓ Create backup of existing deployment
- ✓ Upload client build files
- ✓ Upload server code
- ✓ Install dependencies
- ✓ Setup .htaccess configuration
- ✓ Provide step-by-step instructions for manual configuration

---

### Method 2: Manual Deployment

If you prefer manual control:

#### Step 1: Upload Client Files

```bash
# Upload client build to remote server
scp -r client/dist/* nq00klkavtq6@grocery.dwaynecon.com:~/public_html/grocery.dwaynecon.com/
```

#### Step 2: Upload Server Files

```bash
# Create server directory
ssh nq00klkavtq6@grocery.dwaynecon.com "mkdir -p ~/public_html/grocery.dwaynecon.com/server"

# Upload server files
scp -r server/dist server/package.json server/package-lock.json \
  nq00klkavtq6@grocery.dwaynecon.com:~/public_html/grocery.dwaynecon.com/server/
```

#### Step 3: Install Dependencies

```bash
ssh nq00klkavtq6@grocery.dwaynecon.com
cd ~/public_html/grocery.dwaynecon.com/server
npm install --production
```

---

## ⚙️ CONFIGURATION

### Step 1: Create MySQL Database

**Via cPanel:**

1. Log into cPanel: https://grocery.dwaynecon.com:2083
2. Navigate to: **MySQL Databases**
3. Create database: `nq00klka_grocery_planner`
4. Create user: `nq00klka_grocery`
5. Generate strong password (save it!)
6. Grant **ALL PRIVILEGES** to user
7. Note down:
   - Database Host (usually `localhost`)
   - Database Name
   - Database User
   - Database Password

### Step 2: Import Database Schema

**Option A: Via phpMyAdmin (Easiest)**

1. Go to cPanel → phpMyAdmin
2. Select your database: `nq00klka_grocery_planner`
3. Click "Import" tab
4. Upload `database_schema.sql`
5. Click "Go"
6. Verify tables were created (should see ~20 tables)

**Option B: Via SSH**

```bash
ssh nq00klkavtq6@grocery.dwaynecon.com
cd ~/public_html/grocery.dwaynecon.com
mysql -u nq00klka_grocery -p nq00klka_grocery_planner < database_schema.sql
```

### Step 3: Configure Environment Variables

```bash
ssh nq00klkavtq6@grocery.dwaynecon.com
cd ~/public_html/grocery.dwaynecon.com/server

# Copy template to .env
cp .env.template .env

# Edit with nano or vi
nano .env
```

**Update these values:**

```bash
# Database (from cPanel)
DB_PASSWORD=your_mysql_password_here

# OpenAI (your NEW rotated key)
OPENAI_API_KEY=sk-your-new-key-here

# Email (optional, for password reset)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Set proper permissions:**

```bash
chmod 600 .env
```

### Step 4: Setup .htaccess

Create `.htaccess` in your web root:

```bash
cd ~/public_html/grocery.dwaynecon.com
nano .htaccess
```

Paste this content:

```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy API requests to Node.js
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Serve static files
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route to React app
RewriteRule ^(.*)$ /index.html [L]
```

---

## 🚀 START THE SERVER

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Start the Application

```bash
cd ~/public_html/grocery.dwaynecon.com/server

# Start server
pm2 start dist/index.js --name grocery-api

# Save PM2 process list
pm2 save

# Setup auto-start on reboot
pm2 startup

# View logs
pm2 logs grocery-api

# View status
pm2 status
```

### PM2 Commands Reference

```bash
pm2 status              # View all processes
pm2 logs grocery-api    # View logs
pm2 restart grocery-api # Restart server
pm2 stop grocery-api    # Stop server
pm2 delete grocery-api  # Remove process
pm2 monit              # Monitor resources
```

---

## ✅ VERIFICATION

### 1. Test API Health Check

```bash
curl https://grocery.dwaynecon.com/api/health
```

Expected response:
```json
{"status": "ok", "timestamp": "..."}
```

### 2. Test Frontend

Visit: https://grocery.dwaynecon.com

- Should see Grocery20 homepage
- Should be able to register/login
- Check browser console for errors

### 3. Test Database Connection

```bash
# In server directory
node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  console.log('✓ Database connected!');
  await connection.end();
}

test().catch(err => console.error('✗ Database error:', err));
"
```

### 4. Check PM2 Status

```bash
pm2 status
```

Should show `grocery-api` with status `online`.

---

## 🔒 SSL CERTIFICATE

### Enable HTTPS with Let's Encrypt (Free)

**Via cPanel:**

1. Go to cPanel → SSL/TLS Status
2. Find `grocery.dwaynecon.com`
3. Click "Run AutoSSL"
4. Wait for certificate installation
5. Verify HTTPS works

**Or via SSH (if available):**

```bash
certbot --nginx -d grocery.dwaynecon.com
```

---

## 🐛 TROUBLESHOOTING

### Server Won't Start

```bash
# Check logs
pm2 logs grocery-api --lines 100

# Check .env file
cat ~/public_html/grocery.dwaynecon.com/server/.env

# Test Node.js
node --version

# Manually start to see errors
cd ~/public_html/grocery.dwaynecon.com/server
node dist/index.js
```

### Database Connection Errors

```bash
# Verify credentials
mysql -u nq00klka_grocery -p
# Enter password and try to connect

# Check if tables exist
USE nq00klka_grocery_planner;
SHOW TABLES;
```

### API 502 Bad Gateway

- Server is not running or crashed
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs grocery-api`
- Restart: `pm2 restart grocery-api`

### Frontend 404 Errors

- Check .htaccess configuration
- Verify files uploaded to correct directory
- Check Apache/Nginx configuration

### CORS Errors

- Verify `ALLOWED_ORIGINS` in .env
- Should be: `https://grocery.dwaynecon.com`
- Restart server after changing .env

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks

```bash
# Check server status
pm2 status

# Check logs for errors
pm2 logs grocery-api --lines 50 | grep -i error

# Check disk space
df -h

# Check memory usage
pm2 monit
```

### Weekly Tasks

- Review error logs
- Check database size
- Backup database
- Update npm packages (security)

### Backup Strategy

**Automated Database Backup:**

```bash
# Create backup script
nano ~/backups/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u nq00klka_grocery -p nq00klka_grocery_planner > \
  ~/backups/grocery_db_$DATE.sql
# Keep only last 7 days
find ~/backups -name "grocery_db_*.sql" -mtime +7 -delete
```

```bash
chmod +x ~/backups/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * ~/backups/backup-db.sh
```

---

## 📞 SUPPORT RESOURCES

### GoDaddy Support
- **Phone:** 1-480-505-8877
- **Chat:** https://www.godaddy.com/contact-us

### Documentation
- OpenAI API: https://platform.openai.com/docs
- Node.js: https://nodejs.org/docs
- PM2: https://pm2.keymetrics.io/docs

### Common Issues
- Check `pm2 logs` first
- Verify `.env` configuration
- Test database connection
- Check file permissions

---

## 🎉 POST-DEPLOYMENT

### Success Indicators

✓ Website loads at https://grocery.dwaynecon.com
✓ Users can register and login
✓ AI chat responds to messages
✓ Meal plans can be created
✓ No console errors in browser
✓ PM2 shows status "online"
✓ API health check returns 200

### Optional Enhancements

- [ ] Setup Google Analytics
- [ ] Configure Sentry for error tracking
- [ ] Setup email notifications
- [ ] Add Kroger API integration
- [ ] Configure Redis caching
- [ ] Setup CDN for static assets

---

## 📝 DEPLOYMENT SUMMARY FILES

All necessary files have been created in your project root:

1. **PRODUCTION_SECRETS.txt** - Your generated JWT/encryption keys
2. **database_schema.sql** - MySQL database schema
3. **.env.production.template** - Production environment configuration
4. **deploy-godaddy.sh** - Automated deployment script
5. **DEPLOYMENT_GUIDE.md** - This guide

---

## ⚡ QUICK START COMMANDS

```bash
# 1. Deploy everything
./deploy-godaddy.sh production

# 2. SSH into server
ssh nq00klkavtq6@grocery.dwaynecon.com

# 3. Configure .env
cd ~/public_html/grocery.dwaynecon.com/server
nano .env

# 4. Import database (via cPanel phpMyAdmin)

# 5. Start server
pm2 start dist/index.js --name grocery-api
pm2 save

# 6. Check status
pm2 status
pm2 logs grocery-api

# 7. Visit website
# https://grocery.dwaynecon.com
```

---

**🎯 You're ready to deploy! Good luck!**

*Remember: Security first - rotate those credentials!*
