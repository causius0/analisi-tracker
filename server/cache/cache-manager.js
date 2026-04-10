/**
 * Cache Manager
 * Handles caching for expensive analytics computations.
 * Two-tier: NodeCache (in-process, fast) backed by analyticsCache DB table (persistent).
 */

import NodeCache from 'node-cache';
import { db, analyticsCache } from '../db/index.js';
import { eq, lt, sql } from 'drizzle-orm';

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
   * Get cached value — checks NodeCache first, falls back to DB.
   */
  async get(key) {
    const memHit = this.cache.get(key);
    if (memHit !== undefined) return memHit;

    try {
      const rows = await db
        .select({ data: analyticsCache.data, expiresAt: analyticsCache.expiresAt })
        .from(analyticsCache)
        .where(eq(analyticsCache.cacheKey, key))
        .limit(1);

      if (rows.length === 0 || rows[0].expiresAt < new Date()) return undefined;

      // Refresh access metadata (fire-and-forget)
      db.update(analyticsCache)
        .set({ accessedAt: new Date(), accessCount: sql`${analyticsCache.accessCount} + 1` })
        .where(eq(analyticsCache.cacheKey, key))
        .catch(() => {});

      // Re-populate NodeCache for subsequent in-process hits
      const remaining = Math.floor((rows[0].expiresAt - new Date()) / 1000);
      this.cache.set(key, rows[0].data, remaining);

      return rows[0].data;
    } catch {
      return undefined;
    }
  }

  /**
   * Set cached value with TTL — writes to NodeCache and DB.
   */
  async set(key, value, ttl = 'medium', { cacheType = 'analytics', userId = null, patientId = null } = {}) {
    const ttlSeconds = typeof ttl === 'number' ? ttl : this.ttls[ttl] || this.ttls.medium;
    this.cache.set(key, value, ttlSeconds);

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    try {
      await db
        .insert(analyticsCache)
        .values({ cacheKey: key, cacheType, userId, patientId, data: value, expiresAt })
        .onConflictDoUpdate({
          target: analyticsCache.cacheKey,
          set: { data: value, expiresAt, accessedAt: new Date() }
        });
    } catch {
      // DB write failure degrades gracefully — NodeCache still serves the value
    }
  }

  /**
   * Delete cache key
   */
  async del(key) {
    this.cache.del(key);
    try {
      await db.delete(analyticsCache).where(eq(analyticsCache.cacheKey, key));
    } catch {}
  }

  /**
   * Delete all keys matching a substring pattern — both NodeCache and DB.
   */
  async deletePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    if (matchingKeys.length > 0) this.cache.del(matchingKeys);

    try {
      await db
        .delete(analyticsCache)
        .where(sql`${analyticsCache.cacheKey} LIKE ${'%' + pattern + '%'}`);
    } catch {}

    return matchingKeys.length;
  }

  /**
   * Clear all cache
   */
  async flushAll() {
    this.cache.flushAll();
    try {
      await db.delete(analyticsCache);
    } catch {}
  }

  /**
   * Get or set pattern (cache aside)
   */
  async getOrSet(key, factory, ttl = 'medium', dbMeta = {}) {
    const cached = await this.get(key);

    if (cached !== undefined) {
      return { data: cached, cached: true };
    }

    const value = await factory();
    await this.set(key, value, ttl, dbMeta);

    return { data: value, cached: false };
  }

  /**
   * Purge expired rows from the DB cache table (call periodically).
   */
  async purgeExpired() {
    try {
      await db.delete(analyticsCache).where(lt(analyticsCache.expiresAt, new Date()));
    } catch {}
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all in-process keys
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
