# SPWMS Production Deployment Guide

This directory contains all the necessary configuration files and scripts for deploying SPWMS to production.

## 📋 Quick Start

### Pre-Deployment Checklist
- [ ] Local build test passes (`npm run build`)
- [ ] Production environment variables configured
- [ ] Ubuntu server prepared (20.04+ recommended)
- [ ] PostgreSQL database created
- [ ] Domain name configured (optional)

## 📁 Files Overview

### Configuration Files
- **`nginx.conf`** - Nginx reverse proxy configuration
- **`ecosystem.config.js`** - PM2 process manager configuration
- **`.env.production.example`** - Production environment variables template

### Scripts
- **`deploy.sh`** - Automated deployment/update script
- **`backup.sh`** - Database backup script

## 🚀 Deployment Steps

### 1. Test Local Build
```bash
npm run build
```

### 2. Prepare Production Environment
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your production values
# nano .env.production

# Important: Update these values:
# - DATABASE_URL
# - AUTH_SECRET (generate with: openssl rand -base64 32)
# - NEXTAUTH_URL
```

### 3. Server Setup

#### Install Required Software
```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2
```

#### Setup Database
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE spwms_production;
CREATE USER spwms_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE spwms_production TO spwms_user;
\q
```

### 4. Transfer Files to Server

#### Option A: Using rsync (Recommended)
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ user@your-server:/var/www/spwms/
```

#### Option B: Using Git (Most Common)
```bash
# On server
cd /var/www
git clone your-repository-url spwms
cd spwms
git checkout main
```

### 5. Initial Deployment on Server

```bash
cd /var/www/spwms

# Install dependencies
npm ci --production=false

# Setup environment
cp .env.production .env
# Edit .env with production values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed initial data
# npm run db:seed

# Build application
npm run build

# Make scripts executable
chmod +x deployment/deploy.sh
chmod +x deployment/backup.sh

# Start with PM2
pm2 start deployment/ecosystem.config.js

# Configure PM2 startup
pm2 startup
# Follow the instructions from output

# Save PM2 configuration
pm2 save
```

### 6. Configure Nginx

```bash
# Copy nginx configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/spwms

# Update domain name in the file
sudo nano /etc/nginx/sites-available/spwms
# Change 'wms.yourdomain.com' to your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/spwms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d wms.yourdomain.com

# Certbot will automatically configure SSL in Nginx
```

## 🔄 Updating the Application

### Quick Update (Using deploy script)
```bash
cd /var/www/spwms
git pull origin main
./deployment/deploy.sh
```

### Manual Update
```bash
cd /var/www/spwms
git pull origin main
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart spwms
```

## 💾 Database Backups

### Manual Backup
```bash
./deployment/backup.sh
```

### Automated Backups (Cron Job)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/spwms/deployment/backup.sh
```

### Restore from Backup
```bash
# Unzip backup
gunzip /var/backups/spwms/spwms_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
psql -U spwms_user spwms_production < /var/backups/spwms/spwms_backup_YYYYMMDD_HHMMSS.sql
```

## 📊 Monitoring

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs spwms

# Monitor resources
pm2 monit

# Restart application
pm2 restart spwms

# Stop application
pm2 stop spwms

# View detailed info
pm2 info spwms
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PostgreSQL Commands
```bash
# Check status
sudo systemctl status postgresql

# Connect to database
psql -U spwms_user -d spwms_production

# View active connections
SELECT * FROM pg_stat_activity WHERE datname = 'spwms_production';
```

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs spwms --lines 100

# Check environment variables
cat .env

# Test Prisma connection
npx prisma db pull
```

### Database Connection Issues
```bash
# Test PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U spwms_user -d spwms_production

# Check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

### Nginx Issues
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm ci --production=false
npm run build
```

## 🔐 Security Best Practices

1. **Use strong passwords** for database and AUTH_SECRET
2. **Enable firewall** (ufw)
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. **Regular backups** - Set up automated daily backups
5. **Use SSL/HTTPS** - Always use SSL in production
6. **Restrict database access** - Only allow localhost connections
7. **Monitor logs** - Regularly check application and system logs

## 📞 Support

For issues or questions, refer to:
- Main README.md in project root
- Next.js documentation: https://nextjs.org/docs
- PM2 documentation: https://pm2.keymetrics.io/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_SECRET` | NextAuth secret key | Generated with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://wms.yourdomain.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SP WMS` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `2.0.0` |
