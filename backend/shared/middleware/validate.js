const { validationResult } = require('express-validator');

/**
 * Handle express-validator results. Produces the unified error envelope:
 *
 *   {
 *     error: {
 *       code: 'VALIDATION_ERROR',
 *       message: 'Request validation failed.',
 *       requestId: '...',
 *       details: { fields: [{ field, message, value? }, ...] }
 *     }
 *   }
 */
const validateRequest = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const fields = result.array({ onlyFirstError: true }).map((e) => {
        const field = e.path || e.param || 'unknown';
        const entry = { field, message: e.msg };
        // Only echo the value back if it is a primitive; never leak raw bodies.
        if (e.value !== undefined && (typeof e.value === 'string' || typeof e.value === 'number' || typeof e.value === 'boolean')) {
            entry.value = e.value;
        }
        return entry;
    });

    res.status(422).json({
        error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            requestId: req.requestId,
            details: { fields },
        },
    });
};

module.exports = { validateRequest };
