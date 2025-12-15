# Task 31: Deploy Cron Worker - Deployment Checklist

## Pre-Deployment Phase

### Prerequisites Verification

- [ ] Cloudflare account created and Workers enabled
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Wrangler authenticated: `wrangler login`
- [ ] Teable database created with all required tables
- [ ] Teable API token generated and valid
- [ ] API cache invalidation endpoint deployed and tested
- [ ] Admin email configured for notifications

### Code Quality Verification

- [ ] All tests passing locally: `npm test` (56/56 passing)
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] Code reviewed for security issues
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly configured in wrangler.toml

### Teable Database Verification

- [ ] States table exists with correct fields:
  - [ ] code (text, unique)
  - [ ] name (text)
  - [ ] abbreviation (text)
  - [ ] isLegal (checkbox)
  - [ ] maxWattage (number)
  - [ ] keyLaw (text)
  - [ ] lastUpdated (date)
  - [ ] dataSource (text)

- [ ] Details table exists with correct fields:
  - [ ] stateCode (link to States)
  - [ ] category (text)
  - [ ] required (checkbox)
  - [ ] description (long text)
  - [ ] sourceUrl (text)

- [ ] Resources table exists with correct fields:
  - [ ] stateCode (link to States)
  - [ ] title (text)
  - [ ] url (text)
  - [ ] resourceType (text)

- [ ] UpdateLog table exists with correct fields:
  - [ ] timestamp (date)
  - [ ] stateCode (text)
  - [ ] changeType (text)
  - [ ] oldValue (long text)
  - [ ] newValue (long text)
  - [ ] source (text)

### Environment Variables Verification

- [ ] TEABLE_API_URL configured: `https://app.teable.ai/api`
- [ ] TEABLE_BASE_ID configured with correct base ID
- [ ] TEABLE_API_TOKEN configured with valid token
- [ ] API_CACHE_INVALIDATE_URL configured with correct endpoint
- [ ] CACHE_INVALIDATE_TOKEN configured (if required)
- [ ] ADMIN_EMAIL configured with valid email
- [ ] ENABLE_ERROR_NOTIFICATIONS set to "true" (production)
- [ ] MAX_EXECUTION_TIME_MS set to "30000"
- [ ] RETRY_ATTEMPTS set to "3"
- [ ] RETRY_BACKOFF_MS set to "5000"

### API Endpoint Verification

- [ ] Cache invalidation endpoint is deployed
- [ ] Cache invalidation endpoint is accessible
- [ ] Cache invalidation endpoint accepts POST requests
- [ ] Cache invalidation endpoint returns success response
- [ ] Cache invalidation endpoint requires authentication

## Staging Deployment Phase

### Deploy to Staging

- [ ] Run: `npm run deploy:staging`
- [ ] Deployment successful (no errors)
- [ ] Deployment URL: `https://balcony-solar-scraper-staging.workers.dev`
- [ ] Verify deployment: `wrangler deployments list --env staging`

### Test Staging Deployment

- [ ] Manual trigger test: `curl -X POST https://balcony-solar-scraper-staging.workers.dev/scrape`
- [ ] Response status: 200
- [ ] Response includes jobId
- [ ] Response includes timestamp
- [ ] Response includes executionTimeMs
- [ ] Response includes statesProcessed
- [ ] Response includes status ("success" or "partial_failure")

### Verify Staging Teable Updates

- [ ] Open Teable base
- [ ] Go to UpdateLog table
- [ ] Verify recent entries exist
- [ ] Verify timestamp is recent (within last minute)
- [ ] Verify source is "scraper_worker"
- [ ] Verify changeType is "created", "updated", or "verified"
- [ ] Verify stateCode is populated

### Monitor Staging Logs

- [ ] Run: `wrangler tail --env staging`
- [ ] Verify logs show job execution
- [ ] Verify logs show "Starting scheduled scraper job"
- [ ] Verify logs show "Scraped X states"
- [ ] Verify logs show "Scraper job completed"
- [ ] No error messages in logs
- [ ] No timeout messages in logs

### Test Staging Error Handling

