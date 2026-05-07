const { logger } = require('../utils/logger');

class AppError extends Error {
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

/**
 * Map framework/library error → { statusCode, code, message, details }.
 * Centralises the classification so new error sources plug in cleanly.
 */
function classifyError(err) {
    if (err instanceof AppError) {
        return {
            statusCode: err.statusCode,
            code: err.code || statusToCode(err.statusCode),
            message: err.message,
            details: err.details,
        };
    }

    // Prisma known request errors
    if (err.code === 'P2002') {
        return { statusCode: 409, code: 'CONFLICT', message: 'Record already exists.', details: { target: err.meta?.target } };
    }
    if (err.code === 'P2025') {
        return { statusCode: 404, code: 'NOT_FOUND', message: 'Record not found.' };
    }
    if (err.code === 'P2003') {
        return { statusCode: 400, code: 'INVALID_REFERENCE', message: 'Related record does not exist.' };
    }

    // Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
        return { statusCode: 400, code: 'FILE_TOO_LARGE', message: 'File too large. Max 50MB.' };
    }

    // JWT
    if (err.name === 'TokenExpiredError') {
        return { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Token expired.' };
    }
    if (err.name === 'JsonWebTokenError') {
        return { statusCode: 401, code: 'INVALID_TOKEN', message: 'Invalid token.' };
    }

    // Fallback
    return {
        statusCode: err.statusCode || 500,
        code: err.code || statusToCode(err.statusCode || 500),
        message: err.message || 'Internal server error.',
    };
}

function statusToCode(status) {
    switch (status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 409: return 'CONFLICT';
        case 422: return 'VALIDATION_ERROR';
        case 429: return 'RATE_LIMITED';
        default:  return status >= 500 ? 'SERVER_ERROR' : 'ERROR';
    }
}

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    const { statusCode, code, message, details } = classifyError(err);

    const logPayload = {
        requestId: req.requestId,
        code,
        statusCode,
        message: err.message,
        path: req.path,
        method: req.method,
    };
    if (statusCode >= 500) {
        logPayload.stack = err.stack;
        logger.error(logPayload);
    } else {
        logger.warn(logPayload);
    }

    const safeMessage = statusCode >= 500 && process.env.NODE_ENV === 'production'
        ? 'Something went wrong.'
        : message;

    const body = {
        error: {
            code,
            message: safeMessage,
            requestId: req.requestId,
        },
    };
    if (details !== undefined) body.error.details = details;

    res.status(statusCode).json(body);
};

module.exports = { errorHandler, AppError, classifyError };
