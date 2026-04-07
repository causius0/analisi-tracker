# Monitoring Guide

## Overview

This guide explains how to monitor the analisi-tracker application to ensure high availability, performance, and user satisfaction.

## Monitoring Stack

### Tools Used

1. **Sentry** - Error tracking and performance monitoring
   - Frontend and backend error tracking
   - Performance monitoring (traces, profiles)
   - Release tracking
   - Alert rules

2. **PostHog** - Privacy-first analytics
   - User behavior tracking
   - Feature usage analytics
   - Funnel analysis
   - Retention analysis

3. **Custom Monitoring** - Application-specific metrics
   - API response times
   - Database query performance
   - Cache hit rates
   - System resources (memory, CPU, event loop)

4. **Web Vitals** - Core Web Vitals monitoring
   - CLS (Cumulative Layout Shift)
   - FID (First Input Delay)
   - LCP (Largest Contentful Paint)
   - FCP (First Contentful Paint)
   - TTI (Time to Interactive)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sentry     │  │   PostHog    │  │  Web Vitals  │      │
│  │  Client SDK  │  │  Client SDK  │  │    Report    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sentry     │  │   PostHog    │  │ Performance  │      │
│  │  Server SDK  │  │  Server SDK  │  │   Monitor    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express API                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Sentry     │  │ Structured   │  │ Performance  │      │
│  │   SDK        │  │   Logger     │  │   Monitor    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Sentry Cloud                              │
│  - Error aggregation                                         │
│  - Performance traces                                        │
│  - Alert rules                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PostHog Cloud                             │
│  - Event aggregation                                         │
│  - User analytics                                            │
│  - Funnel analysis                                           │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Backend Monitoring Setup

#### Install Dependencies
```bash
npm install @sentry/node @sentry/profiling-node pino pino-pretty pino-http compression
```

#### Configure Environment Variables
```bash
# .env
SENTRY_DSN=https://your-sentry-dsn-here
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=analisi-tracker@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ERROR_SAMPLE_RATE=1.0
LOG_LEVEL=info
```

#### Initialize Monitoring
Monitoring is automatically initialized in `/server/index.js`:

```javascript
import { initSentry, setupSentryMiddleware, getSentryErrorHandler } from './monitoring/sentry.js';
import { logAPIRequest, logError } from './monitoring/logger.js';
import { trackAPIRequest, startMemoryMonitoring, startEventLoopMonitoring } from './monitoring/performance.js';
import { healthCheckMiddleware } from './monitoring/health.js';

// Initialize monitoring
initSentry();
startMemoryMonitoring();
startEventLoopMonitoring();

// Setup middleware
setupSentryMiddleware(app);
app.use(trackAPIRequest);
app.use(logAPIRequest);
```

### 2. Frontend Monitoring Setup

#### Install Dependencies
```bash
cd client
npm install @sentry/nextjs posthog-js
```

#### Configure Environment Variables
```bash
# client/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_RELEASE=analisi-tracker@1.0.0
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key-here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

#### Initialize Monitoring
Monitoring is automatically initialized in `/client/src/app/providers.tsx`:

```typescript
import { initPostHog, PHProvider } from '@/lib/analytics';

