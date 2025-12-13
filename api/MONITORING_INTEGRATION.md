# API Monitoring and Alerting Integration Guide

## Overview

The Balcony Solar Checker API includes comprehensive monitoring and alerting capabilities to track performance, detect errors, and ensure data freshness. This guide explains how to integrate monitoring into your API and configure alerts.

## Quick Start

### 1. Import and Initialize Monitoring

```javascript
import MonitoringService from './src/monitoring.js';

// Create monitoring instance with custom thresholds
const monitoring = new MonitoringService({
  responseTimeThreshold: 500,      // milliseconds
  errorRateThreshold: 5,           // percentage
  cacheHitRateThreshold: 50,       // percentage
});
```

### 2. Record API Requests

```javascript
// Record successful request
const startTime = Date.now();
const response = await fetchData();
const responseTime = Date.now() - startTime;

monitoring.recordRequest(
  '/api/states',
  responseTime,
  response.status,
  fromCache
);
```

### 3. Record Errors

```javascript
try {
  // API call
} catch (error) {
  monitoring.recordError('/api/states', error, 'TIMEOUT');
}
```

### 4. Set Up Alert Handlers

```javascript
// Email alerts
monitoring.onAlert((alert) => {
  if (alert.severity === 'critical') {
    sendEmailAlert(alert);
  }
});

// Slack alerts
monitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendSlackAlert(alert);
  }
});

// Logging
monitoring.onAlert((alert) => {
  console.log(`[${alert.type}] ${JSON.stringify(alert.details)}`);
});
```

## Metrics Available

### Request Metrics

- **Average Response Time**: `monitoring.getAverageResponseTime()`
- **Error Rate**: `monitoring.getErrorRate()` (percentage)
- **Cache Hit Rate**: `monitoring.getCacheHitRate()` (percentage)
- **Uptime**: `monitoring.getUptime(windowMs)` (percentage)

### Data Access

- **Recent Requests**: `monitoring.getRecentRequests(limit)`
- **Recent Errors**: `monitoring.getRecentErrors(limit)`
- **Metrics Summary**: `monitoring.getMetrics()`

## Alert Types

### Slow Response
- **Trigger**: Response time exceeds threshold (default: 500ms)
- **Severity**: Warning
- **Details**: endpoint, responseTimeMs, threshold

### High Error Rate
- **Trigger**: Error rate exceeds threshold (default: 5%)
- **Severity**: Error
- **Details**: errorRate, threshold

### Low Cache Hit Rate
- **Trigger**: Cache hit rate falls below threshold (default: 50%)
- **Severity**: Warning
- **Details**: cacheHitRate, threshold

## Integration with API Handler

```javascript
import MonitoringService from './src/monitoring.js';

const monitoring = new MonitoringService();

// Register alert handlers
monitoring.onAlert((alert) => {
  console.log(`Alert: ${alert.type}`, alert.details);
  // Send to monitoring service (Sentry, DataDog, etc.)
});

async function handleRequest(request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Your API logic here
    const response = await processRequest(request);
    
    // Record successful request
    const responseTime = Date.now() - startTime;
    monitoring.recordRequest(
      path,
      responseTime,
      response.status,
      response.fromCache
    );

    return response;
  } catch (error) {
    // Record error
    monitoring.recordError(path, error, 'NETWORK');
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

## Cloudflare Workers Integration

### Environment Variables

```toml
# wrangler.toml
[env.production.vars]
MONITORING_RESPONSE_TIME_THRESHOLD = "500"
MONITORING_ERROR_RATE_THRESHOLD = "5"
MONITORING_CACHE_HIT_RATE_THRESHOLD = "50"
```

### Health Endpoint

```javascript
// GET /api/health
if (path === '/api/health' && request.method === 'GET') {
  const metrics = monitoring.getMetrics();
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    metrics,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Request Volume**: Total requests per hour/day
2. **Response Time**: Average, min, max, p95, p99
3. **Error Rate**: Percentage of failed requests
4. **Cache Hit Rate**: Percentage of cached responses
5. **Uptime**: Percentage of successful requests
6. **Alert Frequency**: Number of alerts per type

### Dashboard Setup Example

```javascript
// Get metrics for dashboard
const metrics = monitoring.getMetrics();

const dashboard = {
  timestamp: new Date().toISOString(),
  requests: {
    total: metrics.requestCount,
    errors: metrics.errorCount,
    errorRate: metrics.errorRate,
  },
  performance: {
    averageResponseTime: metrics.averageResponseTime,
    uptime: metrics.uptime,
  },
  cache: {
    hits: metrics.cacheHits,
    misses: metrics.cacheMisses,
    hitRate: metrics.cacheHitRate,
  },
  alerts: metrics.recentAlerts,
};
```

## Alert Handlers

### Email Alerts (SendGrid)

```javascript
async function sendEmailAlert(alert) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: 'admin@solarcurrents.com' }],
      }],
      from: { email: 'alerts@solarcurrents.com' },
      subject: `[${alert.type.toUpperCase()}] API Alert`,
      content: [{
        type: 'text/plain',
        value: `
Alert Type: ${alert.type}
Severity: ${alert.severity}
Timestamp: ${alert.timestamp}

Details:
${JSON.stringify(alert.details, null, 2)}
        `,
      }],
    }),
  });

  return response.ok;
}

monitoring.onAlert((alert) => {
  if (alert.severity === 'critical' || alert.severity === 'error') {
    sendEmailAlert(alert);
  }
});
```

### Slack Alerts

```javascript
async function sendSlackAlert(alert) {
  const colors = {
    warning: '#ff9900',
    error: '#ff0000',
    critical: '#8b0000',
  };

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color: colors[alert.severity] || '#0099ff',
        title: `API Alert: ${alert.type}`,
        text: JSON.stringify(alert.details, null, 2),
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });

  return response.ok;
}

monitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendSlackAlert(alert);
  }
});
```

### Sentry Integration

```javascript
async function captureAlert(alert) {
  const response = await fetch(`https://sentry.io/api/${SENTRY_PROJECT_ID}/store/`, {
    method: 'POST',
    headers: {
      'X-Sentry-Auth': `Sentry sentry_key=${SENTRY_KEY}, sentry_version=7`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: alert.type,
      level: alert.severity === 'critical' ? 'fatal' : alert.severity,
      contexts: {
        api: alert.details,
      },
      timestamp: Math.floor(Date.now() / 1000),
    }),
  });

  return response.ok;
}

monitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    captureAlert(alert);
  }
});
```

## Testing Monitoring

### Unit Tests

```javascript
import MonitoringService from './src/monitoring.js';

describe('MonitoringService', () => {
  let monitoring;

  beforeEach(() => {
    monitoring = new MonitoringService();
  });

  test('records requests and calculates metrics', () => {
    monitoring.recordRequest('/api/states', 100, 200, false);
    monitoring.recordRequest('/api/states', 200, 200, false);
    
    expect(monitoring.getAverageResponseTime()).toBe(150);
  });

  test('triggers alerts on threshold breach', () => {
    let alertTriggered = false;
    monitoring.onAlert(() => {
      alertTriggered = true;
    });

    monitoring.recordRequest('/api/states', 600, 200, false);
    expect(alertTriggered).toBe(true);
  });
});
```

### Property-Based Tests

```javascript
import fc from 'fast-check';
import MonitoringService from './src/monitoring.js';

test('response time is always positive', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 10000 }),
      (responseTime) => {
        const monitoring = new MonitoringService();
        monitoring.recordRequest('/api/states', responseTime, 200, false);
        
        expect(monitoring.getAverageResponseTime()).toBeGreaterThan(0);
      }
    ),
    { numRuns: 100 }
  );
});

test('error rate is between 0 and 100', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100 }),
      (errorCount) => {
        const monitoring = new MonitoringService();
        
        for (let i = 0; i < 100; i++) {
          const isError = i < errorCount;
          monitoring.recordRequest(
            '/api/states',
            100,
            isError ? 500 : 200,
            false
          );
        }
        
        const errorRate = monitoring.getErrorRate();
        expect(errorRate).toBeGreaterThanOrEqual(0);
        expect(errorRate).toBeLessThanOrEqual(100);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Best Practices

1. **Set Appropriate Thresholds**: Based on your SLA and historical data
2. **Monitor Regularly**: Check metrics dashboard at least daily
3. **Test Alerts**: Manually trigger alerts to verify they work
4. **Document Runbooks**: Create runbooks for common alerts
5. **Review Trends**: Look for patterns in alert frequency
6. **Adjust Thresholds**: Update thresholds based on actual performance
7. **Archive Old Data**: Periodically clean up old metrics to save memory

## Troubleshooting

### Alerts Not Triggering

1. Check alert handler is registered: `monitoring.onAlert(handler)`
2. Verify threshold values are correct
3. Check that requests are being recorded
4. Review alert handler for errors

### High False Positive Rate

1. Increase threshold values
2. Add time-based filtering (e.g., only alert during business hours)
3. Implement alert deduplication
4. Add context to alerts (e.g., recent changes)

### Memory Usage

1. Reduce history limits (default: 1000 requests, 100 errors)
2. Implement periodic cleanup
3. Archive metrics to external storage
4. Use time-based retention policies

## Next Steps

1. Integrate monitoring into your API handler
2. Set up alert handlers for your preferred notification service
3. Create a monitoring dashboard
4. Test alerts and handlers
5. Document your monitoring setup
6. Train team on alert response procedures
