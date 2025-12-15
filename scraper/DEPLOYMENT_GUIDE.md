# Task 31: Deploy Cron Worker - Deployment Guide

## Overview

This guide covers the deployment of the Balcony Solar Scraper Worker to Cloudflare, including environment configuration, manual testing, Teable verification, and monitoring setup.

## Prerequisites

Before deploying, ensure you have:

1. **Cloudflare Account**: With Workers enabled
2. **Wrangler CLI**: Installed and authenticated
3. **Teable Database**: Set up with all required tables
4. **API Endpoint**: Cache invalidation endpoint deployed
5. **Environment Variables**: Configured in wrangler.toml

### Install Wrangler CLI

```bash
npm install -g wrangler
```

### Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser to authenticate and grant Wrangler access to your Cloudflare account.

## Pre-Deployment Checklist

### 1. Verify Teable Database Setup

Ensure your Teable base has all required tables:

- **States Table**: `tbl9JsNibYgkgi7iEVW`
  - Fields: code, name, abbreviation, isLegal, maxWattage, keyLaw, lastUpdated, dataSource
  
- **Details Table**: `tbl2QU2ySxGNHLhNstq`
  - Fields: stateCode (link), category, required, description, sourceUrl
  
- **Resources Table**: `tblGYUmWEMeTg4oBTY3`
  - Fields: stateCode (link), title, url, resourceType
  
- **UpdateLog Table**: `tblNAUNfKxO4Wi0SJ1A`
  - Fields: timestamp, stateCode, changeType, oldValue, newValue, source

### 2. Verify API Endpoint

Test that your cache invalidation endpoint is working:

```bash
curl -X POST https://api.solarcurrents.com/api/cache-invalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"pattern": "state-"}'
```

Expected response: `{ "success": true, "invalidated": N }`

### 3. Run All Tests Locally

```bash
cd scraper
npm test
```

Expected output: All tests passing (56/56)

### 4. Verify Environment Variables

Check that all required environment variables are set in `wrangler.toml`:

```bash
# Production environment
- TEABLE_API_URL
- TEABLE_BASE_ID
- TEABLE_API_TOKEN
- API_CACHE_INVALIDATE_URL
- ADMIN_EMAIL
- ENABLE_ERROR_NOTIFICATIONS
- MAX_EXECUTION_TIME_MS
- RETRY_ATTEMPTS
- RETRY_BACKOFF_MS

# Staging environment (same as above)
```

## Deployment Steps

### Step 1: Deploy to Staging

First, deploy to staging to test the cron trigger and monitoring:

```bash
cd scraper
npm run deploy:staging
```

Expected output:
```
✓ Uploaded balcony-solar-scraper (X.XX sec)
✓ Deployed to https://balcony-solar-scraper-staging.workers.dev
```

### Step 2: Verify Staging Deployment

Check that the worker is deployed:

```bash
wrangler deployments list --env staging
```

You should see the latest deployment listed.

### Step 3: Test Manual Trigger (Staging)

Manually trigger the scraper to test the logic:

```bash
curl -X POST https://balcony-solar-scraper-staging.workers.dev/scrape
```

Expected response:
```json
{
  "jobId": "scraper-2024-12-10T...",
  "timestamp": "2024-12-10T...",
  "executionTimeMs": 5234,
  "statesProcessed": 51,
  "statesCreated": 0,
  "statesUpdated": 2,
  "statesVerified": 49,
  "scrapeErrors": 0,
  "updateErrors": 0,
  "totalErrors": 0,
  "cacheInvalidated": true,
  "status": "success"
}
```

### Step 4: Verify Staging Teable Updates

Check that data was updated in Teable:

1. Open your Teable base
2. Go to the **UpdateLog** table
3. Verify recent entries with:
   - `timestamp`: Recent (within last minute)
   - `source`: "scraper_worker"
   - `changeType`: "created", "updated", or "verified"

### Step 5: Monitor Staging Logs

View the worker logs in Cloudflare dashboard:

```bash
wrangler tail --env staging
```

Look for:
- Job ID with timestamp
- "Starting scheduled scraper job"
- "Scraped X states"
- "Scraper job completed"
- No error messages

