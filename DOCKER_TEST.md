# 🐳 Docker Testing Guide

## Quick Test - Start & Verify

### 1. Start Docker Containers
```powershell
docker-compose --env-file .env.docker up -d
```

### 2. Check Status
```powershell
docker-compose ps
```

### 3. View Logs
```powershell
docker-compose logs -f app
```

### 4. Test Application
```
เปิดเบราว์เซอร์: http://localhost:3000
Health Check: http://localhost:3000/api/health
```

### 5. Stop When Done
```powershell
docker-compose down
```

## 📊 What to Expect

✅ PostgreSQL running on port 5432
✅ Next.js app running on port 3000  
✅ Auto-migration on startup
✅ Health monitoring enabled

## 🔧 Useful Commands

```powershell
# View all containers
docker-compose ps

# View app logs
docker-compose logs app --tail=50

# Restart app only
docker-compose restart app

# Access PostgreSQL
docker-compose exec postgres psql -U spwms_user -d spwms_production

# Stop all
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## ⚠️ Note

- Docker database is **separate** from development database
- Use this for testing deployment process
- For development, continue using `npm run dev`
