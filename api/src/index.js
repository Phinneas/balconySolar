/**
 * Balcony Solar Checker REST API
 * Cloudflare Workers
 */

import CacheManager from './cache.js';
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

const TABLE_IDS = {
  states: 'tbl9JsNibYgkgi7iEVW',
  details: 'tbl2QU2ySxGNHLhNstq',
  resources: 'tblGYUmWEMeTg4oBTY3',
  updateLog: 'tblNAUNfKxO4Wi0SJ1A',
};

// Cache manager with 24-hour TTL
const cache = new CacheManager(24 * 60 * 60 * 1000);
const CACHE_TTL_SECONDS = 24 * 60 * 60;

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
  const states = response.records.map(record => ({
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
  const statesResponse = await fetchFromTeable(TABLE_IDS.states, `?filter=code="${code}"`);
  
  if (!statesResponse.records || statesResponse.records.length === 0) {
    return { data: null, fromCache: false };
  }

  const stateRecord = statesResponse.records[0];
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
  const detailsResponse = await fetchFromTeable(TABLE_IDS.details, `?filter=stateCode="${code}"`);
  if (detailsResponse.records) {
    detailsResponse.records.forEach(record => {
      const category = record.fields.category;
      state.details[category] = {
        required: record.fields.required,
        description: record.fields.description,
      };
    });
  }

  // Fetch resources
  const resourcesResponse = await fetchFromTeable(TABLE_IDS.resources, `?filter=stateCode="${code}"`);
  if (resourcesResponse.records) {
    state.resources = resourcesResponse.records.map(record => ({
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

    // POST /api/cache-invalidate - Invalidate cache (internal)
    if (path === '/api/cache-invalidate' && request.method === 'POST') {
      const body = await request.json();
      const pattern = body.pattern || null;
      cache.invalidate(pattern);
      
      return new Response(JSON.stringify({ 
        status: 'cache invalidated',
        pattern: pattern,
      }), {
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
