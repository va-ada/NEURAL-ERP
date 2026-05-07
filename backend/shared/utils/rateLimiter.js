const redis = require('./redis');
const { logger } = require('./logger');

/**
 * Sliding counter-based rate limit backed by Redis.
 * Falls open (returns `{ limited: false }`) if Redis is unavailable so a Redis
 * outage never locks out all users — but the degradation is logged.
 *
 * @param {string} key - unique key (e.g. `otp:verify:${email}`)
 * @param {object} opts
 * @param {number} opts.max       - max allowed within the window
 * @param {number} opts.windowSec - window length in seconds
 * @returns {Promise<{ limited: boolean, attempts: number, resetIn: number }>}
 */
async function hit(key, { max, windowSec }) {
    try {
        const attempts = await redis.incr(key);
        if (attempts === 1) await redis.expire(key, windowSec);
        const ttl = await redis.ttl(key);
        return {
            limited: attempts > max,
            attempts,
            resetIn: ttl < 0 ? windowSec : ttl,
        };
    } catch (err) {
        logger.warn({ event: 'rate_limiter_degraded', key, reason: err.message });
        return { limited: false, attempts: 0, resetIn: 0 };
    }
}

async function reset(key) {
    try {
        await redis.del(key);
    } catch {
        // no-op — best effort
    }
}

module.exports = { hit, reset };