### Step 6: Deploy to Production

Once staging is verified, deploy to production:

```bash
npm run deploy
```

Expected output:
```
✓ Uploaded balcony-solar-scraper (X.XX sec)
✓ Deployed to https://balcony-solar-scraper.workers.dev
```

### Step 7: Verify Production Deployment

```bash
wrangler deployments list
```

### Step 8: Test Manual Trigger (Production)

```bash
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

Verify the response is successful.

### Step 9: Verify Production Teable Updates

Check the UpdateLog table in Teable for new entries from production.

### Step 10: Monitor Production Logs

```bash
wrangler tail
```

Verify logs show successful execution.

## Cron Trigger Verification

### Verify Cron Configuration

Check that the cron trigger is configured in Cloudflare:

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → balcony-solar-scraper
3. Go to "Triggers" tab
4. Verify cron trigger shows: `0 2 * * 1` (Monday 2 AM UTC)

### Test Cron Execution

The cron job will run automatically on Monday at 2 AM UTC. To verify it's working:

1. **Wait for scheduled execution**: Monday 2 AM UTC
2. **Check Cloudflare logs**: View execution logs in dashboard
3. **Verify Teable updates**: Check UpdateLog table for new entries
4. **Check API cache**: Verify cache was invalidated

### Manual Cron Test

To test the cron logic without waiting for Monday:

```bash
# Trigger the scraper manually
curl -X POST https://balcony-solar-scraper.workers.dev/scrape

# Check logs
wrangler tail
```

## Environment Variables Configuration

### Production Variables

Update these in `wrangler.toml` or via Cloudflare dashboard:

```toml
[env.production]

# Teable API
TEABLE_API_URL = "https://app.teable.ai/api"
TEABLE_BASE_ID = "your-base-id"
TEABLE_API_TOKEN = "your-api-token"

# API Cache Invalidation
API_CACHE_INVALIDATE_URL = "https://api.solarcurrents.com/api/cache-invalidate"
CACHE_INVALIDATE_TOKEN = "your-cache-token"

# Admin Notifications
ADMIN_EMAIL = "admin@solarcurrents.com"
ENABLE_ERROR_NOTIFICATIONS = "true"

# Monitoring
MAX_EXECUTION_TIME_MS = "30000"
RETRY_ATTEMPTS = "3"
RETRY_BACKOFF_MS = "5000"
```

### Update Variables via Cloudflare Dashboard

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → balcony-solar-scraper
3. Go to "Settings" tab
4. Scroll to "Environment Variables"
5. Add or update variables
6. Click "Save and Deploy"

## Monitoring and Alerting Setup

### 1. Enable Cloudflare Workers Logging

Logs are automatically captured. View them:

```bash
wrangler tail
```

### 2. Set Up Email Notifications

Configure SendGrid for error notifications:

```javascript
// In src/index.js, update sendErrorNotification()
async function sendErrorNotification(env, error, context = {}) {
  if (!env.SENDGRID_API_KEY) return;

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
      from: { email: 'alerts@solarcurrents.com' },
      subject: `[ERROR] Balcony Solar Scraper Job Failed`,
      content: [{
        type: 'text/plain',
        value: `Error: ${error.message}\n\nContext: ${JSON.stringify(context, null, 2)}`,
      }],
    }),
  });

  return response.ok;
}
```

### 3. Set Up Slack Notifications

Configure Slack webhook for alerts:

```bash
# Add to wrangler.toml
SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 4. Set Up Sentry Integration

Configure Sentry for error tracking:

```bash
# Add to wrangler.toml
SENTRY_DSN = "https://your-sentry-dsn@sentry.io/project-id"
```

### 5. Create Monitoring Dashboard

Track these metrics:

- **Execution Frequency**: Should run weekly (Monday 2 AM UTC)
- **Success Rate**: Should be > 95%
- **Execution Time**: Should be < 30 seconds
- **Error Count**: Should be 0 for most runs
- **Cache Invalidation**: Should succeed 100% of the time
- **Data Freshness**: lastUpdated should be recent (< 7 days)

## Testing Cron Execution

### Test 1: Manual Trigger

