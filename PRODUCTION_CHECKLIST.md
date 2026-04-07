# Production Deployment Checklist

Use this checklist to ensure your production deployment is properly configured and secure.

## Pre-Deployment Checklist

### Environment Configuration

- [ ] `.env.production` file created with all required variables
- [ ] All secrets properly configured (Redis password, Sentry DSN, etc.)
- [ ] `NODE_ENV=production` set
- [ ] Redis connection verified
- [ ] Port configuration verified (default: 3000)

### Security

- [ ] Strong passwords generated for all services (Redis, database, etc.)
- [ ] SSL/TLS certificates installed and valid
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] SSH access secured (key-based, no root login)
- [ ] Fail2ban installed and configured
- [ ] Regular security updates planned

### Application

- [ ] All dependencies audited: `npm audit`
- [ ] Outdated dependencies updated: `npm outdated`
- [ ] Code linting passes: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Build successful: `npm run build`
- [ ] Environment-specific configs tested

### Monitoring & Logging

- [ ] Sentry error tracking configured
- [ ] Performance monitoring set up (Prometheus/New Relic)
- [ ] Log aggregation configured
- [ ] Uptime monitoring configured
- [ ] Alert notifications configured (email/Slack)
- [ ] Health check endpoint accessible: `/health`
- [ ] Metrics endpoint accessible: `/metrics` (if using Prometheus)

### Backups

- [ ] Automated backup scripts configured
- [ ] Backup retention policy set (30+ days)
- [ ] Backup restoration tested
- [ ] Off-site backup storage configured (S3, etc.)
- [ ] Database backup scheduled (if using database)
- [ ] User uploads backup scheduled (if applicable)

### DNS & Domain

- [ ] Domain configured and pointing to correct IP
- [ ] DNS propagated (check with `dig` or `nslookup`)
- [ ] Custom domain configured in deployment platform
- [ ] WWW subdomain redirected to main domain
- [ ] DNS records verified (A, CNAME, MX if needed)

---

## Deployment Checklist

### Vercel Deployment

- [ ] Vercel CLI installed and authenticated
- [ ] Project linked to Vercel
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured (if applicable)
- [ ] Deployment successful: `vercel --prod`
- [ ] Preview deployments enabled
- [ ] Team permissions configured

### Docker Deployment

- [ ] Docker and Docker Compose installed on server
- [ ] Repository cloned to server
- [ ] Non-root user created for application
- [ ] Environment file configured
- [ ] SSL certificates installed
- [ ] Nginx configured
- [ ] Docker Compose services started: `docker-compose up -d`
- [ ] All containers running: `docker-compose ps`
- [ ] Container restart policies configured
- [ ] Resource limits configured (CPU, memory)

---

## Post-Deployment Verification

### Application Health

- [ ] Health check returns 200: `curl https://your-domain.com/health`
- [ ] API endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] User authentication works (if applicable)
- [ ] Data import/export functions work
- [ ] Analytics computations work
- [ ] Caching works correctly

### Performance

- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (p95)
- [ ] No memory leaks (monitor for 24 hours)
- [ ] CPU usage < 70% under normal load
- [ ] Redis memory usage stable
- [ ] Database query performance acceptable

### Security Verification

- [ ] SSL certificate valid (check expiry date)
- [ ] HTTPS works correctly
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present:
  ```bash
  curl -I https://your-domain.com | grep -E "X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security"
  ```
- [ ] No sensitive data in error messages
- [ ] Rate limiting works (test with burst requests)
- [ ] CORS headers correct
- [ ] No console errors in browser

### Monitoring Verification

- [ ] Sentry receives errors (test by triggering error)
- [ ] Uptime monitoring shows site as UP
- [ ] Metrics are being collected
- [ ] Logs are being written
- [ ] Alerts are triggered correctly

### Backup Verification

- [ ] Automated backups run successfully
- [ ] Backup files exist and are not empty
- [ ] Backup restoration tested and works
- [ ] Backup retention policy working

---

## Ongoing Maintenance Checklist

### Daily

- [ ] Check application logs for errors
- [ ] Verify health endpoint
- [ ] Review Sentry errors
- [ ] Check uptime monitoring dashboard
- [ ] Monitor resource usage (CPU, memory, disk)

### Weekly

- [ ] Review and archive logs
- [ ] Check disk space usage
- [ ] Review performance metrics
- [ ] Test backup restoration
- [ ] Check for security updates
- [ ] Review error trends

### Monthly

- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Review and optimize Redis memory
- [ ] Test disaster recovery procedures
- [ ] Review and update documentation
- [ ] Review costs and optimize resources
- [ ] Clean up old backups
- [ ] Review user feedback

### Quarterly

- [ ] Major version upgrades for dependencies
- [ ] Security penetration testing
- [ ] Performance audit and optimization
- [ ] Review and update security policies
- [ ] Disaster recovery drill
- [ ] Architecture review
- [ ] Cost analysis and optimization

---

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# View deployment history
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Quick Rollback (Docker)

```bash
# View previous images
docker images | grep analisi-tracker

# Rollback to previous version
docker-compose down
# Update image tag in docker-compose.yml
docker-compose up -d
```

### Database Rollback (if applicable)

```bash
# Restore from backup
./scripts/restore.sh /backups/backup-YYYY-MM-DD.sql
```

### Verification After Rollback

- [ ] Application starts successfully
- [ ] Health check passes
- [ ] Critical functionality works
- [ ] No new errors in logs
- [ ] Performance acceptable

---

## Emergency Contacts

- [ ] DevOps lead: _____________
- [ ] Backend lead: _____________
- [ ] Frontend lead: _____________
- [ ] On-call rotation: _____________
- [ ] Emergency escalation: _____________

---

## Documentation Links

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Rollback Guide](./ROLLBACK_GUIDE.md)
- [Infrastructure Overview](./INFRASTRUCTURE.md)
- [Backup Procedures](./scripts/README.md)

---

## Notes

```
Date: ___________
Deployed by: ___________
Version: ___________
Issues encountered: ___________
Resolution: ___________
```

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0
