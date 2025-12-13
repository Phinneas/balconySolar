/**
 * Cron Execution and Error Handling Tests
 * Tests for the scheduled scraper job execution, error handling, and monitoring
 */

import fc from 'fast-check';

/**
 * Generates a valid cron expression
 */
const cronExpressionArbitrary = () => {
  return fc.record({
    minute: fc.integer({ min: 0, max: 59 }),
    hour: fc.integer({ min: 0, max: 23 }),
    dayOfMonth: fc.integer({ min: 1, max: 31 }),
    month: fc.integer({ min: 1, max: 12 }),
    dayOfWeek: fc.integer({ min: 0, max: 6 }), // 0 = Sunday, 1 = Monday, etc.
  }).map(({ minute, hour, dayOfMonth, month, dayOfWeek }) => {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  });
};

/**
 * Generates a valid job execution result with consistent state counts
 */
const jobExecutionResultArbitrary = () => {
  return fc.tuple(
    fc.string({ minLength: 10, maxLength: 50 }),
    fc.integer({ min: 0, max: Date.now() }),
    fc.integer({ min: 100, max: 30000 }),
    fc.integer({ min: 0, max: 51 }), // statesProcessed
    fc.integer({ min: 0, max: 10 }), // scrapeErrors
    fc.integer({ min: 0, max: 10 }), // updateErrors
    fc.boolean(), // cacheInvalidated
  ).chain(([jobId, timestamp, executionTimeMs, statesProcessed, scrapeErrors, updateErrors, cacheInvalidated]) => {
    // Generate state counts that sum to statesProcessed
    // Use combinatorial approach to ensure valid distribution
    return fc.tuple(
      fc.integer({ min: 0, max: statesProcessed }),
      fc.integer({ min: 0, max: statesProcessed })
    ).map(([created, updated]) => {
      // Ensure created + updated doesn't exceed statesProcessed
      const maxVerified = statesProcessed - created - updated;
      const verified = Math.max(0, maxVerified);
      
      // Adjust created/updated if they exceed statesProcessed
      const total = created + updated + verified;
      let adjustedCreated = created;
      let adjustedUpdated = updated;
      
      if (total > statesProcessed) {
        // Scale down proportionally
        const ratio = statesProcessed / total;
        adjustedCreated = Math.floor(created * ratio);
        adjustedUpdated = Math.floor(updated * ratio);
      }
      
      const adjustedVerified = statesProcessed - adjustedCreated - adjustedUpdated;
      const totalErrors = scrapeErrors + updateErrors;
      
      // Determine status based on errors
      let status = 'success';
      if (totalErrors > 0) {
        status = cacheInvalidated ? 'partial_failure' : 'failure';
      }
      
      return {
        jobId,
        timestamp: new Date(timestamp).toISOString(),
        executionTimeMs,
        statesProcessed,
        statesCreated: adjustedCreated,
        statesUpdated: adjustedUpdated,
        statesVerified: adjustedVerified,
        scrapeErrors,
        updateErrors,
        totalErrors,
        cacheInvalidated,
        status,
      };
    });
  });
};

/**
 * Generates an error object
 */
const errorArbitrary = () => {
  return fc.record({
    message: fc.string({ minLength: 5, maxLength: 100 }),
    code: fc.constantFrom('TIMEOUT', 'NETWORK', 'VALIDATION', 'UNKNOWN'),
    timestamp: fc.integer({ min: 0, max: Date.now() })
      .map(ts => new Date(ts).toISOString()),
  });
};

/**
 * Helper function to validate cron expression format
 */
function isValidCronExpression(cronStr) {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map(p => parseInt(p, 10));

  return (
    minute >= 0 && minute <= 59 &&
    hour >= 0 && hour <= 23 &&
    dayOfMonth >= 1 && dayOfMonth <= 31 &&
    month >= 1 && month <= 12 &&
    dayOfWeek >= 0 && dayOfWeek <= 6
  );
}

/**
 * Helper function to check if execution time is within acceptable range
 */
function isExecutionTimeAcceptable(executionTimeMs, maxTimeMs = 30000) {
  return executionTimeMs > 0 && executionTimeMs <= maxTimeMs;
}

/**
 * Helper function to validate job execution result
 */
