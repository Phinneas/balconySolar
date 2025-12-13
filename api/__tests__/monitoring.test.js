/**
 * Tests for API Monitoring Service
 * Feature: balcony-solar-checker, Property 6: API Response Time
 * Validates: Requirements 1.4
 */

import { jest } from '@jest/globals';
import MonitoringService from '../src/monitoring.js';

describe('MonitoringService', () => {
  let monitoring;

  beforeEach(() => {
    monitoring = new MonitoringService({
      responseTimeThreshold: 500,
      errorRateThreshold: 5,
      cacheHitRateThreshold: 50,
    });
  });

  describe('Request Recording', () => {
    test('records API requests with metrics', () => {
      monitoring.recordRequest('/api/states', 100, 200, true);
      
      const metrics = monitoring.getMetrics();
      expect(metrics.requestCount).toBe(1);
      expect(metrics.cacheHits).toBe(1);
    });

    test('tracks response time', () => {
      monitoring.recordRequest('/api/states', 150, 200, false);
      monitoring.recordRequest('/api/states/ca', 250, 200, false);
      
      const avgTime = monitoring.getAverageResponseTime();
      expect(avgTime).toBe(200);
    });

    test('distinguishes cache hits from misses', () => {
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, false);
      
      const metrics = monitoring.getMetrics();
      expect(metrics.cacheHits).toBe(2);
      expect(metrics.cacheMisses).toBe(1);
    });

    test('tracks error status codes', () => {
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states/xx', 100, 404, false);
      monitoring.recordRequest('/api/states', 100, 500, false);
      
      const metrics = monitoring.getMetrics();
      expect(parseFloat(metrics.errorRate)).toBeGreaterThan(0);
    });

    test('maintains request history limit', () => {
      // Record 1100 requests
      for (let i = 0; i < 1100; i++) {
        monitoring.recordRequest('/api/states', 100, 200, false);
      }
      
      const recent = monitoring.getRecentRequests(1100);
      expect(recent.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Recording', () => {
    test('records errors with details', () => {
      const error = new Error('Connection timeout');
      monitoring.recordError('/api/states', error, 'TIMEOUT');
      
      const recentErrors = monitoring.getRecentErrors(1);
      expect(recentErrors.length).toBe(1);
      expect(recentErrors[0].message).toBe('Connection timeout');
      expect(recentErrors[0].errorType).toBe('TIMEOUT');
    });

    test('maintains error history limit', () => {
      for (let i = 0; i < 150; i++) {
        const error = new Error(`Error ${i}`);
        monitoring.recordError('/api/states', error, 'NETWORK');
      }
      
      const recentErrors = monitoring.getRecentErrors(150);
      expect(recentErrors.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Metrics Calculation', () => {
    test('calculates average response time', () => {
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 200, 200, false);
      monitoring.recordRequest('/api/states', 300, 200, false);
      
      const avgTime = monitoring.getAverageResponseTime();
      expect(avgTime).toBe(200);
    });

    test('calculates error rate', () => {
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 404, false);
      monitoring.recordRequest('/api/states', 100, 500, false);
      
      const errorRate = monitoring.getErrorRate();
      expect(errorRate).toBe(50); // 2 errors out of 4 requests
    });

    test('calculates cache hit rate', () => {
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 200, false);
      
      const hitRate = monitoring.getCacheHitRate();
      expect(hitRate).toBe(50); // 2 hits out of 4 cache requests
    });

    test('calculates uptime percentage', () => {
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 500, false);
      
      const uptime = monitoring.getUptime();
      expect(uptime).toBeCloseTo(66.67, 1); // 2 successful out of 3
    });

    test('returns 100% uptime when no requests', () => {
      const uptime = monitoring.getUptime();
      expect(uptime).toBe(100);
    });
  });

  describe('Alert Triggering', () => {
    test('triggers alert on slow response', () => {
      let alertTriggered = false;
      monitoring.onAlert((alert) => {
        if (alert.type === 'slow_response') {
          alertTriggered = true;
          expect(alert.details.responseTimeMs).toBeGreaterThan(500);
        }
      });

      monitoring.recordRequest('/api/states', 600, 200, false);
      expect(alertTriggered).toBe(true);
    });

    test('triggers alert on high error rate', () => {
      let alertTriggered = false;
      monitoring.onAlert((alert) => {
        if (alert.type === 'high_error_rate') {
          alertTriggered = true;
          expect(alert.details.errorRate).toBeGreaterThan(5);
        }
      });

      // Create high error rate (all errors)
      for (let i = 0; i < 10; i++) {
        monitoring.recordRequest('/api/states', 100, 500, false);
      }
      
      expect(alertTriggered).toBe(true);
    });

    test('triggers alert on low cache hit rate', () => {
      let alertTriggered = false;
      monitoring.onAlert((alert) => {
        if (alert.type === 'low_cache_hit_rate') {
          alertTriggered = true;
          expect(alert.details.cacheHitRate).toBeLessThan(50);
        }
      });

      // Create low cache hit rate (all misses)
      for (let i = 0; i < 15; i++) {
        monitoring.recordRequest('/api/states', 100, 200, false);
      }
      
      expect(alertTriggered).toBe(true);
    });

    test('handles multiple alert handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      monitoring.onAlert(handler1);
      monitoring.onAlert(handler2);

      monitoring.recordRequest('/api/states', 600, 200, false);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    test('continues on alert handler error', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = jest.fn();

      monitoring.onAlert(errorHandler);
      monitoring.onAlert(successHandler);

      monitoring.recordRequest('/api/states', 600, 200, false);

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('Metrics Summary', () => {
    test('returns complete metrics summary', () => {
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 200, 200, false);
      monitoring.recordRequest('/api/states', 300, 500, false);

      const metrics = monitoring.getMetrics();

      expect(metrics).toHaveProperty('requestCount');
      expect(metrics).toHaveProperty('errorCount');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('recentAlerts');
    });
  });

  describe('Recent Data Access', () => {
    test('returns recent requests', () => {
      for (let i = 0; i < 20; i++) {
        monitoring.recordRequest('/api/states', 100, 200, false);
      }

      const recent = monitoring.getRecentRequests(5);
      expect(recent.length).toBe(5);
    });

    test('returns recent errors', () => {
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Error ${i}`);
        monitoring.recordError('/api/states', error, 'NETWORK');
      }

      const recent = monitoring.getRecentErrors(3);
      expect(recent.length).toBe(3);
    });
  });

  describe('Reset', () => {
    test('resets all metrics', () => {
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 500, false);

      monitoring.reset();

      const metrics = monitoring.getMetrics();
      expect(metrics.requestCount).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.cacheHits).toBe(0);
    });
  });

  describe('Property 6: API Response Time', () => {
    test('response time is tracked and averaged correctly', () => {
      const responseTimes = [100, 150, 200, 250, 300];
      
      responseTimes.forEach(time => {
        monitoring.recordRequest('/api/states', time, 200, false);
      });

      const avgTime = monitoring.getAverageResponseTime();
      const expectedAvg = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      
      expect(avgTime).toBe(expectedAvg);
    });

    test('cached responses are tracked separately', () => {
      monitoring.recordRequest('/api/states', 50, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 150, 200, false);

      const metrics = monitoring.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(2);
    });

    test('slow responses trigger alerts', () => {
      let slowResponseAlertTriggered = false;

      monitoring.onAlert((alert) => {
        if (alert.type === 'slow_response') {
          slowResponseAlertTriggered = true;
          expect(alert.details.responseTimeMs).toBeGreaterThan(500);
        }
      });

      monitoring.recordRequest('/api/states', 600, 200, false);
      expect(slowResponseAlertTriggered).toBe(true);
    });

    test('response time threshold is configurable', () => {
      const customMonitoring = new MonitoringService({
        responseTimeThreshold: 1000,
      });

      let alertTriggered = false;
      customMonitoring.onAlert((alert) => {
        if (alert.type === 'slow_response') {
          alertTriggered = true;
        }
      });

      customMonitoring.recordRequest('/api/states', 600, 200, false);
      expect(alertTriggered).toBe(false);

      customMonitoring.recordRequest('/api/states', 1100, 200, false);
      expect(alertTriggered).toBe(true);
    });
  });

  describe('Property 7: Data Freshness', () => {
    test('tracks request timestamps for freshness validation', () => {
      const before = Date.now();
      monitoring.recordRequest('/api/states', 100, 200, false);
      const after = Date.now();

      const recent = monitoring.getRecentRequests(1);
      expect(recent[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(recent[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Property 8: Cache Invalidation', () => {
    test('cache hit rate reflects invalidation', () => {
      // Initial cache hits
      monitoring.recordRequest('/api/states', 100, 200, true);
      monitoring.recordRequest('/api/states', 100, 200, true);

      let hitRate = monitoring.getCacheHitRate();
      expect(hitRate).toBe(100);

      // After invalidation, cache misses increase
      monitoring.recordRequest('/api/states', 100, 200, false);
      monitoring.recordRequest('/api/states', 100, 200, false);

      hitRate = monitoring.getCacheHitRate();
      expect(hitRate).toBe(50);
    });
  });
});
