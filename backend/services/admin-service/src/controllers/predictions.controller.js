const prisma = require('../../../../shared/utils/prisma');
const { cacheGet } = require('../../../../shared/utils/cache');
const { logger } = require('../../../../shared/utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:3014';
const ML_ADMIN_TOKEN = process.env.ML_ADMIN_TOKEN || 'change-me-shared-secret';
const CACHE_TTL_SECONDS = 600;
const TOP_N_PER_DEPARTMENT = 30;

// ─── Internal: fetch a batch of predictions from the ML service ───
// We surface the disclosure verbatim because the web client keys off it.
async function callBatch(studentIds) {
    if (!studentIds.length) {
        return { count: 0, predictions: [], disclaimer: 'AI-generated — review before saving.' };
    }
    const response = await fetch(`${ML_SERVICE_URL}/predict/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-ML-Admin-Token': ML_ADMIN_TOKEN,
        },
        body: JSON.stringify({ student_ids: studentIds }),
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`ml-service /predict/batch failed: ${response.status} ${text.slice(0, 200)}`);
    }
    return response.json();
}

// ─── Pick top-N students per department for batch scoring ───
async function pickStudentBatch() {
    const students = await prisma.student.findMany({
        select: {
            id: true,
            departmentId: true,
            user: { select: { name: true } },
            department: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Group + cap per department so we don't blow past the ML batch limit.
    const byDept = new Map();
    for (const s of students) {
        const arr = byDept.get(s.departmentId) || [];
        if (arr.length < TOP_N_PER_DEPARTMENT) arr.push(s);
        byDept.set(s.departmentId, arr);
    }
    return Array.from(byDept.values()).flat();
}

// ─── GET /api/admin/predictions/dropout-risk ───────────────────────────
// Returns the top-10 students sorted by dropout score, with the AI disclosure.
const getDropoutRisk = async (req, res, next) => {
    try {
        const data = await cacheGet('admin:predictions:dropout', async () => {
            const students = await pickStudentBatch();
            const ids = students.map((s) => s.id);
            const studentMeta = Object.fromEntries(students.map((s) => [s.id, s]));

            let batchRes;
            try {
                batchRes = await callBatch(ids);
            } catch (err) {
                logger.warn({ event: 'ml_batch_failed', message: err.message });
                return {
                    risky: [],
                    dataMode: 'unavailable',
                    disclaimer: 'AI-generated — review before saving.',
                    error: 'ml-service unreachable',
                };
            }

            const risky = (batchRes.predictions || [])
                .map((p) => {
                    const meta = studentMeta[p.studentId] || {};
                    return {
                        studentId: p.studentId,
                        name: meta.user?.name || null,
                        department: meta.department?.code || null,
                        score: p.dropout?.score ?? 0,
                        confidence: p.dropout?.confidence ?? 0,
                        topFactors: p.dropout?.topFactors || [],
                        modelVersion: p.dropout?.modelVersion || 'dropout_v1',
                        dataMode: p.dataMode,
                    };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            return {
                risky,
                dataMode: batchRes.dataMode,
                disclaimer: batchRes.disclaimer || 'AI-generated — review before saving.',
            };
        }, CACHE_TTL_SECONDS);

        res.json(data);
    } catch (err) { next(err); }
};

// ─── GET /api/admin/predictions/placement-funnel ───────────────────────
// Buckets students into high/medium/low placement probability.
const getPlacementFunnel = async (req, res, next) => {
    try {
        const data = await cacheGet('admin:predictions:placement-funnel', async () => {
            const students = await pickStudentBatch();
            const ids = students.map((s) => s.id);

            let batchRes;
            try {
                batchRes = await callBatch(ids);
            } catch (err) {
                logger.warn({ event: 'ml_batch_failed', message: err.message });
                return {
                    funnel: { predicted_high: 0, predicted_medium: 0, predicted_low: 0 },
                    dataMode: 'unavailable',
                    disclaimer: 'AI-generated — review before saving.',
                    error: 'ml-service unreachable',
                };
            }

            const funnel = { predicted_high: 0, predicted_medium: 0, predicted_low: 0 };
            for (const p of batchRes.predictions || []) {
                const score = p.placement?.score ?? 0;
                if (score >= 75) funnel.predicted_high += 1;
                else if (score >= 45) funnel.predicted_medium += 1;
                else funnel.predicted_low += 1;
            }

            return {
                funnel,
                total: (batchRes.predictions || []).length,
                dataMode: batchRes.dataMode,
                disclaimer: batchRes.disclaimer || 'AI-generated — review before saving.',
            };
        }, CACHE_TTL_SECONDS);

        res.json(data);
    } catch (err) { next(err); }
};

module.exports = { getDropoutRisk, getPlacementFunnel };
