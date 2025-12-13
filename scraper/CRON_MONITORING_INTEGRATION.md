# Cron Job Monitoring and Alerting Integration Guide

## Overview

The Balcony Solar Scraper includes comprehensive cron job monitoring to track scheduled execution, detect failures, and ensure data freshness. This guide explains how to integrate cron monitoring into your scraper worker.

## Quick Start

### 1. Import and Initialize Cron Monitoring

```javascript
import CronMonitoringService from './src/cron-monitoring.js';

// Create monitoring instance with custom thresholds
const cronMonitoring = new CronMonitoringService({
  executionTimeThreshold: 30000,      // milliseconds
  errorCountThreshold: 5,             // number of errors
  errorRateThreshold: 10,             // percentage
  maxTimeSinceLastRun: 24 * 60 * 60 * 1000, // 24 hours
});
```

### 2. Record Job Execution

```javascript
async function handleScheduled(event, env) {
  const startTime = Date.now();
  const jobId = `scraper-${new Date().toISOString()}`;

  try {
    // Your scraper logic here
    const results = await scrapeAllStates();
    
    const executionTime = Date.now() - startTime;
    
    // Record successful execution
    cronMonitoring.recordJobExecution({
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      statesProcessed: results.length,
      statesCreated: 0,
      statesUpdated: 2,
      statesVerified: results.length - 2,
      scrapeErrors: 0,
      updateErrors: 0,
      totalErrors: 0,
      cacheInvalidated: true,
      status: 'success',
    });
  } catch (error) {
    // Record failed execution
    cronMonitoring.recordJobExecution({
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
      statesProcessed: 0,
      statesCreated: 0,
      statesUpdated: 0,
      statesVerified: 0,
      scrapeErrors: 0,
      updateErrors: 0,
      totalErrors: 1,
      cacheInvalidated: false,
      status: 'failure',
    });
  }
}
```

### 3. Set Up Alert Handlers

```javascript
// Email alerts
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical') {
    sendEmailAlert(alert);
  }
});

// Slack alerts
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendSlackAlert(alert);
  }
});

// PagerDuty for critical alerts
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical') {
    sendPagerDutyAlert(alert);
  }
});
```

## Job Statistics

### Available Metrics

- **Total Runs**: `cronMonitoring.getJobStats().totalRuns`
- **Success Rate**: `cronMonitoring.getJobStats().successRate`
- **Average Execution Time**: `cronMonitoring.getJobStats().averageExecutionTime`
- **Average Error Count**: `cronMonitoring.getJobStats().averageErrorCount`
- **Is Overdue**: `cronMonitoring.getJobStats().isOverdue`

### Data Access

- **Recent Jobs**: `cronMonitoring.getRecentJobs(limit)`
- **Job by ID**: `cronMonitoring.getJobById(jobId)`
- **Job Stats**: `cronMonitoring.getJobStats()`

## Alert Types

### Slow Execution
- **Trigger**: Execution time exceeds threshold (default: 30 seconds)
- **Severity**: Warning
- **Details**: jobId, executionTimeMs, threshold

### High Error Count
- **Trigger**: Total errors exceed threshold (default: 5)
- **Severity**: Error
- **Details**: jobId, errorCount, threshold

### High Error Rate
- **Trigger**: Error rate exceeds threshold (default: 10%)
- **Severity**: Error
- **Details**: jobId, errorRate, threshold

### Job Failure
- **Trigger**: Job status is 'failure'
- **Severity**: Critical
- **Details**: jobId, errors

### Cache Invalidation Failed
- **Trigger**: Cache invalidation failed during job
- **Severity**: Critical
- **Details**: jobId

### Job Overdue
- **Trigger**: No successful run in expected time window
- **Severity**: Critical
- **Details**: timeSinceLastRun, maxTimeSinceLastRun

## Integration with Scraper Worker

