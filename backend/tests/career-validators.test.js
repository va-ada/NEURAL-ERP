const express = require('express');
const request = require('supertest');
const { validateRequest } = require('../shared/middleware/validate');

const {
    createOpportunityValidator,
    updateOpportunityValidator,
} = require('../services/career-service/src/validators/opportunity.validators');
const {
    applyValidator,
    updateStatusValidator,
} = require('../services/career-service/src/validators/application.validators');
const {
    createEventValidator,
    updateEventValidator,
} = require('../services/career-service/src/validators/event.validators');
const {
    addSkillValidator,
    updateSkillValidator,
} = require('../services/career-service/src/validators/skill.validators');

function appFor(validators) {
    const app = express();
    app.use(express.json());
    app.post('/x', validators, validateRequest, (req, res) => res.json({ data: req.body }));
    return app;
}

function expectValidationError(res) {
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
}

describe('career-service validators', () => {
    describe('opportunity.validators', () => {
        it('rejects empty company and bad type on create', async () => {
            const app = appFor(createOpportunityValidator);
            const res = await request(app).post('/x').send({
                company: '',
                role: 'SWE',
                location: 'Remote',
                type: 'BAD_TYPE',
                deadline: 'not-a-date',
            });
            expectValidationError(res);
        });

        it('rejects bad ISO date on update', async () => {
            const app = appFor(updateOpportunityValidator);
            const res = await request(app).post('/x').send({ deadline: 'nope' });
            expectValidationError(res);
        });
    });

    describe('application.validators', () => {
        it('rejects non-uuid studentId on apply', async () => {
            const app = appFor(applyValidator);
            const res = await request(app).post('/x').send({
                studentId: 'not-a-uuid',
                opportunityId: 'also-bad',
            });
            expectValidationError(res);
        });

        it('rejects unknown status on update', async () => {
            const app = appFor(updateStatusValidator);
            const res = await request(app).post('/x').send({ status: 'UNKNOWN' });
            expectValidationError(res);
        });
    });

    describe('event.validators', () => {
        it('rejects empty name and bad date on create', async () => {
            const app = appFor(createEventValidator);
            const res = await request(app).post('/x').send({
                name: '',
                date: 'bad-date',
                time: '10:00',
                venue: 'Hall A',
            });
            expectValidationError(res);
        });

        it('rejects bad ISO startDate on update', async () => {
            const app = appFor(updateEventValidator);
            const res = await request(app).post('/x').send({ startDate: 'nope' });
            expectValidationError(res);
        });
    });

    describe('skill.validators', () => {
        it('rejects non-array skills on add', async () => {
            const app = appFor(addSkillValidator);
            const res = await request(app).post('/x').send({ skills: 'not-an-array' });
            expectValidationError(res);
        });

        it('rejects bad proficiency on update', async () => {
            const app = appFor(updateSkillValidator);
            const res = await request(app).post('/x').send({
                skills: [{ name: 'JS', percentage: 50, level: 'intermediate', proficiency: 'WIZARD' }],
            });
            expectValidationError(res);
        });
    });
});
