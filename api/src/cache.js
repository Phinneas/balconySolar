/**
 * Cache management for Balcony Solar Checker API
 * Handles in-memory caching with TTL and invalidation
 */

class CacheManager {
  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    this.store = new Map();
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

    // Check if expired
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
      timestamp: Date.now(),
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
      ttlMs: this.ttl,
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
}

export default CacheManager;
