# Deployment Guide - Analisi Tracker

Complete guide for deploying the Analisi Tracker application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Option A: Vercel Deployment](#option-a-vercel-deployment)
4. [Option B: Docker Deployment](#option-b-docker-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Git account with access to the repository
- Domain name configured (optional)
- SSL/TLS certificates (for Docker deployment)
- Redis instance (can use managed services like Redis Cloud, AWS ElastiCache, or self-hosted)
- Sentry account (for error tracking) - [https://sentry.io](https://sentry.io)
- Monitoring service (optional but recommended)

---

## Deployment Options

The Analisi Tracker supports two deployment methods:

### Option A: Vercel (Recommended)
- **Best for:** Quick deployment, automatic scaling, global CDN
- **Pros:** Zero config, automatic HTTPS, preview deployments, free tier available
- **Cons:** Limited server-side control, vendor lock-in
- **Cost:** Free tier available, paid plans start at $20/month

### Option B: Docker + Cloud
- **Best for:** Full control, custom infrastructure, cost optimization
- **Pros:** Complete control, can deploy anywhere, no vendor lock-in
- **Cons:** Requires more setup, manual SSL management, need to manage scaling
- **Cost:** Depends on hosting provider (AWS/DigitalOcean/GCP)

---

## Option A: Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy Project

```bash
# Navigate to project directory
cd /path/to/analisi-tracker

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: analisi-tracker
# - In which directory is your code? Current directory
# - Want to override settings? N
```

### Step 4: Configure Environment Variables

In the Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables (see `.env.production.example`):

```
NODE_ENV=production
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
SENTRY_DSN=your-sentry-dsn
```

### Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use the CLI to promote
vercel alias set <deployment-url> analisi-tracker.vercel.app
```

### Step 6: Configure Custom Domain (Optional)

1. Go to project → Settings → Domains
2. Add your domain (e.g., `analisi-tracker.com`)
3. Configure DNS records as shown in the dashboard
4. Vercel will automatically provision SSL certificates

### Step 7: Verify Deployment

```bash
# Check health endpoint
curl https://analisi-tracker.vercel.app/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "uptime": 123.456,
#   "version": "1.0.0"
# }
```

---

## Option B: Docker Deployment

### Step 1: Prepare Server

Choose your cloud provider:
- AWS (EC2, ECS)
- Google Cloud Platform (Compute Engine, Cloud Run)
- DigitalOcean (Droplets)
- Any VPS provider

**Minimum requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Ubuntu 20.04+ or similar Linux distribution

### Step 2: Install Docker and Docker Compose

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Clone Repository

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/your-username/analisi-tracker.git
cd analisi-tracker

# Create non-root user
sudo useradd -m -s /bin/bash appuser
sudo chown -R appuser:appuser /opt/analisi-tracker
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required variables:**
```env
NODE_ENV=production
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
SENTRY_DSN=your-sentry-dsn
```

### Step 5: Obtain SSL Certificates

#### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot -y

# Generate certificates
sudo certbot certonly --standalone -d analisi-tracker.com

# Copy certificates to project
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/analisi-tracker.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/analisi-tracker.com/privkey.pem nginx/ssl/key.pem

# Set permissions
sudo chown -R appuser:appuser nginx/ssl
sudo chmod 644 nginx/ssl/*.pem
```

#### Option 2: Self-Signed (Development only)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=analisi-tracker.local"
```

### Step 6: Configure Nginx

Edit `nginx/nginx.conf` and update:
- `server_name`: Your domain name
- SSL certificate paths (if using custom paths)

### Step 7: Start Application

```bash
# Switch to app user
sudo -u appuser -i

# Navigate to project
cd /opt/analisi-tracker

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify all services are running
docker-compose ps
```

Expected output:
```
NAME                        STATUS    PORTS
analisi-tracker-app         Up        0.0.0.0:3000->3000/tcp
analisi-tracker-nginx       Up        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
analisi-tracker-redis       Up        0.0.0.0:6379->6379/tcp
```

### Step 8: Configure DNS

Point your domain to the server IP:

```
A    analisi-tracker.com     YOUR_SERVER_IP
A    www.analisi-tracker.com YOUR_SERVER_IP
```

### Step 9: Verify Deployment

```bash
# Check health endpoint
curl https://analisi-tracker.com/health

# Check HTTPS redirection
curl -I http://analisi-tracker.com

# Check SSL certificate
curl -vI https://analisi-tracker.com 2>&1 | grep -i ssl
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Analytics
MIN_DATA_POINTS=5
MAX_DATA_POINTS=1000

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Optional Variables

```bash
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache TTLs
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=3600
CACHE_TTL_LONG=86400
```

---

## Post-Deployment Setup

### 1. Set up Monitoring

#### Sentry Error Tracking
1. Create account at [https://sentry.io](https://sentry.io)
2. Create new project → Node.js → Express
3. Copy DSN to environment variables
4. Verify errors are being captured

#### Uptime Monitoring
Set up with one of these services:
- [UptimeRobot](https://uptimerobot.com) - Free
- [Pingdom](https://www.pingdom.com) - Paid
- [StatusCake](https://www.statuscake.com) - Free tier

Monitor: `https://your-domain.com/health`

### 2. Configure Backups

See [scripts/backup.sh](scripts/backup.sh) for automated backup setup.

### 3. Set Up Alerts

Configure alerts for:
- Application errors (Sentry)
- Downtime (Uptime monitoring)
- High CPU/memory usage (Cloud provider)
- Redis connection failures

### 4. Performance Monitoring

Install monitoring agents:
- New Relic
- Datadog
- Vercel Analytics (if using Vercel)

### 5. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

---

## Monitoring and Maintenance

### Daily Checks

- [ ] Check application logs: `docker-compose logs --tail=100`
- [ ] Verify health endpoint: `curl https://your-domain.com/health`
- [ ] Check Sentry for errors
- [ ] Review uptime monitoring dashboard

### Weekly Tasks

- [ ] Review and rotate logs
- [ ] Check disk space usage
- [ ] Review performance metrics
- [ ] Test backup restoration

### Monthly Tasks

- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review and optimize Redis memory
- [ ] Test disaster recovery procedures

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - Missing environment variables
# - Redis connection failed
# - Port already in use
```

### Redis connection issues

```bash
# Test Redis connection
redis-cli -h REDIS_HOST -p 6379 -a PASSWORD ping

# Should return: PONG
```

### High memory usage

```bash
# Check container stats
docker stats

# Restart services if needed
docker-compose restart

# Clear Redis cache
redis-cli -h REDIS_HOST FLUSHDB
```

### SSL certificate issues

```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Reload Nginx
docker-compose restart nginx
```

### Database/Cache corruption

```bash
# Clear application cache
redis-cli -h REDIS_HOST FLUSHDB

# Restart services
docker-compose restart app redis
```

---

## Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Review this guide's troubleshooting section
3. Check Sentry for errors
4. Create an issue on GitHub
5. Contact support team

---

## Next Steps

- Set up CI/CD pipeline (see `.github/workflows/`)
- Configure custom domain
- Set up staging environment
- Implement automated testing
- Review production checklist

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Sentry Documentation](https://docs.sentry.io)
