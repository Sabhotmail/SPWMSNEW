# 🚀 Production Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] สร้าง `.env.docker` จาก `.env.docker.example`
- [ ] อัปเดต `POSTGRES_PASSWORD` ให้ปลอดภัย
- [ ] อัปเดต `AUTH_SECRET` (หรือใช้ที่ generate ไว้)
- [ ] ตั้งค่า `NEXTAUTH_URL` ให้ตรงกับ production URL
- [ ] ตรวจสอบ Legacy DB settings (ถ้าต้องการ migrate)

### Server Preparation
- [ ] Ubuntu 20.04+ installed
- [ ] Docker & Docker Compose installed
- [ ] Git installed
- [ ] Firewall configured (ports 80, 443, 3000)
- [ ] Domain name pointed to server (optional)

### Security
- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] เปิด firewall
- [ ] ตั้งค่า SSL certificate (ถ้าใช้ domain)
- [ ] สร้าง backup strategy

---

## Deployment Steps

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd spwms-new
```

### 2. Configure Environment
```bash
cp .env.docker.example .env.docker
nano .env.docker  # แก้ไขตามต้องการ
```

### 3. Build & Start
```bash
docker-compose --env-file .env.docker build
docker-compose --env-file .env.docker up -d
```

### 4. Verify Deployment
```bash
docker-compose ps
docker-compose logs app
curl http://localhost:3000/api/health
```

### 5. Setup Nginx (Optional)
```bash
# Copy nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/spwms
sudo ln -s /etc/nginx/sites-available/spwms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Migrate Data (If Needed)
```bash
# On production server
docker-compose exec app node migrate-full.js
```

### 7. Setup Auto-start
```bash
# Docker containers auto-restart on boot
docker-compose --env-file .env.docker up -d
```

---

## Post-Deployment

### Monitoring
- [ ] ตรวจสอบ logs: `docker-compose logs -f`
- [ ] ตรวจสอบ resource usage: `docker stats`
- [ ] Test application ใช้งานได้
- [ ] Test database connection

### Backup
- [ ] Setup automated backups
- [ ] Test restore process
- [ ] Document backup location

### Maintenance
- [ ] Setup monitoring/alerting
- [ ] Document access credentials
- [ ] Schedule regular updates
- [ ] Plan for disaster recovery

---

## Rollback Plan

### If Deployment Fails:
```bash
# Stop containers
docker-compose down

# Check logs
docker-compose logs

# Restore from backup
docker-compose exec -T postgres psql -U spwms_user spwms_production < backup.sql

# Restart
docker-compose up -d
```

---

## Support Resources

📖 **Documentation:**
- Main Guide: `deployment/README.md`
- Docker Guide: `deployment/DOCKER.md`
- Quick Start: `deployment/QUICK_START.md`
- Environment Setup: `deployment/ENVIRONMENT_SETUP.md`

🔧 **Scripts:**
- Deploy: `deployment/deploy.sh`
- Backup: `deployment/backup.sh`
- Docker Helper: `deployment/docker-deploy.sh`

---

## Production URL

After deployment:
- **Application**: http://your-domain.com or http://your-server-ip:3000
- **Health Check**: http://your-domain.com/api/health
- **Login**: http://your-domain.com/login

---

**Ready to Deploy! 🚀**
