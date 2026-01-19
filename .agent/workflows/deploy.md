---
description: Production deployment workflow for SPWMS
---

# Production Deployment Workflow

This workflow guides you through deploying the SPWMS application to a production Ubuntu server.

## Prerequisites
- Ubuntu server (20.04 LTS or higher) with root/sudo access
- Domain name or IP address for the server
- SSH access to the server

## Step 1: Local Build Test
Before deploying, ensure the application builds successfully:

```bash
npm run build
```

This will test that all TypeScript types are correct and the build process completes without errors.

## Step 2: Prepare Production Environment File
Create a `.env.production` file with production settings:

```bash
# Copy the template to create production env
cp .env .env.production
```

Then update the following values in `.env.production`:
- `DATABASE_URL`: Production PostgreSQL connection string
- `AUTH_SECRET`: Generate a strong secret (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your production domain (e.g., https://wms.yourdomain.com)

## Step 3: Server Setup - Install Dependencies
SSH into your server and install required software:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install build essentials
sudo apt install -y build-essential
```

## Step 4: Setup PostgreSQL Database
Configure the production database:

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE spwms_production;
CREATE USER spwms_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE spwms_production TO spwms_user;
\q
```

## Step 5: Transfer Application Files
From your local machine, transfer the application to the server:

```bash
# Option 1: Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ user@your-server:/var/www/spwms/

# Option 2: Using SCP
scp -r . user@your-server:/var/www/spwms/
```

Alternatively, you can use Git:
```bash
# On server
cd /var/www
git clone your-repository-url spwms
cd spwms
```

## Step 6: Install Dependencies and Build on Server
SSH into the server and build the application:

```bash
cd /var/www/spwms

# Install dependencies
npm ci --production=false

# Copy production env file
cp .env.production .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build
```

## Step 7: Setup PM2 Process Manager
Configure PM2 to run the application:

```bash
# Start the application with PM2
pm2 start npm --name "spwms" -- start

# Configure PM2 to start on system boot
pm2 startup
# Follow the instructions from the command output

# Save the PM2 process list
pm2 save

# Check application status
pm2 status
pm2 logs spwms
```

## Step 8: Configure Nginx Reverse Proxy
Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/spwms
```

Add the following configuration (see nginx.conf file in deployment folder).

Then enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/spwms /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 9: Setup SSL Certificate (Optional but Recommended)
Install and configure Let's Encrypt SSL:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d wms.yourdomain.com

# Certbot will automatically update Nginx config
```

## Step 10: Verify Deployment
- Visit your domain (e.g., https://wms.yourdomain.com)
- Test login functionality
- Check database connections
- Verify all features work correctly

## Monitoring and Maintenance

### View Application Logs
```bash
pm2 logs spwms
```

### Restart Application
```bash
pm2 restart spwms
```

### Update Application
```bash
cd /var/www/spwms
git pull origin main
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart spwms
```

### Database Backup
```bash
# Create backup
pg_dump -U spwms_user spwms_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U spwms_user spwms_production < backup_file.sql
```

## Troubleshooting

### Application won't start
- Check PM2 logs: `pm2 logs spwms`
- Verify environment variables: `cat .env`
- Check database connection: `npx prisma db pull`

### Database connection errors
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env file
- Test connection: `psql -U spwms_user -d spwms_production`

### Nginx errors
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify configuration: `sudo nginx -t`
- Check if port 3000 is accessible: `netstat -tlnp | grep 3000`
