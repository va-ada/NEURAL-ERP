const prisma = require('../../../../shared/utils/prisma');
const { AppError } = require('../../../../shared/middleware/errorHandler');
const { cacheGet, cacheInvalidate } = require('../../../../shared/utils/cache');
const auditLog = require('../../../../shared/utils/auditLog');
const { GoogleGenAI } = require('@google/genai');

const AI_DISCLAIMER = 'AI-generated — review before saving.';

const careerAiMode = () => (process.env.CAREER_AI_MODE || 'demo').toLowerCase();
const hasGeminiKey = () =>
    !!process.env.GEMINI_API_KEY &&
    !process.env.GEMINI_API_KEY.startsWith('your-') &&
    !process.env.GEMINI_API_KEY.includes('placeholder');

// Lazy-init the Gemini client only when a real key is present so the service
// boots cleanly in demo mode without any Gemini configuration.
let _ai = null;
const getAi = () => {
    if (!_ai && hasGeminiKey()) {
        _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return _ai;
};

const getOpportunities = async (req, res, next) => {
    try {
        const { type, location } = req.query;
        const where = {};
        if (type) where.type = type;
        if (location) where.location = { contains: location, mode: 'insensitive' };

        const cacheKey = `career:opportunities:${type || 'all'}:${location || 'all'}`;
        const opportunities = await cacheGet(cacheKey, () =>
            prisma.careerOpportunity.findMany({
                where,
                orderBy: { deadline: 'asc' },
            })
        , 300);
        res.json({ opportunities, total: opportunities.length });
    } catch (err) { next(err); }
};

const createOpportunity = async (req, res, next) => {
    try {
        const { company, initial, color, role, location, type, deadline, matchScore } = req.body;
        const opp = await prisma.careerOpportunity.create({
            data: { company, initial, color, role, location, type, deadline: new Date(deadline), matchScore },
        });
        await cacheInvalidate('career:opportunities:*');
        await auditLog(req.user?.id, 'CREATE', 'CareerOpportunity', opp.id, { company, role, type });
        res.status(201).json({ message: 'Opportunity created.', opportunity: opp });
    } catch (err) { next(err); }
};

const getEvents = async (req, res, next) => {
    try {
        const events = await cacheGet('career:events', () =>
            prisma.careerEvent.findMany({ orderBy: { date: 'asc' } })
        , 300);
        res.json({ events, total: events.length });
    } catch (err) { next(err); }
};

const createEvent = async (req, res, next) => {
    try {
        const { name, date, time, venue } = req.body;
        const event = await prisma.careerEvent.create({ data: { name, date: new Date(date), time, venue } });
        await cacheInvalidate('career:events');
        await auditLog(req.user?.id, 'CREATE', 'CareerEvent', event.id);
        res.status(201).json({ message: 'Event created.', event });
    } catch (err) { next(err); }
};

const getApplications = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const applications = await prisma.careerApplication.findMany({
            where: { studentId },
            include: { opportunity: true },
            orderBy: { appliedAt: 'desc' },
        });
        res.json({ applications, total: applications.length });
    } catch (err) { next(err); }
};

const createApplication = async (req, res, next) => {
    try {
        const { studentId, opportunityId, status, statusClass } = req.body;
        const app = await prisma.careerApplication.create({
            data: { studentId, opportunityId, status: status || 'Under Review', statusClass: statusClass || 'review' },
        });
        await auditLog(req.user?.id, 'CREATE', 'CareerApplication', app.id, { studentId, opportunityId });
        res.status(201).json({ message: 'Application submitted.', application: app });
    } catch (err) { next(err); }
};

const getSkills = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const skills = await prisma.studentSkill.findMany({
            where: { studentId },
            orderBy: { percentage: 'desc' },
        });
        res.json({ skills });
    } catch (err) { next(err); }
};

