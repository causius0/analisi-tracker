# Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for common incidents that may occur with the analisi-tracker application.

## Incident Categories

1. [Application Down](#1-application-down)
2. [High Error Rate](#2-high-error-rate)
3. [Slow Performance](#3-slow-performance)
4. [Database Issues](#4-database-issues)
5. [Memory Issues](#5-memory-issues)
6. [Security Incident](#6-security-incident)
7. [Third-Party Service Outage](#7-third-party-service-outage)

---

## 1. Application Down

### Symptoms
- All API requests returning 5xx errors
- Health check endpoint failing
- Application not responding

### Severity
**CRITICAL** - Immediate response required

### Diagnosis

**Step 1: Verify the Outage**
```bash
curl https://api.analisi-tracker.com/health
```

**Step 2: Check Server Status**
```bash
# Check if server is running
ps aux | grep node

# Check server logs
tail -f /var/log/analisi-tracker/application.log

# Check system resources
top
df -h
```

**Step 3: Check Database Connectivity**
```bash
# Test database connection
psql -h localhost -U user -d analisi_tracker -c "SELECT 1;"
```

**Step 4: Check Recent Changes**
- Review recent deployments
- Check Git commit history
- Review recent configuration changes

### Resolution

**If Server Crashed:**
```bash
# Restart server
pm2 restart analisi-tracker
# or
systemctl restart analisi-tracker
```

**If Out of Memory:**
```bash
# Check memory usage
free -h

# Restart server
pm2 restart analisi-tracker

# If problem persists, increase memory limit
pm2 start server/index.js --name analisi-tracker --max-memory-restart 1G
```

**If Database Connection Lost:**
```bash
# Check database status
systemctl status postgresql

# Restart database
systemctl restart postgresql
```

**If Recent Deployment Caused Issue:**
```bash
# Rollback deployment
git revert HEAD
npm install
pm2 restart analisi-tracker
```

### Prevention
- Set up memory monitoring with auto-restart
- Implement rolling deployments
- Add database connection pooling
- Implement circuit breakers for external services

### Related Docs
- [Deployment Guide](./DEPLOYMENT.md)
- [Database Guide](./DATABASE_GUIDE.md)

---

## 2. High Error Rate

### Symptoms
- Error rate > 5%
- Multiple 5xx errors in logs
- Sentry showing error spike

### Severity
**WARNING** - Respond within 1 hour

### Diagnosis

**Step 1: Check Error Dashboard**
- Go to Sentry Error Dashboard
- Identify top errors
- Check if errors are related

**Step 2: Check Recent Deployments**
```bash
git log --oneline -10
```

**Step 3: Check Database**
```bash
# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check for long-running queries
psql -c "SELECT pid, query, state, wait_event FROM pg_stat_activity WHERE state != 'idle';"
```

**Step 4: Check External APIs**
- Test third-party API endpoints
- Check API rate limits
- Review API credentials

### Resolution

**If New Error Introduced:**
```bash
# Find the commit that introduced the error
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit>
git bisect run npm test

# Revert the problematic commit
git revert <commit-hash>
pm2 restart analisi-tracker
```

**If Database Query Failing:**
```bash
# Check database logs
tail -f /var/log/postgresql/postgresql.log

# Fix query or add proper error handling
```

**If External API Failing:**
- Enable fallback mode
- Implement retry logic
- Contact API provider if needed

### Prevention
- Add comprehensive error handling
- Implement circuit breakers
- Add integration tests
- Monitor external API status

---

## 3. Slow Performance

### Symptoms
- API response times > 1s (p95)
- Slow page loads
- User complaints about slowness

### Severity
**WARNING** - Respond within 2 hours

### Diagnosis

**Step 1: Check Performance Dashboard**
- Go to Sentry Performance Dashboard
- Identify slow transactions
- Find bottleneck

**Step 2: Check Database Performance**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE n_distinct > 100
ORDER BY n_distinct DESC;
```

**Step 3: Check Cache Performance**
```bash
curl https://api.analisi-tracker.com/api/monitoring/metrics | jq '.cache'
```

**Step 4: Check System Resources**
```bash
# CPU usage
top

# Memory usage
free -h

# Disk I/O
iostat -x 1
```

### Resolution

**If Slow Database Query:**
```sql
-- Add index
CREATE INDEX idx_lab_test_results_date ON lab_test_results(test_date);

-- Update query statistics
ANALYZE lab_test_results;

-- Rebuild indexes
REINDEX DATABASE analisi_tracker;
```

**If Low Cache Hit Rate:**
```bash
# Review cache TTL settings
# Increase cache size
# Implement query result caching
```

**If High CPU Usage:**
```bash
# Profile CPU usage
node --prof server/index.js
node --prof-process isolate-*.log > profile.txt

# Optimize hot paths
# Implement worker queues for heavy processing
```

**If Memory Issues:**
See [Memory Issues](#5-memory-issues)

### Prevention
- Add database indexes
- Implement caching strategy
- Optimize N+1 queries
- Use connection pooling
- Implement rate limiting

---

## 4. Database Issues

### Symptoms
- Database connection errors
- Slow queries
- Database locks
- Replication lag

### Severity
**CRITICAL** - Respond within 15 minutes

### Diagnosis

**Step 1: Check Database Status**
```bash
# Check if database is running
systemctl status postgresql

# Check database logs
tail -f /var/log/postgresql/postgresql.log
```

**Step 2: Check Database Connections**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check connection limits
SELECT max_connections FROM pg_settings;

-- Find long-running queries
SELECT pid, query, state, wait_event
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

**Step 3: Check Database Locks**
```sql
SELECT l.locktype, l.relation::regclass, l.mode, l.granted
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted;
```

**Step 4: Check Disk Space**
```bash
df -h /var/lib/postgresql
```

### Resolution

**If Too Many Connections:**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < now() - interval '10 minutes';
```

**If Database Locked:**
```sql
-- Kill blocking query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = <blocking-pid>;
```

**If Disk Full:**
```bash
# Clean up old logs
# Vacuum database
psql -c "VACUUM FULL ANALYZE;"

# Add more disk space
```

**If Database Crashed:**
```bash
# Restart database
systemctl restart postgresql

# Check for corruption
psql -c "SELECT * FROM pg_stat_database;"
```

### Prevention
- Set up connection pooling
- Implement query timeouts
- Monitor database performance
- Regular VACUUM and ANALYZE
- Set up replication

---

## 5. Memory Issues

### Symptoms
- Out of memory errors
- High memory usage (> 90%)
- Server crashes

### Severity
**CRITICAL** - Respond within 30 minutes

### Diagnosis

**Step 1: Check Memory Usage**
```bash
# Overall memory
free -h

# Process memory
ps aux --sort=-%mem | head

# Node.js heap
node --heap-prof server/index.js
```

**Step 2: Check for Memory Leaks**
```bash
# Take heap snapshot
kill -USR2 <pid>

# Analyze with Chrome DevTools
# Look for retaining paths
# Find detached DOM nodes
```

**Step 3: Check Cache Size**
```bash
curl https://api.analisi-tracker.com/api/monitoring/metrics | jq '.cache'
```

### Resolution

**If Out of Memory:**
```bash
# Restart server
pm2 restart analisi-tracker

# Increase memory limit
pm2 start server/index.js --max-memory-restart 2G
```

**If Memory Leak:**
```javascript
// Find and fix leak
// Common causes:
// - Global variables
// - Event listeners not removed
// - Caches growing unbounded
// - closures retaining references
```

**If Cache Too Large:**
```javascript
// Reduce cache size
const cache = new NodeCache({
  stdTTL: 3600,
  maxKeys: 1000, // Limit cache size
  checkperiod: 600,
});

// Implement cache eviction
cache.on('expired', (key, value) => {
  console.log(`Cache key expired: ${key}`);
});
```

### Prevention
- Set memory limits
- Monitor memory usage
- Implement cache limits
- Fix memory leaks
- Use streaming for large data

---

## 6. Security Incident

### Symptoms
- Suspicious activity in logs
- Unauthorized access attempts
- Data breach indicators
- OWASP vulnerabilities detected

### Severity
**CRITICAL** - Immediate response required

### Diagnosis

**Step 1: Identify the Incident**
- Review access logs
- Check authentication logs
- Review Sentry security events
- Check for OWASP vulnerabilities

**Step 2: Assess Impact**
- Determine what was accessed
- Identify affected users
- Check for data exfiltration
- Review system changes

**Step 3: Contain the Incident**
```bash
# Block suspicious IPs
iptables -A INPUT -s <suspicious-ip> -j DROP

# Disable affected accounts
# Revoke compromised API keys
# Enable maintenance mode if needed
```

### Resolution

**If SQL Injection Attempt:**
```javascript
// Sanitize all inputs
// Use parameterized queries
// Implement input validation
// Add WAF rules
```

**If XSS Attempt:**
```javascript
// Sanitize user input
// Implement Content Security Policy
// Escape output
// Use HTTPOnly cookies
```

**If Authentication Bypass:**
```javascript
// Review authentication logic
// Implement rate limiting
// Add MFA
// Review session management
```

**If Data Breach:**
1. Notify security team immediately
2. Preserve logs and evidence
3. Notify affected users
4. Document incident
5. Implement remediation

### Prevention
- Regular security audits
- Implement WAF
- Use HTTPS everywhere
- Regular dependency updates
- Security training
- Penetration testing

---

## 7. Third-Party Service Outage

### Symptoms
- AI/LLM API failures
- External service timeouts
- Rate limit errors

### Severity
**WARNING** - Respond within 1 hour

### Diagnosis

**Step 1: Identify the Service**
- Check which service is failing
- Review error logs
- Check service status page

**Step 2: Check Service Status**
```bash
# Test API endpoint
curl -I https://api.openai.com/v1/models

# Check rate limits
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/rate_limits
```

**Step 3: Check API Credentials**
```bash
# Verify API key is valid
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Resolution

**If Service Down:**
```javascript
// Enable fallback mode
const AI_FALLBACK_MODE = true;

// Show user-friendly message
return res.json({
  error: 'AI service temporarily unavailable',
  fallback: 'Basic analytics available',
});
```

**If Rate Limit Exceeded:**
```javascript
// Implement exponential backoff
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

**If API Key Invalid:**
```bash
# Regenerate API key
# Update environment variables
# Restart service
pm2 restart analisi-tracker
```

### Prevention
- Implement circuit breakers
- Add fallback functionality
- Monitor API usage
- Set up alerts for rate limits
- Use multiple providers if possible

---

## Incident Communication

### Internal Communication
1. **Immediate:** Post to Slack #critical
2. **Within 15 min:** Create incident ticket
3. **Within 30 min:** Provide status update
4. **Resolved:** Postmortem in 24 hours

### External Communication
1. **Severity 1:** Notify users within 15 minutes
2. **Severity 2:** Notify users within 1 hour
3. **Severity 3:** Post incident report

### Incident Report Template

```markdown
# Incident Report: [Title]

**Date:** [Date/time]
**Severity:** [Critical/Warning/Info]
**Duration:** [Start time] - [End time]
**Impact:** [Number of users affected]

## Summary
[Brief description of what happened]

## Timeline
- **HH:MM** - Incident detected
- **HH:MM** - Investigation started
- **HH:MM** - Root cause identified
- **HH:MM** - Fix implemented
- **HH:MM** - Service restored

## Root Cause
[Technical explanation of what went wrong]

## Resolution
[What was done to fix it]

## Prevention
[What will be done to prevent recurrence]

## Action Items
- [ ] [Action item 1]
- [ ] [Action item 2]
```

---

## On-Call Procedures

### Rotation
- Week 1: Senior Backend Engineer
- Week 2: Senior Frontend Engineer
- Week 3: DevOps Engineer
- Week 4: Engineering Manager

### Responsibilities
- Monitor alerts 24/7
- Respond to critical alerts within 15 minutes
- Document incidents
- Escalate if needed

### Handoff
1. Review open incidents
2. Update runbook
3. Notify team of ongoing issues
4. Transfer PagerDuty

---

## Continuous Improvement

### Weekly Reviews
- Review all incidents
- Update runbook
- Identify patterns
- Propose improvements

### Monthly Drills
- Simulate critical incident
- Practice response procedures
- Test alert system
- Review escalation paths

### Quarterly Reviews
- Update monitoring strategy
- Adjust alert thresholds
- Review tooling
- Update documentation

---

## Resources

- [Monitoring Guide](./MONITORING_GUIDE.md)
- [Alerting Guide](./ALERTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Sentry Dashboard](https://sentry.io)
- [PostHog Dashboard](https://app.posthog.com)

## Emergency Contacts

- **On-Call Engineer:** [Phone number]
- **Engineering Manager:** [Phone number]
- **CTO:** [Phone number]
- **Security Team:** security@company.com

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
