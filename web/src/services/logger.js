// ────────────────────────────────────────────────────────
//  Lightweight client-side logger
// ────────────────────────────────────────────────────────
//  Replaces ad-hoc console.error scattered across components.
//  In development: prints to console with a tag.
//  In production: sends a sanitized payload to the backend (best-effort).
//
//  Use via:
//    import { logError } from '@/services/logger'
//    logError(err, { where: 'TimetableBuilder#conflict' })
// ────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function serialize(err) {
    if (!err) return { message: 'Unknown error' }
    if (err instanceof Error) {
        return {
            message: err.message,
            name: err.name,
            code: err.code || null,
            status: err.status || null,
            requestId: err.requestId || null,
        }
    }
    if (typeof err === 'string') return { message: err }
    try { return { message: JSON.stringify(err) } }
    catch { return { message: String(err) } }
}

export function logError(err, context = {}) {
    const payload = {
        level: 'error',
        source: 'web',
        timestamp: new Date().toISOString(),
        context,
        error: serialize(err),
    }

    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[client:error]', payload)
        return
    }

    // Best-effort report in production. Never block UI or throw.
    try {
        fetch(`${API_BASE}/api/errors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(() => {})
    } catch {
        // ignore
    }
}

export function logWarn(message, context = {}) {
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[client:warn]', message, context)
    }
}
