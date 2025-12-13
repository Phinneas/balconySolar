# Balcony Solar Checker - API Documentation

## Overview

The Balcony Solar Checker API provides REST endpoints for retrieving state-specific balcony solar regulations. The API is built on Cloudflare Workers and connects to a Teable database as the single source of truth.

**Base URL**: `https://api.checker.solarcurrents.com` (or your configured domain)

**Response Format**: JSON

**Cache Duration**: 24 hours

---

## Authentication

Currently, the API is public and does not require authentication. All endpoints are accessible without API keys.

For future versions requiring authentication, include an `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Get All States

Returns a list of all states with basic balcony solar information.

**Endpoint**: `GET /api/states`

**Query Parameters**: None

**Response**: 
```json
{
  "states": [
    {
      "code": "ca",
      "name": "California",
      "abbreviation": "CA",
      "isLegal": true,
      "maxWattage": 800,
      "keyLaw": "SB 709 (2024)",
      "lastUpdated": "2024-12-09"
    },
    {
      "code": "ny",
      "name": "New York",
      "abbreviation": "NY",
      "isLegal": true,
      "maxWattage": 1200,
      "keyLaw": "Article 78",
      "lastUpdated": "2024-12-08"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Successfully returned all states
- `500 Internal Server Error`: Database connection failed

**Example**:
```bash
curl https://api.checker.solarcurrents.com/api/states
```

---

### 2. Get State Details

Returns comprehensive information for a specific state, including regulatory details and resource links.

**Endpoint**: `GET /api/states/:code`

**Path Parameters**:
- `code` (string, required): Two-letter state code (e.g., "ca", "ny", "ut")

**Response**:
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
        "description": "Notification to utility required but no formal agreement needed for systems under 800W"
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
      },
      {
        "title": "California Solar Initiative",
        "url": "https://www.csi.ca.gov/",
        "resourceType": "guide"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Successfully returned state data
- `404 Not Found`: State code not found
- `500 Internal Server Error`: Database connection failed

**Example**:
```bash
curl https://api.checker.solarcurrents.com/api/states/ca
```

---

### 3. Health Check

Returns API status and last data update timestamp for monitoring purposes.

**Endpoint**: `GET /api/health`

**Query Parameters**: None

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-09T14:30:00Z",
  "lastDataUpdate": "2024-12-09T02:00:00Z",
  "cacheStatus": "active",
  "version": "1.0.0"
}
```

**Status Codes**:
- `200 OK`: API is healthy
- `503 Service Unavailable`: Database connection failed

**Example**:
```bash
curl https://api.checker.solarcurrents.com/api/health
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-09T14:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_STATE_CODE` | 400 | State code format is invalid |
| `STATE_NOT_FOUND` | 404 | State code does not exist in database |
| `DATABASE_ERROR` | 500 | Teable database connection failed |
| `CACHE_ERROR` | 500 | Cache layer error |
| `TIMEOUT` | 504 | Request exceeded 5-second timeout |

### Example Error Response

```json
{
  "error": "State code 'xx' not found",
  "code": "STATE_NOT_FOUND",
  "timestamp": "2024-12-09T14:30:00Z"
}
```

---

## Caching

The API implements a 24-hour cache for all responses to reduce database load and improve performance.

**Cache Headers**:
```
Cache-Control: public, max-age=86400
ETag: "abc123def456"
Last-Modified: Mon, 09 Dec 2024 02:00:00 GMT
```

### Cache Invalidation

The cache is automatically invalidated when:
1. The Teable database is updated via the n8n workflow
2. An admin manually triggers cache invalidation via the internal endpoint

To manually invalidate cache (admin only):
```bash
curl -X POST https://api.checker.solarcurrents.com/api/cache-invalidate \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"state": "ca"}'
```

---

## Rate Limiting

Currently, there is no rate limiting on the public API. Rate limiting may be implemented in future versions.

---

## Response Times

**Target Response Times** (with cache):
- `/api/states`: < 100ms
- `/api/states/:code`: < 200ms
- `/api/health`: < 50ms

**Target Response Times** (cache miss):
- `/api/states`: < 500ms
- `/api/states/:code`: < 500ms

---

## Data Structure Reference

### State Object

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Two-letter state code (e.g., "ca") |
| `name` | string | Full state name (e.g., "California") |
| `abbreviation` | string | State abbreviation (e.g., "CA") |
| `isLegal` | boolean | Whether balcony solar is legal in the state |
| `maxWattage` | number | Maximum allowed wattage (300-2000W) |
| `keyLaw` | string | Primary state law or regulation |
| `lastUpdated` | string | ISO 8601 timestamp of last data update |

### Detail Object

| Field | Type | Description |
|-------|------|-------------|
| `required` | boolean | Whether this requirement applies |
| `description` | string | Detailed explanation of the requirement |

### Resource Object

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Resource title |
| `url` | string | Full URL to resource |
| `resourceType` | string | Type: "official", "guide", or "tool" |

---

## Integration Examples

### JavaScript/Node.js

```javascript
// Fetch all states
async function getAllStates() {
  const response = await fetch('https://api.checker.solarcurrents.com/api/states');
  const data = await response.json();
  return data.states;
}

// Fetch specific state
async function getStateData(stateCode) {
  const response = await fetch(`https://api.checker.solarcurrents.com/api/states/${stateCode}`);
  if (!response.ok) {
    throw new Error(`State not found: ${stateCode}`);
  }
  const data = await response.json();
  return data.state;
}

// Check API health
async function checkHealth() {
  const response = await fetch('https://api.checker.solarcurrents.com/api/health');
  const data = await response.json();
  return data.status === 'healthy';
}
```

### Python

```python
import requests

# Fetch all states
def get_all_states():
    response = requests.get('https://api.checker.solarcurrents.com/api/states')
    response.raise_for_status()
    return response.json()['states']

# Fetch specific state
def get_state_data(state_code):
    response = requests.get(f'https://api.checker.solarcurrents.com/api/states/{state_code}')
    if response.status_code == 404:
        raise ValueError(f'State not found: {state_code}')
    response.raise_for_status()
    return response.json()['state']
```

### cURL

```bash
# Get all states
curl https://api.checker.solarcurrents.com/api/states

# Get specific state
curl https://api.checker.solarcurrents.com/api/states/ca

# Check health
curl https://api.checker.solarcurrents.com/api/health

# Pretty print JSON
curl https://api.checker.solarcurrents.com/api/states/ca | jq .
```

---

## Monitoring

Monitor the API health using the `/api/health` endpoint:

```bash
# Check every 5 minutes
*/5 * * * * curl -f https://api.checker.solarcurrents.com/api/health || alert
```

Key metrics to monitor:
- Response time (target: < 500ms)
- Error rate (target: < 0.1%)
- Cache hit rate (target: > 95%)
- Data freshness (lastDataUpdate should be < 7 days old)

---

## Changelog

### Version 1.0.0 (2024-12-09)
- Initial API release
- GET /api/states endpoint
- GET /api/states/:code endpoint
- GET /api/health endpoint
- 24-hour caching
- Error handling and fallbacks

---

## Support

For API issues or questions, contact: support@solarcurrents.com

</content>
</invoke>