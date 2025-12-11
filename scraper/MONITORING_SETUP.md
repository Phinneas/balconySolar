# Monitoring and Alerting Setup Guide

## Overview

This guide describes how to set up monitoring and alerting for the Balcony Solar Scraper Worker cron jobs.

## Cloudflare Workers Monitoring

### Built-in Monitoring

Cloudflare Workers provides built-in monitoring through the dashboard:

1. **Execution Logs**: View real-time logs of cron job executions
2. **Error Tracking**: Automatic error detection and reporting
3. **Performance Metrics**: CPU time, request count, and duration
4. **Analytics**: Request patterns and error rates

### Accessing Logs

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → balcony-solar-scraper
3. Click "Logs" tab
4. Filter by date/time to find cron executions

### Log Format

Each cron execution produces logs with the job ID:

```
[scraper-2024-01-08T02:00:00Z] Starting scheduled scraper job
[scraper-2024-01-08T02:00:00Z] Scraping all states...
[scraper-2024-01-08T02:00:00Z] Scraped 51 states, 0 scrape errors
[scraper-2024-01-08T02:00:00Z] Invalidating API cache...
[scraper-2024-01-08T02:00:00Z] Scraper job completed: {
  "jobId": "scraper-2024-01-08T02:00:00Z",
  "timestamp": "2024-01-08T02:00:00.123Z",
  "executionTimeMs": 5234,
  "statesProcessed": 51,
  "statesCreated": 0,
  "statesUpdated": 2,
  "statesVerified": 49,
  "scrapeErrors": 0,
  "updateErrors": 1,
  "totalErrors": 1,
  "cacheInvalidated": true,
  "status": "partial_failure"
}
```

## Error Notification System

### Email Notifications

The scraper sends email notifications when errors occur:

```javascript
async function sendErrorNotification(env, error, context = {}) {
  const errorMessage = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context,
  };

  if (env.ADMIN_EMAIL && env.ENABLE_ERROR_NOTIFICATIONS === 'true') {
    // Send email via SendGrid or similar service
  }
}
```

### Configuration

Set these environment variables in `wrangler.toml`:

```toml
[[env.production.vars]]
name = "ADMIN_EMAIL"
text = "admin@solarcurrents.com"

[[env.production.vars]]
name = "ENABLE_ERROR_NOTIFICATIONS"
text = "true"
```

### Email Integration

To enable email notifications, integrate with SendGrid:

1. **Get SendGrid API Key**: https://app.sendgrid.com/settings/api_keys
2. **Add to wrangler.toml**:

```toml
[[env.production.vars]]
name = "SENDGRID_API_KEY"
text = "SG.xxxxxxxxxxxxx"
```

3. **Update sendErrorNotification function**:

```javascript
async function sendErrorNotification(env, error, context = {}) {
  if (!env.ADMIN_EMAIL || env.ENABLE_ERROR_NOTIFICATIONS !== 'true') {
    return false;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: env.ADMIN_EMAIL }],
        }],
        from: { email: 'noreply@solarcurrents.com' },
        subject: `[ALERT] Scraper Job Error - ${context.jobId}`,
        content: [{
          type: 'text/plain',
          value: `
Error: ${error.message}
Job ID: ${context.jobId}
Timestamp: ${new Date().toISOString()}
Stage: ${context.stage}

Stack Trace:
${error.stack}

Context:
${JSON.stringify(context, null, 2)}
          `,
        }],
      }),
    });

    return response.ok;
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
    return false;
  }
}
```

## Slack Integration

### Setup Slack Webhook

1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create webhook URL
4. Add to wrangler.toml:

```toml
[[env.production.vars]]
name = "SLACK_WEBHOOK_URL"
text = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
```

### Send Slack Notifications

```javascript
async function sendSlackNotification(env, message, level = 'info') {
  if (!env.SLACK_WEBHOOK_URL) return false;

  const colors = {
    info: '#36a64f',
    warning: '#ff9900',
    error: '#ff0000',
  };

  try {
    const response = await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: colors[level],
          title: `Scraper Job ${level.toUpperCase()}`,
          text: message,
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}
```

## Sentry Integration

### Setup Sentry

1. Create Sentry account: https://sentry.io
2. Create project for Cloudflare Workers
3. Get DSN (Data Source Name)
4. Add to wrangler.toml:

```toml
[[env.production.vars]]
name = "SENTRY_DSN"
text = "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
```

### Send Errors to Sentry

