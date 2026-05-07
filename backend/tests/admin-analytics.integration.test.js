const path = require('path');

const PRISMA_PATH = path.resolve(__dirname, '../shared/utils/prisma.js');
const AUTH_PATH = path.resolve(__dirname, '../shared/middleware/auth.middleware.js');

const mockPrisma = {
    department: { findMany: jest.fn() },
    attendance: { findMany: jest.fn() },
    grade: { findMany: jest.fn() },
    semesterResult: { findMany: jest.fn() },
    careerApplication: { findMany: jest.fn() },
    student: { findMany: jest.fn() },
};

jest.doMock(PRISMA_PATH, () => mockPrisma);
jest.doMock(AUTH_PATH, () => ({
    authenticate: (req, _res, next) => {
        req.user = { id: 'test-user', role: 'ADMIN', institutionId: 'inst1' };
        next();
    },
    authorize: () => (_req, _res, next) => next(),
    sameInstitution: (_req, _res, next) => next(),
    JWT_ISSUER: 'neural-erp',
    JWT_AUDIENCE: 'neural-erp-client',
}));

const express = require('express');
const request = require('supertest');
const analyticsRoutes = require('../services/admin-service/src/routes/analytics.routes');
const { errorHandler } = require('../shared/middleware/errorHandler');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.requestId = 'test-req'; next(); });
    app.use('/api/admin/analytics', analyticsRoutes);
    app.use(errorHandler);
    return app;
}

describe('admin analytics integration', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('GET /attendance returns trends keyed by department code', async () => {
        mockPrisma.department.findMany.mockResolvedValueOnce([
            { id: 'd1', name: 'Computer Science', code: 'CSE' },
        ]);
        mockPrisma.attendance.findMany.mockResolvedValueOnce([
            { date: new Date('2026-03-15'), status: 'PRESENT', student: { departmentId: 'd1' } },
            { date: new Date('2026-03-20'), status: 'ABSENT', student: { departmentId: 'd1' } },
        ]);

        const res = await request(buildApp()).get('/api/admin/analytics/attendance');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('trends');
        expect(res.body.trends).toHaveProperty('CSE');
        expect(Array.isArray(res.body.trends.CSE)).toBe(true);
        expect(res.body.trends.CSE[0]).toMatchObject({
            month: expect.any(String),
            percentage: expect.any(Number),
            present: 1,
            total: 2,
        });
    });

    it('GET /performance returns gradeDistribution + avgCgpa', async () => {
        mockPrisma.department.findMany.mockResolvedValueOnce([
            { id: 'd1', name: 'Computer Science', code: 'CSE' },
        ]);
        mockPrisma.grade.findMany.mockResolvedValueOnce([
            { grade: 'A+', student: { departmentId: 'd1' } },
            { grade: 'B', student: { departmentId: 'd1' } },
        ]);
        mockPrisma.semesterResult.findMany.mockResolvedValueOnce([
            { studentId: 's1', semester: 4, cgpa: 8.5, student: { departmentId: 'd1' } },
        ]);

        const res = await request(buildApp()).get('/api/admin/analytics/performance');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('gradeDistribution');
        expect(res.body.gradeDistribution.CSE).toMatchObject({ 'A+': 1, B: 1 });
        expect(res.body.avgCgpa).toEqual({ CSE: 8.5 });
    });

    it('GET /placements returns funnel + companyWise', async () => {
        mockPrisma.careerApplication.findMany.mockResolvedValueOnce([
            { status: 'Accepted', opportunity: { company: 'Acme' } },
            { status: 'Under Review', opportunity: { company: 'Acme' } },
        ]);

        const res = await request(buildApp()).get('/api/admin/analytics/placements');
        expect(res.status).toBe(200);
        expect(res.body.funnel).toMatchObject({
            applied: 2, interviewScheduled: 1, offerReceived: 1, accepted: 1,
        });
        expect(res.body.companyWise).toHaveProperty('Acme');
        expect(res.body.companyWise.Acme).toMatchObject({ applied: 2, accepted: 1 });
    });

    it('GET /departments returns comparison rows', async () => {
        mockPrisma.department.findMany.mockResolvedValueOnce([
            { id: 'd1', name: 'Computer Science', code: 'CSE' },
        ]);
        mockPrisma.student.findMany.mockResolvedValueOnce([
            {
                id: 's1', departmentId: 'd1',
                attendances: [{ status: 'PRESENT' }, { status: 'ABSENT' }],
                semesterResults: [{ cgpa: 8.0 }],
                careerApplications: [{ status: 'Accepted' }],
            },
        ]);

        const res = await request(buildApp()).get('/api/admin/analytics/departments');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.comparison)).toBe(true);
        expect(res.body.comparison[0]).toMatchObject({
            department: 'CSE',
            studentCount: 1,
            avgCgpa: 8.0,
            avgAttendance: 50,
            placementRate: 100,
        });
    });
});