useEffect(() => {
  initPostHog();
}, []);
```

Sentry is initialized via Next.js config files:
- `/client/sentry.client.config.ts`
- `/client/sentry.server.config.ts`
- `/client/sentry.edge.config.ts`

### 3. PostHog Setup

#### Create PostHog Account
1. Go to [posthog.com](https://posthog.com)
2. Create a new project
3. Get your API key
4. Add to environment variables

#### Configure Privacy Settings
PostHog is configured with privacy-first settings in `/client/src/lib/analytics.ts`:
- Cookie-less tracking
- User consent required
- No session recording
- No autocapture
- Sensitive data filtered

## Monitoring Endpoints

### Health Check Endpoints

**Quick Health Check:**
```
GET /health?quick=true
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Full Health Check:**
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": [
    {
      "name": "memory",
      "status": "healthy",
      "duration": "2ms",
      "heapUsed": "128.50 MB",
      "heapTotal": "256.00 MB",
      "usage": "50.20%"
    },
    {
      "name": "event_loop",
      "status": "healthy",
      "duration": "1ms",
      "delay": "5ms"
    },
    {
      "name": "database",
      "status": "healthy",
      "duration": "10ms"
    }
  ]
}
```

**Readiness Check:**
```
GET /health/ready
```

**Liveness Check:**
```
GET /health/live
```

### Monitoring Endpoints

**Get All Metrics:**
```
GET /api/monitoring/metrics
```
Response:
```json
{
  "api": [
    {
      "path": "/api/analytics/trends/:id",
      "requests": 1250,
      "avgDuration": "145ms",
      "totalDuration": 181250,
      "errors": 12,
      "errorRate": "0.96%",
      "statusCodes": {
        "200": 1238,
        "400": 8,
        "500": 4
      }
    }
  ],
  "database": [
    {
      "operation": "find",
      "queries": 5420,
      "avgDuration": "15ms",
      "totalDuration": 81300
    }
  ],
  "cache": [
    {
      "operation": "get",
      "operations": 12500,
      "hits": 11250,
      "misses": 1250,
      "hitRate": "90.00%",
      "avgDuration": "2ms"
    }
  ],
  "system": {
    "memory": {
      "rss": "256 MB",
      "heapTotal": "256 MB",
      "heapUsed": "128 MB",
      "external": "12 MB"
    },
    "cpu": {
      "user": "1234567 μs",
      "system": "987654 μs"
    },
    "uptime": "3600 s",
    "pid": 12345
  }
}
```

**Reset Metrics:**
```
POST /api/monitoring/metrics/reset
```

## Key Metrics to Monitor

### Application Performance Metrics

#### API Response Times
- **p50 (median):** < 200ms
- **p95:** < 500ms
- **p99:** < 1000ms

#### Error Rate
- **Target:** < 1%
- **Warning:** > 1%
- **Critical:** > 5%

#### Database Query Performance
- **Average query time:** < 50ms
- **Slow queries:** > 500ms (investigate)

#### Cache Performance
- **Hit rate:** > 80%
- **Warning:** < 70%
- **Critical:** < 50%

### Frontend Performance Metrics

#### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **FCP (First Contentful Paint):** < 1.8s
- **TTI (Time to Interactive):** < 3.8s

#### Bundle Size
- **Initial JS:** < 200KB (gzipped)
- **CSS:** < 50KB (gzipped)
- **Total page weight:** < 500KB

### Business Metrics

#### User Engagement
- **DAU (Daily Active Users):** Track daily
- **MAU (Monthly Active Users):** Track monthly
- **Session duration:** Average > 5 minutes
- **Pages per session:** Average > 3

#### Feature Usage
- **Trend analysis:** Track usage frequency
- **PDF upload:** Track upload rate
- **AI features:** Track feature adoption

### System Health Metrics

#### Server Resources
- **CPU usage:** < 70%
- **Memory usage:** < 80%
- **Disk usage:** < 90%

#### Uptime
- **Target:** > 99.9% (43 minutes downtime/month)
- **Current:** Track continuously

## Monitoring Dashboards

### Sentry Dashboard

**Error Overview:**
- Total errors (last 24h, 7d, 30d)
- Error rate graph
- Top errors by frequency
- Errors by environment

**Performance Overview:**
- p50, p95, p99 response times
- Slowest transactions
- Database query performance
- Endpoint performance

**Release Tracking:**
- Errors by release
- Performance by release
- Adoption rate

### PostHog Dashboard

**User Analytics:**
- Daily active users
- User growth over time
- Geographic distribution
- Device/browser breakdown

**Feature Analytics:**
- Most used features
- Feature adoption rate
- User flows and funnels
- Retention analysis

### Custom Dashboard (Grafana)

Create a Grafana dashboard to display:

**Panel 1: API Performance**
- Graph: Average response time over time
- Graph: Request rate over time
- Stat: Current p50, p95, p99
- Stat: Error rate

**Panel 2: Database Performance**
- Graph: Query execution time
- Stat: Average query time
- Stat: Total queries per minute
- Table: Slowest queries

**Panel 3: Cache Performance**
- Graph: Hit rate over time
- Stat: Current hit rate
- Stat: Total cache operations

**Panel 4: System Resources**
- Graph: CPU usage over time
- Graph: Memory usage over time
- Stat: Current CPU usage
- Stat: Current memory usage

## Alerting

See [ALERTING_GUIDE.md](./ALERTING_GUIDE.md) for detailed alerting configuration.

### Quick Reference

**Critical Alerts (Immediate):**
- Application down (error rate > 10%)
- Database connection lost
- Security vulnerability

**Warning Alerts (1 hour):**
- High error rate (> 5%)
- Slow API responses (p95 > 1s)
- Low cache hit rate (< 50%)

**Info Alerts (Daily):**
- Weekly performance report
- User growth metrics
- Feature usage summary

## Troubleshooting

### High Error Rate

1. Check Sentry for error patterns
2. Check recent deployments
3. Check database status
4. Check third-party API status
5. Review application logs

### Slow Performance

1. Check performance monitoring in Sentry
2. Review database query performance
3. Check cache hit rate
4. Review system resources
5. Check for blocking operations

### High Memory Usage

1. Check memory leaks
2. Review database connection pooling
3. Check for large object caching
4. Review image/media processing
5. Restart service if needed

### Database Issues

1. Check database connection status
2. Review slow query log
3. Check database locks
4. Review connection pool settings
5. Check disk space

## Best Practices

### 1. Monitor Proactively
- Set up alerts before issues occur
- Monitor trends, not just current values
- Review dashboards regularly

### 2. Respond Quickly
- Acknowledge alerts within 5 minutes
- Start investigation within 15 minutes
- Resolve critical issues within 1 hour

### 3. Document Incidents
- Create runbook entries for common issues
- Document root causes
- Share lessons learned

### 4. Continuous Improvement
- Review alert thresholds monthly
- Adjust monitoring based on feedback
- Add new metrics as needed

### 5. Privacy First
- Never log PII (Personally Identifiable Information)
- Anonymize user IDs
- Hash sensitive data
- Respect user consent

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [PostHog Documentation](https://posthog.com/docs)
- [Web Vitals](https://web.dev/vitals/)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Support

For monitoring-related issues:
- Check this guide first
- Review [ALERTING_GUIDE.md](./ALERTING_GUIDE.md)
- Contact on-call engineer
- Create ticket in engineering backlog
