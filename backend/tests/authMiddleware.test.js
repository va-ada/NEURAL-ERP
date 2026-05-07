const jwt = require('jsonwebtoken');
const { authenticate, authorize, JWT_ISSUER, JWT_AUDIENCE } = require('../shared/middleware/auth.middleware');

const SECRET = 'test-secret-' + 'a'.repeat(32);

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function signToken(payload) {
    return jwt.sign(payload, SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
}

describe('shared/middleware/auth.middleware :: authenticate', () => {
    const original = process.env.JWT_SECRET;
    beforeAll(() => { process.env.JWT_SECRET = SECRET; });
    afterAll(() => { process.env.JWT_SECRET = original; });

    it('rejects when Authorization header missing', () => {
        const req = { headers: {}, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(res.json.mock.calls[0][0].error.code).toBe('NO_TOKEN');
    });

    it('rejects when header is Bearer but token missing', () => {
        const req = { headers: { authorization: 'Bearer   ' }, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects malformed token with INVALID_TOKEN', () => {
        const req = { headers: { authorization: 'Bearer not-a-jwt' }, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_TOKEN');
    });

    it('accepts valid token and sets req.user', () => {
        const token = signToken({ sub: 'u1', role: 'STUDENT', institutionId: 'i1' });
        const req = { headers: { authorization: `Bearer ${token}` }, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ id: 'u1', role: 'STUDENT', institutionId: 'i1' });
    });

    it('rejects expired token with TOKEN_EXPIRED code', () => {
        const token = jwt.sign({ sub: 'u1' }, SECRET, {
            issuer: JWT_ISSUER, audience: JWT_AUDIENCE, expiresIn: '-1s',
        });
        const req = { headers: { authorization: `Bearer ${token}` }, requestId: 'r' };
        const res = mockRes();
        authenticate(req, res, jest.fn());
        expect(res.json.mock.calls[0][0].error.code).toBe('TOKEN_EXPIRED');
    });

    it('rejects tokens from a different issuer', () => {
        const token = jwt.sign({ sub: 'u1' }, SECRET, { issuer: 'other', audience: JWT_AUDIENCE });
        const req = { headers: { authorization: `Bearer ${token}` }, requestId: 'r' };
        const res = mockRes();
        authenticate(req, res, jest.fn());
        expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_TOKEN');
    });
});

describe('shared/middleware/auth.middleware :: authorize', () => {
    it('allows when role matches (case-insensitive)', () => {
        const req = { user: { role: 'admin' }, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authorize('ADMIN', 'FACULTY')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('rejects when role does not match', () => {
        const req = { user: { role: 'STUDENT' }, requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authorize('ADMIN')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects when req.user is missing (no crash)', () => {
        const req = { requestId: 'r' };
        const res = mockRes();
        const next = jest.fn();
        authorize('ADMIN')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
