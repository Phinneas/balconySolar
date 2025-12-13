/**
 * Tests for Cron Monitoring Service
 * Feature: balcony-solar-checker, Property 7: Data Freshness
 * Validates: Requirements 5.1, 5.2
 */

import CronMonitoringService from '../src/cron-monitoring.js';

describe('CronMonitoringService', () => {
  let monitoring;

  beforeEach(() => {
    monitoring = new CronMonitoringService({
      executionTimeThreshold: 30000,
      errorCountThreshold: 5,
      errorRateThreshold: 10,
      maxTimeSinceLastRun: 24 * 60 * 60 * 1000,
    });
  });

  describe('Job Recording', () => {
    test('records job execution with all metrics', () => {
      const jobResult = {
        jobId: 'scraper-2024-01-08T02:00:00Z',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 2,
        statesVerified: 49,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      };

      monitoring.recordJobExecution(jobResult);

      const stats = monitoring.getJobStats();
      expect(stats.totalRuns).toBe(1);
      expect(stats.successfulRuns).toBe(1);
    });

    test('tracks last successful run timestamp', () => {
      const jobResult = {
        jobId: 'scraper-1',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      };

      monitoring.recordJobExecution(jobResult);

      expect(monitoring.lastSuccessfulRun).not.toBeNull();
      expect(monitoring.lastSuccessfulRun).toBeGreaterThan(0);
    });

    test('maintains job history limit', () => {
      for (let i = 0; i < 150; i++) {
        const jobResult = {
          jobId: `scraper-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: 5000,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: 0,
          updateErrors: 0,
          totalErrors: 0,
          cacheInvalidated: true,
          status: 'success',
        };

        monitoring.recordJobExecution(jobResult);
      }

      const recent = monitoring.getRecentJobs(150);
      expect(recent.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Job Statistics', () => {
    test('calculates success rate', () => {
      for (let i = 0; i < 3; i++) {
        monitoring.recordJobExecution({
          jobId: `scraper-success-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: 5000,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: 0,
          updateErrors: 0,
          totalErrors: 0,
          cacheInvalidated: true,
          status: 'success',
        });
      }

      for (let i = 0; i < 1; i++) {
        monitoring.recordJobExecution({
          jobId: `scraper-failure-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: 5000,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: 0,
          updateErrors: 5,
          totalErrors: 5,
          cacheInvalidated: false,
          status: 'failure',
        });
      }

      const stats = monitoring.getJobStats();
      expect(stats.successfulRuns).toBe(3);
      expect(stats.failedRuns).toBe(1);
      expect(parseFloat(stats.successRate)).toBe(75);
    });

    test('calculates average execution time', () => {
      const times = [5000, 10000, 15000];

      times.forEach((time, i) => {
        monitoring.recordJobExecution({
          jobId: `scraper-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: time,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: 0,
          updateErrors: 0,
          totalErrors: 0,
          cacheInvalidated: true,
          status: 'success',
        });
      });

      const stats = monitoring.getJobStats();
      const expectedAvg = times.reduce((a, b) => a + b) / times.length;
      expect(parseFloat(stats.averageExecutionTime)).toBe(expectedAvg);
    });

    test('calculates average error count', () => {
      const errorCounts = [0, 2, 5];

      errorCounts.forEach((errors, i) => {
        monitoring.recordJobExecution({
          jobId: `scraper-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: 5000,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: errors,
          updateErrors: 0,
          totalErrors: errors,
          cacheInvalidated: true,
          status: errors > 0 ? 'partial_failure' : 'success',
        });
      });

      const stats = monitoring.getJobStats();
      const expectedAvg = errorCounts.reduce((a, b) => a + b) / errorCounts.length;
      expect(parseFloat(stats.averageErrorCount)).toBeCloseTo(expectedAvg, 1);
    });
  });

  describe('Alert Triggering', () => {
    test('triggers alert on slow execution', (done) => {
      monitoring.onAlert((alert) => {
        if (alert.type === 'slow_execution') {
          expect(alert.details.executionTimeMs).toBeGreaterThan(30000);
          done();
        }
      });

      monitoring.recordJobExecution({
        jobId: 'scraper-slow',
        timestamp: new Date().toISOString(),
        executionTimeMs: 35000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      });
    });

    test('triggers alert on high error count', (done) => {
      monitoring.onAlert((alert) => {
        if (alert.type === 'high_error_count') {
          expect(alert.details.errorCount).toBeGreaterThan(5);
          done();
        }
      });

      monitoring.recordJobExecution({
        jobId: 'scraper-errors',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 3,
        updateErrors: 4,
        totalErrors: 7,
        cacheInvalidated: true,
        status: 'partial_failure',
      });
    });

    test('triggers alert on high error rate', (done) => {
      monitoring.onAlert((alert) => {
        if (alert.type === 'high_error_rate') {
          expect(parseFloat(alert.details.errorRate)).toBeGreaterThan(10);
          done();
        }
      });

      monitoring.recordJobExecution({
        jobId: 'scraper-rate',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 10,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 10,
        scrapeErrors: 2,
        updateErrors: 0,
        totalErrors: 2,
        cacheInvalidated: true,
        status: 'partial_failure',
      });
    });

    test('triggers alert on job failure', (done) => {
      monitoring.onAlert((alert) => {
        if (alert.type === 'job_failure') {
          expect(alert.severity).toBe('critical');
          done();
        }
      });

      monitoring.recordJobExecution({
        jobId: 'scraper-fail',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 10,
        updateErrors: 10,
        totalErrors: 20,
        cacheInvalidated: false,
        status: 'failure',
      });
    });

    test('triggers alert on cache invalidation failure', (done) => {
      monitoring.onAlert((alert) => {
        if (alert.type === 'cache_invalidation_failed') {
          expect(alert.severity).toBe('critical');
          done();
        }
      });

      monitoring.recordJobExecution({
        jobId: 'scraper-cache',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 2,
        statesVerified: 49,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: false,
        status: 'partial_failure',
      });
    });
  });

  describe('Job Overdue Detection', () => {
    test('detects when job is overdue', () => {
      // No successful run yet
      expect(monitoring.isJobOverdue()).toBe(true);

      // Record a successful run
      monitoring.recordJobExecution({
        jobId: 'scraper-1',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      });

      // Should not be overdue immediately
      expect(monitoring.isJobOverdue()).toBe(false);
    });

    test('detects overdue with custom threshold', () => {
      const customMonitoring = new CronMonitoringService({
        maxTimeSinceLastRun: 1000, // 1 second
      });

      customMonitoring.recordJobExecution({
        jobId: 'scraper-1',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      });

      expect(customMonitoring.isJobOverdue()).toBe(false);

      // Wait for threshold to pass
      return new Promise(resolve => {
        setTimeout(() => {
          expect(customMonitoring.isJobOverdue()).toBe(true);
          resolve();
        }, 1100);
      });
    });
  });

  describe('Alert Severity', () => {
    test('assigns correct severity levels', () => {
      expect(monitoring.getAlertSeverity('slow_execution')).toBe('warning');
      expect(monitoring.getAlertSeverity('high_error_count')).toBe('error');
      expect(monitoring.getAlertSeverity('high_error_rate')).toBe('error');
      expect(monitoring.getAlertSeverity('job_failure')).toBe('critical');
      expect(monitoring.getAlertSeverity('cache_invalidation_failed')).toBe('critical');
      expect(monitoring.getAlertSeverity('job_overdue')).toBe('critical');
    });
  });

  describe('Job Lookup', () => {
    test('retrieves job by ID', () => {
      const jobResult = {
        jobId: 'scraper-lookup-test',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      };

      monitoring.recordJobExecution(jobResult);

      const retrieved = monitoring.getJobById('scraper-lookup-test');
      expect(retrieved).not.toBeNull();
      expect(retrieved.jobId).toBe('scraper-lookup-test');
    });

    test('returns null for non-existent job', () => {
      const retrieved = monitoring.getJobById('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Recent Jobs', () => {
    test('returns recent job executions', () => {
      for (let i = 0; i < 20; i++) {
        monitoring.recordJobExecution({
          jobId: `scraper-${i}`,
          timestamp: new Date().toISOString(),
          executionTimeMs: 5000,
          statesProcessed: 51,
          statesCreated: 0,
          statesUpdated: 0,
          statesVerified: 51,
          scrapeErrors: 0,
          updateErrors: 0,
          totalErrors: 0,
          cacheInvalidated: true,
          status: 'success',
        });
      }

      const recent = monitoring.getRecentJobs(5);
      expect(recent.length).toBe(5);
    });
  });

  describe('Reset', () => {
    test('resets all monitoring data', () => {
      monitoring.recordJobExecution({
        jobId: 'scraper-1',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      });

      monitoring.reset();

      const stats = monitoring.getJobStats();
      expect(stats.totalRuns).toBe(0);
      expect(monitoring.lastSuccessfulRun).toBeNull();
    });
  });

  describe('Property 7: Data Freshness', () => {
    test('tracks last successful run for freshness validation', () => {
      const jobResult = {
        jobId: 'scraper-fresh',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 2,
        statesVerified: 49,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      };

      monitoring.recordJobExecution(jobResult);

      const stats = monitoring.getJobStats();
      expect(stats.lastRun).not.toBeNull();
      expect(stats.lastRun.timestamp).toBeDefined();
    });

    test('detects stale data when job is overdue', () => {
      const customMonitoring = new CronMonitoringService({
        maxTimeSinceLastRun: 1000,
      });

      customMonitoring.recordJobExecution({
        jobId: 'scraper-stale',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 0,
        updateErrors: 0,
        totalErrors: 0,
        cacheInvalidated: true,
        status: 'success',
      });

      return new Promise(resolve => {
        setTimeout(() => {
          const stats = customMonitoring.getJobStats();
          expect(stats.isOverdue).toBe(true);
          resolve();
        }, 1100);
      });
    });
  });

  describe('Partial Failures', () => {
    test('tracks partial failures separately', () => {
      monitoring.recordJobExecution({
        jobId: 'scraper-partial-1',
        timestamp: new Date().toISOString(),
        executionTimeMs: 5000,
        statesProcessed: 51,
        statesCreated: 0,
        statesUpdated: 0,
        statesVerified: 51,
        scrapeErrors: 2,
        updateErrors: 0,
        totalErrors: 2,
        cacheInvalidated: true,
        status: 'partial_failure',
      });

      const stats = monitoring.getJobStats();
      expect(stats.partialFailures).toBe(1);
      expect(stats.failedRuns).toBe(0);
    });
  });
});
