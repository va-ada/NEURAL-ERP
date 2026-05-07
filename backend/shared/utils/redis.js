const Redis = require('ioredis');
const { logger } = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: false,
});

let connectedOnce = false;
redis.on('connect', () => {
    if (!connectedOnce) {
        logger.info({ event: 'redis_connected' });
        connectedOnce = true;
    }
});
redis.on('error', (err) => {
    logger.warn({ event: 'redis_error', message: err.message });
});

module.exports = redis;
