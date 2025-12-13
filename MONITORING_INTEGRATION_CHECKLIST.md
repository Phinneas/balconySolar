# Monitoring Integration Checklist

## Overview

This checklist guides you through integrating the monitoring and alerting system into your existing API and scraper code.

## API Integration

### Step 1: Import Monitoring Service
- [ ] Add import to `api/src/index.js`:
```javascript
import MonitoringService from './monitoring.js';
```

### Step 2: Initialize Monitoring
- [ ] Create monitoring instance at module level:
```javascript
const monitoring = new MonitoringService({
  responseTimeThreshold: 500,
  errorRateThreshold: 5,
  cacheHitRateThreshold: 50,
});
```

### Step 3: Register Alert Handlers
- [ ] Add alert handlers for your notification service:
```javascript
// Email alerts
monitoring.onAlert((alert) => {
  if (alert.severity === 'critical' || alert.severity === 'error') {
    sendEmailAlert(alert);
  }
});

// Slack alerts
monitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendSlackAlert(alert);
  }
});
```

### Step 4: Record Requests in Handler
- [ ] Wrap API logic with monitoring:
```javascript
async function handleRequest(request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Your existing API logic
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
    
    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### Step 5: Add Health Endpoint
- [ ] Add monitoring metrics to health endpoint:
```javascript
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

### Step 6: Configure Environment Variables
- [ ] Add to `wrangler.toml`:
```toml
[env.production.vars]
MONITORING_RESPONSE_TIME_THRESHOLD = "500"
MONITORING_ERROR_RATE_THRESHOLD = "5"
MONITORING_CACHE_HIT_RATE_THRESHOLD = "50"
```

### Step 7: Test API Monitoring
- [ ] Run tests: `NODE_OPTIONS=--experimental-vm-modules npm test -- __tests__/monitoring.test.js`
- [ ] Verify all 27 tests pass
- [ ] Test alert handlers manually

## Scraper Integration

### Step 1: Import Cron Monitoring Service
- [ ] Add import to `scraper/src/index.js`:
```javascript
import CronMonitoringService from './cron-monitoring.js';
```

### Step 2: Initialize Cron Monitoring
- [ ] Create monitoring instance at module level:
```javascript
const cronMonitoring = new CronMonitoringService({
  executionTimeThreshold: 30000,
  errorCountThreshold: 5,
  errorRateThreshold: 10,
  maxTimeSinceLastRun: 24 * 60 * 60 * 1000,
});
```

### Step 3: Register Alert Handlers
- [ ] Add alert handlers:
```javascript
// Email alerts
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical' || alert.severity === 'error') {
    sendEmailAlert(alert);
  }
});

// Slack alerts
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'error' || alert.severity === 'critical') {
    sendSlackAlert(alert);
  }
});

// PagerDuty for critical
cronMonitoring.onAlert((alert) => {
  if (alert.severity === 'critical') {
    sendPagerDutyAlert(alert);
  }
});
```

### Step 4: Record Job Execution
- [ ] Wrap scheduled handler with monitoring:
```javascript
async function handleScheduled(event, env) {
  const startTime = Date.now();
  const jobId = `scraper-${new Date().toISOString()}`;

  try {
    // Your existing scraper logic
    const results = await scrapeAllStates();
    
    // Record successful execution
    cronMonitoring.recordJobExecution({
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
      statesProcessed: results.length,
      statesCreated: createdCount,
      statesUpdated: updatedCount,
      statesVerified: verifiedCount,
      scrapeErrors: scrapeErrors.length,
      updateErrors: updateErrors.length,
      totalErrors: scrapeErrors.length + updateErrors.length,
      cacheInvalidated: cacheInvalidated,
      status: updateErrors.length === 0 ? 'success' : 'partial_failure',
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
    
    throw error;
  }
}
```

### Step 5: Configure Environment Variables
- [ ] Add to `wrangler.toml`:
```toml
[env.production.vars]
CRON_EXECUTION_TIME_THRESHOLD = "30000"
CRON_ERROR_COUNT_THRESHOLD = "5"
CRON_ERROR_RATE_THRESHOLD = "10"
CRON_MAX_TIME_SINCE_LAST_RUN = "86400000"
```

### Step 6: Test Cron Monitoring
- [ ] Run tests: `NODE_OPTIONS=--experimental-vm-modules npm test -- __tests__/cron-monitoring.test.js`
- [ ] Verify all 21 tests pass
- [ ] Test alert handlers manually

