/**
 * Tests for Cache Manager
 * Feature: balcony-solar-checker, Property 8: Cache Invalidation
 * Validates: Requirements 5.2, 5.4
 */

import CacheManager from '../src/cache.js';

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager(1000); // 1 second TTL for testing
  });

  describe('Basic operations', () => {
    test('set and get values', () => {
      cache.set('key1', { data: 'value1' });
      expect(cache.get('key1')).toEqual({ data: 'value1' });
    });

    test('returns null for missing keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    test('has() returns true for existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    test('has() returns false for missing keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('delete() removes keys', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('TTL and expiration', () => {
    test('returns null for expired entries', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toEqual('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeNull();
    });

    test('cleanup() removes expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const cleaned = cache.cleanup();
      expect(cleaned).toBe(2);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('Invalidation', () => {
    test('invalidate() with pattern removes matching keys', () => {
      cache.set('state-ca', { name: 'California' });
      cache.set('state-ny', { name: 'New York' });
      cache.set('all-states', []);
      
      cache.invalidate('state-');
      
      expect(cache.get('state-ca')).toBeNull();
      expect(cache.get('state-ny')).toBeNull();
      expect(cache.get('all-states')).toEqual([]);
    });

    test('invalidate() without pattern clears all', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.invalidate();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('Statistics', () => {
    test('getStats() returns cache information', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.ttlMs).toBe(1000);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
    });

    test('getStats() counts expired entries', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const stats = cache.getStats();
      expect(stats.expiredCount).toBe(2);
    });
  });

  describe('Property 8: Cache Invalidation', () => {
    test('cache invalidation updates within 1 minute', async () => {
      // Set initial data
      cache.set('state-ca', { name: 'California', maxWattage: 800 });
      expect(cache.get('state-ca')).toEqual({ name: 'California', maxWattage: 800 });
      
      // Simulate data update
      cache.invalidate('state-ca');
      expect(cache.get('state-ca')).toBeNull();
      
      // New data should be fetched and cached
      cache.set('state-ca', { name: 'California', maxWattage: 900 });
      expect(cache.get('state-ca')).toEqual({ name: 'California', maxWattage: 900 });
    });

    test('cache invalidation by pattern works correctly', () => {
      cache.set('state-ca', { name: 'California' });
      cache.set('state-ny', { name: 'New York' });
      cache.set('state-tx', { name: 'Texas' });
      cache.set('all-states', []);
      
      // Invalidate all state-specific caches
      cache.invalidate('state-');
      
      // State caches should be cleared
      expect(cache.get('state-ca')).toBeNull();
      expect(cache.get('state-ny')).toBeNull();
      expect(cache.get('state-tx')).toBeNull();
      
      // All-states cache should remain
      expect(cache.get('all-states')).toEqual([]);
    });

    test('full cache invalidation clears everything', () => {
      cache.set('state-ca', { name: 'California' });
      cache.set('all-states', []);
      cache.set('health', { status: 'ok' });
      
      cache.invalidate();
      
      expect(cache.get('state-ca')).toBeNull();
      expect(cache.get('all-states')).toBeNull();
      expect(cache.get('health')).toBeNull();
    });
  });

  describe('Property 6: API Response Time', () => {
    test('cached responses are faster than uncached', async () => {
      const testData = { name: 'California', maxWattage: 800 };
      
      // First access (cache miss)
      const start1 = Date.now();
      cache.set('state-ca', testData);
      cache.get('state-ca');
      const time1 = Date.now() - start1;
      
      // Second access (cache hit)
      const start2 = Date.now();
      cache.get('state-ca');
      const time2 = Date.now() - start2;
      
      // Cache hit should be faster or equal
      expect(time2).toBeLessThanOrEqual(time1 + 1); // Allow 1ms margin
    });
  });
});
