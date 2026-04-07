# Monitoring Setup Guide

## Quick Start

This guide will help you set up comprehensive monitoring for the analisi-tracker application in 30 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Sentry account (free tier available)
- PostHog account (free tier available)

## Step 1: Install Dependencies (5 minutes)

### Backend Dependencies

```bash
cd /path/to/analisi-tracker
npm install @sentry/node @sentry/profiling-node pino pino-pretty pino-http compression
```

### Frontend Dependencies

```bash
cd /path/to/analisi-tracker/client
npm install @sentry/nextjs posthog-js
```

---

## Step 2: Configure Sentry (10 minutes)

### Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up / Log in
3. Create new project: "analisi-tracker-backend"
4. Create another project: "analisi-tracker-frontend"
5. Copy DSNs

### Backend Configuration

Add to `/path/to/analisi-tracker/.env`:

```bash
# Sentry Backend
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=analisi-tracker@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ERROR_SAMPLE_RATE=1.0
```

### Frontend Configuration

Add to `/path/to/analisi-tracker/client/.env.local`:

```bash
# Sentry Frontend
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_RELEASE=analisi-tracker@1.0.0
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE=1.0
```

---

## Step 3: Configure PostHog (5 minutes)

### Create PostHog Project

1. Go to [posthog.com](https://posthog.com)
2. Sign up / Log in
3. Create new project: "analisi-tracker"
4. Copy API key

### Frontend Configuration

Add to `/path/to/analisi-tracker/client/.env.local`:

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_DEFAULT_ANALYTICS_CONSENT=false
```

---

## Step 4: Configure Logging (2 minutes)

Add to `/path/to/analisi-tracker/.env`:

```bash
# Logging
LOG_LEVEL=info
```

---

## Step 5: Verify Setup (3 minutes)

### Start Backend Server

```bash
cd /path/to/analisi-tracker
npm start
```

**Expected Output:**
```
✅ Sentry error tracking initialized
✅ Sentry Express middleware configured
✅ Monitoring started
```

### Start Frontend Server

```bash
cd /path/to/analisi-tracker/client
npm run dev
```

**Expected Output:**
```
[PostHog] Analytics initialized
```

### Test Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": [...]
}
```

### Test Monitoring Endpoint

```bash
curl http://localhost:3000/api/monitoring/metrics
```

**Expected Response:**
```json
{
  "api": [...],
  "database": [...],
  "cache": [...],
  "system": {...}
}
```

---

## Step 6: Test Error Tracking (2 minutes)

### Trigger Backend Error

```bash
curl http://localhost:3000/nonexistent
```

**Expected Result:**
- Error logged to Sentry
- Error appears in Sentry dashboard

### Trigger Frontend Error

Open browser console and run:

```javascript
throw new Error('Test error');
```

**Expected Result:**
- Error logged to Sentry
- Error appears in Sentry dashboard

---

## Step 7: Test Analytics (2 minutes)

### Navigate Application

1. Open http://localhost:3001
2. Navigate to different pages
3. Use various features

**Expected Result:**
- Page views appear in PostHog dashboard
- Feature usage tracked in PostHog

---

## Step 8: Set Up Alerts (Optional - 5 minutes)

### Sentry Alerts

1. Go to Sentry → Settings → Alerts
2. Create alert rule: "Error Rate Spike"
   - Condition: Error count > 5x baseline for 5 minutes
   - Action: Send email notification

3. Create alert rule: "New Error"
   - Condition: New issue detected
   - Action: Send Slack notification

### PostHog Alerts

1. Go to PostHog → Alerts
2. Create alert: "Low Engagement"
   - Condition: DAU < 80% of baseline
   - Action: Send email notification

---

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Health check endpoint returns healthy status
- [ ] Monitoring endpoint returns metrics
- [ ] Errors appear in Sentry
- [ ] Page views appear in PostHog
- [ ] Web Vitals are being tracked
- [ ] Logs are being generated

---

## Troubleshooting

### Sentry Not Working

**Problem:** No errors appearing in Sentry

**Solutions:**
1. Check SENTRY_DSN is correct
2. Check network connectivity
3. Check browser console for errors
4. Verify environment variables are loaded
```bash
echo $SENTRY_DSN
```

### PostHog Not Working

**Problem:** No events appearing in PostHog

**Solutions:**
1. Check NEXT_PUBLIC_POSTHOG_KEY is correct
2. Check user consent is granted
```javascript
// Grant consent in browser console
localStorage.setItem('analytics_consent', 'granted');
location.reload();
```
3. Check browser console for errors
4. Verify PostHog host is correct

### Health Check Failing

**Problem:** Health check returns unhealthy status

**Solutions:**
1. Check memory usage
```bash
free -h
```
2. Check event loop delay
3. Check database connectivity
4. Review server logs

---

## Environment Variables Reference

### Production

```bash
# .env (Backend)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=analisi-tracker@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ERROR_SAMPLE_RATE=1.0
LOG_LEVEL=info

# client/.env.local (Frontend)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_RELEASE=analisi-tracker@1.0.0
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_POSTHOG_KEY=phc_your-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_DEFAULT_ANALYTICS_CONSENT=false
```

### Development

```bash
# .env (Backend)
SENTRY_DSN= # Optional - can leave empty in dev
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=analisi-tracker@dev
SENTRY_TRACES_SAMPLE_RATE=1.0 # Sample all traces in dev
SENTRY_PROFILES_SAMPLE_RATE=1.0
SENTRY_ERROR_SAMPLE_RATE=1.0
LOG_LEVEL=debug # More verbose logging

# client/.env.local (Frontend)
NEXT_PUBLIC_SENTRY_DSN= # Optional - can leave empty in dev
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_RELEASE=analisi-tracker@dev
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=1.0
NEXT_PUBLIC_POSTHOG_KEY=phc_dev_key # Use separate PostHog project
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_DEFAULT_ANALYTICS_CONSENT=true # Auto-grant in dev
```

---

## Next Steps

1. **Set up dashboards** - Create Grafana dashboards for custom metrics
2. **Configure alerts** - Set up alert rules in Sentry and PostHog
3. **Review runbooks** - Read [RUNBOOK.md](./RUNBOOK.md) for incident procedures
4. **Team training** - Train team on monitoring tools and procedures
5. **Weekly reviews** - Schedule weekly monitoring review meetings

---

## Advanced Configuration

### Custom Metrics

Track custom business metrics:

```javascript
import { trackFeatureUsage } from '@/lib/analytics';

// Track feature usage
trackFeatureUsage('data_export', {
  format: 'pdf',
  recordCount: 150,
  duration: 2500,
});
```

### Custom Alerts

Create custom alert logic:

```javascript
// server/monitoring/custom-alerts.js
setInterval(async () => {
  const metrics = await getAllMetrics();

  if (metrics.system.memory.heapUsed > 1000) {
    await sendSlackAlert('#alerts', 'High memory usage detected');
  }
}, 300000); // Every 5 minutes
```

### Custom Dashboards

Create Grafana dashboard:

1. Install Grafana
2. Add Prometheus data source
3. Import dashboard JSON
4. Configure panels

See [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) for details.

---

## Resources

- [Monitoring Guide](./MONITORING_GUIDE.md) - Comprehensive monitoring documentation
- [Alerting Guide](./ALERTING_GUIDE.md) - Alert configuration guide
- [Runbook](./RUNBOOK.md) - Incident response procedures
- [Metrics Definition](./METRICS_DEFINITION.md) - All metrics explained
- [Sentry Documentation](https://docs.sentry.io/)
- [PostHog Documentation](https://posthog.com/docs)

---

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)
3. Check [RUNBOOK.md](./RUNBOOK.md) for common incidents
4. Create GitHub issue
5. Contact on-call engineer

---

**Setup Time:** ~30 minutes
**Difficulty:** Beginner-friendly
**Last Updated:** 2024-01-15
**Version:** 1.0.0
