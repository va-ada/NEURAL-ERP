const { loadEnv, requireEnv } = require('../utils/env');

loadEnv();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const { errorHandler } = require('../middleware/errorHandler');
const { logger, requestLogger } = require('../utils/logger');

/**
 * Build a standard Neural ERP microservice Express app.
 *
 * @param {object} opts
 * @param {string} opts.serviceName           — e.g. "auth-service"
 * @param {number|string} opts.port            — port to listen on
 * @param {string[]} [opts.requiredEnv]        — env vars that must be set
 * @param {(app: import('express').Application) => void} opts.registerRoutes
 *        callback that mounts routes on the app (runs AFTER shared middleware,
 *        BEFORE the 404 + error handlers)
 * @param {(app: import('express').Application) => void} [opts.beforeRoutes]
 *        optional hook for service-specific middleware (e.g. static file serving)
 */
function createApp(opts) {
    const {
        serviceName,
        port,
        requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'],
        registerRoutes,
        beforeRoutes,
    } = opts;

    if (!serviceName) throw new Error('createApp: serviceName is required');
    if (!port) throw new Error('createApp: port is required');
    if (typeof registerRoutes !== 'function') {
        throw new Error('createApp: registerRoutes must be a function');
    }

    requireEnv(requiredEnv, { serviceName });

    const app = express();

    // Request ID — propagate X-Request-ID from upstream (gateway) or generate one.
    app.use((req, res, next) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length > 0 && incoming.length < 128
            ? incoming
            : crypto.randomUUID();
        req.requestId = id;
        res.setHeader('X-Request-ID', id);
        next();
    });

    app.use(cors());
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    app.use(requestLogger(serviceName));

    app.get('/health', (req, res) => {
        res.json({ service: serviceName, status: 'healthy', timestamp: new Date() });
    });

    if (typeof beforeRoutes === 'function') beforeRoutes(app);

    registerRoutes(app);

    app.use((req, res) => {
        res.status(404).json({
            error: {
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.path} not found.`,
                requestId: req.requestId,
            },
        });
    });

    app.use(errorHandler);

    return app;
}

/**
 * Start an app with graceful shutdown. Returns the HTTP server.
 */
function startApp(app, { serviceName, port }) {
    const server = app.listen(port, () => {
        logger.info({
            event: 'service_started',
            service: serviceName,
            port: Number(port),
            message: `${serviceName} running on http://localhost:${port}`,
        });
    });

    const shutdown = (signal) => {
        logger.info({ event: 'service_stopping', service: serviceName, signal });
        server.close(() => {
            logger.info({ event: 'service_stopped', service: serviceName });
            process.exit(0);
        });
        // Hard-exit if graceful close hangs
        setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
        logger.error({ event: 'unhandled_rejection', service: serviceName, reason: String(reason) });
    });
    process.on('uncaughtException', (err) => {
        logger.error({ event: 'uncaught_exception', service: serviceName, error: err.message, stack: err.stack });
    });

    return server;
}

module.exports = { createApp, startApp };
