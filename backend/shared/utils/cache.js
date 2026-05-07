const redis = require('./redis');
const { logger } = require('./logger');

const DEFAULT_TTL = 300; // seconds

// Rate-limit noisy "redis down" warnings so a flapping Redis doesn't flood logs.
let lastWarnAt = 0;
function warnDegraded(reason) {
    const now = Date.now();
    if (now - lastWarnAt < 30_000) return;
    lastWarnAt = now;
    logger.warn({ event: 'cache_degraded', reason });
}

/**
 * Get from cache or compute + store. Silent on Redis outage, but emits a
 * rate-limited degraded-mode warning so ops can notice.
 */
async function cacheGet(key, fetchFn, ttl = DEFAULT_TTL) {
    try {
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);
    } catch (err) {
        warnDegraded(`get ${key}: ${err.message}`);
    }

    const data = await fetchFn();

    try {
        await redis.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
        warnDegraded(`setex ${key}: ${err.message}`);
    }

    return data;
}

/**
 * Invalidate keys by pattern. Avoids blocking on large keyspaces by scanning
 * instead of KEYS (which is O(N) and unsafe in production Redis).
 */
async function cacheInvalidate(pattern) {
    try {
        const stream = redis.scanStream({ match: pattern, count: 100 });
        const pipeline = redis.pipeline();
        let count = 0;
        await new Promise((resolve, reject) => {
            stream.on('data', (keys) => {
                if (keys.length) {
                    pipeline.del(...keys);
                    count += keys.length;
                }
            });
            stream.on('end', resolve);
            stream.on('error', reject);
        });
        if (count > 0) await pipeline.exec();
        return count;
    } catch (err) {
        warnDegraded(`invalidate ${pattern}: ${err.message}`);
        return 0;
    }
}

module.exports = { cacheGet, cacheInvalidate };
