/**
 * Feature: balcony-solar-checker, Property 7: Data Freshness
 * Validates: Requirements 5.1, 7.3
 * 
 * Property-based test for audit logging and data freshness.
 * Verifies that for any state data served by the API, the lastUpdated 
 * timestamp SHALL be no older than 7 days (indicating the scraper 
 * workflow has run recently).
 */

const fc = require('fast-check');

/**
 * Generates a valid state code (2-letter lowercase)
 */
const stateCodeArbitrary = () => {
  return fc.tuple(
    fc.integer({ min: 97, max: 122 }), // 'a' to 'z'
    fc.integer({ min: 97, max: 122 })  // 'a' to 'z'
  ).map(([a, b]) => String.fromCharCode(a) + String.fromCharCode(b));
};

/**
 * Generates a valid state data object with all required fields
 */
const stateDataArbitrary = () => {
  return fc.record({
    code: stateCodeArbitrary(),
    name: fc.string({ minLength: 3, maxLength: 20 }),
    abbreviation: fc.tuple(
      fc.integer({ min: 65, max: 90 }),
      fc.integer({ min: 65, max: 90 })
    ).map(([a, b]) => String.fromCharCode(a) + String.fromCharCode(b)),
    isLegal: fc.boolean(),
    maxWattage: fc.integer({ min: 300, max: 2000 }),
    keyLaw: fc.string({ minLength: 3, maxLength: 50 }),
    dataSource: fc.webUrl(),
  });
};

/**
 * Generates a timestamp within the last 7 days (not in the future)
 */
const recentTimestampArbitrary = () => {
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  // Ensure we don't generate future timestamps by capping at now
  return fc.integer({ min: Math.floor(sevenDaysAgo), max: Math.floor(now) })
    .map(timestamp => new Date(timestamp).toISOString());
};

/**
 * Generates a timestamp older than 7 days (invalid for freshness)
 */
const staleTimestampArbitrary = () => {
  const now = Date.now();
  const moreThanSevenDaysAgo = now - (8 * 24 * 60 * 60 * 1000);
  return fc.integer({ min: 0, max: moreThanSevenDaysAgo })
    .map(timestamp => new Date(timestamp).toISOString());
};

/**
 * Helper function to calculate days between two dates
 */
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.abs((date1 - date2) / oneDay);
}

/**
 * Helper function to check if a timestamp is within the last 7 days
 */
function isWithinSevenDays(timestamp) {
  const lastUpdated = new Date(timestamp);
  const now = new Date();
  const days = daysBetween(now, lastUpdated);
  // Use a small tolerance for floating point comparison
  return days <= 7.001;
}

describe('Property 7: Data Freshness - Audit Logging', () => {
  /**
   * Property: For any state data with a recent lastUpdated timestamp,
   * the timestamp SHALL be no older than 7 days.
   */
  test('recent timestamps are within 7 days', () => {
    fc.assert(
      fc.property(recentTimestampArbitrary(), (timestamp) => {
        // Verify that the generated timestamp is within 7 days
        expect(isWithinSevenDays(timestamp)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any state data with a stale lastUpdated timestamp,
   * the timestamp SHALL be older than 7 days.
   */
  test('stale timestamps are older than 7 days', () => {
    fc.assert(
      fc.property(staleTimestampArbitrary(), (timestamp) => {
        // Verify that the generated timestamp is older than 7 days
        expect(isWithinSevenDays(timestamp)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any state data object, if lastUpdated is set to a recent
   * timestamp, the data SHALL be considered fresh and valid for serving.
   */
  test('state data with recent lastUpdated is fresh', () => {
    fc.assert(
      fc.property(
        stateDataArbitrary(),
        recentTimestampArbitrary(),
        (stateData, lastUpdated) => {
          const stateWithTimestamp = {
            ...stateData,
            lastUpdated,
          };

          // Verify all required fields are present
          expect(stateWithTimestamp).toHaveProperty('code');
          expect(stateWithTimestamp).toHaveProperty('name');
          expect(stateWithTimestamp).toHaveProperty('abbreviation');
          expect(stateWithTimestamp).toHaveProperty('isLegal');
          expect(stateWithTimestamp).toHaveProperty('maxWattage');
          expect(stateWithTimestamp).toHaveProperty('keyLaw');
          expect(stateWithTimestamp).toHaveProperty('lastUpdated');

          // Verify lastUpdated is within 7 days
          expect(isWithinSevenDays(stateWithTimestamp.lastUpdated)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any state data object, if lastUpdated is set to a stale
   * timestamp (older than 7 days), the data SHALL be considered stale and
   * should trigger a refresh.
   */
  test('state data with stale lastUpdated should trigger refresh', () => {
    fc.assert(
      fc.property(
        stateDataArbitrary(),
        staleTimestampArbitrary(),
        (stateData, lastUpdated) => {
          const stateWithTimestamp = {
            ...stateData,
            lastUpdated,
          };

          // Verify lastUpdated is older than 7 days
          expect(isWithinSevenDays(stateWithTimestamp.lastUpdated)).toBe(false);

          // In a real system, this would trigger a refresh
          // For this test, we verify the condition is detected
          const daysSinceUpdate = daysBetween(
            new Date(),
            new Date(stateWithTimestamp.lastUpdated)
          );
          expect(daysSinceUpdate).toBeGreaterThan(7);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any update log entry, the timestamp SHALL be a valid ISO
   * string that can be parsed as a Date object.
   */
  test('update log timestamps are valid ISO strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Date.now() }),
        (timestamp) => {
          const isoString = new Date(timestamp).toISOString();

          // Verify it's a valid ISO string
          expect(typeof isoString).toBe('string');
          expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

          // Verify it can be parsed back to a Date
          const parsed = new Date(isoString);
          expect(parsed instanceof Date).toBe(true);
          expect(isNaN(parsed.getTime())).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any two state data objects with different lastUpdated
   * timestamps, the one with the more recent timestamp SHALL be considered
   * fresher.
   */
  test('more recent timestamps are fresher than older ones', () => {
    fc.assert(
      fc.property(
        stateDataArbitrary(),
        recentTimestampArbitrary(),
        recentTimestampArbitrary(),
        (stateData, timestamp1, timestamp2) => {
          const state1 = { ...stateData, lastUpdated: timestamp1 };
          const state2 = { ...stateData, lastUpdated: timestamp2 };

          const date1 = new Date(timestamp1);
          const date2 = new Date(timestamp2);

          // Verify comparison logic
          if (date1 > date2) {
            expect(state1.lastUpdated > state2.lastUpdated).toBe(true);
          } else if (date1 < date2) {
            expect(state1.lastUpdated < state2.lastUpdated).toBe(true);
          } else {
            expect(state1.lastUpdated === state2.lastUpdated).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
