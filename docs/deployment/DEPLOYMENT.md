# Production Deployment Guide

Complete guide for deploying Analisi Tracker to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Traditional Server Deployment](#traditional-server-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Process Management](#process-management)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)
- [Scaling Considerations](#scaling-considerations)

---

## Prerequisites

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 20.04+, Debian 11+, RHEL 8+

**Recommended** (for 1000+ users):
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14.0 (if using database)
Redis >= 6.0 (if using cache/queues)

# Optional but recommended
Nginx >= 1.18 (reverse proxy)
PM2 (process manager)
Let's Encrypt (SSL certificates)
```

### Network Requirements

- **Inbound ports**:
  - 80 (HTTP)
  - 443 (HTTPS)
  - 22 (SSH - restrict to known IPs)

- **Outbound**: HTTPS to external APIs

---

## Deployment Options

### Option 1: Traditional VPS/Server

**Best for**: Full control, predictable costs

**Providers**:
- DigitalOcean
- Linode
- AWS EC2
- Google Cloud Compute
- Azure Virtual Machines

**Cost**: $5-50/month

### Option 2: Container (Docker)

**Best for**: Consistent environments, easy scaling

**Orchestration**:
- Docker Compose (single server)
- Kubernetes (multi-server, auto-scaling)
- AWS ECS
- Google Cloud Run

**Cost**: $10-100/month

### Option 3: Serverless Platform

**Best for**: Zero ops, auto-scaling

**Platforms**:
- Vercel (frontend)
- Railway (full-stack)
- Render (full-stack)
- Heroku (full-stack)

**Cost**: $0-100+/month (usage-based)

---

## Traditional Server Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Install Dependencies

```bash
# Install PostgreSQL (if using database)
sudo apt install -y postgresql postgresql-contrib

# Install Redis (if using cache)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

### Step 3: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/analisi-tracker
sudo chown -R $USER:$USER /var/www/analisi-tracker

# Clone repository
cd /var/www/analisi-tracker
git clone https://github.com/analisi-tracker/analisi-tracker.git .

# Install dependencies
npm install --production

# Build client (if separate)
cd client && npm install && npm run build && cd ..
```

### Step 4: Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit with production values
nano .env
```

**Critical settings**:
```bash
NODE_ENV=production
PORT=3000

# Database (if using)
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_DATABASE=analisi_tracker_prod
POSTGRES_USER=analisi_user
POSTGRES_PASSWORD=secure_password_here

# Redis (if using)
REDIS_HOST=localhost
REDIS_PASSWORD=redis_password_here

# Security
JWT_SECRET=generate_random_secret_key_min_32_chars
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://your-domain.com
```

### Step 5: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE analisi_tracker_prod;
CREATE USER analisi_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE analisi_tracker_prod TO analisi_user;
\q

# Run migrations (if using)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Step 6: Start Application

```bash
# Start with PM2
pm2 start server/index.js --name analisi-tracker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command output by the above command
```

### Step 7: Configure PM2 Ecosystem

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'analisi-tracker',
    script: './server/index.js',
    instances: 'max', // Or specific number
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

---

## Reverse Proxy Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/analisi-tracker`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL configuration (see next section)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client upload size (for PDF uploads)
    client_max_body_size 10M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files (if serving from Nginx)
    location /static/ {
        alias /var/www/analisi-tracker/client/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/analisi-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (configured automatically)
sudo certbot renew --dry-run
```

### Manual SSL (If you have certificates)

```nginx
ssl_certificate /path/to/fullchain.pem;
ssl_certificate_key /path/to/privkey.pem;

# Strong security
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

## Process Management

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# Stop application
pm2 stop analisi-tracker

# Restart application
pm2 restart analisi-tracker

# Reload (zero-downtime)
pm2 reload analisi-tracker

# View logs
pm2 logs analisi-tracker

# Monitor
pm2 monit

# List processes
pm2 list

# Show details
pm2 show analisi-tracker
```

### Updating Application

```bash
# Pull latest code
cd /var/www/analisi-tracker
git pull origin main

# Install dependencies
npm install --production

# Rebuild client (if needed)
cd client && npm run build && cd ..

# Restart application
pm2 restart analisi-tracker

# Or zero-downtime reload
pm2 reload analisi-tracker
```

---

## Monitoring & Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# View logs
pm2 logs --lines 100
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor resources
htop              # CPU and memory
iotop             # Disk I/O
df -h             # Disk space
free -h           # Memory usage
```

### Log Aggregation (Optional)

**ELK Stack** (Elasticsearch, Logstash, Kibana):
- Centralized logging
- Powerful search and visualization
- Alerting

**CloudWatch** (AWS):
- Native AWS integration
- Metrics and logs
- Alarms and dashboards

**Grafana + Prometheus**:
- Open-source monitoring
- Rich dashboards
- Alert management

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
sudo crontab -e

# Add: Backup at 2 AM daily
0 2 * * * pg_dump -U analisi_user analisi_tracker_prod | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
0 3 * * * find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

### Application Backups

```bash
# Backup uploaded files
rsync -avz /var/www/analisi-tracker/uploads/ /backups/files/

# Backup environment configuration
cp /var/www/analisi-tracker/.env /backups/.env.backup
```

### Offsite Backups

```bash
# Sync to S3
aws s3 sync /backups/ s3://analisi-tracker-backups/

# Or to Google Cloud
gsutil -m rsync -r /backups/ gs://analisi-tracker-backups
```

---

## Scaling Considerations

### Vertical Scaling (Single Server)

**When to use**: <1000 concurrent users

**Upgrades**:
- Increase CPU cores
- Add RAM
- Faster SSD storage
- Database tuning

### Horizontal Scaling (Multiple Servers)

**When to use**: >1000 concurrent users

**Setup**:
1. **Load balancer** (Nginx, HAProxy, AWS ALB)
2. **Multiple app servers** (behind load balancer)
3. **Shared database** (PostgreSQL with replication)
4. **Shared cache** (Redis Cluster)
5. **Shared storage** (S3, NFS)

### Database Scaling

**Read Replicas**:
- Primary for writes
- Replicas for reads
- Distribute load

**Connection Pooling**:
- PgBouncer for PostgreSQL
- Reduce connection overhead

**Caching**:
- Redis for frequent queries
- Reduce database load

---

## Performance Optimization

### Application Level

```javascript
// Enable compression
app.use(compression());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Cluster mode (PM2)
// ecosystem.config.js: instances: 'max'
```

### Database Level

```sql
-- Add indexes
CREATE INDEX idx_lab_tests_patient_date ON lab_tests(patient_id, test_date);
CREATE INDEX idx_lab_tests_type ON lab_tests(test_name);

-- Vacuum and analyze regularly
VACUUM ANALYZE lab_tests;
```

### Nginx Level

```nginx
# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m;

location /api/analytics/statistics {
    proxy_cache app_cache;
    proxy_cache_valid 200 1h;
    proxy_pass http://localhost:3000;
}
```

---

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Firewall configured (ufw)
- [ ] SSH key-based authentication only
- [ ] Fail2Ban installed
- [ ] Regular security updates
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Log aggregation setup
- [ ] Backup strategy in place
- [ ] Disaster recovery tested
- [ ] HIPAA compliance (if handling PHI)

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs analisi-tracker --lines 100

# Common issues:
# - Port already in use: sudo lsof -i :3000
# - Missing env vars: cat .env
# - Database connection: psql -h localhost -U analisi_user
```

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart analisi-tracker

# Consider reducing instances
# ecosystem.config.js: instances: 2 (instead of 'max')
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U analisi_user -d analisi_tracker_prod

# Check max connections
SHOW max_connections;
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream configuration
sudo nginx -t
```

---

## Cost Optimization

### Estimated Costs (Monthly)

**Small deployment** (100 users):
- VPS: $5-10
- Domain: $1
- SSL: Free (Let's Encrypt)
- **Total: ~$10/month**

**Medium deployment** (1000 users):
- VPS: $20-40
- Database: $15-30 (managed)
- Redis: $10-15 (managed)
- **Total: ~$50-85/month**

**Large deployment** (10000+ users):
- Load balancer: $20
- App servers: $100-200 (2-4 servers)
- Database: $100-200 (managed with replication)
- Redis: $50-100 (cluster)
- Storage: $10-50 (S3)
- **Total: ~$300-600/month**

---

## Production Checklist

### Pre-Deployment

- [ ] Code tested and reviewed
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] SSL certificates obtained
- [ ] DNS configured
- [ ] Firewall rules set
- [ ] Monitoring configured
- [ ] Backup strategy planned
- [ ] Rollback plan prepared

### Post-Deployment

- [ ] Application running (pm2 list)
- [ ] Nginx proxy working
- [ ] SSL/TLS valid
- [ ] Database connected
- [ ] Cache working
- [ ] API endpoints responding
- [ ] Frontend loading
- [ ] Logs flowing
- [ ] Monitoring alerts set
- [ ] First backup completed

---

**Version**: 1.0.0
**Last Updated**: April 2026

For additional deployment methods, see:
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
