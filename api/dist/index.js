var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/cache.js
var CacheManager = class {
  constructor(ttlMs = 24 * 60 * 60 * 1e3) {
    this.store = /* @__PURE__ */ new Map();
    this.ttl = ttlMs;
  }
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/missing
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }
  /**
   * Delete a specific key
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
  }
  /**
   * Invalidate cache by pattern
   * @param {string|null} pattern - Pattern to match keys (null = clear all)
   */
  invalidate(pattern = null) {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }
  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    let totalSize = 0;
    let expiredCount = 0;
    for (const [key, entry] of this.store.entries()) {
      if (Date.now() - entry.timestamp > this.ttl) {
        expiredCount++;
      }
      totalSize += JSON.stringify(entry.value).length;
    }
    return {
      size: this.store.size,
      expiredCount,
      totalSizeBytes: totalSize,
      ttlMs: this.ttl
    };
  }
  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
};
__name(CacheManager, "CacheManager");
var cache_default = CacheManager;

// src/analytics.js
var AnalyticsService = class {
  constructor(options = {}) {
    this.events = [];
    this.feedback = [];
    this.sessions = /* @__PURE__ */ new Map();
    this.maxEventsInMemory = options.maxEventsInMemory || 1e4;
    this.maxFeedbackInMemory = options.maxFeedbackInMemory || 1e3;
  }
  /**
   * Record analytics events
   * @param {string} sessionId - Session ID
   * @param {array} events - Array of events
   */
  recordEvents(sessionId, events) {
    if (!Array.isArray(events)) {
      throw new Error("Events must be an array");
    }
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        startTime: Date.now(),
        eventCount: 0,
        lastEventTime: Date.now()
      });
    }
    const session = this.sessions.get(sessionId);
    session.eventCount += events.length;
    session.lastEventTime = Date.now();
    this.events.push(...events);
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }
  }
  /**
   * Record user feedback
   * @param {object} feedback - Feedback object
   */
  recordFeedback(feedback) {
    const feedbackRecord = {
      ...feedback,
      recordedAt: Date.now()
    };
    this.feedback.push(feedbackRecord);
    if (this.feedback.length > this.maxFeedbackInMemory) {
      this.feedback = this.feedback.slice(-this.maxFeedbackInMemory);
    }
  }
  /**
   * Get analytics summary
   * @param {number} windowMs - Time window in milliseconds (default: 24 hours)
   * @returns {object} Analytics summary
   */
  getAnalyticsSummary(windowMs = 24 * 60 * 60 * 1e3) {
    const now = Date.now();
    const recentEvents = this.events.filter((e) => now - e.timestamp < windowMs);
    const recentFeedback = this.feedback.filter((f) => now - f.recordedAt < windowMs);
    const eventTypeCounts = {};
    recentEvents.forEach((event) => {
      eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;
    });
    const feedbackTypeCounts = {};
    recentFeedback.forEach((feedback) => {
      feedbackTypeCounts[feedback.type] = (feedbackTypeCounts[feedback.type] || 0) + 1;
    });
    const stateViews = {};
    recentEvents.filter((e) => e.type === "view_state" && e.data.stateCode).forEach((event) => {
      stateViews[event.data.stateCode] = (stateViews[event.data.stateCode] || 0) + 1;
    });
    const topStates = Object.entries(stateViews).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, count]) => ({ code, count }));
    const ratings = recentFeedback.filter((f) => f.type === "rating" && f.rating).map((f) => f.rating);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : null;
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => now - s.lastEventTime < windowMs
    );
    return {
      timeWindow: `${windowMs / (1e3 * 60 * 60)} hours`,
      totalEvents: recentEvents.length,
      totalSessions: activeSessions.length,
      totalFeedback: recentFeedback.length,
      eventTypes: eventTypeCounts,
      feedbackTypes: feedbackTypeCounts,
      topStates,
      averageRating: averageRating ? averageRating.toFixed(2) : null,
      activeSessions: activeSessions.length
    };
  }
  /**
   * Get engagement metrics
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Engagement metrics
   */
  getEngagementMetrics(windowMs = 24 * 60 * 60 * 1e3) {
    const now = Date.now();
    const recentEvents = this.events.filter((e) => now - e.timestamp < windowMs);
    const uniqueSessions = new Set(recentEvents.map((e) => e.sessionId)).size;
    const interactions = {
      stateSelections: recentEvents.filter((e) => e.type === "select_state").length,
      stateViews: recentEvents.filter((e) => e.type === "view_state").length,
      linkCopies: recentEvents.filter((e) => e.type === "copy_link").length,
      resourceClicks: recentEvents.filter((e) => e.type === "click_resource").length,
      newsletterClicks: recentEvents.filter((e) => e.type === "click_newsletter_cta").length,
      relatedContentClicks: recentEvents.filter((e) => e.type === "click_related_content").length,
      errors: recentEvents.filter((e) => e.type === "error").length
    };
    const conversionRates = {
      viewToShare: interactions.stateViews > 0 ? (interactions.linkCopies / interactions.stateViews * 100).toFixed(2) : 0,
      viewToNewsletter: interactions.stateViews > 0 ? (interactions.newsletterClicks / interactions.stateViews * 100).toFixed(2) : 0,
      viewToRelatedContent: interactions.stateViews > 0 ? (interactions.relatedContentClicks / interactions.stateViews * 100).toFixed(2) : 0
    };
    return {
      uniqueSessions,
      totalInteractions: recentEvents.length,
      interactions,
      conversionRates
    };
  }
  /**
   * Get feedback summary
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} Feedback summary
   */
  getFeedbackSummary(windowMs = 24 * 60 * 60 * 1e3) {
    const now = Date.now();
    const recentFeedback = this.feedback.filter((f) => now - f.recordedAt < windowMs);
    const summary = {
      totalFeedback: recentFeedback.length,
      byType: {},
      ratings: {
        average: null,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      suggestions: [],
      bugReports: []
    };
    recentFeedback.forEach((feedback) => {
      summary.byType[feedback.type] = (summary.byType[feedback.type] || 0) + 1;
      if (feedback.type === "rating" && feedback.rating) {
        summary.ratings.distribution[feedback.rating]++;
      }
      if (feedback.type === "suggestion" && feedback.message) {
        summary.suggestions.push({
          message: feedback.message,
          stateCode: feedback.stateCode,
          timestamp: feedback.timestamp
        });
      }
      if (feedback.type === "bug_report" && feedback.message) {
        summary.bugReports.push({
          message: feedback.message,
          stateCode: feedback.stateCode,
          email: feedback.email,
          timestamp: feedback.timestamp
        });
      }
    });
    const ratings = recentFeedback.filter((f) => f.type === "rating" && f.rating).map((f) => f.rating);
    if (ratings.length > 0) {
      summary.ratings.average = (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(2);
    }
    return summary;
  }
  /**
   * Get recent events
   * @param {number} limit - Number of recent events to return
   * @returns {array} Recent events
   */
  getRecentEvents(limit = 100) {
    return this.events.slice(-limit);
  }
  /**
   * Get recent feedback
   * @param {number} limit - Number of recent feedback to return
   * @returns {array} Recent feedback
   */
  getRecentFeedback(limit = 50) {
    return this.feedback.slice(-limit);
  }
  /**
   * Get session info
   * @param {string} sessionId - Session ID
   * @returns {object|null} Session info or null
   */
  getSessionInfo(sessionId) {
    return this.sessions.get(sessionId) || null;
  }
  /**
   * Get all active sessions
   * @param {number} windowMs - Time window for active sessions
   * @returns {array} Active sessions
   */
  getActiveSessions(windowMs = 60 * 60 * 1e3) {
    const now = Date.now();
    return Array.from(this.sessions.values()).filter(
      (s) => now - s.lastEventTime < windowMs
    );
  }
  /**
   * Reset analytics data
   */
  reset() {
    this.events = [];
    this.feedback = [];
    this.sessions.clear();
  }
};
__name(AnalyticsService, "AnalyticsService");
var analytics_default = AnalyticsService;

// src/errors.js
var APIError = class extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = "APIError";
  }
};
__name(APIError, "APIError");
var NotFoundError = class extends APIError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
};
__name(NotFoundError, "NotFoundError");
var TimeoutError = class extends APIError {
  constructor(message = "Request timeout") {
    super(message, 504, "TIMEOUT");
    this.name = "TimeoutError";
  }
};
__name(TimeoutError, "TimeoutError");
var ExternalServiceError = class extends APIError {
  constructor(message = "External service error", statusCode = 502) {
    super(message, statusCode, "EXTERNAL_SERVICE_ERROR");
    this.name = "ExternalServiceError";
  }
};
__name(ExternalServiceError, "ExternalServiceError");
function formatErrorResponse(error) {
  if (error instanceof APIError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      },
      statusCode: error.statusCode
    };
  }
  return {
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500
    },
    statusCode: 500
  };
}
__name(formatErrorResponse, "formatErrorResponse");