- [ ] Temporarily disable Teable API access
- [ ] Trigger scraper manually
- [ ] Verify error is logged
- [ ] Verify error notification is sent (if configured)
- [ ] Re-enable Teable API access

### Verify Staging Cache Invalidation

- [ ] Check that cache invalidation was triggered
- [ ] Verify cache invalidation succeeded
- [ ] Make API request to verify fresh data
- [ ] Verify response includes updated data

## Production Deployment Phase

### Deploy to Production

- [ ] Run: `npm run deploy`
- [ ] Deployment successful (no errors)
- [ ] Deployment URL: `https://balcony-solar-scraper.workers.dev`
- [ ] Verify deployment: `wrangler deployments list`

### Verify Production Deployment

- [ ] Check Cloudflare dashboard for deployment
- [ ] Verify worker is active
- [ ] Verify cron trigger is configured: `0 2 * * 1`
- [ ] Verify environment variables are set correctly

### Test Production Deployment

- [ ] Manual trigger test: `curl -X POST https://balcony-solar-scraper.workers.dev/scrape`
- [ ] Response status: 200
- [ ] Response indicates success
- [ ] No errors in response

### Verify Production Teable Updates

- [ ] Open Teable base
- [ ] Go to UpdateLog table
- [ ] Verify new entries from production
- [ ] Verify timestamp is recent
- [ ] Verify source is "scraper_worker"

### Monitor Production Logs

- [ ] Run: `wrangler tail`
- [ ] Verify logs show successful execution
- [ ] No error messages
- [ ] No timeout messages

### Verify Production Cache Invalidation

- [ ] Check that cache was invalidated
- [ ] Make API request to verify fresh data
- [ ] Verify response includes updated data

## Cron Trigger Configuration Phase

### Verify Cron Configuration

- [ ] Go to Cloudflare Dashboard
- [ ] Navigate to Workers & Pages → balcony-solar-scraper
- [ ] Go to "Triggers" tab
- [ ] Verify cron trigger exists
- [ ] Verify cron expression: `0 2 * * 1`
- [ ] Verify trigger is enabled

### Understand Cron Schedule

- [ ] Cron expression: `0 2 * * 1`
- [ ] Meaning: Every Monday at 2:00 AM UTC
- [ ] Frequency: Weekly
- [ ] Timezone: UTC
- [ ] Next execution: Next Monday at 2 AM UTC

### Test Cron Execution

- [ ] Wait for next scheduled execution (Monday 2 AM UTC)
- [ ] Check Cloudflare logs for execution
- [ ] Verify Teable UpdateLog for new entries
- [ ] Verify cache invalidation occurred
- [ ] Verify no errors in logs

## Monitoring and Alerting Phase

### Set Up Email Notifications

- [ ] Configure SendGrid API key (if using email)
- [ ] Add SENDGRID_API_KEY to environment variables
- [ ] Test email notification by triggering error
- [ ] Verify email received at ADMIN_EMAIL

### Set Up Slack Notifications

- [ ] Create Slack webhook URL
- [ ] Add SLACK_WEBHOOK_URL to environment variables
- [ ] Test Slack notification by triggering error
- [ ] Verify message received in Slack channel

### Set Up Sentry Integration

- [ ] Create Sentry project
- [ ] Add SENTRY_DSN to environment variables
- [ ] Test Sentry integration by triggering error
- [ ] Verify error appears in Sentry dashboard

### Set Up Monitoring Dashboard

- [ ] Create dashboard to track:
  - [ ] Execution frequency
  - [ ] Success rate
  - [ ] Execution time
  - [ ] Error count
  - [ ] Cache invalidation status
  - [ ] Data freshness

### Configure Alerting Rules

- [ ] Alert on execution time > 30 seconds
- [ ] Alert on error count > 0
- [ ] Alert on cache invalidation failure
- [ ] Alert on job failure
- [ ] Alert on job overdue (no execution in 24 hours)

### Test Alerting

- [ ] Trigger slow execution alert
- [ ] Trigger error alert
- [ ] Trigger cache invalidation failure alert
- [ ] Verify all alerts are received

## Post-Deployment Verification Phase

### Verify All Systems

