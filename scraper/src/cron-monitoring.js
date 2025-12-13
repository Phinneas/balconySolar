/**
 * Cron Job Monitoring and Alerting
 * Tracks scheduled scraper job execution, errors, and performance
 */

class CronMonitoringService {
  constructor(options = {}) {
    this.jobHistory = [];
    this.alertThresholds = {
      executionTimeMs: options.executionTimeThreshold || 30000,
      errorCountThreshold: options.errorCountThreshold || 5,
      errorRateThreshold: options.errorRateThreshold || 10,
      maxTimeSinceLastRun: options.maxTimeSinceLastRun || 24 * 60 * 60 * 1000, // 24 hours
    };

    this.alertHandlers = [];
    this.lastSuccessfulRun = null;
  }

  /**
   * Record a cron job execution
   * @param {object} jobResult - Job execution result
   */
  recordJobExecution(jobResult) {
    const jobRecord = {
      ...jobResult,
      recordedAt: Date.now(),
    };

    this.jobHistory.push(jobRecord);

    // Keep only last 100 job executions
    if (this.jobHistory.length > 100) {
      this.jobHistory.shift();
    }

    // Update last successful run if applicable
    if (jobResult.status === 'success' || jobResult.status === 'partial_failure') {
      this.lastSuccessfulRun = Date.now();
    }

    // Check for alerts
    this.checkJobAlerts(jobRecord);
  }

  /**
   * Check if job execution triggers any alerts
   * @param {object} jobRecord - Job execution record
   */
  checkJobAlerts(jobRecord) {
    // Check execution time
    if (jobRecord.executionTimeMs > this.alertThresholds.executionTimeMs) {
      this.triggerAlert('slow_execution', {
        jobId: jobRecord.jobId,
        executionTimeMs: jobRecord.executionTimeMs,
        threshold: this.alertThresholds.executionTimeMs,
      });
    }

    // Check error count
    if (jobRecord.totalErrors > this.alertThresholds.errorCountThreshold) {
      this.triggerAlert('high_error_count', {
        jobId: jobRecord.jobId,
        errorCount: jobRecord.totalErrors,
        threshold: this.alertThresholds.errorCountThreshold,
      });
    }

    // Check error rate
    if (jobRecord.statesProcessed > 0) {
      const errorRate = (jobRecord.totalErrors / jobRecord.statesProcessed) * 100;
      if (errorRate > this.alertThresholds.errorRateThreshold) {
        this.triggerAlert('high_error_rate', {
          jobId: jobRecord.jobId,
          errorRate: errorRate.toFixed(2),
          threshold: this.alertThresholds.errorRateThreshold,
        });
      }
    }

    // Check job failure
    if (jobRecord.status === 'failure') {
      this.triggerAlert('job_failure', {
        jobId: jobRecord.jobId,
        errors: jobRecord.totalErrors,
      });
    }

    // Check cache invalidation failure
    if (!jobRecord.cacheInvalidated && jobRecord.status !== 'failure') {
      this.triggerAlert('cache_invalidation_failed', {
        jobId: jobRecord.jobId,
      });
    }
  }

  /**
   * Check if cron job is overdue (hasn't run in expected time)
   * @returns {boolean} True if job is overdue
   */
  isJobOverdue() {
    if (!this.lastSuccessfulRun) {
      return true; // No successful run yet
    }

    const timeSinceLastRun = Date.now() - this.lastSuccessfulRun;
    return timeSinceLastRun > this.alertThresholds.maxTimeSinceLastRun;
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
      severity: this.getAlertSeverity(alertType),
    };

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
   * Get alert severity level
   * @param {string} alertType - Type of alert
   * @returns {string} Severity level (info, warning, error, critical)
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      slow_execution: 'warning',
      high_error_count: 'error',
      high_error_rate: 'error',
      job_failure: 'critical',
      cache_invalidation_failed: 'critical',
      job_overdue: 'critical',
    };

    return severityMap[alertType] || 'info';
  }

  /**
   * Register an alert handler
   * @param {function} handler - Function to call when alert is triggered
   */
  onAlert(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get job statistics
   * @returns {object} Job statistics
   */
  getJobStats() {
    if (this.jobHistory.length === 0) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        partialFailures: 0,
        averageExecutionTime: 0,
        averageErrorCount: 0,
        lastRun: null,
      };
    }

    const successfulRuns = this.jobHistory.filter(j => j.status === 'success').length;
    const failedRuns = this.jobHistory.filter(j => j.status === 'failure').length;
    const partialFailures = this.jobHistory.filter(j => j.status === 'partial_failure').length;

    const averageExecutionTime = this.jobHistory.reduce((sum, j) => sum + j.executionTimeMs, 0) / this.jobHistory.length;
    const averageErrorCount = this.jobHistory.reduce((sum, j) => sum + j.totalErrors, 0) / this.jobHistory.length;

    return {
      totalRuns: this.jobHistory.length,
      successfulRuns,
      failedRuns,
      partialFailures,
      successRate: ((successfulRuns / this.jobHistory.length) * 100).toFixed(2),
      averageExecutionTime: averageExecutionTime.toFixed(2),
      averageErrorCount: averageErrorCount.toFixed(2),
      lastRun: this.jobHistory[this.jobHistory.length - 1],
      isOverdue: this.isJobOverdue(),
    };
  }

  /**
   * Get recent job executions
   * @param {number} limit - Number of recent jobs to return
   * @returns {array} Recent job executions
   */
  getRecentJobs(limit = 10) {
    return this.jobHistory.slice(-limit);
  }

  /**
   * Get job execution by ID
   * @param {string} jobId - Job ID
   * @returns {object|null} Job execution record or null
   */
  getJobById(jobId) {
    return this.jobHistory.find(j => j.jobId === jobId) || null;
  }

  /**
   * Reset monitoring data
   */
  reset() {
    this.jobHistory = [];
    this.lastSuccessfulRun = null;
  }
}

export default CronMonitoringService;
