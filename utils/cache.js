/**
 * Caching utility for SANGAM backend
 * Provides in-memory caching with TTL support
 * Can be upgraded to Redis for production deployments
 */

class CacheStore {
    constructor() {
        this.store = new Map();
        this.timers = new Map();
    }

    /**
     * Set a value in cache with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, value, ttl = 5 * 60 * 1000) { // Default: 5 minutes
        // Clear existing timer if any
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Store value
        this.store.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.store.delete(key);
            this.timers.delete(key);
        }, ttl);

        this.timers.set(key, timer);

        return true;
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {any|null} - Cached value or null if not found/expired
     */
    get(key) {
        if (!this.store.has(key)) {
            return null;
        }

        const cached = this.store.get(key);
        const isExpired = (Date.now() - cached.timestamp) > cached.ttl;

        if (isExpired) {
            this.delete(key);
            return null;
        }

        return cached.value;
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        this.store.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.store.forEach((value, key) => {
            this.delete(key);
        });
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.store.size,
            keys: Array.from(this.store.keys())
        };
    }
}

// Create global cache store instance
export const cache = new CacheStore();

/**
 * Cache middleware factory
 * @param {string} keyPrefix - Prefix for cache key
 * @param {number} ttl - Time to live in milliseconds
 */
export const cacheMiddleware = (keyPrefix, ttl = 5 * 60 * 1000) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const userId = req.user?._id || 'anonymous';
        const cacheKey = `${keyPrefix}:${req.path}:${userId}`;

        // Try to get from cache
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            // Cache successful responses only
            if (res.statusCode === 200 && data?.success !== false) {
                cache.set(cacheKey, data, ttl);
            }
            return originalJson(data);
        };

        next();
    };
};

/**
 * Cache invalidation helper
 * Invalidates cache entries matching a pattern
 */
export const invalidateCache = (pattern) => {
    const { keys } = cache.getStats();
    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    });
};

/**
 * Cache key generator
 */
export const generateCacheKey = (...parts) => {
    return parts.filter(Boolean).join(':');
};

/**
 * Database query optimization utilities
 */
export const queryOptimizations = {
    /**
     * Apply lean query (for read-only operations)
     * Returns plain JavaScript objects instead of Mongoose documents
     */
    lean: (query) => {
        return query.lean();
    },

    /**
     * Apply select to fetch only needed fields
     */
    selectFields: (query, fields) => {
        if (!fields) return query;
        return query.select(fields);
    },

    /**
     * Apply pagination
     */
    paginate: (query, page = 1, limit = 10) => {
        const skip = (page - 1) * limit;
        return query.skip(skip).limit(limit);
    },

    /**
     * Apply sort
     */
    sort: (query, sortBy = '-createdAt') => {
        return query.sort(sortBy);
    },

    /**
     * Combine multiple optimizations
     */
    optimize: (query, options = {}) => {
        let optimized = query;

        if (options.fields) {
            optimized = optimized.select(options.fields);
        }

        if (options.lean !== false) {
            optimized = optimized.lean();
        }

        if (options.sort) {
            optimized = optimized.sort(options.sort);
        }

        if (options.page && options.limit) {
            optimized = optimized.skip((options.page - 1) * options.limit).limit(options.limit);
        }

        return optimized;
    }
};

/**
 * Database index recommendations
 * These should be created in MongoDB for optimal queries
 */
export const indexRecommendations = {
    User: {
        indexes: [
            { email: 1 },
            { username: 1 },
            { role: 1 },
            { department: 1, role: 1 }
        ]
    },
    Project: {
        indexes: [
            { name: 1 },
            { status: 1 },
            { departmentId: 1 },
            { createdAt: -1 },
            { status: 1, createdAt: -1 }
        ]
    },
    Task: {
        indexes: [
            { projectId: 1 },
            { assignedTo: 1 },
            { status: 1 },
            { projectId: 1, status: 1 },
            { assignedTo: 1, status: 1 }
        ]
    },
    Department: {
        indexes: [
            { name: 1 },
            { createdAt: -1 }
        ]
    },
    Resource: {
        indexes: [
            { type: 1 },
            { department: 1 },
            { projectId: 1 }
        ]
    }
};

/**
 * MongoDB aggregation pipeline optimizations
 */
export const aggregationOptimizations = {
    /**
     * Use $match early in pipeline to reduce documents
     */
    matchEarly: (match) => {
        return { $match: match };
    },

    /**
     * Use $project to select only needed fields
     */
    projectFields: (fields) => {
        return { $project: fields };
    },

    /**
     * Use $group for aggregations
     */
    groupBy: (groupId, aggregations) => {
        return {
            $group: {
                _id: groupId,
                ...aggregations
            }
        };
    },

    /**
     * Use $sort with limit
     */
    sortAndLimit: (sortBy = { createdAt: -1 }, limit = 10) => {
        return [
            { $sort: sortBy },
            { $limit: limit }
        ];
    },

    /**
     * Lookup (join) optimization
     */
    lookupOptimized: (from, localField, foreignField, as, pipeline = []) => {
        return {
            $lookup: {
                from,
                let: { [localField]: `$${localField}` },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: [`$${foreignField}`, `$$${localField}`] }
                        }
                    },
                    ...pipeline
                ],
                as
            }
        };
    }
};

/**
 * Query performance monitoring
 */
export const queryMonitoring = {
    queries: [],

    /**
     * Log query performance
     */
    logQuery: (operation, model, duration, success = true) => {
        const entry = {
            operation,
            model,
            duration,
            success,
            timestamp: new Date().toISOString()
        };

        queryMonitoring.queries.push(entry);

        // Keep only last 1000 entries
        if (queryMonitoring.queries.length > 1000) {
            queryMonitoring.queries.shift();
        }

        // Log slow queries
        if (duration > 1000) {
            console.warn(`⚠️  Slow query: ${model}.${operation} took ${duration}ms`);
        }

        return entry;
    },

    /**
     * Get average query time
     */
    getAverageTime: (model) => {
        const queries = queryMonitoring.queries.filter(q => q.model === model);
        if (queries.length === 0) return 0;

        const total = queries.reduce((sum, q) => sum + q.duration, 0);
        return Math.round(total / queries.length);
    },

    /**
     * Get statistics
     */
    getStats: () => {
        const stats = {};
        queryMonitoring.queries.forEach(q => {
            if (!stats[q.model]) {
                stats[q.model] = { count: 0, totalTime: 0, errors: 0 };
            }
            stats[q.model].count++;
            stats[q.model].totalTime += q.duration;
            if (!q.success) stats[q.model].errors++;
        });

        for (const model in stats) {
            const s = stats[model];
            s.averageTime = Math.round(s.totalTime / s.count);
        }

        return stats;
    }
};

export default {
    cache,
    cacheMiddleware,
    invalidateCache,
    generateCacheKey,
    queryOptimizations,
    indexRecommendations,
    aggregationOptimizations,
    queryMonitoring
};
