const express = require('express');
const request = require('supertest');
const { body } = require('express-validator');
const { validateRequest } = require('../shared/middleware/validate');

function appFor(validators) {
    const app = express();
    app.use(express.json());
    app.post('/x', validators, validateRequest, (req, res) => res.json({ data: req.body }));
    return app;
}

describe('shared/middleware/validate', () => {
    it('passes through when valid', async () => {
        const app = appFor([body('email').isEmail()]);
        const res = await request(app).post('/x').send({ email: 'a@b.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('a@b.com');
    });

    it('returns 422 with unified error envelope when invalid', async () => {
        const app = appFor([
            body('email').isEmail().withMessage('Valid email required.'),
            body('password').isLength({ min: 8 }).withMessage('At least 8 chars.'),
        ]);
        const res = await request(app).post('/x').send({ email: 'nope', password: 'x' });
        expect(res.status).toBe(422);
        expect(res.body).toMatchObject({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed.',
                details: { fields: expect.any(Array) },
            },
        });
        const fields = res.body.error.details.fields.map((f) => f.field).sort();
        expect(fields).toEqual(['email', 'password']);
    });

    it('does not echo object values (prevents leaking sensitive bodies)', async () => {
        const app = appFor([body('creds').isString()]);
        const res = await request(app).post('/x').send({ creds: { secret: 'xyz' } });
        expect(res.status).toBe(422);
        const field = res.body.error.details.fields.find((f) => f.field === 'creds');
        expect(field.value).toBeUndefined();
    });
});
