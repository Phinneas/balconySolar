# Design Document: Balcony Solar Legal State Checker

## Overview

The Balcony Solar Legal State Checker is a full-stack application consisting of:

1. **Frontend**: Interactive React component deployed on Cloudflare Pages
2. **Backend**: REST API serving state regulation data (Cloudflare Workers)
3. **Data Layer**: Teable database as single source of truth (open-source, self-hosted or cloud)
4. **Automation**: Cloudflare Worker with cron trigger for weekly data updates from official state sources
5. **Integration**: Embedded on SolarCurrents with iframe support

The system prioritizes data accuracy, performance, and ease of maintenance. All state regulation data flows through Teable, ensuring consistency across all interfaces. Teable is a free, open-source alternative to Airtable with unlimited records and API calls. Automation runs entirely on Cloudflare's infrastructure with no additional services needed.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Official State Sources                    │
│         (State Utility Commissions, Electrical Codes)        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Cloudflare Worker with Cron (Weekly)                 │
│  - Scrape official websites                                  │
│  - Parse regulation changes                                  │
│  - Validate data accuracy                                    │
│  - Update Teable database                                    │
│  - Log changes to UpdateLog table                            │
│  - Trigger API cache invalidation                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Teable Database (Single Source of Truth)           │
│  - States table (name, abbreviation, isLegal, maxWattage)   │
│  - Details table (interconnection, permits, outlets)        │
│  - Resources table (links, official sources)                │
│  - UpdateLog table (audit trail)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              REST API (Cloudflare Workers or Node.js)        │
│  - GET /api/states (all states)                             │
│  - GET /api/states/:code (single state)                     │
│  - Cache layer (24-hour TTL)                                │
│  - Error handling & fallback                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend (React Component on Cloudflare Pages)       │
│  - State selector (dropdown or button grid)                 │
│  - Results display (legal status, requirements, resources)  │
│  - Shareable URLs with state parameter                      │
│  - Print-friendly styling                                   │
│  - Responsive mobile design                                 │
│  - Iframe embedding support                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Distribution Channels                           │
│  - Cloudflare Pages (primary)                               │
│  - SolarCurrents embed (iframe)                             │
│  - Solar company embeds (iframe)                            │
│  - Social sharing (URL parameters)                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

**BalconySolarChecker (Main Container)**
- Manages state selection and result display
- Handles URL parameter parsing for shareable links
- Manages API calls and caching

**StateSelector**
- Renders state selection interface (dropdown or button grid)
- Handles state change events
- Displays loading state during API calls

**StateResults**
- Displays legal status with visual indicator (✅/❌)
- Shows max wattage and key law
- Renders expandable details sections
- Displays resource links
- Includes share and print buttons

**DetailAccordion**
- Expandable sections for interconnection, permits, outlets, special notes
- Smooth animations on expand/collapse
- Accessible keyboard navigation

**ShareButton**
- Generates shareable URL with state parameter
- Copy-to-clipboard functionality
- Visual feedback on copy success

### REST API Endpoints

**GET /api/states**
- Returns array of all states with basic info
- Response: `{ states: [{ code, name, abbreviation, isLegal, maxWattage, keyLaw, lastUpdated }] }`
- Cache: 24 hours

**GET /api/states/:code**
- Returns full state data including details and resources
- Response: `{ state: { code, name, abbreviation, isLegal, maxWattage, keyLaw, details: {...}, resources: [...], lastUpdated } }`
- Cache: 24 hours

**GET /api/health**
- Returns API status and last data update timestamp
- Used for monitoring and debugging

### Cloudflare Worker Cron Trigger

**Trigger**: Weekly schedule via cron expression (Monday 2 AM UTC: `0 2 * * 1`)

**Steps**:
1. Fetch state utility commission websites (configurable list)
2. Parse HTML/PDF for balcony solar regulations
3. Extract: isLegal, maxWattage, keyLaw, requirements
4. Compare with existing Teable data via Teable API
5. If changes detected: update Teable records + log to UpdateLog table
6. Send notification to admin if critical changes found
7. Trigger API cache invalidation via internal endpoint