```bash
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

Verify:
- Response status: 200
- Response includes jobId, timestamp, executionTimeMs
- Status is "success" or "partial_failure"

### Test 2: Verify Teable Updates

```bash
# Check UpdateLog table
# Should have entries with:
# - timestamp: recent
# - source: "scraper_worker"
# - changeType: "created", "updated", or "verified"
```

### Test 3: Verify Cache Invalidation

```bash
# Check that API cache was invalidated
# Make API request and verify it returns fresh data
curl https://api.solarcurrents.com/api/states/ca
```

### Test 4: Check Error Handling

Simulate an error by:
1. Temporarily disabling Teable API access
2. Trigger the scraper manually
3. Verify error is logged and notification sent

## Troubleshooting

### Worker Not Running on Schedule

**Problem**: Cron job doesn't execute at scheduled time

**Solutions**:
1. Verify cron expression in wrangler.toml: `0 2 * * 1`
2. Check Cloudflare dashboard for cron trigger configuration
3. Verify worker is deployed: `wrangler deployments list`
4. Check worker logs: `wrangler tail`

### Teable API Errors

**Problem**: Updates fail with Teable API errors

**Solutions**:
1. Verify API token is correct and not expired
2. Check table IDs match your Teable base
3. Verify API rate limits are not exceeded
4. Check network connectivity

### Cache Invalidation Failures

**Problem**: Cache invalidation endpoint returns error

**Solutions**:
1. Verify API_CACHE_INVALIDATE_URL is correct
2. Check API authentication token
3. Verify cache invalidation endpoint is running
4. Check network connectivity

### High Execution Time

**Problem**: Scraper takes > 30 seconds

**Solutions**:
1. Check Teable API response times
2. Verify network connectivity
3. Check for rate limiting
4. Monitor CPU usage in Cloudflare dashboard

## Post-Deployment Verification

### Checklist

- [ ] Worker deployed to production
- [ ] Cron trigger configured (Monday 2 AM UTC)
- [ ] Manual trigger test successful
- [ ] Teable updates verified
- [ ] Cache invalidation working
- [ ] Monitoring alerts configured
- [ ] Email notifications working
- [ ] Slack notifications working
- [ ] Logs accessible via wrangler tail
- [ ] First scheduled execution monitored

### First Scheduled Execution

Monitor the first scheduled execution on Monday 2 AM UTC:

1. Check Cloudflare dashboard for execution logs
2. Verify Teable UpdateLog table for new entries
3. Check for any error notifications
4. Verify API cache was invalidated
5. Confirm data freshness in API responses

## Rollback Procedure

If issues occur after deployment:

### Rollback to Previous Version

```bash
# View deployment history
wrangler deployments list

# Rollback to previous deployment
wrangler rollback --env production
```

### Verify Rollback

```bash
# Check current deployment
wrangler deployments list

# Test manual trigger
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

## Maintenance

### Regular Monitoring

- Check logs daily: `wrangler tail`
- Review UpdateLog table weekly
- Monitor error rates and alerts
- Check execution times

### Update Procedures

To update the scraper:

1. Make code changes
2. Run tests: `npm test`
3. Deploy to staging: `npm run deploy:staging`
4. Test staging deployment
5. Deploy to production: `npm run deploy`
6. Monitor production execution

### Scaling Considerations

- Current execution time: ~5-10 minutes for all states
- Cloudflare timeout limit: 30 seconds
- If execution time exceeds 30 seconds:
  - Implement batching
  - Split into multiple workers
  - Optimize scraping logic

## Support and Documentation

- **Cron Setup**: See `CRON_SETUP.md`
- **Monitoring**: See `CRON_MONITORING_INTEGRATION.md`
- **Error Handling**: See `MONITORING_SETUP.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

## Success Criteria

✅ Deployment is successful when:

1. Worker deployed to Cloudflare
2. Cron trigger configured (Monday 2 AM UTC)
3. Manual trigger test passes
4. Teable updates verified
5. Cache invalidation working
6. Monitoring and alerting configured
7. First scheduled execution successful
8. No errors in logs
9. Data freshness verified
10. All requirements met (5.1, 5.2, 7.3)

