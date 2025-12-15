# Quick Deployment Reference - Cron Worker

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Verify tests pass
cd scraper && npm test

# 2. Deploy to staging
npm run deploy:staging

# 3. Test staging
curl -X POST https://balcony-solar-scraper-staging.workers.dev/scrape

# 4. Deploy to production
npm run deploy

# 5. Test production
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

## What Gets Deployed

- **Worker**: Cloudflare Worker that scrapes state regulations
- **Schedule**: Monday 2 AM UTC (cron: `0 2 * * 1`)
- **Function**: Scrapes → Parses → Updates Teable → Invalidates Cache
- **Size**: ~15 KB (production code only)

## Prerequisites

- [ ] Cloudflare account with Workers enabled
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Wrangler authenticated: `wrangler login`
- [ ] Teable database with all tables created
- [ ] Teable API token valid
- [ ] API cache invalidation endpoint deployed

## Deployment Commands

### Deploy to Staging

```bash
npm run deploy:staging
```

**Expected Output**:
```
✓ Uploaded balcony-solar-scraper (X.XX sec)
✓ Deployed to https://balcony-solar-scraper-staging.workers.dev
```

### Deploy to Production

```bash
npm run deploy
```

**Expected Output**:
```
✓ Uploaded balcony-solar-scraper (X.XX sec)
✓ Deployed to https://balcony-solar-scraper.workers.dev
```

### View Logs

```bash
wrangler tail
```

### View Deployments

```bash
wrangler deployments list
```

### Rollback

```bash
wrangler rollback --env production
```

## Testing

### Manual Trigger

```bash
# Staging
curl -X POST https://balcony-solar-scraper-staging.workers.dev/scrape

# Production
curl -X POST https://balcony-solar-scraper.workers.dev/scrape
```

**Expected Response**:
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

### Run Tests

```bash
npm test
```

**Expected Output**:
```
Test Suites: 5 passed, 5 total
Tests:       56 passed, 56 total
```

## Verification

### Verify Cron Trigger

1. Go to Cloudflare Dashboard
2. Workers & Pages → balcony-solar-scraper
3. Triggers tab → Verify `0 2 * * 1`

### Verify Teable Updates

1. Open Teable base
2. UpdateLog table
3. Look for recent entries with source: "scraper_worker"

### Verify Cache Invalidation

1. Trigger scraper manually
2. Check that cache was invalidated
3. Make API request to verify fresh data

### Verify Logs

```bash
wrangler tail
```

Look for:
- "Starting scheduled scraper job"
- "Scraped X states"
- "Scraper job completed"
- No error messages

## Configuration

### Environment Variables

**Production** (in `wrangler.toml`):
```
TEABLE_API_URL = "https://app.teable.ai/api"
TEABLE_BASE_ID = "bseTnc7nTi3FYus3yIk"
TEABLE_API_TOKEN = "your-token"
API_CACHE_INVALIDATE_URL = "https://api.solarcurrents.com/api/cache-invalidate"
ADMIN_EMAIL = "admin@solarcurrents.com"
ENABLE_ERROR_NOTIFICATIONS = "true"
MAX_EXECUTION_TIME_MS = "30000"
RETRY_ATTEMPTS = "3"
RETRY_BACKOFF_MS = "5000"
```

### Update Variables

Via Cloudflare Dashboard:
1. Workers & Pages → balcony-solar-scraper
2. Settings → Environment Variables
3. Add/update variables
4. Save and Deploy

## Monitoring

### Key Metrics

- **Execution**: Monday 2 AM UTC
- **Success Rate**: Should be > 95%
- **Execution Time**: Should be < 30 seconds
- **Error Count**: Should be 0
- **Cache Invalidation**: Should succeed 100%

### Alerts

- Execution time > 30 seconds: Warning
- Errors > 0: Error notification
- Cache invalidation failed: Critical alert
- Job overdue (> 24 hours): Critical alert

### View Metrics

```bash
# Check logs
wrangler tail

# Check Teable UpdateLog table
# Check Cloudflare dashboard
```

## Troubleshooting

### Worker Not Running

```bash
# Check deployment
wrangler deployments list

# Check logs
wrangler tail

# Check cron trigger in Cloudflare dashboard
```

### Teable API Errors

- Verify API token is valid
- Check table IDs are correct
- Verify API rate limits
- Check network connectivity

### Cache Invalidation Failed

- Verify cache endpoint URL
- Check authentication token
- Verify endpoint is running
- Check network connectivity

### High Execution Time

- Check Teable API response times
- Verify network connectivity
- Check for rate limiting
- Monitor CPU usage

## Documentation

- **DEPLOYMENT_GUIDE.md**: Comprehensive guide
- **DEPLOYMENT_CHECKLIST.md**: Detailed checklist
- **DEPLOYMENT_SUMMARY.md**: Overview
- **CRON_SETUP.md**: Cron configuration
- **CRON_MONITORING_INTEGRATION.md**: Monitoring guide
- **MONITORING_SETUP.md**: Monitoring setup
- **README.md**: Project overview

## Quick Links

- **Staging Worker**: https://balcony-solar-scraper-staging.workers.dev
- **Production Worker**: https://balcony-solar-scraper.workers.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Teable Base**: https://app.teable.ai

## Status

✅ Ready for deployment

- All tests passing (56/56)
- Code reviewed
- Environment configured
- Documentation complete

## Next Steps

1. Review DEPLOYMENT_GUIDE.md
2. Deploy to staging
3. Test staging
4. Deploy to production
5. Monitor first execution (Monday 2 AM UTC)

