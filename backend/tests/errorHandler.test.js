const { errorHandler, AppError, classifyError } = require('../shared/middleware/errorHandler');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('shared/middleware/errorHandler', () => {
    describe('classifyError', () => {
        it('classifies AppError with explicit code', () => {
            const err = new AppError('nope', 404, 'NOT_FOUND');
            expect(classifyError(err)).toMatchObject({
                statusCode: 404, code: 'NOT_FOUND', message: 'nope',
            });
        });

        it('maps Prisma P2002 to 409 CONFLICT', () => {
            expect(classifyError({ code: 'P2002', meta: { target: ['email'] } }))
                .toMatchObject({ statusCode: 409, code: 'CONFLICT' });
        });

        it('maps Prisma P2025 to 404 NOT_FOUND', () => {
            expect(classifyError({ code: 'P2025' }))
                .toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
        });

        it('maps TokenExpiredError to 401 TOKEN_EXPIRED', () => {
            const err = new Error('expired');
            err.name = 'TokenExpiredError';
            expect(classifyError(err))
                .toMatchObject({ statusCode: 401, code: 'TOKEN_EXPIRED' });
        });

        it('defaults unknown errors to 500 SERVER_ERROR', () => {
            expect(classifyError(new Error('boom')))
                .toMatchObject({ statusCode: 500, code: 'SERVER_ERROR' });
        });
    });

    describe('errorHandler response shape', () => {
        it('returns { error: { code, message, requestId } }', () => {
            const req = { requestId: 'req-123', path: '/x', method: 'GET' };
            const res = makeRes();
            errorHandler(new AppError('bad', 400, 'BAD_REQUEST'), req, res, () => {});

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: { code: 'BAD_REQUEST', message: 'bad', requestId: 'req-123' },
            });
        });

        it('hides 5xx details in production', () => {
            const prev = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            try {
                const req = { requestId: 'r', path: '/', method: 'GET' };
                const res = makeRes();
                errorHandler(new Error('leaked internals'), req, res, () => {});
                expect(res.status).toHaveBeenCalledWith(500);
                const body = res.json.mock.calls[0][0];
                expect(body.error.message).toBe('Something went wrong.');
            } finally {
                process.env.NODE_ENV = prev;
            }
        });

        it('attaches details when the AppError provides them', () => {
            const req = { requestId: 'r', path: '/', method: 'GET' };
            const res = makeRes();
            const err = new AppError('nope', 422, 'VALIDATION_ERROR', { fields: ['email'] });
            errorHandler(err, req, res, () => {});
            const body = res.json.mock.calls[0][0];
            expect(body.error.details).toEqual({ fields: ['email'] });
        });
    });
});
