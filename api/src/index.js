/**
 * Balcony Solar Checker REST API
 * Cloudflare Workers
 */

import CacheManager from './cache.js';
import AnalyticsService from './analytics.js';
import {
  APIError,
  NotFoundError,
  TimeoutError,
  ExternalServiceError,
  RateLimitError,
  formatErrorResponse
} from './errors.js';

const TEABLE_API_URL = 'https://app.teable.ai/api';
const TEABLE_BASE_ID = 'bseTnc7nTi3FYus3yIk';
const TEABLE_API_TOKEN = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';
const CACHE_INVALIDATE_TOKEN = 'cache_invalidate_token_secret_key_12345';

const TABLE_IDS = {
  states: 'tbl9JsNibYgkgi7iEVW',
  details: 'tbl2QU2ySxGNHLhNstq',
  resources: 'tblGYUmWEMeTg4oBTY3',
  updateLog: 'tblNAUNfKxO4Wi0SJ1A',
};

// Cache manager with 24-hour TTL
const cache = new CacheManager(24 * 60 * 60 * 1000);
const CACHE_TTL_SECONDS = 24 * 60 * 60;

// Analytics service
const analytics = new AnalyticsService({
  maxEventsInMemory: 10000,
  maxFeedbackInMemory: 1000,
});

// Solar companies cache manager with 7-day TTL
const solarCompaniesCache = new CacheManager(7 * 24 * 60 * 60 * 1000);

// Daily rate limiting tracker for solar companies API (100 requests/day)
let dailyRequestCount = 0;
let dailyRequestResetDate = new Date().toDateString();
const MAX_DAILY_REQUESTS = 100;

function checkDailyRateLimit() {
  const currentDate = new Date().toDateString();
  if (currentDate !== dailyRequestResetDate) {
    dailyRequestCount = 0;
    dailyRequestResetDate = currentDate;
  }
  return dailyRequestCount < MAX_DAILY_REQUESTS;
}

/**
 * Google Places API helper functions
 */

async function callGooglePlacesTextSearch(query) {
  const apiKey = typeof GOOGLE_PLACES_API_KEY !== 'undefined' ? GOOGLE_PLACES_API_KEY : null;
  if (!apiKey) {
    throw new APIError('Google Places API key not configured', 500, 'CONFIG_ERROR');
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ExternalServiceError(`Google Places API error: ${errorData.error_message || response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new ExternalServiceError(`Google Places API: ${data.error_message || data.status}`);
    }

    return data.results;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new TimeoutError('Google Places API request timeout');
    }
    throw error;
  }
}

async function callGooglePlaceDetails(placeId) {
  const apiKey = typeof GOOGLE_PLACES_API_KEY !== 'undefined' ? GOOGLE_PLACES_API_KEY : null;
  if (!apiKey) {
    throw new APIError('Google Places API key not configured', 500, 'CONFIG_ERROR');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=phone,website&key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null; // Silently fail for details to avoid breaking main results
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return null;
    }

    return data.result;
  } catch (error) {
    return null; // Silently fail for details
  }
}

function buildTeableFilter(fieldId, value) {
  const filter = {
    conjunction: 'and',
    filterSet: [{
      fieldId: fieldId,
      operator: 'is',
      value: value
    }]
  };
  return `?filter=${encodeURIComponent(JSON.stringify(filter))}`;
}

async function fetchFromTeable(tableId, query = '') {
  const url = `${TEABLE_API_URL}/table/${tableId}/record${query}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TEABLE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('Resource not found in Teable');
      }
      throw new ExternalServiceError(`Teable API error: ${response.status}`, response.status);
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new TimeoutError('Teable API request timeout (>5s)');
    }
    if (error instanceof APIError) {
      throw error;
    }
    throw new ExternalServiceError(`Failed to fetch from Teable: ${error.message}`);
  }
}

async function getAllStates() {
  const cacheKey = 'all-states';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const response = await fetchFromTeable(TABLE_IDS.states);
  const states = response.records
    .map(record => ({
      code: record.fields.code,
      name: record.fields.name,
      abbreviation: record.fields.abbreviation,
      isLegal: record.fields.isLegal,
      maxWattage: record.fields.maxWattage,
      keyLaw: record.fields.keyLaw,
      lastUpdated: record.fields.lastUpdated,
    }));

  cache.set(cacheKey, states);
  return { data: states, fromCache: false };
}

