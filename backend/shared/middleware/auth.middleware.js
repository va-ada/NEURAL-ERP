const jwt = require('jsonwebtoken');

const JWT_ISSUER = 'neural-erp';
const JWT_AUDIENCE = 'neural-erp-client';

function unauthorized(res, req, message, code = 'UNAUTHORIZED') {
    return res.status(401).json({
        error: { code, message, requestId: req.requestId },
    });
}

function forbidden(res, req, message, code = 'FORBIDDEN') {
    return res.status(403).json({
        error: { code, message, requestId: req.requestId },
    });
}

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        return unauthorized(res, req, 'No token provided.', 'NO_TOKEN');
    }
    const token = authHeader.slice(7).trim();
    if (!token) return unauthorized(res, req, 'No token provided.', 'NO_TOKEN');

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });
        req.user = {
            id: payload.sub,
            role: payload.role,
            institutionId: payload.institutionId,
        };
        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return unauthorized(res, req, 'Token expired.', 'TOKEN_EXPIRED');
        }
        return unauthorized(res, req, 'Invalid token.', 'INVALID_TOKEN');
    }
};

/**
 * authorize('ADMIN', 'FACULTY') — allows any matching role.
 * Role comparison is case-insensitive and tolerates missing req.user.
 */
const authorize = (...allowedRoles) => {
    const allowed = new Set(allowedRoles.map((r) => String(r).toUpperCase()));
    return (req, res, next) => {
        const role = String(req.user?.role || '').toUpperCase();
        if (!role || !allowed.has(role)) {
            return forbidden(
                res,
                req,
                `Access denied. Required role: ${allowedRoles.join(', ')}`,
                'ROLE_REQUIRED',
            );
        }
        return next();
    };
};

/**
 * Enforces that the acting user either is SUPER_ADMIN or belongs to the
 * institution referenced by the request. Non-SUPER_ADMIN users cannot reach
 * data from another institution.
 */
const sameInstitution = (req, res, next) => {
    const id = req.params.institutionId || req.body.institutionId || req.query.institutionId;
    if (!id) return next();
    if (req.user?.role === 'SUPER_ADMIN') return next();
    if (id !== req.user?.institutionId) {
        return forbidden(res, req, 'Cross-institution access denied.', 'WRONG_INSTITUTION');
    }
    return next();
};

module.exports = { authenticate, authorize, sameInstitution, JWT_ISSUER, JWT_AUDIENCE };
