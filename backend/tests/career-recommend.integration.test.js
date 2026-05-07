const path = require('path');

const PRISMA_PATH = path.resolve(__dirname, '../shared/utils/prisma.js');
const AUTH_PATH = path.resolve(__dirname, '../shared/middleware/auth.middleware.js');
const AUDIT_PATH = path.resolve(__dirname, '../shared/utils/auditLog.js');
const CACHE_PATH = path.resolve(__dirname, '../shared/utils/cache.js');

const mockPrisma = {
    student: { findUnique: jest.fn() },
    careerOpportunity: { findMany: jest.fn() },
};

jest.doMock(PRISMA_PATH, () => mockPrisma);
jest.doMock(AUDIT_PATH, () => jest.fn().mockResolvedValue(undefined));
jest.doMock(CACHE_PATH, () => ({
    cacheGet: jest.fn(async (_k, fn) => fn()),
    cacheInvalidate: jest.fn().mockResolvedValue(0),
}));
jest.doMock(AUTH_PATH, () => ({
    authenticate: (req, _res, next) => {
        req.user = { id: 'test-user', role: 'STUDENT', institutionId: 'inst1' };
        next();
    },
    authorize: () => (_req, _res, next) => next(),
    sameInstitution: (_req, _res, next) => next(),
    JWT_ISSUER: 'neural-erp',
    JWT_AUDIENCE: 'neural-erp-client',
}));

process.env.CAREER_AI_MODE = 'demo';
delete process.env.GEMINI_API_KEY;

const express = require('express');
const request = require('supertest');
const careerRoutes = require('../services/career-service/src/routes/career.routes');
const { errorHandler } = require('../shared/middleware/errorHandler');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.requestId = 'test-req'; next(); });
    app.use('/api/career', careerRoutes);
    app.use(errorHandler);
    return app;
}

function makeOpportunity(i) {
    return {
        id: `opp-${i}`,
        company: `Company${i}`,
        initial: 'C',
        color: '#6366f1',
        role: 'Software Engineer Intern',
        type: 'Internship',
        location: 'Remote',
        workMode: 'Remote',
        deadline: new Date('2026-06-01'),
        applyLink: `https://example.com/apply/${i}`,
    };
}

describe('career recommendations (demo mode) integration', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('POST /recommendations/:studentId returns rule-based-demo payload', async () => {
        mockPrisma.student.findUnique.mockResolvedValueOnce({
            id: 's1',
            department: { name: 'Computer Science' },
            skills: [{ name: 'javascript', level: 'intermediate' }],
            semesterResults: [{ cgpa: 8.5 }],
            workModePreference: 'Remote',
            rolePreference: 'Software',
        });
        mockPrisma.careerOpportunity.findMany.mockResolvedValueOnce(
            [1, 2, 3, 4, 5].map(makeOpportunity),
        );

        const res = await request(buildApp())
            .post('/api/career/recommendations/s1')
            .send({ existingIds: [] });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            aiSource: 'rule-based-demo',
            disclaimer: 'AI-generated — review before saving.',
            generatedAt: expect.any(String),
            recommendations: expect.any(Array),
        });
        expect(res.body.recommendations.length).toBe(5);
        expect(res.body.recommendations[0]).toMatchObject({
            id: expect.any(String),
            company: expect.any(String),
            role: expect.any(String),
            match: expect.any(Number),
        });
    });

    it('returns 404 when student does not exist', async () => {
        mockPrisma.student.findUnique.mockResolvedValueOnce(null);

        const res = await request(buildApp())
            .post('/api/career/recommendations/missing')
            .send({});

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('STUDENT_NOT_FOUND');
    });
});
