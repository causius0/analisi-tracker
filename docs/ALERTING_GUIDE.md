# Alerting Configuration Guide

## Overview

This guide explains how to configure and manage alerts for the analisi-tracker application to ensure proactive monitoring and quick incident response.

## Alert Types

### Critical Alerts (Immediate Notification)

**1. Application Down**
- **Condition:** Error rate > 10% OR API response time > 5s
- **Action:** Page on-call engineer immediately
- **Channels:** SMS, Phone call, Slack #critical
- **Escalation:** Engineering manager after 15 minutes

**2. Database Connection Lost**
- **Condition:** Cannot connect to database for > 30 seconds
- **Action:** Page database administrator immediately
- **Channels:** SMS, Slack #critical
- **Escalation:** CTO after 10 minutes

**3. Security Vulnerability Detected**
- **Condition:** OWASP Top 10 vulnerability detected
- **Action:** Page security team immediately
- **Channels:** SMS, Slack #security, Email
- **Escalation:** CISO immediately

**4. High Memory/CPU Usage**
- **Condition:** Memory > 90% OR CPU > 95% for > 5 minutes
- **Action:** Warning to engineering team
- **Channels:** Slack #alerts, Email
- **Escalation:** Engineering manager after 30 minutes

### Warning Alerts (Within 1 Hour)

**1. High Error Rate**
- **Condition:** Error rate > 5% for > 5 minutes
- **Action:** Investigate and fix within 1 hour
- **Channels:** Slack #alerts, Email
- **Escalation:** Engineering manager after 1 hour

**2. Slow API Responses**
- **Condition:** p95 response time > 1s for > 5 minutes
- **Action:** Investigate performance bottleneck
- **Channels:** Slack #alerts
- **Escalation:** Engineering lead after 2 hours

**3. Low Cache Hit Rate**
- **Condition:** Cache hit rate < 50% for > 15 minutes
- **Action:** Review caching strategy
- **Channels:** Slack #alerts
- **Escalation:** None (informational)

**4. Unusual Traffic Patterns**
- **Condition:** Traffic > 3x baseline OR < 10% of baseline
- **Action:** Investigate potential attack or outage
- **Channels:** Slack #alerts
- **Escalation:** Engineering manager after 30 minutes

**5. Failed Database Backups**
- **Condition:** Daily backup fails
- **Action:** Investigate and retry backup
- **Channels:** Slack #alerts, Email
- **Escalation:** Engineering manager after 4 hours

### Info Alerts (Daily Digest)

**1. Weekly Performance Report**
- **Condition:** Scheduled weekly report
- **Action:** Review performance trends
- **Channels:** Email to engineering team
- **Content:** Error rates, response times, uptime

**2. User Growth Metrics**
- **Condition:** Scheduled weekly report
- **Action:** Review growth and engagement
- **Channels:** Email to product team
- **Content:** DAU, MAU, feature usage

**3. Feature Usage Summary**
- **Condition:** Scheduled weekly report
- **Action:** Review feature adoption
- **Channels:** Email to product team
- **Content:** Most/least used features

**4. Cost Tracking**
- **Condition:** Scheduled monthly report
- **Action:** Review API and infrastructure costs
- **Channels:** Email to finance and engineering
- **Content:** AWS costs, API costs, third-party services

## Alert Channels

### Slack Integration

**Channels:**
- `#critical` - Application down, security issues
- `#alerts` - Warning alerts, performance issues
- `#security` - Security-related alerts
- `#engineering` - Info alerts, reports

**Configuration:**
```javascript
// Send Slack alert
async function sendSlackAlert(channel, message, severity) {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel,
      text: message,
      attachments: [{
        color: severity === 'critical' ? 'danger' : 'warning',
        text: message,
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });
}
```

### Email Alerts

**Recipients:**
- **Critical:** oncall@company.com, engineering-manager@company.com
- **Warning:** engineering-team@company.com
- **Info:** engineering-team@company.com, product-team@company.com

**Configuration:**
```javascript
// Send email alert
async function sendEmailAlert(to, subject, message, severity) {
  // Use SendGrid, AWS SES, or similar
  await emailService.send({
    to,
    subject: `[${severity.toUpperCase()}] ${subject}`,
    html: message,
    priority: severity === 'critical' ? 'high' : 'normal',
  });
}
```

### PagerDuty Integration

