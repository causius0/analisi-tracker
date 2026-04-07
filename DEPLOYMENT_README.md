# Production Deployment Infrastructure

Complete production-ready deployment infrastructure for the Analisi Tracker application.

## Quick Start

### Choose Your Deployment Option

**Option A: Vercel (Recommended - 5 minutes)**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Docker (15 minutes)**
```bash
# On your server
git clone https://github.com/your-username/analisi-tracker.git
cd analisi-tracker
cp .env.production.example .env.production
# Edit .env.production with your values
docker-compose up -d
```

## Documentation Index

### Essential Reading
1. **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment instructions
2. **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Pre and post-deployment verification
3. **[Rollback Guide](./ROLLBACK_GUIDE.md)** - Emergency rollback procedures

### Technical Details
4. **[Infrastructure Overview](./INFRASTRUCTURE.md)** - Architecture, scaling, and monitoring
5. **[Backup & Restore](./scripts/README.md)** - Backup procedures and disaster recovery

### Configuration Files
- `vercel.json` - Vercel deployment configuration
- `Dockerfile` - Production Docker image
- `docker-compose.yml` - Multi-container orchestration
- `nginx/nginx.conf` - Reverse proxy configuration

## Deployment Options Comparison

| Feature | Vercel | Docker |
|---------|--------|--------|
| **Setup Time** | 5 minutes | 15-30 minutes |
| **Scaling** | Automatic | Manual |
| **SSL** | Automatic | Manual (Let's Encrypt) |
| **Cost** | Free tier, $20+/mo | $50-100/mo |
| **Control** | Limited | Full |
| **Best For** | Quick deployment, global CDN | Custom infrastructure, cost optimization |

## What's Included

### Deployment Infrastructure
- ✅ Vercel configuration with preview deployments
- ✅ Multi-stage Dockerfile for production optimization
- ✅ Docker Compose for multi-container setup
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ Automatic HTTPS with Let's Encrypt

### CI/CD Pipeline
- ✅ GitHub Actions workflows
- ✅ Automated testing on pull requests
- ✅ Docker image building and pushing
- ✅ Staging and production environments
- ✅ Automated rollback on failure

### Monitoring & Observability
- ✅ Sentry error tracking integration
- ✅ Prometheus metrics collection
- ✅ Custom middleware for performance monitoring
- ✅ Health check endpoints
- ✅ Log aggregation

### Backup & Disaster Recovery
- ✅ Automated backup scripts (Redis, logs, config)
- ✅ One-click restore functionality
- ✅ S3 integration for off-site backups
- ✅ Backup retention policies
- ✅ Disaster recovery procedures

### Security
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting configuration
- ✅ CORS configuration
- ✅ Environment variable management
- ✅ Secret management best practices

### Automation Scripts
- ✅ `backup.sh` - Automated backups
- ✅ `restore.sh` - Disaster recovery
- ✅ `deploy.sh` - One-command deployment
- ✅ `health-check.sh` - Comprehensive monitoring

## Quick Reference

### Environment Setup

```bash
# Copy environment template
cp .env.production.example .env.production

# Required variables
NODE_ENV=production
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-password
SENTRY_DSN=your-sentry-dsn
```

### Deployment Commands

**Vercel:**
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Rollback
vercel rollback [deployment-url]
```

**Docker:**
```bash
# Deploy
./scripts/deploy.sh production

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Health check
./scripts/health-check.sh
```

### Backup & Restore

```bash
# Create backup
./scripts/backup.sh all

# List backups
./scripts/restore.sh --list

# Restore backup
./scripts/restore.sh /path/to/backup.gz
```

### Monitoring

```bash
# Health check
curl https://your-domain.com/health

# Metrics (if using Prometheus)
curl https://your-domain.com/metrics

# View logs
docker-compose logs --tail=100 app

# Check disk space
df -h
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Users / Clients                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CDN / Load Balancer                        │
│         (Vercel Edge / Cloudflare / Nginx)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Application Server                         │
│            (Node.js / Express / Port 3000)              │
└─────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  Redis   │  │   App    │  │   App    │
     │  Cache   │  │ Instance │  │ Instance │
     └──────────┘  └──────────┘  └──────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │   Monitoring         │
                               │ (Sentry + Prometheus)│
                               └──────────────────────┘
```

## Feature Checklist

### Deployment
- [x] Vercel deployment configuration
- [x] Docker multi-stage build
- [x] Docker Compose orchestration
- [x] Nginx reverse proxy
- [x] SSL/TLS support
- [x] Environment-specific configs

### CI/CD
- [x] GitHub Actions workflows
- [x] Automated testing
- [x] Security scanning (Trivy)
- [x] Docker image building
- [x] Automated deployment
- [x] Rollback procedures

### Monitoring
- [x] Error tracking (Sentry)
- [x] Metrics collection (Prometheus)
- [x] Health checks
- [x] Performance monitoring
- [x] Log aggregation

### Security
- [x] Security headers
- [x] Rate limiting
- [x] CORS configuration
- [x] Environment variable protection
- [x] SSL/TLS enforcement

### Backup & Recovery
- [x] Automated backups
- [x] One-click restore
- [x] S3 integration
- [x] Retention policies
- [x] Disaster recovery docs

## Cost Estimation

### Vercel Deployment
- **Free Tier:** $0/month
  - 100GB bandwidth
  - Serverless functions
  - Automatic SSL
- **Pro Tier:** $20/month
  - 1TB bandwidth
  - Priority support
  - Advanced features

### Docker Deployment (Self-Hosted)
- **Server:** $20-40/month (2 CPU, 4GB RAM)
- **Redis:** $15-30/month (managed) or $0 (self-hosted)
- **Domain:** $10-15/year
- **Monitoring:** Free tier or $10-50/month

**Total Estimated Cost:** $50-100/month for full Docker setup

## Support & Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
docker-compose logs app

# Common causes:
# - Missing environment variables
# - Redis connection failed
# - Port already in use
```

**High memory usage:**
```bash
# Check container stats
docker stats

# Restart services
docker-compose restart

# Clear cache
redis-cli FLUSHDB
```

**SSL certificate issues:**
```bash
# Renew Let's Encrypt
sudo certbot renew

# Reload Nginx
docker-compose restart nginx
```

### Getting Help

1. Check logs: `docker-compose logs -f`
2. Review documentation in this directory
3. Check Sentry for errors
4. Create issue on GitHub
5. Contact support team

## Next Steps

1. **Choose deployment option** (Vercel or Docker)
2. **Set up monitoring** (Sentry, uptime monitoring)
3. **Configure backups** (automated daily backups)
4. **Test deployment** (staging environment first)
5. **Set up alerts** (Slack/email notifications)
6. **Review security** (hardening checklist)
7. **Document custom configs** (keep docs updated)

## Maintenance Tasks

### Daily
- Check application logs
- Verify health endpoint
- Review Sentry errors

### Weekly
- Review and rotate logs
- Check disk space
- Review performance metrics

### Monthly
- Update dependencies
- Security audit
- Test backup restoration
- Review costs

## Additional Resources

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Step-by-step instructions
- [Production Checklist](./PRODUCTION_CHECKLIST.md) - Verification checklist
- [Rollback Guide](./ROLLBACK_GUIDE.md) - Emergency procedures
- [Infrastructure Overview](./INFRASTRUCTURE.md) - Technical details
- [Backup Documentation](./scripts/README.md) - Backup procedures

---

**Version:** 1.0.0
**Last Updated:** 2024-01-01
**Maintained By:** DevOps Team
