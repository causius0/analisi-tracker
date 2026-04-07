# Metrics Definition

## Overview

This document defines all metrics tracked by the analisi-tracker application, explaining what we measure, why it matters, and what targets we aim for.

## Metric Categories

1. [Application Performance Metrics](#application-performance-metrics)
2. [Frontend Performance Metrics](#frontend-performance-metrics)
3. [Business Metrics](#business-metrics)
4. [System Health Metrics](#system-health-metrics)
5. [Security Metrics](#security-metrics)

---

## Application Performance Metrics

### API Response Time

**What:** Time taken to process API requests

**Metrics:**
- **p50 (Median):** 50th percentile response time
- **p95:** 95th percentile response time
- **p99:** 99th percentile response time

**Why:** Measures application responsiveness and user experience

**Targets:**
- p50 < 200ms
- p95 < 500ms
- p99 < 1000ms

**How Tracked:**
```javascript
// Automatic tracking via performance middleware
app.use(trackAPIRequest);
```

**Dashboard:** Performance → Response Times

---

### Error Rate

**What:** Percentage of requests that result in errors

**Calculation:**
```
Error Rate = (Number of 4xx/5xx responses / Total responses) × 100
```

**Why:** Indicates application stability and reliability

**Targets:**
- Normal: < 1%
- Warning: 1-5%
- Critical: > 5%

**How Tracked:**
```javascript
// Sentry error tracking
Sentry.captureException(error);

// Custom tracking
metrics.api.requests.get(path).errors / metrics.api.requests.get(path).count
```

**Dashboard:** Performance → Error Rate

---

### Request Rate

**What:** Number of requests per second/minute

**Why:** Measures application load and helps with capacity planning

**Targets:**
- Normal: Variable based on time of day
- Warning: > 3x baseline
- Critical: > 5x baseline

**How Tracked:**
```javascript
// Automatic tracking
setInterval(() => {
  const rate = requestsInLastMinute / 60;
  metrics.requestRate = rate;
}, 60000);
```

**Dashboard:** Performance → Request Rate

---

### Database Query Performance

**What:** Time taken to execute database queries

**Metrics:**
- Average query time
- Slow query count (> 500ms)
- Queries per second

**Why:** Database performance is often the bottleneck

**Targets:**
- Average query time: < 50ms
- Slow queries: 0
- QPS: < 1000

**How Tracked:**
```javascript
trackDatabaseQuery('find', query, duration);
```

**Dashboard:** Performance → Database

---

### Cache Performance

**What:** Effectiveness of caching strategy

**Metrics:**
- Hit rate: Percentage of requests served from cache
- Miss rate: Percentage of cache misses
- Average cache lookup time

**Why:** Caching improves performance and reduces database load

**Targets:**
- Hit rate: > 80%
- Warning: < 70%
- Critical: < 50%

**How Tracked:**
```javascript
trackCacheOperation('get', key, hit, duration);
```

**Dashboard:** Performance → Cache

---

## Frontend Performance Metrics

### Core Web Vitals

#### LCP (Largest Contentful Paint)

**What:** Time from navigation to largest content element rendered

**Why:** Measures loading performance - main content visible

**Targets:**
- Good: < 2.5s
- Needs Improvement: 2.5s - 4s
- Poor: > 4s

**How Tracked:**
```javascript
// Automatic via web-vitals library
useReportWebVitals((metric) => {
  if (metric.name === 'LCP') {
    // Send to analytics
  }
});
```

---

#### FID (First Input Delay)

**What:** Time from first user interaction to response

**Why:** Measures interactivity - how responsive the app feels

**Targets:**
- Good: < 100ms
- Needs Improvement: 100ms - 300ms
- Poor: > 300ms

**How Tracked:**
```javascript
// Automatic via web-vitals library
```

---

#### CLS (Cumulative Layout Shift)

**What:** Measure of visual stability - how much content shifts

**Why:** Prevents accidental clicks and improves UX

**Targets:**
- Good: < 0.1
- Needs Improvement: 0.1 - 0.25
- Poor: > 0.25

**How Tracked:**
```javascript
// Automatic via web-vitals library
```

---

### FCP (First Contentful Paint)

**What:** Time from navigation to first content rendered

**Why:** Measures perceived loading speed

**Targets:**
- Good: < 1.8s
- Needs Improvement: 1.8s - 3s
- Poor: > 3s

**How Tracked:**
```javascript
// Automatic via web-vitals library
```

---

### TTI (Time to Interactive)

**What:** Time from navigation to page is fully interactive

**Why:** Measures when user can reliably interact with page

**Targets:**
- Good: < 3.8s
- Needs Improvement: 3.8s - 7.3s
- Poor: > 7.3s

**How Tracked:**
```javascript
// Automatic via web-vitals library
```

---

### Bundle Size

**What:** Size of JavaScript and CSS bundles

**Metrics:**
- Initial JS bundle
- CSS bundle
- Total page weight

**Why:** Larger bundles take longer to download and parse

**Targets:**
- Initial JS: < 200KB (gzipped)
- CSS: < 50KB (gzipped)
- Total: < 500KB

**How Tracked:**
```bash
# Analyze bundle
npm run analyze

# Check in browser DevTools
# Network tab → Transfer size
```

**Dashboard:** Performance → Bundle Size

---

## Business Metrics

### User Engagement

#### DAU (Daily Active Users)

**What:** Number of unique users who use the app daily

**Calculation:**
```
DAU = Count of unique users who performed at least one action in last 24 hours
```

**Why:** Measures daily engagement and growth

**Target:** Increasing trend

**How Tracked:**
```javascript
// PostHog automatic tracking
posthog.capture('page_view');
```

**Dashboard:** Analytics → User Engagement

---

#### MAU (Monthly Active Users)

**What:** Number of unique users who use the app monthly

**Calculation:**
```
MAU = Count of unique users who performed at least one action in last 30 days
```

**Why:** Measures monthly engagement and stickiness

**Target:** Increasing trend

**How Tracked:**
```javascript
// PostHog automatic tracking
```

**Dashboard:** Analytics → User Engagement

---

#### Session Duration

**What:** Average time users spend in app per session

**Why:** Longer sessions indicate higher engagement

**Target:** Average > 5 minutes

**How Tracked:**
```javascript
// PostHog automatic tracking
// Session timeout: 30 minutes of inactivity
```

**Dashboard:** Analytics → User Engagement

---

#### Pages Per Session

**What:** Average number of pages viewed per session

**Why:** More pages indicate deeper engagement

**Target:** Average > 3 pages

**How Tracked:**
```javascript
// PostHog automatic tracking
posthog.capture('$pageview');
```

**Dashboard:** Analytics → User Engagement

---

### Feature Usage

#### Trend Analysis Usage

**What:** How often users view trend analysis

**Why:** Most important feature - should have high usage

**Target:** > 70% of sessions

**How Tracked:**
```javascript
trackFeatureUsage('trend_analysis', {
  labTestId,
  dateRange,
});
```

**Dashboard:** Analytics → Feature Usage

---

#### PDF Upload Rate

**What:** Number of PDFs uploaded per day

**Why:** Key user action - indicates value being created

**Target:** Increasing trend

**How Tracked:**
```javascript
trackFeatureUsage('pdf_upload', {
  fileSize,
  pageCount,
  success: true,
});
```

**Dashboard:** Analytics → Feature Usage

---

#### AI Feature Adoption

**What:** Percentage of users using AI features

**Why:** Measures success of AI investment

**Target:** > 50% of users

**How Tracked:**
```javascript
trackFeatureUsage('ai_chat', {
  queryLength,
  responseTime,
});
```

**Dashboard:** Analytics → Feature Usage

---

### Retention

#### Day 1 Retention

**What:** Percentage of users who return on day 2

**Why:** Measures initial user engagement

**Target:** > 40%

**How Tracked:**
```javascript
// PostHog retention analysis
// Cohort: Users who signed up on Day X
// Return: Users who came back on Day X+1
```

**Dashboard:** Analytics → Retention

---

#### Day 7 Retention

**What:** Percentage of users who return after 1 week

**Why:** Measures weekly engagement

**Target:** > 20%

**How Tracked:**
```javascript
// PostHog retention analysis
```

**Dashboard:** Analytics → Retention

---

#### Day 30 Retention

**What:** Percentage of users who return after 1 month

**Why:** Measures long-term engagement

**Target:** > 10%

**How Tracked:**
```javascript
// PostHog retention analysis
```

**Dashboard:** Analytics → Retention

---

## System Health Metrics

### Uptime

**What:** Percentage of time application is available

**Calculation:**
```
Uptime % = (Total time - Downtime) / Total time × 100
```

**Why:** Application availability is critical for user trust

**Targets:**
- Target: > 99.9% (43 minutes downtime/month)
- Industry standard: 99.99% (4 minutes downtime/month)

**How Tracked:**
```javascript
// Uptime monitoring service (Pingdom, UptimeRobot)
// Health check every minute
GET /health
```

**Dashboard:** System Health → Uptime

---

### CPU Usage

**What:** Percentage of CPU being used

**Why:** High CPU usage indicates performance issues

**Targets:**
- Normal: < 70%
- Warning: 70-90%
- Critical: > 90%

**How Tracked:**
```javascript
const cpuUsage = process.cpuUsage();
metrics.system.cpu.push(cpuUsage);
```

**Dashboard:** System Health → CPU

---

### Memory Usage

**What:** Percentage of memory being used

**Metrics:**
- RSS (Resident Set Size): Total memory
- Heap Used: Actual memory used by JS objects
- Heap Total: Total memory available for JS objects

**Why:** High memory usage can cause crashes

**Targets:**
- Normal: < 70%
- Warning: 70-90%
- Critical: > 90%

**How Tracked:**
```javascript
const memUsage = process.memoryUsage();
metrics.system.memory.push(memUsage);
```

**Dashboard:** System Health → Memory

---

### Event Loop Delay

**What:** Time before event loop can process next task

**Why:** High delay indicates blocking operations

**Targets:**
- Normal: < 10ms
- Warning: 10-100ms
- Critical: > 100ms

**How Tracked:**
```javascript
startEventLoopMonitoring();
```

**Dashboard:** System Health → Event Loop

---

### Disk Space

**What:** Percentage of disk space used

**Why:** Running out of disk space causes crashes

**Targets:**
- Normal: < 70%
- Warning: 70-90%
- Critical: > 90%

**How Tracked:**
```bash
# External monitoring
df -h /var/lib/postgresql
```

**Dashboard:** System Health → Disk

---

## Security Metrics

### Failed Authentication Attempts

**What:** Number of failed login attempts

**Why:** Indicates potential brute force attacks

**Targets:**
- Normal: < 10 per user per hour
- Warning: 10-50 per user per hour
- Critical: > 50 per user per hour

**How Tracked:**
```javascript
logSecurityEvent('auth_failure', {
  userId,
  ip,
  userAgent,
});
```

**Dashboard:** Security → Authentication

---

### SQL Injection Attempts

**What:** Number of SQL injection attempts blocked

**Why:** Indicates malicious activity

**Target:** 0 (should all be blocked)

**How Tracked:**
```javascript
logSecurityEvent('sql_injection_attempt', {
  ip,
  payload,
});
```

**Dashboard:** Security → Attacks

---

### XSS Attempts

**What:** Number of XSS attempts blocked

**Why:** Indicates malicious activity

**Target:** 0 (should all be blocked)

**How Tracked:**
```javascript
logSecurityEvent('xss_attempt', {
  ip,
  payload,
});
```

**Dashboard:** Security → Attacks

---

### Vulnerability Scan Results

**What:** Number of vulnerabilities found

**Why:** Measures security posture

**Targets:**
- Critical: 0
- High: 0
- Medium: < 5
- Low: < 20

**How Tracked:**
```bash
# OWASP ZAP, npm audit, Snyk
# Track in Sentry
```

**Dashboard:** Security → Vulnerabilities

---

## Metric Thresholds

### Alert Thresholds

| Metric | Warning | Critical | Check Interval |
|--------|---------|----------|----------------|
| Error Rate | > 1% | > 5% | 1 minute |
| API Response Time (p95) | > 500ms | > 1000ms | 1 minute |
| Database Query Time | > 100ms | > 500ms | 1 minute |
| Cache Hit Rate | < 70% | < 50% | 5 minutes |
| CPU Usage | > 70% | > 90% | 1 minute |
| Memory Usage | > 70% | > 90% | 1 minute |
| Event Loop Delay | > 10ms | > 100ms | 1 minute |
| Disk Usage | > 70% | > 90% | 5 minutes |
| Uptime | < 99% | < 95% | 1 minute |

---

## Data Retention

### Metric Retention Policy

| Metric Type | Retention Period | Reason |
|-------------|------------------|---------|
| Error logs | 90 days | Debugging and compliance |
| Performance traces | 30 days | Performance analysis |
| User analytics | 2 years | Business analysis |
| Security logs | 1 year | Security investigation |
| System metrics | 90 days | Trend analysis |

---

## Dashboard Access

### Sentry Dashboards
- [Error Dashboard](https://sentry.io/organizations/analisi-tracker/)
- [Performance Dashboard](https://sentry.io/organizations/analisi-tracker/performance/)

### PostHog Dashboards
- [User Analytics](https://app.posthog.com/project/analytics)
- [Feature Usage](https://app.posthog.com/project/features)
- [Retention](https://app.posthog.com/project/retention)

### Custom Dashboards
- [System Health](https://grafana.analisi-tracker.com/d/system-health)
- [Performance](https://grafana.analisi-tracker.com/d/performance)

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