```javascript
async function captureException(env, error, context = {}) {
  if (!env.SENTRY_DSN) return;

  try {
    const dsn = new URL(env.SENTRY_DSN);
    const projectId = dsn.pathname.split('/').pop();
    const key = dsn.username;

    await fetch(`https://sentry.io/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'X-Sentry-Auth': `Sentry sentry_key=${key}, sentry_version=7`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        level: 'error',
        exception: {
          values: [{
            type: error.name,
            value: error.message,
            stacktrace: {
              frames: parseStackTrace(error.stack),
            },
          }],
        },
        contexts: {
          scraper: context,
        },
        timestamp: Math.floor(Date.now() / 1000),
      }),
    });
  } catch (sentryError) {
    console.error('Failed to send to Sentry:', sentryError);
  }
}
```

## DataDog Integration

### Setup DataDog

1. Create DataDog account: https://www.datadoghq.com
2. Get API key from Settings
3. Add to wrangler.toml:

```toml
[[env.production.vars]]
name = "DATADOG_API_KEY"
text = "xxxxxxxxxxxxxxxxxxxxx"

[[env.production.vars]]
name = "DATADOG_SITE"
text = "datadoghq.com"
```

### Send Metrics to DataDog

```javascript
async function sendDataDogMetric(env, metricName, value, tags = {}) {
  if (!env.DATADOG_API_KEY) return;

  try {
    const tagString = Object.entries(tags)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');

    await fetch(`https://api.${env.DATADOG_SITE}/api/v1/series`, {
      method: 'POST',
      headers: {
        'DD-API-KEY': env.DATADOG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        series: [{
          metric: `scraper.${metricName}`,
          points: [[Math.floor(Date.now() / 1000), value]],
          type: 'gauge',
          tags: tagString.split(','),
        }],
      }),
    });
  } catch (error) {
    console.error('Failed to send DataDog metric:', error);
  }
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Execution Time**: Average, min, max per week
2. **Error Rate**: Percentage of jobs with errors
3. **State Coverage**: Number of states processed
4. **Update Success Rate**: Percentage of successful updates
5. **Cache Invalidation**: Success/failure rate

### Dashboard Setup

Create a dashboard in your monitoring tool:

```
Scraper Job Metrics
├── Execution Time (ms)
│   ├── Average: 5000ms
│   ├── Max: 30000ms
│   └── Trend: ↓ (improving)
├── Error Rate
│   ├── Total Errors: 1
│   ├── Error Rate: 1.96%
│   └── Trend: ↓ (improving)
├── State Coverage
│   ├── States Processed: 51
│   ├── States Updated: 2
│   └── Coverage: 100%
└── Cache Invalidation
    ├── Success: 100%
    └── Avg Time: 500ms
```

## Alerting Rules

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Execution time > 30s | Warning | Log warning |
| Update errors > 0 | Error | Send email + Slack |
| Scrape errors > 5 | Error | Send email + Slack |
| Cache invalidation failed | Critical | Send email + Slack + PagerDuty |
| No execution in 24 hours | Critical | Send email + Slack + PagerDuty |
| Error rate > 10% | Warning | Send email |

### PagerDuty Integration

For critical alerts, integrate with PagerDuty:

```javascript
async function sendPagerDutyAlert(env, error, context = {}) {
  if (!env.PAGERDUTY_INTEGRATION_KEY) return;

  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: env.PAGERDUTY_INTEGRATION_KEY,
        event_action: 'trigger',
        payload: {
          summary: `Scraper Job Critical Error: ${error.message}`,
          severity: 'critical',
          source: 'balcony-solar-scraper',
          custom_details: context,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send PagerDuty alert:', error);
  }
}
```

## Health Checks

### Uptime Monitoring

Use a service like Uptime Robot to monitor the health endpoint:

```
GET https://api.solarcurrents.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-08T02:00:00.123Z",
  "cache": {
    "hits": 1234,
    "misses": 56,
    "hitRate": 0.956
  }
}
```

### Cron Job Verification

Verify cron job ran successfully:

1. Check logs for job ID
2. Verify execution time < 30 seconds
3. Verify total errors = 0 or < threshold
4. Verify cache was invalidated
5. Verify API returns updated data

## Troubleshooting Alerts

### False Positives

If receiving false positive alerts:

1. Check alert thresholds are appropriate
2. Verify monitoring tool is correctly configured
3. Check for network issues causing timeouts
4. Review recent code changes

### Missing Alerts

If not receiving expected alerts:

1. Verify alert rules are enabled
2. Check notification channels are configured
3. Verify API keys/webhooks are valid
4. Check logs for notification errors

## Best Practices

1. **Set Appropriate Thresholds**: Based on historical data
2. **Test Alerts**: Manually trigger alerts to verify they work
3. **Document Runbooks**: Create runbooks for common alerts
4. **Review Regularly**: Review alert effectiveness monthly
5. **Escalation Policy**: Define escalation for critical alerts
6. **On-Call Rotation**: Set up on-call schedule for alerts

