/**
 * Monitoring and Alerting for Balcony Solar Checker API
 * Tracks API performance, uptime, cache metrics, and error rates
 */

class MonitoringService {
  constructor(options = {}) {
    this.metrics = {
      requests: [],
      errors: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      requestCount: 0,
    };

    this.alerts = [];
    this.alertThresholds = {
      responseTimeMs: options.responseTimeThreshold || 500,
      errorRatePercent: options.errorRateThreshold || 5,
      cacheHitRatePercent: options.cacheHitRateThreshold || 50,
    };

    this.alertHandlers = [];
  }

  /**
   * Record an API request
   * @param {string} endpoint - API endpoint
   * @param {number} responseTimeMs - Response time in milliseconds
   * @param {number} statusCode - HTTP status code
   * @param {boolean} fromCache - Whether response was from cache
   */
  recordRequest(endpoint, responseTimeMs, statusCode, fromCache = false) {
    const request = {
      endpoint,
      responseTimeMs,
      statusCode,
      fromCache,
      timestamp: Date.now(),
      isError: statusCode >= 400,
    };

    this.metrics.requests.push(request);
    this.metrics.totalResponseTime += responseTimeMs;
    this.metrics.requestCount++;

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Check for alerts
    this.checkAlerts(request);

    // Keep only last 1000 requests in memory
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }
  }

  /**
   * Record an error
   * @param {string} endpoint - API endpoint
   * @param {Error} error - Error object
   * @param {string} errorType - Type of error (TIMEOUT, NETWORK, etc.)
   */
  recordError(endpoint, error, errorType = 'UNKNOWN') {
    const errorRecord = {
      endpoint,
      message: error.message,
      errorType,
      timestamp: Date.now(),
      stack: error.stack,
    };

    this.metrics.errors.push(errorRecord);

    // Keep only last 100 errors in memory
    if (this.metrics.errors.length > 100) {
      this.metrics.errors.shift();
    }

    // Trigger error alert
    this.triggerAlert('error', {
      endpoint,
      errorType,
      message: error.message,
    });
  }

  /**
   * Check if current metrics trigger any alerts
   * @param {object} request - Request record
   */
  checkAlerts(request) {
    // Check response time threshold
    if (request.responseTimeMs > this.alertThresholds.responseTimeMs) {
      this.triggerAlert('slow_response', {
        endpoint: request.endpoint,
        responseTimeMs: request.responseTimeMs,
        threshold: this.alertThresholds.responseTimeMs,
      });
    }

    // Check error rate
    const errorRate = this.getErrorRate();
    if (errorRate > this.alertThresholds.errorRatePercent) {
      this.triggerAlert('high_error_rate', {
        errorRate: errorRate.toFixed(2),
        threshold: this.alertThresholds.errorRatePercent,
      });
    }

    // Check cache hit rate
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < this.alertThresholds.cacheHitRatePercent && this.metrics.requestCount > 10) {
      this.triggerAlert('low_cache_hit_rate', {
        cacheHitRate: cacheHitRate.toFixed(2),
        threshold: this.alertThresholds.cacheHitRatePercent,
      });
    }
  }

  /**
   * Trigger an alert
   * @param {string} alertType - Type of alert
   * @param {object} details - Alert details
   */
  triggerAlert(alertType, details) {
    const alert = {
      type: alertType,
      details,
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts in memory
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Call registered alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }

  /**
   * Register an alert handler
   * @param {function} handler - Function to call when alert is triggered
   */
  onAlert(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get average response time
   * @returns {number} Average response time in milliseconds
   */
  getAverageResponseTime() {
    if (this.metrics.requestCount === 0) return 0;
    return this.metrics.totalResponseTime / this.metrics.requestCount;
  }

  /**
   * Get error rate
   * @returns {number} Error rate as percentage (0-100)
   */
  getErrorRate() {
    if (this.metrics.requestCount === 0) return 0;
    const errorCount = this.metrics.requests.filter(r => r.isError).length;
    return (errorCount / this.metrics.requestCount) * 100;
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate as percentage (0-100)
   */
  getCacheHitRate() {
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalCacheRequests === 0) return 0;
    return (this.metrics.cacheHits / totalCacheRequests) * 100;
  }

  /**
   * Get uptime percentage
   * @param {number} windowMs - Time window in milliseconds (default: 1 hour)
   * @returns {number} Uptime percentage (0-100)
   */
  getUptime(windowMs = 60 * 60 * 1000) {
    const now = Date.now();
    const recentRequests = this.metrics.requests.filter(r => now - r.timestamp < windowMs);

    if (recentRequests.length === 0) return 100;

    const successfulRequests = recentRequests.filter(r => !r.isError).length;
    return (successfulRequests / recentRequests.length) * 100;
  }

  /**
   * Get metrics summary
   * @returns {object} Metrics summary
   */
  getMetrics() {
    return {
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errors.length,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRate: this.getCacheHitRate().toFixed(2),
      averageResponseTime: this.getAverageResponseTime().toFixed(2),
      errorRate: this.getErrorRate().toFixed(2),
      uptime: this.getUptime().toFixed(2),
      recentAlerts: this.alerts.slice(-10),
    };
  }

  /**
   * Get recent requests
   * @param {number} limit - Number of recent requests to return
   * @returns {array} Recent requests
   */
  getRecentRequests(limit = 10) {
    return this.metrics.requests.slice(-limit);
  }

  /**
   * Get recent errors
   * @param {number} limit - Number of recent errors to return
   * @returns {array} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.metrics.errors.slice(-limit);
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: [],
      errors: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0,
      requestCount: 0,
    };
    this.alerts = [];
  }
}

export default MonitoringService;
