# Rollback Guide - Analisi Tracker

Procedures for rolling back deployments in case of issues.

## Table of Contents

1. [When to Rollback](#when-to-rollback)
2. [Pre-Rollback Checklist](#pre-rollback-checklist)
3. [Vercel Rollback](#vercel-rollback)
4. [Docker Rollback](#docker-rollback)
5. [Database Rollback](#database-rollback)
6. [Post-Rollback Verification](#post-rollback-verification)
7. [Emergency Procedures](#emergency-procedures)

---

## When to Rollback

### Immediate Rollback Required

- Application is completely down
- Critical security vulnerability detected
- Data loss or corruption occurring
- Performance degradation affecting all users
- Payment/transaction processing broken

### Consider Rollback

- Increased error rate (> 5%)
- Significant performance degradation
- User complaints about broken features
- Failed database migrations
- Third-party service integration broken

### Monitor Before Deciding

- Minor edge case bugs
- Cosmetic issues
- Non-critical feature broken
- Performance within acceptable range

---

## Pre-Rollback Checklist

### Assess the Situation

- [ ] Identify the problematic deployment (version, time)
- [ ] Determine the scope of the issue
- [ ] Estimate impact on users
- [ ] Check if hotfix is faster than rollback
- [ ] Notify team and stakeholders

### Prepare for Rollback

- [ ] Communicate with team about rollback
- [ ] Check current backup status
- [ ] Verify previous version is available
- [ ] Prepare to run health checks
- [ ] Have monitoring dashboard ready

### Before Rolling Back

```bash
# Check current deployment
vercel ls  # Vercel
docker ps  # Docker

# Check logs to understand issue
docker-compose logs --tail=500 app

# Check current version
curl https://your-domain.com/health
```

---

## Vercel Rollback

### Method 1: CLI Rollback (Recommended)

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Example:
# vercel rollback analisi-tracker-abc123.vercel.app

# Promote rollback to production
vercel --prod
```

### Method 2: Dashboard Rollback

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments"
4. Find the deployment before the problematic one
5. Click "Promote to Production"

### Method 3: Git Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to previous commit (use with caution)
git reset --hard HEAD^

# Push to trigger new deployment
git push origin main
```

### Vercel Rollback Verification

```bash
# Check deployment status
vercel ls

# Check health endpoint
curl https://analisi-tracker.vercel.app/health

# Verify version in response
```

---

## Docker Rollback

### Method 1: Docker Compose Tag Rollback

```bash
# View available images
docker images | grep analisi-tracker

# Output example:
# analisi-tracker-app   latest        abc123   10 minutes ago   500MB
# analisi-tracker-app   previous      def456   2 hours ago      495MB

# Edit docker-compose.yml
# Change image tag from 'latest' to 'previous' or specific SHA

nano docker-compose.yml

# Redeploy
docker-compose down
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Method 2: Git + Rebuild

```bash
# Navigate to project directory
cd /opt/analisi-tracker

# Checkout previous version
git log --oneline -10  # Find commit before issue
git checkout [commit-sha]

# Rebuild and redeploy
docker-compose down
docker-compose build
docker-compose up -d
```

### Method 3: Snapshot Rollback (If using LVM/snapshots)

```bash
# List snapshots
sudo lvdisplay

# Revert to snapshot
sudo lvconvert --merge /dev/vg0/analisi-snapshot

# Reboot server
sudo reboot
```

### Docker Rollback Verification

```bash
# Check all containers are running
docker-compose ps

# Check application health
curl http://localhost:3000/health

# Check logs for errors
docker-compose logs --tail=100 app

# Verify version
curl http://localhost:3000/health | jq '.version'
```

---

## Database Rollback

> **WARNING:** Database rollback should only be performed if absolutely necessary and after creating a new backup.

### PostgreSQL Rollback

```bash
# 1. Stop application
docker-compose stop app

# 2. Create emergency backup
docker-compose exec postgres pg_dump -U user dbname > /tmp/emergency-backup.sql

# 3. Restore from previous backup
docker-compose exec -T postgres psql -U user dbname < /backups/backup-2024-01-01.sql

# 4. Restart application
docker-compose start app

# 5. Verify
docker-compose logs -f app
```

### Redis Rollback

```bash
# 1. Create backup of current data
docker-compose exec redis redis-cli SAVE

# 2. Copy RDB file
docker cp analisi-tracker-redis:/data/dump.rdb /tmp/dump-current.rdb

# 3. Stop Redis
docker-compose stop redis

# 4. Restore previous RDB file (if you have backup)
docker cp /backups/redis-dump-2024-01-01.rdb analisi-tracker-redis:/data/dump.rdb

# 5. Start Redis
docker-compose start redis

# 6. Verify
docker-compose exec redis redis-cli PING
```

### Migration Rollback

```bash
# If your migrations have a down() method:
npm run migrate:down

# Or manually revert specific migration
npm run migrate:rollback -- --migration=20240101-initial.js
```

---

## Post-Rollback Verification

### Health Checks

```bash
# 1. Check health endpoint
curl https://your-domain.com/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "uptime": 123.456,
#   "version": "previous-version"
# }

# 2. Check API endpoints
curl https://your-domain.com/api/analytics/trends/123

# 3. Check frontend loads
curl -I https://your-domain.com

# 4. Check SSL certificate
curl -vI https://your-domain.com 2>&1 | grep -i ssl
```

### Functional Testing

- [ ] User login works
- [ ] Data import works
- [ ] Analytics computations work
- [ ] Charts render correctly
- [ ] Export functionality works
- [ ] No console errors in browser

### Performance Verification

- [ ] Page load time acceptable
- [ ] API response time normal
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Redis memory usage stable

### Monitoring Verification

- [ ] Sentry shows reduced errors
- [ ] Uptime monitors show green
- [ ] Metrics look normal
- [ ] No unusual log entries

---

## Emergency Procedures

### Application Completely Down

```bash
# 1. Quick check - is process running?
docker-compose ps

# 2. Check logs
docker-compose logs --tail=100 app

# 3. Restart services
docker-compose restart app

# 4. If still down, rollback
# (see Docker rollback steps above)

# 5. If that fails, restore from backup
./scripts/emergency-restore.sh
```

### Database Corruption

```bash
# 1. IMMEDIATELY stop all writes
docker-compose stop app

# 2. Create backup of corrupted data (just in case)
docker-compose exec postgres pg_dump -U user dbname > /tmp/corrupted-backup.sql

# 3. Restore from last known good backup
docker-compose exec -T postgres psql -U user dbname < /backups/backup-good.sql

# 4. Start application
docker-compose start app

# 5. Verify data integrity
docker-compose exec app npm run test:data-integrity
```

### High CPU/Memory Usage

```bash
# 1. Check container stats
docker stats

# 2. Check application logs
docker-compose logs app | grep -i error

# 3. Check for runaway processes
docker-compose exec app ps aux

# 4. Restart problematic service
docker-compose restart app

# 5. Clear cache
docker-compose exec redis redis-cli FLUSHDB

# 6. If issue persists, rollback
```

### Security Incident

```bash
# 1. IMMEDIATE rollback to previous version
docker-compose down
git checkout [safe-commit]
docker-compose up -d

# 2. Force password rotation
# - Redis password
# - Database password
# - API keys

# 3. Review logs for intrusion indicators
docker-compose logs --tail=1000 > /tmp/security-investigation.log

# 4. Notify security team and stakeholders

# 5. Enable additional monitoring

# 6. Conduct post-incident review
```

---

## Rollback Decision Tree

```
Is the application completely down?
├─ Yes → Immediate rollback
│        └─ Use fastest method available
└─ No → Is data being corrupted?
         ├─ Yes → Immediate rollback + database restore
         │         └─ Create backup before restoring
         └─ No → Is it affecting all users?
                  ├─ Yes → Rollback within 15 minutes
                  │         └─ Consider hotfix if faster
                  └─ No → Monitor for 30 minutes
                            └─ Rollback if >10% error rate
```

---

## Communication During Rollback

### Internal Team

```markdown
🚨 ROLLBACK IN PROGRESS

**Issue:** [Brief description]
**Impact:** [Number of users affected]
**Action:** Rolling back to version [X.X.X]
**ETA:** [Estimated time to restore]
**Lead:** [Person in charge]
```

### External Communication (if needed)

```markdown
⚠️ We're experiencing technical difficulties.

Our team is working to restore service as quickly as possible.
We apologize for any inconvenience.

**Status:** https://status.your-domain.com
**Estimated Resolution:** [Time]
```

---

## Post-Rollback Actions

### Immediate (0-1 hour)

- [ ] Verify application is stable
- [ ] Check all critical functions work
- [ ] Monitor error rates drop to normal
- [ ] Update team on resolution

### Short-term (1-24 hours)

- [ ] Conduct postmortem analysis
- [ ] Identify root cause
- [ ] Create hotfix if needed
- [ ] Update runbooks
- [ ] Communicate with stakeholders

### Long-term (1-7 days)

- [ ] Implement permanent fix
- [ ] Add tests to prevent regression
- [ ] Review rollback procedures
- [ ] Update documentation
- [ ] Conduct team retrospective

---

## Prevention

### How to Avoid Future Rollbacks

- [ ] Implement comprehensive testing
- [ ] Use canary deployments
- [ ] Add feature flags
- [ ] Implement gradual rollouts
- [ ] Improve monitoring and alerts
- [ ] Conduct load testing
- [ ] Use staging environment for validation

### Improving Rollback Speed

- [ ] Automate rollback scripts
- [ ] Practice rollback procedures
- [ ] Document all deployment steps
- [ ] Maintain backup versions
- [ ] Use blue-green deployment
- [ ] Implement automated health checks

---

## Emergency Contacts

- [ ] DevOps Lead: _____________ (Phone: ______)
- [ ] Backend Lead: _____________ (Phone: ______)
- [ ] Database Admin: _____________ (Phone: ______)
- [ ] On-Call Engineer: _____________ (Phone: ______)

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Infrastructure Overview](./INFRASTRUCTURE.md)
- [Backup Procedures](./scripts/README.md)

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0
**Maintained By:** DevOps Team