## Data Models

### Teable Database Structure

**States Table**
```
- id (primary key)
- code (text, unique): "ca", "ny", "ut", etc.
- name (text): "California", "New York", etc.
- abbreviation (text): "CA", "NY", etc.
- isLegal (checkbox): true/false
- maxWattage (number): 800, 1200, etc.
- keyLaw (text): "SB 709", "HB 340", etc.
- lastUpdated (date): auto-updated by n8n
- dataSource (text): URL of official source
- linkedDetails (link to Details table)
- linkedResources (link to Resources table)
```

**Details Table**
```
- id (primary key)
- stateCode (link to States table)
- category (text): "interconnection", "permit", "outlet", "special_notes"
- required (checkbox): true/false
- description (long text): detailed explanation
- sourceUrl (text): link to official documentation
```

**Resources Table**
```
- id (primary key)
- stateCode (link to States table)
- title (text): "California Public Utilities Commission"
- url (text): full URL
- resourceType (text): "official", "guide", "tool"
```

**UpdateLog Table**
```
- id (primary key)
- timestamp (date): when update occurred
- stateCode (text): which state was updated
- changeType (text): "created", "updated", "verified"
- oldValue (long text): previous data
- newValue (long text): new data
- source (text): "n8n_workflow", "manual_admin"
```

### Frontend Data Structure (JSON from API)

