# 🐳 Docker Quick Start

## One-Command Deploy

```bash
# 1. Setup environment
cp .env.docker.example .env.docker

# 2. Edit passwords (IMPORTANT!)
notepad .env.docker  # On Windows
# or nano .env.docker  # On Linux/Mac

# 3. Start everything
docker-compose --env-file .env.docker up -d
```

🎉 **Done!** Access at `http://localhost:3000`

---

## 📝 What Gets Started

- ✅ PostgreSQL database
- ✅ SPWMS application
- ✅ Auto-migration on startup
- ✅ Health monitoring

---

## 🔧 Common Commands

```bash
# View logs
docker-compose logs -f app

# Check status
docker-compose ps

# Restart
docker-compose restart app

# Stop everything
docker-compose down
```

---

## 🆘 Troubleshooting

**Can't access localhost:3000?**
```bash
docker-compose logs app
```

**Database error?**
```bash
docker-compose restart postgres
docker-compose restart app
```

---

📖 **Full Guide:** `deployment/DOCKER.md`