## Alert Handler Implementation

### Email Alerts (SendGrid)
- [ ] Get SendGrid API key
- [ ] Add to environment variables
- [ ] Implement `sendEmailAlert()` function
- [ ] Test email delivery

### Slack Alerts
- [ ] Create Slack webhook
- [ ] Add webhook URL to environment variables
- [ ] Implement `sendSlackAlert()` function
- [ ] Test Slack message delivery

### PagerDuty Alerts
- [ ] Create PagerDuty integration
- [ ] Get integration key
- [ ] Add to environment variables
- [ ] Implement `sendPagerDutyAlert()` function
- [ ] Test incident creation

## Monitoring Dashboard

### Setup
- [ ] Create dashboard in your monitoring tool (DataDog, Grafana, etc.)
- [ ] Add API metrics:
  - [ ] Request count
  - [ ] Error rate
  - [ ] Average response time
  - [ ] Cache hit rate
  - [ ] Uptime percentage
- [ ] Add Cron metrics:
  - [ ] Success rate
  - [ ] Average execution time
  - [ ] Error count
  - [ ] Job overdue status

### Health Endpoint
- [ ] Monitor `/api/health` endpoint
- [ ] Set up uptime monitoring (Uptime Robot, etc.)
- [ ] Configure alerts for endpoint downtime

## Testing

### Unit Tests
- [ ] API monitoring: `NODE_OPTIONS=--experimental-vm-modules npm test -- api/__tests__/monitoring.test.js`
- [ ] Cron monitoring: `NODE_OPTIONS=--experimental-vm-modules npm test -- scraper/__tests__/cron-monitoring.test.js`

### Integration Tests
- [ ] Test API with monitoring enabled
- [ ] Test scraper with monitoring enabled
- [ ] Verify alerts trigger correctly
- [ ] Verify metrics are recorded

### Manual Testing
- [ ] Trigger slow response alert
- [ ] Trigger high error rate alert
- [ ] Trigger job failure alert
- [ ] Verify alert handlers work

## Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Alert handlers configured
- [ ] Environment variables set
- [ ] Dashboard created

### Deployment
- [ ] Deploy API with monitoring
- [ ] Deploy scraper with monitoring
- [ ] Verify health endpoint works
- [ ] Monitor for alerts

### Post-Deployment
- [ ] Check dashboard for metrics
- [ ] Verify alerts are working
- [ ] Review first 24 hours of data
- [ ] Adjust thresholds if needed

## Maintenance

### Daily
- [ ] Check dashboard for anomalies
- [ ] Review recent alerts
- [ ] Verify job execution

### Weekly
- [ ] Review metrics trends
- [ ] Check alert frequency
- [ ] Verify data freshness

### Monthly
- [ ] Review and adjust thresholds
- [ ] Archive old metrics
- [ ] Update runbooks
- [ ] Team review of monitoring

## Documentation

- [ ] API Monitoring Integration Guide: `api/MONITORING_INTEGRATION.md`
- [ ] Cron Monitoring Integration Guide: `scraper/CRON_MONITORING_INTEGRATION.md`
- [ ] Create runbooks for common alerts
- [ ] Document alert response procedures
- [ ] Document threshold rationale

## Troubleshooting

### Alerts Not Triggering
- [ ] Verify alert handler is registered
- [ ] Check threshold values
- [ ] Verify requests are being recorded
- [ ] Check alert handler for errors

### High False Positive Rate
- [ ] Increase threshold values
- [ ] Add time-based filtering
- [ ] Implement alert deduplication
- [ ] Review recent changes

### Memory Usage Issues
- [ ] Reduce history limits
- [ ] Implement periodic cleanup
- [ ] Archive metrics to external storage
- [ ] Use time-based retention

## Completion Checklist

- [ ] API monitoring integrated
- [ ] Cron monitoring integrated
- [ ] Alert handlers configured
- [ ] Environment variables set
- [ ] All tests passing
- [ ] Dashboard created
- [ ] Documentation complete
- [ ] Team trained
- [ ] Deployed to production
- [ ] Monitoring verified

## Support

For questions or issues:
1. Review integration guides
2. Check test examples
3. Review troubleshooting section
4. Check Cloudflare Workers logs
5. Contact team lead

---

**Status**: Ready for integration
**Last Updated**: 2024-12-10
**Version**: 1.0
