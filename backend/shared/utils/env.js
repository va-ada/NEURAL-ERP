const path = require('path');
const fs = require('fs');

let loaded = false;

/**
 * Load environment variables from backend/.env plus backend/.env.local
 * (local overrides win). Idempotent — safe to call from every service.
 *
 * Must be called before any `process.env.*` access at module scope.
 */
function loadEnv() {
    if (loaded) return;
    const dotenv = require('dotenv');
    const root = path.resolve(__dirname, '../../');
    const shared = path.join(root, '.env');
    const local = path.join(root, '.env.local');

    if (fs.existsSync(shared)) dotenv.config({ path: shared });
    if (fs.existsSync(local)) dotenv.config({ path: local, override: true });

    loaded = true;
}

/**
 * Throw at boot if any required env var is missing, empty, or obviously
 * still a placeholder. Prevents a service from silently running on
 * `your-super-secret-jwt-key-change-in-production`.
 *
 * @param {string[]} required - names of required vars
 * @param {{ serviceName?: string }} [opts]
 */
function requireEnv(required, opts = {}) {
    const missing = [];
    const placeholders = [];
    const placeholderPatterns = [
        /^your-/i,
        /^change-?me/i,
        /change-in-production/i,
        /^generate-a-/i,
        /CHANGE_ME/,
    ];

    for (const name of required) {
        const value = process.env[name];
        if (value === undefined || value === '') {
            missing.push(name);
            continue;
        }
        if (placeholderPatterns.some((r) => r.test(value))) {
            placeholders.push(name);
        }
    }

    if (missing.length === 0 && placeholders.length === 0) return;

    const label = opts.serviceName ? `[${opts.serviceName}] ` : '';
    const parts = [`${label}Environment validation failed.`];
    if (missing.length) parts.push(`  Missing: ${missing.join(', ')}`);
    if (placeholders.length) {
        parts.push(`  Placeholder values (rotate before running): ${placeholders.join(', ')}`);
    }
    parts.push(`  Copy backend/.env.example → backend/.env and fill real values.`);
    throw new Error(parts.join('\n'));
}

module.exports = { loadEnv, requireEnv };
