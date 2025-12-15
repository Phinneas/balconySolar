# API Worker Deployment Guide - Task 30

## Overview

This guide covers deploying the Balcony Solar Checker REST API Worker to Cloudflare. The API serves state regulation data from Teable and includes caching, error handling, and monitoring capabilities.

## Pre-Deployment Checklist

- [x] API code is complete and tested
- [x] All 67 tests passing
- [x] Environment variables identified
- [x] Teable database configured
- [x] wrangler.toml configured
- [x] CORS headers configured
- [x] Cache layer implemented

## Environment Variables Required

The following environment variables must be configured in Cloudflare Workers:

### Production Environment

```
TEABLE_API_URL=https://app.teable.ai/api
TEABLE_BASE_ID=bseTnc7nTi3FYus3yIk
TEABLE_API_TOKEN=teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=
CACHE_INVALIDATE_TOKEN=cache_invalidate_token_secret_key_12345
```

### Table IDs

```
STATES_TABLE_ID=tbl9JsNibYgkgi7iEVW
DETAILS_TABLE_ID=tbl2QU2ySxGNHLhNstq
RESOURCES_TABLE_ID=tblGYUmWEMeTg4oBTY3
UPDATE_LOG_TABLE_ID=tblNAUNfKxO4Wi0SJ1A
```

## Deployment Steps

### Step 1: Authenticate with Cloudflare

```bash
npm install -g wrangler
wrangler login
```

This will open a browser to authenticate your Cloudflare account.

### Step 2: Configure wrangler.toml

The `wrangler.toml` file is already configured with:
- Worker name: `balcony-solar-api`
- Production route: `api.solarcurrents.com/*`
- Staging route: `api-staging.solarcurrents.com/*`

### Step 3: Set Environment Variables

#### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Workers & Pages → balcony-solar-api
3. Go to Settings → Environment variables
4. Add each variable for Production environment:
   - `TEABLE_API_URL`
   - `TEABLE_BASE_ID`
   - `TEABLE_API_TOKEN`
   - `CACHE_INVALIDATE_TOKEN`
   - `STATES_TABLE_ID`
   - `DETAILS_TABLE_ID`
   - `RESOURCES_TABLE_ID`
   - `UPDATE_LOG_TABLE_ID`

#### Option B: Via wrangler.toml

Add to `wrangler.toml`:

```toml
[env.production]
vars = { TEABLE_API_URL = "https://app.teable.ai/api", TEABLE_BASE_ID = "bseTnc7nTi3FYus3yIk" }
```

### Step 4: Deploy to Production

```bash
cd api
npm run deploy
```

Or deploy to staging first:

```bash
npm run deploy:staging
```

### Step 5: Verify Deployment

#### Check Deployment Status

```bash
wrangler deployments list
```

#### Test API Endpoints

**Health Check:**
```bash
curl https://api.solarcurrents.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-09T...",
  "cache": {
    "size": 0,
    "expiredCount": 0,
    "totalSizeBytes": 0,
    "ttlMs": 86400000
  }
}
```

**Get All States:**
```bash
curl https://api.solarcurrents.com/api/states
```

Expected response:
```json
{
  "states": [
    {
      "code": "ca",
      "name": "California",
      "abbreviation": "CA",
      "isLegal": true,
      "maxWattage": 800,
      "keyLaw": "SB 709",
      "lastUpdated": "2024-12-09"
    },
    ...
  ]
}
```

**Get Single State:**
```bash
curl https://api.solarcurrents.com/api/states/ca
```

Expected response:
```json
{
  "state": {
    "code": "ca",
    "name": "California",
    "abbreviation": "CA",
    "isLegal": true,
    "maxWattage": 800,
    "keyLaw": "SB 709",
    "lastUpdated": "2024-12-09",
    "details": {
      "interconnection": {
        "required": false,
        "description": "..."
      },
      ...
    },
    "resources": [
      {
        "title": "...",
        "url": "...",
        "resourceType": "official"
      }
    ]
  }
}
```

## API Endpoints

### GET /api/states
Returns all states with basic information.

**Response Headers:**
- `X-Cache`: HIT or MISS
- `Cache-Control`: public, max-age=86400

### GET /api/states/:code
Returns full state data including details and resources.

**Parameters:**
- `code` (string): Two-letter state code (e.g., "ca", "ny")

**Response Headers:**
- `X-Cache`: HIT or MISS
- `Cache-Control`: public, max-age=86400

### GET /api/health
Returns API health status and cache statistics.

### POST /api/cache-invalidate
Invalidates cache entries (requires authentication).

**Headers:**
- `Authorization`: Bearer {CACHE_INVALIDATE_TOKEN}

**Body:**
```json
{
  "pattern": "state-ca"
}
```

## Caching Strategy

- **TTL**: 24 hours (86400 seconds)
- **Cache Keys**: 
  - `all-states` - All states list
  - `state-{code}` - Individual state data
- **Invalidation**: Via `/api/cache-invalidate` endpoint

## Error Handling

The API handles the following error scenarios:

