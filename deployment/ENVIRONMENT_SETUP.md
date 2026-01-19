# Production Environment Setup Guide

## 🎯 Quick Setup

### Option 1: Interactive Setup (Recommended)
Run the interactive setup script:

```bash
node deployment/setup-env.js
```

This will guide you through all the required configuration steps.

### Option 2: Manual Setup

1. **Copy the template:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit the file:**
   ```bash
   # On Windows
   notepad .env.production
   
   # On Linux/Mac
   nano .env.production
   ```

3. **Update these values:**

---

## 📋 Configuration Values

### 1. Database Configuration

**DATABASE_URL**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

**Example:**
```bash
DATABASE_URL="postgresql://spwms_user:MySecurePass123@localhost:5432/spwms_production?schema=public"
```

**Components:**
- `USER`: Database username (e.g., `spwms_user`)
- `PASSWORD`: Strong password (use password generator)
- `HOST`: Database server IP/hostname (e.g., `localhost`, `192.168.1.100`)
- `PORT`: PostgreSQL port (default: `5432`)
- `DATABASE`: Database name (e.g., `spwms_production`)

---

### 2. Authentication Secret

**AUTH_SECRET**

Generate a secure random secret:

```bash
# On Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# On Linux/Mac
openssl rand -base64 32
```

**Example output:**
```
dv7sDSXURuKEfm4II30O1kX7UzG2q0ZTKhNMJxsidi8=
```

Copy this value to your `.env.production`:
```bash
AUTH_SECRET="dv7sDSXURuKEfm4II30O1kX7UzG2q0ZTKhNMJxsidi8="
```

---

### 3. Production URL

**NEXTAUTH_URL**

Set this to your production domain or IP address:

**With Domain (Recommended):**
```bash
NEXTAUTH_URL="https://wms.yourdomain.com"
```

**With IP Address:**
```bash
NEXTAUTH_URL="http://192.168.1.100:3000"
```

**⚠️ Important:**
- Use `https://` in production when possible
- Don't include trailing slash
- Port 3000 is the default (can be changed)

---

### 4. Legacy Database (Optional)

Only needed if you plan to run migrations from production server.

```bash
LEGACY_DB_HOST=192.168.42.10
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=siripro-stock
LEGACY_DB_USER=postgres
LEGACY_DB_PASSWORD=YourLegacyPassword
```

If not needed, comment out or remove these lines.

---

## 🔐 Security Best Practices

### Password Requirements
- ✅ Minimum 12 characters
- ✅ Include uppercase and lowercase letters
- ✅ Include numbers
- ✅ Include special characters
- ✅ Avoid common words or patterns

### Example Strong Password
```
xK9#mP2*qL5@wN8^
```

### Generate Strong Password (PowerShell)
```powershell
-join ((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,64) | Get-Random -Count 16 | ForEach-Object {[char]$_})
```

---

## ✅ Verification Steps

### 1. Test Database Connection
```bash
npx prisma db pull
```

**Expected output:**
```
✔ Introspected 15 models and wrote them into prisma/schema.prisma in XXXms
```

### 2. Run Migrations
```bash
npx prisma migrate deploy
```

**Expected output:**
```
✔ Applied X migrations
```

### 3. Test Build
```bash
npm run build
```

**Expected output:**
```
✓ Compiled successfully
```

---

## 🔧 Common Issues & Solutions

### Issue: "Can't reach database server"

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check if database exists:
   ```bash
   psql -U postgres -l
   ```

3. Verify DATABASE_URL format

### Issue: "Auth secret is too short"

**Solution:**
- Make sure AUTH_SECRET is at least 32 characters
- Use the generation command to create a new one

### Issue: "NEXTAUTH_URL must be a valid URL"

**Solution:**
- Include protocol (`http://` or `https://`)
- Don't include trailing slash
- Example: `https://wms.example.com`

---

## 📝 Complete Example

Here's a complete `.env.production` example:

```bash
# Production Environment Variables
# Created: 2026-01-16

# Database
DATABASE_URL="postgresql://spwms_user:xK9#mP2*qL5@wN8^@localhost:5432/spwms_production?schema=public"

# NextAuth
AUTH_SECRET="dv7sDSXURuKEfm4II30O1kX7UzG2q0ZTKhNMJxsidi8="
NEXTAUTH_URL="https://wms.siripro.com"

# App
NEXT_PUBLIC_APP_NAME="SP WMS"
NEXT_PUBLIC_APP_VERSION="2.0.0"
NODE_ENV=production
PORT=3000

# Legacy Database (Optional - remove if not needed)
# LEGACY_DB_HOST=192.168.42.10
# LEGACY_DB_PORT=5432
# LEGACY_DB_NAME=siripro-stock
# LEGACY_DB_USER=postgres
# LEGACY_DB_PASSWORD=S1r1Pr0
```

---

## 🚨 Security Checklist

Before deploying to production:

- [ ] Strong database password set
- [ ] AUTH_SECRET generated and set
- [ ] NEXTAUTH_URL uses HTTPS (if available)
- [ ] `.env.production` is in `.gitignore`
- [ ] `.env.production` is backed up securely
- [ ] Database connection tested
- [ ] Migrations applied successfully
- [ ] Build test passed
- [ ] Firewall configured on server
- [ ] SSL certificate installed (if using HTTPS)

---

## 📞 Need Help?

- Review main deployment guide: `deployment/README.md`
- Check deployment workflow: `.agent/workflows/deploy.md`
- Run interactive setup: `node deployment/setup-env.js`

---

## ⚠️ Important Reminders

1. **Never commit `.env.production` to version control**
2. **Keep backups in a secure location (not in Git)**
3. **Use different passwords for development and production**
4. **Rotate secrets periodically**
5. **Enable SSL/HTTPS in production**
6. **Restrict database access to localhost only (if possible)**
