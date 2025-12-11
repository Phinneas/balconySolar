# Cron Trigger Setup and Monitoring

## Overview

The Balcony Solar Scraper Worker runs on a weekly schedule via Cloudflare Workers' cron trigger. This document describes the cron configuration, error handling, monitoring, and alerting setup.

## Cron Configuration

### Schedule

- **Expression**: `0 2 * * 1`
- **Meaning**: Every Monday at 2:00 AM UTC
- **Frequency**: Weekly
- **Timezone**: UTC

### Cron Expression Format

```
minute hour day month day-of-week
0      2    *   *     1
```

- `minute`: 0 (top of the hour)
- `hour`: 2 (2 AM)
- `day`: * (any day)
- `month`: * (any month)
- `day-of-week`: 1 (Monday, where 0=Sunday)

### Configuration Location

The cron trigger is configured in `scraper/wrangler.toml`:

```toml
[triggers]
crons = ["0 2 * * 1"]
```

## Environment Variables

### Production Configuration

```toml
[env.production]
vars = { ENVIRONMENT = "production" }

# Teable API
TEABLE_API_URL = "https://app.teable.ai/api"
TEABLE_BASE_ID = "bseTnc7nTi3FYus3yIk"
TEABLE_API_TOKEN = "teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk="

# API Cache Invalidation
API_CACHE_INVALIDATE_URL = "https://api.solarcurrents.com/api/cache-invalidate"

# Admin Notifications
ADMIN_EMAIL = "admin@solarcurrents.com"
ENABLE_ERROR_NOTIFICATIONS = "true"

# Monitoring
MAX_EXECUTION_TIME_MS = "30000"
RETRY_ATTEMPTS = "3"
RETRY_BACKOFF_MS = "5000"
```

### Staging Configuration

```toml
[env.staging]
vars = { ENVIRONMENT = "staging" }

# Similar to production but with staging endpoints
API_CACHE_INVALIDATE_URL = "https://api-staging.solarcurrents.com/api/cache-invalidate"
ADMIN_EMAIL = "staging@solarcurrents.com"
ENABLE_ERROR_NOTIFICATIONS = "false"
```

## Error Handling

### Error Types

The scraper handles the following error types:

1. **Timeout Errors**: API requests that exceed 10 seconds
2. **Network Errors**: Connection failures or HTTP errors
3. **Validation Errors**: Invalid state codes or data format issues
4. **Update Errors**: Failures when updating Teable records

### Error Handling Strategy

```javascript
// Scrape errors are caught and logged separately
const { results, errors: scrapeErrors } = await scraper.scrapeAllStates();

// Update errors are caught per-state
for (const stateData of results) {
  try {
    // Update logic
  } catch (error) {
    updateErrors.push({
      state: stateData.code,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Total errors = scrape errors + update errors
const totalErrors = scrapeErrors.length + updateErrors.length;
```

### Error Notification

When errors occur, the system:

1. Logs detailed error information with job ID and timestamp
2. Sends error notification to admin email (if enabled)
3. Includes error context (job ID, execution time, stage, error details)
4. Continues processing remaining states (partial failure)

## Monitoring and Alerting

### Job Execution Logging

Each cron job execution logs:

```javascript
{
  jobId: "scraper-2024-01-08T02:00:00Z",
  timestamp: "2024-01-08T02:00:00.123Z",
  executionTimeMs: 5234,
  statesProcessed: 51,
  statesCreated: 0,
  statesUpdated: 2,
  statesVerified: 49,
  scrapeErrors: 0,
  updateErrors: 1,
  totalErrors: 1,
  cacheInvalidated: true,
  status: "partial_failure"
}
```

### Monitoring Metrics

- **Execution Time**: Should be < 30 seconds (warning if > 30s)
- **Error Rate**: Tracked separately for scrape vs. update errors
- **Cache Invalidation**: Verified successful within 1 minute
- **State Coverage**: All 51 states should be processed

### Alerting Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Execution Time | > 30 seconds | Warning logged |
| Update Errors | > 0 | Error notification sent |
| Scrape Errors | > 5 | Warning logged |
| Cache Invalidation | Failed | Error notification sent |
| Total Errors | > 10 | Critical alert |

## Testing

### Unit Tests

Run unit tests for error handling:

```bash
npm test -- cron-error-handling.test.js
```

Tests cover:
- Timeout error handling
- Network error handling
- Validation error handling
- Job result structure
- Execution time tracking
- Error notification context

### Property-Based Tests

Run property-based tests for cron execution:

```bash
npm test -- cron-execution.test.js
```

Tests verify:
- Valid cron expression format
- Execution time within acceptable range
- Job result has all required fields
- Error counts are consistent
- State counts are consistent
- Status reflects error presence
- Timestamp ordering is consistent

### Manual Testing

To manually trigger the scraper job:

```bash
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

This endpoint is available for testing and will execute the same logic as the cron job.

## Deployment

### Deploy to Production

```bash
npm run deploy
```

### Deploy to Staging

```bash
npm run deploy:staging
```

### Verify Deployment

1. Check Cloudflare Workers dashboard for deployment status
2. Verify cron trigger is configured in wrangler.toml
3. Check environment variables are set correctly
4. Monitor logs for first scheduled execution

## Monitoring in Production

### Cloudflare Workers Analytics

- View execution logs in Cloudflare Workers dashboard
- Monitor CPU time and request count
- Check error rates and exceptions

### Custom Monitoring

Integrate with monitoring services:

1. **Sentry**: For error tracking and alerting
2. **DataDog**: For performance monitoring
3. **PagerDuty**: For critical alerts
4. **SendGrid**: For email notifications

### Log Aggregation

All logs include job ID for easy tracking:

```
[scraper-2024-01-08T02:00:00Z] Starting scheduled scraper job
[scraper-2024-01-08T02:00:00Z] Scraping all states...
[scraper-2024-01-08T02:00:00Z] Scraped 51 states, 0 scrape errors
[scraper-2024-01-08T02:00:00Z] Invalidating API cache...
[scraper-2024-01-08T02:00:00Z] Scraper job completed: {...}
```

## Troubleshooting

### Cron Job Not Running

1. Verify cron expression in wrangler.toml
2. Check Cloudflare Workers dashboard for errors
3. Verify environment variables are set
4. Check Teable API connectivity

### High Execution Time

1. Check Teable API response times
2. Verify network connectivity
3. Check for rate limiting
4. Monitor CPU usage

### Update Errors

1. Verify Teable API token is valid
2. Check table IDs are correct
3. Verify field names match schema
4. Check for permission issues

### Cache Invalidation Failures

1. Verify API_CACHE_INVALIDATE_URL is correct
2. Check API authentication
3. Verify cache invalidation endpoint is running
4. Check network connectivity

## Future Improvements

1. **Retry Logic**: Implement exponential backoff for failed updates
2. **Partial Updates**: Resume from last successful state on failure
3. **Data Validation**: Add schema validation before Teable updates
4. **Performance Optimization**: Batch updates to reduce API calls
5. **Advanced Monitoring**: Integrate with APM tools for detailed metrics
6. **Scheduled Notifications**: Send weekly summary reports to admin

