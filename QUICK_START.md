# Quick Start Guide - 5 Minute Deployment

Get Analisi Tracker deployed to production in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Git account
- Domain name (optional)

---

## Option A: Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Install Vercel CLI (30 seconds)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel (30 seconds)

```bash
vercel login
```

Follow the browser authentication prompts.

### Step 3: Deploy Project (2 minutes)

```bash
cd /path/to/analisi-tracker
vercel
```

### Step 4: Configure Environment Variables (1 minute)

Go to https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add variables (see .env.production.example for full list)

### Step 5: Deploy to Production (1 minute)

```bash
vercel --prod
```

Done! Your app is live at https://analisi-tracker.vercel.app

---

## Option B: Deploy to Docker (15 minutes)

### Step 1: Prepare Server (5 minutes)

Choose a provider and create a server with:
- 2 CPU cores
- 4GB RAM  
- 20GB SSD
- Ubuntu 20.04 or 22.04

### Step 2: Install Docker (3 minutes)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Step 3: Clone & Configure (3 minutes)

```bash
cd /opt
sudo git clone https://github.com/your-username/analisi-tracker.git
cd analisi-tracker
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### Step 4: Deploy (2 minutes)

```bash
docker-compose up -d
```

### Step 5: Verify (2 minutes)

```bash
curl http://localhost:3000/health
```

---

## Post-Deployment Setup

1. **Set up monitoring** (Sentry, uptime monitoring)
2. **Configure automated backups** (add to crontab)
3. **Set up domain and SSL** (Let's Encrypt)
4. **Run health check** (./scripts/health-check.sh)

See DEPLOYMENT_GUIDE.md for detailed instructions.

---

## Common Issues

**Port already in use:** Change PORT in .env.production
**Redis connection refused:** Check docker-compose ps redis
**Permission denied:** chmod +x scripts/*.sh

---

## Verification Checklist

- [ ] Health endpoint returns 200
- [ ] API endpoints work
- [ ] Frontend loads
- [ ] Redis is responsive
- [ ] No errors in logs
- [ ] SSL valid (if using domain)

---

**Congratulations!** 🎉 Your Analisi Tracker is now in production.

**Next:** Read DEPLOYMENT_GUIDE.md for detailed configuration.