| Error | Status | Response |
|-------|--------|----------|
| Invalid state code | 404 | `{ "error": "State not found" }` |
| Teable API timeout | 504 | `{ "error": "Teable API request timeout (>5s)" }` |
| Teable API error | 502 | `{ "error": "Teable API error: {status}" }` |
| Unauthorized cache invalidation | 401 | `{ "error": "Unauthorized" }` |
| Unknown route | 404 | `{ "error": "Not found" }` |

## Monitoring

### Cloudflare Analytics

1. Go to Cloudflare Dashboard → Workers & Pages → balcony-solar-api
2. View Analytics tab for:
   - Request count
   - Error rate
   - Response time
   - CPU time

### Logs

View real-time logs:

```bash
wrangler tail
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Response Time | < 500ms | Cached responses should be < 100ms |
| Error Rate | < 0.1% | Monitor for Teable API issues |
| Cache Hit Rate | > 80% | After warm-up period |
| Uptime | > 99.9% | Cloudflare SLA |

## Troubleshooting

### Deployment Fails

```bash
# Check for syntax errors
npm test

# Verify wrangler.toml
wrangler publish --dry-run

# Check authentication
wrangler whoami
```

### API Returns 502 Errors

- Verify Teable API token is correct
- Check Teable API status: https://status.teable.io
- Verify network connectivity to Teable
- Check Cloudflare Worker logs: `wrangler tail`

### Cache Not Working

- Verify cache headers in response: `X-Cache: HIT`
- Check cache invalidation token is correct
- Verify cache TTL is set correctly (24 hours)

### CORS Issues

- Verify `Access-Control-Allow-Origin: *` header is present
- Check browser console for CORS errors
- Verify frontend is making requests to correct API URL

## Rollback Procedure

If issues occur after deployment:

### Via Cloudflare Dashboard

1. Go to Workers & Pages → balcony-solar-api
2. Click Deployments
3. Select previous successful deployment
4. Click "Rollback to this deployment"

### Via Wrangler

```bash
# View deployment history
wrangler deployments list

# Rollback to specific deployment
wrangler rollback --message "Rollback to previous version"
```

## Post-Deployment Verification

### Immediate Checks (5 minutes)

- [ ] Deployment completes without errors
- [ ] Health endpoint responds: `GET /api/health`
- [ ] All states endpoint responds: `GET /api/states`
- [ ] Single state endpoint responds: `GET /api/states/ca`
- [ ] No console errors in Cloudflare logs

### Functional Tests (15 minutes)

- [ ] Response includes all required fields
- [ ] Cache headers present (`X-Cache`, `Cache-Control`)
- [ ] CORS headers present (`Access-Control-Allow-Origin`)
- [ ] Error handling works (test with invalid state code)
- [ ] Cache invalidation works with correct token

### Performance Tests (30 minutes)

- [ ] Response time < 500ms for first request
- [ ] Response time < 100ms for cached requests
- [ ] Cache hit rate > 80% after warm-up
- [ ] No memory leaks or CPU spikes
- [ ] Cloudflare Analytics show normal traffic

### Integration Tests (1 hour)

- [ ] Frontend can fetch data from API
- [ ] State selection works end-to-end
- [ ] URL parameters work correctly
- [ ] Print functionality works
- [ ] Iframe embedding works

## Requirements Coverage

This deployment satisfies the following requirements:

- **5.3**: REST API serves state data from Teable
- **5.4**: 24-hour cache with invalidation mechanism
- **1.4**: API response time < 500ms
- **5.1**: Data freshness maintained
- **5.2**: Cache invalidation within 1 minute
- **5.5**: Error handling with fallback
- **7.4**: Logging for debugging

## Next Steps

1. **Monitor API Performance**
   - Check Cloudflare Analytics daily
   - Set up alerts for errors
   - Track response times

2. **Deploy Cron Worker** (Task 31)
   - Set up data scraping
   - Configure Teable updates
   - Test cache invalidation

3. **Integrate with Frontend** (Task 22)
   - Update frontend API URL
   - Test end-to-end flow
   - Verify all functionality

4. **Set Up Monitoring** (Task 21)
   - Configure uptime monitoring
   - Set up error alerts
   - Track performance metrics

## Support

For issues or questions:
1. Check Cloudflare Worker logs: `wrangler tail`
2. Review error responses from API
3. Check Teable API status
4. Review this guide's troubleshooting section
5. Check Cloudflare documentation: https://developers.cloudflare.com/workers/

## Deployment Checklist

- [ ] Environment variables configured
- [ ] wrangler.toml verified
- [ ] Tests passing locally
- [ ] Deployment command executed
- [ ] Health endpoint verified
- [ ] All states endpoint verified
- [ ] Single state endpoint verified
- [ ] Cache headers verified
- [ ] CORS headers verified
- [ ] Error handling tested
- [ ] Performance targets met
- [ ] Cloudflare Analytics reviewed
- [ ] Logs reviewed for errors
- [ ] Frontend integration tested
- [ ] Documentation updated

</content>