// src/index.js
var TEABLE_API_URL = "https://app.teable.ai/api";
var TEABLE_API_TOKEN = "teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=";
var CACHE_INVALIDATE_TOKEN = "cache_invalidate_token_secret_key_12345";
var TABLE_IDS = {
  states: "tbl9JsNibYgkgi7iEVW",
  details: "tbl2QU2ySxGNHLhNstq",
  resources: "tblGYUmWEMeTg4oBTY3",
  updateLog: "tblNAUNfKxO4Wi0SJ1A"
};
var cache = new cache_default(24 * 60 * 60 * 1e3);
var CACHE_TTL_SECONDS = 24 * 60 * 60;
var analytics = new analytics_default({
  maxEventsInMemory: 1e4,
  maxFeedbackInMemory: 1e3
});
async function fetchFromTeable(tableId, query = "") {
  const url = `${TEABLE_API_URL}/table/${tableId}/record${query}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5e3);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${TEABLE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError("Resource not found in Teable");
      }
      throw new ExternalServiceError(`Teable API error: ${response.status}`, response.status);
    }
    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new TimeoutError("Teable API request timeout (>5s)");
    }
    if (error instanceof APIError) {
      throw error;
    }
    throw new ExternalServiceError(`Failed to fetch from Teable: ${error.message}`);
  }
}
__name(fetchFromTeable, "fetchFromTeable");
async function getAllStates() {
  const cacheKey = "all-states";
  const cached = cache.get(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }
  const response = await fetchFromTeable(TABLE_IDS.states);
  const states = response.records.map((record) => ({
    code: record.fields.code,
    name: record.fields.name,
    abbreviation: record.fields.abbreviation,
    isLegal: record.fields.isLegal,
    maxWattage: record.fields.maxWattage,
    keyLaw: record.fields.keyLaw,
    lastUpdated: record.fields.lastUpdated
  }));
  cache.set(cacheKey, states);
  return { data: states, fromCache: false };
}
__name(getAllStates, "getAllStates");
async function getStateByCode(code) {
  const cacheKey = `state-${code}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }
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
    resources: []
  };
  const detailsResponse = await fetchFromTeable(TABLE_IDS.details, `?filter=stateCode="${code}"`);
  if (detailsResponse.records) {
    detailsResponse.records.forEach((record) => {
      const category = record.fields.category;
      state.details[category] = {
        required: record.fields.required,
        description: record.fields.description
      };
    });
  }
  const resourcesResponse = await fetchFromTeable(TABLE_IDS.resources, `?filter=stateCode="${code}"`);
  if (resourcesResponse.records) {
    state.resources = resourcesResponse.records.map((record) => ({
      title: record.fields.title,
      url: record.fields.url,
      resourceType: record.fields.resourceType
    }));
  }
  cache.set(cacheKey, state);
  return { data: state, fromCache: false };
}
__name(getStateByCode, "getStateByCode");
function getCacheHeaders(fromCache = false) {
  if (fromCache) {
    return {
      "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      "X-Cache": "HIT"
    };
  }
  return {
    "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
    "X-Cache": "MISS"
  };
}
__name(getCacheHeaders, "getCacheHeaders");
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (path === "/api/states" && request.method === "GET") {
      const result = await getAllStates();
      const cacheHeaders = getCacheHeaders(result.fromCache);
      return new Response(JSON.stringify({ states: result.data }), {
        headers: { "Content-Type": "application/json", ...corsHeaders, ...cacheHeaders }
      });
    }
    if (path.match(/^\/api\/states\/[a-z]{2}$/) && request.method === "GET") {
      const code = path.split("/")[3];
      const result = await getStateByCode(code);
      if (!result.data) {
        return new Response(JSON.stringify({ error: "State not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const cacheHeaders = getCacheHeaders(result.fromCache);
      return new Response(JSON.stringify({ state: result.data }), {
        headers: { "Content-Type": "application/json", ...corsHeaders, ...cacheHeaders }
      });
    }
    if (path === "/api/health" && request.method === "GET") {
      const stats = cache.getStats();
      return new Response(JSON.stringify({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cache: stats
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/cache-invalidate" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const body = await request.json();
      const pattern = body.pattern || null;
      cache.invalidate(pattern);
      return new Response(JSON.stringify({
        status: "cache invalidated",
        pattern,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/analytics/events" && request.method === "POST") {
      try {
        const body = await request.json();
        const { sessionId, events } = body;
        if (!sessionId || !Array.isArray(events)) {
          return new Response(JSON.stringify({ error: "Invalid request body" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        analytics.recordEvents(sessionId, events);
        return new Response(JSON.stringify({
          status: "events recorded",
          count: events.length,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to record events" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (path === "/api/feedback" && request.method === "POST") {
      try {
        const body = await request.json();
        analytics.recordFeedback({
          type: body.type || "general",
          rating: body.rating || null,
          message: body.message || "",
          stateCode: body.stateCode || null,
          email: body.email || null,
          timestamp: body.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
          userAgent: body.userAgent || "",
          url: body.url || ""
        });
        return new Response(JSON.stringify({
          status: "feedback recorded",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to record feedback" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (path === "/api/analytics/summary" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const windowMs = parseInt(url.searchParams.get("window") || "86400000");
      const summary = analytics.getAnalyticsSummary(windowMs);
      return new Response(JSON.stringify(summary), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/analytics/engagement" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const windowMs = parseInt(url.searchParams.get("window") || "86400000");
      const metrics = analytics.getEngagementMetrics(windowMs);
      return new Response(JSON.stringify(metrics), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/analytics/feedback" && request.method === "GET") {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader ? authHeader.replace("Bearer ", "") : null;
      if (!token || token !== CACHE_INVALIDATE_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const windowMs = parseInt(url.searchParams.get("window") || "86400000");
      const summary = analytics.getFeedbackSummary(windowMs);
      return new Response(JSON.stringify(summary), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("API error:", error);
    const errorResponse = formatErrorResponse(error);
    const statusCode = errorResponse.statusCode;
    return new Response(JSON.stringify(errorResponse.error), {
      status: statusCode,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleRequest, "handleRequest");
var src_default = {
  fetch: handleRequest
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