```javascript
import CronMonitoringService from './src/cron-monitoring.js';

const cronMonitoring = new CronMonitoringService();

// Register alert handlers
cronMonitoring.onAlert((alert) => {
  console.log(`[${alert.severity}] ${alert.type}`, alert.details);
  // Send to monitoring service
});

async function handleScheduled(event, env) {
  const startTime = Date.now();
  const jobId = `scraper-${new Date().toISOString()}`;

  console.log(`[${jobId}] Starting scheduled scraper job`);

  try {
    // Scrape all states
    const { results, errors: scrapeErrors } = await scrapeAllStates();

    // Update Teable
    let updatedCount = 0;
    let createdCount = 0;
    const updateErrors = [];

    for (const stateData of results) {
      try {
        const result = await updateStateInTeable(stateData);
        if (result.created) createdCount++;
        if (result.updated) updatedCount++;
      } catch (error) {
        updateErrors.push({
          state: stateData.code,
          error: error.message,
        });
      }
    }

    // Invalidate API cache
    const cacheInvalidated = await invalidateAPICache();

    // Record successful execution
    const executionTime = Date.now() - startTime;
    cronMonitoring.recordJobExecution({
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      statesProcessed: results.length,
      statesCreated: createdCount,
      statesUpdated: updatedCount,
      statesVerified: results.length - createdCount - updatedCount,
      scrapeErrors: scrapeErrors.length,
      updateErrors: updateErrors.length,
      totalErrors: scrapeErrors.length + updateErrors.length,
      cacheInvalidated,
      status: updateErrors.length === 0 ? 'success' : 'partial_failure',
    });

    console.log(`[${jobId}] Job completed successfully`);
  } catch (error) {
    console.error(`[${jobId}] Fatal error:`, error);

    // Record failed execution
    cronMonitoring.recordJobExecution({
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
      statesProcessed: 0,
      statesCreated: 0,
      statesUpdated: 0,
      statesVerified: 0,
      scrapeErrors: 0,
      updateErrors: 0,
      totalErrors: 1,
      cacheInvalidated: false,
      status: 'failure',
    });

    throw error;
  }
}

export default {
  async scheduled(event, env) {
    return handleScheduled(event, env);
  },
};
```

## Cloudflare Workers Configuration

### Environment Variables

```toml
# wrangler.toml
[env.production.vars]
CRON_EXECUTION_TIME_THRESHOLD = "30000"
CRON_ERROR_COUNT_THRESHOLD = "5"
CRON_ERROR_RATE_THRESHOLD = "10"
CRON_MAX_TIME_SINCE_LAST_RUN = "86400000"
```

### Cron Trigger

```toml
# wrangler.toml
[[triggers.crons]]
crons = ["0 2 * * 1"]  # Monday 2 AM UTC
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Execution Frequency**: How often jobs run
2. **Success Rate**: Percentage of successful runs
3. **Execution Time**: Average, min, max
4. **Error Trends**: Number and types of errors
5. **Data Freshness**: Time since last successful run
6. **Alert Frequency**: Number of alerts per type

### Dashboard Setup Example

```javascript
// Get job statistics for dashboard
const stats = cronMonitoring.getJobStats();

const dashboard = {
  timestamp: new Date().toISOString(),
  execution: {
    totalRuns: stats.totalRuns,
    successfulRuns: stats.successfulRuns,
    failedRuns: stats.failedRuns,
    partialFailures: stats.partialFailures,
    successRate: stats.successRate,
  },
  performance: {
    averageExecutionTime: stats.averageExecutionTime,
    averageErrorCount: stats.averageErrorCount,
  },
  health: {
    isOverdue: stats.isOverdue,
    lastRun: stats.lastRun,
  },
};
```

## Alert Handlers

### Email Alerts (SendGrid)

```javascript
async function sendCronEmailAlert(alert) {
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
      subject: `[${alert.severity.toUpperCase()}] Cron Job Alert: ${alert.type}`,
      content: [{
        type: 'text/plain',
        value: `
Alert Type: ${alert.type}
Severity: ${alert.severity}
Timestamp: ${alert.timestamp}

Details:
${JSON.stringify(alert.details, null, 2)}

Job Statistics:
${JSON.stringify(cronMonitoring.getJobStats(), null, 2)}
        `,
      }],
    }),
  });

  return response.ok;
}

cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical' || alert.severity === 'error') {
    sendCronEmailAlert(alert);
  }
});
```

### Slack Alerts

```javascript
async function sendCronSlackAlert(alert) {
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
        title: `Cron Alert: ${alert.type}`,
        text: JSON.stringify(alert.details, null, 2),
        footer: 'Balcony Solar Scraper',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  });

  return response.ok;
}

cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendCronSlackAlert(alert);
  }
});
```

### PagerDuty Integration

```javascript
async function sendPagerDutyAlert(alert) {
  const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: PAGERDUTY_INTEGRATION_KEY,
      event_action: 'trigger',
      payload: {
        summary: `Cron Job ${alert.type}: ${alert.details.jobId}`,
        severity: alert.severity === 'critical' ? 'critical' : 'error',
        source: 'balcony-solar-scraper',
        custom_details: alert.details,
      },
    }),
  });

  return response.ok;
}

cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical') {
    sendPagerDutyAlert(alert);
  }
});
```

## Testing Cron Monitoring

### Unit Tests

```javascript
import CronMonitoringService from './src/cron-monitoring.js';

describe('CronMonitoringService', () => {
  let monitoring;

  beforeEach(() => {
    monitoring = new CronMonitoringService();
  });

  test('records job execution and calculates stats', () => {
    monitoring.recordJobExecution({
      jobId: 'scraper-1',
      timestamp: new Date().toISOString(),
      executionTimeMs: 5000,
      statesProcessed: 51,
      statesCreated: 0,
      statesUpdated: 2,
      statesVerified: 49,
      scrapeErrors: 0,
      updateErrors: 0,
      totalErrors: 0,
      cacheInvalidated: true,
      status: 'success',
    });

    const stats = monitoring.getJobStats();
    expect(stats.totalRuns).toBe(1);
    expect(stats.successfulRuns).toBe(1);
  });

  test('triggers alerts on threshold breach', () => {
    let alertTriggered = false;
    monitoring.onAlert(() => {
      alertTriggered = true;
    });

    monitoring.recordJobExecution({
      jobId: 'scraper-slow',
      timestamp: new Date().toISOString(),
      executionTimeMs: 35000,
      statesProcessed: 51,
      statesCreated: 0,
      statesUpdated: 0,
      statesVerified: 51,
      scrapeErrors: 0,
      updateErrors: 0,
      totalErrors: 0,
      cacheInvalidated: true,
      status: 'success',
    });

    expect(alertTriggered).toBe(true);
  });
});
```

### Property-Based Tests

```javascript
import fc from 'fast-check';
import CronMonitoringService from './src/cron-monitoring.js';

test('success rate is between 0 and 100', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100 }),
      (successCount) => {
        const monitoring = new CronMonitoringService();
        
        for (let i = 0; i < 100; i++) {
          const isSuccess = i < successCount;
          monitoring.recordJobExecution({
            jobId: `scraper-${i}`,
            timestamp: new Date().toISOString(),
            executionTimeMs: 5000,
            statesProcessed: 51,
            statesCreated: 0,
            statesUpdated: 0,
            statesVerified: 51,
            scrapeErrors: 0,
            updateErrors: 0,
            totalErrors: isSuccess ? 0 : 1,
            cacheInvalidated: true,
            status: isSuccess ? 'success' : 'failure',
          });
        }
        
        const stats = monitoring.getJobStats();
        const rate = parseFloat(stats.successRate);
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Best Practices

1. **Set Realistic Thresholds**: Based on your SLA and historical data
2. **Monitor Regularly**: Check job statistics at least daily
3. **Test Alerts**: Manually trigger alerts to verify they work
4. **Document Runbooks**: Create runbooks for common failures
5. **Review Trends**: Look for patterns in job performance
6. **Adjust Thresholds**: Update thresholds based on actual performance
7. **Archive Old Data**: Periodically clean up old job records

## Troubleshooting

### Job Not Running

1. Check cron expression in wrangler.toml
2. Verify Worker is deployed
3. Check Cloudflare dashboard for execution logs
4. Verify environment variables are set

### Alerts Not Triggering

1. Check alert handler is registered
2. Verify threshold values are correct
3. Check that job execution is being recorded
4. Review alert handler for errors

### High False Positive Rate

1. Increase threshold values
2. Add context to alerts
3. Implement alert deduplication
4. Review recent changes to scraper

## Next Steps

1. Integrate cron monitoring into your scraper worker
2. Set up alert handlers for your preferred notification service
3. Create a monitoring dashboard
4. Test alerts and handlers
5. Document your monitoring setup
6. Train team on alert response procedures