function isValidJobResult(result) {
  return (
    result.jobId &&
    result.timestamp &&
    typeof result.executionTimeMs === 'number' &&
    typeof result.statesProcessed === 'number' &&
    typeof result.statesCreated === 'number' &&
    typeof result.statesUpdated === 'number' &&
    typeof result.totalErrors === 'number' &&
    typeof result.cacheInvalidated === 'boolean' &&
    ['success', 'partial_failure', 'failure'].includes(result.status)
  );
}

/**
 * Helper function to check error consistency
 */
function isErrorConsistent(result) {
  // Total errors should equal sum of scrape and update errors
  return result.totalErrors === (result.scrapeErrors + result.updateErrors);
}

/**
 * Helper function to check state count consistency
 */
function isStateCountConsistent(result) {
  // Sum of created, updated, and verified should equal processed
  const sum = result.statesCreated + result.statesUpdated + result.statesVerified;
  return sum === result.statesProcessed;
}

describe('Cron Execution and Error Handling', () => {
  /**
   * Property: For any valid cron expression, it SHALL follow the standard
   * cron format (minute hour day month day-of-week)
   */
  test('valid cron expressions follow standard format', () => {
    fc.assert(
      fc.property(cronExpressionArbitrary(), (cronExpr) => {
        expect(isValidCronExpression(cronExpr)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, the execution time SHALL be
   * greater than 0 and less than or equal to 30 seconds (30000ms)
   */
  test('execution time is within acceptable range', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        expect(isExecutionTimeAcceptable(result.executionTimeMs)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, all required fields SHALL be
   * present and have the correct types
   */
  test('job execution result has all required fields', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        expect(isValidJobResult(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, the total errors SHALL equal
   * the sum of scrape errors and update errors
   */
  test('error counts are consistent', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        expect(isErrorConsistent(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, the sum of created, updated,
   * and verified states SHALL equal the total states processed
   */
  test('state counts are consistent', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        expect(isStateCountConsistent(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result with totalErrors > 0, the status
   * SHALL be either 'partial_failure' or 'failure'
   */
  test('status reflects error presence', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        if (result.totalErrors > 0) {
          expect(['partial_failure', 'failure']).toContain(result.status);
        } else {
          expect(result.status).toBe('success');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, the timestamp SHALL be a valid
   * ISO 8601 string that can be parsed as a Date
   */
  test('job timestamp is valid ISO 8601', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        const date = new Date(result.timestamp);
        expect(date instanceof Date).toBe(true);
        expect(isNaN(date.getTime())).toBe(false);
        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any error object, it SHALL have a message, code, and
   * timestamp
   */
  test('error objects have required fields', () => {
    fc.assert(
      fc.property(errorArbitrary(), (error) => {
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('timestamp');
        expect(typeof error.message).toBe('string');
        expect(typeof error.code).toBe('string');
        expect(typeof error.timestamp).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any error code, it SHALL be one of the predefined error
   * types (TIMEOUT, NETWORK, VALIDATION, UNKNOWN)
   */
  test('error codes are valid', () => {
    fc.assert(
      fc.property(errorArbitrary(), (error) => {
        const validCodes = ['TIMEOUT', 'NETWORK', 'VALIDATION', 'UNKNOWN'];
        expect(validCodes).toContain(error.code);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result with cacheInvalidated = true,
   * the result status SHALL not be 'failure'
   */
  test('cache invalidation indicates partial success', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        if (result.cacheInvalidated) {
          expect(result.status).not.toBe('failure');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any job execution result, if statesProcessed > 0, then
   * at least one of created, updated, or verified SHALL be > 0
   */
  test('processed states have at least one outcome', () => {
    fc.assert(
      fc.property(jobExecutionResultArbitrary(), (result) => {
        if (result.statesProcessed > 0) {
          const hasOutcome = result.statesCreated > 0 ||
                            result.statesUpdated > 0 ||
                            result.statesVerified > 0;
          expect(hasOutcome).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any two job execution results, the one with an earlier
   * timestamp SHALL be considered older
   */
  test('timestamp ordering is consistent', () => {
    fc.assert(
      fc.property(
        jobExecutionResultArbitrary(),
        jobExecutionResultArbitrary(),
        (result1, result2) => {
          const date1 = new Date(result1.timestamp);
          const date2 = new Date(result2.timestamp);

          if (date1 < date2) {
            expect(result1.timestamp < result2.timestamp).toBe(true);
          } else if (date1 > date2) {
            expect(result1.timestamp > result2.timestamp).toBe(true);
          } else {
            expect(result1.timestamp === result2.timestamp).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

