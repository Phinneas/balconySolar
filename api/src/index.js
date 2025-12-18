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
    .filter(record => record.fields.code && record.fields.name) // Filter out empty/incomplete records
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
