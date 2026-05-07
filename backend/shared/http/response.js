/**
 * Unified HTTP response helpers.
 *
 * Success shape:
 *   { data: <payload>, meta?: <object> }
 *
 * Paginated shape:
 *   { data: <items>, meta: { page, pageSize, total, totalPages } }
 *
 * Error shape (produced by errorHandler middleware, not here):
 *   { error: { code, message, requestId, details? } }
 *
 * Keeping the envelopes consistent lets clients handle every endpoint the
 * same way without per-service special cases.
 */

function ok(res, data, meta, status = 200) {
    const body = { data };
    if (meta !== undefined) body.meta = meta;
    return res.status(status).json(body);
}

function created(res, data, meta) {
    return ok(res, data, meta, 201);
}

function noContent(res) {
    return res.status(204).end();
}

/**
 * Paginate an already-fetched slice of results.
 * Caller is responsible for issuing the actual count + findMany queries.
 */
function paginated(res, items, { page, pageSize, total }) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Number(pageSize) || items.length || 20);
    const t = Math.max(0, Number(total) || 0);
    return ok(res, items, {
        page: p,
        pageSize: ps,
        total: t,
        totalPages: ps > 0 ? Math.ceil(t / ps) : 0,
    });
}

module.exports = { ok, created, noContent, paginated };