```json
{
  "state": {
    "code": "ca",
    "name": "California",
    "abbreviation": "CA",
    "isLegal": true,
    "maxWattage": 800,
    "keyLaw": "SB 709 (2024)",
    "lastUpdated": "2024-12-09",
    "details": {
      "interconnection": {
        "required": false,
        "description": "Notification to utility required but no formal agreement needed"
      },
      "permit": {
        "required": false,
        "description": "No building permit required for residential systems under 800W"
      },
      "outlet": {
        "required": true,
        "description": "Standard Schuko wall outlet allowed as of May 2024"
      },
      "special_notes": {
        "required": false,
        "description": "Register in Enedis system if system acts as generator. Can use standard outlets."
      }
    },
    "resources": [
      {
        "title": "California Public Utilities Commission",
        "url": "https://www.cpuc.ca.gov/",
        "resourceType": "official"
      }
    ]
  }
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: State Data Completeness
*For any* state in the system, the returned data SHALL include all required fields: code, name, abbreviation, isLegal, maxWattage, keyLaw, details, resources, and lastUpdated.

**Validates: Requirements 7.1**

### Property 2: Wattage Limit Validity
*For any* state, the maxWattage value SHALL be a positive integer between 300 and 2000 watts (representing realistic balcony solar system sizes).

**Validates: Requirements 1.2**

### Property 3: Legal Status Consistency
*For any* state, if isLegal is true, then at least one detail category SHALL have required=false (indicating the system is permitted). If isLegal is false, then all detail categories SHALL have required=true or the description SHALL indicate prohibition.

**Validates: Requirements 1.1, 2.1**

### Property 4: Resource Link Validity
*For any* state with resources, all resource URLs SHALL be valid HTTP/HTTPS URLs and SHALL not be empty strings.

**Validates: Requirements 3.1, 3.3**

### Property 5: URL Parameter Round Trip
*For any* state code, when a user accesses the checker with a state parameter in the URL (e.g., ?state=ca), the system SHALL automatically load and display results for that exact state, and the shareable URL generated SHALL match the original URL.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: API Response Time
*For any* API request to /api/states or /api/states/:code, the response time SHALL be less than 500 milliseconds when data is cached.

**Validates: Requirements 1.4**

### Property 7: Data Freshness
*For any* state data served by the API, the lastUpdated timestamp SHALL be no older than 7 days (indicating the n8n workflow has run recently).

**Validates: Requirements 5.1, 5.2**

### Property 8: Cache Invalidation
*For any* update to the Airtable base, the API cache SHALL be invalidated within 1 minute, and subsequent requests SHALL return the updated data.

**Validates: Requirements 5.2, 5.4**

### Property 9: Mobile Responsiveness
*For any* viewport width from 320px to 2560px, the interface SHALL render without horizontal scrolling, text SHALL remain readable (minimum 14px font size), and touch targets SHALL be at least 44px in size.

**Validates: Requirements 1.5**

### Property 10: Iframe Embedding Isolation
*For any* page embedding the checker via iframe, the embedded component SHALL function independently without requiring the parent page to load React, CSS, or other dependencies beyond the iframe tag.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

**API Errors**
- If Teable API is unavailable: Return cached data with "last updated X hours ago" message
- If API request times out (>5 seconds): Display user-friendly error and suggest retry
- If state code is invalid: Display "State not found" message with state selector

**Data Validation Errors**
- If state data is incomplete: Display "Data pending for this state" message
- If maxWattage is missing or invalid: Display "Wattage information unavailable"
- If resources are missing: Display results without resources section

**Network Errors**
- If user is offline: Display cached data with offline indicator
- If API is down: Show error message with timestamp of last successful update

**Cron Worker Errors**
- If scraping fails for a state: Log error, keep existing data, send admin notification
- If Teable update fails: Retry up to 3 times with exponential backoff
- If data validation fails: Quarantine suspicious data, alert admin for manual review
- If cron execution times out (>30 seconds): Log timeout, retry on next scheduled run

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

- **State selector component**: Test state selection, dropdown rendering, keyboard navigation
- **Results display**: Test rendering of legal status, wattage, resources
- **URL parameter parsing**: Test valid/invalid state codes, URL generation
- **API client**: Test successful requests, error handling, caching logic
- **Data validation**: Test incomplete data, invalid wattage values, missing resources
- **Mobile layout**: Test responsive breakpoints, touch target sizes

### Property-Based Testing

Property-based tests verify universal properties that should hold across all inputs:

- **State data completeness**: Generate random state objects, verify all required fields present
- **Wattage validity**: Generate random wattage values, verify they fall within valid range
- **Legal status consistency**: Generate random legal status values, verify consistency with details
- **Resource URL validity**: Generate random URLs, verify they are valid HTTP/HTTPS
- **URL round trip**: Generate random state codes, verify URL parameter round trip works
- **API response time**: Generate random API requests, verify response time < 500ms
- **Data freshness**: Generate random timestamps, verify lastUpdated is recent
- **Cache invalidation**: Generate random data updates, verify cache is invalidated
- **Mobile responsiveness**: Generate random viewport sizes, verify layout renders correctly
- **Iframe isolation**: Generate random parent page configurations, verify iframe works independently

### Testing Framework

- **Unit Tests**: Jest with React Testing Library
- **Property-Based Tests**: fast-check (JavaScript property testing library)
- **Minimum iterations**: 100 per property test
- **Coverage target**: >80% for core logic, >60% for UI components

### Test Annotation Format

Each property-based test SHALL be tagged with:
```
/**
 * Feature: balcony-solar-checker, Property X: [Property description]
 * Validates: Requirements Y.Z
 */
```

Example:
```javascript
/**
 * Feature: balcony-solar-checker, Property 1: State Data Completeness
 * Validates: Requirements 7.1
 */
test('state data includes all required fields', () => {
  // test implementation
});
```

## Deployment

**Frontend**: Cloudflare Pages
- Build: `npm run build`
- Deploy: Connected to Git repository, auto-deploys on push to main
- Environment: Production URL (e.g., checker.solarcurrents.com or /checker on SolarCurrents)

**Backend API**: Cloudflare Workers
- Handles requests to /api/states and /api/states/:code
- Connects to Teable API
- Implements caching layer
- Includes internal endpoint for cache invalidation

**Data Pipeline**: Cloudflare Worker with Cron Trigger
- Runs weekly on schedule (Monday 2 AM UTC)
- Scrapes official state sources
- Updates Teable database
- Logs all changes to UpdateLog table
- Deployed as separate Worker or same Worker with conditional routing

**Monitoring**
- Uptime monitoring for API endpoints
- Alert on n8n workflow failures
- Track API response times
- Monitor cache hit rates