**Configuration:**
```javascript
// Create PagerDuty incident
async function createPagerDutyIncident(summary, details, severity) {
  const apiKey = process.env.PAGERDUTY_API_KEY;

  await fetch('https://api.pagerduty.com/incidents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token=${apiKey}`,
    },
    body: JSON.stringify({
      incident: {
        type: 'incident',
        title: summary,
        details,
        urgency: severity === 'critical' ? 'high' : 'low',
        service: {
          type: 'service_reference',
          id: process.env.PAGERDUTY_SERVICE_ID,
        },
      },
    }),
  });
}
```

## Alert Rules

### Sentry Alert Rules

**1. Error Rate Spike**
```
Name: Error Rate Spike
Condition: Error count > 5x baseline for 5 minutes
Filter: environment:production
Severity: Critical
Notification: Slack #critical, PagerDuty
```

**2. New Error Introduced**
```
Name: New Error
Condition: New issue detected
Filter: environment:production, level:error
Severity: Warning
Notification: Slack #alerts
```

**3. Performance Degradation**
```
Name: Slow Transactions
Condition: p95 > 1s for 10 minutes
Filter: transaction.duration > 1000
Severity: Warning
Notification: Slack #alerts
```

### PostHog Alert Rules

**1. Drop in User Engagement**
```
Name: Low Engagement
Condition: Daily active users < 80% of baseline
Notification: Email to product team
Frequency: Daily
```

**2. Feature Usage Drop**
```
Name: Feature Not Used
Condition: Feature usage drops > 50%
Notification: Slack #engineering
Frequency: Weekly
```

### Custom Monitoring Alerts

**1. Health Check Failure**
```javascript
// Check health endpoint every minute
setInterval(async () => {
  try {
    const response = await fetch('https://api.analisi-tracker.com/health');
    const data = await response.json();

    if (data.status !== 'ok') {
      await sendSlackAlert('#critical', 'Health check failed', 'critical');
      await createPagerDutyIncident('Health Check Failed', data.status, 'critical');
    }
  } catch (error) {
    await sendSlackAlert('#critical', 'Health check failed: ' + error.message, 'critical');
  }
}, 60000);
```

**2. Memory Usage Alert**
```javascript
// Monitor memory usage
setInterval(async () => {
  const metrics = await getSystemMetrics();
  const heapUsedMB = parseFloat(metrics.memory.heapUsed);

  if (heapUsedMB > 1000) {
    await sendSlackAlert('#alerts', `High memory usage: ${heapUsedMB}MB`, 'warning');
  }
}, 300000); // Every 5 minutes
```

## On-Call Rotation

### Schedule
- **Week 1:** Senior Backend Engineer
- **Week 2:** Senior Frontend Engineer
- **Week 3:** DevOps Engineer
- **Week 4:** Engineering Manager

### Responsibilities
- Monitor critical alerts 24/7
- Respond to critical alerts within 15 minutes
- Document incidents in runbook
- Escalate if needed

### Handoff Procedure
1. Review open incidents
2. Update runbook with any new issues
3. Notify team of any ongoing problems
4. Transfer on-call duties in PagerDuty

## Alert Suppression

### Maintenance Windows
```javascript
// Suppress alerts during maintenance
const isMaintenanceWindow = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Sunday 2-4 AM UTC
  return day === 0 && hour >= 2 && hour < 4;
};

// Check before sending alert
if (!isMaintenanceWindow()) {
  await sendAlert();
}
```

### Known Issues
```javascript
// Suppress alerts for known issues
const KNOWN_ISSUES = [
  'High memory usage in analytics service',
  'Slow response time for large datasets',
];

function shouldSuppressAlert(message) {
  return KNOWN_ISSUES.some(issue => message.includes(issue));
}
```

## Alert Testing

### Weekly Testing
- Test critical alerts every Monday 10 AM
- Verify all notification channels work
- Update runbook with any changes

### Monthly Testing
- Full incident response drill
- Test escalation procedures
- Review and update alert thresholds

## Alert Fatigue Prevention

### Best Practices
1. **Set appropriate thresholds** - Don't alert on minor fluctuations
2. **Use alert grouping** - Group similar alerts together
3. **Implement hysteresis** - Require condition to clear before re-alerting
4. **Review alerts regularly** - Remove or adjust unused alerts
5. **Use severity levels** - Not everything needs to be critical

### Alert Quality Metrics
- **False positive rate:** < 10%
- **Alert acknowledgment time:** < 5 minutes (critical)
- **Mean time to resolution (MTTR):** < 1 hour (critical)
- **Alert fatigue score:** Monitor engineer feedback

## Runbook Template

For each alert type, create a runbook entry:

```markdown
## Alert: High Error Rate

### Symptoms
- Error rate > 5% for > 5 minutes
- Multiple 5xx errors in logs

### Diagnosis
1. Check Sentry for error patterns
2. Check recent deployments
3. Check database status
4. Check third-party API status

### Resolution
1. If deployment issue: Rollback deployment
2. If database issue: Restart database connection
3. If third-party API: Enable fallback mode
4. If unknown: Escalate to engineering team

### Prevention
- Add unit tests for failing code
- Implement circuit breakers
- Add retry logic
- Improve error handling

### Related Docs
- [Deployment Guide](./DEPLOYMENT.md)
- [Database Runbook](./DATABASE_RUNBOOK.md)
```

## Next Steps

1. Set up notification channels (Slack, PagerDuty, email)
2. Configure alert rules in Sentry and PostHog
3. Create on-call rotation schedule
4. Write runbooks for common incidents
5. Test alert system weekly
6. Review and adjust thresholds monthly

## Resources

- [Sentry Alerting Documentation](https://docs.sentry.io/product/alerts/)
- [PagerDuty Documentation](https://www.pagerduty.com/docs/)
- [PostHog Alerting](https://posthog.com/docs/user-guides/alerts)
- [Incident Response Best Practices](https://www.pagerduty.com/resources/blog/incident-response-best-practices/)
