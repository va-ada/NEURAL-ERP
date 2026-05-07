const express = require('express');
const request = require('supertest');
const { validateRequest } = require('../shared/middleware/validate');

const {
    createNotificationValidator,
} = require('../services/notification-service/src/validators/notification.validators');
const {
    createAnnouncementValidator: createNotifAnnouncementValidator,
    updateAnnouncementValidator,
} = require('../services/notification-service/src/validators/announcement.validators');
const {
    createSlotValidator,
    updateSlotValidator,
    bulkUpdateValidator,
    checkConflictsValidator,
} = require('../services/timetable-service/src/validators/timetable.validators');
const {
    updateSettingsValidator,
} = require('../services/admin-service/src/validators/settings.validators');
const {
    createAnnouncementValidator: createAdminAnnouncementValidator,
} = require('../services/admin-service/src/validators/announcement.validators');

function appFor(validators, method = 'post') {
    const app = express();
    app.use(express.json());
    app[method]('/x', validators, validateRequest, (req, res) => res.json({ ok: true }));
    return app;
}

function expectValidationError(res) {
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details.fields)).toBe(true);
}

describe('notification + timetable + admin validators', () => {
    // ── notification ──────────────────────────────
    it('createNotificationValidator rejects missing userId + empty text', async () => {
        const app = appFor(createNotificationValidator);
        const res = await request(app).post('/x').send({ text: '   ' });
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field).sort();
        expect(fields).toEqual(expect.arrayContaining(['text', 'userId']));
    });

    it('createNotificationValidator rejects invalid type enum', async () => {
        const app = appFor(createNotificationValidator);
        const res = await request(app).post('/x').send({
            userId: '11111111-1111-1111-1111-111111111111',
            text: 'hello',
            type: 'CRITICAL',
        });
        expectValidationError(res);
        expect(res.body.error.details.fields.map((f) => f.field)).toContain('type');
    });

    // ── notification-service announcements ────────
    it('notification createAnnouncementValidator rejects empty title/content + bad priority', async () => {
        const app = appFor(createNotifAnnouncementValidator);
        const res = await request(app).post('/x').send({ title: '', content: '', priority: 'BLOCKER' });
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field);
        expect(fields).toEqual(expect.arrayContaining(['title', 'content', 'priority']));
    });

    it('updateAnnouncementValidator rejects bad ISO expiresAt', async () => {
        const app = appFor(updateAnnouncementValidator);
        const res = await request(app).post('/x').send({ expiresAt: 'not-a-date' });
        expectValidationError(res);
        expect(res.body.error.details.fields.map((f) => f.field)).toContain('expiresAt');
    });

    // ── timetable ─────────────────────────────────
    it('createSlotValidator rejects bad UUIDs, day, and time format', async () => {
        const app = appFor(createSlotValidator);
        const res = await request(app).post('/x').send({
            batchId: 'not-uuid',
            subjectId: 'nope',
            facultyId: 'nope',
            day: 'FUNDAY',
            startTime: '25:99',
            endTime: 'late',
        });
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field);
        expect(fields).toEqual(expect.arrayContaining(['batchId', 'day', 'startTime']));
    });

    it('updateSlotValidator rejects invalid slot type', async () => {
        const app = appFor(updateSlotValidator);
        const res = await request(app).post('/x').send({ type: 'PARTY' });
        expectValidationError(res);
        expect(res.body.error.details.fields.map((f) => f.field)).toContain('type');
    });

    it('bulkUpdateValidator rejects empty slots array', async () => {
        const app = appFor(bulkUpdateValidator);
        const res = await request(app).post('/x').send({ slots: [] });
        expectValidationError(res);
        expect(res.body.error.details.fields.map((f) => f.field)).toContain('slots');
    });

    it('checkConflictsValidator rejects bad nested slot fields', async () => {
        const app = appFor(checkConflictsValidator);
        const res = await request(app).post('/x').send({
            batchId: '11111111-1111-1111-1111-111111111111',
            slots: [{ facultyId: 'nope', day: 'BADDAY', startTime: '99:99' }],
        });
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field);
        expect(fields.some((f) => f.startsWith('slots[0]') || f.startsWith('slots.0'))).toBe(true);
    });

    // ── admin settings ────────────────────────────
    it('updateSettingsValidator rejects invalid email', async () => {
        const app = appFor(updateSettingsValidator, 'put');
        const res = await request(app).put('/x').send({ email: 'nope@', name: '   ' });
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field);
        expect(fields).toEqual(expect.arrayContaining(['email', 'name']));
    });

    it('updateSettingsValidator rejects oversized institution name', async () => {
        const app = appFor(updateSettingsValidator, 'put');
        const res = await request(app).put('/x').send({ name: 'a'.repeat(201) });
        expectValidationError(res);
        expect(res.body.error.details.fields.map((f) => f.field)).toContain('name');
    });

    // ── admin announcement ────────────────────────
    it('admin createAnnouncementValidator rejects missing fields', async () => {
        const app = appFor(createAdminAnnouncementValidator);
        const res = await request(app).post('/x').send({});
        expectValidationError(res);
        const fields = res.body.error.details.fields.map((f) => f.field);
        expect(fields).toEqual(expect.arrayContaining(['title', 'content']));
    });
});