const updateSkills = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { skills } = req.body;

        const results = await prisma.$transaction(
            skills.map(s =>
                prisma.studentSkill.upsert({
                    where: { studentId_name: { studentId, name: s.name } },
                    update: { percentage: s.percentage, level: s.level },
                    create: { studentId, name: s.name, percentage: s.percentage, level: s.level },
                })
            )
        );
        await auditLog(req.user?.id, 'UPDATE', 'StudentSkill', studentId, { skillCount: skills.length });
        res.json({ message: `Updated ${results.length} skills.`, skills: results });
    } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
    try {
        const { studentId } = req.params;

        const [applications, skills] = await Promise.all([
            prisma.careerApplication.findMany({ where: { studentId }, include: { opportunity: true } }),
            prisma.studentSkill.findMany({ where: { studentId } }),
        ]);

        const interviews = applications.filter(a => a.status === 'Interview Scheduled').length;
        const offers = applications.filter(a => a.status === 'Offer Received').length;

        const avgSkill = skills.length > 0 ? skills.reduce((s, sk) => s + sk.percentage, 0) / skills.length : 0;
        const careerScore = Math.round(avgSkill * 0.5 + offers * 15 + interviews * 5);

        res.json({
            careerScore: Math.min(careerScore, 100),
            applicationsSent: applications.length,
            interviews,
            offers,
            skills,
            applications: applications.map(a => ({
                company: a.opportunity.company,
                role: a.opportunity.role,
                date: a.appliedAt,
                status: a.status,
                statusClass: a.statusClass,
            })),
        });
    } catch (err) { next(err); }
};

// ─── Recommendations ───────────────────────────────────
//
// Two paths:
//   demo (default): rule-based scoring against existing CareerOpportunity rows.
//                   No external API calls. Deterministic. Safe for any reviewer.
//   live:           real Gemini call (requires GEMINI_API_KEY in env).
//                   On failure or missing key, falls back to demo.
//
// Every response is tagged with { aiSource, generatedAt, disclaimer } so the
// frontend can render the mandated "AI-generated — review before saving" badge.

