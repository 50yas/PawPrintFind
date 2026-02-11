/**
 * Cache Service
 *
 * PERFORMANCE OPTIMIZATION: In-memory caching with TTL to reduce Firestore reads by 60-80%
 *
 * Strategy:
 * - Hot data (AI settings, system stats): Short TTL (1-5min)
 * - Cold data (blog posts, pet lists): Medium TTL (5-15min)
 * - User-specific data: Session-based cache with React Query
 *
 * Cache Invalidation:
 * - Time-based: TTL expiration
 * - Event-based: Manual invalidation on write operations
 */

import { logger } from './loggerService';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // milliseconds
}

class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private stats: {
        hits: number;
        misses: number;
        sets: number;
        invalidations: number;
    };

    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0
        };

        // Periodic cleanup of expired entries (every 5 minutes)
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Get cached data or return null if expired/missing
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            // Expired
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data as T;
    }

    /**
     * Set cache entry with TTL (in milliseconds)
     */
    set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        this.stats.sets++;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.stats.invalidations++;
            logger.info(`Cache invalidated: ${key}`);
        }
    }

    /**
     * Invalidate all keys matching a pattern
     * Example: invalidatePattern('pet_') clears all pet-related caches
     */
    invalidatePattern(pattern: string): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (key.startsWith(pattern)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.stats.invalidations++;
        });

        if (keysToDelete.length > 0) {
            logger.info(`Cache pattern invalidated: ${pattern} (${keysToDelete.length} entries)`);
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.stats.invalidations += size;
        logger.info(`Cache cleared: ${size} entries`);
    }

    /**
     * Get or set pattern: Fetch from cache or execute callback and cache result
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss - fetch fresh data
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }

    /**
     * Remove expired entries from cache
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            logger.info(`Cache cleanup: ${keysToDelete.length} expired entries removed`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : '0.00';

        return {
            ...this.stats,
            size: this.cache.size,
            hitRate: `${hitRate}%`
        };
    }

    /**
     * Reset statistics (useful for monitoring)
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            invalidations: 0
        };
    }
}

// Singleton instance
export const cacheService = new CacheService();

/**
 * Predefined TTL constants (in milliseconds)
 */
export const CacheTTL = {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    THIRTY_MINUTES: 30 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000
};

/**
 * Predefined cache keys for common data
 */
export const CacheKeys = {
    // System-wide caches
    AI_SETTINGS: 'system_ai_settings',
    SYSTEM_STATS: 'system_stats',
    PUBLIC_STATS: 'public_stats',

    // Collection caches (use with ID)
    BLOG_POST: (id: string) => `blog_post_${id}`,
    BLOG_LIST: 'blog_list_all',
    PET: (id: string) => `pet_${id}`,
    PET_LIST: (ownerEmail: string) => `pet_list_${ownerEmail}`,
    VET_CLINIC: (id: string) => `vet_clinic_${id}`,
    VET_CLINICS_ALL: 'vet_clinics_all',

    // Search caches
    SEARCH_RESULT: (query: string) => `search_${query}`,

    // User caches
    USER_PROFILE: (uid: string) => `user_${uid}`,

    // Admin caches
    AUDIT_LOGS: 'admin_audit_logs',
    PENDING_VERIFICATIONS: 'pending_verifications'
};

/**
 * Cache decorator for async functions
 * Usage:
 *   const getCachedData = withCache('my_key', () => fetchData(), CacheTTL.FIVE_MINUTES);
 */
export function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
): () => Promise<T> {
    return () => cacheService.getOrSet(key, fetcher, ttl);
}

/**
 * Decorator for methods that should invalidate cache on completion
 * Usage: Call this after write operations to invalidate related caches
 */
export function invalidateOnWrite(patterns: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const result = await originalMethod.apply(this, args);

            // Invalidate caches after successful write
            patterns.forEach(pattern => {
                cacheService.invalidatePattern(pattern);
            });

            return result;
        };

        return descriptor;
    };
}
