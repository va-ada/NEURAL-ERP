const path = require('path');

process.env.JWT_SECRET = 'test-secret-' + 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET = 'test-refresh-' + 'a'.repeat(32);

const PRISMA_PATH = path.resolve(__dirname, '../shared/utils/prisma.js');
const AUDIT_PATH = path.resolve(__dirname, '../shared/utils/auditLog.js');
const MAILER_PATH = path.resolve(__dirname, '../shared/utils/mailer.js');
const RATELIMIT_PATH = path.resolve(__dirname, '../shared/utils/rateLimiter.js');

const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

jest.doMock(PRISMA_PATH, () => mockPrisma);
jest.doMock(AUDIT_PATH, () => jest.fn().mockResolvedValue(undefined));
jest.doMock(MAILER_PATH, () => ({ sendEmailOTP: jest.fn().mockResolvedValue(undefined) }));
jest.doMock(RATELIMIT_PATH, () => ({
    hit: jest.fn().mockResolvedValue({ limited: false, attempts: 1, resetIn: 900 }),
    reset: jest.fn().mockResolvedValue(undefined),
}));

const bcrypt = require('bcryptjs');
jest.spyOn(bcrypt, 'compare');
jest.spyOn(bcrypt, 'hash').mockImplementation(async (val) => `hashed:${val}`);

const express = require('express');
const request = require('supertest');
const authRoutes = require('../services/auth-service/src/routes/auth.routes');
const { errorHandler } = require('../shared/middleware/errorHandler');

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.requestId = 'test-req'; next(); });
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
    return app;
}

describe('auth flow (login -> verify-otp) integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        bcrypt.hash.mockImplementation(async (val) => `hashed:${val}`);
    });

    it('POST /login returns OTP-sent envelope on valid credentials', async () => {
        mockPrisma.user.findUnique.mockResolvedValueOnce({
            id: 'u1',
            email: 'alice@example.com',
            password: 'hashed-pw',
            isActive: true,
            name: 'Alice',
        });
        bcrypt.compare.mockResolvedValueOnce(true);
        mockPrisma.user.update.mockResolvedValueOnce({});

        const app = buildApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'Secret123' });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            data: { message: expect.any(String), email: 'alice@example.com' },
        });
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'u1' },
                data: expect.objectContaining({ twoFactorCode: expect.any(String) }),
            }),
        );
    });

    it('POST /login returns 401 INVALID_CREDENTIALS when password mismatches', async () => {
        mockPrisma.user.findUnique.mockResolvedValueOnce({
            id: 'u1',
            email: 'alice@example.com',
            password: 'hashed-pw',
            isActive: true,
            name: 'Alice',
        });
        bcrypt.compare.mockResolvedValueOnce(false);

        const app = buildApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alice@example.com', password: 'WrongPass1' });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /verify-otp issues access + refresh tokens on correct OTP', async () => {
        mockPrisma.user.findUnique.mockResolvedValueOnce({
            id: 'u1',
            email: 'alice@example.com',
            name: 'Alice',
            role: 'STUDENT',
            institutionId: 'inst1',
            twoFactorCode: 'hashed-otp',
            twoFactorExpiry: new Date(Date.now() + 60_000),
            student: null,
            faculty: null,
        });
        bcrypt.compare.mockResolvedValueOnce(true);
        mockPrisma.user.update.mockResolvedValueOnce({});

        const app = buildApp();
        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: 'alice@example.com', otp: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({
            message: 'Login successful.',
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            user: expect.objectContaining({ id: 'u1', email: 'alice@example.com' }),
        });
    });
});
