# Balcony Solar Scraper Worker

A Cloudflare Worker that automatically scrapes state balcony solar regulations and updates the Teable database.

## Overview

This worker runs on a weekly schedule (Monday 2 AM UTC) to:
1. Scrape official state utility commission websites for balcony solar regulations
2. Parse HTML to extract key information (legal status, wattage limits, requirements)
3. Update the Teable database with new or changed data
4. Log all changes to the UpdateLog table for audit purposes
5. Invalidate the API cache to ensure fresh data is served

## Architecture

### Components

- **TeableClient** (`src/teable-client.js`): API client for Teable database operations
- **RegulationScraper** (`src/scraper.js`): Web scraper for state regulation websites
- **Worker** (`src/index.js`): Main Cloudflare Worker that orchestrates the scraping and updating

### Data Flow

```
Official State Sources
        ↓
   Scraper (fetch HTML)
        ↓
   Parser (extract data)
        ↓
   Teable Client (update DB)
        ↓
   UpdateLog (audit trail)
        ↓
   Cache Invalidation (API)
```

## Setup

### Prerequisites

- Cloudflare account with Workers enabled
- Teable database with tables: States, Details, Resources, UpdateLog
- Node.js 18+ and npm

### Installation

```bash
cd scraper
npm install
```

### Configuration

Set environment variables in `wrangler.toml`:

```toml
[env.production]
vars = {
  TEABLE_API_URL = "https://app.teable.ai/api",
  TEABLE_BASE_ID = "your-base-id",
  TEABLE_API_TOKEN = "your-api-token",
  API_CACHE_INVALIDATE_URL = "https://api.yourdomain.com/api/cache-invalidate",
  ADMIN_EMAIL = "admin@yourdomain.com"
}
```

### Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Local development
npm run dev
```

## Usage

### Automatic Scheduling

The worker runs automatically on a cron schedule:
- **Schedule**: Monday 2 AM UTC (`0 2 * * 1`)
- **Trigger**: Cloudflare Cron Triggers

### Manual Trigger

For testing, you can manually trigger the scraper:

```bash
curl -X POST https://your-worker.workers.dev/scrape
```

## Data Structure

### States Table

```
- code: "ca", "ny", "tx", etc.
- name: "California", "New York", etc.
- abbreviation: "CA", "NY", etc.
- isLegal: true/false
- maxWattage: 800, 1200, etc.
- keyLaw: "SB 709", "HB 340", etc.
- lastUpdated: ISO timestamp
- dataSource: URL of official source
```

### Details Table

```
- stateCode: link to States table
- category: "interconnection", "permit", "outlet", "special_notes"
- required: true/false
- description: detailed explanation
```

### Resources Table

```
- stateCode: link to States table
- title: "California Public Utilities Commission"
- url: full URL
- resourceType: "official", "guide", "tool"
```

### UpdateLog Table

```
- timestamp: ISO timestamp
- stateCode: which state was updated
- changeType: "created", "updated", "verified"
- oldValue: JSON string of previous data
- newValue: JSON string of new data
- source: "scraper_worker", "manual_admin"
```

## Error Handling

The worker implements robust error handling:

- **Scraping failures**: Logged and skipped, existing data retained
- **Teable API errors**: Retried with exponential backoff
- **Timeout errors**: Handled gracefully with fallback
- **Data validation errors**: Quarantined and admin notified

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- teable-client.test.js
```

## Monitoring

Monitor the worker through:

1. **Cloudflare Dashboard**: View logs and metrics
2. **UpdateLog Table**: Check audit trail in Teable
3. **Email Notifications**: Admin receives alerts on errors
4. **Health Endpoint**: Check API status at `/api/health`

## Adding New States

To add a new state:

1. Add configuration to `stateConfigs` in `scraper.js`:
```javascript
xx: {
  name: 'State Name',
  abbreviation: 'XX',
  url: 'https://official-source.com',
  parser: this.parseStateRegulations.bind(this),
}
```

2. Implement parser method:
```javascript
async parseStateRegulations(html) {
  // Parse HTML and extract data
  return {
    isLegal: true/false,
    maxWattage: number,
    keyLaw: 'law reference',
    details: { /* ... */ },
    resources: [ /* ... */ ],
  };
}
```

3. Test the parser with sample HTML

## Troubleshooting

### Worker not running on schedule

- Check Cloudflare dashboard for cron trigger configuration
- Verify `wrangler.toml` has correct cron expression
- Check worker logs for errors

### Teable API errors

- Verify API token is correct and not expired
- Check table IDs match your Teable base
- Ensure API rate limits are not exceeded

### Scraping failures

- Check if state website URL is still valid
- Verify HTML structure hasn't changed
- Update parser if website layout changed

## Performance

- **Scraping time**: ~2-5 seconds per state
- **Teable updates**: ~1-2 seconds per state
- **Total runtime**: ~5-10 minutes for all states
- **Timeout**: 30 seconds (Cloudflare limit)

## Security

- API tokens stored in environment variables
- No sensitive data logged
- HTTPS only for all external requests
- Teable API authentication required

## License

ISC
