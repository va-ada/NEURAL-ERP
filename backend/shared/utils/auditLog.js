const prisma = require('./prisma');
const { logger } = require('./logger');

/**
 * Fire-and-forget audit log entry. Failure NEVER propagates to the caller —
 * an audit failure must not break the main operation, but is logged so it
 * can be reconciled later.
 *
 * @param {string|null} userId - Acting user (null for system actions)
 * @param {string} action      - e.g. 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED'
 * @param {string} entity      - Entity name (e.g. 'User', 'Student', 'Attendance')
 * @param {string|null} entityId
 * @param {object|string|null} details - Additional context (object is JSON-stringified)
 */
async function auditLog(userId, action, entity, entityId = null, details = null) {
    try {
        if (!userId) return; // schema requires userId; skip for anonymous events
        const payload = {
            userId,
            action,
            entity,
            entityId,
            details: details == null
                ? null
                : (typeof details === 'string' ? details : safeStringify(details)),
        };
        await prisma.auditLog.create({ data: payload });
    } catch (err) {
        logger.warn({
            event: 'audit_log_failed',
            userId,
            action,
            entity,
            entityId,
            reason: err.message,
        });
    }
}

function safeStringify(obj) {
    try {
        return JSON.stringify(obj, (_k, v) =>
            typeof v === 'bigint' ? v.toString() : v
        );
    } catch {
        return String(obj);
    }
}

module.exports = auditLog;
