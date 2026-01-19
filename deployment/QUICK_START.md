# 🚀 Quick Production Setup

## Step-by-Step Checklist

### ✅ 1. Setup Environment Variables

**Option A: Interactive (Easiest)**
```bash
node deployment/setup-env.js
```

**Option B: Manual**
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
```

**Required values to update:**
- [ ] `DATABASE_URL` - Production PostgreSQL connection
- [ ] `AUTH_SECRET` - Already generated: `dv7sDSXURuKEfm4II30O1kX7UzG2q0ZTKhNMJxsidi8=`
- [ ] `NEXTAUTH_URL` - Your production domain (e.g., `https://wms.yourdomain.com`)

📖 **Detailed guide:** `deployment/ENVIRONMENT_SETUP.md`

---

### ✅ 2. Verify Configuration

```bash
# Test database connection
npx prisma db pull

# Should output: ✔ Introspected X models
```

---

### ✅ 3. Test Local Production Build

```bash
npm run build

# Should output: ✓ Compiled successfully
```

---

### ✅ 4. Prepare for Deployment

**Choose your deployment method:**

#### Method A: Deploy to Ubuntu Server (Recommended)

Follow the complete guide: `.agent/workflows/deploy.md`

**Quick summary:**
```bash
# On your server
cd /var/www/spwms
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start deployment/ecosystem.config.js
```

#### Method B: Deploy with Docker

Run:
```bash
docker build -t spwms:latest .
docker run -d -p 3000:3000 --env-file .env.production spwms:latest
```

---

### ✅ 5. Post-Deployment Verification

- [ ] Access application at your production URL
- [ ] Test login functionality
- [ ] Verify database connectivity
- [ ] Check all main features work
- [ ] Review application logs

```bash
# Check PM2 logs
pm2 logs spwms

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📁 Important Files Reference

| File | Purpose |
|------|---------|
| `.env.production` | Production environment variables |
| `deployment/README.md` | Complete deployment documentation |
| `deployment/ENVIRONMENT_SETUP.md` | Environment setup guide |
| `.agent/workflows/deploy.md` | Step-by-step deployment workflow |
| `deployment/setup-env.js` | Interactive setup script |
| `deployment/nginx.conf` | Nginx configuration |
| `deployment/ecosystem.config.js` | PM2 configuration |
| `deployment/deploy.sh` | Automated deployment script |
| `deployment/backup.sh` | Database backup script |

---

## 🔐 Security Reminders

- ⚠️ **Never commit `.env.production` to Git**
- ⚠️ Use strong passwords (12+ characters, mixed case, numbers, symbols)
- ⚠️ Enable HTTPS/SSL in production
- ⚠️ Configure firewall to restrict access
- ⚠️ Keep backups in secure location
- ⚠️ Regularly update dependencies

---

## 🆘 Quick Troubleshooting

**Build fails?**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Database connection error?**
```bash
# Test connection
psql -U spwms_user -d spwms_production

# Check PostgreSQL status
sudo systemctl status postgresql
```

**Can't access application?**
```bash
# Check if running
pm2 status

# Check logs
pm2 logs spwms --lines 50
```

---

## 📞 Need Help?

1. Check detailed guides in `deployment/` folder
2. Review `.agent/workflows/deploy.md`
3. Run interactive setup: `node deployment/setup-env.js`

---

**Ready to deploy? 🚀**

Start here: `.agent/workflows/deploy.md`