- [ ] Worker deployed and active
- [ ] Cron trigger configured and enabled
- [ ] Teable database receiving updates
- [ ] Cache invalidation working
- [ ] Monitoring and alerting configured
- [ ] Logs accessible and showing execution
- [ ] No errors in logs
- [ ] Data freshness verified

### Monitor First Scheduled Execution

- [ ] Wait for Monday 2 AM UTC
- [ ] Check Cloudflare logs for execution
- [ ] Verify Teable UpdateLog for new entries
- [ ] Verify cache invalidation occurred
- [ ] Verify no errors
- [ ] Verify execution time < 30 seconds
- [ ] Verify all 51 states processed

### Verify Data Quality

- [ ] Check that all states have been processed
- [ ] Verify lastUpdated timestamps are recent
- [ ] Verify no null or invalid values
- [ ] Verify data consistency across tables
- [ ] Verify resources are linked correctly

### Document Deployment

- [ ] Record deployment date and time
- [ ] Record deployment version/commit
- [ ] Record any issues encountered
- [ ] Record resolution steps
- [ ] Update deployment documentation

## Rollback Procedure (If Needed)

### Identify Issue

- [ ] Determine if rollback is necessary
- [ ] Document the issue
- [ ] Check if issue can be fixed without rollback

### Perform Rollback

- [ ] View deployment history: `wrangler deployments list`
- [ ] Identify previous stable deployment
- [ ] Run: `wrangler rollback --env production`
- [ ] Verify rollback successful

### Verify Rollback

- [ ] Test manual trigger
- [ ] Check logs for successful execution
- [ ] Verify Teable updates
- [ ] Verify cache invalidation

### Post-Rollback

- [ ] Investigate root cause of issue
- [ ] Fix issue in code
- [ ] Re-test locally
- [ ] Re-deploy to staging
- [ ] Re-deploy to production

## Maintenance Phase

### Daily Tasks

- [ ] Check logs: `wrangler tail`
- [ ] Review any error messages
- [ ] Verify no alerts triggered
- [ ] Check execution time is reasonable

### Weekly Tasks

- [ ] Monitor Monday 2 AM UTC execution
- [ ] Review UpdateLog table for new entries
- [ ] Check data freshness
- [ ] Review error rates
- [ ] Check cache hit rates

### Monthly Tasks

- [ ] Review execution statistics
- [ ] Analyze performance trends
- [ ] Review and update alerting thresholds
- [ ] Check for any security issues
- [ ] Plan any optimizations

## Sign-Off

### Deployment Completed

- [ ] All pre-deployment checks passed
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Cron trigger configured and verified
- [ ] Monitoring and alerting configured
- [ ] First scheduled execution successful
- [ ] All requirements met (5.1, 5.2, 7.3)

### Deployment Date

**Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

### Notes

_______________________________________________________________________________

_______________________________________________________________________________

_______________________________________________________________________________

## Requirements Validation

### Requirement 5.1: State regulations updated within 7 days

- [ ] Cron job runs weekly (Monday 2 AM UTC)
- [ ] Scrapes official state sources
- [ ] Updates Teable database
- [ ] Logs all changes with timestamps

### Requirement 5.2: API serves updated data within 1 minute

- [ ] Cache invalidation triggered after Teable update
- [ ] API cache invalidation endpoint configured
- [ ] Monitoring for cache invalidation success
- [ ] Alerting if cache invalidation fails

### Requirement 7.3: Data updates logged with timestamps and source

- [ ] UpdateLog table configured in Teable
- [ ] All changes logged with timestamp
- [ ] Source information tracked (scraper_worker)
- [ ] Change type recorded (created/updated/verified)

## Success Criteria

✅ Deployment is successful when:

1. [ ] Worker deployed to Cloudflare
2. [ ] Cron trigger configured (Monday 2 AM UTC)
3. [ ] Manual trigger test passes
4. [ ] Teable updates verified
5. [ ] Cache invalidation working
6. [ ] Monitoring and alerting configured
7. [ ] First scheduled execution successful
8. [ ] No errors in logs
9. [ ] Data freshness verified
10. [ ] All requirements met (5.1, 5.2, 7.3)