async function getStateByCode(code) {
  const cacheKey = `state-${code}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // Fetch state
  const statesResponse = await fetchFromTeable(TABLE_IDS.states, buildTeableFilter('code', code));
  
  // Filter to get only records with matching code (in case filter returns multiple)
  const matchingRecords = statesResponse.records?.filter(r => r.fields.code === code) || [];
  
  if (matchingRecords.length === 0) {
    return { data: null, fromCache: false };
  }

  const stateRecord = matchingRecords[0];
  const state = {
    code: stateRecord.fields.code,
    name: stateRecord.fields.name,
    abbreviation: stateRecord.fields.abbreviation,
    isLegal: stateRecord.fields.isLegal,
    maxWattage: stateRecord.fields.maxWattage,
    keyLaw: stateRecord.fields.keyLaw,
    lastUpdated: stateRecord.fields.lastUpdated,
    details: {},
    resources: [],
  };

  // Fetch details
  const detailsResponse = await fetchFromTeable(TABLE_IDS.details, buildTeableFilter('stateCode', code));
  if (detailsResponse.records) {
    detailsResponse.records
      .filter(record => record.fields.stateCode === code) // Extra safety filter
      .forEach(record => {
        const category = record.fields.category;
        if (category) {
          state.details[category] = {
            required: record.fields.required,
            description: record.fields.description,
          };
        }
      });
  }

  // Fetch resources
  const resourcesResponse = await fetchFromTeable(TABLE_IDS.resources, buildTeableFilter('stateCode', code));
  if (resourcesResponse.records) {
    state.resources = resourcesResponse.records
      .filter(record => record.fields.stateCode === code) // Extra safety filter
      .map(record => ({
        title: record.fields.title,
        url: record.fields.url,
        resourceType: record.fields.resourceType,
      }));
  }

  cache.set(cacheKey, state);
  return { data: state, fromCache: false };
}

function getCacheHeaders(fromCache = false) {
  if (fromCache) {
    return {
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      'X-Cache': 'HIT',
    };
  }
  return {
    'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    'X-Cache': 'MISS',
  };
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET /api/states - Get all states
    if (path === '/api/states' && request.method === 'GET') {
      const result = await getAllStates();
      const cacheHeaders = getCacheHeaders(result.fromCache);
      return new Response(JSON.stringify({ states: result.data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...cacheHeaders },
      });
    }

    // GET /api/states/:code - Get single state
    if (path.match(/^\/api\/states\/[a-z]{2}$/) && request.method === 'GET') {
      const code = path.split('/')[3];
      const result = await getStateByCode(code);
      
      if (!result.data) {
        return new Response(JSON.stringify({ error: 'State not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const cacheHeaders = getCacheHeaders(result.fromCache);
      return new Response(JSON.stringify({ state: result.data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders, ...cacheHeaders },
      });
    }

    // GET /api/health - Health check
    if (path === '/api/health' && request.method === 'GET') {
      const stats = cache.getStats();
      return new Response(JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        cache: stats,
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // POST /api/cache-invalidate - Invalidate cache (internal, requires authentication)
    if (path === '/api/cache-invalidate' && request.method === 'POST') {
      // Verify authentication token
      const authHeader = request.headers.get('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : null;
      
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const body = await request.json();
      const pattern = body.pattern || null;
      cache.invalidate(pattern);
      
      return new Response(JSON.stringify({ 
        status: 'cache invalidated',
        pattern: pattern,
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // POST /api/analytics/events - Record analytics events
    if (path === '/api/analytics/events' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { sessionId, events } = body;

        if (!sessionId || !Array.isArray(events)) {
          return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        analytics.recordEvents(sessionId, events);

        return new Response(JSON.stringify({ 
          status: 'events recorded',
          count: events.length,
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to record events' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // POST /api/feedback - Submit user feedback
    if (path === '/api/feedback' && request.method === 'POST') {
      try {
        const body = await request.json();
        
        analytics.recordFeedback({
          type: body.type || 'general',
          rating: body.rating || null,
          message: body.message || '',
          stateCode: body.stateCode || null,
          email: body.email || null,
          timestamp: body.timestamp || new Date().toISOString(),
          userAgent: body.userAgent || '',
          url: body.url || '',
        });

        return new Response(JSON.stringify({ 
          status: 'feedback recorded',
          timestamp: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to record feedback' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/analytics/summary - Get analytics summary (internal)
    if (path === '/api/analytics/summary' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : null;
      
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const windowMs = parseInt(url.searchParams.get('window') || '86400000'); // Default 24 hours
      const summary = analytics.getAnalyticsSummary(windowMs);

      return new Response(JSON.stringify(summary), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/analytics/engagement - Get engagement metrics (internal)
    if (path === '/api/analytics/engagement' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : null;
      
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const windowMs = parseInt(url.searchParams.get('window') || '86400000');
      const metrics = analytics.getEngagementMetrics(windowMs);

      return new Response(JSON.stringify(metrics), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/analytics/feedback - Get feedback summary (internal)
    if (path === '/api/analytics/feedback' && request.method === 'GET') {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader ? authHeader.replace('Bearer ', '') : null;

      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const windowMs = parseInt(url.searchParams.get('window') || '86400000');
      const summary = analytics.getFeedbackSummary(windowMs);

      return new Response(JSON.stringify(summary), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/solar-companies - Find solar companies near a zip code
    if (path === '/api/solar-companies' && request.method === 'GET') {
      const zip = url.searchParams.get('zip');
      const state = url.searchParams.get('state');

      // Validate zip code
      if (!zip || !zip.match(/^\d{5}$/)) {
        return new Response(JSON.stringify({
          error: 'Invalid zip code. Must be a 5-digit US zip code.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Check cache first
      const cacheKey = `solar-companies-${zip}`;
      const cached = solarCompaniesCache.get(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders, ...getCacheHeaders(true) },
        });
      }

      // Check daily rate limit
      if (!checkDailyRateLimit()) {
        throw new RateLimitError('Daily API request limit exceeded. Please try again tomorrow.');
      }

      // Increment request counter
      dailyRequestCount++;

      try {
        // Call Google Places Text Search API
        const searchQuery = `solar panel installation companies near ${zip}`;
        const results = await callGooglePlacesTextSearch(searchQuery);

        if (!results || results.length === 0) {
          return new Response(JSON.stringify({
            companies: [],
            resultCount: 0,
            searchedZip: zip,
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders, ...getCacheHeaders(false) },
          });
        }

        // Map top 10 results to clean objects
        const companies = results.slice(0, 10).map(place => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || null,
          reviewCount: place.user_ratings_total || 0,
          businessStatus: place.business_status || 'UNKNOWN',
          placeId: place.place_id,
          phone: null,
          website: null,
        }));

        // Fetch Place Details for top 5 results (phone and website)
        const topFive = companies.slice(0, 5);
        const detailsPromises = topFive.map(async (company) => {
          const details = await callGooglePlaceDetails(company.placeId);
          if (details) {
            company.phone = details.phone || null;
            company.website = details.website || null;
          }
        });

        await Promise.all(detailsPromises);

        const response = {
          companies: companies,
          resultCount: companies.length,
          searchedZip: zip,
        };

        // Cache result for 7 days
        solarCompaniesCache.set(cacheKey, response);

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders, ...getCacheHeaders(false) },
        });
      } catch (error) {
        console.error('Solar companies API error:', error);

        if (error instanceof RateLimitError) {
          throw error;
        }

        if (error instanceof TimeoutError || error instanceof ExternalServiceError) {
          throw error;
        }

        throw new ExternalServiceError('Failed to fetch solar companies');
      }
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('API error:', error);
    
    const errorResponse = formatErrorResponse(error);
    const statusCode = errorResponse.statusCode;
    
    return new Response(JSON.stringify(errorResponse.error), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export default {
  fetch: handleRequest,
};
