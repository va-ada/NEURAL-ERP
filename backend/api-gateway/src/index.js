const { loadEnv, requireEnv } = require('../../shared/utils/env');

loadEnv();
requireEnv(['JWT_SECRET'], { serviceName: 'api-gateway' });

const crypto = require('crypto');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const morgan = require('morgan');
const { errorAlertMiddleware } = require('../../shared/utils/errorAlert');
const { logger } = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    academic: process.env.ACADEMIC_SERVICE_URL || 'http://localhost:3002',
    attendance: process.env.ATTENDANCE_SERVICE_URL || 'http://localhost:3003',
    timetable: process.env.TIMETABLE_SERVICE_URL || 'http://localhost:3004',
    assignment: process.env.ASSIGNMENT_SERVICE_URL || 'http://localhost:3005',
    grade: process.env.GRADE_SERVICE_URL || 'http://localhost:3006',
    career: process.env.CAREER_SERVICE_URL || 'http://localhost:3007',
    notes: process.env.NOTES_SERVICE_URL || 'http://localhost:3008',
    fee: process.env.FEE_SERVICE_URL || 'http://localhost:3009',
    library: process.env.LIBRARY_SERVICE_URL || 'http://localhost:3010',
    forum: process.env.FORUM_SERVICE_URL || 'http://localhost:3011',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3012',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3013',
    ml: process.env.ML_SERVICE_URL || 'http://localhost:3014',
};

// ─── Request ID middleware ───────────────────────────────
// Stamps a request-id on every incoming request and forwards it to upstream
// services so logs can be correlated end-to-end.
app.use((req, res, next) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 && incoming.length < 128
        ? incoming
        : crypto.randomUUID();
    req.requestId = id;
    req.headers['x-request-id'] = id; // ensure it reaches proxied services
    res.setHeader('X-Request-ID', id);
    next();
});

app.use(errorAlertMiddleware);
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        if (origin === 'https://neuralerp.netlify.app') return callback(null, true);
        if (origin.endsWith('.trycloudflare.com')) return callback(null, true);
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
        callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(morgan('dev'));

// Envelope for rate-limit errors matches the rest of the API
const rateLimitError = (_req, res) => {
    res.status(429).json({
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down.',
            requestId: res.req.requestId,
        },
    });
};

app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    handler: rateLimitError,
    standardHeaders: true,
    legacyHeaders: false,
}));

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    handler: rateLimitError,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.get('/health', (req, res) => {
    res.json({ gateway: 'healthy', timestamp: new Date(), services: Object.keys(SERVICES) });
});

// ─── Client error reporting ──────────────────────────────
// Accepts structured error payloads from web + mobile clients (see each
// app's services/logger.js). Rate-limited to 30/min per IP so a misbehaving
// client cannot flood the log pipeline. Body is capped to 8KB.
const clientErrorLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    handler: rateLimitError,
    standardHeaders: true,
    legacyHeaders: false,
});
app.post('/api/errors', clientErrorLimiter, express.json({ limit: '8kb' }), (req, res) => {
    logger.warn({
        event: 'client_error',
        requestId: req.requestId,
        ip: req.ip,
        payload: req.body,
    });
    res.status(204).end();
});

app.get('/health/services', async (req, res) => {
    const results = {};
    await Promise.all(
        Object.entries(SERVICES).map(async ([name, url]) => {
            try {
                const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
                results[name] = response.ok ? 'healthy' : 'unhealthy';
            } catch {
                results[name] = 'unreachable';
            }
        })
    );
    res.json({ gateway: 'healthy', services: results, timestamp: new Date() });
});

// Per-user rate limiter — uses user id from JWT when present, else IP
const userLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: rateLimitError,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', userLimiter);

const proxy = (target, pathPrefix) => createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter: pathPrefix,
    on: {
        error: (err, req, res) => {
            logger.warn({ event: 'proxy_error', target, path: req.path, message: err.message, requestId: req.requestId });
            if (!res.headersSent) {
                res.status(503).json({
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'Service temporarily unavailable.',
                        requestId: req.requestId,
                    },
                });
            }
        },
    },
});

// ─── Routes ─────────────────────────────────────────────
app.use(proxy(SERVICES.auth, '/api/auth'));
app.use(proxy(SERVICES.auth, '/api/users'));
app.use(proxy(SERVICES.academic, '/api/students'));
app.use(proxy(SERVICES.academic, '/api/faculty'));
app.use(proxy(SERVICES.academic, '/api/departments'));
app.use(proxy(SERVICES.academic, '/api/subjects'));
app.use(proxy(SERVICES.academic, '/api/batches'));
app.use(proxy(SERVICES.attendance, '/api/attendance'));
app.use(proxy(SERVICES.timetable, '/api/timetable'));
app.use(proxy(SERVICES.assignment, '/api/assignments'));
app.use(proxy(SERVICES.assignment, '/api/submissions'));
app.use(proxy(SERVICES.grade, '/api/grades'));
app.use(proxy(SERVICES.grade, '/api/exams'));
app.use(proxy(SERVICES.career, '/api/career'));
app.use(proxy(SERVICES.notes, '/api/notes'));
app.use(proxy(SERVICES.fee, '/api/fees'));
app.use(proxy(SERVICES.library, '/api/library'));
app.use(proxy(SERVICES.forum, '/api/forum'));
app.use(proxy(SERVICES.notification, '/api/notifications'));
app.use(proxy(SERVICES.notification, '/api/announcements'));
app.use(proxy(SERVICES.admin, '/api/admin'));

// ─── ML predictions ─────────────────────────────────────
// Strips the /api/predictions prefix so /api/predictions/dropout reaches the
// FastAPI route /predict/dropout. The shared X-ML-Admin-Token header (when
// present) is forwarded automatically by http-proxy-middleware.
app.use(createProxyMiddleware({
    target: SERVICES.ml,
    changeOrigin: true,
    pathFilter: '/api/predictions',
    pathRewrite: { '^/api/predictions': '/predict' },
    on: {
        error: (err, req, res) => {
            logger.warn({ event: 'proxy_error', target: SERVICES.ml, path: req.path, message: err.message, requestId: req.requestId });
            if (!res.headersSent) {
                res.status(503).json({
                    error: {
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'ML service temporarily unavailable.',
                        requestId: req.requestId,
                    },
                });
            }
        },
    },
}));

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found.`,
            requestId: req.requestId,
        },
    });
});

const server = app.listen(PORT, () => {
    logger.info({ event: 'gateway_started', port: Number(PORT), message: `API Gateway running on http://localhost:${PORT}` });
});

const shutdown = (signal) => {
    logger.info({ event: 'gateway_stopping', signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
