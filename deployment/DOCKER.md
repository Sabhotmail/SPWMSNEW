# 🐳 Docker Deployment Guide

This guide explains how to deploy SPWMS using Docker and Docker Compose.

## 📋 Prerequisites

- Docker (20.10.0+) and Docker Compose (2.0.0+) installed
- 4GB+ RAM recommended
- 10GB+ disk space

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit environment variables
# On Windows: notepad .env.docker
# On Linux/Mac: nano .env.docker
```

**Important variables to update:**
- `POSTGRES_PASSWORD` - Set a strong password
- `AUTH_SECRET` - Already generated for you
- `NEXTAUTH_URL` - Your production URL

### 2. Build and Start

```bash
# Build and start all services
docker-compose --env-file .env.docker up -d

# View logs
docker-compose logs -f app
```

### 3. Access Application

Open browser: `http://localhost:3000`

---

## 📦 Docker Services

The compose file includes:

1. **PostgreSQL** (`postgres`) - Database server
   - Port: 5432
   - Data: Persisted in volume `postgres_data`

2. **SPWMS App** (`app`) - Next.js application
   - Port: 3000
   - Auto-runs migrations on startup

3. **Nginx** (`nginx`) - Reverse proxy (optional)
   - Ports: 80, 443
   - Enable with: `--profile with-nginx`

---

## 🔧 Docker Commands

### Build & Start

```bash
# Build images
docker-compose --env-file .env.docker build

# Start services
docker-compose --env-file .env.docker up -d

# Start with Nginx
docker-compose --env-file .env.docker --profile with-nginx up -d
```

### Manage Services

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data!)
docker-compose down -v
```

### Database Operations

```bash
# Access database shell
docker-compose exec postgres psql -U spwms_user -d spwms_production

# Run migrations manually
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npm run db:seed

# Backup database
docker-compose exec postgres pg_dump -U spwms_user spwms_production > backup.sql

# Restore database
docker-compose exec -T postgres psql -U spwms_user spwms_production < backup.sql
```

### Application Management

```bash
# Restart app only
docker-compose restart app

# View app logs
docker-compose logs -f app

# Execute command in app container
docker-compose exec app sh

# Check app health
docker-compose exec app wget -qO- http://localhost:3000/api/health
```

---

## 🔄 Update Application

### Option 1: Rebuild (when Dockerfile changes)

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose --env-file .env.docker up -d --build app
```

### Option 2: Without rebuild (code changes only)

```bash
# Pull latest code
git pull origin main

# Restart container
docker-compose restart app
```

---

## 🌐 Production Deployment

### With Domain Name

1. Update `.env.docker`:
   ```bash
   NEXTAUTH_URL=https://wms.yourdomain.com
   ```

2. Enable Nginx profile:
   ```bash
   docker-compose --env-file .env.docker --profile with-nginx up -d
   ```

3. Setup SSL certificate (Let's Encrypt):
   ```bash
   # Install certbot in nginx container
   docker-compose exec nginx apk add certbot certbot-nginx
   
   # Obtain certificate
   docker-compose exec nginx certbot --nginx -d wms.yourdomain.com
   ```

### With IP Address Only

1. Update `.env.docker`:
   ```bash
   NEXTAUTH_URL=http://192.168.1.100:3000
   APP_PORT=3000
   ```

2. Access directly at: `http://192.168.1.100:3000`

---

## 📊 Monitoring

### View Resource Usage

```bash
# Container stats
docker stats spwms-app spwms-db

# Disk usage
docker system df
```

### Health Checks

```bash
# App health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U spwms_user
```

### Logs

```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 app

# Logs since timestamp
docker-compose logs --since="2026-01-16T10:00:00" app
```

---

## 💾 Backup & Restore

### Automated Backups

Create a cron job for automatic backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/spwms && docker-compose exec -T postgres pg_dump -U spwms_user spwms_production | gzip > backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Manual Backup

```bash
# Create backup directory
mkdir -p backups

# Backup database
docker-compose exec -T postgres pg_dump -U spwms_user spwms_production > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backups/backup_*.sql
```

### Restore Backup

```bash
# Stop application
docker-compose stop app

# Restore database
gunzip -c backups/backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U spwms_user spwms_production

# Restart application
docker-compose start app
```

---

## 🔐 Security Best Practices

1. **Passwords**
   - Use strong, unique passwords for `POSTGRES_PASSWORD`
   - Never commit `.env.docker` to version control

2. **Network**
   - Don't expose PostgreSQL port (5432) publicly
   - Use Nginx for SSL/TLS termination
   - Enable firewall and allow only necessary ports

3. **Updates**
   - Regularly update Docker images
   - Keep application dependencies updated

4. **Volumes**
   - Regularly backup `postgres_data` volume
   - Monitor disk usage

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check health
docker-compose ps
```

### Database connection error

```bash
# Check database is running
docker-compose ps postgres

# Check connection
docker-compose exec app npx prisma db pull
```

### Port already in use

```bash
# Change port in .env.docker
APP_PORT=3001

# Rebuild
docker-compose up -d
```

### Out of disk space

```bash
# Clean up unused images
docker system prune -a

# Remove old volumes (⚠️ backup first!)
docker volume prune
```

### Can't access application

```bash
# Check if container is running
docker-compose ps

# Check application logs
docker-compose logs app

# Check network
docker network inspect spwms_spwms-network
```

---

## 📁 Docker Files Reference

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build configuration |
| `docker-compose.yml` | Service orchestration |
| `.dockerignore` | Exclude files from build |
| `.env.docker.example` | Environment template |
| `deployment/docker-entrypoint.sh` | Startup script |
| `next.config.mjs` | Next.js standalone output config |

---

## 🚀 Quick Reference

### Development

```bash
docker-compose --env-file .env.docker up
```

### Production

```bash
docker-compose --env-file .env.docker up -d --build
```

### Logs

```bash
docker-compose logs -f app
```

### Restart

```bash
docker-compose restart app
```

### Stop

```bash
docker-compose down
```

---

## 💡 Tips

1. **Use Docker volumes** for persistent data
2. **Enable health checks** to monitor service status
3. **Use multi-stage builds** to reduce image size
4. **Implement CI/CD** for automated deployments
5. **Monitor resource usage** regularly

---

## 📞 Support

- Main Deployment Guide: `deployment/README.md`
- Quick Start: `deployment/QUICK_START.md`
- Environment Setup: `deployment/ENVIRONMENT_SETUP.md`

---

**Ready to deploy with Docker! 🐳**

Run: `docker-compose --env-file .env.docker up -d`
