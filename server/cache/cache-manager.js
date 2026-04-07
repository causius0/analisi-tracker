/**
 * Cache Manager
 * Handles caching for expensive analytics computations
 */

import NodeCache from 'node-cache';

class CacheManager {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.defaultTTL || 3600, // 1 hour default
      checkperiod: options.checkPeriod || 600, // 10 minutes
      useClones: false
    });

    this.ttls = {
      short: options.shortTTL || 300, // 5 minutes
      medium: options.mediumTTL || 3600, // 1 hour
      long: options.longTTL || 86400 // 24 hours
    };
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, identifier, params = {}) {
    const paramStr = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');

    return `${prefix}:${identifier}:${paramStr}`;
  }

  /**
   * Get cached value
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Set cached value with TTL
   */
  set(key, value, ttl = 'medium') {
    const ttlValue = typeof ttl === 'number' ? ttl : this.ttls[ttl] || this.ttls.medium;
    return this.cache.set(key, value, ttlValue);
  }

  /**
   * Delete cache key
   */
  del(key) {
    return this.cache.del(key);
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));

    if (matchingKeys.length > 0) {
      this.cache.del(matchingKeys);
    }

    return matchingKeys.length;
  }

  /**
   * Clear all cache
   */
  flushAll() {
    return this.cache.flushAll();
  }

  /**
   * Get or set pattern (cache aside)
   */
  async getOrSet(key, factory, ttl = 'medium') {
    const cached = this.get(key);

    if (cached !== undefined) {
      return { data: cached, cached: true };
    }

    const value = await factory();
    this.set(key, value, ttl);

    return { data: value, cached: false };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all keys
   */
  getKeys() {
    return this.cache.keys();
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Get cache instance
 */
export function getCacheInstance() {
  if (!cacheInstance) {
    cacheInstance = new CacheManager({
      defaultTTL: process.env.CACHE_TTL_MEDIUM || 3600,
      shortTTL: process.env.CACHE_TTL_SHORT || 300,
      mediumTTL: process.env.CACHE_TTL_MEDIUM || 3600,
      longTTL: process.env.CACHE_TTL_LONG || 86400
    });
  }

  return cacheInstance;
}

export default CacheManager;