function tokenize(text) {
    if (!text) return new Set();
    return new Set(
        String(text)
            .toLowerCase()
            .split(/[^a-z0-9+#.]+/)
            .filter((t) => t && t.length > 1)
    );
}

function scoreOpportunity(opp, studentTokens, prefs) {
    const oppText = [opp.role, opp.company, opp.type, opp.location].filter(Boolean).join(' ');
    const oppTokens = tokenize(oppText);
    const overlap = [...studentTokens].filter((t) => oppTokens.has(t)).length;
    const denom = Math.max(studentTokens.size, 1);
    let base = Math.round((overlap / denom) * 100);

    // Mild bonus for matching student's stated work-mode / role preferences.
    if (prefs.workMode && oppText.toLowerCase().includes(prefs.workMode.toLowerCase())) base += 8;
    if (prefs.role && oppText.toLowerCase().includes(prefs.role.toLowerCase())) base += 8;

    return Math.min(99, Math.max(35, base));
}

async function buildDemoRecommendations(student, existingIds) {
    const opps = await prisma.careerOpportunity.findMany({
        orderBy: { deadline: 'asc' },
        take: 50,
    });

    const studentTokens = tokenize(
        [
            student.department?.name,
            ...(student.skills || []).map((s) => s.name),
            student.workModePreference,
            student.rolePreference,
        ]
            .filter(Boolean)
            .join(' ')
    );

    const prefs = {
        workMode: student.workModePreference,
        role: student.rolePreference,
    };

    const excludeIds = new Set(existingIds.map(String));

    return opps
        .filter((o) => !excludeIds.has(o.id))
        .map((o) => ({
            id: o.id,
            company: o.company,
            initial: o.initial || (o.company ? o.company[0] : '?'),
            color: o.color || '#6366f1',
            role: o.role,
            roleType: o.type || 'Role',
            location: o.location,
            type: o.type,
            workMode: o.workMode || 'On-site',
            deadline: o.deadline,
            match: scoreOpportunity(o, studentTokens, prefs),
            applyLink: o.applyLink || null,
        }))
        .sort((a, b) => b.match - a.match)
        .slice(0, 10);
}

async function buildGeminiRecommendations(student, existingIds) {
    const ai = getAi();
    if (!ai) throw new Error('Gemini client unavailable');

    const cgpa = student.semesterResults?.length > 0 ? student.semesterResults[0].cgpa : 7.0;
    const skillsList = (student.skills || []).map((s) => `${s.name} (${s.level})`).join(', ');
    const workModePref = student.workModePreference;
    const rolePref = student.rolePreference;

    let modePrompt = '';
    if (workModePref) {
        modePrompt += `\nCRITICAL: The student has indicated a strong preference for '${workModePref}' internships. You MUST ensure at least 70% are '${workModePref}'.`;
    }
    if (rolePref) {
        modePrompt += `\nCRITICAL: The student has indicated a strong preference for '${rolePref}' roles. You MUST ensure at least 70% are '${rolePref}' focused.`;
    }

    let dedupPrompt = '';
    if (existingIds.length > 0) {
        dedupPrompt = `\nDO NOT generate any opportunities matching these [Company - Role] combinations:\n${existingIds.map((id) => `- ${id}`).join('\n')}\nEvery listing must be a NEW, UNIQUE opportunity.`;
    }

    const prompt = `
You are an AI career counselor. Recommend 10 currently-open internships for this student in India.
Profile:
- Department: ${student.department?.name || 'Computer Science'}
- Semester: ${student.semester}
- CGPA: ${cgpa}
- Skills: ${skillsList || 'Basic programming'}
${modePrompt}
${dedupPrompt}

Distribution: 6 government / govt-affiliated (NITI Aayog, DRDO, ISRO, NIC, CDAC, PSUs) + 4 private/MNC/startup.
Verify each opportunity is currently open via Google Search. Skip anything you cannot verify.

Return strict JSON array (no markdown). Each object: { company, initial, color, role, roleType, location, type, workMode, deadline, match, applyLink }.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });

    let jsonString = (response.text || '').trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }
    return JSON.parse(jsonString);
}

const getRecommendations = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { existingIds = [] } = req.body || {};

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                department: true,
                skills: true,
                semesterResults: { orderBy: { semester: 'desc' }, take: 1 },
            },
        });
        if (!student) throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');

        const mode = careerAiMode();
        let recommendations;
        let aiSource;

        if (mode === 'live' && hasGeminiKey()) {
            try {
                recommendations = await buildGeminiRecommendations(student, existingIds);
                aiSource = 'gemini';
            } catch (geminiErr) {
                // Fall back to demo on any Gemini failure (rate limit, parse error, network).
                // The disclosure makes this transparent to the user.
                recommendations = await buildDemoRecommendations(student, existingIds);
                aiSource = 'rule-based-demo-fallback';
            }
        } else {
            recommendations = await buildDemoRecommendations(student, existingIds);
            aiSource = 'rule-based-demo';
        }

        res.json({
            recommendations,
            aiSource,
            generatedAt: new Date().toISOString(),
            disclaimer: AI_DISCLAIMER,
        });
    } catch (err) { next(err); }
};

const updatePreference = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { workModePreference, rolePreference } = req.body;

        const updateData = {};
        if (workModePreference !== undefined) updateData.workModePreference = workModePreference;
        if (rolePreference !== undefined) updateData.rolePreference = rolePreference;

        const student = await prisma.student.update({
            where: { id: studentId },
            data: updateData,
        });

        await auditLog(req.user?.id, 'UPDATE', 'StudentPreferences', studentId);
        res.json({ message: 'Preference updated successfully', student });
    } catch (err) { next(err); }
};

module.exports = {
    getOpportunities,
    createOpportunity,
    getEvents,
    createEvent,
    getApplications,
    createApplication,
    getSkills,
    updateSkills,
    getStats,
    getRecommendations,
    updatePreference,
};
